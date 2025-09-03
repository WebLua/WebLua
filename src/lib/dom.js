// dom.js
function unsimplifyElementName(name) {
    switch (name) {
        case "header1":
            return "h1";
        case "header2":
            return "h2";
        case "header3":
            return "h3";
        case "header4":
            return "h4";
        case "header5":
            return "h5";
        case "header6":
            return "h6";
        case "paragraph":
            return "p";
        case "unorderedList":
            return "ul";
        case "orderedList":
            return "ol";
        case "listItem":
            return "li";
        case "anchor":
            return "a";
        case "image":
            return "img";
        case "divider":
            return "div";
        case "inlineDivider":
            return "span";
        case "bold":
            return "strong";
        case "italic":
            return "em";
        case "lineBreak":
            return "br";
        case "thematicLineBreak":
            return "hr";
        case "preformattedText":
            return "pre";
        case "code":
            return "code";
        case "quote":
            return "blockquote";
        case "tableRow":
            return "tr";
        case "tableCell":
            return "td";
        case "link":
            return "a";
        case "dropDown":
            return "select";
        case "frame":
            return "iframe";
        default:
            return name;
    }
}

// Safe global holder that +page.svelte will call to set the iframe document.
// Use `window.LuaElement.setDoc(doc)` from Svelte after creating/resetting the iframe.
if (typeof window !== "undefined") {
    window.LuaElement = window.LuaElement || {
        doc: null,
        setDoc(d) {
            this.doc = d;
        },
        clearDoc() {
            this.doc = null;
        },
    };
}

export class LuaElement {
    constructor(tagOrEl, targetDocument = null) {
        this.doc = targetDocument || LuaElement.getDoc();

        if (typeof tagOrEl === "string") {
            const tag = tagOrEl.toString();
            if (tag.toLowerCase() === "script")
                throw new Error("script tags are not allowed!");
            this.el = this.doc.createElement(unsimplifyElementName(tag));
        } else if (tagOrEl && typeof tagOrEl.tagName === "string") {
            this.el = tagOrEl;
            this.doc = tagOrEl.ownerDocument || this.doc;
        } else {
            throw new Error("Invalid argument to LuaElement constructor");
        }
    }

    static getDoc() {
        if (
            typeof window !== "undefined" &&
            window.LuaElement &&
            window.LuaElement.doc
        ) {
            return window.LuaElement.doc;
        }
        return document;
    }

    // --- Chainable methods ---
    setText(value) {
    if (this.el) this.el.textContent = String(value);
    return this;
    }
    getText() {
    if (!this.el) return "";
    return String(this.el.value ?? this.el.textContent ?? "");
    }
    setSrc(value) {
        if ("src" in this.el) this.el.src = String(value);
        return this;
    }

    // ANY element: fn receives `self` (the LuaElement) as argument
    /**
     * Set click handler.
     * - Calls the supplied callback with (elementWrapper, event).
     * - Uses addEventListener so multiple handlers won't clobber each other.
     */
    setOnClick(fn) {
        // remove previous listener if we stored one
        if (this.__clickListener) {
            this.el.removeEventListener("click", this.__clickListener);
            this.__clickListener = null;
        }

        if (!fn) return this;

        // create listener that passes the LuaElement wrapper first
        const listener = (event) => {
            try {
                // Prefer calling as a function: pass (this, event).
                // For Lua functions (wasmoon wrappers) this will pass the element wrapper
                // as the first Lua arg so `function(self)` works.
                fn(this, event);
            } catch (err) {
                // Don't let errors kill the app — log for debugging.
                // If fn is an async function returning a Promise, handle rejection.
                const appendToVisualConsole = (msg) => {
                    if (typeof window !== 'undefined') {
                        const containers = document.getElementsByClassName('console-container');
                        if (containers && containers.length > 0) {
                            const div = document.createElement('div');
                            if (div) div.textContent = msg;
                            div.className = 'console-line';
                            containers[0].appendChild(div);
                            containers[0].scrollTop = containers[0].scrollHeight;
                        }
                    }
                };
                if (err && typeof err.then === "function") {
                    err.catch((e) => {
                        const msg = `setOnClick async error: ${e}`;
                        console.error(msg);
                        appendToVisualConsole(msg);
                    });
                } else {
                    const msg = `setOnClick handler error: ${err}`;
                    console.error(msg);
                    appendToVisualConsole(msg);
                }
            }
        };

        this.__clickListener = listener;
        this.el.addEventListener("click", listener);
        return this;
    }

    pushChild(child) {
        if (child instanceof LuaElement) this.el.appendChild(child.el);
        else this.el.appendChild(child);
        return this;
    }
    pushChildren(children) {
        children.forEach((c) => this.pushChild(c));
        return this;
    }
    setClass(name) {
        this.el.className = String(name);
        return this;
    }
    getClass() {
        return this.el.className;
    }
    setName(name) {
        this.el.id = String(name);
        return this;
    }
    getName() {
        return this.el.id;
    }
    setStyle(style) {
        this.el.style.cssText = style;
        return this;
    }
    hide() {
        this.el.style.display = "none";
        return this;
    }
    show() {
        this.el.style.display = "";
        return this;
    }

    pushElement(container = null) {
        const doc = LuaElement.getDoc();
        if (!doc || !doc.body)
            throw new Error("No target iframe document set.");
        if (!container) doc.body.appendChild(this.el);
        else if (container instanceof LuaElement)
            container.el.appendChild(this.el);
        else container.appendChild(this.el);
        return this;
    }

    static getElementByName(id) {
        const doc = LuaElement.getDoc();
        if (!doc) return null;
        const el = doc.getElementById(id);
        return el ? new LuaElement(el, doc) : null;
    }
}

// dom helper
export const dom = {
    newElement: (tag) => new LuaElement(tag),
    getElementByName: LuaElement.getElementByName,
    setText: (el, val) => el.setText(val),
    getText: (el) => el.getText(),
    setSrc: (el, val) => el.setSrc(val),
    setOnClick: (el, fn) => el.setOnClick(fn),
    pushChild: (parent, child) => parent.pushChild(child),
    pushChildren: (parent, children) => parent.pushChildren(children),
    pushElement: (el) => el.pushElement(),
    setClass: (el, cls) => el.setClass(cls),
    getClass: (el) => el.getClass(),
    setName: (el, name) => el.setName(name),
    getName: (el) => el.getName(),
    setStyle: (el, style) => el.setStyle(style),
    hide: (el) => el.hide(),
    show: (el) => el.show(),
};
