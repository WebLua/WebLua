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
                        const payload = { text: String(msg), ts: Date.now(), level: 'error' };
                        try {
                            window.postMessage({ __weblua_console: payload }, '*');
                        } catch (e) {
                            const containers = document.getElementsByClassName('console-container');
                            if (containers && containers.length > 0) {
                                const div = document.createElement('div');
                                if (div) div.textContent = msg;
                                div.className = 'console-line';
                                containers[0].appendChild(div);
                                containers[0].scrollTop = containers[0].scrollHeight;
                            }
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
// --- Utility helpers for dom API ---
function _unwrap(element) {
    if (!element) return null;
    // LuaElement instance
    if (element instanceof LuaElement) return element.el;
    // DOM element
    if (element.nodeType === 1 || element.nodeType === 9) return element;
    // string -> try id
    if (typeof element === "string") {
        const doc = LuaElement.getDoc();
        return doc.getElementById(element) || doc.querySelector(element) || null;
    }
    return null;
}

function _wrap(el) {
    if (!el) return null;
    return new LuaElement(el, el.ownerDocument || LuaElement.getDoc());
}

function logToConsole(text, level = "log") {
    if (typeof window === "undefined") return;
    const payload = { text: String(text), ts: Date.now(), level };
    try {
        window.postMessage({ __weblua_console: payload }, "*");
    } catch (e) {
        // no-op
    }
}

/**
 * Safe DOM helpers exported as `dom`.
 * Methods accept a `LuaElement` or a raw DOM element. Strings are treated as
 * an id or selector when appropriate.
 */
export const dom = {
    newElement: (tag) => new LuaElement(tag),
    getElementByName: LuaElement.getElementByName,
    setText: (element, val) => {
        const el = _unwrap(element);
        if (!el) return null;
        el.textContent = String(val);
        return _wrap(el);
    },
    getText: (element) => {
        const el = _unwrap(element);
        if (!el) return "";
        return String(el.value ?? el.textContent ?? "");
    },
    setSrc: (element, val) => {
        const el = _unwrap(element);
        if (!el) return null;
        if ("src" in el) el.src = String(val);
        return _wrap(el);
    },
    setOnClick: (element, fn) => {
        const el = _unwrap(element);
        if (!el) return null;
        // delegate to LuaElement wrapper to keep behaviour
        const wrapper = new LuaElement(el, el.ownerDocument || LuaElement.getDoc());
        return wrapper.setOnClick(fn);
    },
    pushChild: (parent, child) => {
        const p = _unwrap(parent);
        const c = _unwrap(child) || (child instanceof LuaElement ? child.el : null);
        if (!p || !c) return null;
        p.appendChild(c);
        return _wrap(p);
    },
    pushChildren: (parent, children) => {
        const p = _unwrap(parent);
        if (!p) return null;
        children.forEach((c) => {
            const el = _unwrap(c) || (c instanceof LuaElement ? c.el : null);
            if (el) p.appendChild(el);
        });
        return _wrap(p);
    },
    pushElement: (element) => {
        const el = _unwrap(element) || (element instanceof LuaElement ? element.el : null);
        if (!el) return null;
        const doc = LuaElement.getDoc();
        doc.body.appendChild(el);
        return _wrap(el);
    },
    setClass: (element, cls) => {
        const el = _unwrap(element);
        if (!el) return null;
        el.className = String(cls);
        return _wrap(el);
    },
    getClass: (element) => {
        const el = _unwrap(element);
        return el ? el.className : "";
    },
    setName: (element, name) => {
        const el = _unwrap(element);
        if (!el) return null;
        el.id = String(name);
        return _wrap(el);
    },
    getName: (element) => {
        const el = _unwrap(element);
        return el ? el.id : "";
    },
    setStyle: (element, style) => {
        const el = _unwrap(element);
        if (!el) return null;
        el.style.cssText = style;
        return _wrap(el);
    },
    hide: (element) => {
        const el = _unwrap(element);
        if (!el) return null;
        el.style.display = "none";
        return _wrap(el);
    },
    show: (element) => {
        const el = _unwrap(element);
        if (!el) return null;
        el.style.display = "";
        return _wrap(el);
    },

    /* Attributes */
    setAttr: (element, name, value) => {
        const el = _unwrap(element);
        if (!el) return null;
        if (value === null || value === undefined || value === false) {
            el.removeAttribute(name);
        } else if (value === true) {
            el.setAttribute(name, "");
        } else {
            el.setAttribute(name, String(value));
        }
        return _wrap(el);
    },
    getAttr: (element, name) => {
        const el = _unwrap(element);
        if (!el) return null;
        return el.getAttribute(name);
    },
    removeAttr: (element, name) => {
        const el = _unwrap(element);
        if (!el) return null;
        el.removeAttribute(name);
        return _wrap(el);
    },

    /* Querying */
    find: (rootOrSelector, selector) => {
        const doc = LuaElement.getDoc();
        if (!selector) {
            // only selector provided
            const sel = String(rootOrSelector);
            const found = doc.querySelector(sel);
            return found ? _wrap(found) : null;
        }
        const root = _unwrap(rootOrSelector) || doc;
        const found = root.querySelector(selector);
        return found ? _wrap(found) : null;
    },
    findAll: (rootOrSelector, selector) => {
        const doc = LuaElement.getDoc();
        let nodes;
        if (!selector) {
            nodes = Array.from(doc.querySelectorAll(String(rootOrSelector)));
        } else {
            const root = _unwrap(rootOrSelector) || doc;
            nodes = Array.from(root.querySelectorAll(selector));
        }
        return nodes.map((n) => _wrap(n));
    },

    /* Events */
    on: (element, eventName, fn, options) => {
        const el = _unwrap(element);
        if (!el || typeof eventName !== 'string' || typeof fn !== 'function') return null;
        el.__weblua_listeners = el.__weblua_listeners || {};
        el.__weblua_listeners[eventName] = el.__weblua_listeners[eventName] || [];
        el.addEventListener(eventName, fn, options || false);
        el.__weblua_listeners[eventName].push({ fn, options });
        return () => dom.off(el, eventName, fn);
    },
    off: (element, eventName, fn) => {
        const el = _unwrap(element);
        if (!el || !el.__weblua_listeners) return null;
        if (!eventName) {
            // remove all
            for (const ev in el.__weblua_listeners) {
                el.__weblua_listeners[ev].forEach((r) => el.removeEventListener(ev, r.fn, r.options));
            }
            el.__weblua_listeners = {};
            return null;
        }
        const arr = el.__weblua_listeners[eventName] || [];
        if (!fn) {
            arr.forEach((r) => el.removeEventListener(eventName, r.fn, r.options));
            el.__weblua_listeners[eventName] = [];
            return null;
        }
        // remove matching fn
        for (let i = arr.length - 1; i >= 0; i--) {
            if (arr[i].fn === fn) {
                el.removeEventListener(eventName, arr[i].fn, arr[i].options);
                arr.splice(i, 1);
            }
        }
        return null;
    },
    onOnce: (element, eventName, fn, options) => {
        const el = _unwrap(element);
        if (!el) return null;
        const wrapper = function (e) {
            try { fn(e); } finally { dom.off(el, eventName, wrapper); }
        };
        el.addEventListener(eventName, wrapper, options || false);
        return () => dom.off(el, eventName, wrapper);
    },

    closest: (element, selector) => {
        const el = _unwrap(element);
        if (!el) return null;
        const found = el.closest(selector);
        return found ? _wrap(found) : null;
    },

    toggleClass: (element, className, force) => {
        const el = _unwrap(element);
        if (!el) return null;
        if (typeof force === 'boolean') el.classList.toggle(className, force);
        else el.classList.toggle(className);
        return _wrap(el);
    },

    emit: (element, eventName, detail) => {
        const el = _unwrap(element) || LuaElement.getDoc().body;
        if (!el) return false;
        const ev = new CustomEvent(eventName, { detail: detail ?? null, bubbles: true, cancelable: true });
        return el.dispatchEvent(ev);
    },

    empty: (element) => {
        const el = _unwrap(element);
        if (!el) return null;
        while (el.firstChild) el.removeChild(el.firstChild);
        return _wrap(el);
    },

    serialize: (element) => {
        const el = _unwrap(element);
        if (!el) return '';
        return el.outerHTML || '';
    },

    appendHTML: (element, html) => {
        const el = _unwrap(element) || LuaElement.getDoc().body;
        if (!el) return null;
        const template = (el.ownerDocument || LuaElement.getDoc()).createElement('template');
        template.innerHTML = String(html);
        // remove script tags for safety
        template.content.querySelectorAll('script').forEach((s) => s.remove());
        el.appendChild(template.content.cloneNode(true));
        return _wrap(el);
    },

    /* Logging helper used by other modules */
    logToConsole,
};
