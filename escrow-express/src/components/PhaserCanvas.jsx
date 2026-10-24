import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

class EscrowFOVScene extends Phaser.Scene {
  constructor() {
    super('EscrowFOVScene');
    this.speed = 0;
    this.maxSpeed = 85;
    this.distance = 0;
    this.targetDistance = 5000;
    this.campaignMode = 'express';
    this.vehicleType = 'rig'; // 'pickup' | 'van' | 'rig'
    this.cashReserves = 12000;
    this.playerX = 0;
    this.targetLaneX = null;
    this.turboActive = false;
    this.truckColor = 0xf43f5e;
    this.escrowCollected = false;
    this.finished = false;
    this.roadZ = 0;
    this.obstacles = [];
    this.roadPickups = [];
    this.scenery = [];
  }

  create() {
    const { width } = this.scale;
    this.horizonY = 115;

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x38bdf8, 0x38bdf8, 0xbae6fd, 0xfef08a, 1);
    sky.fillRect(0, 0, width, this.horizonY);

    this.add.circle(width - 90, 42, 30, 0xfacc15, 1).setStrokeStyle(3, 0x18181b);
    this.clouds = [
      this.add.ellipse(140, 42, 90, 32, 0xffffff).setStrokeStyle(2.5, 0x18181b),
      this.add.ellipse(420, 55, 110, 36, 0xffffff).setStrokeStyle(2.5, 0x18181b),
      this.add.ellipse(640, 36, 80, 28, 0xffffff).setStrokeStyle(2.5, 0x18181b)
    ];

    const hills = this.add.graphics();
    hills.fillStyle(0x4ade80, 1);
    hills.lineStyle(3, 0x18181b, 1);
    hills.fillEllipse(190, this.horizonY + 10, 390, 65);
    hills.strokeEllipse(190, this.horizonY + 10, 390, 65);
    hills.fillStyle(0x22c55e, 1);
    hills.fillEllipse(580, this.horizonY + 15, 460, 75);
    hills.strokeEllipse(580, this.horizonY + 15, 460, 75);

    this.worldGfx = this.add.graphics();

    this.labelPool = [];
    for (let i = 0; i < 18; i++) {
      const lbl = this.add.text(0, 0, '', {
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#18181b',
        backgroundColor: '#fef08a',
        stroke: '#18181b',
        strokeThickness: 0.5,
        padding: { x: 7, y: 4 }
      }).setOrigin(0.5, 1).setVisible(false).setDepth(20);
      this.labelPool.push(lbl);
    }

    this.floatingPopup = this.add.text(width / 2, 185, '', {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#18181b',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(40).setAlpha(0);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    this.keys.SPACE.on('down', () => this.toggleTurbo());

    if (this.campaignMode === 'express') {
      this.targetDistance = 5000;
      this.setupExpress5MileRoute();
    } else {
      this.targetDistance = 10000;
      this.setupFull10MileRoute();
    }

    this.setupBetweenCheckpointAction();

    const houseColors = [0xf87171, 0x60a5fa, 0xfbbf24, 0xc084fc];
    for (let z = 90; z < 1800; z += 180) {
      this.scenery.push({ z, side: -1.65, type: 'house', color: houseColors[(z / 180) % 4] });
      this.scenery.push({ z: z + 90, side: 1.65, type: 'tree' });
    }
  }

  setupBetweenCheckpointAction() {
    const gapZones = [
      { z: 380, lane: 0, kind: 'coin', label: '💰 SAVINGS +$300' },
      { z: 1120, lane: -0.7, kind: 'hazard', label: '💳 NEW CREDIT CARD' },
      { z: 1920, lane: 0.7, kind: 'coin', label: '💰 TAX REFUND +$300' },
      { z: 2680, lane: 0, kind: 'hazard', label: '🚗 FINANCED CAR' },
      { z: 3480, lane: -0.7, kind: 'coin', label: '💰 RATE REBATE +$300' },
      { z: 4250, lane: 0.7, kind: 'coin', label: '💰 EARNEST BONUS' },
      { z: 5350, lane: 0, kind: 'coin', label: '💰 LENDER CREDIT' },
      { z: 6350, lane: -0.7, kind: 'hazard', label: '🛋️ NEW DEBT TRAP' },
      { z: 7350, lane: 0.7, kind: 'coin', label: '💰 ESCROW BONUS' },
      { z: 8350, lane: 0, kind: 'hazard', label: '🚗 AUTO LOAN TRAP' },
      { z: 9350, lane: -0.7, kind: 'coin', label: '💰 CLOSING GRANT' }
    ].filter(g => g.z < this.targetDistance - 350);

    this.roadPickups = gapZones.map(g => ({
      ...g,
      hit: false,
      cost: g.kind === 'coin' ? 300 : -600,
      reason: g.kind === 'coin'
        ? 'Added +$300 to your liquid Cash-to-Close reserve!'
        : 'Avoid opening new credit cards or financing cars/furniture before closing—it spikes your DTI ratio!'
    }));
  }

  setupExpress5MileRoute() {
    this.obstacles = [
      {
        z: 750, lane: -0.72, type: 'choice', checkpointTitle: 'CHECKPOINT 1/6: HOME INSPECTION DEFECTS',
        signText: '📋 WAIVE INSPECTION',
        outcomeTitle: 'Waived Inspection: Hidden Pipe Burst! (-$2,000)',
        cost: -2000,
        lesson: 'Waiving the inspection hid a cracked water main that cost $2,000 to fix!'
      },
      {
        z: 750, lane: 0, type: 'choice', checkpointTitle: 'CHECKPOINT 1/6: HOME INSPECTION DEFECTS',
        signText: '🛠️ PAY CONTRACTOR',
        outcomeTitle: 'Paid Roof Repair Yourself (-$1,000)',
        cost: -1000,
        lesson: 'You paid for the repair yourself instead of asking the seller for a credit.'
      },
      {
        z: 750, lane: 0.72, type: 'choice', checkpointTitle: 'CHECKPOINT 1/6: HOME INSPECTION DEFECTS',
        signText: '🤝 SELLER CREDIT',
        outcomeTitle: 'Seller Repair Credit Approved! (+$1,500)',
        cost: 1500,
        lesson: 'Your Inspection Contingency got the seller to credit $1,500 toward your closing costs!'
      },
      {
        z: 1500, lane: -0.72, type: 'choice', checkpointTitle: 'CHECKPOINT 2/6: LOAN ESTIMATE REVIEW',
        signText: '⚡ EXPRESS COURIER FEE',
        outcomeTitle: 'Paid Padded "Junk Fee" (-$1,200)',
        cost: -1200,
        lesson: '"Express Courier & Admin Package" is a padded lender Junk Fee you should always refuse!'
      },
      {
        z: 1500, lane: 0, type: 'choice', checkpointTitle: 'CHECKPOINT 2/6: LOAN ESTIMATE REVIEW',
        signText: '🔍 AUDIT LOAN ESTIMATE',
        outcomeTitle: 'Audited Form & Removed Junk Fees! (+$1,200)',
        cost: 1200,
        lesson: 'Reviewing your 3-page Loan Estimate removed $1,200 in bogus processing fees!'
      },
      {
        z: 1500, lane: 0.72, type: 'choice', checkpointTitle: 'CHECKPOINT 2/6: LOAN ESTIMATE REVIEW',
        signText: '📄 ACCEPT ESTIMATE AS-IS',
        outcomeTitle: 'Paid Standard Processing (-$400)',
        cost: -400,
        lesson: 'Signing without auditing left minor administrative fees on your tab.'
      },
      {
        z: 2300, lane: -0.72, type: 'choice', checkpointTitle: 'CHECKPOINT 3/6: MARKET INTEREST RATE SPIKE',
        signText: '🔒 30-DAY RATE LOCK',
        outcomeTitle: 'Rate Locked Before Market Spike! (+$1,400)',
        cost: 1400,
        lesson: 'Locking your interest rate protected your cash when market rates jumped during underwriting!'
      },
      {
        z: 2300, lane: 0, type: 'choice', checkpointTitle: 'CHECKPOINT 3/6: MARKET INTEREST RATE SPIKE',
        signText: '📈 FLOAT INTEREST RATE',
        outcomeTitle: 'Rates Spiked While Floating! (-$1,800)',
        cost: -1800,
        lesson: 'Floating your rate left you exposed when interest rates rose during underwriting!'
      },
      {
        z: 2300, lane: 0.72, type: 'choice', checkpointTitle: 'CHECKPOINT 3/6: MARKET INTEREST RATE SPIKE',
        signText: '⏳ DELAY PAPERWORK',
        outcomeTitle: 'Paid Rate-Lock Extension Fee (-$900)',
        cost: -900,
        lesson: 'Delaying your bank documents forced you to pay a daily Rate-Lock Extension fee.'
      },
      {
        z: 3100, lane: -0.72, type: 'choice', checkpointTitle: 'CHECKPOINT 4/6: APPRAISAL CAME IN $5K LOW',
        signText: '💵 PAY APPRAISAL GAP',
        outcomeTitle: 'Paid Appraisal Shortage in Cash (-$1,800)',
        cost: -1800,
        lesson: 'Paying the appraisal gap out of pocket drained your cash reserves.'
      },
      {
        z: 3100, lane: 0, type: 'choice', checkpointTitle: 'CHECKPOINT 4/6: APPRAISAL CAME IN $5K LOW',
        signText: '🏃 CANCEL NO CONTINGENCY',
        outcomeTitle: 'Forfeited Partial Deposit (-$2,000)',
        cost: -2000,
        lesson: 'Backing out without an Appraisal Contingency puts your earnest deposit at risk!'
      },
      {
        z: 3100, lane: 0.72, type: 'choice', checkpointTitle: 'CHECKPOINT 4/6: APPRAISAL CAME IN $5K LOW',
        signText: '📊 APPEAL WITH COMPS',
        outcomeTitle: 'Neighborhood Comps Appeal Won! (+$1,200)',
        cost: 1200,
        lesson: 'Submitting recent neighborhood sales ("Comps") proved the home value and saved your cash!'
      },
      {
        z: 3900, lane: -0.72, type: 'choice', checkpointTitle: 'CHECKPOINT 5/6: ESCROW TAXES & INSURANCE',
        signText: '🏦 ESCROW + TAX CREDIT',
        outcomeTitle: 'Escrow Funded + Seller Tax Proration! (+$1,000)',
        cost: 1000,
        fillsEscrow: true,
        lesson: 'You funded your Escrow Reserve AND collected the seller’s unpaid property tax proration credit!'
      },
      {
        z: 3900, lane: 0, type: 'choice', checkpointTitle: 'CHECKPOINT 5/6: ESCROW TAXES & INSURANCE',
        signText: '💼 PREPAY FULL YEAR SOLO',
        outcomeTitle: 'Escrow Funded Out-of-Pocket (-$800)',
        cost: -800,
        fillsEscrow: true,
        lesson: 'You funded your 6-month tax & 12-month insurance Escrow tank, though you didn’t claim seller tax credits.'
      },
      {
        z: 3900, lane: 0.72, type: 'choice', checkpointTitle: 'CHECKPOINT 5/6: ESCROW TAXES & INSURANCE',
        signText: '🚫 SKIP HOME INSURANCE',
        outcomeTitle: 'Lender Force-Placed Insurance Penalty! (-$2,400)',
        cost: -2400,
        fillsEscrow: true,
        lesson: 'Never skip homeowners insurance! The bank forced expensive coverage onto your loan at closing.'
      },
      {
        z: 4550, lane: -0.72, type: 'choice', checkpointTitle: 'CHECKPOINT 6/6: CLOSING FUNDS TRANSFER',
        signText: '📧 USE EMAILED WIRE LINK',
        outcomeTitle: 'Wire Phishing Scam Penalty! (-$2,200)',
        cost: -2200,
        lesson: 'Never trust last-minute emailed wire changes! Always call the Title Office directly to verify routing numbers.'
      },
      {
        z: 4550, lane: 0, type: 'choice', checkpointTitle: 'CHECKPOINT 6/6: CLOSING FUNDS TRANSFER',
        signText: '📞 CALL TITLE OFFICE',
        outcomeTitle: 'Verified Safe Wire + Earnest Credit! (+$1,000)',
        cost: 1000,
        lesson: 'Calling the Title Officer verified your safe wire and applied your Earnest Money deposit credit!'
      },
      {
        z: 4550, lane: 0.72, type: 'choice', checkpointTitle: 'CHECKPOINT 6/6: CLOSING FUNDS TRANSFER',
        signText: '📝 PERSONAL CHECK',
        outcomeTitle: 'Personal Check Rejected — Rush Fee (-$600)',
        cost: -600,
        lesson: 'Closing requires a Certified Cashier’s Check or verified wire transfer—personal checks delay funding!'
      },
      {
        z: 5000, lane: 0, type: 'finish_arch',
        signText: '🏁 COUNTY TITLE OFFICE — FINAL CLOSING TABLE!'
      }
    ];
  }

  setupFull10MileRoute() {
    this.obstacles = [
      {
        z: 950, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 1 (1/9): MAKING AN OFFER ON A HOME',
        signText: '📝 VERBAL BUDGET ESTIMATE',
        outcomeTitle: 'Seller Rejected Verbal Offer (-$800 Delay)',
        cost: -800,
        lesson: 'Sellers rarely take verbal budgets seriously—always get a verified Lender Pre-Approval first!'
      },
      {
        z: 950, lane: 0, type: 'choice', checkpointTitle: 'STAGE 1 (1/9): MAKING AN OFFER ON A HOME',
        signText: '✅ LENDER PRE-APPROVAL',
        outcomeTitle: 'Verified Pre-Approval Won the Offer! (+$1,200)',
        cost: 1200,
        lesson: 'A verified Pre-Approval Letter proves a lender checked your income and credit!'
      },
      {
        z: 950, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 1 (1/9): MAKING AN OFFER ON A HOME',
        signText: '📱 2-MIN ONLINE PRE-QUAL',
        outcomeTitle: 'Weak Pre-Qual Needed Rush Underwriting (-$400)',
        cost: -400,
        lesson: 'A quick "Pre-Qualification" is just an unverified estimate—Pre-Approval is much stronger!'
      },
      {
        z: 1900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 1 (2/9): DEBT-TO-INCOME (DTI) CHECK',
        signText: '📉 PAY DOWN CREDIT CARD',
        outcomeTitle: 'Lowered DTI Below 36%! (+$1,200 Rate Bonus)',
        cost: 1200,
        lesson: 'Keeping your Debt-to-Income (DTI) ratio low unlocks top-tier interest rates!'
      },
      {
        z: 1900, lane: 0, type: 'choice', checkpointTitle: 'STAGE 1 (2/9): DEBT-TO-INCOME (DTI) CHECK',
        signText: '🛋️ FINANCE NEW FURNITURE',
        outcomeTitle: 'DTI Spiked! Loan Pricing Penalty (-$1,600)',
        cost: -1600,
        lesson: 'Financing furniture while buying a house raises your monthly debt ratio!'
      },
      {
        z: 1900, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 1 (2/9): DEBT-TO-INCOME (DTI) CHECK',
        signText: '💳 OPEN STORE CARD',
        outcomeTitle: 'Hard Credit Inquiry Penalty (-$700)',
        cost: -700,
        lesson: 'Avoid new credit inquiries while your mortgage application is active!'
      },
      {
        z: 2900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 1 (3/9): EARNEST MONEY DEPOSIT',
        signText: '🤝 SEND DIRECT TO SELLER',
        outcomeTitle: 'Unprotected Deposit Risk! (-$1,500)',
        cost: -1500,
        lesson: 'Never hand Earnest Money directly to the seller! Use a neutral Escrow account.'
      },
      {
        z: 2900, lane: 0, type: 'choice', checkpointTitle: 'STAGE 1 (3/9): EARNEST MONEY DEPOSIT',
        signText: '🏦 DEPOSIT INTO ESCROW',
        outcomeTitle: 'Safe Escrow Deposit Credited! (+$1,200)',
        cost: 1200,
        lesson: 'Your Earnest Money stays safe in a neutral Escrow account and counts toward closing!'
      },
      {
        z: 2900, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 1 (3/9): EARNEST MONEY DEPOSIT',
        signText: '🚫 REFUSE EARNEST DEPOSIT',
        outcomeTitle: 'Seller Demanded Price Bump (-$900)',
        cost: -900,
        lesson: 'Without Earnest Money, sellers have no proof you are committed.'
      },
      {
        z: 3900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 2 (4/9): HOME INSPECTION DEFECTS',
        signText: '📋 WAIVE HOME INSPECTION',
        outcomeTitle: 'Waived Inspection: Hidden Pipe Burst! (-$2,000)',
        cost: -2000,
        lesson: 'Waiving the inspection hid a cracked water main that cost $2,000 to fix!'
      },
      {
        z: 3900, lane: 0, type: 'choice', checkpointTitle: 'STAGE 2 (4/9): HOME INSPECTION DEFECTS',
        signText: '🛠️ PAY CONTRACTOR DIRECT',
        outcomeTitle: 'Paid Roof Repair Out-of-Pocket (-$1,000)',
        cost: -1000,
        lesson: 'You paid for the repair yourself instead of asking the seller for a credit.'
      },
      {
        z: 3900, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 2 (4/9): HOME INSPECTION DEFECTS',
        signText: '🤝 REQUEST SELLER CREDIT',
        outcomeTitle: 'Seller Repair Credit Approved! (+$1,500)',
        cost: 1500,
        lesson: 'Your Inspection Contingency got the seller to credit $1,500 toward your closing costs!'
      },
      {
        z: 4900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 2 (5/9): LOAN ESTIMATE REVIEW',
        signText: '⚡ EXPRESS COURIER FEE',
        outcomeTitle: 'Paid Padded "Junk Fee" (-$1,200)',
        cost: -1200,
        lesson: '"Express Courier & Admin Package" is a padded lender Junk Fee you should refuse!'
      },
      {
        z: 4900, lane: 0, type: 'choice', checkpointTitle: 'STAGE 2 (5/9): LOAN ESTIMATE REVIEW',
        signText: '🔍 AUDIT LOAN ESTIMATE',
        outcomeTitle: 'Audited Form & Removed Junk Fees! (+$1,200)',
        cost: 1200,
        lesson: 'Reviewing your 3-page Loan Estimate removed $1,200 in bogus processing fees!'
      },
      {
        z: 4900, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 2 (5/9): LOAN ESTIMATE REVIEW',
        signText: '📄 ACCEPT ESTIMATE AS-IS',
        outcomeTitle: 'Paid Standard Processing (-$400)',
        cost: -400,
        lesson: 'Signing without auditing left minor administrative fees on your tab.'
      },
      {
        z: 5900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 2 (6/9): APPRAISAL CAME IN $5K LOW',
        signText: '💵 PAY APPRAISAL GAP',
        outcomeTitle: 'Paid Appraisal Shortage in Cash (-$1,800)',
        cost: -1800,
        lesson: 'Paying the appraisal gap out of pocket drained your cash reserves.'
      },
      {
        z: 5900, lane: 0, type: 'choice', checkpointTitle: 'STAGE 2 (6/9): APPRAISAL CAME IN $5K LOW',
        signText: '🏃 CANCEL NO CONTINGENCY',
        outcomeTitle: 'Forfeited Partial Deposit (-$2,000)',
        cost: -2000,
        lesson: 'Backing out without an Appraisal Contingency puts your earnest deposit at risk!'
      },
      {
        z: 5900, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 2 (6/9): APPRAISAL CAME IN $5K LOW',
        signText: '📊 APPEAL WITH COMPS',
        outcomeTitle: 'Neighborhood Comps Appeal Won! (+$1,200)',
        cost: 1200,
        lesson: 'Submitting recent neighborhood sales ("Comps") proved the home value and saved your cash!'
      },
      {
        z: 6900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 3 (7/9): MARKET INTEREST RATE SPIKE',
        signText: '🔒 30-DAY RATE LOCK',
        outcomeTitle: 'Rate Locked Before Market Spike! (+$1,400)',
        cost: 1400,
        lesson: 'Locking your interest rate protected your cash when market rates jumped!'
      },
      {
        z: 6900, lane: 0, type: 'choice', checkpointTitle: 'STAGE 3 (7/9): MARKET INTEREST RATE SPIKE',
        signText: '📈 FLOAT INTEREST RATE',
        outcomeTitle: 'Rates Spiked While Floating! (-$1,800)',
        cost: -1800,
        lesson: 'Floating your rate left you exposed when interest rates rose during underwriting!'
      },
      {
        z: 6900, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 3 (7/9): MARKET INTEREST RATE SPIKE',
        signText: '⏳ DELAY PAPERWORK',
        outcomeTitle: 'Paid Rate-Lock Extension Fee (-$900)',
        cost: -900,
        lesson: 'Delaying your bank documents forced you to pay a daily Rate-Lock Extension fee.'
      },
      {
        z: 7900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 3 (8/9): ESCROW TAXES & INSURANCE',
        signText: '🏦 ESCROW + TAX CREDIT',
        outcomeTitle: 'Escrow Funded + Seller Tax Proration! (+$1,000)',
        cost: 1000,
        fillsEscrow: true,
        lesson: 'You funded your Escrow Reserve AND collected the seller’s unpaid property tax credit!'
      },
      {
        z: 7900, lane: 0, type: 'choice', checkpointTitle: 'STAGE 3 (8/9): ESCROW TAXES & INSURANCE',
        signText: '💼 PREPAY FULL YEAR SOLO',
        outcomeTitle: 'Escrow Funded Out-of-Pocket (-$800)',
        cost: -800,
        fillsEscrow: true,
        lesson: 'You funded your 6-month tax & 12-month insurance Escrow tank.'
      },
      {
        z: 7900, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 3 (8/9): ESCROW TAXES & INSURANCE',
        signText: '🚫 SKIP HOME INSURANCE',
        outcomeTitle: 'Lender Force-Placed Insurance Penalty! (-$2,400)',
        cost: -2400,
        fillsEscrow: true,
        lesson: 'Never skip homeowners insurance! The bank forced expensive coverage onto your loan.'
      },
      {
        z: 8900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 3 (9/9): CLOSING FUNDS TRANSFER',
        signText: '📧 USE EMAILED WIRE LINK',
        outcomeTitle: 'Wire Phishing Scam Penalty! (-$2,200)',
        cost: -2200,
        lesson: 'Never trust last-minute emailed wire changes! Always call the Title Office directly.'
      },
      {
        z: 8900, lane: 0, type: 'choice', checkpointTitle: 'STAGE 3 (9/9): CLOSING FUNDS TRANSFER',
        signText: '📞 CALL TITLE OFFICE',
        outcomeTitle: 'Verified Safe Wire + Earnest Credit! (+$1,000)',
        cost: 1000,
        lesson: 'Calling the Title Officer verified your safe wire and applied your Earnest Money credit!'
      },
      {
        z: 8900, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 3 (9/9): CLOSING FUNDS TRANSFER',
        signText: '📝 PERSONAL CHECK',
        outcomeTitle: 'Personal Check Rejected — Rush Fee (-$600)',
        cost: -600,
        lesson: 'Closing requires a Certified Cashier’s Check or verified wire transfer!'
      },
      {
        z: 10000, lane: 0, type: 'finish_arch',
        signText: '🏁 COUNTY TITLE OFFICE — FINAL CLOSING TABLE!'
      }
    ];
  }

  showPopup(text, color = '#ffffff') {
    if (!this.floatingPopup) return;
    this.floatingPopup.setText(text);
    this.floatingPopup.setColor(color);
    this.floatingPopup.setAlpha(1);
    this.floatingPopup.y = 185;
    this.tweens.killTweensOf(this.floatingPopup);
    this.tweens.add({
      targets: this.floatingPopup,
      y: 140,
      alpha: 0,
      duration: 2100,
      ease: 'Cubic.easeOut'
    });
  }

  toggleTurbo() {
    this.turboActive = !this.turboActive;
    this.maxSpeed = this.turboActive ? 110 : 80;
    this.showPopup(this.turboActive ? '⚡ TURBO CRUISE ON!' : '🚗 STANDARD CRUISE', '#facc15');
    this.emitTelemetry();
  }

  steerToLane(laneVal) {
    this.targetLaneX = laneVal;
  }

  setControlInput(action, value) {
    this.virtualInput = this.virtualInput || {};
    this.virtualInput[action] = value;
  }

  updateCashLevel(newCash) {
    this.cashReserves = newCash;
  }

  getUpcomingCheckpoint() {
    const upcoming = this.obstacles.filter(
      o => o.type === 'choice' && !o.hit && o.z - this.distance > -10 && o.z - this.distance <= 680
    );
    if (upcoming.length === 0) return null;
    const nearestZ = Math.min(...upcoming.map(o => o.z));
    const row = upcoming.filter(o => Math.abs(o.z - nearestZ) < 20).sort((a, b) => a.lane - b.lane);
    return {
      title: row[0]?.checkpointTitle || 'DECISION FORK AHEAD',
      distanceAway: Math.max(0, Math.round(nearestZ - this.distance)),
      options: row.map(r => ({ lane: r.lane, text: r.signText }))
    };
  }

  emitTelemetry() {
    if (this.onTelemetryUpdate) {
      let currentStage = 1;
      if (this.campaignMode === 'express') {
        if (this.distance >= 3300) currentStage = 3;
        else if (this.distance >= 1600) currentStage = 2;
      } else {
        if (this.distance >= 6600) currentStage = 3;
        else if (this.distance >= 3300) currentStage = 2;
      }

      this.onTelemetryUpdate({
        speed: Math.round(this.speed),
        distance: Math.min(this.targetDistance, Math.round(this.distance)),
        targetDistance: this.targetDistance,
        turboActive: this.turboActive,
        currentStage
      });
    }
    if (this.onUpcomingForkUpdate) {
      const fork = this.getUpcomingCheckpoint();
      let activeIdx = 1;
      if (this.playerX < -0.32) activeIdx = 0;
      else if (this.playerX > 0.32) activeIdx = 2;
      this.onUpcomingForkUpdate(fork, activeIdx);
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

    const upcomingFork = this.getUpcomingCheckpoint();
    const effectiveMaxSpeed = upcomingFork ? Math.min(this.maxSpeed, 64) : this.maxSpeed;

    if (up) {
      this.speed = Math.min(effectiveMaxSpeed, this.speed + 55 * dt);
      if (this.speed > effectiveMaxSpeed) {
        this.speed = Math.max(effectiveMaxSpeed, this.speed - 40 * dt);
      }
    } else if (down) {
      this.speed = Math.max(0, this.speed - 95 * dt);
    } else {
      this.speed = Math.max(0, this.speed - 22 * dt);
    }

    let steerDir = 0;
    if (left) {
      steerDir = -1;
      this.targetLaneX = null;
    }
    if (right) {
      steerDir = 1;
      this.targetLaneX = null;
    }

    if (this.targetLaneX !== null) {
      const diff = this.targetLaneX - this.playerX;
      if (Math.abs(diff) > 0.03) {
        steerDir = Math.sign(diff);
        this.playerX = Phaser.Math.Clamp(this.playerX + steerDir * 2.2 * dt, -1.0, 1.0);
      } else {
        this.playerX = this.targetLaneX;
        this.targetLaneX = null;
      }
    } else if (this.speed > 2) {
      this.playerX = Phaser.Math.Clamp(this.playerX + steerDir * 1.55 * dt, -1.0, 1.0);
    }

    const distDelta = this.speed * 4.2 * dt;
    this.distance += distDelta;
    this.roadZ += distDelta;

    this.render3DWorld(steerDir);
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

  render3DWorld(steerDir) {
    const { width } = this.scale;
    const gfx = this.worldGfx;
    gfx.clear();

    this.labelPool.forEach(l => l.setVisible(false));
    let labelIdx = 0;

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

    this.roadPickups.forEach(item => {
      const relZ = item.z - this.distance;
      if (!item.hit && relZ > -10 && relZ < 600) {
        const proj = this.project3D(item.lane, Math.max(5, relZ));
        const r = 24 * proj.scale;
        gfx.fillStyle(item.kind === 'coin' ? 0xfacc15 : 0xf43f5e, 1);
        gfx.lineStyle(2.5 * proj.scale, 0x18181b, 1);
        gfx.fillCircle(proj.screenX, proj.screenY - r, r);
        gfx.strokeCircle(proj.screenX, proj.screenY - r, r);

        if (labelIdx < this.labelPool.length && relZ < 380) {
          const lbl = this.labelPool[labelIdx++];
          lbl.setText(item.label);
          lbl.setBackgroundColor(item.kind === 'coin' ? '#fef08a' : '#fecdd3');
          lbl.setPosition(proj.screenX, proj.screenY - r * 2.2);
          lbl.setScale(Math.max(0.75, Math.min(1.0, proj.scale * 1.25)));
          lbl.setVisible(true);
        }

        if (relZ <= 36 && Math.abs(this.playerX - item.lane) < 0.36) {
          item.hit = true;
          this.showPopup(
            item.kind === 'coin' ? `${item.label}` : `${item.label} (-$600)`,
            item.kind === 'coin' ? '#4ade80' : '#fb7185'
          );
          if (this.onObstacleHit) {
            this.onObstacleHit({
              cost: item.cost,
              title: `${item.label}`,
              lesson: item.reason
            });
          }
        }
      }
    });

    const visibleObstacles = this.obstacles
      .map(obs => ({ ...obs, relZ: obs.z - this.distance }))
      .filter(obs => obs.relZ > -25 && obs.relZ < 680)
      .sort((a, b) => b.relZ - a.relZ);

    visibleObstacles.forEach(obs => {
      const proj = this.project3D(obs.lane, Math.max(5, obs.relZ));
      const w = 94 * proj.scale;
      const h = 50 * proj.scale;

      if (obs.type === 'finish_arch') {
        const leftPost = this.project3D(-1.05, Math.max(5, obs.relZ));
        const rightPost = this.project3D(1.05, Math.max(5, obs.relZ));
        const archHeight = 125 * proj.scale;

        gfx.fillStyle(0xfacc15, 1);
        gfx.lineStyle(3 * proj.scale, 0x18181b, 1);
        gfx.fillRect(leftPost.screenX - 8 * proj.scale, proj.screenY - archHeight, 16 * proj.scale, archHeight);
        gfx.fillRect(rightPost.screenX - 8 * proj.scale, proj.screenY - archHeight, 16 * proj.scale, archHeight);
        gfx.fillRect(leftPost.screenX, proj.screenY - archHeight, rightPost.screenX - leftPost.screenX, 26 * proj.scale);
        gfx.strokeRect(leftPost.screenX, proj.screenY - archHeight, rightPost.screenX - leftPost.screenX, 26 * proj.scale);

        if (labelIdx < this.labelPool.length && obs.relZ < 520) {
          const lbl = this.labelPool[labelIdx++];
          lbl.setText(obs.signText);
          lbl.setPosition(width / 2, proj.screenY - archHeight - 4);
          lbl.setScale(Math.max(0.8, Math.min(1.1, proj.scale * 1.3)));
          lbl.setVisible(true);
        }
      } else {
        const isAligned = Math.abs(this.playerX - obs.lane) < 0.36;
        gfx.fillStyle(isAligned ? 0xfacc15 : 0xffffff, 0.96);
        gfx.lineStyle(2.5 * proj.scale, 0x18181b, 1);
        gfx.fillRect(proj.screenX - w / 2, proj.screenY - h * 1.3, 5 * proj.scale, h * 1.3);
        gfx.fillRect(proj.screenX + w / 2 - 5 * proj.scale, proj.screenY - h * 1.3, 5 * proj.scale, h * 1.3);
        gfx.fillRoundedRect(proj.screenX - w / 2, proj.screenY - h * 1.45, w, h * 0.55, 5 * proj.scale);
        gfx.strokeRoundedRect(proj.screenX - w / 2, proj.screenY - h * 1.45, w, h * 0.55, 5 * proj.scale);

        if (labelIdx < this.labelPool.length && obs.relZ < 400) {
          const lbl = this.labelPool[labelIdx++];
          lbl.setText(obs.signText);
          lbl.setBackgroundColor(isAligned ? '#facc15' : '#ffffff');
          lbl.setPosition(proj.screenX, proj.screenY - h * 1.48);
          lbl.setScale(Math.max(0.78, Math.min(1.05, proj.scale * 1.3)));
          lbl.setVisible(true);
        }
      }

      if (!obs.hit && obs.relZ <= 38 && obs.relZ >= -15) {
        if (obs.type === 'finish_arch') {
          obs.hit = true;
          this.finished = true;
          this.speed = 0;
          if (this.onFinishLine) this.onFinishLine();
        } else if (obs.type === 'choice') {
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

            sameRow.forEach(o => { o.hit = true; });

            if (chosenGate.fillsEscrow) {
              this.escrowCollected = true;
              if (this.onEscrowCheckpoint) this.onEscrowCheckpoint();
            }

            const popColor = chosenGate.cost < 0 ? '#fb7185' : '#4ade80';
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

    this.drawPlayerVehicle(gfx, steerDir);
  }

  // Draws 3 distinct vehicle bodies ('pickup', 'van', 'rig') + dynamic wealth upgrades based on cashReserves!
  drawPlayerVehicle(gfx, steerDir) {
    const { width, height } = this.scale;
    const x = width / 2 + this.playerX * 210;
    const y = height - 22; // Smooth, stable Y position (zero screen shaking!)
    const tilt = steerDir * 3.5;

    const isRich = this.cashReserves >= 13500;
    const isLowCash = this.cashReserves < 8500;
    const borderCol = isRich ? 0xfacc15 : 0x18181b;

    // Ground Shadow
    gfx.fillStyle(0x000000, 0.32);
    gfx.fillEllipse(x, height - 12, 130, 20);

    if (this.vehicleType === 'pickup') {
      // 1. 0%-DOWN COMPACT MINI-PICKUP (Open Bed Showing Cash Bundles!)
      gfx.fillStyle(0x18181b, 1);
      gfx.fillRoundedRect(x - 48, y - 18, 20, 22, 5);
      gfx.fillRoundedRect(x + 28, y - 18, 20, 22, 5);

      // Pickup Cab (Upper)
      gfx.fillStyle(this.truckColor, 1);
      gfx.lineStyle(3, borderCol, 1);
      gfx.fillRoundedRect(x - 36 + tilt, y - 70, 72, 34, 8);
      gfx.strokeRoundedRect(x - 36 + tilt, y - 70, 72, 34, 8);

      // Rear Cab Window
      gfx.fillStyle(isLowCash ? 0x475569 : 0x38bdf8, 1);
      gfx.fillRoundedRect(x - 26 + tilt, y - 64, 52, 18, 4);

      // Open Pickup Bed (Lower)
      gfx.fillStyle(this.truckColor, 1);
      gfx.fillRoundedRect(x - 46 + tilt, y - 42, 92, 28, 6);
      gfx.strokeRoundedRect(x - 46 + tilt, y - 42, 92, 28, 6);

      // Visible Cash Stacks in the Open Bed (Scales with how much money you have!)
      if (!isLowCash) {
        gfx.fillStyle(0x22c55e, 1);
        gfx.fillRect(x - 32 + tilt, y - 50, 24, 10);
        gfx.strokeRect(x - 32 + tilt, y - 50, 24, 10);
        gfx.fillRect(x + 6 + tilt, y - 50, 24, 10);
        gfx.strokeRect(x + 6 + tilt, y - 50, 24, 10);
      }
      if (isRich) {
        // Extra Gold Bullion Stack in Bed when Rich!
        gfx.fillStyle(0xfacc15, 1);
        gfx.fillRect(x - 14 + tilt, y - 58, 28, 12);
        gfx.strokeRect(x - 14 + tilt, y - 58, 28, 12);
      }
    } else if (this.vehicleType === 'van') {
      // 2. FHA 3.5%-DOWN SPRINTER CARGO VAN (Tall Rounded Van with Twin Doors)
      gfx.fillStyle(0x18181b, 1);
      gfx.fillRoundedRect(x - 50, y - 18, 22, 24, 5);
      gfx.fillRoundedRect(x + 28, y - 18, 22, 24, 5);

      gfx.fillStyle(this.truckColor, 1);
      gfx.lineStyle(3.5, borderCol, 1);
      gfx.fillRoundedRect(x - 46 + tilt, y - 82, 92, 66, 16);
      gfx.strokeRoundedRect(x - 46 + tilt, y - 82, 92, 66, 16);

      // Center Rear Door Seam
      gfx.lineBetween(x + tilt, y - 80, x + tilt, y - 18);

      // Twin Rear Van Windows
      gfx.fillStyle(this.escrowCollected ? 0x38bdf8 : 0x1e293b, 1);
      gfx.fillRoundedRect(x - 36 + tilt, y - 68, 30, 22, 5);
      gfx.fillRoundedRect(x + 6 + tilt, y - 68, 30, 22, 5);

      // Roof Luggage Rack when Rich
      if (isRich) {
        gfx.fillStyle(0xfacc15, 1);
        gfx.fillRoundedRect(x - 28 + tilt, y - 92, 56, 10, 4);
        gfx.strokeRoundedRect(x - 28 + tilt, y - 92, 56, 10, 4);
      }
    } else {
      // 3. CONVENTIONAL 20%-DOWN HEAVY BOX RIG (Wide Commercial Hauler with Chrome Stacks)
      gfx.fillStyle(0x18181b, 1);
      gfx.fillRoundedRect(x - 62, y - 20, 26, 26, 5);
      gfx.fillRoundedRect(x + 36, y - 20, 26, 26, 5);

      // Dual Vertical Chrome Exhaust Stacks
      gfx.fillStyle(isRich ? 0xfacc15 : 0xcbd5e1, 1);
      gfx.lineStyle(2.5, 0x18181b, 1);
      gfx.fillRect(x - 62 + tilt, y - 92, 8, 45);
      gfx.strokeRect(x - 62 + tilt, y - 92, 8, 45);
      gfx.fillRect(x + 54 + tilt, y - 92, 8, 45);
      gfx.strokeRect(x + 54 + tilt, y - 92, 8, 45);

      // Wide Armored Cargo Box
      gfx.fillStyle(this.truckColor, 1);
      gfx.lineStyle(4, borderCol, 1);
      gfx.fillRoundedRect(x - 56 + tilt, y - 86, 112, 70, 8);
      gfx.strokeRoundedRect(x - 56 + tilt, y - 86, 112, 70, 8);

      // White Roof Cap
      gfx.fillStyle(isRich ? 0xfef08a : 0xffffff, 0.95);
      gfx.fillRoundedRect(x - 52 + tilt, y - 84, 104, 12, 3);

      // Escrow Tank Window
      gfx.fillStyle(0x18181b, 1);
      gfx.fillRoundedRect(x - 38 + tilt, y - 62, 76, 26, 5);
      if (this.escrowCollected) {
        gfx.fillStyle(0x38bdf8, 1);
        gfx.fillRoundedRect(x - 34 + tilt, y - 58, 68, 18, 3);
      }

      // Gold Crown Cargo Box on Roof when Rich!
      if (isRich) {
        gfx.fillStyle(0xfacc15, 1);
        gfx.fillRoundedRect(x - 26 + tilt, y - 98, 52, 12, 4);
        gfx.strokeRoundedRect(x - 26 + tilt, y - 98, 52, 12, 4);
      }
    }

    // Visual "Duct Tape X" if Player's Cash Drops Low (<$8,500)
    if (isLowCash) {
      gfx.lineStyle(3, 0x94a3b8, 1);
      gfx.lineBetween(x - 20 + tilt, y - 62, x + 20 + tilt, y - 42);
      gfx.lineBetween(x + 20 + tilt, y - 62, x - 20 + tilt, y - 42);
    }

    // Brake Lights & Wealth License Plate
    const braking = this.cursors?.down?.isDown || this.keys?.S?.isDown;
    gfx.fillStyle(braking ? 0xff0000 : 0xfbbf24, 1);
    gfx.lineStyle(2, 0x18181b, 1);
    gfx.fillRect(x - 42 + tilt, y - 24, 16, 7);
    gfx.strokeRect(x - 42 + tilt, y - 24, 16, 7);
    gfx.fillRect(x + 26 + tilt, y - 24, 16, 7);
    gfx.strokeRect(x + 26 + tilt, y - 24, 16, 7);
  }
}

export default function PhaserCanvas({
  truckColor,
  vehicleType,
  cashReserves,
  campaignMode,
  onTelemetryUpdate,
  onObstacleHit,
  onEscrowCheckpoint,
  onFinishLine,
  sceneControlRef
}) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const sceneInstanceRef = useRef(null);
  const [upcomingFork, setUpcomingFork] = useState(null);
  const [activeLaneIdx, setActiveLaneIdx] = useState(1);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const scene = new EscrowFOVScene();
    scene.truckColor = truckColor || 0xf43f5e;
    scene.vehicleType = vehicleType || 'rig';
    scene.cashReserves = cashReserves || 12000;
    scene.campaignMode = campaignMode || 'express';
    scene.onTelemetryUpdate = onTelemetryUpdate;
    scene.onObstacleHit = onObstacleHit;
    scene.onEscrowCheckpoint = onEscrowCheckpoint;
    scene.onFinishLine = onFinishLine;
    scene.onUpcomingForkUpdate = (fork, laneIdx) => {
      setUpcomingFork(fork);
      setActiveLaneIdx(laneIdx);
    };

    sceneInstanceRef.current = scene;

    const config = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 330,
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
        steerToLane: (laneVal) => scene.steerToLane(laneVal)
      };
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [campaignMode, truckColor, vehicleType]);

  // Dynamically update vehicle wealth appearance whenever cashReserves changes!
  useEffect(() => {
    if (sceneInstanceRef.current) {
      sceneInstanceRef.current.updateCashLevel(cashReserves);
    }
  }, [cashReserves]);

  const laneLabels = ['⬅️ LEFT [A]', '⬆️ CENTER', '➡️ RIGHT [D]'];

  return (
    <div className="arcade-card rounded-2xl overflow-hidden bg-sky-300 p-1.5 relative">
      {/* Pinned Overlay Signboard (Fixed position inside top of canvas = ZERO layout jumping!) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 pointer-events-auto">
        {upcomingFork ? (
          <div className="bg-zinc-900/95 border-2 border-zinc-900 text-white rounded-xl p-2 shadow-lg">
            <div className="flex items-center justify-between text-[11px] font-black uppercase text-amber-300 mb-1.5 px-1">
              <span className="truncate">🛣️ {upcomingFork.title}</span>
              <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] shrink-0">
                {upcomingFork.distanceAway}m — STEER OR CLICK!
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {upcomingFork.options.map((opt, idx) => {
                const isTargeted = activeLaneIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sceneControlRef?.current?.steerToLane(opt.lane)}
                    className={`px-2.5 py-1.5 rounded-lg border-2 text-left transition ${
                      isTargeted
                        ? 'bg-amber-300 text-zinc-900 border-white font-black'
                        : 'bg-zinc-800 text-zinc-200 border-zinc-600 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-black uppercase">
                      <span>{laneLabels[idx]}</span>
                      {isTargeted && <span className="bg-zinc-900 text-amber-300 px-1 rounded">✓</span>}
                    </div>
                    <div className="font-display text-xs sm:text-sm font-bold truncate mt-0.5">
                      {opt.text}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/80 backdrop-blur-sm text-white border border-white/20 rounded-xl px-3.5 py-1.5 flex items-center justify-between text-xs font-bold">
            <span>💰 COLLECT GOLD COINS (+$300) & DODGE RED DEBT TRAPS (-$600)</span>
            <span className="text-amber-300 font-black">HOLD [W / ▲] OR [GAS]</span>
          </div>
        )}
      </div>

      {/* 3D Phaser Canvas */}
      <div ref={containerRef} className="w-full h-[250px] sm:h-[310px] rounded-xl overflow-hidden border-2 border-zinc-900" />
    </div>
  );
}
