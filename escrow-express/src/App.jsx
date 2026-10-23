import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, ShieldAlert, DollarSign, Gauge, Power, RotateCcw,
  User, Radio, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, BookOpen, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PhaserCanvas from './components/PhaserCanvas';
import OnboardingFlow from './components/OnboardingFlow';

const STORAGE_KEY = 'nest_navigate_arcade_v5';

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
    title: 'CB RADIO: HOLD [W / ▲] TO HIT THE ROAD!',
    desc: 'Read the yellow highway signs carefully and steer [A/D or ◀/▶] into the smart financial lane!'
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
        lesson: 'Low-down-payment FHA loans deduct an upfront insurance fee at closing.'
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
      title: 'MOVING DAY STARTED — HOLD [W / ▲] TO DRIVE!',
      desc: 'Lender Origination Fees (-$1,800) were deducted. Watch the yellow road signs ahead—none are color-coded, so use what you learned!'
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
        ? `🚨 UNDERWRITING DELAY (${timeLeft}s): BURNING -$150/SEC!`
        : `❄️ ENGINE OFF (${timeLeft}s LEFT): RATE LOCK PAUSED!`,
      desc: engineOn
        ? 'Your 30-day Rate Lock is expiring in traffic! Remember how to stop daily extension fees?'
        : 'Awesome! Cutting your engine froze your Rate Lock so you lose $0 while waiting.'
    });
  };

  const handleTrafficCleared = () => {
    setRadioMessage({
      title: '🟢 UNDERWRITING CLEARED! RESTART ENGINE [SPACE] & DRIVE!',
      desc: 'Turn your engine back on and hold [W / ▲] to reach the Escrow Weigh Station at Mile 3.8!'
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
          lesson: 'Lenders require you to prepay property taxes ($2,400) and hazard insurance ($1,800) into an Escrow Reserve account.'
        }
      ]
    }));
    setRadioMessage({
      title: '⚖️ ESCROW TANK FILLED (-$4,200)!',
      desc: '6 months of taxes and 12 months of hazard insurance are locked in your Escrow Trailer. Sprint to the Title Office!'
    });
  };

  const handleFinishLine = () => {
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
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
      {/* Festive Top Arcade Bar */}
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

      {/* Field Manual Pop-up Modal */}
      {showGlossaryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="arcade-card bg-amber-50 rounded-3xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between border-b-3 border-zinc-900 pb-3 mb-4">
              <h3 className="font-display text-xl font-bold text-zinc-900 flex items-center gap-2">
                <BookOpen size={20} className="text-rose-500" /> Pocket Homebuyer Manual
              </h3>
              <button onClick={() => setShowGlossaryModal(false)} className="arcade-btn bg-rose-400 text-white p-1.5 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs font-medium text-zinc-800 max-h-80 overflow-y-auto pr-1">
              <div className="p-3 bg-white border-2 border-zinc-900 rounded-xl">
                <strong className="text-rose-600 block text-sm">Inspection & Seller Credits:</strong>
                Ask the seller for a Closing Credit to cover repairs instead of paying out-of-pocket or risking uninspected defects!
              </div>
              <div className="p-3 bg-white border-2 border-zinc-900 rounded-xl">
                <strong className="text-sky-600 block text-sm">Loan Estimate Audit vs. Junk Fees:</strong>
                Audit your Loan Estimate to remove padded "Express Courier" junk fees.
              </div>
              <div className="p-3 bg-white border-2 border-zinc-900 rounded-xl">
                <strong className="text-amber-600 block text-sm">Underwriting & Rate Lock:</strong>
                Cut your engine [SPACEBAR] during traffic delays so your 30-day Rate Lock doesn’t burn daily extension fees!
              </div>
              <div className="p-3 bg-white border-2 border-zinc-900 rounded-xl">
                <strong className="text-emerald-600 block text-sm">Appraisal Comps Appeal:</strong>
                Use neighborhood Comparable Sales ("Comps") to appeal a low appraisal instead of paying the gap in cash.
              </div>
            </div>
            <button
              onClick={() => setShowGlossaryModal(false)}
              className="mt-5 w-full arcade-btn bg-emerald-400 py-3 font-display font-bold text-base rounded-xl"
            >
              RESUME DRIVING!
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
            <div className={`arcade-card rounded-2xl p-4 flex items-center gap-4 transition ${
              telemetry.inTrafficJam ? 'bg-rose-300 animate-bounce' : 'bg-amber-200'
            }`}>
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
              onTrafficTick={handleTrafficTick}
              onTrafficCleared={handleTrafficCleared}
              onEscrowCheckpoint={handleEscrowCheckpoint}
              onFinishLine={handleFinishLine}
              sceneControlRef={sceneControlRef}
            />

            {/* Tactile Toy-Box Arcade Cockpit */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 arcade-card bg-white rounded-3xl p-4">
              {/* Cash Fuel & Escrow Gauges */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                <div className={`p-3.5 rounded-2xl border-3 border-zinc-900 shadow-[3px_3px_0px_#18181B] ${
                  game.cashReserves < 2500 ? 'bg-rose-200' : 'bg-emerald-200'
                }`}>
                  <div className="text-[11px] font-black uppercase text-zinc-800 flex items-center gap-1">
                    <DollarSign size={14} /> Cash-to-Close Fuel
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-0.5">
                    ${game.cashReserves.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-700 mt-1">
                    Down Pmt Locked: ${(game.profile?.downPayment || 30000).toLocaleString()}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border-3 border-zinc-900 bg-sky-200 shadow-[3px_3px_0px_#18181B]">
                  <div className="text-[11px] font-black uppercase text-zinc-800 flex items-center gap-1">
                    <ShieldAlert size={14} /> Escrow Trailer
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-0.5">
                    ${game.escrowFunded.toLocaleString()}
                  </div>
                  <div className="w-full bg-white border-2 border-zinc-900 h-3 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-sky-500 h-full transition-all duration-500"
                      style={{ width: `${(game.escrowFunded / game.escrowRequired) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Speedometer & Engine Ignition Switch */}
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
                  onClick={() => sceneControlRef.current?.toggleEngine()}
                  className={`arcade-btn px-4 py-3 rounded-2xl font-display font-bold text-xs flex flex-col items-center gap-1 ${
                    telemetry.engineRunning ? 'bg-emerald-400 text-zinc-900' : 'bg-sky-400 text-zinc-900'
                  }`}
                >
                  <Power size={18} />
                  <span>{telemetry.engineRunning ? 'ENGINE ON' : 'ENGINE CUT'}</span>
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
                    <span>BRAKE [S]</span>
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
              game.cashReserves >= 3500
                ? 'bg-emerald-300'
                : game.cashReserves >= 0
                ? 'bg-amber-200'
                : 'bg-rose-300'
            }`}>
              <div className="text-xs font-black uppercase text-zinc-900 mb-1">Final Homebuyer Grade</div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mb-1">
                {game.cashReserves >= 3500 && '🏆 GRADE A: MASTER HOMEBUYER (KEYS UNLOCKED!)'}
                {game.cashReserves >= 0 && game.cashReserves < 3500 && '⚠️ GRADE C: GOT THE KEYS, BUT "HOUSE POOR"!'}
                {game.cashReserves < 0 && '❌ GRADE F: CASH-TO-CLOSE SHORTFALL!'}
              </div>
              <p className="text-xs sm:text-sm font-bold text-zinc-900">
                {game.cashReserves >= 3500 &&
                  `Awesome driving! You funded your $4,200 Escrow Trailer and still kept $${game.cashReserves.toLocaleString()} in emergency post-closing savings!`}
                {game.cashReserves >= 0 && game.cashReserves < 3500 &&
                  `You closed on the house, but with only $${game.cashReserves.toLocaleString()} left in the bank, a single leaky pipe could force you into credit card debt!`}
                {game.cashReserves < 0 &&
                  `You arrived $${Math.abs(game.cashReserves).toLocaleString()} short of the required Cash to Close. Check the Field Manual and try negotiating Seller Credits and cutting your engine in delays!`}
              </p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-5 border-3 border-zinc-900 mb-6 space-y-3 max-h-72 overflow-y-auto">
              <div className="text-xs font-black uppercase text-zinc-600 mb-2">
                Itemized Closing Receipt & Real-World Lessons
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
                <span>Remaining Post-Closing Cash Reserve:</span>
                <span className={game.cashReserves >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
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