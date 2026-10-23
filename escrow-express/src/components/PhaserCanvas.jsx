import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

class EscrowFOVScene extends Phaser.Scene {
  constructor() {
    super('EscrowFOVScene');
    this.speed = 0;
    this.maxSpeed = 85;
    this.distance = 0; // 0 to 5000 (5.0 miles)
    this.targetDistance = 5000;
    this.playerX = 0; // -1 (Left Lane), 0 (Center), 1 (Right Lane)
    this.steerVelocity = 0;
    this.engineRunning = true;
    this.truckColor = 0x6366f1;

    // Traffic Jam & Milestone states
    this.inTrafficJam = false;
    this.trafficCleared = false;
    this.trafficTimer = 8;
    this.escrowCollected = false;
    this.finished = false;
    this.roadZ = 0;
    this.obstacles = [];
    this.scenery = [];
  }

  create() {
    const { width, height } = this.scale;
    this.horizonY = 125;

    // 1. Cyber-Sunset Sky Gradient & Sun
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x090d16, 0x090d16, 0x311042, 0x7c2d12, 1);
    sky.fillRect(0, 0, width, this.horizonY);

    // Retro Glowing Sun on Horizon
    this.sun = this.add.circle(width / 2, this.horizonY - 18, 42, 0xf59e0b, 0.85);
    this.add.circle(width / 2, this.horizonY - 18, 54, 0xf97316, 0.25);

    // City Skyline Silhouette
    const skyline = this.add.graphics();
    skyline.fillStyle(0x0f172a, 1);
    const buildings = [
      [40, 35, 30], [75, 50, 25], [120, 28, 40], [280, 45, 30],
      [360, 65, 45], [410, 40, 30], [490, 55, 35], [640, 45, 40], [710, 30, 50]
    ];
    buildings.forEach(([bx, bh, bw]) => {
      skyline.fillRect(bx, this.horizonY - bh, bw, bh);
    });

    // Dynamic Graphics Layer for 3D Road, Scenery, and Obstacles
    this.worldGfx = this.add.graphics();

    // Overlay Text Container for 3D Floating Signs
    this.labelPool = [];
    for (let i = 0; i < 10; i++) {
      const lbl = this.add.text(0, 0, '', {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#0f172ae6',
        padding: { x: 6, y: 3 }
      }).setOrigin(0.5, 1).setVisible(false).setDepth(20);
      this.labelPool.push(lbl);
    }

    // Floating Pop-up Feedback Text (e.g., "+$1,500 SELLER CREDIT!")
    this.floatingPopup = this.add.text(width / 2, 190, '', {
      fontSize: '18px',
      fontStyle: '900',
      color: '#34d399',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(40).setAlpha(0);

    // Keyboard Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    // Spacebar to toggle Engine On/Off
    this.keys.SPACE.on('down', () => {
      this.toggleEngine();
    });

    // Spawn Highway Obstacles & Milestones along the 5,000m route
    this.setupHighwayEvents();

    // Spawn Roadside Scenery (Trees / Streetlights)
    for (let z = 100; z < 2000; z += 160) {
      this.scenery.push({ z, side: -1.6 });
      this.scenery.push({ z: z + 80, side: 1.6 });
    }

    // 1-Second Timer for Underwriting Traffic Jam Fee Burn
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
            this.showPopup('-$150 IDLING RATE-LOCK FEE! (CUT ENGINE!)', '#f87171');
          } else {
            this.showPopup('❄️ ENGINE OFF: $0 FEE BLEED!', '#38bdf8');
          }

          if (this.trafficTimer <= 0) {
            this.trafficCleared = true;
            this.inTrafficJam = false;
            this.showPopup('🟢 UNDERWRITING CLEARED! START ENGINE & DRIVE!', '#34d399');
            // Remove traffic barrier cars
            this.obstacles = this.obstacles.filter(o => o.type !== 'traffic_wall');
            if (this.onTrafficCleared) this.onTrafficCleared();
          }
        }
      }
    });
  }

  setupHighwayEvents() {
    this.obstacles = [
      // Mile 0.5: Inspection Roof Defect vs Seller Credit
      { z: 550, lane: -0.75, type: 'defect', title: '🕳️ LEAKY ROOF (-$1,400)', cost: -1400, reason: 'Inspection Repair: Paid out-of-pocket for roof leak' },
      { z: 550, lane: 0.75, type: 'credit', title: '🤝 NEGOTIATE CREDIT (+$1,200)', cost: 1200, reason: 'Seller Credit: Negotiated seller credit for roof defect!' },

      // Mile 1.0: Junk Fee Trap
      { z: 1050, lane: 0, type: 'junk', title: '💸 LENDER JUNK FEE (-$650)', cost: -650, reason: 'Bogus Admin Courier Fee (Failed to dodge)' },
      { z: 1150, lane: -0.8, type: 'boost', title: '💎 EARNEST DEPOSIT CREDIT (+$1,000)', cost: 1000, reason: 'Earnest Money Deposit credited toward closing!' },

      // Mile 1.6: HVAC Inspection Fork
      { z: 1650, lane: 0.7, type: 'defect', title: '🔥 BROKEN FURNACE (-$2,200)', cost: -2200, reason: 'HVAC Replacement paid from liquid cash reserves' },
      { z: 1650, lane: -0.7, type: 'credit', title: '🛠️ SELLER REPAIR CREDIT (+$1,500)', cost: 1500, reason: 'Seller covered furnace repair via closing credit!' },

      // Mile 2.2: Underwriting Paperwork Traffic Jam (All 3 lanes blocked!)
      { z: 2250, lane: -0.8, type: 'traffic_wall', title: '🛑 UNDERWRITING TRAFFIC', cost: -1500 },
      { z: 2250, lane: 0, type: 'traffic_wall', title: '🛑 BRAKE & CUT ENGINE [SPACE]!', cost: -1500 },
      { z: 2250, lane: 0.8, type: 'traffic_wall', title: '🛑 RATE LOCK BLEED AHEAD', cost: -1500 },

      // Mile 3.0: Appraisal Gap vs Price Renegotiation
      { z: 3000, lane: -0.7, type: 'defect', title: '📉 APPRAISAL GAP (-$1,800)', cost: -1800, reason: 'Appraisal came in low—paid cash to bridge the gap' },
      { z: 3000, lane: 0.7, type: 'credit', title: '📋 APPEAL APPRAISAL ($0 LOSS)', cost: 500, reason: 'Successfully appealed low appraisal with comps!' },

      // Mile 3.8: Mandatory Escrow Weigh Station Arch (Spans Highway)
      { z: 3800, lane: 0, type: 'escrow_arch', title: '⚖️ ESCROW WEIGH STATION (-$4,200 TAX & INS.)', cost: -4200 },

      // Mile 4.4: Final Walkthrough Check
      { z: 4400, lane: 0.6, type: 'junk', title: '💸 WIRE TRANSFER SCAM (-$1,200)', cost: -1200, reason: 'Unverified wire fee penalty' },
      { z: 4450, lane: -0.7, type: 'boost', title: '🏡 FIRST-TIME BUYER GRANT (+$1,500)', cost: 1500, reason: 'Local First-Time Buyer Closing Grant applied!' },

      // Mile 5.0: Finish Line (County Title Office)
      { z: 5000, lane: 0, type: 'finish_arch', title: '🏛️ COUNTY TITLE OFFICE — CLOSING TABLE!', cost: 0 }
    ];
  }

  showPopup(text, color = '#34d399') {
    if (!this.floatingPopup) return;
    this.floatingPopup.setText(text);
    this.floatingPopup.setColor(color);
    this.floatingPopup.setAlpha(1);
    this.floatingPopup.y = 195;
    this.tweens.killTweensOf(this.floatingPopup);
    this.tweens.add({
      targets: this.floatingPopup,
      y: 155,
      alpha: 0,
      duration: 2100,
      ease: 'Cubic.easeOut'
    });
  }

  toggleEngine() {
    this.engineRunning = !this.engineRunning;
    if (!this.engineRunning) {
      this.showPopup('❄️ ENGINE CUT OFF (FUEL / RATE LOCK PAUSED)', '#38bdf8');
    } else {
      this.showPopup('🔥 ENGINE STARTED! PRESS [W / ▲] TO DRIVE', '#34d399');
    }
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        speed: Math.round(this.speed),
        distance: this.distance,
        engineRunning: this.engineRunning,
        inTrafficJam: this.inTrafficJam,
        trafficTimer: this.trafficTimer
      });
    }
  }

  setControlInput(action, value) {
    this.virtualInput = this.virtualInput || {};
    this.virtualInput[action] = value;
  }

  update(time, delta) {
    if (this.finished) return;
    const dt = delta / 1000;
    const vInput = this.virtualInput || {};

    // 1. Handle Throttle & Braking
    const upPressed = this.cursors.up.isDown || this.keys.W.isDown || vInput.up;
    const downPressed = this.cursors.down.isDown || this.keys.S.isDown || vInput.down;
    const leftPressed = this.cursors.left.isDown || this.keys.A.isDown || vInput.left;
    const rightPressed = this.cursors.right.isDown || this.keys.D.isDown || vInput.right;

    if (this.engineRunning && upPressed && !this.inTrafficJam) {
      this.speed = Math.min(this.maxSpeed, this.speed + 48 * dt);
    } else if (downPressed) {
      this.speed = Math.max(0, this.speed - 95 * dt);
    } else {
      // Natural friction coasting
      this.speed = Math.max(0, this.speed - 22 * dt);
    }

    // Stop forward motion if sitting at traffic jam barrier
    if (this.inTrafficJam && !this.trafficCleared) {
      this.speed = 0;
    }

    // 2. Handle Steering (Only steers when moving or rolling)
    let steerDir = 0;
    if (leftPressed) steerDir = -1;
    if (rightPressed) steerDir = 1;

    if (this.speed > 2) {
      this.playerX = Phaser.Math.Clamp(this.playerX + steerDir * 1.45 * dt, -1.05, 1.05);
    }

    // 3. Advance Highway Distance
    const distDelta = this.speed * 4.2 * dt;
    this.distance += distDelta;
    this.roadZ += distDelta;

    // Check if approaching Traffic Jam Wall (Mile 2.2 / z = 2250)
    if (!this.trafficCleared && !this.inTrafficJam && this.distance >= 2110 && this.distance < 2260) {
      if (this.speed > 45 && this.distance >= 2190) {
        // Rear-ended traffic because player didn't brake!
        this.speed = 0;
        this.inTrafficJam = true;
        this.cameras.main.shake(300, 0.02);
        this.showPopup('💥 CRASHED INTO UNDERWRITING DELAY! (-$1,000)', '#ef4444');
        if (this.onObstacleHit) {
          this.onObstacleHit({
            cost: -1000,
            title: 'Rear-Ended Underwriting Backlog',
            lesson: 'Rushing into underwriting without preparing your paperwork causes costly rush fees! Cut your engine [SPACE] now!'
          });
        }
      } else if (this.distance >= 2165) {
        // Stopped safely at traffic jam
        this.speed = 0;
        this.inTrafficJam = true;
        this.showPopup('🛑 TRAFFIC GRIDLOCK! PRESS [SPACE] TO CUT ENGINE!', '#fbbf24');
      }
    }

    // 4. Render 3D Perspective World
    this.render3DWorld(steerDir, time);

    // 5. Emit Telemetry to React HUD
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

  // Projects 3D world coordinates (laneX, depthZ) onto 2D screen perspective
  project3D(laneX, depthZ) {
    const { width, height } = this.scale;
    const maxViewZ = 700;
    const normalizedZ = Phaser.Math.Clamp(depthZ / maxViewZ, 0.01, 1);
    // Perspective curve (closer = 0, horizon = 1)
    const perspective = 1 / (1 + normalizedZ * 4.5);

    const screenY = this.horizonY + (height - this.horizonY) * perspective;
    const roadHalfWidth = 30 + 350 * perspective;
    const screenX = width / 2 + laneX * roadHalfWidth;

    return { screenX, screenY, scale: perspective, roadHalfWidth };
  }

  render3DWorld(steerDir, time) {
    const { width, height } = this.scale;
    const gfx = this.worldGfx;
    gfx.clear();

    // Hide all pooled text labels first
    this.labelPool.forEach(l => l.setVisible(false));
    let labelIdx = 0;

    // 1. Draw Ground & Road Trapezoid Slices from Horizon to Bottom
    const slices = 28;
    for (let i = slices - 1; i >= 0; i--) {
      const zNear = (i / slices) * 700;
      const zFar = ((i + 1) / slices) * 700;

      const pNear = this.project3D(0, zNear);
      const pFar = this.project3D(0, zFar);

      const stripePhase = Math.floor((this.roadZ + zNear) / 45) % 2 === 0;

      // Grass Shoulder
      gfx.fillStyle(stripePhase ? 0x064e3b : 0x042f2e, 1);
      gfx.fillRect(0, pFar.screenY, width, pNear.screenY - pFar.screenY + 1);

      // Rumble Curbs
      const curbNear = pNear.roadHalfWidth * 1.08;
      const curbFar = pFar.roadHalfWidth * 1.08;
      gfx.fillStyle(stripePhase ? 0xef4444 : 0xf8fafc, 1);
      gfx.fillPoints([
        { x: width / 2 - curbFar, y: pFar.screenY },
        { x: width / 2 + curbFar, y: pFar.screenY },
        { x: width / 2 + curbNear, y: pNear.screenY },
        { x: width / 2 - curbNear, y: pNear.screenY }
      ], true);

      // Asphalt Road
      gfx.fillStyle(stripePhase ? 0x1e293b : 0x0f172a, 1);
      gfx.fillPoints([
        { x: width / 2 - pFar.roadHalfWidth, y: pFar.screenY },
        { x: width / 2 + pFar.roadHalfWidth, y: pFar.screenY },
        { x: width / 2 + pNear.roadHalfWidth, y: pNear.screenY },
        { x: width / 2 - pNear.roadHalfWidth, y: pNear.screenY }
      ], true);

      // 3-Lane Dashed Dividers
      if (stripePhase) {
        gfx.fillStyle(0xfbbf24, 0.85);
        [-0.35, 0.35].forEach(laneDiv => {
          const xNear = width / 2 + laneDiv * pNear.roadHalfWidth;
          const xFar = width / 2 + laneDiv * pFar.roadHalfWidth;
          const wNear = Math.max(1.5, 5 * pNear.scale);
          gfx.fillRect(xNear - wNear / 2, pFar.screenY, wNear, pNear.screenY - pFar.screenY);
        });
      }
    }

    // 2. Render Roadside Trees / Streetlights
    this.scenery.forEach(item => {
      let relZ = (item.z - (this.roadZ % 1800) + 1800) % 1800;
      if (relZ > 10 && relZ < 680) {
        const proj = this.project3D(item.side, relZ);
        const poleH = 95 * proj.scale;
        gfx.fillStyle(0x64748b, 1);
        gfx.fillRect(proj.screenX - 2 * proj.scale, proj.screenY - poleH, 4 * proj.scale, poleH);
        // Neon streetlamp glow
        gfx.fillStyle(0x38bdf8, 0.9);
        gfx.fillCircle(proj.screenX - (item.side > 0 ? 8 : -8) * proj.scale, proj.screenY - poleH, 6 * proj.scale);
      }
    });

    // 3. Render & Check Collisions for Highway Obstacles (Sorted Far to Near)
    const visibleObstacles = this.obstacles
      .map(obs => ({ ...obs, relZ: obs.z - this.distance }))
      .filter(obs => obs.relZ > -25 && obs.relZ < 680)
      .sort((a, b) => b.relZ - a.relZ);

    visibleObstacles.forEach(obs => {
      const proj = this.project3D(obs.lane, Math.max(5, obs.relZ));
      const w = 85 * proj.scale;
      const h = 55 * proj.scale;

      if (obs.type === 'escrow_arch' || obs.type === 'finish_arch') {
        // Full-Highway Toll Arch
        const leftPost = this.project3D(-1.05, Math.max(5, obs.relZ));
        const rightPost = this.project3D(1.05, Math.max(5, obs.relZ));
        const archHeight = 130 * proj.scale;
        const archColor = obs.type === 'escrow_arch' ? 0x0284c7 : 0x10b981;

        gfx.fillStyle(archColor, 0.95);
        gfx.fillRect(leftPost.screenX - 8 * proj.scale, proj.screenY - archHeight, 16 * proj.scale, archHeight);
        gfx.fillRect(rightPost.screenX - 8 * proj.scale, proj.screenY - archHeight, 16 * proj.scale, archHeight);
        gfx.fillRect(leftPost.screenX, proj.screenY - archHeight, rightPost.screenX - leftPost.screenX, 28 * proj.scale);

        if (labelIdx < this.labelPool.length && obs.relZ < 550) {
          const lbl = this.labelPool[labelIdx++];
          lbl.setText(obs.title);
          lbl.setPosition(width / 2, proj.screenY - archHeight - 4);
          lbl.setScale(Math.max(0.55, Math.min(1.1, proj.scale * 1.3)));
          lbl.setVisible(true);
        }
      } else {
        // Lane Gate / Crate / Traffic Car / Pothole
        let boxColor = 0xef4444;
        if (obs.type === 'credit') boxColor = 0x10b981;
        if (obs.type === 'boost') boxColor = 0xf59e0b;
        if (obs.type === 'junk') boxColor = 0xa855f7;
        if (obs.type === 'traffic_wall') boxColor = 0xdc2626;

        gfx.fillStyle(boxColor, 0.92);
        gfx.fillRoundedRect(proj.screenX - w / 2, proj.screenY - h, w, h, 6 * proj.scale);
        gfx.lineStyle(2 * proj.scale, 0xffffff, 0.9);
        gfx.strokeRoundedRect(proj.screenX - w / 2, proj.screenY - h, w, h, 6 * proj.scale);

        if (labelIdx < this.labelPool.length && obs.relZ < 480) {
          const lbl = this.labelPool[labelIdx++];
          lbl.setText(obs.title);
          lbl.setPosition(proj.screenX, proj.screenY - h - 4);
          lbl.setScale(Math.max(0.5, Math.min(1.0, proj.scale * 1.25)));
          lbl.setVisible(true);
        }
      }

      // Check Collision with Player Truck (Player sits around relZ = 18..45)
      if (!obs.hit && obs.relZ <= 42 && obs.relZ >= -10) {
        if (obs.type === 'escrow_arch') {
          obs.hit = true;
          this.escrowCollected = true;
          this.showPopup('⚖️ $4,200 LOADED INTO ESCROW TRAILER!', '#38bdf8');
          if (this.onEscrowCheckpoint) this.onEscrowCheckpoint();
        } else if (obs.type === 'finish_arch') {
          obs.hit = true;
          this.finished = true;
          this.speed = 0;
          if (this.onFinishLine) this.onFinishLine();
        } else if (obs.type !== 'traffic_wall' && Math.abs(this.playerX - obs.lane) < 0.42) {
          obs.hit = true;
          // Disable sibling obstacle at same Z if it was a decision fork
          this.obstacles.forEach(other => {
            if (Math.abs(other.z - obs.z) < 10) other.hit = true;
          });

          if (obs.cost < 0) {
            this.cameras.main.shake(220, 0.012);
            this.showPopup(`${obs.title}`, '#f87171');
          } else {
            this.showPopup(`${obs.title}`, '#34d399');
          }

          if (this.onObstacleHit) {
            this.onObstacleHit({
              cost: obs.cost,
              title: obs.title,
              lesson: obs.reason
            });
          }
        }
      }
    });

    // 4. Draw Player 3D Chase-Cam Moving Truck at Bottom of Screen
    this.drawPlayerTruck(gfx, steerDir, time);
  }

  drawPlayerTruck(gfx, steerDir, time) {
    const { width, height } = this.scale;
    const truckScreenX = width / 2 + this.playerX * 210;
    const bounce = this.speed > 2 ? Math.sin(time * 0.035) * 2.5 : (this.engineRunning ? Math.sin(time * 0.08) * 0.8 : 0);
    const truckY = height - 28 + bounce;
    const tilt = steerDir * 4;

    // Truck Shadow
    gfx.fillStyle(0x000000, 0.55);
    gfx.fillEllipse(truckScreenX, height - 16, 130, 22);

    // Left & Right Dual Tires
    gfx.fillStyle(0x090d16, 1);
    gfx.fillRoundedRect(truckScreenX - 58, truckY - 18, 22, 24, 4);
    gfx.fillRoundedRect(truckScreenX + 36, truckY - 18, 22, 24, 4);

    // Main Cargo Box (3D Rear View)
    gfx.fillStyle(this.truckColor, 1);
    gfx.fillRoundedRect(truckScreenX - 54 + tilt, truckY - 82, 108, 68, 8);
    gfx.lineStyle(3, 0xe2e8f0, 1);
    gfx.strokeRoundedRect(truckScreenX - 54 + tilt, truckY - 82, 108, 68, 8);

    // Roof 3D Bevel
    gfx.fillStyle(0xffffff, 0.18);
    gfx.fillRect(truckScreenX - 50 + tilt, truckY - 80, 100, 10);

    // Escrow Tank Gauge on Back Door of Truck
    gfx.fillStyle(0x0f172a, 0.9);
    gfx.fillRoundedRect(truckScreenX - 38 + tilt, truckY - 62, 76, 26, 4);
    if (this.escrowCollected) {
      gfx.fillStyle(0x38bdf8, 1);
      gfx.fillRoundedRect(truckScreenX - 35 + tilt, truckY - 59, 70, 20, 3);
    }

    // Brake / Tail Lights (Glow bright red when braking or stopped in traffic)
    const braking = this.cursors?.down?.isDown || this.keys?.S?.isDown || this.inTrafficJam;
    gfx.fillStyle(braking ? 0xff0000 : 0x991b1b, 1);
    gfx.fillRect(truckScreenX - 48 + tilt, truckY - 24, 18, 7);
    gfx.fillRect(truckScreenX + 30 + tilt, truckY - 24, 18, 7);

    // License Plate ("CLOSING")
    gfx.fillStyle(0xfacc15, 1);
    gfx.fillRect(truckScreenX - 16 + tilt, truckY - 25, 32, 9);
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
    scene.truckColor = truckColor || 0x6366f1;
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
      backgroundColor: '#090d16',
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
    <div className="relative w-full rounded-3xl overflow-hidden border-2 border-indigo-500/40 bg-slate-950 shadow-2xl shadow-indigo-950/50">
      <div ref={containerRef} className="w-full h-[270px] sm:h-[360px]" />
    </div>
  );
}
