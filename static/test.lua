local e = dom.newElement("paragraph")
e = dom.setText(e, "try typing \"aaa.png\" and pressing run, it will change the image")
dom.pushElement(e)
e = dom.newElement("textarea")
e = dom.setName(e, "code")
dom.pushElement(e)
e = dom.newElement("button")
e = dom.setText(e, "run")
e = dom.setOnClick(e, function()
    dom.setSrc(dom.getElementByName("image"), dom.getText(dom.getElementByName("code")))
end)
dom.pushElement(e)

--[[e = dom.newElement("paragraph")
e = dom.setText(e, "This is a paragraph with some <b>bold</b> and <i>italic</b> text.")
dom.pushElement(e)]]--

e = dom.newElement("div")
dom.pushElement(e)

e = dom.newElement("h1")
e = dom.setText(e, "Heading 1")
dom.pushElement(e)

local p = dom.newElement("image")
p = dom.setSrc(p, "www.png")
p = dom.setName(p, "image")
dom.pushElement(p)