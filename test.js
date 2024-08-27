import * as luajs from 'lua-in-js';
const lua = luajs.createEnv()
console.log(lua.parse(`return 2 + 3`).exec());