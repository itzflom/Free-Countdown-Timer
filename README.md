# Free Countdown Timer

A countdown app for iOS that lives on your **Home Screen** as a widget — no Mac,
no Xcode, and no purchase required. It runs inside the free **Scriptable** app.

It works like the screenshots you'd expect from a "My Events" countdown app:
add a title and a target date, and a widget on your Home Screen counts down in
days, hours, and minutes.

## 1. Install Scriptable (free, one-time)

1. On your iPhone/iPad, open the **App Store**.
2. Search for **Scriptable** (by Simon B. Støvring).
3. Tap **Get** to install it. It's free.

## 2. Add the script

1. Get the contents of `CountdownWidget.js` from this repository onto your
   device. The easiest way:
   - On your iPhone/iPad, open **Safari** (or any browser) and go to this
     repository on GitHub.
   - Open `CountdownWidget.js`, tap **Raw** (or the copy icon), and **copy all
     the text**.
2. Open the **Scriptable** app.
3. Tap the **+** button (top right) to create a new script.
4. Tap the script's name at the top and rename it to **CountdownWidget**
   (the name matters — it's how the widget finds the script later).
5. Delete any placeholder text in the editor, then **paste** the script you
   copied.
6. Tap **Done** to save.

## 3. Try it out

1. From the Scriptable home screen, tap the **CountdownWidget** script.
2. It opens a "My Events" list. Tap **➕ Add Event**.
3. Type a title (e.g. "Trip to Japan"), then pick a target date and time.
4. You'll be asked whether to count from today or a custom start date — pick
   one.
5. Your event now appears in the list with a live countdown.

## 4. Add the widget to your Home Screen

1. Go to your iOS **Home Screen**.
2. Long-press an empty area until the icons jiggle, then tap the **+** in the
   top corner.
3. Search for **Scriptable** and choose a widget size:
   - **Small** — title + day count + hrs/min.
   - **Medium** — adds the exact target date.
4. Tap **Add Widget**, then place it and tap **Done**.
5. **Long-press the new widget** → **Edit Widget**.
6. Set:
   - **Script**: `CountdownWidget`
   - **When Interacting**: `Run Script` (default is fine)
   - **Parameter**: the exact title of the event you want it to show (e.g.
     `Trip to Japan`), or just its position number in the list (`1` for the
     first event, `2` for the second, etc.)
7. Tap outside the widget to save. It now shows your live countdown.

Repeat steps 2–7 to add more widgets for more events — each widget shows one
event, chosen by its Parameter.

## Managing events later

Open the **CountdownWidget** script from Scriptable any time to add, edit,
delete events, or preview what a widget will look like. Tap an event to see
its exact widget Parameter text, change its date, or toggle a "months + days"
display instead of total days.

## Known iOS limitation

iOS controls how often any widget (not just this one) is allowed to refresh
in the background — typically every 15–30+ minutes. The **day count** is
always accurate the moment you look at it, but the **hours/minutes** subtitle
may lag by a few minutes until iOS refreshes the widget. This is a system
limitation that applies to every Home Screen widget on iOS, not something
specific to this script.
