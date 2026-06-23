# Free Countdown Timer

A countdown app for iOS that lives on your **Home Screen** as a widget — no Mac,
no Xcode, nothing to buy. It runs inside the free **Scriptable** app.

- 🏠 **Home Screen widget** — a clean snapshot of any countdown (accurate to the minute).
- ▶️ **Tap the widget → full-screen live app** with an **animated** countdown that
  ticks **years · months · days · hours · minutes · seconds** in real time.
- 🎨 **28+ backgrounds** (solid, gradient, animated) plus **custom colors**.
- 🧩 **Default or Custom layout** — in Custom mode you **drag each piece of text
  anywhere** on the widget.
- ➕ Add as many events as you want; each Home Screen widget shows one.

> **One iOS rule to know:** Home Screen widgets can't animate or tick every second —
> that's true for *every* widget app, it's an Apple limitation. So the motion + the
> live seconds live in the **app view** (tap the widget). The widget snapshot updates
> on iOS's schedule and is accurate to the minute.

---

## A. Install (one time)

1. On your iPhone/iPad open the **App Store**, search **Scriptable** (by Simon
   B. Støvring), tap **Get**. It's free.
2. Open this repo on your device, open **`CountdownWidget.js`**, tap **Raw**, then
   **select all → Copy**.
3. Open **Scriptable** → tap **+** (top right) → tap the script name and rename it to
   **CountdownWidget** (the name matters) → delete the placeholder text → **paste** →
   **Done**.

## B. First run — add a countdown

1. In Scriptable, tap the **CountdownWidget** script. The app opens.
2. Tap the big **+**. A "New Countdown" appears and the **Edit** sheet slides up.
3. Set **Title**, **Counts down to** (date *and* time), and optionally **Counting
   from**. Tap **Save**.

## C. The live countdown screen

- From the list, **tap a card** to open the full-screen live view — the units tick
  every second and the background animates.
- Three buttons:
  - **Edit** — change title / dates / delete.
  - **Customize** — backgrounds, colors, units, layout (see D).
  - **Layout** — open the drag editor (see E).
- Tap **Done** (top right) to go back to your list.

## D. Customize the look

Open **Customize**:
- **Background** — tap any of the 28+ swatches (solid / gradient / animated).
- **Custom colors** — pick your own two-color gradient with the color wheels.
- **Text color** — set the number/label color.
- **Units to show** — toggle **Years, Months, Days, Hours, Minutes, Seconds** on/off.
  Whatever you enable shows live in the app and (down to minutes) on the widget.
- **Widget layout** — **Default** (tidy stacked layout) or **Custom** (free placement).

## E. Custom layout — drag things anywhere

1. In Customize, set layout to **Custom** (or tap **Layout** on the live screen).
2. A mini widget appears with three draggable pieces: the **title**, the **big
   number**, and the **subtitle**.
3. **Drag** each piece to wherever you want it. **Reset** restores the default
   arrangement. Tap **Done** — your widget snapshot will match.

## F. Put it on your Home Screen

1. Go to the **Home Screen**, long-press an empty spot until icons jiggle, tap **+**.
2. Search **Scriptable**, choose a size (**Small** or **Medium**), tap **Add Widget**.
3. **Long-press the new widget → Edit Widget** and set:
   - **Script**: `CountdownWidget`
   - **Parameter**: the event's **title** (e.g. `Trip to Japan`) or its number in the
     list (`1`, `2`, …). Each card in the app shows its exact parameter text.
4. Tap away. The widget now shows that event with your chosen background + layout.
5. **Tap the widget** any time to jump into the live animated app.

Add more widgets the same way (different Parameter each) for multiple events.

---

## Notes
- Everything is saved on-device in Scriptable; no account, no internet needed.
- Animated backgrounds and the live **seconds** appear only in the app view.
- The **widget never shows seconds** and snaps its minutes to the nearest **15**
  (:00/:15/:30/:45), and asks iOS to refresh on those marks — so the number always
  looks current. The day/hour count is always accurate.
- To edit later, just open the **CountdownWidget** script again.
