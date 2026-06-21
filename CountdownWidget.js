// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: hourglass-half;

/*
  Free Countdown Timer
  A Scriptable script that works two ways:
   1. Run it from the Scriptable app  -> manage your countdown events
      (add, edit, delete, preview).
   2. Add it as a Home Screen widget  -> shows a live countdown for one
      event, picked by the widget's "Parameter" field (the event's title,
      or its position number in the list, e.g. "1").

  No Mac, no Xcode, no purchase required - just the free Scriptable app.
*/

const STORE_FILE = "countdown-events.json"

// ---------- storage ----------

function fm() {
  try {
    return FileManager.iCloud()
  } catch (e) {
    return FileManager.local()
  }
}

function storePath() {
  const manager = fm()
  return manager.joinPath(manager.documentsDirectory(), STORE_FILE)
}

function loadEvents() {
  const manager = fm()
  const path = storePath()
  if (!manager.fileExists(path)) return []
  try {
    const raw = manager.readString(path)
    const data = JSON.parse(raw)
    return Array.isArray(data.events) ? data.events : []
  } catch (e) {
    return []
  }
}

function saveEvents(events) {
  const manager = fm()
  manager.writeString(storePath(), JSON.stringify({ events }, null, 2))
}

function findEvent(param) {
  const events = loadEvents()
  if (events.length === 0) return null

  if (param) {
    const trimmed = String(param).trim()
    const asIndex = parseInt(trimmed, 10)
    if (!isNaN(asIndex) && asIndex >= 1 && asIndex <= events.length) {
      return events[asIndex - 1]
    }
    const lower = trimmed.toLowerCase()
    const byTitle = events.find(e => e.title.toLowerCase() === lower)
    if (byTitle) return byTitle
    const byPartial = events.find(e => e.title.toLowerCase().includes(lower))
    if (byPartial) return byPartial
  }

  return events[0]
}

// ---------- countdown math ----------

function timeBreakdown(targetISO, now) {
  const target = new Date(targetISO)
  const diffMs = target.getTime() - now.getTime()
  const past = diffMs < 0
  const absMs = Math.abs(diffMs)

  const totalMinutes = Math.floor(absMs / (1000 * 60))
  const totalDays = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  const { months, days: remDaysAfterMonths } = monthsAndDaysBetween(now, target)

  return { totalDays, hours, minutes, months, remDaysAfterMonths, past }
}

// Calendar-aware month difference between two dates (order-independent magnitude).
function monthsAndDaysBetween(a, b) {
  let start = a < b ? a : b
  let end = a < b ? b : a

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())

  const probe = new Date(start)
  probe.setMonth(probe.getMonth() + months)
  if (probe > end) {
    months -= 1
    probe.setMonth(probe.getMonth() - 1)
  }

  const days = Math.floor((end.getTime() - probe.getTime()) / (1000 * 60 * 60 * 24))
  return { months: Math.max(0, months), days: Math.max(0, days) }
}

function primaryLine(event, breakdown) {
  if (breakdown.past) {
    return breakdown.totalDays === 0 ? "Today" : `${breakdown.totalDays}d ago`
  }
  if (event.showMonths && breakdown.months > 0) {
    return `${breakdown.months} mo, ${breakdown.remDaysAfterMonths}d`
  }
  return `${breakdown.totalDays} days`
}

function subtitleLine(breakdown) {
  if (breakdown.past) return "Counting up"
  return `${breakdown.hours} hrs, ${breakdown.minutes} min`
}

// ---------- widget rendering ----------

function buildWidget(event, family) {
  const widget = new ListWidget()
  widget.backgroundColor = new Color("#1c1c1e")
  widget.setPadding(14, 14, 14, 14)
  widget.refreshAfterDate = new Date(Date.now() + 60 * 1000)

  if (!event) {
    const msg = widget.addText("Open the Free Countdown Timer script to add an event.")
    msg.font = Font.mediumSystemFont(13)
    msg.textColor = Color.white()
    return widget
  }

  const now = new Date()
  const breakdown = timeBreakdown(event.targetDate, now)

  const titleText = widget.addText(event.title.toUpperCase())
  titleText.font = Font.boldSystemFont(11)
  titleText.textColor = new Color("#a0a0a5")
  titleText.lineLimit = 2

  widget.addSpacer(8)

  const bigText = widget.addText(primaryLine(event, breakdown))
  bigText.font = Font.boldSystemFont(30)
  bigText.textColor = Color.white()
  bigText.minimumScaleFactor = 0.6

  widget.addSpacer(2)

  const subText = widget.addText(subtitleLine(breakdown))
  subText.font = Font.mediumSystemFont(13)
  subText.textColor = new Color("#c7c7cc")

  if (family === "medium") {
    widget.addSpacer(8)
    const target = new Date(event.targetDate)
    const dateText = widget.addText(`Target: ${target.toLocaleDateString()}`)
    dateText.font = Font.systemFont(11)
    dateText.textColor = new Color("#8e8e93")
  }

  return widget
}

// ---------- in-app management UI ----------

async function promptText(title, message, defaultValue = "") {
  const alert = new Alert()
  alert.title = title
  if (message) alert.message = message
  alert.addTextField("", defaultValue)
  alert.addAction("Save")
  alert.addCancelAction("Cancel")
  const idx = await alert.presentAlert()
  if (idx === -1) return null
  return alert.textFieldValue(0)
}

async function promptDate(title, defaultDate) {
  const picker = new DatePicker()
  picker.title = title
  if (defaultDate) picker.initialDate = defaultDate
  return await picker.pickDateAndTime()
}

async function addEventFlow() {
  const title = await promptText("New Countdown", "What are you counting down to?")
  if (!title) return

  const targetDate = await promptDate("Target date & time", new Date())
  if (!targetDate) return

  const useCustomStart = await confirmChoice(
    "Counting From",
    "Count from today, or pick a custom start date?",
    ["Today", "Pick a date"]
  )
  let countingFrom = new Date()
  if (useCustomStart === 1) {
    countingFrom = await promptDate("Counting from", new Date())
  }

  const events = loadEvents()
  events.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    title,
    targetDate: targetDate.toISOString(),
    countingFrom: countingFrom.toISOString(),
    showMonths: false
  })
  saveEvents(events)
}

async function confirmChoice(title, message, options) {
  const alert = new Alert()
  alert.title = title
  if (message) alert.message = message
  options.forEach(o => alert.addAction(o))
  alert.addCancelAction("Cancel")
  return await alert.presentAlert()
}

async function editEventFlow(eventId, events) {
  const event = events.find(e => e.id === eventId)
  if (!event) return

  const choice = await confirmChoice(
    event.title,
    `Widget parameter: "${event.title}"`,
    ["Edit title", "Change target date", "Change counting-from date", "Toggle months display", "Preview widget", "Delete"]
  )

  if (choice === -1) return

  if (choice === 0) {
    const newTitle = await promptText("Edit title", "", event.title)
    if (newTitle) event.title = newTitle
  } else if (choice === 1) {
    const newDate = await promptDate("Target date & time", new Date(event.targetDate))
    if (newDate) event.targetDate = newDate.toISOString()
  } else if (choice === 2) {
    const newDate = await promptDate("Counting from", new Date(event.countingFrom))
    if (newDate) event.countingFrom = newDate.toISOString()
  } else if (choice === 3) {
    event.showMonths = !event.showMonths
  } else if (choice === 4) {
    const w = buildWidget(event, "medium")
    await w.presentMedium()
  } else if (choice === 5) {
    const confirmed = await confirmChoice("Delete event?", event.title, ["Delete"])
    if (confirmed === 0) {
      const idx = events.findIndex(e => e.id === event.id)
      if (idx !== -1) events.splice(idx, 1)
    }
  }

  saveEvents(events)
}

async function runApp() {
  const events = loadEvents()
  const table = new UITable()
  table.showSeparators = true

  const header = new UITableRow()
  header.isHeader = true
  header.addText("My Events")
  table.addRow(header)

  const addRow = new UITableRow()
  addRow.dismissOnSelect = false
  addRow.addText("➕ Add Event")
  addRow.onSelect = async () => {
    await addEventFlow()
    await runApp()
  }
  table.addRow(addRow)

  const now = new Date()
  events.forEach((event, i) => {
    const breakdown = timeBreakdown(event.targetDate, now)
    const row = new UITableRow()
    row.dismissOnSelect = false
    row.height = 60

    const titleCell = row.addText(event.title, `Parameter: "${event.title}" (or "${i + 1}")`)
    titleCell.widthWeight = 65

    const valueCell = row.addText(`${primaryLine(event, breakdown)} · ${subtitleLine(breakdown)}`)
    valueCell.widthWeight = 35
    valueCell.rightAligned()

    row.onSelect = async () => {
      await editEventFlow(event.id, loadEvents())
      await runApp()
    }
    table.addRow(row)
  })

  if (events.length === 0) {
    const empty = new UITableRow()
    empty.addText("No events yet. Tap ➕ Add Event to create one.")
    table.addRow(empty)
  }

  await table.present(false)
}

// ---------- entry point ----------

if (config.runsInWidget) {
  const event = findEvent(args.widgetParameter)
  const widget = buildWidget(event, config.widgetFamily || "small")
  Script.setWidget(widget)
} else {
  await runApp()
}

Script.complete()
