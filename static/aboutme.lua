-- Set background and font
newElement("div")
    :setStyle([[
        background-color: #f0f0f0;
        font-family: Arial, sans-serif;
        padding: 20px;
        text-align: center;
    ]])
    :pushElement()

-- Page title
newElement("h1")
    :setText("About Me")
    :setStyle("color: #333;")
    :pushElement()

-- Profile picture
newElement("img")
    :setSrc("https://cdn.discordapp.com/avatars/712497713043734539/c14dde1c279470ccccbca1590117197c.webp?size=1024")
    :setStyle([[
        border-radius: 50%;
        width: 150px;
        height: 150px;
        margin: 20px 0;
    ]])
    :pushElement()

-- Introduction paragraph
newElement("p")
    :setText("Hi! I'm a WebLua developer exploring Lua + JS in the browser.")
    :setStyle("color: #555; font-size: 18px; max-width: 600px; margin: auto;")
    :pushElement()

-- Skills section
newElement("h2")
    :setText("Skills")
    :setStyle("color: #333; margin-top: 40px;")
    :pushElement()

local skills = {"Lua", "JavaScript", "Svelte", "HTML/CSS", "Web Development"}

local ul = newElement("ul")
for i, skill in ipairs(skills) do
    ul:pushChild(newElement("li"):setText(skill):setStyle("font-size:16px; color:#555;"))
end
ul:pushElement()

-- Contact button
newElement("button")
    :setText("Contact Me")
    :setStyle([[
        margin-top: 40px;
        padding: 10px 20px;
        font-size: 16px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    ]])
    :setOnClick(function()
        alert("You clicked the Contact Me button!")
    end)
    :pushElement()
