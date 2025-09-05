<svelte:head>
        <!-- IE -->
        <link rel="shortcut icon" type="image/png" href="favicon.png"/>
        <!-- other browsers -->
        <link rel="icon" type="image/png" href="favicon.png"/>
        <title>WebLua</title>
    </svelte:head>
<script>
    import { tick } from "svelte";
    import { initlua, dom, js} from "../lib/lua.js";

    let activeTab = "browser";
    let url = "weblua://aboutme";
    let history = [url];
    let currentIndex = 0;

    let browserContainer;
    let editorContainer = null;
    let previewContainer = null;
    let consoleContainer = null;
    let consoleMessages = [];
    let aceEditor = null;
    let luaEditorInstance = null;

    async function pushUrl(url) {
        const container = browserContainer;
        if (!url || typeof url !== 'string') return alert('Invalid URL');
        const u = url.toString().trim();
        if (!u.startsWith('weblua://')) return alert('Invalid URL');
        if (u.toLowerCase().includes('javascript:')) return alert('Blocked unsafe URL');

        const lua = await initlua(true);
        const parts = u.split('/');
        if (!parts[2].endsWith('.lua')) parts[2] += '.lua';
        const code = await fetch(parts[2]).then((r) => r.text());

        let iframe = container.querySelector('iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = '0';
            iframe.style.overflow = 'auto';
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            container.appendChild(iframe);
        }

        iframe.srcdoc = `<!DOCTYPE html><html><head><style>html, body {margin:0; padding:0; width:100%; height:100%; overflow:auto;}</style></head><body></body></html>`;

        await new Promise((resolve) => {
            iframe.onload = () => {
                const doc = iframe.contentDocument;
                if (window.LuaElement?.setDoc) window.LuaElement.setDoc(doc);
                resolve();
            };
        });

        await lua.doString(code);
    }

    // Navigation helpers for the browser tab
    function navigateToUrl(e) {
        if (!e) return;
        if (e.key === 'Enter') {
            const val = url && typeof url === 'string' ? url.trim() : '';
            if (!val) return;
            // push into history
            // if we're not at the end, drop forward history
            if (currentIndex < history.length - 1) {
                history = history.slice(0, currentIndex + 1);
            }
            history.push(val);
            currentIndex = history.length - 1;
            pushUrl(val);
        }
    }

    function goBack() {
        if (currentIndex > 0) {
            currentIndex -= 1;
            url = history[currentIndex];
            pushUrl(url);
        }
    }

    function goForward() {
        if (currentIndex < history.length - 1) {
            currentIndex += 1;
            url = history[currentIndex];
            pushUrl(url);
        }
    }

    let editorCode = "";

    // Load default editor docs from static file
    (async () => {
        try {
            editorCode = await fetch('/editor_docs.lua').then((r) => r.text());
        } catch (e) {
            // fallback to a small default if fetch fails
            editorCode = "-- WebLua editor\nprint('Welcome to WebLua')";
        }
    })();

    // simplified element names (for newElement completions)
    const simplifiedElementNames = [
        "header1",
        "header2",
        "header3",
        "header4",
        "header5",
        "header6",
        "paragraph",
        "unorderedList",
        "orderedList",
        "listItem",
        "anchor",
        "image",
        "divider",
        "inlineDivider",
        "bold",
        "italic",
        "lineBreak",
        "thematicLineBreak",
        "preformattedText",
        "code",
        "quote",
        "tableRow",
        "tableCell",
        "link",
        "dropDown",
        "frame",
    ];

    // Helper: detect if the cursor is inside newElement("...") or newElement('...')
    function isInsideNewElementString(session, pos) {
        const line = session.getLine(pos.row);
        const upToCursor = line.slice(0, pos.column);
        // match newElement(   '...curpos
        // capture what's typed inside the quotes (possibly empty)
        const match = upToCursor.match(/newElement\(\s*(['"])([^'"]*)$/);
        if (match) {
            return { quote: match[1], typed: match[2] };
        }
        return null;
    }

    async function initEditor(force = false) {
        if (!editorContainer || !previewContainer || !consoleContainer) return;
        if (aceEditor && !force) return;

        // clear previous nodes (keeps bindings stable)
    editorContainer.innerHTML = "";
    previewContainer.innerHTML = "";
    // Do NOT clear consoleContainer.innerHTML; let Svelte {#each} handle rendering

        // Load Ace core
        await new Promise((resolve, reject) => {
            if (window.ace) return resolve();
            const s = document.createElement("script");
            s.src = "https://unpkg.com/ace-builds/src-min-noconflict/ace.js";
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });

        // Load Lua mode and theme
        await new Promise((resolve) => {
            const m = document.createElement("script");
            m.src =
                "https://unpkg.com/ace-builds/src-min-noconflict/mode-lua.js";
            m.onload = () => {
                const t = document.createElement("script");
                t.src =
                    "https://unpkg.com/ace-builds@1.43.2/src-min-noconflict/theme-tomorrow.js";
                t.onload = resolve;
                document.head.appendChild(t);
            };
            document.head.appendChild(m);
        });

        // load language tools extension
        await new Promise((resolve) => {
            const l = document.createElement("script");
            l.src =
                "https://unpkg.com/ace-builds/src-min-noconflict/ext-language_tools.js";
            l.onload = resolve;
            document.head.appendChild(l);
        });

        // create editor
        aceEditor = window.ace.edit(editorContainer);
        aceEditor.setTheme("ace/theme/tomorrow");
        aceEditor.session.setMode("ace/mode/lua");
        aceEditor.setValue(editorCode, 1);
        aceEditor.session.setUseWrapMode(true);
        aceEditor.setOptions({ fontSize: "14px", showPrintMargin: false });

        // preview iframe
        const iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "0";
        iframe.style.overflow = "auto"; // allow scrolling
        iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
        previewContainer.appendChild(iframe);

    // Console messages are handled by the centralized listener in updatePreview()

        // init lua instance for the editor preview
        luaEditorInstance = await initlua(false, true); //no local, so no full js library, but allow safeJs which is prompt, confirm, and alert, no eval
        updatePreview();

        // enable completions
        const langTools = window.ace.require("ace/ext/language_tools");
        aceEditor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
        });

        // collect dom function names (if dom is available)
        const domKeys =
            dom && typeof dom === "object"
                ? Object.keys(dom).filter((k) => typeof dom[k] === "function")
                : [];

        // Track which js.js functions are available in the editor (safeJs mode)
        // Only prompt, confirm, alert are available in safeJs mode (initlua(false, true))
        // See src/lib/lua.js for details
        const safeJsKeys = ["alert", "prompt", "confirm"];
        const jsKeys = js && typeof js === "object"
            ? Object.keys(js).filter((k) => typeof js[k] === "function" && safeJsKeys.includes(k))
            : [];

        const jsCompleter = {
            getCompletions(editor, session, pos, prefix, callback) {
                // only provide js completions when not inside newElement string
                const ctx = isInsideNewElementString(session, pos);
                if (ctx) {
                    callback(null, []);
                    return;
                }
                const suggestions = jsKeys
                    .filter((name) => name.startsWith(prefix || ""))
                    .map((name) => ({
                        caption: name,
                        value: name,
                        meta: "js",
                        score: 700,
                    }));
                callback(null, suggestions);
            },
            identifierRegexps: [/[a-zA-Z0-9_]+/],
        };

        // completer for newElement("...") strings (only fires inside those strings)
        const newElementCompleter = {
            // return suggestions for the simplified element names when inside newElement(...)
            getCompletions(editor, session, pos, prefix, callback) {
                const ctx = isInsideNewElementString(session, pos);
                if (!ctx) {
                    callback(null, []);
                    return;
                }
                const typed = ctx.typed || "";
                const suggestions = simplifiedElementNames
                    .filter((name) => name.startsWith(typed))
                    .map((name) => ({
                        caption: name,
                        value: name, // inserted as raw name (no quotes)
                        meta: "element",
                        score: 1000,
                    }));
                callback(null, suggestions);
            },
            // force this completer to be considered regardless of prefix
            identifierRegexps: [/[a-zA-Z0-9_]+/],
        };

        // completer for dom.* (higher-priority DOM function names)
        const domCompleter = {
            getCompletions(editor, session, pos, prefix, callback) {
                // only provide dom completions when not inside newElement string
                const ctx = isInsideNewElementString(session, pos);
                if (ctx) {
                    callback(null, []);
                    return;
                }

                const suggestions = domKeys
                    .filter((name) => name.startsWith(prefix || ""))
                    .map((name) => ({
                        caption: name,
                        value: name,
                        meta: "dom",
                        score: 800,
                    }));
                callback(null, suggestions);
            },
            identifierRegexps: [/[a-zA-Z0-9_]+/],
        };

        // remember original editor completers (if any)
        const originalCompleters = Array.isArray(aceEditor.completers)
            ? [...aceEditor.completers]
            : [];

        // helper: switch per-editor completers depending on context
        function updatePerEditorCompleters() {
            const pos = aceEditor.getCursorPosition();
            const session = aceEditor.getSession();
            const ctx = isInsideNewElementString(session, pos);
            if (ctx) {
                aceEditor.completers = [newElementCompleter];
                try {
                    aceEditor.execCommand("startAutocomplete");
                } catch (e) {}
            } else {
                // not inside newElement string: prefer domCompleter, jsCompleter, then restore defaults
                aceEditor.completers = [domCompleter, jsCompleter, ...originalCompleters];
            }
        }

        // wire events:
        // trigger updatePerEditorCompleters when cursor moves or content changes
        aceEditor
            .getSession()
            .selection.on("changeCursor", updatePerEditorCompleters);
        aceEditor.getSession().on("change", () => {
            editorCode = aceEditor.getValue();
            updatePerEditorCompleters();
        });

        // initial setup for completers
        updatePerEditorCompleters();

        // done: editor ready
    }

    async function reloadDocs() {
        if (!confirm('Reload docs from disk? This will replace your current editor contents.')) return;
        try {
            const txt = await fetch('/editor_docs.lua').then(r => r.text());
            if (aceEditor) {
                aceEditor.setValue(txt, 1);
                editorCode = aceEditor.getValue();
                updatePreview();
            } else {
                editorCode = txt;
            }
        } catch (e) {
            alert('Failed to reload docs: ' + e);
        }
    }

    async function updatePreview() {
        if (!previewContainer || !luaEditorInstance) return;
        const iframe = previewContainer.querySelector("iframe");
        if (!iframe) return;

    // keep existing console messages so errors append instead of replacing

    iframe.srcdoc = `<!DOCTYPE html><html><head><style>html, body {margin:0; padding:0; width:100%; height:100%; overflow:auto;}</style><script>(function() {function send(text, level) {var payload = {text: String(text), ts: Date.now(), level: level || 'log'}; window.parent.postMessage({__weblua_console: payload}, "*");}const origLog = console.log;console.log = function(...args) {origLog.apply(console, args);send(args.map(String).join(" "), 'log');};const origError = console.error;console.error = function(...args) {origError.apply(console, args);send(args.map(String).join(" "), 'error');};const origWarn = console.warn;console.warn = function(...args) {origWarn.apply(console, args);send(args.map(String).join(" "), 'warn');};const origInfo = console.info;console.info = function(...args) {origInfo.apply(console, args);send(args.map(String).join(" "), 'info');};})();<\/script></head><body></body></html>`;

        await new Promise((resolve) => {
            iframe.onload = () => {
                const doc = iframe.contentDocument;
                if (window.LuaElement?.setDoc) window.LuaElement.setDoc(doc);
                resolve();
            };
        });

        // Listen for console messages from iframe
        window.removeEventListener("message", window._weblua_console_listener);
        window._weblua_console_listener = function(event) {
            if (event.data && event.data.__weblua_console) {
                const payload = event.data.__weblua_console;
                let item;
                if (typeof payload === 'string') {
                    item = { text: payload, ts: Date.now(), level: 'log' };
                } else if (payload && typeof payload === 'object') {
                    item = { text: payload.text || String(payload), ts: payload.ts || Date.now(), level: payload.level || 'log' };
                } else {
                    item = { text: String(payload), ts: Date.now(), level: 'log' };
                }
                consoleMessages = [...consoleMessages, item];
                tick().then(() => {
                    if (consoleContainer) {
                        consoleContainer.scrollTop = consoleContainer.scrollHeight;
                    }
                });
            }
        };
        window.addEventListener("message", window._weblua_console_listener);

        // execute user's Lua in the editor preview's lua instance
        try {
            await luaEditorInstance.doString(editorCode);
        } catch (err) {
            let msg = "Lua error: ";
            if (err && err.message) {
                msg += err.message;
            } else if (typeof err === "string") {
                msg += err;
            } else {
                msg += JSON.stringify(err);
            }
            // Append Lua error with timestamp from the parent runtime.
            // Use a short defer to allow in-flight postMessage events to arrive
            // with their original timestamps from the iframe. We'll still display
            // messages in the order they were timestamped (the UI appends as-received,
            // but each item carries a ts for clarity).
            setTimeout(() => {
                const item = { text: msg, ts: Date.now(), level: 'error' };
                consoleMessages = [...consoleMessages, item];
                tick().then(() => {
                    if (consoleContainer) {
                        consoleContainer.scrollTop = consoleContainer.scrollHeight;
                    }
                });
            }, 20);
        }
    }

    // Reinit editor when tab becomes active (force to handle tab switching)
    $: if (activeTab === "editor") tick().then(() => initEditor(true));

    function clearConsole() {
        consoleMessages = [];
        // allow UI to update and reset scroll
        tick().then(() => {
            if (consoleContainer) consoleContainer.scrollTop = 0;
        });
    }

</script>

<main>
    <div class="tabs">
        <ul>
            <li class:active={activeTab === "browser"}>
                <button on:click={() => (activeTab = "browser")}>Browser</button
                >
            </li>
            <li class:active={activeTab === "editor"}>
                <button on:click={() => (activeTab = "editor")}>Editor</button>
            </li>
            
        </ul>

        <div class="tab-content">
            {#if activeTab === "browser"}
                <div class="browser-tab">
                    <div class="browser-controls">
                        <button on:click={goBack} disabled={currentIndex === 0}
                            >🠰</button
                        >
                        <button
                            on:click={goForward}
                            disabled={currentIndex === history.length - 1}
                            >🠲</button
                        >
                        <input
                            type="text"
                            bind:value={url}
                            on:keyup={navigateToUrl}
                            class="url-input"
                        />
                    </div>
                    <div class="browser-content" bind:this={browserContainer}></div>
                </div>
            {:else if activeTab === "editor"}
                <div class="editor-tab" style="display:flex; flex:1;">
                    <div
                        class="editor-container"
                        bind:this={editorContainer}
                        style="flex:1;height:100%"
                    ></div>
                    <div style="flex:1;display:flex;flex-direction:column;height:100%">
                        <div style="display:flex;gap:8px;margin:8px 0 4px 0;">
                            <button style="padding:6px 18px;font-size:15px;background:#4CAF50;color:white;border:none;border-radius:4px;align-self:flex-start;cursor:pointer;" on:click={updatePreview}>Run</button>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <button style="margin:8px 0 4px 0;padding:6px 12px;font-size:13px;background:#1976D2;color:white;border:none;border-radius:4px;align-self:flex-start;cursor:pointer;" on:click={reloadDocs}>Reload docs</button>
                            </div>
                            <button style="padding:6px 18px;font-size:15px;background:#888;color:white;border:none;border-radius:4px;align-self:flex-start;cursor:pointer;" on:click={clearConsole}>Clear Console</button>
                        </div>
                        <div
                            class="preview-container"
                            bind:this={previewContainer}
                            style="height:calc(100% - 130px);"
                        ></div>
                        <div class="console-container" bind:this={consoleContainer}>
                            {#each consoleMessages as msg}
                                <div class="console-line console-{msg.level}">
                                    <span class="console-ts">{(() => {
                                    const d = new Date(msg.ts);
                                        let h = d.getHours();
                                        const m = d.getMinutes();
                                        const s = d.getSeconds();
                                        const ms = d.getMilliseconds();
                                        const ampm = h >= 12 ? 'PM' : 'AM';
                                        h = h % 12;
                                        if (h === 0) h = 12;
                                        const pad = n => n.toString().padStart(2, '0');
                                        return `${h}:${pad(m)}:${pad(s)}.${ms.toString().padStart(3, '0')} ${ampm}`;
                                    })()}</span>
                                    <span class="console-text">{msg.text}</span>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <style>
        body {
            margin: 0;
            background: white;
        }
        .tabs {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        ul {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            gap: 10px;
            background: #f5f5f5;
            border-bottom: 1px solid #ddd;
        }
        li {
            flex: 1;
            text-align: center;
        }
        button {
            background: transparent;
            border: none;
            padding: 10px;
            width: 100%;
            cursor: pointer;
            text-align: center;
        }
        .active button {
            background: #ddd;
        }
        .tab-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: auto;
        }

        .browser-tab {
            display: flex;
            flex-direction: column;
            flex: 1;
        }
        .browser-controls {
            display: flex;
            gap: 10px;
            background: #f5f5f5;
            padding: 10px;
        }
        .browser-controls button {
            padding: 5px;
            color: #000;
            background: #ddd;
            width: auto;
        }
        .browser-content {
            flex: 1;
            overflow: auto;
        }
        .browser-content iframe {
            display: block;
            width: 100%;
            height: auto;
            border: none;
        }
        .url-input {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 100%;
            max-width: 100%;
            overflow: hidden;
        }

        .editor-tab {
            display: flex;
            flex: 1;
            height: 100%;
            overflow: auto;
            max-width: 100%;
        }
        .editor-container {
            flex: 1;
            height: 100%;
            overflow: auto;
        }
        .preview-container {
            width: 100%;
            height: calc(100% - 130px);
            overflow: auto;
        }
        .console-container {
            width: 100%;
            height: 120px;
            /* use auto so scrollbar shows only when needed */
            overflow-y: auto;
            box-sizing: border-box;
            /* add a subtle inset shadow instead of border-right to avoid increasing layout width */
            box-shadow: inset -6px 0 6px -6px rgba(0,0,0,0.18);
            /*scrollbar-width: thin;*/
            scrollbar-color: #888 #222;
            background: #222;
            color: #eee;
            font-family: monospace;
            font-size: 13px;
            padding: 8px;
            border-top: 1px solid #444;
            position: relative;
        }
        /* Chrome, Edge, Safari */
        .console-container::-webkit-scrollbar {
            width: 8px;
        }
        .console-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
        }
        .console-container::-webkit-scrollbar-track {
            background: #222;
        }
        .console-line {
            white-space: pre-wrap;
            word-break: break-word;
            margin-bottom: 2px;
        }
        .console-ts {
            color: #999;
            margin-right: 8px;
            font-size: 11px;
        }
        .console-text { color: #eee; }
        .console-error .console-text { color: #ff6b6b; }
        .editor-container .ace_editor {
            height: 100% !important;
            width: 100% !important;
        }
        .preview-container iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        /* Responsive: stack editor and preview vertically on narrower screens */
        @media (max-width: 900px) {
            .editor-tab {
                flex-direction: column;
            }
            .editor-container, .preview-container {
                width: 100%;
                height: 40vh;
            }
            .console-container {
                height: 120px;
            }
        }
    </style>
</main>
