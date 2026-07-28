# 1st Grade Learning Games

A colorful first-grade game hub for scholars and families.

## What Is Included

- homepage with two learning areas
- CKLA Skills page organized by unit
- Math page organized by module
- large placeholder cards with Coming Soon states
- CKLA Unit 1 game at `public/games/ckla-unit-1/`
- future game route structure under `app/games/[subject]/[slug]/`
- teacher edit mode with PIN `2213` for editing card titles, descriptions, and small pictures
- Firebase-backed card edits and teacher edit logs for `davisg230@gmail.com`

This version does not create games or publish the website. Teacher edits use the
Firebase project configuration provided for this hub and fall back to this device
if Firebase is unavailable during local preview.

Before publishing, add the Firestore rules in `firestore.rules` to the Firebase
project so only `davisg230@gmail.com` can write edits and logs. See
`FIREBASE.md` for the data structure and rule summary.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

## Adding Games Later

Each finished game should get its own folder or route so its HTML, CSS, and
JavaScript stay isolated from the rest of the hub. Add the game card metadata in
`app/game-data.ts`, then point that card to the new game route.
