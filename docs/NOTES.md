# Family-Ludo — Notes

A private, offline Ludo game for the family to play on one iPad. Based on
[LibreLudo](https://github.com/priyanshurav/libreludo) (open-source, AGPLv3),
with honest dice and family features added on top.

## Play it

- **Live web address:** https://aman-beniwal.github.io/Family-Ludo/
- **On the iPad:** open that link in **Safari** → **Share** → **Add to Home
  Screen**. Open the new icon → **Players** → add each family member (name +
  photo). To check it works without internet: turn on **Airplane Mode**, open
  the app, and play a full game — dice, sounds, and resume should all work.

Family photos and profiles are created on the iPad and **never leave the
device** — they are not in this repo and not on any server.

## What it does

- **Honest dice** — every roll is truly random (Web Crypto), the same for
  people and computer players. A **Roll History** screen shows how often each
  number comes up, so fairness is visible. It never adapts to who's winning.
- **2–4 players** on one iPad, any seat can be a computer player.
- **Player profiles** with name + photo, picked by tapping a card at setup;
  they survive a game resume. Includes a **backup file** you can export/import
  so photos survive if the iPad loses its data.
- **Sound** for six events with a mute/volume control, and a **capture effect**
  when a token is sent home.
- **iPad-first layout**, autosave/resume, works offline after first install.
- No accounts, servers, ads, or trackers.

## How updates work

The code lives on GitHub (`aman-beniwal/Family-Ludo`). Any change pushed to the
`main` branch **rebuilds and republishes the website automatically** (via
GitHub Actions). Because it's an installed app, a new version reaches the iPad
the next time you open it **on Wi-Fi** — so open it online occasionally.

## For a developer (running it on a Mac)

Node 24 + pnpm are required (installed via nvm here). From the project folder:

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
pnpm install
pnpm run dev        # run locally
pnpm test           # 180 tests
pnpm run build      # production build (outputs to build/client)
```

The app is served from a sub-folder (`/Family-Ludo/`) because GitHub Pages
hosts project sites under the repo name. To host it at a plain root address
instead (Cloudflare Pages / Netlify / Vercel), change `base` in
`vite.config.ts`, `basename` in `react-router.config.ts`, and the `/Family-Ludo/`
paths in `pwa.config.ts` back to `/`.

Full requirements and design decisions:
`docs/plans/2026-08-28-offline-fair-dice-ludo-ipad-plan.md`.

## Nice-to-have follow-ups (optional, not blocking)

1. Add component/hook tests (a React Testing Library harness) — the pure logic
   is well-tested, but the on-screen UI is currently only checked by hand.
2. Harden backup import — ask before overwriting a player with the same id, and
   make the import all-or-nothing.
