import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

class EscrowFOVScene extends Phaser.Scene {
  constructor() {
    super('EscrowFOVScene');
    this.speed = 0;
    this.maxSpeed = 90;
    this.distance = 0;
    this.targetDistance = 5000;
    this.playerX = 0; // -0.75 (Left), 0 (Center), +0.75 (Right)
    this.turboActive = false;
    this.truckColor = 0xf43f5e;
    this.escrowCollected = false;
    this.finished = false;
    this.roadZ = 0;
    this.obstacles = [];
    this.scenery = [];
  }

  create() {
    const { width } = this.scale;
    this.horizonY = 120;

    // 1. Sunny Cartoon Sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x38bdf8, 0x38bdf8, 0xbae6fd, 0xfef08a, 1);
    sky.fillRect(0, 0, width, this.horizonY);

    // Golden Sun & Fluffy Clouds
    this.add.circle(width - 110, 46, 34, 0xfacc15, 1).setStrokeStyle(4, 0x18181b);
    this.clouds = [
      this.add.ellipse(140, 45, 95, 36, 0xffffff).setStrokeStyle(3, 0x18181b),
      this.add.ellipse(420, 60, 120, 40, 0xffffff).setStrokeStyle(3, 0x18181b),
      this.add.ellipse(640, 38, 85, 32, 0xffffff).setStrokeStyle(3, 0x18181b)
    ];

    // Rolling Green Hills
    const hills = this.add.graphics();
    hills.fillStyle(0x4ade80, 1);
    hills.lineStyle(3, 0x18181b, 1);
    hills.fillEllipse(190, this.horizonY + 10, 390, 70);
    hills.strokeEllipse(190, this.horizonY + 10, 390, 70);
    hills.fillStyle(0x22c55e, 1);
    hills.fillEllipse(580, this.horizonY + 15, 460, 80);
    hills.strokeEllipse(580, this.horizonY + 15, 460, 80);

    this.worldGfx = this.add.graphics();

    // Pool of 15 Sign Labels for 3-Lane Highway Gates
    this.labelPool = [];
    for (let i = 0; i < 15; i++) {
      const lbl = this.add.text(0, 0, '', {
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#18181b',
        backgroundColor: '#fef08a',
        padding: { x: 6, y: 4 }
      }).setOrigin(0.5, 1).setVisible(false).setDepth(20);
      this.labelPool.push(lbl);
    }

    // Center Pop-up Banner after passing a gate
    this.floatingPopup = this.add.text(width / 2, 190, '', {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#18181b',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(40).setAlpha(0);

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    this.keys.SPACE.on('down', () => this.toggleTurbo());

    this.setupFairThreeLaneCheckpoints();

    // Roadside Houses & Trees
    const houseColors = [0xf87171, 0x60a5fa, 0xfbbf24, 0xc084fc];
    for (let z = 90; z < 1800; z += 180) {
      this.scenery.push({ z, side: -1.65, type: 'house', color: houseColors[(z / 180) % 4] });
      this.scenery.push({ z: z + 90, side: 1.65, type: 'tree' });
    }
  }

  // Every checkpoint has 3 passable lanes (Left: -0.72, Center: 0, Right: +0.72)
  // No full-road barriers that trap or force unavoidable losses!
  setupFairThreeLaneCheckpoints() {
    this.obstacles = [
      // CHECKPOINT 1 (Mile 0.7): Home Inspection Findings
      {
        z: 750, lane: -0.72, type: 'choice',
        signText: '📋 WAIVE INSPECTION',
        outcomeTitle: 'Waived Inspection: Hidden Pipe Burst! (-$2,000)',
        cost: -2000,
        lesson: 'Waiving the inspection hid a cracked water main that cost $2,000 to fix!'
      },
      {
        z: 750, lane: 0, type: 'choice',
        signText: '🛠️ PAY CONTRACTOR',
        outcomeTitle: 'Paid Roof Repair Yourself (-$1,000)',
        cost: -1000,
        lesson: 'You paid for the repair yourself instead of asking the seller for a credit.'
      },
      {
        z: 750, lane: 0.72, type: 'choice',
        signText: '🤝 SELLER CREDIT',
        outcomeTitle: 'Seller Repair Credit Approved! (+$1,500)',
        cost: 1500,
        lesson: 'Awesome! Your Inspection Contingency got the seller to credit $1,500 toward your closing costs!'
      },

      // CHECKPOINT 2 (Mile 1.5): Reviewing the Loan Estimate Form
      {
        z: 1500, lane: -0.72, type: 'choice',
        signText: '⚡ EXPRESS COURIER FEE',
        outcomeTitle: 'Paid Padded "Junk Fee" (-$1,200)',
        cost: -1200,
        lesson: '"Express Courier & Admin Package" is a padded lender Junk Fee you should always refuse!'
      },
      {
        z: 1500, lane: 0, type: 'choice',
        signText: '🔍 AUDIT LOAN ESTIMATE',
        outcomeTitle: 'Audited Form & Removed Junk Fees! (+$1,200)',
        cost: 1200,
        lesson: 'Spot on! Reviewing your 3-page Loan Estimate removed $1,200 in bogus processing fees!'
      },
      {
        z: 1500, lane: 0.72, type: 'choice',
        signText: '📄 ACCEPT ESTIMATE AS-IS',
        outcomeTitle: 'Paid Standard Processing (-$400)',
        cost: -400,
        lesson: 'Signing without auditing left minor administrative fees on your tab.'
      },

      // CHECKPOINT 3 (Mile 2.3): Interest Rate & Underwriting Zone (Replaces the broken Traffic Wall!)
      {
        z: 2300, lane: -0.72, type: 'choice',
        signText: '🔒 30-DAY RATE LOCK',
        outcomeTitle: 'Rate Locked Before Market Spike! (+$1,400)',
        cost: 1400,
        lesson: 'Smart! Locking your interest rate protected your cash when market rates jumped during underwriting!'
      },
      {
        z: 2300, lane: 0, type: 'choice',
        signText: '📈 FLOAT INTEREST RATE',
        outcomeTitle: 'Rates Spiked While Floating! (-$1,800)',
        cost: -1800,
        lesson: 'Floating your rate left you exposed when interest rates rose during underwriting!'
      },
      {
        z: 2300, lane: 0.72, type: 'choice',
        signText: '⏳ DELAY PAPERWORK',
        outcomeTitle: 'Paid Rate-Lock Extension Fee (-$900)',
        cost: -900,
        lesson: 'Delaying your bank documents forced you to pay a daily Rate-Lock Extension fee.'
      },

      // CHECKPOINT 4 (Mile 3.1): Home Appraisal Came in $5k Low
      {
        z: 3100, lane: -0.72, type: 'choice',
        signText: '💵 PAY APPRAISAL GAP',
        outcomeTitle: 'Paid Appraisal Shortage in Cash (-$1,800)',
        cost: -1800,
        lesson: 'Paying the appraisal gap out of pocket drained your cash reserves.'
      },
      {
        z: 3100, lane: 0, type: 'choice',
        signText: '🏃 CANCEL WITHOUT CONTINGENCY',
        outcomeTitle: 'Forfeited Partial Deposit (-$2,200)',
        cost: -2200,
        lesson: 'Backing out without an Appraisal Contingency puts your earnest deposit at risk!'
      },
      {
        z: 3100, lane: 0.72, type: 'choice',
        signText: '📊 APPEAL WITH COMPS',
        outcomeTitle: 'Neighborhood Comps Appeal Won! (+$1,200)',
        cost: 1200,
        lesson: 'Great move! Submitting recent neighborhood sales ("Comps") proved the home value and saved your cash!'
      },

      // CHECKPOINT 5 (Mile 3.9): Escrow Reserve Station (Replaces the unavoidable -$4,200 rail!)
      {
        z: 3900, lane: -0.72, type: 'choice',
        signText: '🏦 ESCROW + SELLER TAX CREDIT',
        outcomeTitle: 'Escrow Funded + Seller Tax Proration! (+$1,000)',
        cost: 1000,
        fillsEscrow: true,
        lesson: 'Pro move! You funded your Escrow Reserve AND collected the seller’s unpaid property tax proration credit!'
      },
      {
        z: 3900, lane: 0, type: 'choice',
        signText: '💼 PREPAY FULL YEAR SOLO',
        outcomeTitle: 'Escrow Funded Out-of-Pocket (-$800)',
        cost: -800,
        fillsEscrow: true,
        lesson: 'You funded your 6-month tax & 12-month insurance Escrow tank, though you didn’t claim seller tax credits.'
      },
      {
        z: 3900, lane: 0.72, type: 'choice',
        signText: '🚫 SKIP HAZARD INSURANCE',
        outcomeTitle: 'Lender Force-Placed Insurance Penalty! (-$2,400)',
        cost: -2400,
        fillsEscrow: true,
        lesson: 'Never skip homeowners insurance! The bank forced expensive coverage onto your loan at closing.'
      },

      // CHECKPOINT 6 (Mile 4.5): Final Closing Wire Transfer
      {
        z: 4550, lane: -0.72, type: 'choice',
        signText: '📧 USE EMAILED WIRE LINK',
        outcomeTitle: 'Wire Phishing Scam Penalty! (-$2,200)',
        cost: -2200,
        lesson: 'Never trust last-minute emailed wire changes! Always call the Title Office directly to verify routing numbers.'
      },
      {
        z: 4550, lane: 0, type: 'choice',
        signText: '📞 CALL TITLE OFFICE DIRECT',
        outcomeTitle: 'Verified Safe Wire + Earnest Credit! (+$1,000)',
        cost: 1000,
        lesson: 'Calling the Title Officer verified your safe wire and applied your Earnest Money deposit credit!'
      },
      {
        z: 4550, lane: 0.72, type: 'choice',
        signText: '📝 BRING PERSONAL CHECK',
        outcomeTitle: 'Personal Check Rejected — Rush Wire Fee (-$600)',
        cost: -600,
        lesson: 'Closing requires a Certified Cashier’s Check or verified wire transfer—personal checks delay funding!'
      },

      // FINISH LINE (Mile 5.0)
      {
        z: 5000, lane: 0, type: 'finish_arch',
        signText: '🏁 COUNTY TITLE OFFICE — CLOSING DAY!'
      }
    ];
  }

  showPopup(text, color = '#ffffff') {
    if (!this.floatingPopup) return;
    this.floatingPopup.setText(text);
    this.floatingPopup.setColor(color);
    this.floatingPopup.setAlpha(1);
    this.floatingPopup.y = 190;
    this.tweens.killTweensOf(this.floatingPopup);
    this.tweens.add({
      targets: this.floatingPopup,
      y: 140,
      alpha: 0,
      duration: 2400,
      ease: 'Cubic.easeOut'
    });
  }

  toggleTurbo() {
    this.turboActive = !this.turboActive;
    this.maxSpeed = this.turboActive ? 115 : 85;
    this.showPopup(this.turboActive ? '⚡ TURBO CRUISE ON!' : '🚗 STANDARD CRUISE', '#facc15');
    this.emitTelemetry();
  }

  setControlInput(action, value) {
    this.virtualInput = this.virtualInput || {};
    this.virtualInput[action] = value;
  }

  emitTelemetry() {
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        speed: Math.round(this.speed),
        distance: Math.min(this.targetDistance, Math.round(this.distance)),
        turboActive: this.turboActive
      });
    }
  }

  update(time, delta) {
    if (this.finished) return;
    const dt = delta / 1000;
    const vInput = this.virtualInput || {};

    this.clouds.forEach((c, idx) => {
      c.x += (8 + idx * 4) * dt;
      if (c.x > this.scale.width + 70) c.x = -70;
    });

    const up = this.cursors.up.isDown || this.keys.W.isDown || vInput.up;
    const down = this.cursors.down.isDown || this.keys.S.isDown || vInput.down;
    const left = this.cursors.left.isDown || this.keys.A.isDown || vInput.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || vInput.right;

    if (up) {
      this.speed = Math.min(this.maxSpeed, this.speed + 55 * dt);
    } else if (down) {
      this.speed = Math.max(0, this.speed - 95 * dt);
    } else {
      this.speed = Math.max(0, this.speed - 22 * dt);
    }

    let steerDir = 0;
    if (left) steerDir = -1;
    if (right) steerDir = 1;

    if (this.speed > 2) {
      this.playerX = Phaser.Math.Clamp(this.playerX + steerDir * 1.55 * dt, -1.0, 1.0);
    }

    const distDelta = this.speed * 4.3 * dt;
    this.distance += distDelta;
    this.roadZ += distDelta;

    this.render3DWorld(steerDir, time);
    this.emitTelemetry();
  }

  project3D(laneX, depthZ) {
    const { width, height } = this.scale;
    const maxViewZ = 700;
    const normalizedZ = Phaser.Math.Clamp(depthZ / maxViewZ, 0.01, 1);
    const perspective = 1 / (1 + normalizedZ * 4.5);

    const screenY = this.horizonY + (height - this.horizonY) * perspective;
    const roadHalfWidth = 34 + 355 * perspective;
    const screenX = width / 2 + laneX * roadHalfWidth;

    return { screenX, screenY, scale: perspective, roadHalfWidth };
  }

  render3DWorld(steerDir, time) {
    const { width } = this.scale;
    const gfx = this.worldGfx;
    gfx.clear();

    this.labelPool.forEach(l => l.setVisible(false));
    let labelIdx = 0;

    // 1. Road Perspective Slices
    const slices = 28;
    for (let i = slices - 1; i >= 0; i--) {
      const zNear = (i / slices) * 700;
      const zFar = ((i + 1) / slices) * 700;
      const pNear = this.project3D(0, zNear);
      const pFar = this.project3D(0, zFar);
      const stripePhase = Math.floor((this.roadZ + zNear) / 45) % 2 === 0;

      gfx.fillStyle(stripePhase ? 0x86efac : 0x4ade80, 1);
      gfx.fillRect(0, pFar.screenY, width, pNear.screenY - pFar.screenY + 1);

      const curbNear = pNear.roadHalfWidth * 1.09;
      const curbFar = pFar.roadHalfWidth * 1.09;
      gfx.fillStyle(stripePhase ? 0xf43f5e : 0xffffff, 1);
      gfx.fillPoints([
        { x: width / 2 - curbFar, y: pFar.screenY },
        { x: width / 2 + curbFar, y: pFar.screenY },
        { x: width / 2 + curbNear, y: pNear.screenY },
        { x: width / 2 - curbNear, y: pNear.screenY }
      ], true);

      gfx.fillStyle(stripePhase ? 0x334155 : 0x1e293b, 1);
      gfx.fillPoints([
        { x: width / 2 - pFar.roadHalfWidth, y: pFar.screenY },
        { x: width / 2 + pFar.roadHalfWidth, y: pFar.screenY },
        { x: width / 2 + pNear.roadHalfWidth, y: pNear.screenY },
        { x: width / 2 - pNear.roadHalfWidth, y: pNear.screenY }
      ], true);

      if (stripePhase) {
        gfx.fillStyle(0xfef08a, 0.95);
        [-0.36, 0.36].forEach(laneDiv => {
          const xNear = width / 2 + laneDiv * pNear.roadHalfWidth;
          const wNear = Math.max(2, 5 * pNear.scale);
          gfx.fillRect(xNear - wNear / 2, pFar.screenY, wNear, pNear.screenY - pFar.screenY);
        });
      }
    }

    // 2. Roadside Houses & Trees
    this.scenery.forEach(item => {
      let relZ = (item.z - (this.roadZ % 1800) + 1800) % 1800;
      if (relZ > 15 && relZ < 680) {
        const proj = this.project3D(item.side, relZ);
        if (item.type === 'house') {
          const hw = 70 * proj.scale;
          const hh = 50 * proj.scale;
          gfx.fillStyle(item.color, 1);
          gfx.lineStyle(2 * proj.scale, 0x18181b, 1);
          gfx.fillRect(proj.screenX - hw / 2, proj.screenY - hh, hw, hh);
          gfx.strokeRect(proj.screenX - hw / 2, proj.screenY - hh, hw, hh);
          gfx.fillStyle(0x18181b, 1);
          gfx.fillTriangle(
            proj.screenX - hw * 0.6, proj.screenY - hh,
            proj.screenX + hw * 0.6, proj.screenY - hh,
            proj.screenX, proj.screenY - hh * 1.55
          );
        } else {
          const trunkH = 35 * proj.scale;
          gfx.fillStyle(0x78350f, 1);
          gfx.fillRect(proj.screenX - 5 * proj.scale, proj.screenY - trunkH, 10 * proj.scale, trunkH);
          gfx.fillStyle(0x16a34a, 1);
          gfx.lineStyle(2 * proj.scale, 0x18181b, 1);
          gfx.fillCircle(proj.screenX, proj.screenY - trunkH - 15 * proj.scale, 24 * proj.scale);
          gfx.strokeCircle(proj.screenX, proj.screenY - trunkH - 15 * proj.scale, 24 * proj.scale);
        }
      }
    });

    // 3. Render 3-Lane Checkpoints & Finish Arch
    const visibleObstacles = this.obstacles
      .map(obs => ({ ...obs, relZ: obs.z - this.distance }))
      .filter(obs => obs.relZ > -25 && obs.relZ < 680)
      .sort((a, b) => b.relZ - a.relZ);

    visibleObstacles.forEach(obs => {
      const proj = this.project3D(obs.lane, Math.max(5, obs.relZ));
      const w = 88 * proj.scale;
      const h = 48 * proj.scale;

      if (obs.type === 'finish_arch') {
        const leftPost = this.project3D(-1.05, Math.max(5, obs.relZ));
        const rightPost = this.project3D(1.05, Math.max(5, obs.relZ));
        const archHeight = 130 * proj.scale;

        gfx.fillStyle(0xfacc15, 1);
        gfx.lineStyle(3 * proj.scale, 0x18181b, 1);
        gfx.fillRect(leftPost.screenX - 8 * proj.scale, proj.screenY - archHeight, 16 * proj.scale, archHeight);
        gfx.fillRect(rightPost.screenX - 8 * proj.scale, proj.screenY - archHeight, 16 * proj.scale, archHeight);
        gfx.fillRect(leftPost.screenX, proj.screenY - archHeight, rightPost.screenX - leftPost.screenX, 28 * proj.scale);
        gfx.strokeRect(leftPost.screenX, proj.screenY - archHeight, rightPost.screenX - leftPost.screenX, 28 * proj.scale);

        if (labelIdx < this.labelPool.length && obs.relZ < 560) {
          const lbl = this.labelPool[labelIdx++];
          lbl.setText(obs.signText);
          lbl.setPosition(width / 2, proj.screenY - archHeight - 4);
          lbl.setScale(Math.max(0.55, Math.min(1.05, proj.scale * 1.25)));
          lbl.setVisible(true);
        }
      } else {
        // Drive-Through Overhead Highway Gate Posts (Looks like a toll lane you drive under, NOT a solid wall!)
        gfx.fillStyle(0xffffff, 0.95);
        gfx.lineStyle(3 * proj.scale, 0x18181b, 1);
        // Left & Right thin support pillars for the lane gate
        gfx.fillRect(proj.screenX - w / 2, proj.screenY - h * 1.3, 6 * proj.scale, h * 1.3);
        gfx.fillRect(proj.screenX + w / 2 - 6 * proj.scale, proj.screenY - h * 1.3, 6 * proj.scale, h * 1.3);
        // Overhead Sign Banner
        gfx.fillRoundedRect(proj.screenX - w / 2, proj.screenY - h * 1.45, w, h * 0.55, 6 * proj.scale);
        gfx.strokeRoundedRect(proj.screenX - w / 2, proj.screenY - h * 1.45, w, h * 0.55, 6 * proj.scale);

        if (labelIdx < this.labelPool.length && obs.relZ < 540) {
          const lbl = this.labelPool[labelIdx++];
          lbl.setText(obs.signText);
          lbl.setPosition(proj.screenX, proj.screenY - h * 1.48);
          lbl.setScale(Math.max(0.5, Math.min(1.0, proj.scale * 1.2)));
          lbl.setVisible(true);
        }
      }

      // Collision Check: When truck passes through the checkpoint Z
      if (!obs.hit && obs.relZ <= 38 && obs.relZ >= -15) {
        if (obs.type === 'finish_arch') {
          obs.hit = true;
          this.finished = true;
          this.speed = 0;
          if (this.onFinishLine) this.onFinishLine();
        } else if (obs.type === 'choice') {
          // Find whichever lane gate at this Z milestone is closest to the player's current lane!
          const sameRow = this.obstacles.filter(o => Math.abs(o.z - obs.z) < 20 && !o.hit);
          if (sameRow.length > 0) {
            let chosenGate = sameRow[0];
            let minDist = Math.abs(this.playerX - chosenGate.lane);
            sameRow.forEach(candidate => {
              const d = Math.abs(this.playerX - candidate.lane);
              if (d < minDist) {
                minDist = d;
                chosenGate = candidate;
              }
            });

            // Mark entire row as resolved so only the chosen lane triggers
            sameRow.forEach(o => { o.hit = true; });

            if (chosenGate.fillsEscrow) {
              this.escrowCollected = true;
              if (this.onEscrowCheckpoint) this.onEscrowCheckpoint();
            }

            const popColor = chosenGate.cost < 0 ? '#fb7185' : '#4ade80';
            if (chosenGate.cost < -800) {
              this.cameras.main.shake(180, 0.01);
            }
            this.showPopup(chosenGate.outcomeTitle, popColor);

            if (this.onObstacleHit) {
              this.onObstacleHit({
                cost: chosenGate.cost,
                title: chosenGate.outcomeTitle,
                lesson: chosenGate.lesson
              });
            }
          }
        }
      }
    });

    this.drawPlayerTruck(gfx, steerDir, time);
  }

  drawPlayerTruck(gfx, steerDir, time) {
    const { width, height } = this.scale;
    const truckScreenX = width / 2 + this.playerX * 210;
    const bounce = this.speed > 2 ? Math.sin(time * 0.04) * 3 : 0;
    const truckY = height - 26 + bounce;
    const tilt = steerDir * 4.5;

    gfx.fillStyle(0x000000, 0.35);
    gfx.fillEllipse(truckScreenX, height - 14, 134, 22);

    gfx.fillStyle(0x18181b, 1);
    gfx.fillRoundedRect(truckScreenX - 60, truckY - 20, 24, 26, 6);
    gfx.fillRoundedRect(truckScreenX + 36, truckY - 20, 24, 26, 6);

    gfx.fillStyle(this.truckColor, 1);
    gfx.lineStyle(4, 0x18181b, 1);
    gfx.fillRoundedRect(truckScreenX - 56 + tilt, truckY - 86, 112, 70, 10);
    gfx.strokeRoundedRect(truckScreenX - 56 + tilt, truckY - 86, 112, 70, 10);

    gfx.fillStyle(0xffffff, 0.9);
    gfx.fillRoundedRect(truckScreenX - 52 + tilt, truckY - 84, 104, 14, 4);

    gfx.fillStyle(0x18181b, 1);
    gfx.fillRoundedRect(truckScreenX - 40 + tilt, truckY - 62, 80, 28, 6);
    if (this.escrowCollected) {
      gfx.fillStyle(0x38bdf8, 1);
      gfx.fillRoundedRect(truckScreenX - 36 + tilt, truckY - 58, 72, 20, 4);
    }

    const braking = this.cursors?.down?.isDown || this.keys?.S?.isDown;
    gfx.fillStyle(braking ? 0xff0000 : 0xfbbf24, 1);
    gfx.lineStyle(2, 0x18181b, 1);
    gfx.fillRect(truckScreenX - 48 + tilt, truckY - 26, 18, 8);
    gfx.strokeRect(truckScreenX - 48 + tilt, truckY - 26, 18, 8);
    gfx.fillRect(truckScreenX + 30 + tilt, truckY - 26, 18, 8);
    gfx.strokeRect(truckScreenX + 30 + tilt, truckY - 26, 18, 8);
  }
}

export default function PhaserCanvas({
  truckColor,
  onTelemetryUpdate,
  onObstacleHit,
  onEscrowCheckpoint,
  onFinishLine,
  sceneControlRef
}) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const scene = new EscrowFOVScene();
    scene.truckColor = truckColor || 0xf43f5e;
    scene.onTelemetryUpdate = onTelemetryUpdate;
    scene.onObstacleHit = onObstacleHit;
    scene.onEscrowCheckpoint = onEscrowCheckpoint;
    scene.onFinishLine = onFinishLine;

    const config = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 360,
      backgroundColor: '#38bdf8',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [scene],
    };

    gameRef.current = new Phaser.Game(config);

    if (sceneControlRef) {
      sceneControlRef.current = {
        toggleTurbo: () => scene.toggleTurbo(),
        setInput: (dir, val) => scene.setControlInput(dir, val),
      };
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="arcade-card rounded-3xl overflow-hidden bg-sky-300 p-1.5">
      <div ref={containerRef} className="w-full h-[260px] sm:h-[350px] rounded-2xl overflow-hidden border-3 border-zinc-900" />
    </div>
  );
}
