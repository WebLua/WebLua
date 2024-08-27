import * as luainjs from 'lua-in-js';
import {dom} from "./dom";
export function initlua() {
  const env = luainjs.createEnv();
  env.loadLib("dom", dom)
  return env
}

