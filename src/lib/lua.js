// lua.js
import { js } from "./js";
import { LuaFactory } from "wasmoon";
import { dom } from "./dom";
export { dom, js };
export async function initlua(local = false , safeJs = false) {
    const factory = new LuaFactory();
    const lua = await factory.createEngine();
        // Redirect Lua print to JS console.log and visual console if present
        lua.global.set('print', (...args) => {
            const text = args.map(String).join(' ');
            // Log to browser console
            if (typeof console !== 'undefined' && typeof console.log === 'function') {
                console.log(text);
            }
            // Post structured payload so the central console listener can handle formatting/timestamps
            if (typeof window !== 'undefined' && typeof window.postMessage === 'function') {
                const payload = { text, ts: Date.now(), level: 'log' };
                try {
                    window.postMessage({ __weblua_console: payload }, '*');
                } catch (e) {
                    // Fallback: append directly if postMessage isn't available for some reason
                    const containers = document.getElementsByClassName('console-container');
                    if (containers && containers.length > 0) {
                        const div = document.createElement('div');
                        if (div) div.textContent = text;
                        div.className = 'console-line';
                        if (containers[0]) containers[0].appendChild(div);
                        if (containers[0]) containers[0].scrollTop = containers[0].scrollHeight;
                    }
                }
            }
        });
    // Expose dom namespace and globals
    lua.global.set("dom", dom);
    for (const key in dom) {
        if (typeof dom[key] === "function") lua.global.set(key, dom[key]);
    }

    // Expose js namespace and globals
    if (local) {
        for (const key in js) {
            if (typeof js[key] === "function") lua.global.set(key, js[key]);
        }
        lua.global.set("js", js);
    } else if (safeJs) {
        for (const key in js) {
            if (typeof js[key] === "function") {
                if (js[key].name !== 'eval') lua.global.set(key, js[key]);
            }
        }

        // Create a filtered js object exposing only safe functions
        const safeJsObj = {};
        for (const key in js) {
            if (typeof js[key] === "function" && js[key].name !== "eval") {
                //console.log("Exposing safe js function:", key);
                safeJsObj[key] = js[key];
            }
        }
        lua.global.set("js", safeJsObj);
    }

    return lua;
}
