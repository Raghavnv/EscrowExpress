import React, { useState } from 'react';
import {
  Truck, Sparkles, Award, ArrowRight, ArrowLeft,
  Key, Paintbrush, Shield, Flame, Gamepad2, Map, CheckCircle2, BookOpen
} from 'lucide-react';

export const STAGE_GUIDES = [
  {
    stageNum: 1,
    stageTitle: 'Stage 1: Pre-Approval & Offer',
    color: 'bg-amber-100',
    accent: 'bg-amber-300',
    terms: [
      {
        title: '1. Pre-Approval vs. Pre-Qualification',
        icon: '📝',
        meaning: 'A "Pre-Qualification" is an unverified estimate. A "Lender Pre-Approval Letter" means a bank verified your income, taxes, and credit.',
        highwayTip: 'Always choose a verified Lender Pre-Approval Letter so sellers accept your offer.'
      },
      {
        title: '2. Debt-to-Income (DTI) Ratio',
        icon: '📉',
        meaning: 'The percentage of your monthly income spent on debt payments. Lenders want your DTI under 36%–43%.',
        highwayTip: 'Pay down credit cards and never finance cars or furniture before closing!'
      },
      {
        title: '3. Earnest Money Deposit',
        icon: '🏦',
        meaning: 'A 1%–2% good-faith deposit showing the seller you are serious about buying.',
        highwayTip: 'Always deposit Earnest Money into a neutral Escrow account—never send it directly to the seller.'
      }
    ]
  },
  {
    stageNum: 2,
    stageTitle: 'Stage 2: Inspection & Appraisal',
    color: 'bg-sky-100',
    accent: 'bg-sky-300',
    terms: [
      {
        title: '4. Inspection & Seller Credits',
        icon: '🛠️',
        meaning: 'An inspector checks the roof, pipes, and HVAC. If defects turn up, you can request a "Seller Credit" so the seller helps pay for repairs.',
        highwayTip: 'Never waive your inspection! Request a Seller Credit to protect your cash.'
      },
      {
        title: '5. Loan Estimate & "Junk Fees"',
        icon: '🔍',
        meaning: 'Your 3-page Loan Estimate lists every closing fee. Some lenders slip in padded "Junk Fees" like Express Courier charges.',
        highwayTip: 'Audit your Loan Estimate to remove padded courier and admin fees.'
      },
      {
        title: '6. Appraisal & "Comps" Appeal',
        icon: '📊',
        meaning: 'An appraiser verifies the home’s value. If it appraises $5k below your offer ("Appraisal Gap"), the bank won’t lend the difference.',
        highwayTip: 'Appeal low appraisals using neighborhood "Comps" (comparable sales) instead of paying cash!'
      }
    ]
  },
  {
    stageNum: 3,
    stageTitle: 'Stage 3: Rate Locks & Escrow',
    color: 'bg-emerald-100',
    accent: 'bg-emerald-300',
    terms: [
      {
        title: '7. 30-Day Interest Rate Lock',
        icon: '🔒',
        meaning: 'Freezes your mortgage interest rate for 30 days so daily market swings don’t raise your payment.',
        highwayTip: 'Always lock your rate instead of floating it during underwriting!'
      },
      {
        title: '8. Escrow Reserve & Tax Credit',
        icon: '⚖️',
        meaning: 'Lenders collect 6 months of property taxes and 12 months of home insurance upfront in an Escrow Account.',
        highwayTip: 'Fund your Escrow tank and claim your Seller Tax Proration credit!'
      },
      {
        title: '9. Wire Fraud Safety',
        icon: '📞',
        meaning: 'On closing day, scammers send fake emails with changed bank wire routing numbers.',
        highwayTip: 'Never click emailed wire links—always call the Title Office directly to verify!'
      }
    ]
  }
];

const TRUCK_PAINTS = [
  { name: 'Hot Coral', hex: 0xf43f5e, bg: 'bg-rose-500' },
  { name: 'Taxi Gold', hex: 0xf59e0b, bg: 'bg-amber-500' },
  { name: 'Mint Turbo', hex: 0x10b981, bg: 'bg-emerald-500' },
  { name: 'Electric Sky', hex: 0x0ea5e9, bg: 'bg-sky-500' }
];

const LOAN_VEHICLES = [
  {
    id: 'assistance',
    vehicleType: 'pickup',
    name: '0% Down Mini-Pickup',
    loanLabel: 'First-Time Buyer Assistance Loan',
    downPayment: 0,
    startingCash: 13500,
    pmiPenalty: 1500,
    tag: '$0 Down • $12,000 Net Start Fuel',
    visualNote: 'Nimble open-bed pickup truck showing visible cash crates in the bed.',
    desc: 'Zero down payment required, but deducts a $1,500 program funding fee at launch.'
  },
  {
    id: 'fha',
    vehicleType: 'van',
    name: 'FHA 3.5% Sprinter Van',
    loanLabel: 'FHA Government-Backed Loan',
    downPayment: 10500,
    startingCash: 13200,
    pmiPenalty: 1000,
    tag: '$10.5k Down • $12,200 Net Start Fuel',
    visualNote: 'Mid-size rounded cargo van with twin rear windows and roof rack.',
    desc: 'Low 3.5% down payment with a $1,000 Upfront Mortgage Insurance (UFMIP) deduction.'
  },
  {
    id: 'conventional',
    vehicleType: 'rig',
    name: 'Conventional 20% Heavy Rig',
    loanLabel: 'Conventional 20%-Down Loan',
    downPayment: 60000,
    startingCash: 12500,
    pmiPenalty: 0,
    tag: '$60k Down • $12,500 Net Start Fuel',
    visualNote: 'Wide dual-tire armored box truck with twin chrome exhaust stacks.',
    desc: 'Requires $60k down, but charges $0 mortgage insurance and starts with gold trim!'
  }
];

const CAMPAIGN_MODES = [
  {
    id: 'express',
    miles: 5,
    distance: 5000,
    title: '⚡ 5.0-Mile Express Drive',
    subtitle: '6 Core Checkpoints (~90 Secs)',
    desc: 'Covers Inspection, Loan Estimate, Rate Lock, Appraisal, Escrow, and Wire Transfer.'
  },
  {
    id: 'full',
    miles: 10,
    distance: 10000,
    title: '🏆 10.0-Mile Full Campaign',
    subtitle: 'All 9 Checkpoints Across 3 Stages (~3 Mins)',
    desc: 'Starts from Pre-Approval, DTI Ratio, and Earnest Money all the way to Closing Day!'
  }
];

export default function OnboardingFlow({ existingSave, onStartNewGame, onResumeGame }) {
  const [screen, setScreen] = useState('splash');
  const [activeStageTab, setActiveStageTab] = useState(1);
  const [visitedStages, setVisitedStages] = useState([1]);
  const [buyerName, setBuyerName] = useState(existingSave?.profile?.name || '');
  const [selectedLoan, setSelectedLoan] = useState('conventional');
  const [selectedPaint, setSelectedPaint] = useState(TRUCK_PAINTS[0]);
  const [selectedCampaign, setSelectedCampaign] = useState('express');

  const handleStageSelect = (stageNum) => {
    setActiveStageTab(stageNum);
    if (!visitedStages.includes(stageNum)) {
      setVisitedStages([...visitedStages, stageNum]);
    }
  };

  const handleStart = (e) => {
    e.preventDefault();
    const loan = LOAN_VEHICLES.find((l) => l.id === selectedLoan);
    const campaign = CAMPAIGN_MODES.find((c) => c.id === selectedCampaign);
    onStartNewGame({
      name: buyerName.trim() || 'Captain Keys',
      loanType: loan.name,
      loanId: loan.id,
      vehicleType: loan.vehicleType,
      downPayment: loan.downPayment,
      startingCash: loan.startingCash,
      pmiPenalty: loan.pmiPenalty,
      truckColor: selectedPaint.hex,
      campaignMode: campaign.id,
      targetDistance: campaign.distance,
      campaignMiles: campaign.miles
    });
  };

  const currentStageObj = STAGE_GUIDES.find((s) => s.stageNum === activeStageTab);

  return (
    <div className="max-w-4xl mx-auto py-1">
      {existingSave && existingSave.stage !== 'onboarding' && (
        <div className="arcade-card bg-amber-200 rounded-2xl p-3.5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-xl border-2 border-zinc-900">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase bg-zinc-900 text-amber-300 px-2 py-0.5 rounded">
                Save Slot Active
              </span>
              <div className="text-sm font-bold text-zinc-900 mt-0.5">
                Driver: {existingSave.profile?.name} ({existingSave.profile?.loanType}) • Cash: ${existingSave.cashReserves.toLocaleString()}
              </div>
            </div>
          </div>
          <button
            onClick={onResumeGame}
            className="arcade-btn bg-emerald-400 hover:bg-emerald-300 text-zinc-900 font-black px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
          >
            <Gamepad2 size={18} /> RESUME DRIVE
          </button>
        </div>
      )}

      {/* SCREEN 1: SPLASH */}
      {screen === 'splash' && (
        <div className="arcade-card bg-gradient-to-b from-amber-100 via-orange-50 to-white rounded-3xl p-6 sm:p-8 text-center">
          <div className="inline-block -rotate-2 bg-rose-500 text-white font-display font-bold text-xs sm:text-sm px-4 py-1 rounded-full border-2 border-zinc-900 shadow-[2px_2px_0px_#18181B] mb-3">
            🏡 THE FIRST-TIME HOMEBUYER ROAD TRIP GAME!
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold text-zinc-900 tracking-tight mb-3">
            ESCROW <span className="text-rose-500 underline decoration-wavy decoration-amber-400">EXPRESS!</span>
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base font-medium text-zinc-700 mb-6">
            Buying a <strong>$300,000 house</strong> takes more than just a down payment. Learn the 9 key closing concepts, pick your mortgage vehicle, and steer through real-world financial forks to unlock your keys!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-left">
            <div className="p-4 rounded-2xl bg-sky-200 border-2 border-zinc-900 shadow-[3px_3px_0px_#18181B]">
              <div className="font-display font-bold text-base text-zinc-900 flex items-center gap-1.5 mb-1">
                <Flame size={18} className="text-rose-600" /> 1. Read the 9 Terms
              </div>
              <p className="text-xs sm:text-sm text-zinc-800">
                Organized into 3 simple stages so you know how every closing cost works.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-200 border-2 border-zinc-900 shadow-[3px_3px_0px_#18181B]">
              <div className="font-display font-bold text-base text-zinc-900 flex items-center gap-1.5 mb-1">
                <Truck size={18} className="text-indigo-600" /> 2. 3 Unique Vehicles
              </div>
              <p className="text-xs sm:text-sm text-zinc-800">
                Drive a 0%-Down Pickup, FHA Sprinter Van, or 20%-Down Rig that upgrades as your cash grows!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-200 border-2 border-zinc-900 shadow-[3px_3px_0px_#18181B]">
              <div className="font-display font-bold text-base text-zinc-900 flex items-center gap-1.5 mb-1">
                <Key size={18} className="text-emerald-700" /> 3. 5 or 10-Mile Modes
              </div>
              <p className="text-xs sm:text-sm text-zinc-800">
                Play the quick 5-Mile Express Run or the full 10-Mile 3-Stage Campaign!
              </p>
            </div>
          </div>

          <button
            onClick={() => setScreen('guide')}
            className="arcade-btn bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-lg sm:text-xl px-8 py-3.5 rounded-2xl inline-flex items-center gap-2"
          >
            OPEN HOMEBUYER FIELD GUIDE <ArrowRight size={20} />
          </button>
        </div>
      )}

      {/* SCREEN 2: CLEAN 3-COLUMN STAGE FIELD GUIDE */}
      {screen === 'guide' && (
        <div className="arcade-card bg-white rounded-3xl p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-3 border-zinc-900 pb-3.5 mb-5">
            <div>
              <span className="text-xs font-black uppercase bg-amber-300 border-2 border-zinc-900 px-2.5 py-0.5 rounded-full">
                Step 1 of 2 • Homebuyer Field Guide
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 mt-1">
                9 Essential Terms (3 Per Stage)
              </h2>
            </div>

            <div className="flex items-center gap-2 bg-emerald-300 border-2 border-zinc-900 px-3.5 py-1.5 rounded-xl">
              <Award size={18} className="text-zinc-900" />
              <span className="text-xs font-black text-zinc-900">
                STAGES VIEWED: {visitedStages.length} / 3
              </span>
            </div>
          </div>

          {/* 3 Stage Tabs */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {STAGE_GUIDES.map((st) => {
              const isActive = activeStageTab === st.stageNum;
              const isDone = visitedStages.includes(st.stageNum);
              return (
                <button
                  key={st.stageNum}
                  type="button"
                  onClick={() => handleStageSelect(st.stageNum)}
                  className={`arcade-btn p-3 rounded-xl text-left transition flex items-center justify-between ${
                    isActive ? `${st.accent}` : isDone ? 'bg-zinc-100' : 'bg-white'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-black uppercase text-zinc-700">STAGE {st.stageNum}</div>
                    <div className="font-display text-sm sm:text-base font-bold text-zinc-900 truncate">
                      {st.stageTitle.replace(`Stage ${st.stageNum}: `, '')}
                    </div>
                  </div>
                  <CheckCircle2 size={18} className={isDone ? 'text-zinc-900 shrink-0' : 'text-zinc-300 shrink-0'} />
                </button>
              );
            })}
          </div>

          {/* 3 Clean Side-by-Side Cards (Fits Without Scrolling!) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {currentStageObj.terms.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border-2 border-zinc-900 ${currentStageObj.color} shadow-[3px_3px_0px_#18181B] flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl bg-white border-2 border-zinc-900 w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                      {item.icon}
                    </span>
                    <h3 className="font-display text-base font-bold text-zinc-900 leading-snug">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-900 bg-white/95 border-2 border-zinc-900 rounded-xl p-3 mb-2.5 leading-relaxed">
                    {item.meaning}
                  </p>
                </div>
                <div className="text-xs font-bold text-zinc-900 bg-amber-200/90 border-2 border-zinc-900 rounded-xl p-2.5">
                  🎯 <strong>Game Tip:</strong> {item.highwayTip}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3">
            <button
              type="button"
              onClick={() => setScreen('splash')}
              className="arcade-btn bg-zinc-200 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5"
            >
              <ArrowLeft size={16} /> Back
            </button>

            <div className="flex gap-2.5">
              {activeStageTab < 3 && (
                <button
                  type="button"
                  onClick={() => handleStageSelect(activeStageTab + 1)}
                  className="arcade-btn bg-amber-300 hover:bg-amber-200 text-zinc-900 font-display font-bold text-sm sm:text-base px-5 py-2.5 rounded-xl flex items-center gap-1.5"
                >
                  Next: Stage {activeStageTab + 1} <ArrowRight size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setScreen('garage')}
                className="arcade-btn bg-emerald-400 hover:bg-emerald-300 text-zinc-900 font-display font-bold text-sm sm:text-base px-6 py-2.5 rounded-xl flex items-center gap-1.5"
              >
                GO TO VEHICLE GARAGE <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 3: GARAGE WITH 3 VEHICLE SILHOUETTES & 5/10 MILE MODE */}
      {screen === 'garage' && (
        <form onSubmit={handleStart} className="arcade-card bg-white rounded-3xl p-5 sm:p-7">
          <div className="flex items-center justify-between border-b-3 border-zinc-900 pb-3 mb-4">
            <div>
              <span className="text-xs font-black uppercase bg-sky-300 border-2 border-zinc-900 px-2.5 py-0.5 rounded-full">
                Step 2 of 2 • Garage & Campaign Setup
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 mt-1">
                Pick Your Distance, Vehicle & Paint
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setScreen('guide')}
              className="arcade-btn bg-amber-200 px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1"
            >
              <BookOpen size={15} /> Terms Guide
            </button>
          </div>

          {/* 1. Campaign Length (5 Miles vs 10 Miles) */}
          <div className="mb-4">
            <label className="block text-xs font-black uppercase text-zinc-900 mb-2 flex items-center gap-1.5">
              <Map size={15} className="text-rose-500" /> 1. Choose Highway Distance
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CAMPAIGN_MODES.map((mode) => {
                const active = selectedCampaign === mode.id;
                return (
                  <div
                    key={mode.id}
                    onClick={() => setSelectedCampaign(mode.id)}
                    className={`cursor-pointer arcade-btn p-3.5 rounded-xl ${
                      active ? 'bg-amber-200' : 'bg-zinc-50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-base text-zinc-900">{mode.title}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded border border-zinc-900 ${
                        active ? 'bg-emerald-400 text-zinc-900' : 'bg-white text-zinc-500'
                      }`}>
                        {active ? '✓ SELECTED' : 'SELECT'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-rose-600 mt-0.5">{mode.subtitle}</div>
                    <p className="text-xs text-zinc-700 mt-1">{mode.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Choose from 3 Distinct Mortgage Vehicles */}
          <div className="mb-4">
            <label className="block text-xs font-black uppercase text-zinc-900 mb-2 flex items-center gap-1.5">
              <Shield size={15} className="text-indigo-600" /> 2. Choose Your Mortgage Vehicle (Each Has a Unique 3D Body!)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LOAN_VEHICLES.map((loan) => {
                const active = selectedLoan === loan.id;
                return (
                  <div
                    key={loan.id}
                    onClick={() => setSelectedLoan(loan.id)}
                    className={`cursor-pointer arcade-btn p-3.5 rounded-xl flex flex-col justify-between ${
                      active ? 'bg-sky-200' : 'bg-zinc-50 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display font-bold text-sm sm:text-base text-zinc-900">{loan.name}</span>
                      </div>
                      <div className="text-xs font-black text-indigo-700 mb-1">{loan.tag}</div>
                      <p className="text-xs text-zinc-700 mb-2">{loan.desc}</p>
                    </div>
                    <div className="text-[11px] font-bold bg-white/80 border border-zinc-900 rounded-lg px-2 py-1 text-zinc-800">
                      🚗 {loan.visualNote}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Driver Name & Paint */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-black uppercase text-zinc-900 mb-1.5">
                3. Driver Name (Auto-Saves Progress)
              </label>
              <input
                type="text"
                required
                placeholder="Type your name (e.g., Samiksha)..."
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full bg-amber-50 border-2 border-zinc-900 rounded-xl px-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:bg-white outline-none shadow-[2px_2px_0px_#18181B]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-zinc-900 mb-1.5 flex items-center gap-1.5">
                <Paintbrush size={14} /> 4. Vehicle Paint Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TRUCK_PAINTS.map((paint) => (
                  <button
                    key={paint.name}
                    type="button"
                    onClick={() => setSelectedPaint(paint)}
                    className={`arcade-btn p-2 rounded-xl flex flex-col items-center gap-1 text-xs font-bold ${
                      selectedPaint.name === paint.name ? 'bg-amber-200' : 'bg-white'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border-2 border-zinc-900 ${paint.bg}`} />
                    <span className="text-[11px] truncate">{paint.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full arcade-btn bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-xl py-3.5 rounded-2xl flex items-center justify-center gap-2"
          >
            LAUNCH {selectedCampaign === 'express' ? '5-MILE EXPRESS' : '10-MILE CAMPAIGN'}! <ArrowRight size={22} />
          </button>
        </form>
      )}
    </div>
  );
}
