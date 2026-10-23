import React, { useState } from 'react';
import { Truck, ShieldCheck, Wrench, Clock, DollarSign, UserPlus, Play, ArrowRight, Sparkles } from 'lucide-react';

const LOAN_TYPES = [
  {
    id: 'conventional',
    name: 'Conventional Cruiser (20% Down)',
    downPayment: 60000,
    startingCash: 12000,
    pmiPenalty: 0,
    colorHex: 0x6366f1,
    badge: 'No Monthly PMI Drag',
    desc: 'Requires a large $60k down payment, but avoids Private Mortgage Insurance (PMI) fees along the highway.'
  },
  {
    id: 'fha',
    name: 'FHA Sprinter Van (3.5% Down)',
    downPayment: 10500,
    startingCash: 13500,
    pmiPenalty: 900,
    colorHex: 0x10b981,
    badge: 'Higher Cash Cushion + Upfront MIP Fee',
    desc: 'Lets you buy with a smaller down payment and more liquid cash, but charges an upfront Mortgage Insurance fee ($900) at each milestone.'
  }
];

export default function OnboardingFlow({ existingSave, onStartNewGame, onResumeGame }) {
  const [step, setStep] = useState('guide'); // 'guide' | 'signup'
  const [buyerName, setBuyerName] = useState(existingSave?.profile?.name || '');
  const [selectedLoan, setSelectedLoan] = useState('conventional');

  const handleCreateProfile = (e) => {
    e.preventDefault();
    const loanConfig = LOAN_TYPES.find(l => l.id === selectedLoan);
    onStartNewGame({
      name: buyerName.trim() || 'Alex Rivera',
      loanType: loanConfig.name,
      loanId: loanConfig.id,
      downPayment: loanConfig.downPayment,
      startingCash: loanConfig.startingCash,
      pmiPenalty: loanConfig.pmiPenalty,
      truckColor: loanConfig.colorHex
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Resume Saved Profile Banner if present */}
      {existingSave && existingSave.stage !== 'onboarding' && (
        <div className="mb-6 p-4 rounded-2xl bg-indigo-950/70 border border-indigo-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">Saved Progress Found</div>
              <div className="text-sm font-semibold text-white">
                Buyer: {existingSave.profile?.name} • Stage: <span className="capitalize">{existingSave.stage}</span> (${existingSave.cashReserves.toLocaleString()} Cash Left)
              </div>
            </div>
          </div>
          <button
            onClick={onResumeGame}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
          >
            <Play size={15} /> Resume Saved Game
          </button>
        </div>
      )}

      {/* STEP 1: HOW THE GAME & REAL ESTATE CONCEPTS WORK */}
      {step === 'guide' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-4">
            <Truck size={14} /> Interactive Homebuyer Simulator
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            Why Saving a Down Payment Isn’t Enough
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Most first-time buyers save up their down payment for a <strong className="text-white">$300,000 home</strong> and think they are ready to get the keys. 
            In reality, you must survive <strong className="text-amber-400">Closing Costs & Escrow</strong>—an extra <strong className="text-emerald-400">2% to 5% ($8,000–$12,000)</strong> in cash required before closing day.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                <DollarSign size={18} /> 1. Liquid Cash = Your Truck Fuel
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your Down Payment is locked in the cargo bed. Your extra savings act as liquid fuel to pay lender fees, appraisal costs, and surprises.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                <Wrench size={18} /> 2. Inspection Roadblocks
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                When an inspector finds roof or furnace defects, you must decide: negotiate a <strong>Seller Credit</strong>, pay out-of-pocket, or risk waiving repairs.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1">
                <Clock size={18} /> 3. Traffic Delays = Rate Lock Bleed
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                If underwriting gets delayed in traffic, your 30-day Interest Rate Lock expires! <strong>Cut your truck engine</strong> immediately to avoid daily extension fees.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
                <ShieldCheck size={18} /> 4. The Escrow Weigh Station
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lenders require you to prepay 6 months of property taxes and 12 months of home insurance into a locked <strong>Escrow Trailer</strong> before crossing the finish line.
              </p>
            </div>
          </div>

          <button
            onClick={() => setStep('signup')}
            className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            Create Buyer Profile & Choose Vehicle <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* STEP 2: BUYER SIGN-UP & VEHICLE / LOAN SELECTION */}
      {step === 'signup' && (
        <form onSubmit={handleCreateProfile} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 2 of 2 • Local Save Profile</span>
              <h2 className="text-2xl font-black text-white mt-0.5">Homebuyer Registration</h2>
            </div>
            <button
              type="button"
              onClick={() => setStep('guide')}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Back to Guide
            </button>
          </div>

          {/* Buyer Name Input */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Your Buyer Name (Saved to Browser Profile)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g., Jordan Taylor"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition"
              />
            </div>
          </div>

          {/* Loan Vehicle Selection */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Select Your Loan Vehicle ($300,000 Target Home)
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
                        ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">{loan.name}</span>
                      <span className={`w-3 h-3 rounded-full ${active ? 'bg-indigo-400 ring-4 ring-indigo-500/30' : 'bg-slate-700'}`} />
                    </div>
                    <div className="inline-block px-2 py-0.5 rounded bg-slate-800 text-[11px] font-semibold text-indigo-300 mb-2">
                      {loan.badge}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{loan.desc}</p>
                    <div className="border-t border-slate-800/80 pt-2 flex justify-between text-xs">
                      <span className="text-slate-400">Liquid Cash Buffer:</span>
                      <span className="font-bold text-emerald-400">${loan.startingCash.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
          >
            <UserPlus size={18} /> Save Buyer Profile & Start Engine
          </button>
        </form>
      )}
    </div>
  );
}
