<svelte:head>
        <!-- IE -->
        <link rel="shortcut icon" type="image/png" href="favicon.png"/>
        <!-- other browsers -->
        <link rel="icon" type="image/png" href="favicon.png"/>
    </svelte:head>
<script>
    import { tick } from "svelte";
    import { initlua, dom, js} from "../lib/lua.js";

    let activeTab = "browser";
    let url = "weblua://aboutme";
    let history = [url];
    let currentIndex = 0;

    let browserContainer;

    async function pushUrl(url) {
        const container = browserContainer;
        if (!url.startsWith("weblua://")) return alert("Invalid URL");

        const lua = await initlua(true);
        const parts = url.split("/");
        if (!parts[2].endsWith(".lua")) parts[2] += ".lua";
        const code = await fetch(parts[2]).then((r) => r.text());

        let iframe = container.querySelector("iframe");
        if (!iframe) {
            iframe = document.createElement("iframe");
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.border = "0";
            iframe.style.overflow = "auto"; // allow scrolling
            iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
            container.appendChild(iframe);
        }

        iframe.srcdoc = `
        <!DOCTYPE html>
        <html>
            <head>
                <style>html, body {margin:0; padding:0; width:100%; overflow:auto !important; box-sizing: border-box;} *, *:before, *:after {box-sizing: inherit;}</style>
            </head>
            <body></body>
        </html>
        `;

        await new Promise((resolve) => {
            iframe.onload = () => {
                const doc = iframe.contentDocument;
                if (window.LuaElement?.setDoc) window.LuaElement.setDoc(doc);
                resolve();
            };
        });

        await lua.doString(code);
    }

    function navigateToUrl(e) {
        if ((e.keyCode ?? e.which) === 13) {
            history.push(url);
            currentIndex = history.length - 1;
            pushUrl(url);
        }
    }

    function goBack() {
        if (currentIndex > 0) {
            currentIndex--;
            url = history[currentIndex];
        }
    }

    function goForward() {
        if (currentIndex < history.length - 1) {
            currentIndex++;
            url = history[currentIndex];
        }
    }

    // Editor
    let editorContainer;
    let previewContainer;
    let consoleContainer;
    let consoleMessages = [];

    function clearConsole() {
        consoleMessages = [];
        tick().then(() => {
            if (consoleContainer) {
                consoleContainer.scrollTop = 0;
            }
        });
    }
    let aceEditor;
    let luaEditorInstance;
    let editorCode = `-- Set up the page container
newElement("divider")
    :setStyle([[
        font-family: Arial, sans-serif;
        padding: 20px;
        max-width: 900px;
        margin: auto;
    ]])
    :pushElement()

-- Page title
newElement("header1")
    :setText("WebLua Documentation")
    :setStyle("color: #333; margin-bottom: 10px;")
    :pushElement()

-- Intro paragraph
newElement("paragraph")
    :setText("WebLua allows you to create interactive web pages using Lua instead of JavaScript in the browser. Everything runs inside an iframe, and all DOM manipulations use the LuaElement API.")
    :setStyle("color: #555; font-size: 16px; line-height: 1.5;")
    :pushElement()

-- Methods section
newElement("header2")
    :setText("Available LuaElement Methods")
    :setStyle("color: #333; margin-top: 30px;")
    :pushElement()

local methods = {
    {name="setText(value)", desc="Set the textContent of the element. Chainable."},
    {name="getText()", desc="Get the textContent (or value) of the element."},
    {name="setSrc(value)", desc="Set the src attribute of an element like img or iframe."},
    {name="setOnClick(fn)", desc="Set a click handler. fn receives (self, event)."},
    {name="pushChild(child)", desc="Append a LuaElement child to this element."},
    {name="pushChildren(children)", desc="Append multiple LuaElement children."},
    {name="setClass(name)", desc="Set the class of the element."},
    {name="getClass()", desc="Get the class of the element."},
    {name="setName(id)", desc="Set the id of the element."},
    {name="getName()", desc="Get the id of the element."},
    {name="setStyle(cssText)", desc="Set inline CSS styles."},
    {name="hide()", desc="Hide the element."},
    {name="show()", desc="Show the element."},
    {name="pushElement(container)", desc="Append the element to the iframe body or container."},
    {name="LuaElement.getElementByName(id)", desc="Retrieve element by id from the current document."}
}

local ul = newElement("unorderedList")
for _, m in ipairs(methods) do
    ul:pushChild(
        newElement("listItem")
            :setText(m.name .. " — " .. m.desc)
            :setStyle("font-size: 14px; color: #555; margin: 5px 0;")
    )
end
ul:pushElement()

-- Example usage section
newElement("header2")
    :setText("Example Usage")
    :setStyle("color: #333; margin-top: 30px;")
    :pushElement()

-- Example code container
local codeContainer = newElement("preformattedText")
    :setStyle([[
        background-color: #f0f0f0;
        padding: 15px;
        border-radius: 5px;
        overflow-x: auto;
    ]])
    :pushElement()

codeContainer:setText([[
-- Create a button
newElement("button")
    :setText("Click Me")
    :setName("myButton")
    :setStyle("padding: 10px 20px; font-size: 16px; margin-top: 10px;")
    :setOnClick(function(self)
        alert("Button clicked: " .. self:getName())
    end)
    :pushElement()
]])

-- Interactive demo section
newElement("header2")
    :setText("Interactive Demo")
    :setStyle("color: #333; margin-top: 30px;")
    :pushElement()

newElement("button")
    :setText("Add Dynamic Element")
    :setStyle([[
        padding: 8px 15px;
        font-size: 14px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-bottom: 10px;
    ]])
    :setOnClick(function()
        newElement("paragraph")
            :setText("This was added dynamically!")
            :setStyle("color: #007ACC; font-weight: bold; margin: 5px 0;")
            :pushElement()
    end)
    :pushElement()

-- Footer note
newElement("paragraph")
    :setText("All elements use LuaElement API. You can create custom tags or non-simplified elements by passing any tag string to newElement().")
    :setStyle("color: #888; font-size: 13px; margin-top: 40px;")
    :pushElement()`;

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
            <li class:active={activeTab === "servers"}>
                <button on:click={() => (activeTab = "servers")}>Servers</button
                >
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
            {:else if activeTab === "servers"}
                <div><p>this will be the server list</p></div>
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
