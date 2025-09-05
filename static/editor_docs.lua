-- Documentation generator for WebLua (concise)
function heading(level, text, style)
    local el = newElement("header" .. tostring(level))
    if style then el:setStyle(style) end
    el:setText(text):pushElement()
    return el
end

function paragraph(text, style)
    local p = newElement("paragraph")
    if style then p:setStyle(style) end
    p:setText(text):pushElement()
    return p
end

function pushList(items)
    local liStyle = "font-size: 14px; color: #555; margin: 5px 0;"
    local ul = newElement("unorderedList")
    for _, it in ipairs(items) do
        ul:pushChild(
            newElement("listItem")
                :setText(it.name .. " — " .. it.desc)
                :setStyle(liStyle)
        )
    end
    ul:pushElement()
    return ul
end

newElement("divider"):setStyle([[font-family: Arial, sans-serif; padding: 20px; max-width: 900px; margin: auto;]]):pushElement()

heading(1, "WebLua Documentation", "color: #333; margin-bottom: 10px;")
paragraph(
    "WebLua allows you to create interactive web pages using Lua instead of JavaScript in the browser. Everything runs inside an iframe, and all DOM manipulations use the LuaElement API.",
    "color: #555; font-size: 16px; line-height: 1.5;"
)

heading(2, "Available LuaElement Methods", "color: #333; margin-top: 30px;")

local methods = {
    {name = "setText(value)", desc = "Set the textContent of the element. Chainable."},
    {name = "getText()", desc = "Get the textContent (or value) of the element."},
    {name = "setSrc(value)", desc = "Set the src attribute of an element like img or iframe."},
    {name = "setOnClick(fn)", desc = "Set a click handler. fn receives (self, event)."},
    {name = "pushChild(child)", desc = "Append a LuaElement child to this element."},
    {name = "pushChildren(children)", desc = "Append multiple LuaElement children."},
    {name = "setClass(name)", desc = "Set the class of the element."},
    {name = "getClass()", desc = "Get the class of the element."},
    {name = "setName(id)", desc = "Set the id of the element."},
    {name = "getName()", desc = "Get the id of the element."},
    {name = "setStyle(cssText)", desc = "Set inline CSS styles."},
    {name = "hide()", desc = "Hide the element."},
    {name = "show()", desc = "Show the element."},
    {name = "pushElement(container)", desc = "Append the element to the iframe body or container."},
    {name = "getElementByName(id)", desc = "Retrieve element by id from the current document."},
}

local element_dom = {
    {name = "setAttr(name, value)", desc = "Set or remove attributes. Pass nil/false to remove."},
    {name = "getAttr(name)", desc = "Get attribute value."},
    {name = "removeAttr(name)", desc = "Remove attribute."},
    {name = "on(eventName, fn, options)", desc = "Add event listener; returns an off() function."},
    {name = "off(eventName?, fn?)", desc = "Remove event listeners from this element; omit args to clear all."},
    {name = "onOnce(eventName, fn)", desc = "Add a one-time listener that removes itself after firing."},
    {name = "closest(selector)", desc = "Find closest matching ancestor; returns LuaElement or nil."},
    {name = "toggleClass(className, force?)", desc = "Toggle a class; optional force boolean to explicitly add/remove."},
    {name = "emit(eventName, detail?)", desc = "Dispatch a CustomEvent on element (bubbles by default). Returns boolean if not canceled."},
    {name = "empty()", desc = "Remove all child nodes from element."},
    {name = "serialize()", desc = "Return outerHTML of the element as a string."},
}

local seen = {}
for _, v in ipairs(methods) do seen[v.name] = true end
for _, v in ipairs(element_dom) do
    if not seen[v.name] then table.insert(methods, v); seen[v.name] = true end
end

pushList(methods)

heading(2, "Example Usage", "color: #333; margin-top: 30px;")

local codeContainer = newElement("preformattedText")
codeContainer:setStyle([[background-color: #f0f0f0; padding: 15px; border-radius: 5px; overflow-x: auto;]]):pushElement()

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

heading(2, "Interactive Demo", "color: #333; margin-top: 30px;")
heading(2, "Global DOM Helpers", "color: #333; margin-top: 30px;")
pushList({
    {name = "find(selector)", desc = "Query a single element on the document; returns a LuaElement or nil."},
    {name = "findAll(selector)", desc = "Query multiple elements on the document; returns an array of LuaElements."},
    {name = "appendHTML(rootOrSelector, html)", desc = "Safely append HTML into a root (selector or element); script tags are removed."},
    {name = "scrollTo(xOrOptions, y?)", desc = "Scroll the document/window to coordinates or accept an options object."},
    {name = "scrollBy(x, y)", desc = "Scroll the document/window by an offset."},
    {name = "scrollIntoView(elementOrSelector, options)", desc = "Scroll an element into view; accepts selector or element."},
    {name = "getScroll()", desc = "Return the current scroll offsets {x, y}."},
    {name = "setScroll(x, y)", desc = "Set the scroll position of the document/window."},
    {name = "logToConsole(text, level?)", desc = "Post a structured message to the WebLua console (level: 'log'|'info'|'warn'|'error')."},
})

-- DOM examples
newElement("header2")
    :setText("DOM Helper Examples")
    :setStyle("color: #333; margin-top: 24px;")
    :pushElement()

local domCode = newElement("preformattedText")
    :setStyle([[
        background-color: #f8f8f8;
        padding: 12px;
        border-radius: 6px;
        overflow-x: auto;
        font-size: 13px;
    ]])
    :setText([[
-- Find an element by selector and change an attribute
local el = find('#myParagraph')
if el then
    setAttr(el, 'data-updated', 'true')
    print('updated attribute:', getAttr(el, 'data-updated'))
end

-- Listen for clicks and toggle class
local btn = find('#myButton')
if btn then
    on(btn, 'click', function(ev)
        logToConsole('Button clicked', 'info')
        toggleClass(btn, 'active')
    end)
end

-- Append safe HTML to body
appendHTML(find('body'), '<div class="note">Hello from appendHTML()</div>')

-- Serialize element
if el then print(serialize(el)) end

-- Use logToConsole directly
logToConsole('This is a test message from DOM helpers', 'log')
]])
    :pushElement()

newElement("button")
    :setText("Add Dynamic Element")
    :setStyle([[padding: 8px 15px; font-size: 14px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 10px;]])
    :setOnClick(function()
        newElement("paragraph")
            :setText("This was added dynamically!")
            :setStyle("color: #007ACC; font-weight: bold; margin: 5px 0;")
            :pushElement()
        print("Dynamic element added, see bottom of page")
    end):pushElement()

-- scrolling demo buttons
newElement("button")
    :setText("Scroll down 200px")
    :setStyle([[padding: 6px 12px; font-size: 13px; margin-right:8px;]])
    :setOnClick(function()
        scrollBy(0, 200)
    end):pushElement()

newElement("button")
    :setText("Scroll to top")
    :setStyle([[padding: 6px 12px; font-size: 13px; margin-right:8px;]])
    :setOnClick(function()
        setScroll(0, 0)
    end):pushElement()

newElement("button")
    :setText("Scroll to target")
    :setStyle([[padding: 6px 12px; font-size: 13px; margin-right:8px;]])
    :setOnClick(function()
        scrollIntoView('#scrollTarget')
    end):pushElement()

-- spacer and target for scrollIntoView demo
newElement("divider")
    :setStyle([[height: 420px; background: transparent; border: none;]])
    :pushElement()

newElement("paragraph")
    :setText("Scroll target")
    :setName("scrollTarget")
    :setStyle("padding:8px; background:#eee; border-radius:4px; margin-bottom:8px;")
    :pushElement()