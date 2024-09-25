import { Table } from "lua-in-js";
function unsimplifyElementName(name) {
  switch (name) {
    case "header1": return "h1";
    case "header2": return "h2";
    case "header3": return "h3";
    case "header4": return "h4";
    case "header5": return "h5";
    case "header6": return "h6";
    case "paragraph": return "p";
    case "unorderedList": return "ul";
    case "orderedList": return "ol";
    case "listItem": return "li";
    case "anchor": return "a";
    case "image": return "img";
    case "divider": return "div";
    case "inlineDivider": return "span";
    case "bold": return "strong";
    case "italic": return "em";
    case "lineBreak": return "br";
    case "thematicLineBreak": return "hr";
    case "preformattedText": return "pre";
    case "code": return "codeBlock";
    case "quote": return "blockQuote";
    case "tableRow": return "tr";
    case "tableCell": return "td";
    case "link": return "a";
    case "dropDown": return "select";
    case "frame": return "iframe";
    default: return name;
  }
}
function test() {
  return "test lol";
}
function newElement(name) {
  name = name.toString();
  if (name.toLowerCase() == "script") return "script tags are not allowed!";
  if (unsimplifyElementName(name) === name) console.warn(`The ${name} tag is not currently supported in WebLua, Be cautious as this tag may not work or function properly.`);
  return document.createElement(unsimplifyElementName(name));
}
function setText(element, value) {
  element.innerHTML = String(value);
  return element;
}
function setOnClick(element, value) {
  if (element.tagName.toLowerCase() === "button") {
    element.onclick = typeof value === "function" ? value : () => {};
    return element
  } else return "setOnClick only works for buttons"
}
function pushChild(parent, child) {
  parent.appendChild(child);
}
function setClass(element, name) {
  element.className = name.toString();
  return element;
}
function getClass(element) {
  return element.className;
}
function pushElement(element) {
  document.getElementsByClassName("browser-content")[0].appendChild(element);
  return element;
}
export const dom = new Table({
  test,
  alert,
  prompt,
  confirm,
  newElement,
  setText,
  setOnClick,
  pushChild,
  setClass,
  getClass,
  pushElement,
})