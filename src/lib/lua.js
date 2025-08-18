// lua.js
import { js } from "./js";
import { LuaFactory } from "wasmoon";
import { dom } from "./dom";
export { dom };
export async function initlua(local = false) {
  const factory = new LuaFactory();
  const lua = await factory.createEngine();

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
  }

  return lua;
}
