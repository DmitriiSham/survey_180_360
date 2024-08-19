(function (r, s) {
    typeof exports == "object" && typeof module < "u"
        ? s(exports)
        : typeof define == "function" && define.amd
        ? define(["exports"], s)
        : ((r = typeof globalThis < "u" ? globalThis : r || self),
          s((r.Sample = {})));
})(this, function (r) {
    "use strict";
    var k = Object.defineProperty;
    var C = (r, s, m) =>
        s in r
            ? k(r, s, {
                  enumerable: !0,
                  configurable: !0,
                  writable: !0,
                  value: m,
              })
            : (r[s] = m);
    var n = (r, s, m) => (C(r, typeof s != "symbol" ? s + "" : s, m), m);
    class s {
        constructor() {
            n(this, "htmlEntities", (e) =>
                e
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
            );
            n(this, "attr", (e, t) => (t ? ` ${e}="${t}"` : ""));
            n(this, "jsToCss", (e) =>
                Object.keys(e)
                    .map(
                        (l) =>
                            `${l
                                .split(/(?=[A-Z])/g)
                                .map((c) => c.toLowerCase())
                                .join("-")}: ${e[l]}`
                    )
                    .join("; ")
            );
            n(this, "htmlElement", (e) => {
                const {
                        tag: t,
                        className: i = "",
                        style: l = {},
                        content: o = "",
                        onclick: c = "",
                        onchange: u = "",
                        ...p
                    } = e,
                    h = p,
                    E = Object.keys(h).map((j) => this.attr(j, h[j])),
                    g = this.attr("class", i),
                    y = this.attr("style", this.jsToCss(l)),
                    $ = this.attr("onclick", this.htmlEntities(c)),
                    f = this.attr("onchange", this.htmlEntities(u)),
                    d = `<${[t, ...E, g, y, $, f].join("")}>`,
                    b = `</${t}>`,
                    a = d.replace(/\>$/g, "/>");
                return o ? `${d}${o}${b}` : a;
            });
            n(this, "namedElement", (e, ...t) => {
                if (
                    t &&
                    Object.keys(t).length === 1 &&
                    typeof t[0] == "object"
                ) {
                    const l = { ...t[0], tag: e };
                    return this.element(l);
                } else if (
                    t &&
                    Object.keys(t).length === 1 &&
                    typeof t[0] == "string"
                ) {
                    const l = { content: t[0], tag: e };
                    return this.element(l);
                }
                const i = { tag: e };
                return this.element(i);
            });
            n(this, "html", (e) => {
                const {
                        lang: t = "ru",
                        title: i = "Untitled",
                        css: l = [],
                        scripts: o = [],
                        bodyClass: c = "",
                        bodyStyle: u = {},
                        content: p = "",
                    } = e,
                    h = '<meta charset="UTF-8">',
                    E =
                        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
                    g = this.htmlElement({ tag: "title", content: i }),
                    y = l
                        .map(
                            (a) =>
                                `<link rel="stylesheet" href="${a}" type="text/css" />`
                        )
                        .join(""),
                    $ = o.map((a) => `<script src="${a}"><\/script>`).join(""),
                    f = `${h}${E}${g}${y}${$}`,
                    d = this.htmlElement({
                        tag: "body",
                        className: c,
                        style: u,
                        content: p,
                    });
                return `<!DOCTYPE html>${`<html lang="${t}" data-theme="light">${f}${d}</html>`}`;
            });
            n(this, "element", (e) => this.htmlElement(e));
            n(this, "div", (e, t) =>
                this.namedElement("div", { content: e, ...t })
            );
            n(this, "a", (e, t) =>
                this.namedElement("a", { content: e, ...t })
            );
            n(this, "p", (e, t) =>
                this.namedElement("p", { content: e, ...t })
            );
            n(this, "code", (e, t) =>
                this.namedElement("code", { content: e, ...t })
            );
            n(this, "pre", (e, t) =>
                this.namedElement("pre", { content: e, ...t })
            );
            n(this, "ul", (e, t) =>
                this.namedElement("ul", { content: e, ...t })
            );
            n(this, "ol", (e, t) =>
                this.namedElement("ol", { content: e, ...t })
            );
            n(this, "li", (e, t) =>
                this.namedElement("li", { content: e, ...t })
            );
            n(this, "strong", (e, t) =>
                this.namedElement("strong", { content: e, ...t })
            );
            n(this, "span", (e, t) =>
                this.namedElement("span", { content: e, ...t })
            );
            n(this, "em", (e, t) =>
                this.namedElement("em", { content: e, ...t })
            );
            n(this, "i", (e, t) =>
                this.namedElement("i", { content: e, ...t })
            );
            n(this, "form", (e, t) =>
                this.namedElement("form", { content: e, ...t })
            );
            n(this, "select", (e, t) =>
                this.namedElement("select", { content: e, ...t })
            );
            n(this, "option", (e, t) =>
                this.namedElement("option", { content: e, ...t })
            );
            n(this, "button", (e, t) =>
                this.namedElement("button", { content: e, ...t })
            );
            n(this, "img", (e) => this.namedElement("img", e));
            n(this, "br", () => "<br />");
        }
    }
    (r.Sample = s),
        Object.defineProperty(r, Symbol.toStringTag, { value: "Module" });
});
