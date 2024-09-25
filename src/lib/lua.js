import * as luainjs from 'lua-in-js';
import { onMount } from "svelte";
import { js } from "./js";


async function initlua(local = false) {
  const { dom } = await import("./dom")
  const env = luainjs.createEnv();
  env.loadLib("dom", dom)
  if (local) env.loadLib("js", js)
  return env
}
export { initlua }

