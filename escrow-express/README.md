# Escrow Express

An interactive React + Phaser 3 mini-game built for the **Nest Navigate Full Stack Engineering Challenge** to help first-time homebuyers master the financial journey from Pre-Approval to Closing Day.

## Game Concept

* **The Concept**: Teaches first-time homebuyers the financial reality of **Cash to Close** and **Escrow Reserves** across 9 core homebuying milestones: *Pre-Approval vs. Pre-Qualification, Debt-to-Income (DTI) Ratio, Earnest Money Deposits, Home Inspections & Seller Credits, Loan Estimate "Junk Fees," Appraisal Gaps & Comps, 30-Day Rate Locks, Escrow Tax/Insurance Reserves, and Wire Fraud Safety*. Many first-time buyers save their exact down payment ($10,000–$60,000) only to be blindsided by the extra 2%–5% ($8,000–$12,000+) in liquid closing costs required before getting the keys.
* **The Mechanic**: Players begin with a 3-Stage **Homebuyer Field Guide** and customize their run in the Garage—choosing between a **5.0-Mile Express Drive** (6 checkpoints) or a **10.0-Mile Full Campaign** (all 9 checkpoints), and selecting one of three mortgage vehicles (*0%-Down Assistance Mini-Pickup*, *FHA 3.5% Sprinter Van*, or *Conventional 20% Heavy Rig*). In a real-time 3D perspective highway view, every `$1,000` of liquid cash is visually stacked as green dollar bundles and gold bars in the back of the vehicle. Players steer into unspoiled 3-lane decision forks, collect savings boosts, dodge impulse debt traps, and finish with a **Closing Table Final Boss Audit** where they cross out bogus lender "Junk Fees" on their settlement sheet before signing the deed.
* **The Learning Outcome**: Players learn what each closing term means in plain English, how Seller Credits and Comparable Sales ("Comps") protect cash reserves, why opening new credit mid-escrow hurts DTI, and how to audit a Closing Disclosure to avoid becoming "house poor."
* **Why It's Fun**: It transforms dry mortgage paperwork into a colorful pop-arcade road trip where players watch their physical cash cargo stack grow or fly off the truck bed in real time.

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the local Vite development server
npm run dev

# 3. Build for production
npm run build
```

## Tech Choices

* **React 18 + Vite**: Fast HMR and clean declarative state management for the 3-stage onboarding tutorial, live cockpit dashboard telemetry, Closing Table Document Audit, and itemized Closing Disclosure scorecard.
* **Phaser 3 (Bonus Challenge)**: Custom 3D perspective projection (`EscrowFOVScene`) mounted inside a React wrapper (`PhaserCanvas.jsx`). Procedurally renders the highway, suburban houses, 3 distinct vehicle silhouettes (Pickup, Sprinter Van, and Heavy Box Rig), flying dollar bill particles, and live `$1,000` cash bundle stacks in the cargo bed with zero external image dependencies.
* **Tailwind CSS**: Custom Neo-Brutalist pop-arcade UI (`Fredoka` + `Space Grotesk` typography) engineered with locked-height HUD overlays so the entire gameplay experience fits within a single laptop screen without scrolling or layout shifts.
* **Browser `localStorage`**: Automatically saves and resumes the player's registered driver profile, vehicle selection, campaign mode, and itemized closing ledger with no backend required.
* **Lucide React & Canvas Confetti**: Crisp dashboard iconography and celebratory particle feedback upon unlocking the house keys.

## What I'd Do With More Time

* **Synthesized Web Audio Sound Effects**: Add a lightweight Web Audio API sound synthesizer (with a mute toggle) for engine hum, cash-register chimes when earning seller credits, and a celebratory fanfare at the Title Office.
* **Interactive Monthly Payment (PITI) Breakdown**: Add a post-game comparison tab on the Closing Disclosure showing how the player's chosen vehicle (0% Down vs. 3.5% FHA vs. 20% Conventional) affects their ongoing monthly mortgage payment and Private Mortgage Insurance (PMI).
* **Custom Scenario Builder**: Let users input their actual target home price and savings to simulate their real-world Cash-to-Close runway.

## Known Issues

* Rapidly resizing the browser window while actively driving may briefly recenter the Phaser 3 canvas due to `Phaser.Scale.FIT` recalculating the aspect ratio.
* On mobile devices without a physical keyboard, players use the on-screen arcade steering and gas/brake buttons; holding multiple touch buttons simultaneously depends on mobile browser multi-touch support.
