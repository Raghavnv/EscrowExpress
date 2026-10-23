import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, ShieldAlert, DollarSign, Gauge, Power, RotateCcw,
  User, Radio, FileText, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, BookOpen, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PhaserCanvas from './components/PhaserCanvas';
import OnboardingFlow from './components/OnboardingFlow';

const STORAGE_KEY = 'nest_navigate_fov_save_v4';

const INITIAL_GAME = {
  stage: 'onboarding',
  profile: null,
  cashReserves: 11500,
  escrowFunded: 0,
  escrowRequired: 4200,
  history: [],
};

export default function App() {
  const [game, setGame] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_GAME;
    } catch {
      return INITIAL_GAME;
    }
  });

  const [showGlossaryModal, setShowGlossaryModal] = useState(false);

  const [telemetry, setTelemetry] = useState({
    speed: 0,
    distance: 0,
    engineRunning: true,
    inTrafficJam: false,
    trafficTimer: 8
  });

  const [radioMessage, setRadioMessage] = useState({
    title: 'CO-PILOT RADIO: HOLD [W / ▲] TO DRIVE!',
    desc: 'Read the blue highway decision signs ahead carefully and steer [A/D or ◀/▶] into the option that protects your Cash-to-Close!'
  });

  const sceneControlRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  const handleStartNewGame = (profileData) => {
    const startCash = profileData.startingCash - 1800 - profileData.pmiPenalty;
    const startHistory = [
      {
        item: 'Lender Origination & Appraisal Fee',
        cost: -1800,
        lesson: 'Standard upfront lender processing & appraisal fees charged on every mortgage.'
      }
    ];
    if (profileData.pmiPenalty > 0) {
      startHistory.push({
        item: 'FHA Upfront Mortgage Insurance (UFMIP)',
        cost: -profileData.pmiPenalty,
        lesson: 'Low-down-payment FHA loans charge an upfront insurance premium.'
      });
    }

    setGame({
      stage: 'playing',
      profile: profileData,
      cashReserves: startCash,
      escrowFunded: 0,
      escrowRequired: 4200,
      history: startHistory
    });

    setRadioMessage({
      title: 'HIGHWAY ENGAGED — HOLD [W / ▲] TO ACCELERATE!',
      desc: 'Standard Origination Fees (-$1,800) were deducted. Watch the highway signs ahead—none of them are color-coded, so think before you steer!'
    });
  };

  const handleObstacleHit = ({ cost, title, lesson }) => {
    setGame((prev) => ({
      ...prev,
      cashReserves: prev.cashReserves + cost,
      history: [...prev.history, { item: title, cost, lesson }]
    }));
    setRadioMessage({ title, desc: lesson });
  };

  const handleTrafficTick = (timeLeft, burnAmount, engineOn) => {
    if (burnAmount > 0) {
      setGame((prev) => ({
        ...prev,
        cashReserves: prev.cashReserves - burnAmount
      }));
    }
    setRadioMessage({
      title: engineOn
        ? `🚨 UNDERWRITING DELAY (${timeLeft}s): RATE LOCK BURNING -$150/SEC!`
        : `❄️ ENGINE OFF (${timeLeft}s LEFT): RATE LOCK PAUSED!`,
      desc: engineOn
        ? 'Your 30-day Rate Lock is expiring while idling in traffic! Remember how to stop daily extension fees?'
        : 'Rate Lock protected! Waiting for underwriters to clear the paperwork backlog...'
    });
  };

  const handleTrafficCleared = () => {
    setRadioMessage({
      title: '🟢 UNDERWRITING CLEARED! RESTART ENGINE & DRIVE!',
      desc: 'If your engine is off, press [SPACE] to restart it and hold [W / ▲] to continue toward the Escrow Weigh Station!'
    });
  };

  const handleEscrowCheckpoint = () => {
    setGame((prev) => ({
      ...prev,
      cashReserves: prev.cashReserves - prev.escrowRequired,
      escrowFunded: prev.escrowRequired,
      history: [
        ...prev.history,
        {
          item: 'Escrow Weigh Station: 6 Mos Taxes + 12 Mos Insurance',
          cost: -4200,
          lesson: 'Lenders require you to prepay property taxes ($2,400) and hazard insurance ($1,800) into an Escrow Reserve account before closing.'
        }
      ]
    }));
    setRadioMessage({
      title: '⚖️ ESCROW TRAILER FUNDED (-$4,200)!',
      desc: '6 months of property taxes and 12 months of hazard insurance are now locked in your Escrow Reserve. Drive to the Title Office!'
    });
  };

  const handleFinishLine = () => {
    confetti({ particleCount: 130, spread: 80, origin: { y: 0.6 } });
    setGame((prev) => ({ ...prev, stage: 'summary' }));
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGame(INITIAL_GAME);
  };

  const milesTraveled = (telemetry.distance / 1000).toFixed(1);
  const progressPct = Math.min(100, (telemetry.distance / 5000) * 100);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col select-none">
      {/* Header */}
      <header className="border-b border-indigo-500/20 bg-slate-900/90 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
            <Truck size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-white via-indigo-200 to-fuchsia-300 bg-clip-text text-transparent">
              Escrow Express 3D
            </h1>
            <p className="text-[11px] text-slate-400">Real-Time Homebuyer Highway Simulator</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {game.stage === 'playing' && (
            <button
              onClick={() => setShowGlossaryModal(true)}
              className="text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 transition font-bold"
            >
              <BookOpen size={14} /> Terms Guide
            </button>
          )}
          {game.profile && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
              <User size={14} className="text-indigo-400" />
              <span className="font-bold text-white">{game.profile.name}</span>
            </div>
          )}
          {game.stage !== 'onboarding' && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-300 hover:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 transition"
            >
              <RotateCcw size={13} /> Home / Tutorial
            </button>
          )}
        </div>
      </header>

      {/* Quick In-Game Glossary Popup Modal */}
      {showGlossaryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-400" /> Quick Homebuyer Field Guide
              </h3>
              <button onClick={() => setShowGlossaryModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300 max-h-80 overflow-y-auto pr-1">
              <p><strong className="text-indigo-300">Inspection Contingency / Seller Credit:</strong> Lets you ask the seller to credit closing costs for repairs instead of paying out-of-pocket or risking uninspected defects.</p>
              <p><strong className="text-indigo-300">Loan Estimate Audit:</strong> Reviewing lender fees to remove padded "Junk Fees" like expedited courier charges.</p>
              <p><strong className="text-indigo-300">Underwriting & Rate Lock:</strong> If underwriting is delayed, cut your engine [SPACE] to freeze your rate lock and avoid daily extension fees.</p>
              <p><strong className="text-indigo-300">Appraisal Appeal (Comps):</strong> Using comparable neighborhood sales to challenge a low appraisal instead of paying the gap in cash.</p>
              <p><strong className="text-indigo-300">Escrow Reserve:</strong> Prepaying 6 months of property taxes + 12 months of hazard insurance ($4,200) into a locked lender reserve.</p>
            </div>
            <button
              onClick={() => setShowGlossaryModal(false)}
              className="mt-5 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
            >
              Back to Highway
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-5">
        {game.stage === 'onboarding' && (
          <OnboardingFlow
            existingSave={game.profile ? game : null}
            onStartNewGame={handleStartNewGame}
            onResumeGame={() => setGame((prev) => ({ ...prev, stage: 'playing' }))}
          />
        )}

        {game.stage === 'playing' && (
          <div className="space-y-4">
            {/* Live Co-Pilot Radio Ticker */}
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition ${
              telemetry.inTrafficJam
                ? 'bg-rose-950/70 border-rose-500 animate-pulse'
                : 'bg-indigo-950/50 border-indigo-500/40'
            }`}>
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
                <Radio size={22} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                  {radioMessage.title}
                </div>
                <div className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                  {radioMessage.desc}
                </div>
              </div>
              <div className="hidden md:block text-right shrink-0 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Distance to Closing</div>
                <div className="text-base font-black text-emerald-400">{milesTraveled} / 5.0 mi</div>
              </div>
            </div>

            {/* 3D FOV Phaser Highway Canvas */}
            <PhaserCanvas
              truckColor={game.profile?.truckColor || 0x6366f1}
              onTelemetryUpdate={setTelemetry}
              onObstacleHit={handleObstacleHit}
              onTrafficTick={handleTrafficTick}
              onTrafficCleared={handleTrafficCleared}
              onEscrowCheckpoint={handleEscrowCheckpoint}
              onFinishLine={handleFinishLine}
              sceneControlRef={sceneControlRef}
            />

            {/* Arcade Cockpit Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-2xl">
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                <div className={`p-3.5 rounded-2xl border ${
                  game.cashReserves < 2500 ? 'bg-rose-950/50 border-rose-600' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <DollarSign size={13} className="text-emerald-400" /> Cash-to-Close Fuel
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    ${game.cashReserves.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Down Payment Locked: ${(game.profile?.downPayment || 30000).toLocaleString()}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border bg-slate-950 border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <ShieldAlert size={13} className="text-sky-400" /> Escrow Tank
                  </div>
                  <div className="text-2xl font-black text-sky-400 mt-1">
                    ${game.escrowFunded.toLocaleString()}
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-sky-400 h-full transition-all duration-500"
                      style={{ width: `${(game.escrowFunded / game.escrowRequired) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 flex items-center justify-around bg-slate-950 border border-slate-800 rounded-2xl p-3">
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 justify-center">
                    <Gauge size={13} className="text-amber-400" /> Speed
                  </div>
                  <div className="text-3xl font-black text-white">
                    {telemetry.speed} <span className="text-xs font-normal text-slate-400">MPH</span>
                  </div>
                  <div className="w-24 bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-amber-400 h-full" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                <button
                  onClick={() => sceneControlRef.current?.toggleEngine()}
                  className={`px-4 py-3 rounded-2xl font-black text-xs flex flex-col items-center gap-1 transition shadow-lg ${
                    telemetry.engineRunning
                      ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  <Power size={18} />
                  <span>{telemetry.engineRunning ? 'ENGINE ON' : 'ENGINE OFF'}</span>
                  <span className="text-[9px] opacity-80">[SPACEBAR]</span>
                </button>
              </div>

              <div className="lg:col-span-4 flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-3">
                <div className="flex gap-1.5">
                  <button
                    onMouseDown={() => sceneControlRef.current?.setInput('left', true)}
                    onMouseUp={() => sceneControlRef.current?.setInput('left', false)}
                    onMouseLeave={() => sceneControlRef.current?.setInput('left', false)}
                    onTouchStart={() => sceneControlRef.current?.setInput('left', true)}
                    onTouchEnd={() => sceneControlRef.current?.setInput('left', false)}
                    className="p-3.5 bg-slate-800 hover:bg-indigo-600 active:scale-95 rounded-xl text-white transition"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <button
                    onMouseDown={() => sceneControlRef.current?.setInput('right', true)}
                    onMouseUp={() => sceneControlRef.current?.setInput('right', false)}
                    onMouseLeave={() => sceneControlRef.current?.setInput('right', false)}
                    onTouchStart={() => sceneControlRef.current?.setInput('right', true)}
                    onTouchEnd={() => sceneControlRef.current?.setInput('right', false)}
                    className="p-3.5 bg-slate-800 hover:bg-indigo-600 active:scale-95 rounded-xl text-white transition"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onMouseDown={() => sceneControlRef.current?.setInput('down', true)}
                    onMouseUp={() => sceneControlRef.current?.setInput('down', false)}
                    onMouseLeave={() => sceneControlRef.current?.setInput('down', false)}
                    onTouchStart={() => sceneControlRef.current?.setInput('down', true)}
                    onTouchEnd={() => sceneControlRef.current?.setInput('down', false)}
                    className="px-4 py-3 bg-rose-900/70 hover:bg-rose-700 active:scale-95 border border-rose-600/50 rounded-xl text-xs font-black text-rose-200 flex flex-col items-center"
                  >
                    <ArrowDown size={18} />
                    <span>BRAKE [S]</span>
                  </button>

                  <button
                    onMouseDown={() => sceneControlRef.current?.setInput('up', true)}
                    onMouseUp={() => sceneControlRef.current?.setInput('up', false)}
                    onMouseLeave={() => sceneControlRef.current?.setInput('up', false)}
                    onTouchStart={() => sceneControlRef.current?.setInput('up', true)}
                    onTouchEnd={() => sceneControlRef.current?.setInput('up', false)}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl text-xs font-black text-white flex flex-col items-center shadow-lg shadow-emerald-600/30"
                  >
                    <ArrowUp size={18} />
                    <span>GAS [W]</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY SCREEN */}
        {game.stage === 'summary' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-3xl mx-auto">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
              <FileText className="text-indigo-400" size={30} />
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                  Official Closing Disclosure Scorecard
                </div>
                <h2 className="text-2xl font-black text-white">
                  Title Office Settlement • {game.profile?.name}
                </h2>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border mb-6 ${
              game.cashReserves >= 3500
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                : game.cashReserves >= 0
                ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                : 'bg-rose-950/40 border-rose-500 text-rose-200'
            }`}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1">Final Readiness Rating</div>
              <div className="text-2xl font-black text-white mb-1">
                {game.cashReserves >= 3500 && '🏆 Grade A: Empowered Homebuyer (Keys Unlocked!)'}
                {game.cashReserves >= 0 && game.cashReserves < 3500 && '⚠️ Grade C: Closed, But "House Poor"'}
                {game.cashReserves < 0 && '❌ Grade F: Cash-to-Close Default'}
              </div>
              <p className="text-xs leading-relaxed">
                {game.cashReserves >= 3500 &&
                  `You applied the homebuying concepts, funded your $4,200 Escrow tank, and kept $${game.cashReserves.toLocaleString()} in emergency reserves!`}
                {game.cashReserves >= 0 && game.cashReserves < 3500 &&
                  `You closed the deal, but with only $${game.cashReserves.toLocaleString()} left in the bank, any surprise home repair could force you into debt.`}
                {game.cashReserves < 0 &&
                  `You arrived $${Math.abs(game.cashReserves).toLocaleString()} short of the required Cash to Close. Review the Field Guide and try negotiating credits and cutting your engine in delays!`}
              </p>
            </div>

            <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 mb-6 space-y-2.5 max-h-72 overflow-y-auto">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Itemized Closing Ledger & Decision Review
              </div>
              {game.history.map((h, i) => (
                <div key={i} className="border-b border-slate-900 pb-2 last:border-none">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-200">{h.item}</span>
                    <span className={h.cost < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      {h.cost >= 0 ? `+$${h.cost.toLocaleString()}` : `-$${Math.abs(h.cost).toLocaleString()}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{h.lesson}</p>
                </div>
              ))}
              <div className="border-t border-slate-800 pt-3 flex justify-between text-base font-black text-white">
                <span>Remaining Post-Closing Cash Reserve:</span>
                <span className={game.cashReserves >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  ${game.cashReserves.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleStartNewGame(game.profile)}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <RotateCcw size={18} /> Drive Again
              </button>
              <button
                onClick={handleReset}
                className="py-4 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl transition"
              >
                Review Tutorial / Switch Loan
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}