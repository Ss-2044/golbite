# GolBite — Stadium Matchday Experience Platform (prototype)

An interactive, mobile-first web prototype that connects **fans**, **venue operators** and **clubs / partners** on matchday.
It runs fully in the browser with simulated demo data. No real login, payment, maps or live match data is used.

## Run it

- **Quickest:** open `index.html` in a browser (double-click works).
- **As an installable app (PWA, offline):** serve the folder over HTTP, for example
  `python3 -m http.server 8080` then open <http://localhost:8080>. You can then "Add to Home Screen".

## Roles (demo role switch — not access control)

| Role | Where | Purpose |
| --- | --- | --- |
| Fan (default) | `#/home`, `#/explore`, `#/guide`, `#/menu`, `#/summary`, `#/track/:id`, `#/support`, `#/play`, `#/profile` | Event guide (before / arrival / leaving), searchable venue directory and map, menu with search, dietary and allergen filters, checkout with VAT/fees, order tracking, support and service recovery |
| Operator | `#/ops/overview`, `control`, `orders`, `distribution`, `inventory`, `facilities`, `map` | Event-day controls (open/close ordering, pause vendor/pickup/zone, capacity, cutoff, phase incl. cancelled, official notice), orders with valid next actions, stock, facility tasks and service status, activity log |
| Vendor | `#/vendor/queue`, `menu`, `settings`, `performance` | One kitchen's queue (accept, start, ready, reject), stock, capacity and pause, performance |
| Partner | `#/partner/results`, `#/partner/create` | Campaigns with status, eligible products, redemption limit, pause/edit/end, preview and metric definitions (simulated) |
| Venue admin | `#/admin/setup`, `services`, `integrations`, `report`, `activity` | Event setup with a validation checklist and publish, directory status, integration boundaries, business report (no payouts) |

The role switch is for reviewers only. A production system must authenticate users and enforce every role on the server.

## What is simulated

Everything: events, menus, prices, stock, orders, waits, maps, match feed, campaign results and payments. Labels (`Demo`, `Scheduled`, `Unavailable`) say where each piece of information comes from. No card data is collected and no money moves. See `js/services.js` for the integration boundaries production needs: authentication, ticketing, venue maps, access control, POS/inventory, payments and refunds, parking, transport, match feed, notifications, support desk and analytics.

## Order lifecycle

Pickup: Placed → Accepted → Preparing → Ready → Collected. Seat delivery: … Ready → On the way → Delivered. Any stage before completion can be Cancelled. `setStage()` in `js/engine.js` only allows the next stage, and every change is logged with the acting role. Demo Controls can run scenarios (pre-match, busy pickup, vendor pause, goal offer, halftime rush, delayed order, vendor rejects, item unavailable, facility unavailable), advance orders and toggle autopilot.

## Design system

Navy for the interface, GolBite orange for primary actions and selected states, white panels on a cool grey background.
Tokens (type scale, spacing, radii, elevation, status colours) live at the top of `css/app.css`. The sunburst from the wordmark is reused for loading, progress (loyalty, stadium unlock), the current match moment and reward moments.
Product imagery uses an illustrated tile treatment; real photos can be mapped in `PHOTOS` (`js/data.js`).

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

## iOS app

The iOS project lives in `ios/` (Capacitor 8, Swift Package Manager). Setup, TestFlight and App Store steps are in [IOS.md](IOS.md) (Arabic).

## Turning it into a store app later

The code is plain HTML/CSS/JS with no build step, so it can be wrapped as-is with
[Capacitor](https://capacitorjs.com/) (iOS/Android) or shipped as the included PWA (`manifest.webmanifest`, `sw.js`).
Club and stadium names (Al Hilal, Al Nassr, Al Ittihad, Al Ahli; Kingdom Arena, King Abdullah Sports City, King Fahd International Stadium) are used for demo context only. The prototype is not affiliated with or endorsed by these clubs or venues, and it uses no club logos. Matches, scores, sponsors and prices are fictional sample data.
