import * as luainjs from 'lua-in-js';
import {dom} from "./dom";
import {js} from "./js";
export function initlua(local = false) {
  const env = luainjs.createEnv();
  env.loadLib("dom", dom)
  if (local) env.loadLib("js", js)
  return env
}

