local e = dom.newElement("paragraph")
e = dom.setText(e, "updated test.lua file, you can now run javascript code like in the browser console")
dom.pushElement(e)
e = dom.newElement("textarea")
e = dom.setName(e, "code")
dom.pushElement(e)
e = dom.newElement("button")
e = dom.setText(e, "run")
e = dom.setOnClick(e, function()
  js.eval(dom.getText(dom.getElementByName("code")))
end)
dom.pushElement(e)