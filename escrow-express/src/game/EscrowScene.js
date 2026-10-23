import Phaser from 'phaser';

export default class EscrowScene extends Phaser.Scene {
  constructor() {
    super('EscrowScene');
    this.isDriving = false;
    this.engineRunning = true;
    this.roadSpeed = 4;
    this.truckColor = 0x6366f1;
    this.escrowFillPercent = 0;
  }

  create() {
    const { width, height } = this.scale;

    // 1. Grass & Shoulders
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a);
    this.add.rectangle(width / 2, height / 2, width, 150, 0x1e293b); // Asphalt road
    this.add.rectangle(width / 2, height / 2 - 75, width, 6, 0xf59e0b); // Top yellow line
    this.add.rectangle(width / 2, height / 2 + 75, width, 6, 0xf59e0b); // Bottom yellow line

    // 2. Scrolling Road Lane Stripes
    this.stripes = [];
    for (let x = 0; x < width + 100; x += 80) {
      const stripe = this.add.rectangle(x, height / 2, 40, 4, 0x94a3b8);
      this.stripes.push(stripe);
    }

    // 3. Obstacle Graphic Container (rolls in from the right)
    this.obstacleGroup = this.add.container(width + 150, height / 2);
    this.obstacleBody = this.add.rectangle(0, 0, 50, 120, 0xef4444);
    this.obstacleLabel = this.add.text(-35, -85, '', {
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fbbf24',
      backgroundColor: '#0f172a',
      padding: { x: 6, y: 3 }
    });
    this.obstacleGroup.add([this.obstacleBody, this.obstacleLabel]);

    // 4. Moving Truck & Escrow Trailer Container
    this.truckContainer = this.add.container(180, height / 2);

    // Escrow Trailer (Behind the truck)
    this.trailerBg = this.add.rectangle(-85, 0, 60, 44, 0x334155).setStrokeStyle(2, 0x94a3b8);
    this.trailerFill = this.add.rectangle(-113, 0, 0, 40, 0x38bdf8).setOrigin(0, 0.5);
    const hitch = this.add.rectangle(-50, 0, 14, 6, 0x64748b);

    // Main Truck Cargo & Cab
    this.truckCargo = this.add.rectangle(-5, 0, 75, 50, this.truckColor).setStrokeStyle(2, 0xffffff);
    this.truckCab = this.add.rectangle(45, 0, 30, 44, 0x4f46e5).setStrokeStyle(2, 0xe2e8f0);
    const windshield = this.add.rectangle(52, 0, 10, 34, 0x38bdf8);
    const headlightTop = this.add.rectangle(61, -14, 4, 8, 0xfef08a);
    const headlightBot = this.add.rectangle(61, 14, 4, 8, 0xfef08a);

    this.truckContainer.add([
      hitch,
      this.trailerBg,
      this.trailerFill,
      this.truckCargo,
      this.truckCab,
      windshield,
      headlightTop,
      headlightBot
    ]);

    // 5. Exhaust Smoke Particles (Visualizing Fuel/Fee Burn)
    const particleGfx = this.make.graphics({ x: 0, y: 0, add: false });
    particleGfx.fillStyle(0x94a3b8, 1);
    particleGfx.fillCircle(6, 6, 6);
    particleGfx.generateTexture('smoke', 12, 12);

    this.smokeEmitter = this.add.particles(0, 0, 'smoke', {
      speedX: { min: -90, max: -40 },
      speedY: { min: -20, max: 20 },
      scale: { start: 0.4, end: 1.4 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 700,
      frequency: 90,
      follow: this.truckContainer,
      followOffset: { x: -45, y: 24 }
    });

    // 6. Status Floating Text above Truck
    this.statusText = this.add.text(135, height / 2 - 55, 'ENGINE ON', {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#34d399',
      backgroundColor: '#0f172acc',
      padding: { x: 6, y: 2 }
    });
  }

  // Called by React to update visual state
  syncWithReact({ isDriving, engineRunning, escrowPercent, stage, truckColor }) {
    this.isDriving = isDriving;
    this.engineRunning = engineRunning;

    if (truckColor && this.truckCargo) {
      this.truckCargo.setFillStyle(truckColor);
    }

    // Update Escrow Trailer Fill Bar
    if (this.trailerFill) {
      const targetWidth = Math.min(1, Math.max(0, escrowPercent)) * 56;
      this.trailerFill.width = targetWidth;
    }

    // Update Exhaust Smoke & Status Text
    if (this.smokeEmitter && this.statusText) {
      if (engineRunning) {
        this.smokeEmitter.start();
        this.statusText.setText(stage === 'traffic' ? '⚠️ IDLING: BURNING $150/s!' : 'ENGINE RUNNING');
        this.statusText.setColor(stage === 'traffic' ? '#f87171' : '#34d399');
      } else {
        this.smokeEmitter.stop();
        this.statusText.setText('❄️ ENGINE CUT (FEES PAUSED)');
        this.statusText.setColor('#38bdf8');
      }
    }

    // Position Visual Obstacle when stopped at a checkpoint
    if (this.obstacleGroup) {
      if (stage === 'inspection') {
        this.obstacleGroup.x = 340;
        this.obstacleBody.setFillStyle(0xf59e0b);
        this.obstacleLabel.setText('🚧 INSPECTION DEFECT');
      } else if (stage === 'traffic') {
        this.obstacleGroup.x = 340;
        this.obstacleBody.setFillStyle(0xef4444);
        this.obstacleLabel.setText('🚗 UNDERWRITING BACKLOG');
      } else if (stage === 'escrow') {
        this.obstacleGroup.x = 340;
        this.obstacleBody.setFillStyle(0x6366f1);
        this.obstacleLabel.setText('⚖️ ESCROW WEIGH STATION');
      } else if (stage === 'summary') {
        this.obstacleGroup.x = 340;
        this.obstacleBody.setFillStyle(0x10b981);
        this.obstacleLabel.setText('🏛️ COUNTY TITLE OFFICE');
      } else {
        this.obstacleGroup.x = 950;
      }
    }
  }

  update(time) {
    // Scroll stripes when driving
    if (this.isDriving && this.engineRunning) {
      this.stripes.forEach((stripe) => {
        stripe.x -= this.roadSpeed;
        if (stripe.x < -40) {
          stripe.x = this.scale.width + 40;
        }
      });
      // Subtle truck road bounce
      this.truckContainer.y = this.scale.height / 2 + Math.sin(time * 0.02) * 1.5;
    } else if (this.engineRunning) {
      // Subtle engine idle vibration when stopped in traffic
      this.truckContainer.y = this.scale.height / 2 + Math.sin(time * 0.05) * 0.6;
    }
  }
}
