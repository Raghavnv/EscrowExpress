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
    this.horizonY = 120;

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x38bdf8, 0x38bdf8, 0xbae6fd, 0xfef08a, 1);
    sky.fillRect(0, 0, width, this.horizonY);

    this.add.circle(width - 110, 46, 34, 0xfacc15, 1).setStrokeStyle(4, 0x18181b);
    this.clouds = [
      this.add.ellipse(140, 45, 95, 36, 0xffffff).setStrokeStyle(3, 0x18181b),
      this.add.ellipse(420, 60, 120, 40, 0xffffff).setStrokeStyle(3, 0x18181b),
      this.add.ellipse(640, 38, 85, 32, 0xffffff).setStrokeStyle(3, 0x18181b)
    ];

    const hills = this.add.graphics();
    hills.fillStyle(0x4ade80, 1);
    hills.lineStyle(3, 0x18181b, 1);
    hills.fillEllipse(190, this.horizonY + 10, 390, 70);
    hills.strokeEllipse(190, this.horizonY + 10, 390, 70);
    hills.fillStyle(0x22c55e, 1);
    hills.fillEllipse(580, this.horizonY + 15, 460, 80);
    hills.strokeEllipse(580, this.horizonY + 15, 460, 80);

    this.worldGfx = this.add.graphics();

    this.labelPool = [];
    for (let i = 0; i < 18; i++) {
      const lbl = this.add.text(0, 0, '', {
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#18181b',
        backgroundColor: '#fef08a',
        stroke: '#18181b',
        strokeThickness: 1,
        padding: { x: 9, y: 5 }
      }).setOrigin(0.5, 1).setVisible(false).setDepth(20);
      this.labelPool.push(lbl);
    }

    this.floatingPopup = this.add.text(width / 2, 200, '', {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '23px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#18181b',
      strokeThickness: 6
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
      { z: 380, lane: 0, kind: 'coin', label: '💰 SAVINGS BOOST' },
      { z: 1120, lane: -0.7, kind: 'hazard', label: '💳 NEW CREDIT CARD' },
      { z: 1920, lane: 0.7, kind: 'coin', label: '💰 TAX REFUND' },
      { z: 2680, lane: 0, kind: 'hazard', label: '🚗 FINANCED NEW CAR' },
      { z: 3480, lane: -0.7, kind: 'coin', label: '💰 RATE REBATE' },
      { z: 4250, lane: 0.7, kind: 'coin', label: '💰 EARNEST REBATE' },
      { z: 5350, lane: 0, kind: 'coin', label: '💰 LENDER CREDIT' },
      { z: 6350, lane: -0.7, kind: 'hazard', label: '🛋️ FINANCED FURNITURE' },
      { z: 7350, lane: 0.7, kind: 'coin', label: '💰 ESCROW DIVIDEND' },
      { z: 8350, lane: 0, kind: 'hazard', label: '🚗 AUTO LOAN INQUIRY' },
      { z: 9350, lane: -0.7, kind: 'coin', label: '💰 CLOSING BONUS' }
    ].filter(g => g.z < this.targetDistance - 350);

    this.roadPickups = gapZones.map(g => ({
      ...g,
      hit: false,
      cost: g.kind === 'coin' ? 300 : -600,
      reason: g.kind === 'coin'
        ? 'Added +$300 to your liquid Cash-to-Close reserve!'
        : 'Rule #1 of Escrow: Never open new credit cards or finance cars/furniture before closing—it spikes your Debt-to-Income (DTI) ratio!'
    }));
  }

  setupExpress5MileRoute() {
    this.obstacles = [
      // 1. Inspection (Mile 0.75)
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

      // 2. Loan Estimate (Mile 1.5)
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

      // 3. Rate Lock (Mile 2.3)
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

      // 4. Appraisal (Mile 3.1)
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

      // 5. Escrow (Mile 3.9)
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

      // 6. Wire Transfer (Mile 4.55)
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

      // Finish (Mile 5.0)
      {
        z: 5000, lane: 0, type: 'finish_arch',
        signText: '🏁 COUNTY TITLE OFFICE — FINAL CLOSING TABLE!'
      }
    ];
  }

  setupFull10MileRoute() {
    this.obstacles = [
      // 1. Pre-Approval (Mile 0.95)
      {
        z: 950, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 1 (1/9): MAKING AN OFFER ON A HOME',
        signText: '📝 VERBAL BUDGET ESTIMATE',
        outcomeTitle: 'Seller Rejected Verbal Offer (-$800 Delay)',
        cost: -800,
        lesson: 'Sellers rarely take verbal budgets seriously—always get a verified Lender Pre-Approval first!'
      },
      {
        z: 950, lane: 0, type: 'choice', checkpointTitle: 'STAGE 1 (1/9): MAKING AN OFFER ON A HOME',
        signText: '✅ LENDER PRE-APPROVAL LETTER',
        outcomeTitle: 'Verified Pre-Approval Won the Offer! (+$1,200)',
        cost: 1200,
        lesson: 'A verified Pre-Approval Letter proves a lender checked your income and credit, giving sellers confidence to accept your offer!'
      },
      {
        z: 950, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 1 (1/9): MAKING AN OFFER ON A HOME',
        signText: '📱 2-MIN ONLINE PRE-QUAL',
        outcomeTitle: 'Weak Pre-Qual Needed Rush Underwriting (-$400)',
        cost: -400,
        lesson: 'A quick "Pre-Qualification" is just an unverified estimate—Pre-Approval is much stronger!'
      },

      // 2. DTI Check (Mile 1.9)
      {
        z: 1900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 1 (2/9): DEBT-TO-INCOME (DTI) CHECK',
        signText: '📉 PAY DOWN CREDIT CARD',
        outcomeTitle: 'Lowered DTI Below 36%! (+$1,200 Rate Bonus)',
        cost: 1200,
        lesson: 'Keeping your Debt-to-Income (DTI) ratio low unlocks top-tier interest rates and lender credits!'
      },
      {
        z: 1900, lane: 0, type: 'choice', checkpointTitle: 'STAGE 1 (2/9): DEBT-TO-INCOME (DTI) CHECK',
        signText: '🛋️ FINANCE NEW FURNITURE',
        outcomeTitle: 'DTI Spiked! Loan Pricing Penalty (-$1,600)',
        cost: -1600,
        lesson: 'Financing furniture while buying a house raises your monthly debt ratio and triggers higher loan fees!'
      },
      {
        z: 1900, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 1 (2/9): DEBT-TO-INCOME (DTI) CHECK',
        signText: '💳 OPEN STORE CARD',
        outcomeTitle: 'Hard Credit Inquiry Penalty (-$700)',
        cost: -700,
        lesson: 'Avoid new credit inquiries while your mortgage application is active!'
      },

      // 3. Earnest Money (Mile 2.9)
      {
        z: 2900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 1 (3/9): EARNEST MONEY DEPOSIT',
        signText: '🤝 SEND DIRECT TO SELLER',
        outcomeTitle: 'Unprotected Deposit Risk! (-$1,500)',
        cost: -1500,
        lesson: 'Never hand Earnest Money directly to the seller! It must always be held in a neutral third-party Escrow account.'
      },
      {
        z: 2900, lane: 0, type: 'choice', checkpointTitle: 'STAGE 1 (3/9): EARNEST MONEY DEPOSIT',
        signText: '🏦 DEPOSIT INTO ESCROW',
        outcomeTitle: 'Safe Escrow Deposit Credited! (+$1,200)',
        cost: 1200,
        lesson: 'Your Earnest Money (1%–2% of the price) stays safe in a neutral Escrow account and counts toward your closing costs!'
      },
      {
        z: 2900, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 1 (3/9): EARNEST MONEY DEPOSIT',
        signText: '🚫 REFUSE EARNEST DEPOSIT',
        outcomeTitle: 'Seller Demanded Price Bump (-$900)',
        cost: -900,
        lesson: 'Without Earnest Money, sellers have no proof you have "skin in the game."'
      },

      // 4. Inspection (Mile 3.9)
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

      // 5. Loan Estimate (Mile 4.9)
      {
        z: 4900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 2 (5/9): LOAN ESTIMATE REVIEW',
        signText: '⚡ EXPRESS COURIER FEE',
        outcomeTitle: 'Paid Padded "Junk Fee" (-$1,200)',
        cost: -1200,
        lesson: '"Express Courier & Admin Package" is a padded lender Junk Fee you should always refuse!'
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

      // 6. Appraisal (Mile 5.9)
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

      // 7. Rate Lock (Mile 6.9)
      {
        z: 6900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 3 (7/9): MARKET INTEREST RATE SPIKE',
        signText: '🔒 30-DAY RATE LOCK',
        outcomeTitle: 'Rate Locked Before Market Spike! (+$1,400)',
        cost: 1400,
        lesson: 'Locking your interest rate protected your cash when market rates jumped during underwriting!'
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

      // 8. Escrow (Mile 7.9)
      {
        z: 7900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 3 (8/9): ESCROW TAXES & INSURANCE',
        signText: '🏦 ESCROW + TAX CREDIT',
        outcomeTitle: 'Escrow Funded + Seller Tax Proration! (+$1,000)',
        cost: 1000,
        fillsEscrow: true,
        lesson: 'You funded your Escrow Reserve AND collected the seller’s unpaid property tax proration credit!'
      },
      {
        z: 7900, lane: 0, type: 'choice', checkpointTitle: 'STAGE 3 (8/9): ESCROW TAXES & INSURANCE',
        signText: '💼 PREPAY FULL YEAR SOLO',
        outcomeTitle: 'Escrow Funded Out-of-Pocket (-$800)',
        cost: -800,
        fillsEscrow: true,
        lesson: 'You funded your 6-month tax & 12-month insurance Escrow tank, though you didn’t claim seller tax credits.'
      },
      {
        z: 7900, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 3 (8/9): ESCROW TAXES & INSURANCE',
        signText: '🚫 SKIP HOME INSURANCE',
        outcomeTitle: 'Lender Force-Placed Insurance Penalty! (-$2,400)',
        cost: -2400,
        fillsEscrow: true,
        lesson: 'Never skip homeowners insurance! The bank forced expensive coverage onto your loan at closing.'
      },

      // 9. Wire Transfer (Mile 8.9)
      {
        z: 8900, lane: -0.72, type: 'choice', checkpointTitle: 'STAGE 3 (9/9): CLOSING FUNDS TRANSFER',
        signText: '📧 USE EMAILED WIRE LINK',
        outcomeTitle: 'Wire Phishing Scam Penalty! (-$2,200)',
        cost: -2200,
        lesson: 'Never trust last-minute emailed wire changes! Always call the Title Office directly to verify routing numbers.'
      },
      {
        z: 8900, lane: 0, type: 'choice', checkpointTitle: 'STAGE 3 (9/9): CLOSING FUNDS TRANSFER',
        signText: '📞 CALL TITLE OFFICE',
        outcomeTitle: 'Verified Safe Wire + Earnest Credit! (+$1,000)',
        cost: 1000,
        lesson: 'Calling the Title Officer verified your safe wire and applied your Earnest Money deposit credit!'
      },
      {
        z: 8900, lane: 0.72, type: 'choice', checkpointTitle: 'STAGE 3 (9/9): CLOSING FUNDS TRANSFER',
        signText: '📝 PERSONAL CHECK',
        outcomeTitle: 'Personal Check Rejected — Rush Fee (-$600)',
        cost: -600,
        lesson: 'Closing requires a Certified Cashier’s Check or verified wire transfer—personal checks delay funding!'
      },

      // Finish (Mile 10.0)
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
    this.floatingPopup.y = 200;
    this.tweens.killTweensOf(this.floatingPopup);
    this.tweens.add({
      targets: this.floatingPopup,
      y: 145,
      alpha: 0,
      duration: 2200,
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
        const r = 26 * proj.scale;
        gfx.fillStyle(item.kind === 'coin' ? 0xfacc15 : 0xf43f5e, 1);
        gfx.lineStyle(3 * proj.scale, 0x18181b, 1);
        gfx.fillCircle(proj.screenX, proj.screenY - r, r);
        gfx.strokeCircle(proj.screenX, proj.screenY - r, r);

        if (labelIdx < this.labelPool.length && relZ < 420) {
          const lbl = this.labelPool[labelIdx++];
          lbl.setText(item.label);
          lbl.setBackgroundColor(item.kind === 'coin' ? '#fef08a' : '#fecdd3');
          lbl.setPosition(proj.screenX, proj.screenY - r * 2.2);
          lbl.setScale(Math.max(0.8, Math.min(1.1, proj.scale * 1.35)));
          lbl.setVisible(true);
        }

        if (relZ <= 36 && Math.abs(this.playerX - item.lane) < 0.36) {
          item.hit = true;
          this.showPopup(
            item.kind === 'coin' ? `${item.label} (+$300)` : `${item.label} (-$600)`,
            item.kind === 'coin' ? '#4ade80' : '#fb7185'
          );
          if (item.kind === 'hazard') this.cameras.main.shake(160, 0.01);
          if (this.onObstacleHit) {
            this.onObstacleHit({
              cost: item.cost,
              title: `${item.label} (${item.cost > 0 ? '+$300' : '-$600'})`,
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
      const w = 96 * proj.scale;
      const h = 52 * proj.scale;

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
          lbl.setScale(Math.max(0.85, Math.min(1.2, proj.scale * 1.4)));
          lbl.setVisible(true);
        }
      } else {
        const isAligned = Math.abs(this.playerX - obs.lane) < 0.36;
        gfx.fillStyle(isAligned ? 0xfacc15 : 0xffffff, 0.96);
        gfx.lineStyle(3 * proj.scale, 0x18181b, 1);
        gfx.fillRect(proj.screenX - w / 2, proj.screenY - h * 1.3, 6 * proj.scale, h * 1.3);
        gfx.fillRect(proj.screenX + w / 2 - 6 * proj.scale, proj.screenY - h * 1.3, 6 * proj.scale, h * 1.3);
        gfx.fillRoundedRect(proj.screenX - w / 2, proj.screenY - h * 1.45, w, h * 0.55, 6 * proj.scale);
        gfx.strokeRoundedRect(proj.screenX - w / 2, proj.screenY - h * 1.45, w, h * 0.55, 6 * proj.scale);

        if (labelIdx < this.labelPool.length && obs.relZ < 440) {
          const lbl = this.labelPool[labelIdx++];
          lbl.setText(obs.signText);
          lbl.setBackgroundColor(isAligned ? '#facc15' : '#ffffff');
          lbl.setPosition(proj.screenX, proj.screenY - h * 1.48);
          lbl.setScale(Math.max(0.85, Math.min(1.18, proj.scale * 1.45)));
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
  campaignMode,
  onTelemetryUpdate,
  onObstacleHit,
  onEscrowCheckpoint,
  onFinishLine,
  sceneControlRef
}) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [upcomingFork, setUpcomingFork] = useState(null);
  const [activeLaneIdx, setActiveLaneIdx] = useState(1);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const scene = new EscrowFOVScene();
    scene.truckColor = truckColor || 0xf43f5e;
    scene.campaignMode = campaignMode || 'express';
    scene.onTelemetryUpdate = onTelemetryUpdate;
    scene.onObstacleHit = onObstacleHit;
    scene.onEscrowCheckpoint = onEscrowCheckpoint;
    scene.onFinishLine = onFinishLine;
    scene.onUpcomingForkUpdate = (fork, laneIdx) => {
      setUpcomingFork(fork);
      setActiveLaneIdx(laneIdx);
    };

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
        steerToLane: (laneVal) => scene.steerToLane(laneVal)
      };
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [campaignMode, truckColor]);

  const laneLabels = ['⬅️ LEFT LANE [A]', '⬆️ CENTER LANE', '➡️ RIGHT LANE [D]'];

  return (
    <div className="space-y-3">
      {upcomingFork ? (
        <div className="arcade-card bg-zinc-900 text-white rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300 mb-3 px-1">
            <span>🛣️ {upcomingFork.title}</span>
            <span className="bg-rose-500 text-white px-3 py-0.5 rounded-full border border-white">
              {upcomingFork.distanceAway}m AHEAD — STEER OR CLICK A SIGN!
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {upcomingFork.options.map((opt, idx) => {
              const isTargeted = activeLaneIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sceneControlRef?.current?.steerToLane(opt.lane)}
                  className={`p-3.5 rounded-xl border-3 text-left transition flex flex-col justify-between ${
                    isTargeted
                      ? 'bg-amber-300 text-zinc-900 border-white shadow-[0_0_15px_rgba(250,204,21,0.6)] scale-[1.02]'
                      : 'bg-zinc-800 text-zinc-200 border-zinc-600 hover:bg-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black uppercase mb-1.5">
                    <span className={isTargeted ? 'text-zinc-900' : 'text-zinc-400'}>
                      {laneLabels[idx]}
                    </span>
                    {isTargeted && (
                      <span className="bg-zinc-900 text-amber-300 px-2 py-0.5 rounded text-[10px]">
                        ✓ ALIGNED
                      </span>
                    )}
                  </div>
                  <div className="font-display text-base sm:text-lg font-bold leading-tight">
                    {opt.text}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="arcade-card bg-emerald-200 rounded-2xl px-5 py-3 flex items-center justify-between text-xs sm:text-sm font-black text-zinc-900">
          <span>💰 COLLECT GOLD SAVINGS COINS (+$300) & DODGE NEW DEBT TRAPS (-$600) BETWEEN CHECKPOINTS!</span>
          <span className="bg-white border-2 border-zinc-900 px-3 py-0.5 rounded-lg shrink-0">ACTIVE ROAD</span>
        </div>
      )}

      <div className="arcade-card rounded-3xl overflow-hidden bg-sky-300 p-1.5">
        <div ref={containerRef} className="w-full h-[270px] sm:h-[360px] rounded-2xl overflow-hidden border-3 border-zinc-900" />
      </div>
    </div>
  );
}
