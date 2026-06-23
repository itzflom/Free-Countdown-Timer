// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: hourglass-half;

/*
  Free Countdown Timer  —  a Scriptable countdown app + Home Screen widget.

  TWO MODES (the same single file):
   1. Tap the script in Scriptable, OR tap the widget on your Home Screen
      -> opens a full-screen, ANIMATED, live countdown app where you can:
         - add / edit / delete events (date + time)
         - see years - months - days - hours - minutes - SECONDS tick live
         - pick from dozens of backgrounds (solid, gradient, animated)
         - choose units to show, and switch Default <-> Custom layout
         - in Custom layout, DRAG each piece of text anywhere you like
   2. Add it as a Home Screen widget -> shows a still snapshot of one event
      using the background + layout you chose.

  Note (an iOS rule, true for every widget app): Home Screen widgets cannot
  animate or tick every second — that lives in the app view you get when you
  tap the widget. The widget snapshot is accurate to the minute.
*/

const STORE_FILE = "countdown-events.json"

// ----------------------------------------------------------------------------
// Background themes — lots of variety. `anim` only animates in the app view;
// the widget uses the same colors as a still gradient.
// ----------------------------------------------------------------------------
const THEMES = [
  { id: "midnight",   name: "Midnight",    colors: ["#1c1c1e", "#2c2c2e"], angle: 160, anim: "none" },
  { id: "ocean",      name: "Ocean",       colors: ["#0a2a43", "#1e6091"], angle: 160, anim: "gradient" },
  { id: "sunset",     name: "Sunset",      colors: ["#ff512f", "#dd2476"], angle: 160, anim: "gradient" },
  { id: "aurora",     name: "Aurora",      colors: ["#1d4350", "#a43931"], angle: 160, anim: "aurora" },
  { id: "grape",      name: "Grape",       colors: ["#4776e6", "#8e54e9"], angle: 160, anim: "gradient" },
  { id: "mint",       name: "Mint",        colors: ["#0f3443", "#34e89e"], angle: 160, anim: "gradient" },
  { id: "ember",      name: "Ember",       colors: ["#200122", "#6f0000"], angle: 160, anim: "pulse" },
  { id: "peach",      name: "Peach",       colors: ["#ed4264", "#ffedbc"], angle: 160, anim: "gradient" },
  { id: "forest",     name: "Forest",      colors: ["#134e5e", "#71b280"], angle: 160, anim: "gradient" },
  { id: "royal",      name: "Royal",       colors: ["#141e30", "#243b55"], angle: 160, anim: "none" },
  { id: "candy",      name: "Candy",       colors: ["#fc466b", "#3f5efb"], angle: 160, anim: "gradient" },
  { id: "gold",       name: "Gold",        colors: ["#b79891", "#94716b"], angle: 160, anim: "none" },
  { id: "neon",       name: "Neon",        colors: ["#00c3ff", "#ffff1c"], angle: 160, anim: "gradient" },
  { id: "berry",      name: "Berry",       colors: ["#5f2c82", "#49a09d"], angle: 160, anim: "gradient" },
  { id: "lava",       name: "Lava",        colors: ["#ff0000", "#000000"], angle: 160, anim: "pulse" },
  { id: "sky",        name: "Sky",         colors: ["#2980b9", "#6dd5fa"], angle: 160, anim: "gradient" },
  { id: "rose",       name: "Rose",        colors: ["#642b73", "#c6426e"], angle: 160, anim: "gradient" },
  { id: "graphite",   name: "Graphite",    colors: ["#232526", "#414345"], angle: 160, anim: "none" },
  { id: "tropic",     name: "Tropic",      colors: ["#00b09b", "#96c93d"], angle: 160, anim: "aurora" },
  { id: "blush",      name: "Blush",       colors: ["#e96443", "#904e95"], angle: 160, anim: "gradient" },
  { id: "deepsea",    name: "Deep Sea",    colors: ["#000428", "#004e92"], angle: 160, anim: "stars" },
  { id: "cocoa",      name: "Cocoa",       colors: ["#3e1e08", "#a05e2b"], angle: 160, anim: "none" },
  { id: "ultraviolet",name: "Ultraviolet", colors: ["#654ea3", "#eaafc8"], angle: 160, anim: "gradient" },
  { id: "ink",        name: "Ink",         colors: ["#000000", "#434343"], angle: 160, anim: "none" },
  { id: "solid-black",name: "Solid Black", colors: ["#000000", "#000000"], angle: 0,   anim: "none" },
  { id: "solid-blue", name: "Solid Blue",  colors: ["#0a84ff", "#0a84ff"], angle: 0,   anim: "none" },
  { id: "solid-green",name: "Solid Green", colors: ["#30d158", "#30d158"], angle: 0,   anim: "none" },
  { id: "solid-pink", name: "Solid Pink",  colors: ["#ff375f", "#ff375f"], angle: 0,   anim: "none" }
]

function themeById(id) {
  return THEMES.find(t => t.id === id) || THEMES[0]
}

// Default layout for a brand new event.
function defaultEvent(title, targetISO, fromISO) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    title: title,
    targetDate: targetISO,
    countingFrom: fromISO,
    themeId: "midnight",
    customColors: null,          // {colors:[a,b], angle} when theme === "custom"
    accent: "#ffffff",
    units: { years: false, months: false, days: true, hours: true, minutes: true, seconds: false },
    layoutMode: "default",       // "default" | "custom"
    custom: {                    // normalized 0..1 positions for the widget snapshot
      title: { x: 0.08, y: 0.12, size: 12, align: "left" },
      value: { x: 0.08, y: 0.42, size: 34, align: "left" },
      sub:   { x: 0.08, y: 0.66, size: 13, align: "left" }
    }
  }
}

// ----------------------------------------------------------------------------
// Storage (shared by the app view and the widget)
// ----------------------------------------------------------------------------
function fm() {
  try { return FileManager.iCloud() } catch (e) { return FileManager.local() }
}
function storePath() {
  const m = fm()
  return m.joinPath(m.documentsDirectory(), STORE_FILE)
}
function loadEvents() {
  const m = fm()
  const p = storePath()
  if (!m.fileExists(p)) return []
  try {
    const data = JSON.parse(m.readString(p))
    if (!Array.isArray(data.events)) return []
    // migrate older/partial records so nothing crashes
    return data.events.map(e => Object.assign(defaultEvent(e.title, e.targetDate, e.countingFrom), e))
  } catch (e) { return [] }
}
function saveEvents(events) {
  fm().writeString(storePath(), JSON.stringify({ events }, null, 2))
}
function findEvent(param) {
  const events = loadEvents()
  if (events.length === 0) return null
  if (param) {
    const t = String(param).trim()
    const i = parseInt(t, 10)
    if (!isNaN(i) && i >= 1 && i <= events.length) return events[i - 1]
    const lower = t.toLowerCase()
    return events.find(e => e.title.toLowerCase() === lower) ||
           events.find(e => e.title.toLowerCase().includes(lower)) ||
           events[0]
  }
  return events[0]
}

// ----------------------------------------------------------------------------
// Countdown math (calendar-aware, full units)
// ----------------------------------------------------------------------------
function fullBreakdown(targetISO, now) {
  const target = new Date(targetISO)
  const past = target.getTime() < now.getTime()
  let a = past ? target : now
  let b = past ? now : target

  let years = b.getFullYear() - a.getFullYear()
  let months = b.getMonth() - a.getMonth()
  let days = b.getDate() - a.getDate()
  let hours = b.getHours() - a.getHours()
  let minutes = b.getMinutes() - a.getMinutes()
  let seconds = b.getSeconds() - a.getSeconds()

  if (seconds < 0) { seconds += 60; minutes -= 1 }
  if (minutes < 0) { minutes += 60; hours -= 1 }
  if (hours < 0) { hours += 24; days -= 1 }
  if (days < 0) {
    const daysInPrevMonth = new Date(b.getFullYear(), b.getMonth(), 0).getDate()
    days += daysInPrevMonth
    months -= 1
  }
  if (months < 0) { months += 12; years -= 1 }

  const totalMs = Math.abs(target.getTime() - now.getTime())
  const totalDays = Math.floor(totalMs / 86400000)

  return { years, months, days, hours, minutes, seconds, totalDays, past }
}

// Build the big "primary" line + the "subtitle" line from the enabled units.
function formatLines(event, bd) {
  const order = [
    ["years", "yr", bd.years],
    ["months", "mo", bd.months],
    ["days", bd.days === 1 ? "day" : "days", event.units.years || event.units.months ? bd.days : bd.totalDays],
    ["hours", "hrs", bd.hours],
    ["minutes", "min", bd.minutes],
    ["seconds", "sec", bd.seconds]
  ]
  const enabled = order.filter(([k]) => event.units[k])
  if (enabled.length === 0) {
    return { primary: `${bd.totalDays} days`, sub: bd.past ? "Counting up" : "" }
  }
  const [pk, pl, pv] = enabled[0]
  const primary = `${pv} ${pl}`
  const sub = enabled.slice(1).map(([k, l, v]) => `${v} ${l}`).join(", ")
  return { primary, sub: sub || (bd.past ? "Counting up" : "") }
}

// ----------------------------------------------------------------------------
// Color helpers
// ----------------------------------------------------------------------------
function hexToRgb(hex) {
  const h = hex.replace("#", "")
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  }
}
function lerpColor(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2)
  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const bl = Math.round(a.b + (b.b - a.b) * t)
  return new Color(`#${[r, g, bl].map(v => v.toString(16).padStart(2, "0")).join("")}`)
}
function eventColors(event) {
  if (event.themeId === "custom" && event.customColors) return event.customColors.colors
  return themeById(event.themeId).colors
}

// ----------------------------------------------------------------------------
// Widget rendering
// ----------------------------------------------------------------------------
// Next :00 / :15 / :30 / :45 boundary after the given time.
function nextQuarterHour(now) {
  const d = new Date(now)
  d.setSeconds(0, 0)
  const next = Math.floor(d.getMinutes() / 15) * 15 + 15
  d.setMinutes(next)
  return d
}

function buildWidget(event, family) {
  const w = new ListWidget()
  // Ask iOS to refresh on the next quarter-hour mark (:00/:15/:30/:45) so the
  // shown minutes line up with how often the system actually redraws widgets.
  w.refreshAfterDate = nextQuarterHour(new Date())

  if (!event) {
    w.backgroundColor = new Color("#1c1c1e")
    const t = w.addText("Open Free Countdown Timer to add an event.")
    t.font = Font.mediumSystemFont(13)
    t.textColor = Color.white()
    return w
  }

  const colors = eventColors(event)
  const bd = fullBreakdown(event.targetDate, new Date())
  // On the widget: never show seconds (it can't tick), and snap minutes down to
  // the nearest 15 so the number always looks current between refreshes.
  const widgetBd = Object.assign({}, bd, {
    seconds: 0,
    minutes: Math.floor(bd.minutes / 15) * 15
  })
  const widgetEvent = Object.assign({}, event, {
    units: Object.assign({}, event.units, { seconds: false })
  })
  const lines = formatLines(widgetEvent, widgetBd)

  const sz = SIZING[family] || SIZING.small

  if (event.layoutMode === "custom") {
    w.backgroundImage = renderCustomImage(event, lines, colors, sz.canvas)
    return w
  }

  // Default layout: native stacks + gradient background
  const grad = new LinearGradient()
  grad.colors = colors.map(c => new Color(c))
  grad.locations = [0, 1]
  grad.startPoint = new Point(0, 0)
  grad.endPoint = new Point(1, 1)
  w.backgroundGradient = grad
  w.setPadding(sz.pad, sz.pad, sz.pad, sz.pad)

  const accent = new Color(event.accent || "#ffffff")

  const title = w.addText(event.title.toUpperCase())
  title.font = Font.boldSystemFont(sz.title)
  title.textColor = new Color(colors[1] === "#000000" ? "#a0a0a5" : "#ffffff", 0.75)
  title.lineLimit = 2

  w.addSpacer()

  const big = w.addText(lines.primary)
  big.font = Font.boldSystemFont(sz.big)
  big.textColor = accent
  big.minimumScaleFactor = 0.5

  if (lines.sub) {
    w.addSpacer(family === "large" ? 4 : 2)
    const sub = w.addText(lines.sub)
    sub.font = Font.mediumSystemFont(sz.sub)
    sub.textColor = new Color(event.accent || "#ffffff", 0.85)
  }

  if (family === "medium" || family === "large") {
    w.addSpacer(family === "large" ? 10 : 6)
    const d = new Date(event.targetDate)
    const meta = w.addText(`${d.toLocaleDateString()}  ·  ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`)
    meta.font = Font.systemFont(sz.meta)
    meta.textColor = new Color(event.accent || "#ffffff", 0.6)
  }

  if (family === "large") w.addSpacer()

  return w
}

// Per-family sizing: fonts, padding, and the custom-layout canvas size (points).
const SIZING = {
  small:  { pad: 16, title: 11, big: 34, sub: 13, meta: 10, canvas: new Size(170, 170) },
  medium: { pad: 16, title: 12, big: 38, sub: 14, meta: 11, canvas: new Size(360, 170) },
  large:  { pad: 24, title: 15, big: 64, sub: 22, meta: 14, canvas: new Size(360, 360) }
}

// Custom layout snapshot: draw gradient + free-positioned text with DrawContext.
function renderCustomImage(event, lines, colors, size) {
  const ctx = new DrawContext()
  ctx.size = size
  ctx.opaque = false
  ctx.respectScreenScale = true

  // vertical gradient background
  const steps = 48
  const sliceH = size.height / steps
  for (let i = 0; i < steps; i++) {
    ctx.setFillColor(lerpColor(colors[0], colors[1], i / (steps - 1)))
    ctx.fillRect(new Rect(0, i * sliceH, size.width, sliceH + 1))
  }

  // Scale fonts with the canvas so custom layouts look proportional at any size
  // (baseline tuned for the 170pt small canvas).
  const scale = Math.min(size.width, size.height) / 170

  const accentHex = event.accent || "#ffffff"
  drawPiece(ctx, event.title.toUpperCase(), event.custom.title, size, "#ffffffcc", false, scale)
  drawPiece(ctx, lines.primary, event.custom.value, size, accentHex, true, scale)
  if (lines.sub) drawPiece(ctx, lines.sub, event.custom.sub, size, accentHex, false, scale)

  return ctx.getImage()
}
function drawPiece(ctx, text, pos, size, hex, bold, scale) {
  const fontSize = (pos.size || 16) * (scale || 1)
  ctx.setFont(bold ? Font.boldSystemFont(fontSize) : Font.mediumSystemFont(fontSize))
  ctx.setTextColor(new Color(hex.length > 7 ? hex.substring(0, 7) : hex, hex.length > 7 ? parseInt(hex.substring(7), 16) / 255 : 1))
  const x = pos.x * size.width
  const y = pos.y * size.height
  const rect = new Rect(x, y, size.width - x - 4, fontSize * 1.6)
  if (pos.align === "center") ctx.setTextAlignedCenter()
  else if (pos.align === "right") ctx.setTextAlignedRight()
  else ctx.setTextAlignedLeft()
  ctx.drawTextInRect(text, rect)
}

// ----------------------------------------------------------------------------
// In-app experience: a full animated web app inside a WebView
// ----------------------------------------------------------------------------
async function runApp() {
  const events = loadEvents()
  const payload = JSON.stringify({ events, themes: THEMES })
  const html = APP_HTML.replace("/*__INIT__*/", `window.__BOOT__ = ${payload};`)

  const wv = new WebView()
  await wv.loadHTML(html)
  await wv.present(true)

  // Read whatever the user saved, after the view is dismissed.
  try {
    const out = await wv.evaluateJavaScript("JSON.stringify(window.__STATE__ || null)")
    if (out && out !== "null") {
      const parsed = JSON.parse(out)
      if (parsed && Array.isArray(parsed.events)) saveEvents(parsed.events)
    }
  } catch (e) { /* user closed without changes */ }
}

// ----------------------------------------------------------------------------
// The web app (HTML + CSS + JS). Animated, live, drag-to-customize.
// ----------------------------------------------------------------------------
const APP_HTML = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  :root { --bg1:#1c1c1e; --bg2:#2c2c2e; --accent:#ffffff; }
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  html,body { margin:0; height:100%; font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif; color:#fff; background:#000; overflow:hidden; }
  #app { height:100%; display:flex; flex-direction:column; }
  .bg { position:fixed; inset:0; z-index:-2; background:linear-gradient(160deg,var(--bg1),var(--bg2)); background-size:200% 200%; }
  .bg.gradient { animation:flow 12s ease infinite; }
  .bg.aurora { animation:flow 8s ease-in-out infinite, hue 14s linear infinite; }
  .bg.pulse  { animation:pulse 5s ease-in-out infinite; }
  .bg.stars::after { content:""; position:absolute; inset:0; background-image:radial-gradient(2px 2px at 20% 30%,#fff,transparent),radial-gradient(2px 2px at 70% 60%,#fff,transparent),radial-gradient(1.5px 1.5px at 40% 80%,#fff,transparent),radial-gradient(1.5px 1.5px at 85% 20%,#fff,transparent); opacity:.5; animation:twinkle 4s ease-in-out infinite; }
  @keyframes flow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes hue { from{filter:hue-rotate(0)} to{filter:hue-rotate(360deg)} }
  @keyframes pulse { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.35)} }
  @keyframes twinkle { 0%,100%{opacity:.25} 50%{opacity:.7} }

  header { display:flex; align-items:center; justify-content:space-between; padding:18px 20px 8px; }
  header h1 { font-size:26px; font-weight:800; margin:0; letter-spacing:-.5px; }
  .btn { border:none; border-radius:22px; padding:10px 16px; font-size:15px; font-weight:600; color:#fff; background:rgba(255,255,255,.16); backdrop-filter:blur(8px); }
  .btn.primary { background:#0a84ff; }
  .btn.round { width:42px; height:42px; padding:0; font-size:24px; line-height:0; border-radius:50%; }
  .btn:active { transform:scale(.94); }
  .content { flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; padding:6px 16px 120px; }

  .card { background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.12); border-radius:22px; padding:18px; margin:12px 0; backdrop-filter:blur(10px); }
  .card .ttl { font-size:12px; font-weight:700; letter-spacing:1px; opacity:.7; text-transform:uppercase; }
  .card .big { font-size:34px; font-weight:800; margin-top:8px; }
  .card .sub { font-size:14px; opacity:.85; margin-top:2px; }

  /* live detail countdown */
  .hero { text-align:center; padding:30px 16px 10px; }
  .hero .name { font-size:13px; letter-spacing:2px; opacity:.7; text-transform:uppercase; }
  .units { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:18px; }
  .unit { min-width:64px; }
  .unit .n { font-size:40px; font-weight:800; font-variant-numeric:tabular-nums; }
  .unit .l { font-size:11px; opacity:.6; text-transform:uppercase; letter-spacing:1px; }

  .sheet { position:fixed; left:0; right:0; bottom:0; max-height:82%; overflow-y:auto; background:rgba(28,28,30,.96); backdrop-filter:blur(20px); border-radius:24px 24px 0 0; padding:18px 18px 40px; transform:translateY(110%); transition:transform .32s cubic-bezier(.2,.8,.2,1); z-index:20; }
  .sheet.open { transform:translateY(0); }
  .sheet h2 { margin:6px 0 14px; font-size:20px; }
  label.row { display:block; font-size:13px; opacity:.7; margin:14px 0 6px; }
  input[type=text], input[type=datetime-local] { width:100%; padding:13px; border-radius:14px; border:none; background:rgba(255,255,255,.12); color:#fff; font-size:16px; }
  .swatches { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:8px; }
  .sw { height:54px; border-radius:14px; border:2px solid transparent; position:relative; overflow:hidden; }
  .sw.sel { border-color:#fff; }
  .sw span { position:absolute; bottom:4px; left:6px; font-size:9px; opacity:.85; }
  .chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
  .chip { padding:9px 14px; border-radius:18px; background:rgba(255,255,255,.12); font-size:14px; }
  .chip.on { background:#0a84ff; }
  .seg { display:flex; background:rgba(255,255,255,.10); border-radius:14px; padding:4px; margin-top:8px; }
  .seg div { flex:1; text-align:center; padding:9px; border-radius:11px; font-size:14px; font-weight:600; }
  .seg div.on { background:rgba(255,255,255,.22); }
  .actions { display:flex; gap:10px; margin-top:22px; }
  .actions .btn { flex:1; text-align:center; }
  .danger { background:rgba(255,59,48,.25); color:#ff7a70; }

  /* drag editor */
  #stage { position:relative; width:260px; height:260px; margin:14px auto 4px; border-radius:22px; overflow:hidden; border:1px solid rgba(255,255,255,.2); }
  .drag { position:absolute; cursor:grab; font-weight:800; white-space:nowrap; padding:2px 4px; touch-action:none; }
  .drag.t { font-size:12px; opacity:.8; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
  .drag.v { font-size:30px; }
  .drag.s { font-size:14px; opacity:.9; }
  .hint { text-align:center; font-size:12px; opacity:.6; margin-top:4px; }
  .empty { text-align:center; opacity:.55; margin-top:80px; font-size:16px; }
</style>
</head>
<body>
<div class="bg" id="bg"></div>
<div id="app">
  <header>
    <h1 id="hTitle">My Events</h1>
    <div id="hActions"></div>
  </header>
  <div class="content" id="content"></div>
</div>

<div class="sheet" id="sheet"></div>

<script>
/*__INIT__*/
const BOOT = window.__BOOT__ || { events: [], themes: [] };
const THEMES = BOOT.themes;
let state = { events: BOOT.events.map(e => JSON.parse(JSON.stringify(e))) };
window.__STATE__ = state;          // Scriptable reads this back on close
let view = "list";                 // "list" | "detail"
let currentId = null;
let ticker = null;

function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2); }
function themeById(id){ return THEMES.find(t=>t.id===id) || THEMES[0]; }
function colorsOf(ev){ return (ev.themeId==="custom"&&ev.customColors)?ev.customColors.colors:themeById(ev.themeId).colors; }
function animOf(ev){ return (ev.themeId==="custom")?"gradient":themeById(ev.themeId).anim; }
function newDefault(){
  const now=new Date(); const tgt=new Date(now.getTime()+30*86400000);
  return { id:uid(), title:"New Countdown", targetDate:isoLocal(tgt), countingFrom:isoLocal(now),
    themeId:"midnight", customColors:null, accent:"#ffffff",
    units:{years:false,months:false,days:true,hours:true,minutes:true,seconds:false},
    layoutMode:"default",
    custom:{ title:{x:.08,y:.12,size:12,align:"left"}, value:{x:.08,y:.42,size:34,align:"left"}, sub:{x:.08,y:.66,size:13,align:"left"} } };
}
function isoLocal(d){ const p=n=>String(n).padStart(2,"0"); return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"T"+p(d.getHours())+":"+p(d.getMinutes()); }

function breakdown(targetISO){
  const target=new Date(targetISO), now=new Date();
  const past=target<now; let a=past?target:now, b=past?now:target;
  let y=b.getFullYear()-a.getFullYear(), mo=b.getMonth()-a.getMonth(), d=b.getDate()-a.getDate(),
      h=b.getHours()-a.getHours(), mi=b.getMinutes()-a.getMinutes(), s=b.getSeconds()-a.getSeconds();
  if(s<0){s+=60;mi--;} if(mi<0){mi+=60;h--;} if(h<0){h+=24;d--;}
  if(d<0){ d+=new Date(b.getFullYear(),b.getMonth(),0).getDate(); mo--; } if(mo<0){mo+=12;y--;}
  const totalDays=Math.floor(Math.abs(target-now)/86400000);
  return {years:y,months:mo,days:d,hours:h,minutes:mi,seconds:s,totalDays,past};
}
function applyBg(ev){
  const c=colorsOf(ev), bg=document.getElementById("bg");
  document.documentElement.style.setProperty("--bg1",c[0]);
  document.documentElement.style.setProperty("--bg2",c[1]);
  document.documentElement.style.setProperty("--accent",ev.accent||"#fff");
  bg.className="bg "+animOf(ev);
}

// ---------- LIST ----------
function renderList(){
  view="list"; currentId=null; clearInterval(ticker);
  document.getElementById("hTitle").textContent="My Events";
  document.getElementById("hActions").innerHTML='<button class="btn round primary" onclick="addEvent()">+</button>';
  applyBg(state.events[0]||{themeId:"midnight",accent:"#fff"});
  const c=document.getElementById("content");
  if(state.events.length===0){ c.innerHTML='<div class="empty">No events yet.<br>Tap + to add your first countdown.</div>'; return; }
  c.innerHTML=state.events.map((ev,i)=>{
    const b=breakdown(ev.targetDate), L=lines(ev,b), col=colorsOf(ev);
    return '<div class="card" style="background:linear-gradient(160deg,'+col[0]+','+col[1]+')" onclick="openDetail(\''+ev.id+'\')">'+
      '<div class="ttl">'+esc(ev.title)+'</div>'+
      '<div class="big">'+L.primary+'</div>'+
      (L.sub?'<div class="sub">'+L.sub+'</div>':'')+
      '<div class="sub" style="opacity:.5;margin-top:8px;font-size:11px">Widget parameter: "'+esc(ev.title)+'"  (or '+(i+1)+')</div>'+
    '</div>';
  }).join("");
}
function lines(ev,b){
  const order=[["years","yr",b.years],["months","mo",b.months],
    ["days",b.days===1?"day":"days",(ev.units.years||ev.units.months)?b.days:b.totalDays],
    ["hours","hrs",b.hours],["minutes","min",b.minutes],["seconds","sec",b.seconds]];
  const on=order.filter(o=>ev.units[o[0]]);
  if(!on.length) return {primary:b.totalDays+" days",sub:b.past?"Counting up":""};
  return {primary:on[0][2]+" "+on[0][1], sub:on.slice(1).map(o=>o[2]+" "+o[1]).join(", ")||(b.past?"Counting up":"")};
}
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

// ---------- DETAIL (live) ----------
function openDetail(id){
  view="detail"; currentId=id;
  const ev=state.events.find(e=>e.id===id); applyBg(ev);
  document.getElementById("hTitle").textContent="";
  document.getElementById("hActions").innerHTML='<button class="btn" onclick="renderList()">Done</button>';
  const c=document.getElementById("content");
  c.innerHTML='<div class="hero"><div class="name">'+esc(ev.title)+'</div><div class="units" id="units"></div></div>'+
    '<div style="text-align:center;margin-top:26px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'+
      '<button class="btn" onclick="editEvent()">Edit</button>'+
      '<button class="btn" onclick="customize()">Customize</button>'+
      '<button class="btn" onclick="layoutEditor()">Layout</button>'+
    '</div>';
  tick(); clearInterval(ticker); ticker=setInterval(tick,1000);
}
function tick(){
  const ev=state.events.find(e=>e.id===currentId); if(!ev) return;
  const b=breakdown(ev.targetDate);
  const defs=[["years","Years"],["months","Months"],["days","Days"],["hours","Hours"],["minutes","Minutes"],["seconds","Seconds"]];
  let on=defs.filter(d=>ev.units[d[0]]); if(!on.length) on=[["days","Days"],["hours","Hours"],["minutes","Minutes"],["seconds","Seconds"]];
  document.getElementById("units").innerHTML=on.map(d=>{
    let v=b[d[0]]; if(d[0]==="days"&&!(ev.units.years||ev.units.months)) v=b.totalDays;
    return '<div class="unit"><div class="n" style="color:var(--accent)">'+v+'</div><div class="l">'+d[1]+'</div></div>';
  }).join("");
}

// ---------- SHEETS ----------
function openSheet(html){ const s=document.getElementById("sheet"); s.innerHTML=html; s.classList.add("open"); }
function closeSheet(){ document.getElementById("sheet").classList.remove("open"); }

function addEvent(){ const ev=newDefault(); state.events.push(ev); persist(); openDetail(ev.id); editEvent(); }

function editEvent(){
  const ev=state.events.find(e=>e.id===currentId);
  openSheet(
    '<h2>Edit event</h2>'+
    '<label class="row">Title</label><input type="text" id="fTitle" value="'+esc(ev.title)+'">'+
    '<label class="row">Counts down to</label><input type="datetime-local" id="fTarget" value="'+ev.targetDate.slice(0,16)+'">'+
    '<label class="row">Counting from</label><input type="datetime-local" id="fFrom" value="'+ev.countingFrom.slice(0,16)+'">'+
    '<div class="actions"><button class="btn danger" onclick="delEvent()">Delete</button>'+
    '<button class="btn primary" onclick="saveEdit()">Save</button></div>');
}
function saveEdit(){
  const ev=state.events.find(e=>e.id===currentId);
  ev.title=document.getElementById("fTitle").value||"Untitled";
  ev.targetDate=document.getElementById("fTarget").value||ev.targetDate;
  ev.countingFrom=document.getElementById("fFrom").value||ev.countingFrom;
  persist(); closeSheet(); openDetail(ev.id);
}
function delEvent(){
  state.events=state.events.filter(e=>e.id!==currentId); persist(); closeSheet(); renderList();
}

function customize(){
  const ev=state.events.find(e=>e.id===currentId);
  const sw=THEMES.map(t=>'<div class="sw'+((ev.themeId===t.id)?' sel':'')+'" style="background:linear-gradient(160deg,'+t.colors[0]+','+t.colors[1]+')" onclick="setTheme(\''+t.id+'\')"><span>'+t.name+'</span></div>').join("");
  const units=[["years","Years"],["months","Months"],["days","Days"],["hours","Hours"],["minutes","Minutes"],["seconds","Seconds"]]
    .map(u=>'<div class="chip'+(ev.units[u[0]]?' on':'')+'" onclick="toggleUnit(\''+u[0]+'\')">'+u[1]+'</div>').join("");
  openSheet(
    '<h2>Customize</h2>'+
    '<label class="row">Background</label><div class="swatches">'+sw+'</div>'+
    '<label class="row">Custom colors</label>'+
    '<div style="display:flex;gap:10px;align-items:center">'+
      '<input type="color" id="cA" value="'+colorsOf(ev)[0]+'" oninput="customColor()" style="width:48px;height:40px;border:none;background:none">'+
      '<input type="color" id="cB" value="'+colorsOf(ev)[1]+'" oninput="customColor()" style="width:48px;height:40px;border:none;background:none">'+
      '<span style="opacity:.6;font-size:13px">two-color gradient</span></div>'+
    '<label class="row">Text color</label>'+
      '<input type="color" id="cAccent" value="'+(ev.accent||"#ffffff")+'" oninput="setAccent()" style="width:48px;height:40px;border:none;background:none">'+
    '<label class="row">Units to show</label><div class="chips">'+units+'</div>'+
    '<label class="row">Widget layout</label>'+
      '<div class="seg"><div class="'+(ev.layoutMode==="default"?"on":"")+'" onclick="setLayout(\'default\')">Default</div>'+
      '<div class="'+(ev.layoutMode==="custom"?"on":"")+'" onclick="setLayout(\'custom\')">Custom</div></div>'+
    '<div class="actions"><button class="btn primary" onclick="closeSheet()">Done</button></div>');
}
function setTheme(id){ const ev=cur(); ev.themeId=id; ev.customColors=null; applyBg(ev); persist(); customize(); }
function customColor(){ const ev=cur(); ev.themeId="custom"; ev.customColors={colors:[document.getElementById("cA").value,document.getElementById("cB").value],angle:160}; applyBg(ev); persist(); }
function setAccent(){ const ev=cur(); ev.accent=document.getElementById("cAccent").value; applyBg(ev); persist(); }
function toggleUnit(k){ const ev=cur(); ev.units[k]=!ev.units[k]; persist(); customize(); if(view==="detail")tick(); }
function setLayout(m){ const ev=cur(); ev.layoutMode=m; persist(); customize(); if(m==="custom") setTimeout(layoutEditor,260); }
function cur(){ return state.events.find(e=>e.id===currentId); }

// ---------- DRAG LAYOUT EDITOR ----------
function layoutEditor(){
  const ev=cur(); ev.layoutMode="custom"; const col=colorsOf(ev), b=breakdown(ev.targetDate), L=lines(ev,b);
  openSheet('<h2>Custom layout</h2><div class="hint">Drag each piece where you want it on the widget.</div>'+
    '<div id="stage" style="background:linear-gradient(160deg,'+col[0]+','+col[1]+')">'+
      piece("t",ev.custom.title,esc(ev.title).toUpperCase(),ev.accent)+
      piece("v",ev.custom.value,L.primary,ev.accent)+
      (L.sub?piece("s",ev.custom.sub,L.sub,ev.accent):"")+
    '</div>'+
    '<div class="actions"><button class="btn" onclick="resetLayout()">Reset</button>'+
    '<button class="btn primary" onclick="closeSheet()">Done</button></div>');
  setupDrag();
}
function piece(cls,pos,text,accent){
  return '<div class="drag '+cls+'" data-k="'+(cls==="t"?"title":cls==="v"?"value":"sub")+'" style="left:'+(pos.x*100)+'%;top:'+(pos.y*100)+'%;color:'+(accent||"#fff")+'">'+text+'</div>';
}
function setupDrag(){
  const stage=document.getElementById("stage"); const ev=cur();
  stage.querySelectorAll(".drag").forEach(el=>{
    el.addEventListener("touchstart",start,{passive:false});
    el.addEventListener("mousedown",start);
    function start(e){ e.preventDefault(); const move= me=>{
        const r=stage.getBoundingClientRect(); const p=me.touches?me.touches[0]:me;
        let x=(p.clientX-r.left)/r.width, y=(p.clientY-r.top)/r.height;
        x=Math.max(0,Math.min(.95,x)); y=Math.max(0,Math.min(.92,y));
        el.style.left=(x*100)+"%"; el.style.top=(y*100)+"%";
        ev.custom[el.dataset.k].x=x; ev.custom[el.dataset.k].y=y;
      };
      const end=()=>{ persist(); document.removeEventListener("touchmove",move); document.removeEventListener("mousemove",move); document.removeEventListener("touchend",end); document.removeEventListener("mouseup",end); };
      document.addEventListener("touchmove",move,{passive:false}); document.addEventListener("mousemove",move);
      document.addEventListener("touchend",end); document.addEventListener("mouseup",end);
    }
  });
}
function resetLayout(){ const ev=cur(); ev.custom={title:{x:.08,y:.12,size:12,align:"left"},value:{x:.08,y:.42,size:34,align:"left"},sub:{x:.08,y:.66,size:13,align:"left"}}; persist(); layoutEditor(); }

function persist(){ window.__STATE__=state; }
renderList();
</script>
</body>
</html>`

// ----------------------------------------------------------------------------
// Entry point (kept at the very bottom so every const above is initialized
// before it runs — Scriptable executes the file top to bottom).
// ----------------------------------------------------------------------------
if (config.runsInWidget) {
  Script.setWidget(buildWidget(findEvent(args.widgetParameter), config.widgetFamily || "small"))
  Script.complete()
} else {
  await runApp()
  Script.complete()
}
