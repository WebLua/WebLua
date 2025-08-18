// js.js
export const js = {
  eval: (code) => window.eval(code),
  alert: (msg) => window.alert(msg),
  prompt: (msg, defaultVal) => window.prompt(msg, defaultVal),
  confirm: (msg) => window.confirm(msg)
};
