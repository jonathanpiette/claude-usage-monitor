# 🟫 Clauddy

A cute pixel-art desktop pet for macOS that tracks your Claude Code usage - mirroring the official **Settings → Usage** panel (current session + weekly limits, in tokens & %), with animations.

<p align="center">

https://github.com/user-attachments/assets/dbe00d9a-b49c-48ea-941c-76c517dec358

<em>A little terracotta creature that lives in the corner of your screen, eats your tokens, and naps when you're idle.</em>
</p>

> **This is a hardened fork of [renatoaug/claude-usage-monitor](https://github.com/renatoaug/claude-usage-monitor).** Differences from upstream:
> - No in-app self-update: the app never pipes a remote script into a shell. "Check for updates" only opens this fork's releases page.
> - `install.sh` targets this fork and verifies the archive's SHA-256 before installing.
> - The Claude login asks only for the read-only `user:profile` OAuth scope (upstream also requests `user:inference` and `org:create_api_key`).
> - Claude only: the Codex and Cursor integrations (which read `~/.codex` and the Cursor app's session token) are removed.
> - Nothing is published to npm: `bunx clauddy` / `npx clauddy` would run the **upstream** package, not this fork.

## What it shows

- **Current session** - real % used + **"resets in Xh Ym"** + session tokens, and a projection of where that pace is taking you (see [Burn rate](#burn-rate))
- **Weekly · all models** - real % used + tokens over the last 7 days
- **Status line** under the pet: `● working · 1.6M tok/min` (or today's tokens when idle)
- **By model · 7 days** - Opus / Sonnet / Haiku / Fable, in tokens
- **By project · 7 days** - which repo actually ate the week, ranked, with the tail folded into `other`
- **30-day map** - colored squares by daily tokens (green = light → red = heavy), with the monthly total

The **percentages are real**, pulled from your account (you log in once - see below). The token counts, the by-model and by-project breakdowns, activity status, and 30-day map come from your local logs (`~/.claude/projects/**/*.jsonl`). Everything is token-based - no dollars.

## Account & live usage

The session/weekly **%** comes straight from your Anthropic account, so it matches the official panel exactly. You connect once via a browser login:

1. Open **⚙ Settings → Connections → Claude → Connect** - your browser opens an Anthropic auth page.
2. Log in, copy the **authentication code** shown, and paste it back into the app → **Connect**.

The token is saved locally (see [Data & privacy](#data--privacy)) and refreshed automatically. **Until you connect**, the limits area shows a _"Connect your account"_ prompt instead of percentages.

### Several subscriptions

Got more than one Claude account - say a personal Pro and a Max from work? The **account chip** in the top-left corner is the switcher: click it for the list of accounts, with the active one marked, plus **"+ Add another account"** - which opens the same browser login and drops the token it brings back into a new slot. The tray icon has the same list under its **Account** submenu. Give up halfway and the empty slot disappears on its own - the list only ever holds accounts you actually logged into.

The widget follows **one account at a time**: the one you pick is the one whose % is shown, whose logs are counted, and the only one that can notify you. Each account keeps its own token and its own armed alerts, so switching never replays a notification you already dismissed elsewhere. Everything else - window position, display mode, zoom, thresholds - is shared.

Removing an account (the **×** on its row) deletes its token from disk. The one you're currently on can't be removed - switch away first - and neither can the last one left. Removing the first account clears its token without touching the settings that live in the same folder.

> Prefer one widget per account instead? Setting `CLAUDE_CONFIG_DIR` still isolates a whole instance - token, settings and logs - so you can run two Clauddys side by side.

## Burn rate

Knowing you're at **82%** with **1h 12m** left on the window still leaves you doing arithmetic in your head. So Clauddy does it for you: it fits the slope of your recent usage and projects when you'd hit 100% - showing one extra line under the session bar:

- **`~35m left at this pace`** (in coral) - you'd run out before the window resets. Ease off, or wrap up.
- **`resets before you run out`** - the reset gets there first. Carry on.

The slope is fitted over your **session tokens** rather than the account %. The % is the number you care about, but it arrives as a whole number every few minutes - over a short window the whole signal is a single `16 → 17` step, which throws the fitted pace off by multiples. Local-log tokens step too - one jump per assistant turn - but in increments some 10–20× finer, so the slope is far steadier; the account % then anchors it, converting tokens into % and re-calibrating on every poll.

It reads your **recent** pace, not the session average: go quiet for a few minutes and the projection eases off, which is the point.

It only appears once there's enough to say honestly - roughly 5 minutes into a session - and stays hidden while you're idle, when the pace is flat, or right after a reset. A projection is a projection: change your pace and it changes with you.

## The pet's states

<table>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/renatoaug/claude-usage-monitor/a8491cea34c4a8547965eadc3b24618ba50218e1/docs/media/idle.gif" width="280" alt="idle" /><br /><b>idle</b><br /><sub>breathes &amp; blinks</sub></td>
    <td align="center"><img src="https://raw.githubusercontent.com/renatoaug/claude-usage-monitor/a8491cea34c4a8547965eadc3b24618ba50218e1/docs/media/working.gif" width="280" alt="working" /><br /><b>working</b><br /><sub>hops &amp; eats token coins</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/renatoaug/claude-usage-monitor/a8491cea34c4a8547965eadc3b24618ba50218e1/docs/media/on-fire.gif" width="280" alt="on fire" /><br /><b>on fire</b><br /><sub>session ≥ 90% → red, shivers, flames</sub></td>
    <td align="center"><img src="https://raw.githubusercontent.com/renatoaug/claude-usage-monitor/a8491cea34c4a8547965eadc3b24618ba50218e1/docs/media/tired.gif" width="280" alt="maxed out" /><br /><b>maxed out</b><br /><sub>session at 100% → drained, slumped, sweating</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/renatoaug/claude-usage-monitor/a8491cea34c4a8547965eadc3b24618ba50218e1/docs/media/sleeping.gif" width="280" alt="sleeping" /><br /><b>sleeping</b><br /><sub>idle 5+ min → blue zzz &amp; moonlight</sub></td>
    <td align="center"><img src="https://raw.githubusercontent.com/renatoaug/claude-usage-monitor/a8491cea34c4a8547965eadc3b24618ba50218e1/docs/media/poke.gif" width="280" alt="poke" /><br /><b>poke</b><br /><sub>click the pet → squish &amp; hearts</sub></td>
  </tr>
  <tr>
    <td colspan="2" align="center"><img src="https://raw.githubusercontent.com/renatoaug/claude-usage-monitor/a8491cea34c4a8547965eadc3b24618ba50218e1/docs/media/celebrate.gif" width="280" alt="celebrate" /><br /><b>celebrate</b><br /><sub>session resets → jump &amp; confetti</sub></td>
  </tr>
</table>

Plus a welcome **wave** on launch. You can [poke the pet from the terminal](#play-with-the-pet) too.

### What Claude's up to

While Claude Code is actively working, the pet sets up a little desk scene that
mirrors **what it's doing right now** - inferred from your local logs (the last
tool it used). The status line names the activity, and three of them get their
own animated scene:

<table>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/renatoaug/claude-usage-monitor/a8491cea34c4a8547965eadc3b24618ba50218e1/docs/media/reading.gif" width="280" alt="reading" /><br /><b>reading</b><br /><sub>an open book under the reading lamp</sub></td>
    <td align="center"><img src="https://raw.githubusercontent.com/renatoaug/claude-usage-monitor/a8491cea34c4a8547965eadc3b24618ba50218e1/docs/media/editing.gif" width="280" alt="editing" /><br /><b>editing</b><br /><sub>types at the desk, coffee in reach</sub></td>
  </tr>
  <tr>
    <td colspan="2" align="center"><img src="https://raw.githubusercontent.com/renatoaug/claude-usage-monitor/a8491cea34c4a8547965eadc3b24618ba50218e1/docs/media/running.gif" width="280" alt="running" /><br /><b>running</b><br /><sub>watches a task log tick through its checks</sub></td>
  </tr>
</table>

Other activities - **planning**, **researching**, **delegating**, **waiting** -
show up in the status line as they happen. When Claude goes quiet, the pet drops
back to plain **working** / **idle**.

## The pet talks

Now and then the pet says something in a speech bubble. It only speaks when something changes, never on a timer, and it keeps quiet when it has nothing specific to say. Remarks are at least 10 minutes apart; the big moments can cut that line.

| Moment | What it says (expanded) | Minimized | Blip |
| --- | --- | --- | --- |
| First launch of the day | _Good morning! Yesterday was your heaviest day this week, 12M tokens._ | _Morning! Big day yesterday._ | ✓ |
| Session crosses your fire threshold | _Getting warm, 91% already. At this pace you'll run out in about 40m._ | _91%, getting warm!_ | ✓ |
| The session window resets | _Fresh window! That was 34M tokens over 4h 12m, mostly editing code._ | _Fresh window! 34M last time._ | ✓ |
| The session hits 100% | _That's the limit. I'll be back at 2:35 PM._ | _Maxed out till 2:35 PM._ | |
| You're back after 2+ hours away | _Welcome back! You were gone 3h 12m. The session's at 12%._ | _Welcome back!_ | |
| 90 minutes of unbroken work | _You've been at it for 1h 35m straight. Stretch break?_ | _Stretch break?_ | |
| A new record day (30-day best) | _New record! 45M tokens today, your biggest day in a month._ | _New record: 45M!_ | |

The greeting follows your clock (_Good morning_, _Good afternoon_, _Good evening_, or _Still up?_ before 5 AM) and appears once a day, and so does the record. The reset recap covers only what the pet actually saw, so if you launch it mid-session it says less. Click the bubble to dismiss it.

### The voice

Optionally the pet also **blips** as it talks: short chiptune notes, one per letter, generated live with Web Audio (square waves, no sound files). It blips faster and higher when it's on fire, slower and lower when it's sleepy. Only the headline moments blip (the ✓ rows above), because a sound on every remark wears out fast.

Audio should never catch you off guard in a meeting:

- **Off by default.** Turn it on under **⚙ Settings → voice → Chiptune voice** (you'll hear a sample).
- **One-click mute.** While the voice is on, a 🔊 button sits in the title bar. Click it to mute for an hour, and again to unmute.
- **Always silent** in menu-bar mode and while the pet is minimized.

**Speech bubbles** can be switched off entirely in the same place. Try any remark from the terminal with `node bin/clauddy.js say <kind>` ([see below](#play-with-the-pet)).

## Install

**macOS (Apple Silicon)** is the only prebuilt target of this fork. Windows and Linux build from source the same way (`bun run dist:win` / `bun run dist:linux`).

### From source (recommended)

Needs [Bun](https://bun.sh) and Node 24 (`.nvmrc`):

```bash
git clone https://github.com/jonathanpiette/claude-usage-monitor.git
cd claude-usage-monitor
bun install --frozen-lockfile
bun run test
bun run dist            # -> dist/mac-arm64/Clauddy.app and dist/Clauddy-<version>-mac-arm64.zip
cp -R dist/mac-arm64/Clauddy.app /Applications/
open /Applications/Clauddy.app
```

For a quick run without packaging: `bun run start`.

The app is ad-hoc signed (so macOS delivers its notifications), not notarized. A copy built on your own Mac is not quarantined, so it opens without a Gatekeeper prompt. It registers in **Login Items** and starts with your Mac.

### From a release of this fork

Download the installer, read it, then run it:

```bash
curl -fsSLO https://raw.githubusercontent.com/jonathanpiette/claude-usage-monitor/develop/install.sh
less install.sh
bash install.sh
```

It fetches the latest release of this fork, checks the Apple Silicon zip against the SHA-256 digest GitHub records for it and aborts on any mismatch, then installs to `/Applications`. To pin a digest you verified yourself: `CLAUDDY_SHA256=<hex> bash install.sh`.

### Updates

**⚙ Settings → Check for updates** compares your version with this fork's latest release and, when a newer one exists, opens the release page. Nothing is downloaded or run by the app itself: update by rebuilding from source or re-running `install.sh`.

> The app keeps its data in `~/.claude-usage-monitor`, regardless of platform or how you run it.

## Controls

- **Drag** the widget anywhere on screen
- **–** minimizes to just the pet, ringed by the live session % (the number sits inside the ring); the **⤢** button or a double-click on the pet expands it back
- **Pet icon** in the compact header switches to **Just the pet** (floating mode). Drag the pet itself to move it. Hovering over the pet (or focusing it) reveals the usage glance; the small expand button in it returns to compact. Keyboard users can focus the pet and press Enter. The chosen size is remembered. In compact and pet-only modes, the pet follows Claude's activity, with the Claude logo beside it while it works. When Claude is not active, the session still sets the mood: the pet catches fire (or maxes out) with the Claude logo beside it, and otherwise rests.
- **⚙** opens settings (log in, toggle alerts, set thresholds, pick the display mode)
- **↗** opens the official Claude Usage page
- **×** quits

### Floating or menu bar

Under **⚙ Settings → Preferences** you can pick where Clauddy lives:

- **Floating pet** - the always-on widget in the corner (default).
- **Menu bar** - a small pet icon in the macOS menu bar showing your live session **%** (it turns 🔥 near your limit). Click it to pop open the full pet + usage panel; click away to dismiss. Right-click for a quick menu.

Switching is instant - no restart. (On Windows/Linux the icon lives in the system tray; the live % shows in its tooltip.)

### Provider reactions

When a provider's activity changes, the pet briefly glances toward it, with no caption. Both can be working at once. A glance never changes your selected provider, and glances share a 30-second cooldown. Inactivity is treated as a pause, not a completed task.

## Alerts

Optional **macOS notifications**, toggled (with their thresholds) in **⚙ Settings**:

| Notification | When |
| --- | --- |
| _Session at 82%_ - `2h 39m left · resets 6:50 PM` | Your session crosses a threshold (default **80%** and **95%**) |
| _Weekly usage at 84%_ - `resets Fri 7:00 AM` | Same, for the weekly limit |
| _Fable weekly at 84%_ - `resets Fri 7:00 AM` | Same, for a per-model weekly limit |
| _Session window reset_ - `full budget again` | A session you had pushed past 80% rolls over |
| _Clauddy lost access to your usage_ | The OAuth token expired or was revoked, so the % went back to being an estimate |

The last threshold you set is the only one that makes a sound; the earlier ones arrive silently. Clicking any of them brings the widget to the front. Each fires once and re-arms when usage drops back below - remembered across restarts, so relaunching at 85% doesn't repeat an alert you already dismissed.

Percentages come from your account when you're logged in, and fall back to the local token estimate when you're not.

The first alert asks macOS for permission; after that the app shows up in **System Settings > Notifications** like any other.

### Remind me at the session reset

When the selected session crosses your first alert threshold, **Notify at reset** appears beneath the session details and in the compact monitor. Click to arm it; click **Reminder on** to cancel. This is a one-shot request, independent of the automatic threshold-alert toggle.

Reminders survive restarts, belong to the Claude account that created them, and are canceled when you disconnect that account. Clauddy must be running to notify; an overdue reminder is delivered on reopening or waking up. A fresh, lower reading confirms that session budget returned and the pet celebrates. If usage hasn't refreshed, the reminder only says the scheduled reset time arrived and asks you to check usage.

## Configure (`config.json`)

Settings saved from the UI live in `~/.claude-usage-monitor/config.json`, so you can tweak them without rebuilding:

```jsonc
{
  "mode": "floating", // "floating" pet in the corner, or "menubar" popover
  "alerts": true, // macOS notifications on/off
  "alertThresholds": [80, 95], // notify when session/week cross these % (two levels)
  "fireThreshold": 90, // session % at which the pet catches fire (maxed out stays 100)
  "pollIntervalMs": 4000, // how often local logs are re-read
  "activeThresholdMs": 20000, // fallback "active" window, for a log whose tail doesn't say whether a turn is open
  "sleepThresholdMs": 300000, // "sleeping" after this much idle time (5 min)
  "talk": true, // speech bubbles on transitions
  "sound": false, // chiptune blips, opt-in
  "soundMutedUntil": 0, // set by the 🔊 button: muted until this epoch ms
}
```

## Play with the pet

With the widget running, poke it from the terminal (from your clone of this repo), just for fun:

```bash
node bin/clauddy.js poke        # 💕 squish + hearts
node bin/clauddy.js celebrate   # 🎉 jump + confetti
node bin/clauddy.js fire        # 🔥 on fire
node bin/clauddy.js sleeping    # 😴 blue zzz
node bin/clauddy.js working     # 🍴 eats token coins
node bin/clauddy.js tired       # 🥵 maxed out
node bin/clauddy.js idle        # 🙂 calm
node bin/clauddy.js auto        # ↩️ back to your real usage
node bin/clauddy.js say         # 💬 a remark in the speech bubble
node bin/clauddy.js say fire    #    or a specific one: greeting, fire, reset, maxed, welcome, streak, record
```

Each state is written to the data dir the running widget watches, so it reacts
live. `./pet <state>` does the same.

## How it works

- **`main.js`** - Electron main process: frameless, transparent, always-on-top window; polls usage; fires macOS notifications; watches `config.json` and `debug.json`.
- **`usage.js`** - reads `~/.claude/projects/**/*.jsonl`, sums tokens per model/project/day, detects the rolling 5-hour session window, the working/sleeping status, and which activity (reading/editing/running/…) Claude is on from its latest tool use.
- **`auth.js`** - OAuth login (PKCE, same public client as Claude Code) that fetches the authoritative usage %. Token stored locally, never committed.
- **`renderer/`** - the pet itself: an SVG pixel sprite, CSS animations, and the Web Animations API for particles. `voice.js` writes its remarks and synthesizes the blips.
- **`make-icon.js`** - generates the app icon from the pixel sprite (`build/icon.icns`).

## Data & privacy

Everything lives on your machine, in `~/.claude-usage-monitor/`:

- `auth.json` - your OAuth token (file mode `600`, never committed)
- `config.json` - your alert settings
- `alerts.json` - which notifications are already armed, so a restart doesn't repeat them
- `accounts.json` - your list of accounts and which one is active
- `debug.json` - scratch file for the `./pet` simulator
- `accounts/<id>/` - the same `auth.json` + `alerts.json`, for each extra account

The login requests only the read-only `user:profile` scope. A token created before this fork's change keeps its old, wider scopes until you log out and back in (**⚙ Settings → Connections → Claude → Log out**).

Nothing leaves your machine except the OAuth calls to Anthropic's own login, usage and profile endpoints, and the update check to this fork's GitHub releases API.

## Contributing

Bug reports and ideas are welcome - see **[CONTRIBUTING.md](CONTRIBUTING.md)**
for setup and the few gotchas worth knowing before a first PR.

## Dev tooling

- **Bun** for install/scripts, **Node 24** pinned in `.nvmrc`
- **Tests**: `bun run test` (never bare `bun test` - the groups under `test/`
  must each run in their own process). `bun run test:coverage` enforces the
  floor; every PR runs both.
- **Biome** for format + lint (`bun run check`); a versioned **pre-commit hook** (`.githooks/pre-commit`) auto-formats staged files and blocks on errors. It's wired up automatically on `bun install` (via the `prepare` script).

### Releasing

Releases are **fully automated**. Every push to `main` runs
[semantic-release](https://semantic-release.gitbook.io) (`.github/workflows/release.yml`):
it reads the **Conventional Commits** and, when there's something to ship,
computes the version, builds the app for **macOS, Windows and Linux** on their
own runners, publishes `clauddy` to npm, and cuts a GitHub Release with every
artifact attached. Nothing to do by hand - just merge your PRs.

The pipeline runs in three stages, because electron-builder can't cross-build
Windows/Linux from macOS: `version` (a semantic-release dry-run that computes
the next version) → `build` (a matrix that stamps that version into
`package.json` so the filenames are right) → `publish` (downloads every
artifact and runs semantic-release for real).

- `feat:` → minor, `fix:` → patch, `feat!:`/`BREAKING CHANGE` → major.
- `docs:`/`chore:`/`ci:` etc. don't trigger a release.
