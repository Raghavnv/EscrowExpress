import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

class EscrowFOVScene extends Phaser.Scene {
  constructor() {
    super('EscrowFOVScene');
    this.speed = 0;
    this.maxSpeed = 85;
    this.distance = 0;
    this.targetDistance = 5000;
    this.playerX = 0;
    this.engineRunning = true;
    this.truckColor = 0xf43f5e;

    this.inTrafficJam = false;
    this.trafficCleared = false;
    this.trafficTimer = 8;
    this.escrowCollected = false;
    this.waivedInspectionTrap = false;
    this.trapTriggered = false;
    this.finished = false;
    this.roadZ = 0;
    this.obstacles = [];
    this.scenery = [];
  }

  create() {
    const { width } = this.scale;
    this.horizonY = 125;

    // 1. Bright Sunny Cartoon Sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x38bdf8, 0x38bdf8, 0xbae6fd, 0xfef08a, 1);
    sky.fillRect(0, 0, width, this.horizonY);

    // Bright Golden Sun
    this.add.circle(width - 110, 48, 34, 0xfacc15, 1).setStrokeStyle(4, 0x18181b);

    // Fluffy Cartoon Clouds
    this.clouds = [
      this.add.ellipse(140, 45, 95, 36, 0xffffff).setStrokeStyle(3, 0x18181b),
      this.add.ellipse(420, 62, 120, 40, 0xffffff).setStrokeStyle(3, 0x18181b),
      this.add.ellipse(620, 38, 85, 32, 0xffffff).setStrokeStyle(3, 0x18181b)
    ];

    // Rolling Green Cartoon Hills on Horizon
    const hills = this.add.graphics();
    hills.fillStyle(0x4ade80, 1);
    hills.lineStyle(3, 0x18181b, 1);
    hills.fillEllipse(180, this.horizonY + 10, 380, 70);
    hills.strokeEllipse(180, this.horizonY + 10, 380, 70);
    hills.fillStyle(0x22c55e, 1);
    hills.fillEllipse(580, this.horizonY + 15, 460, 80);
    hills.strokeEllipse(580, this.horizonY + 15, 460, 80);

    this.worldGfx = this.add.graphics();

    // Highway Overhead Signs (All styled like neutral classic road signs)
    this.labelPool = [];
    for (let i = 0; i < 12; i++) {
      const lbl = this.add.text(0, 0, '', {
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#18181b',
        backgroundColor: '#fef08a',
        padding: { x: 8, y: 5 }
      }).setOrigin(0.5, 1).setVisible(false).setDepth(20);
      this.labelPool.push(lbl);
    }

    // Pop-up Consequence Banner
    this.floatingPopup = this.add.text(width / 2, 195, '', {
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

    this.keys.SPACE.on('down', () => this.toggleEngine());

    this.setupNeutralHighwayChoices();

    // Spawn Colorful Roadside Suburban Houses & Trees
    const houseColors = [0xf87171, 0x60a5fa, 0xfbbf24, 0xc084fc];
    for (let z = 90; z < 1800; z += 180) {
      this.scenery.push({ z, side: -1.65, type: 'house', color: houseColors[(z / 180) % 4] });
      this.scenery.push({ z: z + 90, side: 1.65, type: 'tree' });
    }

    // 1-Second Timer for Underwriting Delay
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.inTrafficJam && !this.trafficCleared && !this.finished) {
          this.trafficTimer -= 1;
          const burn = this.engineRunning ? 150 : 0;
          if (this.onTrafficTick) {
            this.onTrafficTick(this.trafficTimer, burn, this.engineRunning);
          }
          if (burn > 0) {
            this.showPopup('-$150 RATE LOCK EXTENSION FEE!', '#fb7185');
          } else {
            this.showPopup('❄️ ENGINE OFF: $0 FEE BLEED!', '#38bdf8');
          }

          if (this.trafficTimer <= 0) {
            this.trafficCleared = true;
            this.inTrafficJam = false;
            this.showPopup('🟢 TRAFFIC CLEARED! START ENGINE [SPACE]!', '#4ade80');
            this.obstacles = this.obstacles.filter(o => o.type !== 'traffic_wall');
            if (this.onTrafficCleared) this.onTrafficCleared();
          }
        }
      }
    });
  }

  setupNeutralHighwayChoices() {
    this.obstacles = [
      // Fork 1 (Mile 0.7): Home Inspection
      {
        z: 700, lane: -0.75, type: 'choice',
        signText: '📋 WAIVE INSPECTION',
        outcomeTitle: 'Waived Home Inspection ($0 Today)',
        cost: 0,
        setsTrap: true,
        lesson: 'You paid $0 today by waiving the inspection—but any hidden plumbing or furnace defects are now your problem!'
      },
      {
        z: 700, lane: 0, type: 'choice',
        signText: '🛠️ PAY CONTRACTOR DIRECT',
        outcomeTitle: 'Paid Repairs Out-of-Pocket (-$2,400)',
        cost: -2400,
        lesson: 'Paying the contractor yourself fixed the roof, but drained $2,400 from your liquid Cash-to-Close tank.'
      },
      {
        z: 700, lane: 0.75, type: 'choice',
        signText: '🤝 REQUEST SELLER CREDIT',
        outcomeTitle: 'Seller Credit Negotiated! (-$300 Re-Inspect)',
        cost: -300,
        lesson: 'Smart move! Using your Inspection Contingency, the seller credited $2,400 toward closing, costing you only a $300 re-inspection fee.'
      },

      // Fork 2 (Mile 1.5): Loan Estimate Form Review
      {
        z: 1500, lane: -0.65, type: 'choice',
        signText: '⚡ EXPRESS COURIER PACKAGE',
        outcomeTitle: 'Charged Padded "Junk Fee" (-$650)',
        cost: -650,
        lesson: '"Express Courier & Admin Package" is a classic lender Junk Fee! Always challenge padded admin charges on your Loan Estimate.'
      },
      {
        z: 1500, lane: 0.65, type: 'choice',
        signText: '🔍 AUDIT LOAN ESTIMATE',
        outcomeTitle: 'Junk Fees Waived! (+$600 Saved)',
        cost: 600,
        lesson: 'Auditing your Loan Estimate line-by-line forced the lender to remove $600 in bogus processing fees!'
      },

      // Milestone (Mile 2.2): Underwriting Traffic Jam
      { z: 2250, lane: -0.8, type: 'traffic_wall', signText: '🛑 UNDERWRITING TRAFFIC' },
      { z: 2250, lane: 0, type: 'traffic_wall', signText: '🛑 PAPERWORK DELAY AHEAD' },
      { z: 2250, lane: 0.8, type: 'traffic_wall', signText: '🛑 UNDERWRITING TRAFFIC' },

      // Fork 3 (Mile 3.0): Low Home Appraisal
      {
        z: 3050, lane: -0.65, type: 'choice',
        signText: '💵 PAY APPRAISAL DIFFERENCE',
        outcomeTitle: 'Paid Appraisal Gap in Cash (-$2,500)',
        cost: -2500,
        lesson: 'Paying the Appraisal Gap out-of-pocket kept the deal alive, but took a $2,500 bite out of your cash reserves.'
      },
      {
        z: 3050, lane: 0.65, type: 'choice',
        signText: '📊 APPEAL WITH COMP SALES',
        outcomeTitle: 'Comps Appeal Accepted! (-$200 Filing)',
        cost: -200,
        lesson: 'Submitting comparable neighborhood sales ("Comps") justified the price and saved you from paying a $2,500 gap!'
      },

      // Milestone (Mile 3.8): Mandatory Escrow Weigh Station
      {
        z: 3850, lane: 0, type: 'escrow_arch',
        signText: '⚖️ ESCROW WEIGH STATION (PREPAID TAX & INSURANCE)'
      },

      // Fork 4 (Mile 4.5): Closing Wire Transfer
      {
        z: 4500, lane: -0.65, type: 'choice',
        signText: '📧 USE EMAILED WIRE LINK',
        outcomeTitle: 'Wire Fraud Spoof Penalty! (-$1,800)',
        cost: -1800,
        lesson: 'Never trust sudden emailed wire instructions! Wire scammers target homebuyers right before closing day.'
      },
      {
        z: 4500, lane: 0.65, type: 'choice',
        signText: '📞 CALL TITLE OFFICER DIRECT',
        outcomeTitle: 'Verified Safe Wire + Earnest Credit (+$500)',
        cost: 500,
        lesson: 'Calling the Title Office directly verified safe routing and applied your Earnest Money deposit credit!'
      },

      // Finish Line (Mile 5.0)
      {
        z: 5000, lane: 0, type: 'finish_arch',
        signText: '🏁 COUNTY TITLE OFFICE — GET YOUR KEYS!'
      }
    ];
  }

  showPopup(text, color = '#ffffff') {
    if (!this.floatingPopup) return;
    this.floatingPopup.setText(text);
    this.floatingPopup.setColor(color);
    this.floatingPopup.setAlpha(1);
    this.floatingPopup.y = 195;
    this.tweens.killTweensOf(this.floatingPopup);
    this.tweens.add({
      targets: this.floatingPopup,
      y: 145,
      alpha: 0,
      duration: 2400,
      ease: 'Cubic.easeOut'
    });
  }

  toggleEngine() {
    this.engineRunning = !this.engineRunning;
    this.showPopup(this.engineRunning ? '🔥 ENGINE ON!' : '❄️ ENGINE CUT OFF!', this.engineRunning ? '#4ade80' : '#38bdf8');
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
        engineRunning: this.engineRunning,
        inTrafficJam: this.inTrafficJam,
        trafficTimer: this.trafficTimer
      });
    }
  }

  update(time, delta) {
    if (this.finished) return;
    const dt = delta / 1000;
    const vInput = this.virtualInput || {};

    // Drift clouds gently
    this.clouds.forEach((c, idx) => {
      c.x += (8 + idx * 4) * dt;
      if (c.x > this.scale.width + 70) c.x = -70;
    });

    const up = this.cursors.up.isDown || this.keys.W.isDown || vInput.up;
    const down = this.cursors.down.isDown || this.keys.S.isDown || vInput.down;
    const left = this.cursors.left.isDown || this.keys.A.isDown || vInput.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || vInput.right;

    if (this.engineRunning && up && !this.inTrafficJam) {
      this.speed = Math.min(this.maxSpeed, this.speed + 52 * dt);
    } else if (down) {
      this.speed = Math.max(0, this.speed - 95 * dt);
    } else {
      this.speed = Math.max(0, this.speed - 24 * dt);
    }

    if (this.inTrafficJam && !this.trafficCleared) {
      this.speed = 0;
    }

    let steerDir = 0;
    if (left) steerDir = -1;
    if (right) steerDir = 1;

    if (this.speed > 2) {
      this.playerX = Phaser.Math.Clamp(this.playerX + steerDir * 1.45 * dt, -1.05, 1.05);
    }

    const distDelta = this.speed * 4.2 * dt;
    this.distance += distDelta;
    this.roadZ += distDelta;

    // Delayed Furnace Trap at Mile 4.2 if Inspection was Waived
    if (this.waivedInspectionTrap && !this.trapTriggered && this.distance >= 4150) {
      this.trapTriggered = true;
      this.cameras.main.shake(350, 0.02);
      this.showPopup('💥 UNINSPECTED FURNACE EXPLODED! (-$3,200)', '#fb7185');
      if (this.onObstacleHit) {
        this.onObstacleHit({
          cost: -3200,
          title: 'Delayed Trap: Uninspected Furnace Failed (-$3,200)',
          lesson: 'Because you waived the Home Inspection at Mile 0.7, a broken furnace went unnoticed and cost you $3,200 right before closing!'
        });
      }
    }

    // Approaching Underwriting Traffic at Mile 2.2
    if (!this.trafficCleared && !this.inTrafficJam && this.distance >= 2110 && this.distance < 2260) {
      if (this.speed > 45 && this.distance >= 2190) {
        this.speed = 0;
        this.inTrafficJam = true;
        this.cameras.main.shake(300, 0.02);
        this.showPopup('💥 REAR-ENDED UNDERWRITING TRAFFIC! (-$1,000)', '#fb7185');
        if (this.onObstacleHit) {
          this.onObstacleHit({
            cost: -1000,
            title: 'Crashed into Underwriting Backlog (-$1,000 Rush Fee)',
            lesson: 'You didn’t brake in time! Now you’re stuck in underwriting traffic—remember how to stop your Rate Lock from burning fees!'
          });
        }
      } else if (this.distance >= 2165) {
        this.speed = 0;
        this.inTrafficJam = true;
        this.showPopup('🛑 STUCK IN UNDERWRITING TRAFFIC!', '#facc15');
      }
    }

    this.render3DWorld(steerDir, time);
    this.emitTelemetry();
  }

  project3D(laneX, depthZ) {
    const { width, height } = this.scale;
    const maxViewZ = 700;
    const normalizedZ = Phaser.Math.Clamp(depthZ / maxViewZ, 0.01, 1);
    const perspective = 1 / (1 + normalizedZ * 4.5);

    const screenY = this.horizonY + (height - this.horizonY) * perspective;
    const roadHalfWidth = 32 + 350 * perspective;
    const screenX = width / 2 + laneX * roadHalfWidth;

    return { screenX, screenY, scale: perspective, roadHalfWidth };
  }

  render3DWorld(steerDir, time) {
    const { width } = this.scale;
    const gfx = this.worldGfx;
    gfx.clear();

    this.labelPool.forEach(l => l.setVisible(false));
    let labelIdx = 0;

    // 1. Sunny Grass & Cartoon Road Slices
    const slices = 28;
    for (let i = slices - 1; i >= 0; i--) {
      const zNear = (i / slices) * 700;
      const zFar = ((i + 1) / slices) * 700;
      const pNear = this.project3D(0, zNear);
      const pFar = this.project3D(0, zFar);
      const stripePhase = Math.floor((this.roadZ + zNear) / 45) % 2 === 0;

      // Bright Lawn Grass
      gfx.fillStyle(stripePhase ? 0x86efac : 0x4ade80, 1);
      gfx.fillRect(0, pFar.screenY, width, pNear.screenY - pFar.screenY + 1);

      // Festive Red & White Rumble Strips
      const curbNear = pNear.roadHalfWidth * 1.09;
      const curbFar = pFar.roadHalfWidth * 1.09;
      gfx.fillStyle(stripePhase ? 0xf43f5e : 0xffffff, 1);
      gfx.fillPoints([
        { x: width / 2 - curbFar, y: pFar.screenY },
        { x: width / 2 + curbFar, y: pFar.screenY },
        { x: width / 2 + curbNear, y: pNear.screenY },
        { x: width / 2 - curbNear, y: pNear.screenY }
      ], true);

      // Clean Asphalt Road
      gfx.fillStyle(stripePhase ? 0x334155 : 0x1e293b, 1);
      gfx.fillPoints([
        { x: width / 2 - pFar.roadHalfWidth, y: pFar.screenY },
        { x: width / 2 + pFar.roadHalfWidth, y: pFar.screenY },
        { x: width / 2 + pNear.roadHalfWidth, y: pNear.screenY },
        { x: width / 2 - pNear.roadHalfWidth, y: pNear.screenY }
      ], true);

      // Lane Dividers
      if (stripePhase) {
        gfx.fillStyle(0xfef08a, 0.95);
        [-0.35, 0.35].forEach(laneDiv => {
          const xNear = width / 2 + laneDiv * pNear.roadHalfWidth;
          const wNear = Math.max(2, 5 * pNear.scale);
          gfx.fillRect(xNear - wNear / 2, pFar.screenY, wNear, pNear.screenY - pFar.screenY);
        });
      }
    }

    // 2. Render Cute Suburban Houses & Trees Along the Road
    this.scenery.forEach(item => {
      let relZ = (item.z - (this.roadZ % 1800) + 1800) % 1800;
      if (relZ > 15 && relZ < 680) {
        const proj = this.project3D(item.side, relZ);
        if (item.type === 'house') {
          const hw = 70 * proj.scale;
          const hh = 50 * proj.scale;
          // House walls
          gfx.fillStyle(item.color, 1);
          gfx.lineStyle(2 * proj.scale, 0x18181b, 1);
          gfx.fillRect(proj.screenX - hw / 2, proj.screenY - hh, hw, hh);
          gfx.strokeRect(proj.screenX - hw / 2, proj.screenY - hh, hw, hh);
          // Pitched Roof
          gfx.fillStyle(0x18181b, 1);
          gfx.fillTriangle(
            proj.screenX - hw * 0.6, proj.screenY - hh,
            proj.screenX + hw * 0.6, proj.screenY - hh,
            proj.screenX, proj.screenY - hh * 1.55
          );
        } else {
          // Cartoon Tree
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

    // 3. Render Neutral Highway Decision Gates
    const visibleObstacles = this.obstacles
      .map(obs => ({ ...obs, relZ: obs.z - this.distance }))
      .filter(obs => obs.relZ > -25 && obs.relZ < 680)
      .sort((a, b) => b.relZ - a.relZ);

    visibleObstacles.forEach(obs => {
      const proj = this.project3D(obs.lane, Math.max(5, obs.relZ));
      const w = 96 * proj.scale;
      const h = 54 * proj.scale;

      if (obs.type === 'escrow_arch' || obs.type === 'finish_arch') {
        const leftPost = this.project3D(-1.05, Math.max(5, obs.relZ));
        const rightPost = this.project3D(1.05, Math.max(5, obs.relZ));
        const archHeight = 130 * proj.scale;
        const archColor = obs.type === 'escrow_arch' ? 0x38bdf8 : 0xfacc15;

        gfx.fillStyle(archColor, 1);
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
        // Neutral Highway Sign (Identical Gold/White Sign Style for all choices!)
        const gateColor = obs.type === 'traffic_wall' ? 0xf43f5e : 0xffffff;
        gfx.fillStyle(gateColor, 0.96);
        gfx.lineStyle(3 * proj.scale, 0x18181b, 1);
        gfx.fillRoundedRect(proj.screenX - w / 2, proj.screenY - h, w, h, 8 * proj.scale);
        gfx.strokeRoundedRect(proj.screenX - w / 2, proj.screenY - h, w, h, 8 * proj.scale);

        if (labelIdx < this.labelPool.length && obs.relZ < 520) {
          const lbl = this.labelPool[labelIdx++];
          lbl.setText(obs.signText);
          lbl.setPosition(proj.screenX, proj.screenY - h - 4);
          lbl.setScale(Math.max(0.55, Math.min(1.05, proj.scale * 1.25)));
          lbl.setVisible(true);
        }
      }

      // Collision Check
      if (!obs.hit && obs.relZ <= 42 && obs.relZ >= -10) {
        if (obs.type === 'escrow_arch') {
          obs.hit = true;
          this.escrowCollected = true;
          this.showPopup('⚖️ $4,200 LOADED INTO ESCROW TANK!', '#38bdf8');
          if (this.onEscrowCheckpoint) this.onEscrowCheckpoint();
        } else if (obs.type === 'finish_arch') {
          obs.hit = true;
          this.finished = true;
          this.speed = 0;
          if (this.onFinishLine) this.onFinishLine();
        } else if (obs.type === 'choice' && Math.abs(this.playerX - obs.lane) < 0.44) {
          obs.hit = true;
          this.obstacles.forEach(other => {
            if (Math.abs(other.z - obs.z) < 20) other.hit = true;
          });

          if (obs.setsTrap) {
            this.waivedInspectionTrap = true;
          }

          const popColor = obs.cost < -500 ? '#fb7185' : obs.cost > 0 ? '#4ade80' : '#facc15';
          if (obs.cost < -500) {
            this.cameras.main.shake(200, 0.012);
          }
          this.showPopup(obs.outcomeTitle, popColor);

          if (this.onObstacleHit) {
            this.onObstacleHit({
              cost: obs.cost,
              title: obs.outcomeTitle,
              lesson: obs.lesson
            });
          }
        }
      }
    });

    this.drawPlayerTruck(gfx, steerDir, time);
  }

  drawPlayerTruck(gfx, steerDir, time) {
    const { width, height } = this.scale;
    const truckScreenX = width / 2 + this.playerX * 210;
    const bounce = this.speed > 2 ? Math.sin(time * 0.04) * 3 : (this.engineRunning ? Math.sin(time * 0.08) * 1 : 0);
    const truckY = height - 26 + bounce;
    const tilt = steerDir * 4.5;

    // Shadow
    gfx.fillStyle(0x000000, 0.35);
    gfx.fillEllipse(truckScreenX, height - 14, 134, 22);

    // Chunky Cartoon Tires
    gfx.fillStyle(0x18181b, 1);
    gfx.fillRoundedRect(truckScreenX - 60, truckY - 20, 24, 26, 6);
    gfx.fillRoundedRect(truckScreenX + 36, truckY - 20, 24, 26, 6);

    // Truck Body with Thick Comic Ink Border
    gfx.fillStyle(this.truckColor, 1);
    gfx.lineStyle(4, 0x18181b, 1);
    gfx.fillRoundedRect(truckScreenX - 56 + tilt, truckY - 86, 112, 70, 10);
    gfx.strokeRoundedRect(truckScreenX - 56 + tilt, truckY - 86, 112, 70, 10);

    // White Roof Cap
    gfx.fillStyle(0xffffff, 0.9);
    gfx.fillRoundedRect(truckScreenX - 52 + tilt, truckY - 84, 104, 14, 4);

    // Escrow Glass Tank Window on Back of Truck
    gfx.fillStyle(0x18181b, 1);
    gfx.fillRoundedRect(truckScreenX - 40 + tilt, truckY - 62, 80, 28, 6);
    if (this.escrowCollected) {
      gfx.fillStyle(0x38bdf8, 1);
      gfx.fillRoundedRect(truckScreenX - 36 + tilt, truckY - 58, 72, 20, 4);
    }

    // Brake Lights
    const braking = this.cursors?.down?.isDown || this.keys?.S?.isDown || this.inTrafficJam;
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
  onTrafficTick,
  onTrafficCleared,
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
    scene.onTrafficTick = onTrafficTick;
    scene.onTrafficCleared = onTrafficCleared;
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
        toggleEngine: () => scene.toggleEngine(),
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
