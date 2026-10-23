import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

class EscrowFOVScene extends Phaser.Scene {
  constructor() {
    super('EscrowFOVScene');
    this.speed = 0;
    this.maxSpeed = 85;
    this.distance = 0; // 0 to 5000 (5.0 miles)
    this.targetDistance = 5000;
    this.playerX = 0;
    this.engineRunning = true;
    this.truckColor = 0x6366f1;

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
    this.horizonY = 120;

    // 1. Sunset Sky Gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x090d16, 0x090d16, 0x1e1b4b, 0x7c2d12, 1);
    sky.fillRect(0, 0, width, this.horizonY);

    // Horizon Sun & Skyline
    this.add.circle(width / 2, this.horizonY - 16, 40, 0xf59e0b, 0.8);
    const skyline = this.add.graphics();
    skyline.fillStyle(0x0f172a, 1);
    [[50, 35, 30], [90, 50, 28], [260, 42, 35], [370, 60, 45], [480, 48, 35], [650, 40, 45]].forEach(([bx, bh, bw]) => {
      skyline.fillRect(bx, this.horizonY - bh, bw, bh);
    });

    this.worldGfx = this.add.graphics();

    // Label pool for 3D Highway Signs
    this.labelPool = [];
    for (let i = 0; i < 12; i++) {
      const lbl = this.add.text(0, 0, '', {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f8fafc',
        backgroundColor: '#1e293bf2',
        padding: { x: 7, y: 4 }
      }).setOrigin(0.5, 1).setVisible(false).setDepth(20);
      this.labelPool.push(lbl);
    }

    // Center Screen Consequence Popup (Only shown AFTER player makes a choice!)
    this.floatingPopup = this.add.text(width / 2, 195, '', {
      fontSize: '17px',
      fontStyle: '900',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(40).setAlpha(0);

    // Keyboard Input
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

    for (let z = 80; z < 1800; z += 150) {
      this.scenery.push({ z, side: -1.55 });
      this.scenery.push({ z: z + 75, side: 1.55 });
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
            this.showPopup('-$150 RATE LOCK EXTENSION FEE! (IDLING)', '#f87171');
          } else {
            this.showPopup('ENGINE OFF: RATE LOCK PROTECTED ($0 LOSS)', '#38bdf8');
          }

          if (this.trafficTimer <= 0) {
            this.trafficCleared = true;
            this.inTrafficJam = false;
            this.showPopup('UNDERWRITING CLEARED! RESTART ENGINE [SPACE]!', '#34d399');
            this.obstacles = this.obstacles.filter(o => o.type !== 'traffic_wall');
            if (this.onTrafficCleared) this.onTrafficCleared();
          }
        }
      }
    });
  }

  // All signs use neutral text with NO dollar amounts or green/red color spoilers
  setupNeutralHighwayChoices() {
    this.obstacles = [
      // Fork 1 (Mile 0.7): Home Inspection Defect Discovered (3 Lanes, all look neutral!)
      {
        z: 700, lane: -0.75, type: 'choice',
        signText: '📋 WAIVE INSPECTION',
        outcomeTitle: 'Waived Home Inspection ($0 Paid Today)',
        cost: 0,
        setsTrap: true,
        lesson: 'You paid $0 today by waiving the inspection—but any hidden plumbing or furnace defects are now your responsibility!'
      },
      {
        z: 700, lane: 0, type: 'choice',
        signText: '🛠️ PAY CONTRACTOR DIRECT',
        outcomeTitle: 'Paid Out-of-Pocket for Repairs (-$2,400)',
        cost: -2400,
        lesson: 'You hired a contractor yourself. The house is fixed, but paying out-of-pocket drained $2,400 from your liquid cash reserves.'
      },
      {
        z: 700, lane: 0.75, type: 'choice',
        signText: '🤝 REQUEST SELLER CREDIT',
        outcomeTitle: 'Negotiated Seller Credit (-$300 Re-Inspection)',
        cost: -300,
        lesson: 'Great call! Using your Inspection Contingency, the seller agreed to cover the $2,400 repair via a credit, costing you only a $300 re-inspection fee.'
      },

      // Fork 2 (Mile 1.5): Reviewing the Loan Estimate Form
      {
        z: 1500, lane: -0.65, type: 'choice',
        signText: '⚡ EXPEDITED COURIER ADD-ON',
        outcomeTitle: 'Paid Lender "Junk Fee" (-$650)',
        cost: -650,
        lesson: '"Expedited Courier & Admin Processing" is a classic padded Junk Fee! Always question non-essential administrative add-ons on your Loan Estimate.'
      },
      {
        z: 1500, lane: 0.65, type: 'choice',
        signText: '🔍 AUDIT LOAN ESTIMATE FEES',
        outcomeTitle: 'Removed Padded Junk Fees (+$600 Saved)',
        cost: 600,
        lesson: 'By comparing your Loan Estimate line-by-line, you got the lender to waive $600 in bogus processing charges!'
      },

      // Milestone (Mile 2.2): Underwriting Traffic Jam (Blocks all 3 lanes)
      { z: 2250, lane: -0.8, type: 'traffic_wall', signText: '🚗 UNDERWRITING BACKLOG' },
      { z: 2250, lane: 0, type: 'traffic_wall', signText: '🚗 PAPERWORK TRAFFIC AHEAD' },
      { z: 2250, lane: 0.8, type: 'traffic_wall', signText: '🚗 UNDERWRITING BACKLOG' },

      // Fork 3 (Mile 3.0): Low Home Appraisal ($295k vs $300k Offer)
      {
        z: 3050, lane: -0.65, type: 'choice',
        signText: '💵 COVER APPRAISAL GAP',
        outcomeTitle: 'Paid Appraisal Shortage in Cash (-$2,500)',
        cost: -2500,
        lesson: 'Because the bank only lends based on the appraised value, paying the Appraisal Gap yourself drained $2,500 from your cash reserves.'
      },
      {
        z: 3050, lane: 0.65, type: 'choice',
        signText: '📊 SUBMIT COMP SALES APPEAL',
        outcomeTitle: 'Appraisal Appeal Succeeded (-$200 Filing)',
        cost: -200,
        lesson: 'Your agent submitted 3 recent neighborhood sales ("Comps") and the seller split the difference—saving your cash reserves!'
      },

      // Milestone (Mile 3.8): Mandatory Escrow Weigh Station
      {
        z: 3850, lane: 0, type: 'escrow_arch',
        signText: '⚖️ ESCROW RESERVE WEIGH STATION (TAX & INSURANCE)'
      },

      // Fork 4 (Mile 4.5): Final Walkthrough Wire Instructions
      {
        z: 4500, lane: -0.65, type: 'choice',
        signText: '📧 USE EMAIL WIRE CHANGE',
        outcomeTitle: 'Phishing Wire Spoof Penalty (-$1,800)',
        cost: -1800,
        lesson: 'Never trust last-minute emailed wire changes! Real-estate wire fraud targets buyers right before closing—always call the Title Office directly.'
      },
      {
        z: 4500, lane: 0.65, type: 'choice',
        signText: '📞 CALL TITLE OFFICE TO VERIFY',
        outcomeTitle: 'Verified Safe Wire & Earnest Credit (+$500)',
        cost: 500,
        lesson: 'Calling the Title Officer directly protected your funds and confirmed your Earnest Money deposit credit!'
      },

      // Finish Line (Mile 5.0)
      {
        z: 5000, lane: 0, type: 'finish_arch',
        signText: '🏛️ COUNTY TITLE OFFICE — CLOSING TABLE'
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
      y: 150,
      alpha: 0,
      duration: 2400,
      ease: 'Cubic.easeOut'
    });
  }

  toggleEngine() {
    this.engineRunning = !this.engineRunning;
    if (!this.engineRunning) {
      this.showPopup('ENGINE OFF', '#38bdf8');
    } else {
      this.showPopup('ENGINE ON', '#34d399');
    }
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

    const up = this.cursors.up.isDown || this.keys.W.isDown || vInput.up;
    const down = this.cursors.down.isDown || this.keys.S.isDown || vInput.down;
    const left = this.cursors.left.isDown || this.keys.A.isDown || vInput.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || vInput.right;

    if (this.engineRunning && up && !this.inTrafficJam) {
      this.speed = Math.min(this.maxSpeed, this.speed + 50 * dt);
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

    // Delayed Consequence at Mile 4.2 if Player Waived the Inspection earlier!
    if (this.waivedInspectionTrap && !this.trapTriggered && this.distance >= 4150) {
      this.trapTriggered = true;
      this.cameras.main.shake(350, 0.02);
      this.showPopup('💥 UNINSPECTED FURNACE BROKE! (-$3,200)', '#ef4444');
      if (this.onObstacleHit) {
        this.onObstacleHit({
          cost: -3200,
          title: 'Delayed Consequence: Waived Inspection Furnace Failure (-$3,200)',
          lesson: 'Because you waived the Home Inspection at Mile 0.7 to save time, a cracked furnace went unnoticed and cost you $3,200 right before closing!'
        });
      }
    }

    // Approaching Underwriting Traffic Jam at Mile 2.2
    if (!this.trafficCleared && !this.inTrafficJam && this.distance >= 2110 && this.distance < 2260) {
      if (this.speed > 45 && this.distance >= 2190) {
        this.speed = 0;
        this.inTrafficJam = true;
        this.cameras.main.shake(300, 0.02);
        this.showPopup('💥 REAR-ENDED UNDERWRITING BACKLOG! (-$1,000)', '#ef4444');
        if (this.onObstacleHit) {
          this.onObstacleHit({
            cost: -1000,
            title: 'Crashed into Underwriting Delay (-$1,000 Rush Fee)',
            lesson: 'You didn’t brake in time for the underwriting traffic! Now you are stuck waiting—think about how to stop your Rate Lock from bleeding fees!'
          });
        }
      } else if (this.distance >= 2165) {
        this.speed = 0;
        this.inTrafficJam = true;
        this.showPopup('🛑 STUCK IN UNDERWRITING DELAY!', '#fbbf24');
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
    const roadHalfWidth = 30 + 350 * perspective;
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

      gfx.fillStyle(stripePhase ? 0x064e3b : 0x042f2e, 1);
      gfx.fillRect(0, pFar.screenY, width, pNear.screenY - pFar.screenY + 1);

      const curbNear = pNear.roadHalfWidth * 1.08;
      const curbFar = pFar.roadHalfWidth * 1.08;
      gfx.fillStyle(stripePhase ? 0x475569 : 0xe2e8f0, 1);
      gfx.fillPoints([
        { x: width / 2 - curbFar, y: pFar.screenY },
        { x: width / 2 + curbFar, y: pFar.screenY },
        { x: width / 2 + curbNear, y: pNear.screenY },
        { x: width / 2 - curbNear, y: pNear.screenY }
      ], true);

      gfx.fillStyle(stripePhase ? 0x1e293b : 0x0f172a, 1);
      gfx.fillPoints([
        { x: width / 2 - pFar.roadHalfWidth, y: pFar.screenY },
        { x: width / 2 + pFar.roadHalfWidth, y: pFar.screenY },
        { x: width / 2 + pNear.roadHalfWidth, y: pNear.screenY },
        { x: width / 2 - pNear.roadHalfWidth, y: pNear.screenY }
      ], true);

      if (stripePhase) {
        gfx.fillStyle(0xfbbf24, 0.8);
        [-0.35, 0.35].forEach(laneDiv => {
          const xNear = width / 2 + laneDiv * pNear.roadHalfWidth;
          const wNear = Math.max(1.5, 5 * pNear.scale);
          gfx.fillRect(xNear - wNear / 2, pFar.screenY, wNear, pNear.screenY - pFar.screenY);
        });
      }
    }

    // 2. Roadside Streetlights
    this.scenery.forEach(item => {
      let relZ = (item.z - (this.roadZ % 1800) + 1800) % 1800;
      if (relZ > 10 && relZ < 680) {
        const proj = this.project3D(item.side, relZ);
        const poleH = 90 * proj.scale;
        gfx.fillStyle(0x64748b, 1);
        gfx.fillRect(proj.screenX - 2 * proj.scale, proj.screenY - poleH, 4 * proj.scale, poleH);
        gfx.fillStyle(0x38bdf8, 0.85);
        gfx.fillCircle(proj.screenX, proj.screenY - poleH, 5 * proj.scale);
      }
    });

    // 3. Render Neutral Highway Decision Gates & Check Collisions
    const visibleObstacles = this.obstacles
      .map(obs => ({ ...obs, relZ: obs.z - this.distance }))
      .filter(obs => obs.relZ > -25 && obs.relZ < 680)
      .sort((a, b) => b.relZ - a.relZ);

    visibleObstacles.forEach(obs => {
      const proj = this.project3D(obs.lane, Math.max(5, obs.relZ));
      const w = 92 * proj.scale;
      const h = 54 * proj.scale;

      if (obs.type === 'escrow_arch' || obs.type === 'finish_arch') {
        const leftPost = this.project3D(-1.05, Math.max(5, obs.relZ));
        const rightPost = this.project3D(1.05, Math.max(5, obs.relZ));
        const archHeight = 130 * proj.scale;
        const archColor = obs.type === 'escrow_arch' ? 0x0284c7 : 0x4f46e5;

        gfx.fillStyle(archColor, 0.95);
        gfx.fillRect(leftPost.screenX - 8 * proj.scale, proj.screenY - archHeight, 16 * proj.scale, archHeight);
        gfx.fillRect(rightPost.screenX - 8 * proj.scale, proj.screenY - archHeight, 16 * proj.scale, archHeight);
        gfx.fillRect(leftPost.screenX, proj.screenY - archHeight, rightPost.screenX - leftPost.screenX, 26 * proj.scale);

        if (labelIdx < this.labelPool.length && obs.relZ < 560) {
          const lbl = this.labelPool[labelIdx++];
          lbl.setText(obs.signText);
          lbl.setPosition(width / 2, proj.screenY - archHeight - 4);
          lbl.setScale(Math.max(0.55, Math.min(1.05, proj.scale * 1.25)));
          lbl.setVisible(true);
        }
      } else {
        // Neutral Highway Sign Gate (All choices look like identical blue/indigo highway signs!)
        const gateColor = obs.type === 'traffic_wall' ? 0xb91c1c : 0x1e3a8a;
        gfx.fillStyle(gateColor, 0.92);
        gfx.fillRoundedRect(proj.screenX - w / 2, proj.screenY - h, w, h, 6 * proj.scale);
        gfx.lineStyle(2 * proj.scale, 0x93c5fd, 0.9);
        gfx.strokeRoundedRect(proj.screenX - w / 2, proj.screenY - h, w, h, 6 * proj.scale);

        if (labelIdx < this.labelPool.length && obs.relZ < 520) {
          const lbl = this.labelPool[labelIdx++];
          lbl.setText(obs.signText);
          lbl.setPosition(proj.screenX, proj.screenY - h - 4);
          lbl.setScale(Math.max(0.5, Math.min(1.0, proj.scale * 1.25)));
          lbl.setVisible(true);
        }
      }

      // Collision Detection
      if (!obs.hit && obs.relZ <= 42 && obs.relZ >= -10) {
        if (obs.type === 'escrow_arch') {
          obs.hit = true;
          this.escrowCollected = true;
          this.showPopup('⚖️ $4,200 TRANSFERRED TO ESCROW TRAILER', '#38bdf8');
          if (this.onEscrowCheckpoint) this.onEscrowCheckpoint();
        } else if (obs.type === 'finish_arch') {
          obs.hit = true;
          this.finished = true;
          this.speed = 0;
          if (this.onFinishLine) this.onFinishLine();
        } else if (obs.type === 'choice' && Math.abs(this.playerX - obs.lane) < 0.44) {
          obs.hit = true;
          // Disable the other lanes at this same fork so only 1 option triggers
          this.obstacles.forEach(other => {
            if (Math.abs(other.z - obs.z) < 20) other.hit = true;
          });

          if (obs.setsTrap) {
            this.waivedInspectionTrap = true;
          }

          const popColor = obs.cost < -500 ? '#f87171' : obs.cost > 0 ? '#34d399' : '#fbbf24';
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
    const bounce = this.speed > 2 ? Math.sin(time * 0.035) * 2.5 : (this.engineRunning ? Math.sin(time * 0.08) * 0.8 : 0);
    const truckY = height - 28 + bounce;
    const tilt = steerDir * 4;

    gfx.fillStyle(0x000000, 0.55);
    gfx.fillEllipse(truckScreenX, height - 16, 130, 22);

    gfx.fillStyle(0x090d16, 1);
    gfx.fillRoundedRect(truckScreenX - 58, truckY - 18, 22, 24, 4);
    gfx.fillRoundedRect(truckScreenX + 36, truckY - 18, 22, 24, 4);

    gfx.fillStyle(this.truckColor, 1);
    gfx.fillRoundedRect(truckScreenX - 54 + tilt, truckY - 82, 108, 68, 8);
    gfx.lineStyle(3, 0xe2e8f0, 1);
    gfx.strokeRoundedRect(truckScreenX - 54 + tilt, truckY - 82, 108, 68, 8);

    gfx.fillStyle(0xffffff, 0.18);
    gfx.fillRect(truckScreenX - 50 + tilt, truckY - 80, 100, 10);

    gfx.fillStyle(0x0f172a, 0.9);
    gfx.fillRoundedRect(truckScreenX - 38 + tilt, truckY - 62, 76, 26, 4);
    if (this.escrowCollected) {
      gfx.fillStyle(0x38bdf8, 1);
      gfx.fillRoundedRect(truckScreenX - 35 + tilt, truckY - 59, 70, 20, 3);
    }

    const braking = this.cursors?.down?.isDown || this.keys?.S?.isDown || this.inTrafficJam;
    gfx.fillStyle(braking ? 0xff0000 : 0x991b1b, 1);
    gfx.fillRect(truckScreenX - 48 + tilt, truckY - 24, 18, 7);
    gfx.fillRect(truckScreenX + 30 + tilt, truckY - 24, 18, 7);

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
