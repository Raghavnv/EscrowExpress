import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, ShieldAlert, DollarSign, Gauge, Zap, RotateCcw,
  User, Radio, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, BookOpen, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PhaserCanvas from './components/PhaserCanvas';
import OnboardingFlow from './components/OnboardingFlow';

const STORAGE_KEY = 'nest_navigate_arcade_v6';

const INITIAL_GAME = {
  stage: 'onboarding',
  profile: null,
  cashReserves: 12000,
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
    turboActive: false
  });

  const [radioMessage, setRadioMessage] = useState({
    title: 'CB RADIO: HOLD [W / ▲] TO HIT THE HIGHWAY!',
    desc: 'Steer with [A/D or ◀/▶] through the 6 overhead highway checkpoints! Pick the smart financial lane at each fork!'
  });

  const sceneControlRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  const handleStartNewGame = (profileData) => {
    const startCash = profileData.startingCash - profileData.pmiPenalty;
    const startHistory = [
      {
        item: 'Starting Cash-to-Close Reserve Tank',
        cost: startCash,
        lesson: 'Your initial liquid savings ready for closing day milestones.'
      }
    ];

    setGame({
      stage: 'playing',
      profile: profileData,
      cashReserves: startCash,
      escrowFunded: 0,
      escrowRequired: 4200,
      history: startHistory
    });

    setRadioMessage({
      title: 'MOVING DAY STARTED — HOLD [W / ▲] TO DRIVE!',
      desc: 'Watch the 3-lane overhead arches ahead! Steer Left, Center, or Right based on what you learned in the Field Manual!'
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

  const handleEscrowCheckpoint = () => {
    setGame((prev) => ({
      ...prev,
      escrowFunded: prev.escrowRequired
    }));
  };

  const handleFinishLine = () => {
    confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
    setGame((prev) => ({ ...prev, stage: 'summary' }));
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGame(INITIAL_GAME);
  };

  const milesTraveled = (telemetry.distance / 1000).toFixed(1);
  const progressPct = Math.min(100, (telemetry.distance / 5000) * 100);

  return (
    <div className="min-h-screen flex flex-col select-none pb-8">
      {/* Top Arcade Bar */}
      <header className="bg-amber-300 border-b-4 border-zinc-900 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500 rounded-xl text-white border-2 border-zinc-900 shadow-[2px_2px_0px_#18181B]">
            <Truck size={22} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-zinc-900 leading-none">
              ESCROW EXPRESS!
            </h1>
            <p className="text-[11px] font-bold text-zinc-700">Nest Navigate • Homebuyer Road Trip</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {game.stage === 'playing' && (
            <button
              onClick={() => setShowGlossaryModal(true)}
              className="arcade-btn bg-sky-300 hover:bg-sky-200 text-zinc-900 text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5"
            >
              <BookOpen size={15} /> Field Manual
            </button>
          )}
          {game.profile && (
            <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border-2 border-zinc-900 text-xs font-bold text-zinc-900">
              <User size={14} className="text-rose-500" />
              <span>{game.profile.name}</span>
            </div>
          )}
          {game.stage !== 'onboarding' && (
            <button
              onClick={handleReset}
              className="arcade-btn bg-white hover:bg-rose-100 text-zinc-900 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> Main Menu
            </button>
          )}
        </div>
      </header>

      {/* Field Manual Modal */}
      {showGlossaryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="arcade-card bg-amber-50 rounded-3xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between border-b-3 border-zinc-900 pb-3 mb-4">
              <h3 className="font-display text-xl font-bold text-zinc-900 flex items-center gap-2">
                <BookOpen size={20} className="text-rose-500" /> Pocket Homebuyer Cheat-Sheet
              </h3>
              <button onClick={() => setShowGlossaryModal(false)} className="arcade-btn bg-rose-400 text-white p-1.5 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2.5 text-xs font-medium text-zinc-800 max-h-80 overflow-y-auto pr-1">
              <div className="p-3 bg-white border-2 border-zinc-900 rounded-xl">
                <strong className="text-rose-600 block text-sm">1. Home Inspection:</strong>
                Request a <strong>Seller Credit</strong> so the seller pays for defects rather than waiving inspection or paying out of pocket.
              </div>
              <div className="p-3 bg-white border-2 border-zinc-900 rounded-xl">
                <strong className="text-sky-600 block text-sm">2. Loan Estimate Review:</strong>
                <strong>Audit your Loan Estimate</strong> to strip out padded "Express Courier" junk fees.
              </div>
              <div className="p-3 bg-white border-2 border-zinc-900 rounded-xl">
                <strong className="text-amber-600 block text-sm">3. Interest Rate Volatility:</strong>
                Choose a <strong>30-Day Rate Lock</strong> so market interest spikes don't raise your costs during underwriting.
              </div>
              <div className="p-3 bg-white border-2 border-zinc-900 rounded-xl">
                <strong className="text-emerald-600 block text-sm">4. Low Appraisal:</strong>
                <strong>Appeal with Comps</strong> (comparable neighborhood sales) instead of paying the appraisal gap in cash.
              </div>
              <div className="p-3 bg-white border-2 border-zinc-900 rounded-xl">
                <strong className="text-purple-600 block text-sm">5. Escrow & Closing Wire:</strong>
                Claim <strong>Escrow + Seller Tax Credit</strong>, and always <strong>Call the Title Office directly</strong> to verify wire instructions!
              </div>
            </div>
            <button
              onClick={() => setShowGlossaryModal(false)}
              className="mt-5 w-full arcade-btn bg-emerald-400 py-3 font-display font-bold text-base rounded-xl"
            >
              BACK TO THE ROAD!
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 pt-5">
        {game.stage === 'onboarding' && (
          <OnboardingFlow
            existingSave={game.profile ? game : null}
            onStartNewGame={handleStartNewGame}
            onResumeGame={() => setGame((prev) => ({ ...prev, stage: 'playing' }))}
          />
        )}

        {game.stage === 'playing' && (
          <div className="space-y-4">
            {/* Walkie-Talkie CB Radio Banner */}
            <div className="arcade-card rounded-2xl p-4 flex items-center gap-4 bg-amber-200">
              <div className="p-3 rounded-2xl bg-zinc-900 text-amber-300 shrink-0">
                <Radio size={24} />
              </div>
              <div className="flex-1">
                <div className="font-display text-sm sm:text-base font-bold text-zinc-900">
                  {radioMessage.title}
                </div>
                <div className="text-xs font-bold text-zinc-800 mt-0.5">
                  {radioMessage.desc}
                </div>
              </div>
              <div className="hidden md:block text-right shrink-0 bg-white border-3 border-zinc-900 px-4 py-2 rounded-xl shadow-[3px_3px_0px_#18181B]">
                <div className="text-[10px] font-black uppercase text-zinc-500">Mile Marker</div>
                <div className="font-display text-xl font-bold text-rose-600">{milesTraveled} / 5.0 mi</div>
              </div>
            </div>

            {/* 3D FOV Phaser Highway Canvas */}
            <PhaserCanvas
              truckColor={game.profile?.truckColor || 0xf43f5e}
              onTelemetryUpdate={setTelemetry}
              onObstacleHit={handleObstacleHit}
              onEscrowCheckpoint={handleEscrowCheckpoint}
              onFinishLine={handleFinishLine}
              sceneControlRef={sceneControlRef}
            />

            {/* Tactile Toy-Box Arcade Cockpit */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 arcade-card bg-white rounded-3xl p-4">
              {/* Cash Fuel & Escrow Gauges */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                <div className={`p-3.5 rounded-2xl border-3 border-zinc-900 shadow-[3px_3px_0px_#18181B] ${
                  game.cashReserves < 6000 ? 'bg-amber-200' : 'bg-emerald-200'
                }`}>
                  <div className="text-[11px] font-black uppercase text-zinc-800 flex items-center gap-1">
                    <DollarSign size={14} /> Cash-to-Close Tank
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-0.5">
                    ${game.cashReserves.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-700 mt-1">
                    Target for Grade A: $11,000+
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border-3 border-zinc-900 bg-sky-200 shadow-[3px_3px_0px_#18181B]">
                  <div className="text-[11px] font-black uppercase text-zinc-800 flex items-center gap-1">
                    <ShieldAlert size={14} /> Escrow Trailer
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-0.5">
                    {game.escrowFunded > 0 ? 'FUNDED!' : 'MILE 3.9'}
                  </div>
                  <div className="w-full bg-white border-2 border-zinc-900 h-3 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-sky-500 h-full transition-all duration-500"
                      style={{ width: `${(game.escrowFunded / game.escrowRequired) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Speedometer & Turbo Switch */}
              <div className="lg:col-span-3 flex items-center justify-around bg-amber-100 border-3 border-zinc-900 rounded-2xl p-3 shadow-[3px_3px_0px_#18181B]">
                <div className="text-center">
                  <div className="text-[10px] font-black uppercase text-zinc-700 flex items-center gap-1 justify-center">
                    <Gauge size={13} /> Speed
                  </div>
                  <div className="font-display text-3xl font-bold text-zinc-900">
                    {telemetry.speed} <span className="text-xs">MPH</span>
                  </div>
                  <div className="w-24 bg-white border-2 border-zinc-900 h-2.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                <button
                  onClick={() => sceneControlRef.current?.toggleTurbo()}
                  className={`arcade-btn px-4 py-3 rounded-2xl font-display font-bold text-xs flex flex-col items-center gap-1 ${
                    telemetry.turboActive ? 'bg-amber-400 text-zinc-900' : 'bg-white text-zinc-900'
                  }`}
                >
                  <Zap size={18} />
                  <span>{telemetry.turboActive ? 'TURBO ON' : 'TURBO'}</span>
                  <span className="text-[9px] font-sans font-black">[SPACE]</span>
                </button>
              </div>

              {/* Arcade Pedals & Steering Buttons */}
              <div className="lg:col-span-4 flex items-center justify-between gap-2 bg-zinc-100 border-3 border-zinc-900 rounded-2xl p-3 shadow-[3px_3px_0px_#18181B]">
                <div className="flex gap-2">
                  <button
                    onMouseDown={() => sceneControlRef.current?.setInput('left', true)}
                    onMouseUp={() => sceneControlRef.current?.setInput('left', false)}
                    onMouseLeave={() => sceneControlRef.current?.setInput('left', false)}
                    onTouchStart={() => sceneControlRef.current?.setInput('left', true)}
                    onTouchEnd={() => sceneControlRef.current?.setInput('left', false)}
                    className="arcade-btn p-3.5 bg-amber-300 hover:bg-amber-200 rounded-xl text-zinc-900"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <button
                    onMouseDown={() => sceneControlRef.current?.setInput('right', true)}
                    onMouseUp={() => sceneControlRef.current?.setInput('right', false)}
                    onMouseLeave={() => sceneControlRef.current?.setInput('right', false)}
                    onTouchStart={() => sceneControlRef.current?.setInput('right', true)}
                    onTouchEnd={() => sceneControlRef.current?.setInput('right', false)}
                    className="arcade-btn p-3.5 bg-amber-300 hover:bg-amber-200 rounded-xl text-zinc-900"
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
                    className="arcade-btn px-4 py-2.5 bg-rose-400 hover:bg-rose-300 text-white rounded-xl text-xs font-black flex flex-col items-center"
                  >
                    <ArrowDown size={18} />
                    <span>SLOW [S]</span>
                  </button>

                  <button
                    onMouseDown={() => sceneControlRef.current?.setInput('up', true)}
                    onMouseUp={() => sceneControlRef.current?.setInput('up', false)}
                    onMouseLeave={() => sceneControlRef.current?.setInput('up', false)}
                    onTouchStart={() => sceneControlRef.current?.setInput('up', true)}
                    onTouchEnd={() => sceneControlRef.current?.setInput('up', false)}
                    className="arcade-btn px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-900 rounded-xl text-xs font-black flex flex-col items-center"
                  >
                    <ArrowUp size={18} />
                    <span>GAS [W]</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY SCREEN: TROPHY & CLOSING DISCLOSURE */}
        {game.stage === 'summary' && (
          <div className="arcade-card bg-white rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 border-b-4 border-zinc-900 pb-4 mb-6">
              <div className="p-3 bg-amber-300 border-3 border-zinc-900 rounded-2xl">
                <Trophy className="text-zinc-900" size={30} />
              </div>
              <div>
                <div className="text-xs font-black uppercase text-rose-500">
                  Official Closing Disclosure & Trophy Room
                </div>
                <h2 className="font-display text-3xl font-bold text-zinc-900">
                  Closing Day Report • {game.profile?.name}
                </h2>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border-4 border-zinc-900 shadow-[5px_5px_0px_#18181B] mb-6 ${
              game.cashReserves >= 11000
                ? 'bg-emerald-300'
                : game.cashReserves >= 6500
                ? 'bg-amber-200'
                : 'bg-rose-300'
            }`}>
              <div className="text-xs font-black uppercase text-zinc-900 mb-1">Final Homebuyer Grade</div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mb-1">
                {game.cashReserves >= 11000 && '🏆 GRADE A: MASTER HOMEBUYER (KEYS UNLOCKED!)'}
                {game.cashReserves >= 6500 && game.cashReserves < 11000 && '👍 GRADE B: CLOSED THE DEAL, TIGHT RESERVES!'}
                {game.cashReserves < 6500 && '⚠️ GRADE C: HOUSE POOR — REVIEW THE FIELD MANUAL!'}
              </div>
              <p className="text-xs sm:text-sm font-bold text-zinc-900">
                {game.cashReserves >= 11000 &&
                  `Awesome driving! You navigated all 6 closing checkpoints, funded your Escrow Trailer, and finished with $${game.cashReserves.toLocaleString()} in cash reserves!`}
                {game.cashReserves >= 6500 && game.cashReserves < 11000 &&
                  `You got the keys with $${game.cashReserves.toLocaleString()} left! Try steering into Seller Credits, Rate Locks, and Comps Appeals to boost your score to Grade A!`}
                {game.cashReserves < 6500 &&
                  `You finished with $${game.cashReserves.toLocaleString()}. Check the Field Manual to see how Seller Credits, Auditing Loan Estimates, and Comps Appeals protect your cash!`}
              </p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-5 border-3 border-zinc-900 mb-6 space-y-3 max-h-72 overflow-y-auto">
              <div className="text-xs font-black uppercase text-zinc-600 mb-2">
                Checkpoint-by-Checkpoint Closing Ledger
              </div>
              {game.history.map((h, i) => (
                <div key={i} className="bg-white border-2 border-zinc-900 rounded-xl p-3">
                  <div className="flex justify-between text-xs font-black text-zinc-900">
                    <span>{h.item}</span>
                    <span className={h.cost < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {h.cost >= 0 ? `+$${h.cost.toLocaleString()}` : `-$${Math.abs(h.cost).toLocaleString()}`}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-zinc-700 mt-1">{h.lesson}</p>
                </div>
              ))}
              <div className="border-t-3 border-zinc-900 pt-3 flex justify-between font-display text-xl font-bold text-zinc-900">
                <span>Final Cash Reserve Balance:</span>
                <span className="text-emerald-600">
                  ${game.cashReserves.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleStartNewGame(game.profile)}
                className="flex-1 arcade-btn py-4 bg-emerald-400 hover:bg-emerald-300 text-zinc-900 font-display font-bold text-xl rounded-2xl flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} /> PLAY AGAIN
              </button>
              <button
                onClick={handleReset}
                className="arcade-btn py-4 px-6 bg-amber-300 hover:bg-amber-200 text-zinc-900 font-display font-bold text-lg rounded-2xl"
              >
                GARAGE & FIELD MANUAL
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
