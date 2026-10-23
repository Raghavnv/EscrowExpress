import React, { useState } from 'react';
import {
  Truck, Sparkles, Award, Check, ArrowRight, ArrowLeft,
  Key, HelpCircle, Paintbrush, Shield, Flame, Gamepad2
} from 'lucide-react';

const CONCEPT_DECK = [
  {
    id: 'closing',
    badge: 'CARD #1',
    color: 'bg-amber-300',
    term: 'Down Payment vs. Closing Costs',
    shortHook: 'Why saving $30,000 isn’t enough to get the keys!',
    plainEnglish: 'Your Down Payment goes toward the house price. "Closing Costs" are an EXTRA 2%–5% ($8,000–$12,000) in lender, legal, and tax fees due in cash on signing day.',
    gameTip: 'Your Down Payment is locked in the cargo box. Your extra Cash-to-Close is your liquid fuel tank!'
  },
  {
    id: 'inspection',
    badge: 'CARD #2',
    color: 'bg-emerald-300',
    term: 'Inspection & Seller Credits',
    plainEnglish: 'An inspector checks the house for broken roofs, pipes, or furnaces. If defects turn up, you can pay for repairs yourself, waive/ignore them, or ask for a "Seller Credit" (where the seller pays part of your closing costs).',
    shortHook: 'Who pays when the inspector finds a broken furnace?',
    gameTip: 'Watch out: Waiving an inspection costs $0 today, but hidden defects can explode right before move-in!'
  },
  {
    id: 'ratelock',
    badge: 'CARD #3',
    color: 'bg-rose-300',
    term: 'Underwriting & Rate Locks',
    shortHook: 'What happens when bank paperwork gets stuck in traffic?',
    plainEnglish: 'Underwriting is when the bank verifies your paperwork. Your "Rate Lock" freezes your interest rate for 30 days. If underwriting gets delayed, the bank charges daily "Rate Lock Extension Fees" to keep your rate from rising.',
    gameTip: 'When you hit bumper-to-bumper traffic, BRAKE and press [SPACEBAR] to cut your engine so you don’t burn extension fees!'
  },
  {
    id: 'appraisal',
    badge: 'CARD #4',
    color: 'bg-sky-300',
    term: 'Appraisal & Comps Appeal',
    shortHook: 'What if the bank says the house is worth less than your offer?',
    plainEnglish: 'An appraiser checks if the home is worth the contract price. If your offer is $300k but it appraises at $295k, that $5k shortage is an "Appraisal Gap." You can pay the gap in cash or appeal using neighborhood "Comps" (comparable sales).',
    gameTip: 'Look for highway lanes that let you challenge low appraisals with Comps instead of draining your cash!'
  },
  {
    id: 'escrow',
    badge: 'CARD #5',
    color: 'bg-purple-300',
    term: 'The Escrow Reserve Account',
    shortHook: 'Why does the lender make you prepay taxes and insurance?',
    plainEnglish: 'An Escrow Account is a locked reserve bucket held by the lender. To make sure you never miss property tax or fire insurance bills, lenders force you to prepay 6–12 months upfront on closing day.',
    gameTip: 'At Mile 3.8, you must drive through the Escrow Weigh Station with $4,200 to fill your Escrow Trailer!'
  },
  {
    id: 'junkfees',
    badge: 'CARD #6',
    color: 'bg-orange-300',
    term: 'Loan Estimate & "Junk Fees"',
    shortHook: 'Spotting sneaky administrative charges on your form.',
    plainEnglish: 'Your "Loan Estimate" lists every fee. Legitimate fees (like Title Insurance) protect you, while padded "Junk Fees" (like Expedited Courier Add-ons) can be challenged and removed if you audit your form.',
    gameTip: 'Read the blue highway signs carefully—no colors or dollar signs will spoil the answer!'
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
    startingCash: 11500,
    pmiPenalty: 0,
    tag: '$60k Down • $11,500 Cash Fuel',
    desc: 'Bigger down payment leaves a tighter $11,500 cash fuel tank, but $0 upfront mortgage insurance.'
  },
  {
    id: 'fha',
    name: 'FHA 3.5% Down Cruiser',
    downPayment: 10500,
    startingCash: 13000,
    pmiPenalty: 1200,
    tag: '$10.5k Down • $13,000 Cash Fuel',
    desc: 'Starts with $13,000 cash fuel, but deducts a mandatory $1,200 Upfront Mortgage Insurance (UFMIP) fee.'
  }
];

export default function OnboardingFlow({ existingSave, onStartNewGame, onResumeGame }) {
  const [screen, setScreen] = useState('splash'); // 'splash' | 'cards' | 'garage'
  const [readCards, setReadCards] = useState(['closing']);
  const [activeCard, setActiveCard] = useState(CONCEPT_DECK[0]);
  const [buyerName, setBuyerName] = useState(existingSave?.profile?.name || '');
  const [selectedLoan, setSelectedLoan] = useState('conventional');
  const [selectedPaint, setSelectedPaint] = useState(TRUCK_PAINTS[0]);

  const handleSelectCard = (card) => {
    setActiveCard(card);
    if (!readCards.includes(card.id)) {
      setReadCards([...readCards, card.id]);
    }
  };

  const handleStart = (e) => {
    e.preventDefault();
    const loan = LOAN_ENGINES.find((l) => l.id === selectedLoan);
    onStartNewGame({
      name: buyerName.trim() || 'Captain Keys',
      loanType: loan.name,
      loanId: loan.id,
      downPayment: loan.downPayment,
      startingCash: loan.startingCash,
      pmiPenalty: loan.pmiPenalty,
      truckColor: selectedPaint.hex
    });
  };

  const xpEarned = readCards.length * 100;

  return (
    <div className="max-w-4xl mx-auto py-2">
      {/* Saved Game Cartridge Banner */}
      {existingSave && existingSave.stage !== 'onboarding' && (
        <div className="arcade-card bg-amber-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500 text-white rounded-xl border-2 border-zinc-900">
              <Sparkles size={22} />
            </div>
            <div>
              <span className="text-xs font-black uppercase bg-zinc-900 text-amber-300 px-2 py-0.5 rounded">
                Save Slot Active
              </span>
              <div className="text-base font-bold text-zinc-900 mt-0.5">
                Driver: {existingSave.profile?.name} • Cash Tank: ${existingSave.cashReserves.toLocaleString()}
              </div>
            </div>
          </div>
          <button
            onClick={onResumeGame}
            className="arcade-btn bg-emerald-400 hover:bg-emerald-300 text-zinc-900 font-black px-6 py-3 rounded-xl text-sm flex items-center gap-2"
          >
            <Gamepad2 size={18} /> RESUME ROAD TRIP
          </button>
        </div>
      )}

      {/* SCREEN 1: FESTIVE ARCADE SPLASH SCREEN */}
      {screen === 'splash' && (
        <div className="arcade-card bg-gradient-to-b from-amber-100 via-orange-50 to-white rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden">
          {/* Decorative Floating Stickers */}
          <div className="inline-block -rotate-3 bg-rose-500 text-white font-display font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full border-2 border-zinc-900 shadow-[3px_3px_0px_#18181B] mb-4">
            🏡 THE FIRST-TIME HOMEBUYER ROAD TRIP GAME!
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold text-zinc-900 tracking-tight leading-none mb-4">
            ESCROW <span className="text-rose-500 underline decoration-wavy decoration-amber-400">EXPRESS!</span>
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base font-medium text-zinc-700 leading-relaxed mb-8">
            You saved up your Down Payment for a <strong>$300,000 house</strong>—but can you survive the 5-mile highway of <strong>Inspections, Appraisals, Rate Locks, and Closing Costs</strong> without going broke before reaching the Title Office?
          </p>

          {/* 3 Festive Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
            <div className="p-4 rounded-2xl bg-sky-200 border-3 border-zinc-900 shadow-[4px_4px_0px_#18181B] -rotate-1">
              <div className="font-display font-bold text-base text-zinc-900 flex items-center gap-1.5 mb-1">
                <Flame size={18} className="text-rose-600" /> 1. Learn the Lingo
              </div>
              <p className="text-xs text-zinc-800 font-medium">
                Unlock 6 plain-English collector cards so you know what every mortgage term means.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-200 border-3 border-zinc-900 shadow-[4px_4px_0px_#18181B] rotate-1">
              <div className="font-display font-bold text-base text-zinc-900 flex items-center gap-1.5 mb-1">
                <Truck size={18} className="text-indigo-600" /> 2. Drive in 3D FOV
              </div>
              <p className="text-xs text-zinc-800 font-medium">
                Steer your moving truck across 3 lanes! No color spoilers—read the signs and pick the smart financial lane.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-200 border-3 border-zinc-900 shadow-[4px_4px_0px_#18181B] -rotate-1">
              <div className="font-display font-bold text-base text-zinc-900 flex items-center gap-1.5 mb-1">
                <Key size={18} className="text-emerald-700" /> 3. Unlock the Keys
              </div>
              <p className="text-xs text-zinc-800 font-medium">
                Fill your Escrow Trailer and cross the finish line with emergency savings intact!
              </p>
            </div>
          </div>

          <button
            onClick={() => setScreen('cards')}
            className="arcade-btn bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-xl px-10 py-4 rounded-2xl inline-flex items-center gap-3"
          >
            START PRE-TRIP TRAINING <ArrowRight size={22} />
          </button>
        </div>
      )}

      {/* SCREEN 2: INTERACTIVE COLLECTOR CARD FIELD GUIDE */}
      {screen === 'cards' && (
        <div className="arcade-card bg-white rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-zinc-900 pb-4 mb-6">
            <div>
              <span className="text-xs font-black uppercase bg-amber-300 border-2 border-zinc-900 px-2.5 py-0.5 rounded-full">
                Step 1 of 2 • Homebuyer Field Manual
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-1">
                Tap All 6 Cards to Earn Your Driver’s Permit!
              </h2>
            </div>

            {/* Live XP Meter */}
            <div className="flex items-center gap-2 bg-emerald-300 border-3 border-zinc-900 px-4 py-2 rounded-2xl shadow-[3px_3px_0px_#18181B]">
              <Award size={20} className="text-zinc-900" />
              <div className="text-xs font-black text-zinc-900">
                KNOWLEDGE XP: {xpEarned} / 600
              </div>
            </div>
          </div>

          {/* 6 Interactive Collector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {CONCEPT_DECK.map((card) => {
              const isSelected = activeCard.id === card.id;
              const isRead = readCards.includes(card.id);
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleSelectCard(card)}
                  className={`arcade-btn p-3 rounded-2xl text-left transition relative ${
                    isSelected ? `${card.color} -translate-y-1` : isRead ? 'bg-zinc-100' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-black uppercase mb-1">
                    <span className="bg-zinc-900 text-white px-2 py-0.5 rounded">{card.badge}</span>
                    {isRead && (
                      <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Check size={10} /> +100 XP
                      </span>
                    )}
                  </div>
                  <div className="font-display font-bold text-sm text-zinc-900 leading-snug">
                    {card.term}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Card Spotlight View */}
          <div className={`p-6 rounded-3xl border-4 border-zinc-900 ${activeCard.color} shadow-[5px_5px_0px_#18181B] mb-6`}>
            <div className="flex items-center gap-2 text-xs font-black uppercase text-zinc-900 mb-1">
              <HelpCircle size={16} /> {activeCard.shortHook}
            </div>
            <h3 className="font-display text-2xl font-bold text-zinc-900 mb-3">
              {activeCard.term}
            </h3>
            <p className="text-sm sm:text-base font-medium text-zinc-900 bg-white/90 border-2 border-zinc-900 rounded-2xl p-4 mb-3 leading-relaxed">
              <strong>In Plain English:</strong> {activeCard.plainEnglish}
            </p>
            <div className="text-xs sm:text-sm font-bold text-zinc-900 bg-amber-100 border-2 border-zinc-900 rounded-xl p-3">
              🎯 <strong>How It Works on the Highway:</strong> {activeCard.gameTip}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              type="button"
              onClick={() => setScreen('splash')}
              className="arcade-btn bg-zinc-200 px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft size={15} /> Back to Title
            </button>

            <button
              type="button"
              onClick={() => setScreen('garage')}
              className="w-full sm:w-auto arcade-btn bg-emerald-400 hover:bg-emerald-300 text-zinc-900 font-display font-bold text-lg px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2"
            >
              ENTER THE TRUCK GARAGE ({readCards.length}/6 Read) <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: THE TRUCK GARAGE & BUYER REGISTRATION */}
      {screen === 'garage' && (
        <form onSubmit={handleStart} className="arcade-card bg-white rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between border-b-4 border-zinc-900 pb-4 mb-6">
            <div>
              <span className="text-xs font-black uppercase bg-sky-300 border-2 border-zinc-900 px-2.5 py-0.5 rounded-full">
                Step 2 of 2 • Player Registration & Garage
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-1">
                Customize Your Rig & Sign Driver’s Permit
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setScreen('cards')}
              className="arcade-btn bg-amber-200 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Field Guide
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Driver Name & Paint Color */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase text-zinc-900 mb-2">
                  1. Driver Name (Auto-Saves Your Progress)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Type your name (e.g., Samiksha)..."
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-amber-50 border-3 border-zinc-900 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:bg-white outline-none shadow-[3px_3px_0px_#18181B]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-zinc-900 mb-2 flex items-center gap-1.5">
                  <Paintbrush size={15} /> 2. Pick Your Moving Truck Paint
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {TRUCK_PAINTS.map((paint) => (
                    <button
                      key={paint.name}
                      type="button"
                      onClick={() => setSelectedPaint(paint)}
                      className={`arcade-btn p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold ${
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

            {/* Controls Sticker Box */}
            <div className="bg-sky-100 border-3 border-zinc-900 rounded-2xl p-5 shadow-[4px_4px_0px_#18181B] flex flex-col justify-between">
              <div>
                <div className="font-display font-bold text-lg text-zinc-900 mb-2">
                  🕹️ Dashboard Controls Cheat-Sheet
                </div>
                <ul className="space-y-2 text-xs font-medium text-zinc-800">
                  <li className="flex items-center gap-2">
                    <span className="bg-emerald-400 border-2 border-zinc-900 font-black px-2 py-0.5 rounded">W / ▲</span>
                    <span>Hold to Accelerate down the highway</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-rose-400 text-white border-2 border-zinc-900 font-black px-2 py-0.5 rounded">S / ▼</span>
                    <span>Hold to Brake before Underwriting Traffic</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-amber-300 border-2 border-zinc-900 font-black px-2 py-0.5 rounded">A / D or ◀ / ▶</span>
                    <span>Steer into your chosen decision lane</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-purple-300 border-2 border-zinc-900 font-black px-2 py-0.5 rounded">SPACEBAR</span>
                    <span>Cut Engine in traffic to stop Rate Lock fees!</span>
                  </li>
                </ul>
              </div>
              <div className="mt-3 pt-2 border-t-2 border-zinc-900/20 text-[11px] font-bold text-zinc-700">
                💡 No spoilers on the road: All highway signs look identical!
              </div>
            </div>
          </div>

          {/* 3. Choose Loan Type */}
          <div className="mb-8">
            <label className="block text-xs font-black uppercase text-zinc-900 mb-2 flex items-center gap-1.5">
              <Shield size={15} /> 3. Select Your Mortgage Engine ($300,000 Home)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LOAN_ENGINES.map((loan) => {
                const active = selectedLoan === loan.id;
                return (
                  <div
                    key={loan.id}
                    onClick={() => setSelectedLoan(loan.id)}
                    className={`cursor-pointer arcade-btn p-4 rounded-2xl ${
                      active ? 'bg-amber-200' : 'bg-zinc-50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-bold text-base text-zinc-900">{loan.name}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded border border-zinc-900 ${
                        active ? 'bg-emerald-400 text-zinc-900' : 'bg-white text-zinc-500'
                      }`}>
                        {active ? 'SELECTED' : 'SELECT'}
                      </span>
                    </div>
                    <div className="text-xs font-black text-rose-600 mb-1">{loan.tag}</div>
                    <p className="text-xs text-zinc-700 font-medium">{loan.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full arcade-btn bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-2xl py-4 rounded-2xl flex items-center justify-center gap-3"
          >
            START THE MOVING TRUCK! <ArrowRight size={24} />
          </button>
        </form>
      )}
    </div>
  );
}
