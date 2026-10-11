# GolBite — Stadium Matchday Experience Platform (prototype)

An interactive, mobile-first web prototype that connects **fans**, **venue operators** and **clubs / partners** on matchday.
It runs fully in the browser with simulated demo data. No real login, payment, maps or live match data is used.

## Run it

- **Quickest:** open `index.html` in a browser (double-click works).
- **As an installable app (PWA, offline):** serve the folder over HTTP, for example
  `python3 -m http.server 8080` then open <http://localhost:8080>. You can then "Add to Home Screen".

## What's inside

| Area | Where |
| --- | --- |
| Fan: splash, sign-in, setup, Matchday Companion, map, ordering, tracking, history, Group Order | `js/views/fan.js`, `js/views/ordering.js` |
| Play: predictions, quiz, rivalries, quests, mini-game, loyalty | `js/views/play.js` |
| Club Shop: drops, mystery box, lottery, bundles, bag | `js/views/shop.js` |
| Profile, Season Journey, Settings | `js/views/profile.js` |
| Venue Operations (Smart Fulfillment Network) | `js/views/ops.js` |
| Club & Partner Hub | `js/views/partner.js` |
| Stadium Digital Twin (SVG map) | `js/map.js` |
| Simulation: routing, order lifecycle, match events, rewards | `js/engine.js` |
| State and browser-storage persistence | `js/store.js` |
| Demo Controls, Product Tour, router, actions | `js/app.js` |

- Switch roles from the top bar (Fan · Venue · Partner) and language with **عربي / EN** (full RTL).
- The flask button opens **Demo Controls**: goal, halftime, red card, home win, 77' drop, crowd change, route closure,
  pickup overload, sold-out item, event reset, and the presenter **Product Tour**.
- Progress is saved in `localStorage`. Use *Profile → Settings → Reset* to clear it.

## Turning it into a store app later

The code is plain HTML/CSS/JS with no build step, so it can be wrapped as-is with
[Capacitor](https://capacitorjs.com/) (iOS/Android) or shipped as the included PWA (`manifest.webmanifest`, `sw.js`).
Club and stadium names (Al Hilal, Al Nassr, Al Ittihad, Al Ahli; Kingdom Arena, King Abdullah Sports City, King Fahd International Stadium) are used for demo context only. The prototype is not affiliated with or endorsed by these clubs or venues, and it uses no club logos. Matches, scores, sponsors and prices are fictional sample data.
