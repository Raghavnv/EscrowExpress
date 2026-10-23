import React, { useState } from 'react';
import {
  Truck, BookOpen, Compass, UserPlus, Play, ArrowRight, ArrowLeft,
  Sparkles, HelpCircle, CheckCircle2, Keyboard
} from 'lucide-react';

const CONCEPT_CARDS = [
  {
    term: '1. Down Payment vs. Closing Costs',
    plainEnglish: 'Your Down Payment (e.g., $30,000) goes toward owning the house itself. Closing Costs are an EXTRA 2%–5% ($8,000–$12,000) in administrative, legal, and tax fees required in cash on signing day.',
    howItHelps: 'In this game, your Down Payment is locked in the back of the truck. You must manage your extra "Cash-to-Close" fuel so it doesn’t hit $0 before reaching the Title Office.'
  },
  {
    term: '2. Home Inspection & Seller Credits',
    plainEnglish: 'Before finalizing the purchase, an inspector checks the house for hidden damage (roof leaks, old furnace). If they find issues, you can pay for repairs yourself, waive/ignore them, or ask for a Seller Credit (where the seller pays part of your closing costs to cover the fix).',
    howItHelps: 'On the highway, you will face 3-lane Inspection forks. Remember: waiving an inspection costs nothing today, but hidden defects can break right before move-in!'
  },
  {
    term: '3. Underwriting & Interest Rate Locks',
    plainEnglish: 'Underwriting is when the bank verifies all your tax returns, bank statements, and title history. A "Rate Lock" freezes your interest rate for 30 days. If underwriting gets delayed in a backlog, the bank charges daily "Rate Lock Extension Fees" to keep your rate from rising.',
    howItHelps: 'When you hit bumper-to-bumper Underwriting Traffic on the highway, brake immediately and CUT YOUR ENGINE [SPACEBAR] so you don’t burn daily extension fees while waiting!'
  },
  {
    term: '4. Home Appraisal & Appraisal Gaps',
    plainEnglish: 'The bank hires an independent appraiser to verify the home is actually worth what you offered. If you offered $300k but the appraiser says it’s only worth $295k, that $5k shortage is an "Appraisal Gap."',
    howItHelps: 'The bank won’t lend more than the appraised value. You can either pay the gap in cash OR appeal the appraisal using comparable neighborhood sales ("Comps").'
  },
  {
    term: '5. Escrow Reserve Account',
    plainEnglish: 'An Escrow account is a locked reserve bucket managed by your lender. Lenders don’t trust buyers to save up for huge end-of-year property tax and home insurance bills, so they require you to prepay 6 to 12 months upfront at closing.',
    howItHelps: 'At Mile 3.8, you must drive through the Escrow Weigh Station with at least $4,200 left in your tank to fund your prepaid taxes and hazard insurance.'
  },
  {
    term: '6. Lender "Junk Fees" vs. Required Fees',
    plainEnglish: 'Required fees (like Title Insurance and Government Recording Fees) protect your legal ownership. "Junk Fees" are padded charges some lenders slip in (like "Express Courier Fee" or "Application Processing Fee") that you can challenge or refuse.',
    howItHelps: 'Watch the highway signs carefully—steer toward legitimate protections or fee audits, and steer away from padded administrative charges!'
  }
];

const LOAN_TYPES = [
  {
    id: 'conventional',
    name: 'Conventional Loan Truck',
    downPayment: 60000,
    startingCash: 11500,
    pmiPenalty: 0,
    colorHex: 0x6366f1,
    specs: '20% Down ($60,000) • $11,500 Cash Buffer',
    desc: 'Higher down payment leaves you with a tighter $11,500 cash buffer for the drive, but you pay $0 in upfront mortgage insurance.'
  },
  {
    id: 'fha',
    name: 'FHA Loan Sprinter Van',
    downPayment: 10500,
    startingCash: 13000,
    pmiPenalty: 1200,
    colorHex: 0x0ea5e9,
    specs: '3.5% Down ($10,500) • $13,000 Cash Buffer',
    desc: 'Smaller down payment gives you a bigger initial cash buffer ($13,000), but FHA loans deduct a mandatory $1,200 Upfront Mortgage Insurance Premium (UFMIP).'
  }
];

export default function OnboardingFlow({ existingSave, onStartNewGame, onResumeGame }) {
  const [step, setStep] = useState(1); // 1: Mission Overview | 2: Concept Field Guide | 3: Controls & Sign-Up
  const [buyerName, setBuyerName] = useState(existingSave?.profile?.name || '');
  const [selectedLoan, setSelectedLoan] = useState('conventional');

  const handleSubmit = (e) => {
    e.preventDefault();
    const loan = LOAN_TYPES.find((l) => l.id === selectedLoan);
    onStartNewGame({
      name: buyerName.trim() || 'Alex Rivera',
      loanType: loan.name,
      loanId: loan.id,
      downPayment: loan.downPayment,
      startingCash: loan.startingCash,
      pmiPenalty: loan.pmiPenalty,
      truckColor: loan.colorHex
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Saved Game Banner */}
      {existingSave && existingSave.stage !== 'onboarding' && (
        <div className="mb-6 p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">Saved Buyer Profile Active</div>
              <div className="text-sm font-semibold text-white">
                {existingSave.profile?.name} ({existingSave.profile?.loanType}) • ${existingSave.cashReserves.toLocaleString()} Cash Reserves
              </div>
            </div>
          </div>
          <button
            onClick={onResumeGame}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
          >
            <Play size={15} /> Resume Drive
          </button>
        </div>
      )}

      {/* Progress Stepper Bar */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { num: 1, label: '1. The Story & Goal', icon: Compass },
          { num: 2, label: '2. Homebuyer Terms Guide', icon: BookOpen },
          { num: 3, label: '3. Tutorial & Sign Up', icon: UserPlus }
        ].map((item) => {
          const Icon = item.icon;
          const active = step === item.num;
          const completed = step > item.num;
          return (
            <button
              key={item.num}
              type="button"
              onClick={() => setStep(item.num)}
              className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                active
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                  : completed
                  ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-300'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Icon size={18} className={active ? 'text-indigo-400' : completed ? 'text-emerald-400' : 'text-slate-500'} />
              <span className="text-xs font-bold truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: THE MISSION & STORY */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-4">
            <Truck size={14} /> First-Time Homebuyer Readiness Challenge
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
            Welcome to Escrow Express
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Imagine you finally saved up the down payment for a <strong>$300,000 house</strong>. You sign the purchase offer and think the hard part is over.
            <br /><br />
            Then comes the shock: between signing the contract and getting the keys (a 30-day period called <strong>"Being in Escrow"</strong>), you have to navigate home inspections, appraisals, bank underwriting delays, and pay <strong>$8,000 to $12,000 in extra "Closing Costs"</strong>.
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-8 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400">
              How This Game Works (No Hand-Holding!)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              • You will drive a moving truck <strong>5.0 miles</strong> down the Closing Highway to the County Title Office.
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              • Along the highway, you will encounter <strong>real-estate decision forks</strong> in the lanes. <strong>The signs will NOT tell you which choice is good or bad</strong>—and they won't show dollar amounts upfront!
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              • You must use the <strong>Homebuyer Terms Guide (Next Step)</strong> to make smart financial choices, keep your Escrow tank funded, and arrive at the Title Office with at least <strong>$3,500 in emergency savings</strong> so you don't end up "House Poor."
            </p>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            Read the Homebuyer Field Guide (6 Key Terms) <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* STEP 2: PLAIN-ENGLISH CONCEPT BRIEFING */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Pre-Drive Briefing</span>
              <h2 className="text-2xl font-black text-white">6 Terms You Need to Know to Win</h2>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Back
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mb-6">
            Study these 6 real-world terms carefully. On the highway, road signs will use these exact terms without color hints!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {CONCEPT_CARDS.map((card, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-indigo-300 font-black text-sm mb-2">
                    <HelpCircle size={16} className="text-indigo-400 shrink-0" />
                    <span>{card.term}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {card.plainEnglish}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-200">
                  <strong>In the Game:</strong> {card.howItHelps}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(3)}
            className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            Got It! Proceed to Controls & Buyer Registration <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* STEP 3: DRIVING TUTORIAL & BUYER REGISTRATION */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Final Step • Controls & Profile</span>
              <h2 className="text-2xl font-black text-white">Truck Controls & Buyer Sign-Up</h2>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Review Terms
            </button>
          </div>

          {/* Mini Driving Controls Tutorial */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-3">
              <Keyboard size={15} /> How to Drive Your Truck
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-black text-white mb-1">Accelerate & Brake</div>
                <p className="text-slate-400">Hold <strong className="text-emerald-400">W / ▲</strong> to drive forward. Hold <strong className="text-rose-400">S / ▼</strong> to brake before traffic!</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-black text-white mb-1">Steer Lanes</div>
                <p className="text-slate-400">Use <strong className="text-indigo-300">A / D</strong> or <strong className="text-indigo-300">◀ / ▶</strong> to steer into the decision lane you choose.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-black text-white mb-1">Cut Engine in Delays</div>
                <p className="text-slate-400">Press <strong className="text-sky-300">SPACEBAR</strong> when stopped in traffic so you don't burn Rate-Lock extension fees!</p>
              </div>
            </div>
          </div>

          {/* Buyer Profile Sign-Up */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Register Your Buyer Name (Saves Your Progress Automatically)
            </label>
            <input
              type="text"
              required
              placeholder="Enter your name (e.g., Samiksha)"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition"
            />
          </div>

          {/* Neutral Loan Vehicle Selection (No Spoilers) */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Choose Your Mortgage Vehicle ($300,000 Home Purchase)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LOAN_TYPES.map((loan) => {
                const active = selectedLoan === loan.id;
                return (
                  <div
                    key={loan.id}
                    onClick={() => setSelectedLoan(loan.id)}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition ${
                      active
                        ? 'bg-indigo-950/50 border-indigo-500 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-white">{loan.name}</span>
                      <CheckCircle2 size={18} className={active ? 'text-indigo-400' : 'text-slate-700'} />
                    </div>
                    <div className="text-xs font-semibold text-indigo-300 mb-2">{loan.specs}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{loan.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
          >
            <Play size={18} /> Save Profile & Hit the Closing Highway
          </button>
        </form>
      )}
    </div>
  );
}
