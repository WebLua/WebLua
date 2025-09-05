-- Set up the page container
newElement("divider")
    :setStyle([[
        font-family: Arial, sans-serif;
        padding: 20px;
        max-width: 900px;
        margin: auto;
    ]])
    :pushElement()

-- Page title
newElement("header1")
    :setText("WebLua Documentation")
    :setStyle("color: #333; margin-bottom: 10px;")
    :pushElement()

-- Intro paragraph
newElement("paragraph")
    :setText("WebLua allows you to create interactive web pages using Lua instead of JavaScript in the browser. Everything runs inside an iframe, and all DOM manipulations use the LuaElement API.")
    :setStyle("color: #555; font-size: 16px; line-height: 1.5;")
    :pushElement()

-- Methods section
newElement("header2")
    :setText("Available LuaElement Methods")
    :setStyle("color: #333; margin-top: 30px;")
    :pushElement()

local methods = {
    {name="setText(value)", desc="Set the textContent of the element. Chainable."},
    {name="getText()", desc="Get the textContent (or value) of the element."},
    {name="setSrc(value)", desc="Set the src attribute of an element like img or iframe."},
    {name="setOnClick(fn)", desc="Set a click handler. fn receives (self, event)."},
    {name="pushChild(child)", desc="Append a LuaElement child to this element."},
    {name="pushChildren(children)", desc="Append multiple LuaElement children."},
    {name="setClass(name)", desc="Set the class of the element."},
    {name="getClass()", desc="Get the class of the element."},
    {name="setName(id)", desc="Set the id of the element."},
    {name="getName()", desc="Get the id of the element."},
    {name="setStyle(cssText)", desc="Set inline CSS styles."},
    {name="hide()", desc="Hide the element."},
    {name="show()", desc="Show the element."},
    {name="pushElement(container)", desc="Append the element to the iframe body or container."},
    {name="LuaElement.getElementByName(id)", desc="Retrieve element by id from the current document."}
}

local ul = newElement("unorderedList")
for _, m in ipairs(methods) do
    ul:pushChild(
        newElement("listItem")
            :setText(m.name .. " — " .. m.desc)
            :setStyle("font-size: 14px; color: #555; margin: 5px 0;")
    )
end
ul:pushElement()

-- Example usage section
newElement("header2")
    :setText("Example Usage")
    :setStyle("color: #333; margin-top: 30px;")
    :pushElement()

-- Example code container
local codeContainer = newElement("preformattedText")
    :setStyle([[
        background-color: #f0f0f0;
        padding: 15px;
        border-radius: 5px;
        overflow-x: auto;
    ]])
    :pushElement()

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

-- Interactive demo section
newElement("header2")
    :setText("Interactive Demo")
    :setStyle("color: #333; margin-top: 30px;")
    :pushElement()

newElement("button")
    :setText("Add Dynamic Element")
    :setStyle([[
        padding: 8px 15px;
        font-size: 14px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-bottom: 10px;
    ]])
    :setOnClick(function()
        newElement("paragraph")
            :setText("This was added dynamically!")
            :setStyle("color: #007ACC; font-weight: bold; margin: 5px 0;")
            :pushElement()
    local dom_methods = {
        {name = "dom.setAttr(element, name, value)", desc = "Set or remove attributes. Pass nil/false to remove."},
        {name = "dom.getAttr(element, name)", desc = "Get attribute value."},
        {name = "dom.removeAttr(element, name)", desc = "Remove attribute."},
        {name = "dom.find(rootOrSelector, selector?)", desc = "Query a single element. If only one arg is provided it's treated as a selector on the document."},
        {name = "dom.findAll(rootOrSelector, selector?)", desc = "Query multiple elements; returns an array of LuaElement wrappers."},
        {name = "dom.on(element, eventName, fn, options)", desc = "Add event listener; returns an off() function."},
        {name = "dom.off(element, eventName?, fn?)", desc = "Remove event listeners; omit args to clear all."},
        {name = "dom.onOnce(element, eventName, fn)", desc = "Add a one-time listener that removes itself after firing."},
        {name = "dom.closest(element, selector)", desc = "Find closest matching ancestor; returns LuaElement or nil."},
        {name = "dom.toggleClass(element, className, force?)", desc = "Toggle a class; optional force boolean to explicitly add/remove."},
        {name = "dom.emit(element, eventName, detail?)", desc = "Dispatch a CustomEvent on element (bubbles by default). Returns boolean if not canceled."},
        {name = "dom.empty(element)", desc = "Remove all child nodes from element."},
        {name = "dom.serialize(element)", desc = "Return outerHTML of the element as a string."},
        {name = "dom.appendHTML(element, html)", desc = "Safely append HTML (script tags are removed)."},
        {name = "dom.logToConsole(text, level?)", desc = "Post a structured message to the WebLua console (level: 'log'|'info'|'warn'|'error')."},
    }

    local dl = newElement("unorderedList")
    for _, m in ipairs(dom_methods) do
        dl:pushChild(
            newElement("listItem")
                :setText(m.name .. " — " .. m.desc)
                :setStyle("font-size: 14px; color: #555; margin: 5px 0;")
        )
    end
    dl:pushElement()

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
        :pushElement()

    domCode:setText([[
    -- Find an element by selector and change an attribute
    local el = dom.find('#myParagraph')
    if el then
        dom.setAttr(el, 'data-updated', 'true')
        print('updated attribute:', dom.getAttr(el, 'data-updated'))
    end

    -- Listen for clicks and toggle class
    local btn = dom.find('#myButton')
    if btn then
        dom.on(btn, 'click', function(ev)
            dom.logToConsole('Button clicked', 'info')
            dom.toggleClass(btn, 'active')
        end)
    end

    -- Append safe HTML to body
    dom.appendHTML(dom.find('body'), '<div class="note">Hello from appendHTML()</div>')

    -- Serialize element
    if el then print(dom.serialize(el)) end

    -- Use dom.logToConsole directly
    dom.logToConsole('This is a test message from DOM helpers', 'log')
    ]])
end

-- Append safe HTML
dom.appendHTML(dom.find('body'), '<div class="note">Hello from appendHTML()</div>')

-- Use attributes
dom.setAttr(el, 'data-source', 'weblua')
print(dom.getAttr(el, 'data-source'))

-- Serialize element
print(dom.serialize(el))

-- Use dom.logToConsole directly
dom.logToConsole('This is a test message', 'log')
]])
