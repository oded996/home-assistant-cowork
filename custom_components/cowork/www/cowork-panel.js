/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const z = globalThis, J = z.ShadowRoot && (z.ShadyCSS === void 0 || z.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Z = Symbol(), ee = /* @__PURE__ */ new WeakMap();
let pe = class {
  constructor(e, t, s) {
    if (this._$cssResult$ = !0, s !== Z) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (J && e === void 0) {
      const s = t !== void 0 && t.length === 1;
      s && (e = ee.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && ee.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const me = (o) => new pe(typeof o == "string" ? o : o + "", void 0, Z), ue = (o, ...e) => {
  const t = o.length === 1 ? o[0] : e.reduce((s, r, n) => s + ((i) => {
    if (i._$cssResult$ === !0) return i.cssText;
    if (typeof i == "number") return i;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + i + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + o[n + 1], o[0]);
  return new pe(t, o, Z);
}, ve = (o, e) => {
  if (J) o.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const s = document.createElement("style"), r = z.litNonce;
    r !== void 0 && s.setAttribute("nonce", r), s.textContent = t.cssText, o.appendChild(s);
  }
}, te = J ? (o) => o : (o) => o instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const s of e.cssRules) t += s.cssText;
  return me(t);
})(o) : o;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: be, defineProperty: xe, getOwnPropertyDescriptor: Ae, getOwnPropertyNames: we, getOwnPropertySymbols: Ee, getPrototypeOf: Ce } = Object, $ = globalThis, se = $.trustedTypes, Se = se ? se.emptyScript : "", B = $.reactiveElementPolyfillSupport, P = (o, e) => o, L = { toAttribute(o, e) {
  switch (e) {
    case Boolean:
      o = o ? Se : null;
      break;
    case Object:
    case Array:
      o = o == null ? o : JSON.stringify(o);
  }
  return o;
}, fromAttribute(o, e) {
  let t = o;
  switch (e) {
    case Boolean:
      t = o !== null;
      break;
    case Number:
      t = o === null ? null : Number(o);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(o);
      } catch {
        t = null;
      }
  }
  return t;
} }, G = (o, e) => !be(o, e), re = { attribute: !0, type: String, converter: L, reflect: !1, useDefault: !1, hasChanged: G };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), $.litPropertyMetadata ?? ($.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let E = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = re) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const s = Symbol(), r = this.getPropertyDescriptor(e, s, t);
      r !== void 0 && xe(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, t, s) {
    const { get: r, set: n } = Ae(this.prototype, e) ?? { get() {
      return this[t];
    }, set(i) {
      this[t] = i;
    } };
    return { get: r, set(i) {
      const a = r == null ? void 0 : r.call(this);
      n == null || n.call(this, i), this.requestUpdate(e, a, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? re;
  }
  static _$Ei() {
    if (this.hasOwnProperty(P("elementProperties"))) return;
    const e = Ce(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(P("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(P("properties"))) {
      const t = this.properties, s = [...we(t), ...Ee(t)];
      for (const r of s) this.createProperty(r, t[r]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [s, r] of t) this.elementProperties.set(s, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, s] of this.elementProperties) {
      const r = this._$Eu(t, s);
      r !== void 0 && this._$Eh.set(r, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const s = new Set(e.flat(1 / 0).reverse());
      for (const r of s) t.unshift(te(r));
    } else e !== void 0 && t.push(te(e));
    return t;
  }
  static _$Eu(e, t) {
    const s = t.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((t) => t(this));
  }
  addController(e) {
    var t;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((t = e.hostConnected) == null || t.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$EO) == null || t.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const s of t.keys()) this.hasOwnProperty(s) && (e.set(s, this[s]), delete this[s]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ve(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var s;
      return (s = t.hostConnected) == null ? void 0 : s.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var s;
      return (s = t.hostDisconnected) == null ? void 0 : s.call(t);
    });
  }
  attributeChangedCallback(e, t, s) {
    this._$AK(e, s);
  }
  _$ET(e, t) {
    var n;
    const s = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, s);
    if (r !== void 0 && s.reflect === !0) {
      const i = (((n = s.converter) == null ? void 0 : n.toAttribute) !== void 0 ? s.converter : L).toAttribute(t, s.type);
      this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var n, i;
    const s = this.constructor, r = s._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const a = s.getPropertyOptions(r), l = typeof a.converter == "function" ? { fromAttribute: a.converter } : ((n = a.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? a.converter : L;
      this._$Em = r;
      const p = l.fromAttribute(t, a.type);
      this[r] = p ?? ((i = this._$Ej) == null ? void 0 : i.get(r)) ?? p, this._$Em = null;
    }
  }
  requestUpdate(e, t, s, r = !1, n) {
    var i;
    if (e !== void 0) {
      const a = this.constructor;
      if (r === !1 && (n = this[e]), s ?? (s = a.getPropertyOptions(e)), !((s.hasChanged ?? G)(n, t) || s.useDefault && s.reflect && n === ((i = this._$Ej) == null ? void 0 : i.get(e)) && !this.hasAttribute(a._$Eu(e, s)))) return;
      this.C(e, t, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: s, reflect: r, wrapped: n }, i) {
    s && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, i ?? t ?? this[e]), n !== !0 || i !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (t = void 0), this._$AL.set(e, t)), r === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var s;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [n, i] of this._$Ep) this[n] = i;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [n, i] of r) {
        const { wrapped: a } = i, l = this[n];
        a !== !0 || this._$AL.has(n) || l === void 0 || this.C(n, void 0, i, l);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (s = this._$EO) == null || s.forEach((r) => {
        var n;
        return (n = r.hostUpdate) == null ? void 0 : n.call(r);
      }), this.update(t)) : this._$EM();
    } catch (r) {
      throw e = !1, this._$EM(), r;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((s) => {
      var r;
      return (r = s.hostUpdated) == null ? void 0 : r.call(s);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((t) => this._$ET(t, this[t]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
E.elementStyles = [], E.shadowRootOptions = { mode: "open" }, E[P("elementProperties")] = /* @__PURE__ */ new Map(), E[P("finalized")] = /* @__PURE__ */ new Map(), B == null || B({ ReactiveElement: E }), ($.reactiveElementVersions ?? ($.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const M = globalThis, ie = (o) => o, D = M.trustedTypes, oe = D ? D.createPolicy("lit-html", { createHTML: (o) => o }) : void 0, ge = "$lit$", y = `lit$${Math.random().toFixed(9).slice(2)}$`, fe = "?" + y, ke = `<${fe}>`, x = document, T = () => x.createComment(""), U = (o) => o === null || typeof o != "object" && typeof o != "function", Q = Array.isArray, Oe = (o) => Q(o) || typeof (o == null ? void 0 : o[Symbol.iterator]) == "function", q = `[ 	
\f\r]`, O = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ne = /-->/g, ae = />/g, m = RegExp(`>|${q}(?:([^\\s"'>=/]+)(${q}*=${q}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), le = /'/g, ce = /"/g, _e = /^(?:script|style|textarea|title)$/i, Pe = (o) => (e, ...t) => ({ _$litType$: o, strings: e, values: t }), C = Pe(1), A = Symbol.for("lit-noChange"), u = Symbol.for("lit-nothing"), de = /* @__PURE__ */ new WeakMap(), v = x.createTreeWalker(x, 129);
function ye(o, e) {
  if (!Q(o) || !o.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return oe !== void 0 ? oe.createHTML(e) : e;
}
const Me = (o, e) => {
  const t = o.length - 1, s = [];
  let r, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", i = O;
  for (let a = 0; a < t; a++) {
    const l = o[a];
    let p, d, c = -1, g = 0;
    for (; g < l.length && (i.lastIndex = g, d = i.exec(l), d !== null); ) g = i.lastIndex, i === O ? d[1] === "!--" ? i = ne : d[1] !== void 0 ? i = ae : d[2] !== void 0 ? (_e.test(d[2]) && (r = RegExp("</" + d[2], "g")), i = m) : d[3] !== void 0 && (i = m) : i === m ? d[0] === ">" ? (i = r ?? O, c = -1) : d[1] === void 0 ? c = -2 : (c = i.lastIndex - d[2].length, p = d[1], i = d[3] === void 0 ? m : d[3] === '"' ? ce : le) : i === ce || i === le ? i = m : i === ne || i === ae ? i = O : (i = m, r = void 0);
    const h = i === m && o[a + 1].startsWith("/>") ? " " : "";
    n += i === O ? l + ke : c >= 0 ? (s.push(p), l.slice(0, c) + ge + l.slice(c) + y + h) : l + y + (c === -2 ? a : h);
  }
  return [ye(o, n + (o[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class R {
  constructor({ strings: e, _$litType$: t }, s) {
    let r;
    this.parts = [];
    let n = 0, i = 0;
    const a = e.length - 1, l = this.parts, [p, d] = Me(e, t);
    if (this.el = R.createElement(p, s), v.currentNode = this.el.content, t === 2 || t === 3) {
      const c = this.el.content.firstChild;
      c.replaceWith(...c.childNodes);
    }
    for (; (r = v.nextNode()) !== null && l.length < a; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const c of r.getAttributeNames()) if (c.endsWith(ge)) {
          const g = d[i++], h = r.getAttribute(c).split(y), W = /([.?@])?(.*)/.exec(g);
          l.push({ type: 1, index: n, name: W[2], strings: h, ctor: W[1] === "." ? Ue : W[1] === "?" ? Re : W[1] === "@" ? He : j }), r.removeAttribute(c);
        } else c.startsWith(y) && (l.push({ type: 6, index: n }), r.removeAttribute(c));
        if (_e.test(r.tagName)) {
          const c = r.textContent.split(y), g = c.length - 1;
          if (g > 0) {
            r.textContent = D ? D.emptyScript : "";
            for (let h = 0; h < g; h++) r.append(c[h], T()), v.nextNode(), l.push({ type: 2, index: ++n });
            r.append(c[g], T());
          }
        }
      } else if (r.nodeType === 8) if (r.data === fe) l.push({ type: 2, index: n });
      else {
        let c = -1;
        for (; (c = r.data.indexOf(y, c + 1)) !== -1; ) l.push({ type: 7, index: n }), c += y.length - 1;
      }
      n++;
    }
  }
  static createElement(e, t) {
    const s = x.createElement("template");
    return s.innerHTML = e, s;
  }
}
function k(o, e, t = o, s) {
  var i, a;
  if (e === A) return e;
  let r = s !== void 0 ? (i = t._$Co) == null ? void 0 : i[s] : t._$Cl;
  const n = U(e) ? void 0 : e._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== n && ((a = r == null ? void 0 : r._$AO) == null || a.call(r, !1), n === void 0 ? r = void 0 : (r = new n(o), r._$AT(o, t, s)), s !== void 0 ? (t._$Co ?? (t._$Co = []))[s] = r : t._$Cl = r), r !== void 0 && (e = k(o, r._$AS(o, e.values), r, s)), e;
}
class Te {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: s } = this._$AD, r = ((e == null ? void 0 : e.creationScope) ?? x).importNode(t, !0);
    v.currentNode = r;
    let n = v.nextNode(), i = 0, a = 0, l = s[0];
    for (; l !== void 0; ) {
      if (i === l.index) {
        let p;
        l.type === 2 ? p = new N(n, n.nextSibling, this, e) : l.type === 1 ? p = new l.ctor(n, l.name, l.strings, this, e) : l.type === 6 && (p = new Ne(n, this, e)), this._$AV.push(p), l = s[++a];
      }
      i !== (l == null ? void 0 : l.index) && (n = v.nextNode(), i++);
    }
    return v.currentNode = x, r;
  }
  p(e) {
    let t = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, t), t += s.strings.length - 2) : s._$AI(e[t])), t++;
  }
}
class N {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, s, r) {
    this.type = 2, this._$AH = u, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = s, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = k(this, e, t), U(e) ? e === u || e == null || e === "" ? (this._$AH !== u && this._$AR(), this._$AH = u) : e !== this._$AH && e !== A && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Oe(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== u && U(this._$AH) ? this._$AA.nextSibling.data = e : this.T(x.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var n;
    const { values: t, _$litType$: s } = e, r = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = R.createElement(ye(s.h, s.h[0]), this.options)), s);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === r) this._$AH.p(t);
    else {
      const i = new Te(r, this), a = i.u(this.options);
      i.p(t), this.T(a), this._$AH = i;
    }
  }
  _$AC(e) {
    let t = de.get(e.strings);
    return t === void 0 && de.set(e.strings, t = new R(e)), t;
  }
  k(e) {
    Q(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let s, r = 0;
    for (const n of e) r === t.length ? t.push(s = new N(this.O(T()), this.O(T()), this, this.options)) : s = t[r], s._$AI(n), r++;
    r < t.length && (this._$AR(s && s._$AB.nextSibling, r), t.length = r);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var s;
    for ((s = this._$AP) == null ? void 0 : s.call(this, !1, !0, t); e !== this._$AB; ) {
      const r = ie(e).nextSibling;
      ie(e).remove(), e = r;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class j {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, s, r, n) {
    this.type = 1, this._$AH = u, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = n, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = u;
  }
  _$AI(e, t = this, s, r) {
    const n = this.strings;
    let i = !1;
    if (n === void 0) e = k(this, e, t, 0), i = !U(e) || e !== this._$AH && e !== A, i && (this._$AH = e);
    else {
      const a = e;
      let l, p;
      for (e = n[0], l = 0; l < n.length - 1; l++) p = k(this, a[s + l], t, l), p === A && (p = this._$AH[l]), i || (i = !U(p) || p !== this._$AH[l]), p === u ? e = u : e !== u && (e += (p ?? "") + n[l + 1]), this._$AH[l] = p;
    }
    i && !r && this.j(e);
  }
  j(e) {
    e === u ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Ue extends j {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === u ? void 0 : e;
  }
}
class Re extends j {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== u);
  }
}
class He extends j {
  constructor(e, t, s, r, n) {
    super(e, t, s, r, n), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = k(this, e, t, 0) ?? u) === A) return;
    const s = this._$AH, r = e === u && s !== u || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, n = e !== u && (s === u || r);
    r && this.element.removeEventListener(this.name, this, s), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Ne {
  constructor(e, t, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    k(this, e);
  }
}
const K = M.litHtmlPolyfillSupport;
K == null || K(R, N), (M.litHtmlVersions ?? (M.litHtmlVersions = [])).push("3.3.2");
const Ie = (o, e, t) => {
  const s = (t == null ? void 0 : t.renderBefore) ?? e;
  let r = s._$litPart$;
  if (r === void 0) {
    const n = (t == null ? void 0 : t.renderBefore) ?? null;
    s._$litPart$ = r = new N(e.insertBefore(T(), n), n, void 0, t ?? {});
  }
  return r._$AI(o), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const b = globalThis;
let S = class extends E {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t;
    const e = super.createRenderRoot();
    return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ie(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(!1);
  }
  render() {
    return A;
  }
};
var he;
S._$litElement$ = !0, S.finalized = !0, (he = b.litElementHydrateSupport) == null || he.call(b, { LitElement: S });
const V = b.litElementPolyfillSupport;
V == null || V({ LitElement: S });
(b.litElementVersions ?? (b.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const We = { attribute: !0, type: String, converter: L, reflect: !1, hasChanged: G }, ze = (o = We, e, t) => {
  const { kind: s, metadata: r } = t;
  let n = globalThis.litPropertyMetadata.get(r);
  if (n === void 0 && globalThis.litPropertyMetadata.set(r, n = /* @__PURE__ */ new Map()), s === "setter" && ((o = Object.create(o)).wrapped = !0), n.set(t.name, o), s === "accessor") {
    const { name: i } = t;
    return { set(a) {
      const l = e.get.call(this);
      e.set.call(this, a), this.requestUpdate(i, l, o, !0, a);
    }, init(a) {
      return a !== void 0 && this.C(i, void 0, o, a), a;
    } };
  }
  if (s === "setter") {
    const { name: i } = t;
    return function(a) {
      const l = this[i];
      e.call(this, a), this.requestUpdate(i, l, o, !0, a);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function w(o) {
  return (e, t) => typeof t == "object" ? ze(o, e, t) : ((s, r, n) => {
    const i = r.hasOwnProperty(n);
    return r.constructor.createProperty(n, s), i ? Object.getOwnPropertyDescriptor(r, n) : void 0;
  })(o, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function I(o) {
  return w({ ...o, state: !0, attribute: !1 });
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Le = { CHILD: 2 }, De = (o) => (...e) => ({ _$litDirective$: o, values: e });
class je {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, t, s) {
    this._$Ct = e, this._$AM = t, this._$Ci = s;
  }
  _$AS(e, t) {
    return this.update(e, t);
  }
  update(e, t) {
    return this.render(...t);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class F extends je {
  constructor(e) {
    if (super(e), this.it = u, e.type !== Le.CHILD) throw Error(this.constructor.directiveName + "() can only be used in child bindings");
  }
  render(e) {
    if (e === u || e == null) return this._t = void 0, this.it = e;
    if (e === A) return e;
    if (typeof e != "string") throw Error(this.constructor.directiveName + "() called with a non-string value");
    if (e === this.it) return this._t;
    this.it = e;
    const t = [e];
    return t.raw = t, this._t = { _$litType$: this.constructor.resultType, strings: t, values: [] };
  }
}
F.directiveName = "unsafeHTML", F.resultType = 1;
const Be = De(F);
var qe = Object.defineProperty, Ke = Object.getOwnPropertyDescriptor, $e = (o, e, t, s) => {
  for (var r = Ke(e, t), n = o.length - 1, i; n >= 0; n--)
    (i = o[n]) && (r = i(e, t, r) || r);
  return r && qe(e, t, r), r;
};
const X = class X extends S {
  constructor() {
    super(...arguments), this._cardElements = [], this._initialized = !1;
  }
  set hass(e) {
    this._hass = e, this._cardElements.forEach((t) => {
      t && (t.hass = e);
    });
  }
  get hass() {
    return this._hass;
  }
  set config(e) {
    JSON.stringify(e) !== JSON.stringify(this._config) && (console.log("CoworkArtifact: config setter called", e), this._config = e, this._initialized && this._createCard());
  }
  get config() {
    return this._config;
  }
  firstUpdated() {
    console.log("CoworkArtifact: firstUpdated"), this._initialized = !0, this._config && this._createCard();
  }
  async _createCard() {
    var t;
    if (!this._config) return;
    const e = (t = this.shadowRoot) == null ? void 0 : t.getElementById("card-container");
    if (!e) {
      console.error("CoworkArtifact: container not found in shadowRoot");
      return;
    }
    try {
      e.innerHTML = "", this._cardElements = [];
      let s;
      window.loadCardHelpers && (s = await window.loadCardHelpers());
      const r = Array.isArray(this._config) ? this._config : [this._config];
      for (const n of r)
        try {
          console.log(`CoworkArtifact: Creating ${n.type} card element`);
          let i = { ...n }, a;
          if (i.type === "automation-proposal") {
            a = document.createElement("div"), a.style.padding = "16px", a.style.fontFamily = "monospace", a.innerHTML = `
                    <div style="margin-bottom: 12px; font-weight: bold; font-family: var(--paper-font-body1_-_font-family); font-size: 14px;">Proposed Automation Change:</div>
                    <div style="background: var(--primary-background-color); padding: 8px; border-radius: 8px; border: 1px solid var(--divider-color); overflow: hidden;">
                        <pre class="diff-block" style="margin: 0; padding: 0; overflow-x: auto; font-size: 13px; white-space: pre; line-height: 1.5; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;"></pre>
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 16px;">
                        <button id="approve-btn" style="flex: 1; padding: 12px; border-radius: 24px; border: none; background-color: var(--success-color, #4caf50); color: white; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Approve Changes</button>
                        <button id="cancel-btn" style="flex: 1; padding: 12px; border-radius: 24px; border: none; background-color: var(--error-color, #f44336); color: white; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Cancel</button>
                    </div>
                `;
            const p = (i.diff || "No changes.").split(/\n|\\n/).map((g) => {
              let h = g;
              return g.includes("@@") && g.includes(".png") && (h = g.replace(/@@.*?@@/, "@@")), h.startsWith("+") ? `<div style="color: var(--success-color, #4caf50); background-color: rgba(76, 175, 80, 0.15); padding: 0 4px;">${h}</div>` : h.startsWith("-") ? `<div style="color: var(--error-color, #f44336); background-color: rgba(244, 67, 54, 0.15); padding: 0 4px;">${h}</div>` : h.startsWith("@@") ? `<div style="color: var(--secondary-text-color); background-color: rgba(var(--rgb-primary-text-color), 0.05); font-style: italic; padding: 0 4px;">${h}</div>` : `<div style="padding: 0 4px; color: var(--primary-text-color); opacity: 0.8;">${h}</div>`;
            });
            a.querySelector("pre").innerHTML = p.join("");
            const d = a.querySelector("#approve-btn"), c = a.querySelector("#cancel-btn");
            d.addEventListener("click", async () => {
              if (this._hass) {
                d.innerText = "Applying...", d.disabled = !0, c.disabled = !0, c.style.opacity = "0.5";
                try {
                  await this._hass.callWS({
                    type: "cowork/approve_proposal",
                    proposal_id: i.proposal_id
                  }), d.innerText = "Approved & Applied!", d.style.backgroundColor = "var(--primary-color)", c.style.display = "none", this.dispatchEvent(new CustomEvent("cowork-send-message", {
                    bubbles: !0,
                    composed: !0,
                    detail: { text: "I have approved and applied the changes. Please confirm completion or proceed with any remaining tasks." }
                  }));
                } catch (g) {
                  d.innerText = "Failed", d.style.backgroundColor = "var(--error-color, #f44336)", c.disabled = !1, c.style.opacity = "1";
                  const h = document.createElement("div");
                  h.style.color = "var(--error-color, #f44336)", h.innerText = g.message || "Unknown error", a.appendChild(h);
                }
              }
            }), c.addEventListener("click", async () => {
              if (this._hass) {
                c.innerText = "Cancelling...", d.disabled = !0, c.disabled = !0, d.style.opacity = "0.5";
                try {
                  await this._hass.callWS({
                    type: "cowork/cancel_proposal",
                    proposal_id: i.proposal_id
                  }), c.innerText = "Cancelled", c.style.backgroundColor = "var(--secondary-text-color)", d.style.display = "none", this.dispatchEvent(new CustomEvent("cowork-send-message", {
                    bubbles: !0,
                    composed: !0,
                    detail: { text: "I have rejected the proposed changes. Please revise them or ask for clarification." }
                  }));
                } catch (g) {
                  c.innerText = "Failed to Cancel", d.disabled = !1, d.style.opacity = "1";
                  const h = document.createElement("div");
                  h.style.color = "var(--error-color, #f44336)", h.innerText = g.message || "Unknown error", a.appendChild(h);
                }
              }
            });
          } else if (s)
            a = await s.createCardElement(i);
          else {
            const l = `hui-${i.type}-card`;
            a = document.createElement(l), a.setConfig && a.setConfig(i);
          }
          this._cardElements.push(a), e.appendChild(a), this._hass && (a.hass = this._hass);
        } catch (i) {
          console.error("CoworkArtifact Item Error:", i);
          const a = document.createElement("div");
          a.className = "error", a.innerText = `Card Error (${n.type}): ${i.message}`, e.appendChild(a);
        }
      console.log("CoworkArtifact: Cards appended successfully");
    } catch (s) {
      console.error("CoworkArtifact Error:", s), e.innerHTML = `<div class="error">Render Error: ${s.message}</div>`;
    }
  }
  render() {
    return C`<div id="card-container"></div>`;
  }
};
X.styles = ue`
    :host {
      display: block;
      margin: 12px 0;
      border-radius: var(--ha-card-border-radius, 12px);
      overflow: hidden;
      background-color: var(--card-background-color);
      box-shadow: var(--ha-card-box-shadow, 0 2px 2px 0 rgba(0,0,0,0.14));
      border: 1px solid var(--divider-color);
      min-height: 50px;
    }
    #card-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .error {
      padding: 16px;
      color: var(--error-color);
    }
  `;
let H = X;
$e([
  w({ attribute: !1 })
], H.prototype, "hass");
$e([
  w({ attribute: !1 })
], H.prototype, "config");
customElements.get("cowork-artifact") || customElements.define("cowork-artifact", H);
var Ve = Object.defineProperty, _ = (o, e, t, s) => {
  for (var r = void 0, n = o.length - 1, i; n >= 0; n--)
    (i = o[n]) && (r = i(e, t, r) || r);
  return r && Ve(e, t, r), r;
};
const Y = class Y extends S {
  constructor() {
    super(...arguments), this._isSending = !1, this._agents = [], this._currentAgentId = "", this._messages = [], this._conversationId = "";
  }
  firstUpdated() {
    var t;
    console.log("Co-Work Panel v3.2.9 Loaded");
    const e = (t = this.shadowRoot) == null ? void 0 : t.getElementById("send-btn-manual");
    e && (e.onclick = () => this._sendMessage()), this._init();
  }
  async _clearHistory() {
    try {
      await this.hass.callWS({ type: "cowork/clear_history" }), this._messages = [], this._conversationId = "", this._addMessage("History cleared. v3.2.9 active.", !1);
    } catch (e) {
      this._addMessage(`Failed to clear history: ${e.message}`, !1);
    }
  }
  updated(e) {
    var t;
    if (super.updated(e), e.has("_messages")) {
      const s = (t = this.shadowRoot) == null ? void 0 : t.getElementById("chat-log");
      s && setTimeout(() => {
        s.scrollTop = s.scrollHeight;
      }, 50);
    }
  }
  async _init() {
    if (!this.hass) {
      setTimeout(() => this._init(), 500);
      return;
    }
    try {
      console.log("COWORK: Calling get_agents...");
      const e = await this.hass.callWS({ type: "cowork/get_agents" });
      console.log("COWORK: agentsRes success", e), this._agents = e.agents || [], console.log("COWORK: Calling get_config...");
      const t = await this.hass.callWS({ type: "cowork/get_config" });
      console.log("COWORK: configRes success", t), this._currentAgentId = t.agent_id || "", console.log("COWORK: Calling get_history...");
      const s = await this.hass.callWS({ type: "cowork/get_history" });
      s.messages && s.messages.length > 0 ? (this._messages = s.messages, this._conversationId = s.conversation_id || "") : this._addMessage("v3.2.9 active. Server history loaded.", !1), this.requestUpdate();
    } catch (e) {
      console.error("COWORK: Init WS error", e), this._addMessage(`WS Error: ${e.message || "Unknown"}. Try reloading integration.`, !1);
    }
  }
  async _handleAgentChange(e) {
    const t = e.target.value;
    console.log("COWORK: UI switching agent to", t), this._currentAgentId = t, this.requestUpdate();
    try {
      await this.hass.callWS({
        type: "cowork/get_config",
        conversation_agent: t
      }), this._addMessage(`Success: Agent set to ${t}`, !1);
    } catch (s) {
      console.error("COWORK: Switch error", s), this._addMessage(`Failed to switch: ${s.message}`, !1);
    }
  }
  _addMessage(e, t, s) {
    this._messages = [...this._messages, { text: e, fromUser: t, ui: s }], this.requestUpdate();
  }
  _formatText(e) {
    if (!e) return "";
    let t = e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return t = t.replace(/```diff\n([\s\S]*?)```/g, (s, r) => `<pre class="diff-block">${r.split(`
`).map((i) => i.startsWith("+") ? `<span style="color: var(--success-color, #4caf50); background-color: rgba(76, 175, 80, 0.1); display: block;">${i}</span>` : i.startsWith("-") ? `<span style="color: var(--error-color, #f44336); background-color: rgba(244, 67, 54, 0.1); display: block;">${i}</span>` : `<span style="display: block;">${i}</span>`).join("")}</pre>`), t = t.replace(/```(?:yaml|json|text)?\n([\s\S]*?)```/g, "<pre>$1</pre>"), t = t.replace(/`([^`]+)`/g, "<code>$1</code>"), Be(t);
  }
  render() {
    return C`
      <div class="header">
        <div class="header-left">
          <span>Co-Work v3.2.9</span>
        </div>
        <div class="header-right">
          <select @change="${this._handleAgentChange}">
            <option value="">Choose Agent...</option>
            ${this._agents.map((e) => C`
              <option value="${e.id}" ?selected="${e.id === this._currentAgentId}">
                ${e.name}
              </option>
            `)}
          </select>
          <button class="clear-btn" @click="${this._clearHistory}">Clear</button>
        </div>
      </div>
      <div id="chat-log">
        ${this._messages.map((e) => C`
          <div class="message-wrapper ${e.fromUser ? "user" : "bot"}">
            ${e.text ? C`<div class="message">${this._formatText(e.text)}</div>` : ""}
            ${e.ui ? C`<cowork-artifact .hass=${this.hass} .config=${e.ui} @cowork-send-message=${(t) => this._sendMessage(t.detail.text)}></cowork-artifact>` : ""}
          </div>
        `)}
      </div>
      <div class="input-area">
        <input 
          id="chat-input-manual"
          type="text" 
          @keydown="${(e) => e.key === "Enter" && this._sendMessage()}"
          placeholder="Type here..."
        />
        <button id="send-btn-manual" class="send-btn">
          ${this._isSending ? "..." : "Send"}
        </button>
      </div>
    `;
  }
  async _sendMessage(e) {
    var r;
    if (this._isSending) return;
    const t = (r = this.shadowRoot) == null ? void 0 : r.getElementById("chat-input-manual");
    let s = e;
    if (!s && t && (s = t.value.trim(), t.value = ""), !!s) {
      this._addMessage(s, !0), this._isSending = !0;
      try {
        const n = { type: "cowork/chat", text: s };
        this._conversationId && (n.conversation_id = this._conversationId);
        const i = await this.hass.callWS(n);
        i.conversation_id && (this._conversationId = i.conversation_id), this._addMessage(i.text, !1, i.ui);
      } catch (n) {
        this._addMessage(`Error: ${n.message}`, !1);
      } finally {
        this._isSending = !1;
      }
    }
  }
};
Y.styles = ue`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: var(--primary-background-color);
      color: var(--primary-text-color);
    }
    .header {
      padding: 8px 16px;
      font-size: 12px;
      color: var(--secondary-text-color);
      border-bottom: 1px solid var(--divider-color);
      background-color: var(--card-background-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left, .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    select {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border: none;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: bold;
      outline: none;
      cursor: pointer;
    }
    .clear-btn {
      background: var(--error-color, #f44336);
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: bold;
      cursor: pointer;
    }
    #chat-log {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .message-wrapper {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 85%;
    }
    .message-wrapper.user {
      align-self: flex-end;
    }
    .message-wrapper.bot {
      align-self: flex-start;
    }
    .message {
      padding: 12px 16px;
      border-radius: 18px;
      line-height: 1.4;
      font-size: 15px;
      background-color: var(--secondary-background-color);
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      white-space: pre-wrap;
    }
    .message pre {
      background: var(--primary-background-color);
      padding: 8px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: monospace;
      font-size: 13px;
      border: 1px solid var(--divider-color);
      margin: 8px 0;
    }
    .message code {
      background: var(--primary-background-color);
      padding: 2px 4px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }
    .user .message {
      background-color: var(--primary-color);
      color: var(--text-primary-color);
    }
    .bot .message {
      border-bottom-left-radius: 4px;
    }
    .input-area {
      padding: 16px;
      display: flex;
      gap: 12px;
      background-color: var(--card-background-color);
      border-top: 1px solid var(--divider-color);
    }
    input {
      flex: 1;
      padding: 12px 16px;
      border-radius: 24px;
      border: 1px solid var(--divider-color);
      background-color: var(--primary-background-color);
      color: var(--primary-text-color);
      font-size: 16px;
    }
    .send-btn {
      padding: 10px 24px;
      border-radius: 24px;
      border: none;
      background-color: var(--primary-color);
      color: var(--text-primary-color);
      cursor: pointer;
      font-weight: 600;
    }
  `;
let f = Y;
_([
  w({ attribute: !1 })
], f.prototype, "hass");
_([
  w({ attribute: !1 })
], f.prototype, "narrow");
_([
  w({ attribute: !1 })
], f.prototype, "route");
_([
  w({ attribute: !1 })
], f.prototype, "panel");
_([
  I()
], f.prototype, "_isSending");
_([
  I()
], f.prototype, "_agents");
_([
  I()
], f.prototype, "_currentAgentId");
_([
  I()
], f.prototype, "_messages");
_([
  I()
], f.prototype, "_conversationId");
customElements.get("cowork-panel") || customElements.define("cowork-panel", f);
export {
  f as CoworkPanel
};
