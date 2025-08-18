-- Paragraph
newElement("p"):setText('try typing "aaa.png" and pressing run, it will change the image'):pushElement()

-- Textarea
newElement("textarea"):setName("code"):pushElement()

-- Button
newElement("button")
    :setText("run")
    :setOnClick(function()
        getElementByName("image"):setSrc(getElementByName("code"):getText())
    end)
    :pushElement()

-- Divider
newElement("div"):pushElement()

-- Heading
newElement("h1"):setText("Heading 1"):pushElement()

-- Image
newElement("img"):setSrc("www.png"):setName("image"):pushElement()
