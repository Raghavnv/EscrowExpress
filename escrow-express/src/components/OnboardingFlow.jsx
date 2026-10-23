import React, { useState } from 'react';
import {
  Truck, Sparkles, Award, ArrowRight, ArrowLeft,
  Key, Paintbrush, Shield, Flame, Gamepad2, Map, CheckCircle2, BookOpen
} from 'lucide-react';

export const STAGE_GUIDES = [
  {
    stageNum: 1,
    stageTitle: 'Stage 1: Pre-Approval & Making an Offer',
    color: 'bg-amber-200',
    accent: 'bg-amber-400',
    terms: [
      {
        title: '1. Pre-Approval vs. Pre-Qualification',
        icon: '📝',
        meaning: 'A "Pre-Qualification" is just a quick, unverified estimate of what you might afford. A "Lender Pre-Approval Letter" means a bank officially verified your tax returns, pay stubs, and credit score.',
        highwayTip: 'Sellers take verified Pre-Approval Letters seriously because they prove your financing won’t fall through.'
      },
      {
        title: '2. Debt-to-Income (DTI) Ratio',
        icon: '📉',
        meaning: 'The percentage of your monthly income that goes toward debt payments (credit cards, car loans, student loans + your new mortgage). Lenders want your DTI below 36%–43%.',
        highwayTip: 'Pay down credit card balances and NEVER finance a new car or furniture while buying a house—it spikes your DTI!'
      },
      {
        title: '3. Earnest Money Deposit',
        icon: '🏦',
        meaning: 'A "good faith" deposit (usually 1%–2% of the home price) that you put down when your offer is accepted to prove to the seller you are serious.',
        highwayTip: 'Never send Earnest Money directly to the seller! Always deposit it into a neutral third-party Escrow account.'
      }
    ]
  },
  {
    stageNum: 2,
    stageTitle: 'Stage 2: Home Inspection & Appraisal',
    color: 'bg-sky-200',
    accent: 'bg-sky-400',
    terms: [
      {
        title: '4. Inspection Contingency & Seller Credits',
        icon: '🛠️',
        meaning: 'A licensed inspector checks the roof, plumbing, and furnace for hidden damage. If defects are found, you can ask the seller for a "Seller Credit" to cover the repair costs at closing.',
        highwayTip: 'Never waive your inspection! Requesting a Seller Credit fixes the problem without draining your own cash reserves.'
      },
      {
        title: '5. Loan Estimate & Lender "Junk Fees"',
        icon: '🔍',
        meaning: 'Lenders must give you a 3-page "Loan Estimate" listing all closing costs. Some lenders sneak in padded "Junk Fees" (like Express Courier or Duplicate Admin Fees).',
        highwayTip: 'Always audit your Loan Estimate line-by-line rather than signing it as-is or paying bogus courier add-ons.'
      },
      {
        title: '6. Home Appraisal & "Comps" Appeal',
        icon: '📊',
        meaning: 'An independent appraiser checks if the house is worth your offer price. If it appraises $5,000 low (an "Appraisal Gap"), the bank won’t lend the extra $5,000.',
        highwayTip: 'Instead of paying the gap in cash, submit "Comps" (recent comparable neighborhood sales) to appeal the valuation!'
      }
    ]
  },
  {
    stageNum: 3,
    stageTitle: 'Stage 3: Rate Locks, Escrow & Closing Day',
    color: 'bg-emerald-200',
    accent: 'bg-emerald-400',
    terms: [
      {
        title: '7. 30-Day Interest Rate Lock',
        icon: '🔒',
        meaning: 'Mortgage interest rates change daily. A "Rate Lock" freezes your interest rate for 30 to 45 days while the bank’s underwriters review your loan file.',
        highwayTip: 'Lock your interest rate instead of "floating" it—if market rates spike while you float, your costs jump!'
      },
      {
        title: '8. Escrow Reserve & Tax Proration',
        icon: '⚖️',
        meaning: 'Lenders require you to prepay 6 months of property taxes and 12 months of homeowners insurance into a locked "Escrow Account." You also get a credit for the months the seller lived there ("Tax Proration").',
        highwayTip: 'Never skip homeowners insurance! Fund your Escrow account and claim your Seller Tax Proration credit.'
      },
      {
        title: '9. Title Insurance & Wire Fraud Safety',
        icon: '📞',
        meaning: 'Title Insurance protects your legal ownership. On closing day, you must send your Cash-to-Close via Certified Cashier’s Check or verified bank wire.',
        highwayTip: 'Scammers send fake last-minute emails changing wire instructions. Always call the Title Office directly to verify!'
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

const LOAN_ENGINES = [
  {
    id: 'conventional',
    name: 'Conventional 20% Down Rig',
    downPayment: 60000,
    startingCash: 12000,
    pmiPenalty: 0,
    tag: '$60k Down • $12,000 Cash Fuel',
    desc: 'Higher down payment leaves a $12,000 cash fuel tank, with $0 upfront mortgage insurance.'
  },
  {
    id: 'fha',
    name: 'FHA 3.5% Down Cruiser',
    downPayment: 10500,
    startingCash: 13500,
    pmiPenalty: 1200,
    tag: '$10.5k Down • $13,500 Cash Fuel',
    desc: 'Starts with $13,500 cash fuel, minus a mandatory $1,200 Upfront Mortgage Insurance (UFMIP) fee.'
  }
];

const CAMPAIGN_MODES = [
  {
    id: 'express',
    miles: 5,
    distance: 5000,
    title: '⚡ 5.0-Mile Express Drive',
    subtitle: '6 Core Checkpoints (~90 Seconds)',
    desc: 'Jumps straight into Inspection, Loan Estimate, Rate Lock, Appraisal, Escrow, and Closing Wire.'
  },
  {
    id: 'full',
    miles: 10,
    distance: 10000,
    title: '🏆 10.0-Mile Full Campaign',
    subtitle: 'All 9 Checkpoints Across 3 Stages (~3 Mins)',
    desc: 'The complete journey: starts with Pre-Approval, DTI Ratio, and Earnest Money through Closing Day!'
  }
];

export default function OnboardingFlow({ existingSave, onStartNewGame, onResumeGame }) {
  const [screen, setScreen] = useState('splash'); // 'splash' | 'guide' | 'garage'
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
    const loan = LOAN_ENGINES.find((l) => l.id === selectedLoan);
    const campaign = CAMPAIGN_MODES.find((c) => c.id === selectedCampaign);
    onStartNewGame({
      name: buyerName.trim() || 'Captain Keys',
      loanType: loan.name,
      loanId: loan.id,
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
    <div className="max-w-4xl mx-auto py-2">
      {/* Saved Game Cartridge Banner */}
      {existingSave && existingSave.stage !== 'onboarding' && (
        <div className="arcade-card bg-amber-200 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-rose-500 text-white rounded-xl border-2 border-zinc-900">
              <Sparkles size={24} />
            </div>
            <div>
              <span className="text-xs font-black uppercase bg-zinc-900 text-amber-300 px-2.5 py-0.5 rounded">
                Save Slot Active
              </span>
              <div className="text-lg font-bold text-zinc-900 mt-1">
                Driver: {existingSave.profile?.name} • Cash Tank: ${existingSave.cashReserves.toLocaleString()}
              </div>
            </div>
          </div>
          <button
            onClick={onResumeGame}
            className="arcade-btn bg-emerald-400 hover:bg-emerald-300 text-zinc-900 font-black px-6 py-3.5 rounded-xl text-base flex items-center gap-2"
          >
            <Gamepad2 size={20} /> RESUME ROAD TRIP
          </button>
        </div>
      )}

      {/* SCREEN 1: FESTIVE ARCADE SPLASH SCREEN */}
      {screen === 'splash' && (
        <div className="arcade-card bg-gradient-to-b from-amber-100 via-orange-50 to-white rounded-3xl p-7 sm:p-11 text-center">
          <div className="inline-block -rotate-2 bg-rose-500 text-white font-display font-bold text-sm sm:text-base px-5 py-1.5 rounded-full border-2 border-zinc-900 shadow-[3px_3px_0px_#18181B] mb-5">
            🏡 THE FIRST-TIME HOMEBUYER ROAD TRIP GAME!
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold text-zinc-900 tracking-tight leading-none mb-5">
            ESCROW <span className="text-rose-500 underline decoration-wavy decoration-amber-400">EXPRESS!</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg font-medium text-zinc-800 leading-relaxed mb-8">
            You saved up your Down Payment for a <strong>$300,000 house</strong>—but can you survive the highway of <strong>Pre-Approval, Inspections, Appraisals, Rate Locks, and Closing Costs</strong> without running out of cash before reaching the Title Office?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-9 text-left">
            <div className="p-5 rounded-2xl bg-sky-200 border-3 border-zinc-900 shadow-[4px_4px_0px_#18181B]">
              <div className="font-display font-bold text-lg text-zinc-900 flex items-center gap-2 mb-1.5">
                <Flame size={20} className="text-rose-600" /> 1. Read the Guide
              </div>
              <p className="text-sm text-zinc-800 font-medium leading-relaxed">
                Learn the 9 key homebuying terms in plain English before you start your engine.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-200 border-3 border-zinc-900 shadow-[4px_4px_0px_#18181B]">
              <div className="font-display font-bold text-lg text-zinc-900 flex items-center gap-2 mb-1.5">
                <Truck size={20} className="text-indigo-600" /> 2. Pick 5 or 10 Miles
              </div>
              <p className="text-sm text-zinc-800 font-medium leading-relaxed">
                Choose the <strong>5-Mile Express Run</strong> or the <strong>10-Mile Full Campaign</strong> and steer into smart lanes!
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-200 border-3 border-zinc-900 shadow-[4px_4px_0px_#18181B]">
              <div className="font-display font-bold text-lg text-zinc-900 flex items-center gap-2 mb-1.5">
                <Key size={20} className="text-emerald-700" /> 3. Audit & Close
              </div>
              <p className="text-sm text-zinc-800 font-medium leading-relaxed">
                Cross out bogus Junk Fees at the Closing Table to unlock your house keys with Grade A!
              </p>
            </div>
          </div>

          <button
            onClick={() => setScreen('guide')}
            className="arcade-btn bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-xl sm:text-2xl px-10 py-4 rounded-2xl inline-flex items-center gap-3"
          >
            OPEN HOMEBUYER FIELD GUIDE <ArrowRight size={24} />
          </button>
        </div>
      )}

      {/* SCREEN 2: SPACIOUS, CLEAN 3-STAGE HOMEBUYER FIELD GUIDE */}
      {screen === 'guide' && (
        <div className="arcade-card bg-white rounded-3xl p-6 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-zinc-900 pb-5 mb-6">
            <div>
              <span className="text-xs font-black uppercase bg-amber-300 border-2 border-zinc-900 px-3 py-1 rounded-full">
                Step 1 of 2 • Homebuyer Field Guide (9 Key Concepts)
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-zinc-900 mt-2">
                Master the Terms Before You Drive
              </h2>
            </div>

            <div className="flex items-center gap-2 bg-emerald-300 border-3 border-zinc-900 px-4 py-2.5 rounded-2xl shadow-[3px_3px_0px_#18181B]">
              <Award size={22} className="text-zinc-900" />
              <div className="text-sm font-black text-zinc-900">
                STAGES REVIEWED: {visitedStages.length} / 3
              </div>
            </div>
          </div>

          {/* 3 Big Stage Filter Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-7">
            {STAGE_GUIDES.map((st) => {
              const isActive = activeStageTab === st.stageNum;
              const isDone = visitedStages.includes(st.stageNum);
              return (
                <button
                  key={st.stageNum}
                  type="button"
                  onClick={() => handleStageSelect(st.stageNum)}
                  className={`arcade-btn p-4 rounded-2xl text-left transition flex items-center justify-between ${
                    isActive ? `${st.accent} -translate-y-1` : isDone ? 'bg-zinc-100' : 'bg-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black uppercase text-zinc-700">
                      STAGE {st.stageNum} (3 TERMS)
                    </div>
                    <div className="font-display text-base sm:text-lg font-bold text-zinc-900 leading-snug mt-0.5">
                      {st.stageTitle.replace(`Stage ${st.stageNum}: `, '')}
                    </div>
                  </div>
                  <CheckCircle2 size={22} className={isDone ? 'text-zinc-900 shrink-0' : 'text-zinc-300 shrink-0'} />
                </button>
              );
            })}
          </div>

          {/* 3 Spacious, Easy-to-Read Concept Cards for the Selected Stage */}
          <div className="space-y-5 mb-8">
            {currentStageObj.terms.map((item, idx) => (
              <div
                key={idx}
                className={`p-5 sm:p-6 rounded-3xl border-3 border-zinc-900 ${currentStageObj.color} shadow-[4px_4px_0px_#18181B]`}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-2xl bg-white border-2 border-zinc-900 w-11 h-11 rounded-2xl flex items-center justify-center shadow-[2px_2px_0px_#18181B]">
                    {item.icon}
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-zinc-900">
                    {item.title}
                  </h3>
                </div>

                <p className="text-base font-medium text-zinc-900 bg-white/95 border-2 border-zinc-900 rounded-2xl p-4 mb-3 leading-relaxed">
                  <strong>What it means:</strong> {item.meaning}
                </p>

                <div className="text-sm sm:text-base font-bold text-zinc-900 bg-amber-100 border-2 border-zinc-900 rounded-xl px-4 py-3">
                  🎯 <strong>How it helps you in the game:</strong> {item.highwayTip}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setScreen('splash')}
              className="arcade-btn bg-zinc-200 px-5 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2"
            >
              <ArrowLeft size={18} /> Back to Title
            </button>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {activeStageTab < 3 && (
                <button
                  type="button"
                  onClick={() => handleStageSelect(activeStageTab + 1)}
                  className="arcade-btn bg-amber-300 hover:bg-amber-200 text-zinc-900 font-display font-bold text-lg px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2"
                >
                  Next: Stage {activeStageTab + 1} Terms <ArrowRight size={20} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setScreen('garage')}
                className="arcade-btn bg-emerald-400 hover:bg-emerald-300 text-zinc-900 font-display font-bold text-lg px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2"
              >
                CONTINUE TO TRUCK GARAGE <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 3: THE TRUCK GARAGE & CAMPAIGN LENGTH SELECTOR */}
      {screen === 'garage' && (
        <form onSubmit={handleStart} className="arcade-card bg-white rounded-3xl p-6 sm:p-9">
          <div className="flex items-center justify-between border-b-4 border-zinc-900 pb-4 mb-6">
            <div>
              <span className="text-xs font-black uppercase bg-sky-300 border-2 border-zinc-900 px-3 py-1 rounded-full">
                Step 2 of 2 • Garage & Campaign Setup
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-zinc-900 mt-1.5">
                Choose Your Route, Rig & Loan
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setScreen('guide')}
              className="arcade-btn bg-amber-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5"
            >
              <BookOpen size={16} /> Review Terms
            </button>
          </div>

          {/* 1. Choose Campaign Distance (5 Miles vs 10 Miles) */}
          <div className="mb-7">
            <label className="block text-sm font-black uppercase text-zinc-900 mb-2.5 flex items-center gap-2">
              <Map size={18} className="text-rose-500" /> 1. Choose Your Highway Distance
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CAMPAIGN_MODES.map((mode) => {
                const active = selectedCampaign === mode.id;
                return (
                  <div
                    key={mode.id}
                    onClick={() => setSelectedCampaign(mode.id)}
                    className={`cursor-pointer arcade-btn p-5 rounded-2xl ${
                      active ? 'bg-amber-200' : 'bg-zinc-50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-bold text-xl text-zinc-900">{mode.title}</span>
                      <span className={`px-2.5 py-0.5 text-xs font-black rounded border-2 border-zinc-900 ${
                        active ? 'bg-emerald-400 text-zinc-900' : 'bg-white text-zinc-500'
                      }`}>
                        {active ? '✓ SELECTED' : 'SELECT'}
                      </span>
                    </div>
                    <div className="text-sm font-black text-rose-600 mb-1.5">{mode.subtitle}</div>
                    <p className="text-sm text-zinc-800 font-medium leading-relaxed">{mode.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Driver Name & Truck Paint */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7">
            <div>
              <label className="block text-sm font-black uppercase text-zinc-900 mb-2">
                2. Driver Name (Saves Progress Automatically)
              </label>
              <input
                type="text"
                required
                placeholder="Type your name (e.g., Samiksha)..."
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full bg-amber-50 border-3 border-zinc-900 rounded-xl px-4 py-3.5 text-base font-bold text-zinc-900 focus:bg-white outline-none shadow-[3px_3px_0px_#18181B]"
              />
            </div>

            <div>
              <label className="block text-sm font-black uppercase text-zinc-900 mb-2 flex items-center gap-1.5">
                <Paintbrush size={16} /> 3. Pick Moving Truck Paint
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TRUCK_PAINTS.map((paint) => (
                  <button
                    key={paint.name}
                    type="button"
                    onClick={() => setSelectedPaint(paint)}
                    className={`arcade-btn p-3 rounded-xl flex items-center gap-2.5 text-sm font-bold ${
                      selectedPaint.name === paint.name ? 'bg-amber-200 ring-2 ring-zinc-900' : 'bg-white'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border-2 border-zinc-900 ${paint.bg}`} />
                    <span>{paint.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Choose Loan Type */}
          <div className="mb-8">
            <label className="block text-sm font-black uppercase text-zinc-900 mb-2.5 flex items-center gap-1.5">
              <Shield size={16} /> 4. Select Your Mortgage Engine ($300,000 Home)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LOAN_ENGINES.map((loan) => {
                const active = selectedLoan === loan.id;
                return (
                  <div
                    key={loan.id}
                    onClick={() => setSelectedLoan(loan.id)}
                    className={`cursor-pointer arcade-btn p-5 rounded-2xl ${
                      active ? 'bg-sky-200' : 'bg-zinc-50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-bold text-lg text-zinc-900">{loan.name}</span>
                      <span className={`px-2.5 py-0.5 text-xs font-black rounded border-2 border-zinc-900 ${
                        active ? 'bg-emerald-400 text-zinc-900' : 'bg-white text-zinc-500'
                      }`}>
                        {active ? '✓ SELECTED' : 'SELECT'}
                      </span>
                    </div>
                    <div className="text-sm font-black text-indigo-700 mb-1.5">{loan.tag}</div>
                    <p className="text-sm text-zinc-800 font-medium leading-relaxed">{loan.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full arcade-btn bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-2xl py-4 rounded-2xl flex items-center justify-center gap-3"
          >
            START {selectedCampaign === 'express' ? '5-MILE EXPRESS' : '10-MILE CAMPAIGN'}! <ArrowRight size={24} />
          </button>
        </form>
      )}
    </div>
  );
}
