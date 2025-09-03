// lua.js
import { js } from "./js";
import { LuaFactory } from "wasmoon";
import { dom } from "./dom";
export { dom };
export async function initlua(local = false , safeJs = false) {
    const factory = new LuaFactory();
    const lua = await factory.createEngine();
        // Redirect Lua print to JS console.log and visual console if present
        await lua.global.set('print', (...args) => {
            const msg = args.map(String);
            // Log to browser console
            if (typeof console !== 'undefined' && typeof console.log === 'function') {
                console.log(msg);
            }
            // Also add to visual console area if present
            if (typeof window !== 'undefined') {
                // Try to find the console container by class name
                const containers = document.getElementsByClassName('console-container');
                if (containers && containers.length > 0) {
                    const div = document.createElement('div');
                    if (div) div.textContent = msg;
                    div.className = 'console-line';
                    if (containers[0]) containers[0].appendChild(div);
                    if (containers[0]) containers[0].scrollTop = containers[0].scrollHeight;
                }
            }
        });
    // Expose dom namespace and globals
    await lua.global.set("dom", dom);
    for (const key in dom) {
        if (typeof dom[key] === "function") await lua.global.set(key, dom[key]);
    }

    // Expose js namespace and globals
    await lua.global.set("js", js);
    if (local) {
        for (const key in js) {
            if (typeof js[key] === "function") await lua.global.set(key, js[key]);
        }
    } else if (safeJs) {
        for (const key in js) {
            if (typeof js[key] === "function") {
                if (js[key].name !== 'eval') await lua.global.set(key, js[key]);
            }
        }
    }

    return lua;
}
