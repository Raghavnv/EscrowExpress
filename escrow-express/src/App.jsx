import React, { useState, useEffect } from 'react';
import {
  Truck, ShieldAlert, DollarSign, Clock, Wrench,
  CheckCircle, AlertTriangle, RotateCcw, Power, ChevronRight, User, FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PhaserCanvas from './components/PhaserCanvas';
import OnboardingFlow from './components/OnboardingFlow';

const STORAGE_KEY = 'nest_navigate_escrow_express_v2';

const DEFAULT_STATE = {
  stage: 'onboarding', // 'onboarding' | 'driving' | 'inspection' | 'traffic' | 'escrow' | 'summary'
  profile: null,
  cashReserves: 12000,
  escrowFunded: 0,
  escrowRequired: 4200, // $2,400 property taxes + $1,800 homeowner insurance
  lenderOriginationFee: 1800, // Standard closing fee charged at underwriting
  engineRunning: true,
  trafficTimer: 9,
  trafficFeeAccrued: 0,
  truckDamage: 0,
  distanceTraveled: 0,
  history: [],
};

export default function App() {
  const [game, setGame] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });

  const [insightBanner, setInsightBanner] = useState(null);

  // Save state automatically to localStorage on every update
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  // Traffic Gridlock Countdown & Engine Idling Cash Burn
  useEffect(() => {
    let timer = null;
    if (game.stage === 'traffic' && game.trafficTimer > 0) {
      timer = setInterval(() => {
        setGame((prev) => {
          const idleBurn = prev.engineRunning ? 150 : 0; // $150/sec rate lock extension burn
          const nextCash = prev.cashReserves - idleBurn;
          const nextAccrued = prev.trafficFeeAccrued + idleBurn;
          const nextTime = prev.trafficTimer - 1;

          if (nextTime <= 0) {
            return {
              ...prev,
              trafficTimer: 0,
              cashReserves: nextCash,
              trafficFeeAccrued: nextAccrued,
              engineRunning: true,
              stage: 'driving',
              distanceTraveled: 75,
              history: [
                ...prev.history,
                nextAccrued > 0
                  ? {
                      item: 'Rate Lock Extension Fees (Idled During Delay)',
                      cost: -nextAccrued,
                      lesson: 'Leaving your rate lock unmanaged during delays costs daily extension fees.'
                    }
                  : {
                      item: 'Rate Lock Protected (Engine Cut Immediately)',
                      cost: 0,
                      lesson: 'You froze your rate lock during underwriting backlog and lost $0!'
                    }
              ]
            };
          }

          return {
            ...prev,
            cashReserves: nextCash,
            trafficFeeAccrued: nextAccrued,
            trafficTimer: nextTime
          };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [game.stage, game.trafficTimer, game.engineRunning]);

  // Start new profile & initialize loan math
  const handleStartNewGame = (profileData) => {
    const initialHistory = [
      {
        item: 'Lender Origination & Title Search Fee',
        cost: -1800,
        lesson: 'Standard upfront lender processing & title clearance charges (part of Closing Costs).'
      }
    ];

    if (profileData.pmiPenalty > 0) {
      initialHistory.push({
        item: 'FHA Upfront Mortgage Insurance (UFMIP)',
        cost: -profileData.pmiPenalty,
        lesson: 'Low-down-payment FHA loans charge an upfront insurance fee at closing.'
      });
    }

    const netStartingCash = profileData.startingCash - 1800 - profileData.pmiPenalty;

    setGame({
      ...DEFAULT_STATE,
      stage: 'driving',
      profile: profileData,
      cashReserves: netStartingCash,
      distanceTraveled: 20,
      history: initialHistory
    });

    setInsightBanner({
      concept: 'Loan Estimate Origination Fees',
      title: 'Standard Lender & Title Fees Deducted (-$1,800)',
      desc: 'Right out of the gate, lenders charge origination, appraisal, and title search fees. Your liquid fuel dropped before you even hit the first roadblock!'
    });
  };

  const handleResetToOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGame(DEFAULT_STATE);
    setInsightBanner(null);
  };

  // Milestone 1: Inspection Choice
  const handleInspectionDecision = (option) => {
    if (option === 'negotiate') {
      setGame((prev) => ({
        ...prev,
        cashReserves: prev.cashReserves - 450,
        stage: 'driving',
        distanceTraveled: 50,
        history: [
          ...prev.history,
          {
            item: 'Inspection Contingency: Negotiated Seller Credit (Re-inspection Fee)',
            cost: -450,
            lesson: 'Negotiating seller credits saved you $2,500 in out-of-pocket HVAC repair costs.'
          }
        ]
      }));
      setInsightBanner({
        concept: 'Inspection Contingency & Seller Credits',
        title: 'You Saved $2,500 Using a Seller Credit!',
        desc: 'In real life, when an inspection uncovers a broken furnace, you can ask the seller to credit your closing costs instead of draining your own cash.'
      });
    } else if (option === 'pay') {
      setGame((prev) => ({
        ...prev,
        cashReserves: prev.cashReserves - 2800,
        stage: 'driving',
        distanceTraveled: 50,
        history: [
          ...prev.history,
          {
            item: 'Paid HVAC & Roof Repairs Out-of-Pocket',
            cost: -2800,
            lesson: 'Paying for major repairs yourself guarantees the seller stays happy, but drains your cash to close.'
          }
        ]
      }));
      setInsightBanner({
        concept: 'Out-of-Pocket Repairs',
        title: 'Direct Cash Hit (-$2,800)',
        desc: 'Paying for repairs yourself keeps the seller happy, but shrinks the cash cushion you need for the Escrow Weigh Station ahead.'
      });
    } else if (option === 'waive') {
      setGame((prev) => ({
        ...prev,
        truckDamage: 3200,
        stage: 'driving',
        distanceTraveled: 50,
        history: [
          ...prev.history,
          {
            item: 'Waived Inspection Contingency (Deferred Risk)',
            cost: 0,
            lesson: 'Waiving inspections looks free upfront, but sticks you with major hidden repair bills on move-in day.'
          }
        ]
      }));
      setInsightBanner({
        concept: 'Waiving Inspection Contingencies',
        title: 'Warning: Hidden Structural Damage Onboard!',
        desc: 'You saved $0 today by waiving the inspection, but a hidden plumbing leak will hit your bank account the moment you arrive at Closing Day.'
      });
    }
  };

  // Milestone 3: Escrow Funding & Final Arrival
  const handleFundEscrow = () => {
    setGame((prev) => {
      const afterEscrow = prev.cashReserves - prev.escrowRequired;
      const finalCash = afterEscrow - prev.truckDamage;

      const updatedHistory = [
        ...prev.history,
        {
          item: 'Prepaid County Property Taxes (6 Months into Escrow)',
          cost: -2400,
          lesson: 'Lenders collect 6 months of property taxes upfront so the county never puts a tax lien on the house.'
        },
        {
          item: 'Prepaid Homeowners Hazard Insurance (12 Months into Escrow)',
          cost: -1800,
          lesson: 'Lenders require 1 full year of home insurance paid upfront to protect the collateral.'
        }
      ];

      if (prev.truckDamage > 0) {
        updatedHistory.push({
          item: 'Emergency Plumbing Burst (From Waived Inspection)',
          cost: -prev.truckDamage,
          lesson: 'Because you waived the inspection earlier, you had to pay $3,200 immediately upon getting the keys.'
        });
      }

      if (finalCash > 0) {
        confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 } });
      }

      return {
        ...prev,
        cashReserves: finalCash,
        escrowFunded: prev.escrowRequired,
        stage: 'summary',
        distanceTraveled: 100,
        history: updatedHistory
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/30">
            <Truck size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">Escrow Express</h1>
            <p className="text-[11px] text-slate-400">Nest Navigate • Cash-to-Close Homebuyer Simulator</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {game.profile && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <User size={14} className="text-indigo-400" />
              <span className="font-semibold text-slate-200">{game.profile.name}</span>
              <span className="text-slate-500">•</span>
              <span className="text-indigo-300">{game.profile.loanId.toUpperCase()}</span>
            </div>
          )}
          {game.stage !== 'onboarding' && (
            <button
              onClick={handleResetToOnboarding}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-800 transition"
            >
              <RotateCcw size={13} /> Switch Buyer / Reset
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {game.stage === 'onboarding' ? (
          <OnboardingFlow
            existingSave={game.profile ? game : null}
            onStartNewGame={handleStartNewGame}
            onResumeGame={() => setGame((prev) => ({ ...prev, stage: 'driving' }))}
          />
        ) : (
          <>
            {/* Live Dashboard HUD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {/* Liquid Cash Fuel */}
              <div className={`p-4 rounded-2xl border transition ${
                game.cashReserves < 2500 ? 'bg-rose-950/40 border-rose-700' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1 font-bold text-slate-300">
                    <DollarSign size={14} className="text-emerald-400" /> Cash-to-Close Fuel
                  </span>
                  <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                    Down Pmt: ${(game.profile?.downPayment || 30000).toLocaleString()}
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  ${game.cashReserves.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {game.cashReserves >= 4200
                    ? 'Enough cash to cover the $4,200 Escrow requirement'
                    : '⚠️ Below $4,200 required for Escrow Weigh Station!'}
                </p>
              </div>

              {/* Escrow Reserve Tank */}
              <div className="p-4 rounded-2xl border bg-slate-900 border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1 font-bold text-slate-300">
                    <ShieldAlert size={14} className="text-sky-400" /> Escrow Reserve Tank
                  </span>
                  <span>Target: $4,200</span>
                </div>
                <div className="text-2xl font-black text-sky-400">
                  ${game.escrowFunded.toLocaleString()}
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-sky-400 h-full transition-all duration-500"
                    style={{ width: `${(game.escrowFunded / game.escrowRequired) * 100}%` }}
                  />
                </div>
              </div>

              {/* Route Progress */}
              <div className="p-4 rounded-2xl border bg-slate-900 border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1 font-bold text-slate-300">
                    <Clock size={14} className="text-amber-400" /> Journey to Closing
                  </span>
                  <span className="font-bold text-white">{game.distanceTraveled}%</span>
                </div>
                <div className="text-sm font-bold text-indigo-300 mt-1">
                  {game.distanceTraveled < 40 && 'Next: Home Inspection Gate'}
                  {game.distanceTraveled >= 40 && game.distanceTraveled < 70 && 'Next: Underwriting Traffic'}
                  {game.distanceTraveled >= 70 && game.distanceTraveled < 100 && 'Next: Escrow Weigh Station'}
                  {game.distanceTraveled === 100 && 'Arrived: County Title Office'}
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${game.distanceTraveled}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Phaser 3 Interactive 2D Highway Canvas */}
            <PhaserCanvas
              isDriving={game.stage === 'driving'}
              engineRunning={game.engineRunning}
              escrowPercent={game.escrowFunded / game.escrowRequired}
              stage={game.stage}
              truckColor={game.profile?.truckColor || 0x6366f1}
            />

            {/* Real-World Consequence Insight Banner */}
            {insightBanner && game.stage === 'driving' && (
              <div className="mb-6 p-4 rounded-2xl bg-indigo-950/70 border border-indigo-500/50 flex items-start gap-3">
                <CheckCircle className="text-indigo-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-indigo-300">
                    Real-World Takeaway • {insightBanner.concept}
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">{insightBanner.title}</div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{insightBanner.desc}</p>
                </div>
              </div>
            )}

            {/* DRIVING CONTROL PANEL */}
            {game.stage === 'driving' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl">
                <h3 className="text-lg font-bold text-white mb-1">
                  Driving Toward Your Closing Date...
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
                  Your progress is automatically saved under <strong>{game.profile?.name}</strong>. Advance to the next homebuying milestone when ready.
                </p>

                {game.distanceTraveled < 40 && (
                  <button
                    onClick={() => setGame((prev) => ({ ...prev, stage: 'inspection', distanceTraveled: 35 }))}
                    className="py-3.5 px-7 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl inline-flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
                  >
                    Approach Checkpoint 1: Home Inspection <ChevronRight size={18} />
                  </button>
                )}

                {game.distanceTraveled >= 40 && game.distanceTraveled < 70 && (
                  <button
                    onClick={() =>
                      setGame((prev) => ({
                        ...prev,
                        stage: 'traffic',
                        distanceTraveled: 60,
                        trafficTimer: 9,
                        trafficFeeAccrued: 0,
                        engineRunning: true
                      }))
                    }
                    className="py-3.5 px-7 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl inline-flex items-center gap-2 transition shadow-lg shadow-rose-600/20"
                  >
                    Approach Checkpoint 2: Underwriting Highway <ChevronRight size={18} />
                  </button>
                )}

                {game.distanceTraveled >= 70 && (
                  <button
                    onClick={() => setGame((prev) => ({ ...prev, stage: 'escrow', distanceTraveled: 88 }))}
                    className="py-3.5 px-7 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl inline-flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
                  >
                    Approach Checkpoint 3: Escrow Weigh Station <ChevronRight size={18} />
                  </button>
                )}
              </div>
            )}

            {/* CHECKPOINT 1: INSPECTION ROADBLOCK */}
            {game.stage === 'inspection' && (
              <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center gap-2.5 text-amber-400 mb-2">
                  <Wrench size={22} />
                  <span className="text-xs font-bold uppercase tracking-wider">Milestone 1 • Property Condition</span>
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  Home Inspection Uncovered $2,800 in Defects!
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Your inspector found an aging furnace and cracked roof flashing. In real estate, an <strong>Inspection Contingency</strong> gives you three choices before closing:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleInspectionDecision('negotiate')}
                    className="p-4 rounded-xl border-2 border-indigo-600 bg-indigo-950/40 hover:bg-indigo-900/50 text-left transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-bold text-indigo-300 text-sm mb-1">1. Negotiate Seller Credit</div>
                      <div className="text-xs font-semibold text-emerald-400 mb-2">Cost: -$450 (Re-inspection fee)</div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Ask the seller to cover the $2,500 repair via a Closing Cost Credit so you keep your liquid cash.
                      </p>
                    </div>
                    <span className="mt-4 text-[11px] font-bold text-indigo-300 uppercase">Recommended Strategy →</span>
                  </button>

                  <button
                    onClick={() => handleInspectionDecision('pay')}
                    className="p-4 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-left transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-bold text-white text-sm mb-1">2. Pay Out-of-Pocket</div>
                      <div className="text-xs font-semibold text-rose-400 mb-2">Cost: -$2,800 Cash Now</div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Pay the contractor yourself. Avoids seller pushback, but drains your cash reserves before Escrow.
                      </p>
                    </div>
                    <span className="mt-4 text-[11px] font-bold text-slate-400 uppercase">Select Option →</span>
                  </button>

                  <button
                    onClick={() => handleInspectionDecision('waive')}
                    className="p-4 rounded-xl border border-rose-800/60 bg-rose-950/20 hover:bg-rose-900/30 text-left transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-bold text-rose-300 text-sm mb-1">3. Waive & Ignore</div>
                      <div className="text-xs font-semibold text-amber-400 mb-2">Cost: $0 Today (High Risk)</div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Skip repairs to close faster. Warning: Unfixed defects often burst into costlier emergencies on move-in day!
                      </p>
                    </div>
                    <span className="mt-4 text-[11px] font-bold text-rose-400 uppercase">Risk It →</span>
                  </button>
                </div>
              </div>
            )}

            {/* CHECKPOINT 2: UNDERWRITING GRIDLOCK & ENGINE CUTOFF */}
            {game.stage === 'traffic' && (
              <div className="bg-slate-900 border-2 border-rose-500/70 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
                <div className="inline-flex p-3 bg-rose-500/20 text-rose-400 rounded-full mb-3 animate-pulse">
                  <AlertTriangle size={30} />
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  Underwriting Paperwork Traffic Jam!
                </h3>
                <p className="text-sm text-slate-300 max-w-lg mx-auto mb-5 leading-relaxed">
                  The lender’s underwriting team is backed up! While your truck idles in traffic, your <strong>30-Day Interest Rate Lock</strong> is burning <strong>$150/second</strong> in daily extension fees. <strong>Cut your engine now</strong> to freeze your rate lock!
                </p>

                <div className="bg-slate-950 p-4 rounded-xl max-w-sm mx-auto mb-6 border border-slate-800 flex justify-around items-center">
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase">Backlog Clears In</div>
                    <div className="text-3xl font-black text-amber-400">{game.trafficTimer}s</div>
                  </div>
                  <div className="h-10 w-[1px] bg-slate-800" />
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase">Extension Fees Lost</div>
                    <div className="text-2xl font-black text-rose-400">-${game.trafficFeeAccrued}</div>
                  </div>
                </div>

                <button
                  onClick={() => setGame((prev) => ({ ...prev, engineRunning: !prev.engineRunning }))}
                  className={`py-4 px-8 rounded-2xl font-black text-sm flex items-center justify-center gap-2 mx-auto transition shadow-xl ${
                    game.engineRunning
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-bounce'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  <Power size={18} />
                  {game.engineRunning
                    ? 'CUT ENGINE NOW (Freeze Rate Lock Bleed!)'
                    : '✓ ENGINE OFF — Rate Lock Protected ($0/sec)'}
                </button>
              </div>
            )}

            {/* CHECKPOINT 3: ESCROW WEIGH STATION */}
            {game.stage === 'escrow' && (
              <div className="bg-slate-900 border border-sky-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center gap-2.5 text-sky-400 mb-2">
                  <ShieldAlert size={22} />
                  <span className="text-xs font-bold uppercase tracking-wider">Milestone 3 • Mandatory Prepaids</span>
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  The Escrow Weigh Station: Load Your Reserve Trailer
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-5">
                  Why won't the bank let you cross the bridge with just your down payment? Because if you fail to pay property taxes or home insurance, the county or fire hazard can destroy the bank's collateral. Lenders force you to prepay an <strong>Escrow Cushion</strong> upfront:
                </p>

                <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 mb-6 space-y-3">
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>6 Months Prepaid County Property Taxes</span>
                    <span className="font-bold text-white">$2,400</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>12 Months Prepaid Homeowner Hazard Insurance</span>
                    <span className="font-bold text-white">$1,800</span>
                  </div>
                  <div className="border-t border-slate-800 pt-3 flex justify-between text-base font-black text-sky-400">
                    <span>Total Mandatory Escrow Transfer</span>
                    <span>$4,200</span>
                  </div>
                </div>

                <button
                  onClick={handleFundEscrow}
                  className="w-full py-4 px-6 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
                >
                  Load $4,200 into Escrow Trailer & Drive to Title Office <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* SCREEN 4: OFFICIAL CLOSING DISCLOSURE (SUMMARY) */}
            {game.stage === 'summary' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <FileText className="text-indigo-400" size={28} />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                        Official Closing Disclosure Form
                      </div>
                      <h2 className="text-2xl font-black text-white">
                        Buyer Settlement Statement • {game.profile?.name}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Final Outcome Grade */}
                <div className={`p-5 rounded-2xl border mb-6 ${
                  game.cashReserves >= 3500
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                    : game.cashReserves >= 0
                    ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                    : 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider mb-1">
                    Homebuyer Readiness Grade
                  </div>
                  <div className="text-2xl font-black text-white mb-1">
                    {game.cashReserves >= 3500 && '🏆 Grade A: Empowered & Cash-Ready Homebuyer!'}
                    {game.cashReserves >= 0 && game.cashReserves < 3500 && '⚠️ Grade C: Closed the Deal, But "House Poor"'}
                    {game.cashReserves < 0 && '❌ Grade F: Cash-to-Close Shortfall (Loan Denied)'}
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {game.cashReserves >= 3500 &&
                      `You paid every closing cost, funded your $4,200 Escrow Trailer, and still kept $${game.cashReserves.toLocaleString()} in post-closing emergency savings!`}
                    {game.cashReserves >= 0 && game.cashReserves < 3500 &&
                      `You got the keys, but with only $${game.cashReserves.toLocaleString()} left in the bank, a single broken water heater could push you into high-interest debt.`}
                    {game.cashReserves < 0 &&
                      `You arrived at the Title Office $${Math.abs(game.cashReserves).toLocaleString()} short of the required Cash to Close. In real life, the lender halts funding until you bring certified funds.`}
                  </p>
                </div>

                {/* Itemized Ledger with Plain-English Explanations */}
                <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 mb-6 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Itemized Cash-to-Close Breakdown & Real-World Lessons
                  </div>
                  {game.history.map((entry, idx) => (
                    <div key={idx} className="border-b border-slate-900 pb-2.5 last:border-none">
                      <div className="flex justify-between text-xs font-bold text-slate-200">
                        <span>{entry.item}</span>
                        <span className={entry.cost < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          {entry.cost === 0 ? '$0' : `-$${Math.abs(entry.cost).toLocaleString()}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{entry.lesson}</p>
                    </div>
                  ))}
                  <div className="border-t border-slate-800 pt-3 flex justify-between text-base font-black text-white">
                    <span>Final Post-Closing Emergency Fund:</span>
                    <span className={game.cashReserves >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      ${game.cashReserves.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleStartNewGame(game.profile)}
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} /> Replay Route with {game.profile?.name}
                  </button>
                  <button
                    onClick={handleResetToOnboarding}
                    className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition"
                  >
                    Change Loan Type / Buyer
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
