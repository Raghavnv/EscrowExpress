import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, ShieldAlert, DollarSign, Gauge, Zap, RotateCcw,
  User, Radio, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  BookOpen, X, FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PhaserCanvas from './components/PhaserCanvas';
import OnboardingFlow, { STAGE_GUIDES } from './components/OnboardingFlow';

const STORAGE_KEY = 'nest_navigate_arcade_v9';

const CLOSING_TABLE_ITEMS = [
  { id: 'appraisal', name: 'Licensed Independent Home Appraisal', amount: 550, isJunk: false, note: 'Required by the lender to verify fair market value.' },
  { id: 'courier', name: 'VIP Express Paperwork Courier & Beverage Fee', amount: 850, isJunk: true, note: 'Bogus padded lender Junk Fee! Crossing this out saves $850!' },
  { id: 'title', name: 'Owner’s & Lender’s Title Insurance Policy', amount: 1100, isJunk: false, note: 'Legitimate fee protecting your legal ownership against prior liens.' },
  { id: 'processing', name: 'Duplicate "File Storage & Email Handling" Surcharge', amount: 750, isJunk: true, note: 'Classic padded administrative Junk Fee! Crossing this out saves $750!' },
  { id: 'recording', name: 'County Government Deed Recording Tax', amount: 350, isJunk: false, note: 'Mandatory county government fee to register the house in your name.' }
];

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
  const [flaggedFees, setFlaggedFees] = useState([]);

  const [telemetry, setTelemetry] = useState({
    speed: 0,
    distance: 0,
    targetDistance: 5000,
    turboActive: false,
    currentStage: 1
  });

  const [radioMessage, setRadioMessage] = useState({
    title: 'CB RADIO: HOLD [W / ▲] TO DRIVE!',
    desc: 'Steer into smart financial lanes! Your vehicle upgrades with gold trim as your cash grows!'
  });

  const sceneControlRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  const handleStartNewGame = (profileData) => {
    const startCash = profileData.startingCash - profileData.pmiPenalty;
    const startHistory = [
      {
        item: `Starting Cash Tank (${profileData.loanType})`,
        cost: startCash,
        lesson: 'Your initial liquid savings ready for closing day milestones.'
      }
    ];

    setFlaggedFees([]);
    setGame({
      stage: 'playing',
      profile: profileData,
      cashReserves: startCash,
      escrowFunded: 0,
      escrowRequired: 4200,
      history: startHistory
    });

    setRadioMessage({
      title: `${profileData.campaignMiles}-MILE RUN STARTED — HOLD [W / ▲] TO DRIVE!`,
      desc: 'Watch the pinned signboard at the top of the windshield as you approach each fork!'
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
    setGame((prev) => ({ ...prev, stage: 'boss_audit' }));
  };

  const toggleFeeFlag = (id) => {
    setFlaggedFees((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSignFinalDeed = () => {
    let auditBonus = 0;
    const auditLogs = [];

    CLOSING_TABLE_ITEMS.forEach((item) => {
      const wasFlagged = flaggedFees.includes(item.id);
      if (item.isJunk && wasFlagged) {
        auditBonus += item.amount;
        auditLogs.push({
          item: `Closing Audit: Removed "${item.name}"`,
          cost: item.amount,
          lesson: item.note
        });
      } else if (!item.isJunk && wasFlagged) {
        auditBonus -= 400;
        auditLogs.push({
          item: `Closing Delay: Tried to Refuse Mandatory "${item.name}"`,
          cost: -400,
          lesson: `You cannot refuse legitimate required charges (${item.note})`
        });
      }
    });

    confetti({ particleCount: 150, spread: 85, origin: { y: 0.6 } });
    setGame((prev) => ({
      ...prev,
      stage: 'summary',
      cashReserves: prev.cashReserves + auditBonus,
      history: [...prev.history, ...auditLogs]
    }));
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGame(INITIAL_GAME);
  };

  const totalMiles = ((game.profile?.targetDistance || 5000) / 1000).toFixed(1);
  const milesTraveled = (telemetry.distance / 1000).toFixed(1);
  const progressPct = Math.min(100, (telemetry.distance / (game.profile?.targetDistance || 5000)) * 100);
  const gradeATarget = game.profile?.campaignMode === 'full' ? 15000 : 13000;

  return (
    <div className="min-h-screen flex flex-col select-none">
      {/* Compact Header */}
      <header className="bg-amber-300 border-b-3 border-zinc-900 px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-rose-500 rounded-xl text-white border-2 border-zinc-900">
            <Truck size={20} />
          </div>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-zinc-900 leading-none">
              ESCROW EXPRESS!
            </h1>
            <p className="text-[11px] font-bold text-zinc-800">
              {game.profile ? `${game.profile.loanType} • ${game.profile.campaignMiles} Miles` : 'Homebuyer Road Trip'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {game.stage === 'playing' && (
            <button
              onClick={() => setShowGlossaryModal(true)}
              className="arcade-btn bg-sky-300 hover:bg-sky-200 text-zinc-900 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1"
            >
              <BookOpen size={14} /> 9 Terms Guide
            </button>
          )}
          {game.profile && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border-2 border-zinc-900 text-xs font-bold text-zinc-900">
              <User size={14} className="text-rose-500" />
              <span>{game.profile.name}</span>
            </div>
          )}
          {game.stage !== 'onboarding' && (
            <button
              onClick={handleReset}
              className="arcade-btn bg-white hover:bg-rose-100 text-zinc-900 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
            >
              <RotateCcw size={13} /> Menu
            </button>
          )}
        </div>
      </header>

      {/* 9-Term Field Manual Modal */}
      {showGlossaryModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="arcade-card bg-amber-50 rounded-3xl max-w-2xl w-full p-5 sm:p-6">
            <div className="flex items-center justify-between border-b-3 border-zinc-900 pb-3 mb-4">
              <h3 className="font-display text-xl font-bold text-zinc-900 flex items-center gap-2">
                <BookOpen size={20} className="text-rose-500" /> Complete 9-Term Homebuyer Guide
              </h3>
              <button onClick={() => setShowGlossaryModal(false)} className="arcade-btn bg-rose-400 text-white p-1.5 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {STAGE_GUIDES.map((st) => (
                <div key={st.stageNum} className="space-y-2">
                  <div className="font-display text-sm font-bold text-zinc-900 bg-amber-300 border-2 border-zinc-900 px-3 py-0.5 rounded-lg inline-block">
                    {st.stageTitle}
                  </div>
                  {st.terms.map((t, idx) => (
                    <div key={idx} className="p-3 bg-white border-2 border-zinc-900 rounded-xl">
                      <div className="font-display font-bold text-sm text-zinc-900">
                        {t.icon} {t.title}
                      </div>
                      <p className="text-xs text-zinc-800 mt-0.5">{t.meaning}</p>
                      <p className="text-xs font-bold text-indigo-700 mt-1">🎯 Tip: {t.highwayTip}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowGlossaryModal(false)}
              className="mt-4 w-full arcade-btn bg-emerald-400 py-2.5 font-display font-bold text-base rounded-xl"
            >
              RESUME DRIVING!
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-5 py-3 flex flex-col justify-center">
        {game.stage === 'onboarding' && (
          <OnboardingFlow
            existingSave={game.profile ? game : null}
            onStartNewGame={handleStartNewGame}
            onResumeGame={() => setGame((prev) => ({ ...prev, stage: 'playing' }))}
          />
        )}

        {game.stage === 'playing' && (
          <div className="space-y-2.5">
            {/* Fixed-Height CB Radio Bar (Never jumps or resizes!) */}
            <div className="arcade-card rounded-2xl px-4 py-2.5 h-[64px] flex items-center gap-3 bg-amber-200 overflow-hidden">
              <div className="p-2 rounded-xl bg-zinc-900 text-amber-300 shrink-0">
                <Radio size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-sm font-bold text-zinc-900 truncate">
                  {radioMessage.title}
                </div>
                <div className="text-xs font-bold text-zinc-800 truncate">
                  {radioMessage.desc}
                </div>
              </div>
              <div className="hidden md:block text-right shrink-0 bg-white border-2 border-zinc-900 px-3 py-1 rounded-xl">
                <div className="text-[10px] font-black uppercase text-zinc-500">
                  Stage {telemetry.currentStage} / 3
                </div>
                <div className="font-display text-base font-bold text-rose-600">
                  {milesTraveled} / {totalMiles} mi
                </div>
              </div>
            </div>

            {/* 3D FOV Phaser Highway Canvas */}
            <PhaserCanvas
              truckColor={game.profile?.truckColor || 0xf43f5e}
              vehicleType={game.profile?.vehicleType || 'rig'}
              cashReserves={game.cashReserves}
              campaignMode={game.profile?.campaignMode || 'express'}
              onTelemetryUpdate={setTelemetry}
              onObstacleHit={handleObstacleHit}
              onEscrowCheckpoint={handleEscrowCheckpoint}
              onFinishLine={handleFinishLine}
              sceneControlRef={sceneControlRef}
            />

            {/* Compact Single-Screen Cockpit Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 arcade-card bg-white rounded-2xl p-3">
              <div className="lg:col-span-5 grid grid-cols-2 gap-2.5">
                <div className={`px-3 py-2 rounded-xl border-2 border-zinc-900 ${
                  game.cashReserves >= 13500
                    ? 'bg-amber-300'
                    : game.cashReserves < 8500
                    ? 'bg-rose-200'
                    : 'bg-emerald-200'
                }`}>
                  <div className="text-[10px] font-black uppercase text-zinc-800 flex items-center justify-between">
                    <span className="flex items-center gap-1"><DollarSign size={12} /> Cash Tank</span>
                    <span>{game.cashReserves >= 13500 ? '👑 VIP GOLD' : game.cashReserves < 8500 ? '⚠️ LOW' : '✓ GOOD'}</span>
                  </div>
                  <div className="font-display text-xl sm:text-2xl font-bold text-zinc-900">
                    ${game.cashReserves.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-700">
                    Grade A Target: ${gradeATarget.toLocaleString()}+
                  </div>
                </div>

                <div className="px-3 py-2 rounded-xl border-2 border-zinc-900 bg-sky-200">
                  <div className="text-[10px] font-black uppercase text-zinc-800 flex items-center gap-1">
                    <ShieldAlert size={12} /> Escrow Tank
                  </div>
                  <div className="font-display text-xl sm:text-2xl font-bold text-zinc-900">
                    {game.escrowFunded > 0 ? 'FUNDED!' : 'STAGE 3'}
                  </div>
                  <div className="w-full bg-white border border-zinc-900 h-2 rounded-full mt-1 overflow-hidden">
                    <div
                      className="bg-sky-500 h-full transition-all duration-500"
                      style={{ width: `${(game.escrowFunded / game.escrowRequired) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 flex items-center justify-around bg-amber-100 border-2 border-zinc-900 rounded-xl px-3 py-2">
                <div className="text-center">
                  <div className="text-[10px] font-black uppercase text-zinc-700 flex items-center gap-1 justify-center">
                    <Gauge size={12} /> Speed
                  </div>
                  <div className="font-display text-2xl font-bold text-zinc-900">
                    {telemetry.speed} <span className="text-[10px]">MPH</span>
                  </div>
                  <div className="w-20 bg-white border border-zinc-900 h-2 rounded-full mt-0.5 overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                <button
                  onClick={() => sceneControlRef.current?.toggleTurbo()}
                  className={`arcade-btn px-3 py-2 rounded-xl font-display font-bold text-xs flex flex-col items-center ${
                    telemetry.turboActive ? 'bg-amber-400 text-zinc-900' : 'bg-white text-zinc-900'
                  }`}
                >
                  <Zap size={15} />
                  <span>{telemetry.turboActive ? 'TURBO ON' : 'TURBO'}</span>
                  <span className="text-[9px] font-sans font-black">[SPACE]</span>
                </button>
              </div>

              <div className="lg:col-span-4 flex items-center justify-between gap-2 bg-zinc-100 border-2 border-zinc-900 rounded-xl px-3 py-2">
                <div className="flex gap-1.5">
                  <button
                    onMouseDown={() => sceneControlRef.current?.setInput('left', true)}
                    onMouseUp={() => sceneControlRef.current?.setInput('left', false)}
                    onMouseLeave={() => sceneControlRef.current?.setInput('left', false)}
                    onTouchStart={() => sceneControlRef.current?.setInput('left', true)}
                    onTouchEnd={() => sceneControlRef.current?.setInput('left', false)}
                    className="arcade-btn p-2.5 bg-amber-300 hover:bg-amber-200 rounded-xl text-zinc-900"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    onMouseDown={() => sceneControlRef.current?.setInput('right', true)}
                    onMouseUp={() => sceneControlRef.current?.setInput('right', false)}
                    onMouseLeave={() => sceneControlRef.current?.setInput('right', false)}
                    onTouchStart={() => sceneControlRef.current?.setInput('right', true)}
                    onTouchEnd={() => sceneControlRef.current?.setInput('right', false)}
                    className="arcade-btn p-2.5 bg-amber-300 hover:bg-amber-200 rounded-xl text-zinc-900"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onMouseDown={() => sceneControlRef.current?.setInput('down', true)}
                    onMouseUp={() => sceneControlRef.current?.setInput('down', false)}
                    onMouseLeave={() => sceneControlRef.current?.setInput('down', false)}
                    onTouchStart={() => sceneControlRef.current?.setInput('down', true)}
                    onTouchEnd={() => sceneControlRef.current?.setInput('down', false)}
                    className="arcade-btn px-3 py-2 bg-rose-400 hover:bg-rose-300 text-white rounded-xl text-[11px] font-black flex flex-col items-center"
                  >
                    <ArrowDown size={15} />
                    <span>SLOW [S]</span>
                  </button>

                  <button
                    onMouseDown={() => sceneControlRef.current?.setInput('up', true)}
                    onMouseUp={() => sceneControlRef.current?.setInput('up', false)}
                    onMouseLeave={() => sceneControlRef.current?.setInput('up', false)}
                    onTouchStart={() => sceneControlRef.current?.setInput('up', true)}
                    onTouchEnd={() => sceneControlRef.current?.setInput('up', false)}
                    className="arcade-btn px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-900 rounded-xl text-[11px] font-black flex flex-col items-center"
                  >
                    <ArrowUp size={15} />
                    <span>GAS [W]</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FINAL BOSS MINI-GAME: CLOSING TABLE DOCUMENT AUDIT */}
        {game.stage === 'boss_audit' && (
          <div className="arcade-card bg-white rounded-3xl p-6 max-w-3xl mx-auto">
            <div className="inline-block bg-rose-500 text-white font-display font-bold text-xs px-3.5 py-1 rounded-full border-2 border-zinc-900 mb-2">
              🏛️ FINAL BOSS CHALLENGE • COUNTY TITLE OFFICE
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mb-1.5">
              Audit Your Final Closing Disclosure!
            </h2>
            <p className="text-sm font-medium text-zinc-700 mb-4">
              The lender snuck <strong>2 bogus "Junk Fees"</strong> onto your settlement statement. <strong>Tap the 2 Junk Fees to cross them out and save +$1,600:</strong>
            </p>

            <div className="space-y-2.5 mb-6">
              {CLOSING_TABLE_ITEMS.map((item) => {
                const isStruck = flaggedFees.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleFeeFlag(item.id)}
                    className={`cursor-pointer arcade-btn p-3 rounded-xl flex items-center justify-between transition ${
                      isStruck ? 'bg-rose-200 border-rose-900' : 'bg-amber-50 hover:bg-amber-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg border-2 border-zinc-900 text-xs font-black ${
                        isStruck ? 'bg-rose-500 text-white' : 'bg-white text-zinc-900'
                      }`}>
                        {isStruck ? '✗ CROSSED OUT' : 'KEEP FEE'}
                      </span>
                      <span className={`font-display font-bold text-base ${isStruck ? 'line-through text-rose-900' : 'text-zinc-900'}`}>
                        {item.name}
                      </span>
                    </div>
                    <span className="font-display font-bold text-lg text-zinc-900">
                      ${item.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSignFinalDeed}
              className="w-full arcade-btn py-3.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-900 font-display font-bold text-xl rounded-2xl flex items-center justify-center gap-2"
            >
              <FileCheck size={22} /> SIGN FINAL DEED & UNLOCK HOUSE KEYS!
            </button>
          </div>
        )}

        {/* SUMMARY SCREEN */}
        {game.stage === 'summary' && (
          <div className="arcade-card bg-white rounded-3xl p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 border-b-3 border-zinc-900 pb-3 mb-4">
              <div className="p-2.5 bg-amber-300 border-2 border-zinc-900 rounded-xl">
                <Trophy className="text-zinc-900" size={26} />
              </div>
              <div>
                <div className="text-xs font-black uppercase text-rose-500">
                  Official Closing Disclosure & Trophy Room
                </div>
                <h2 className="font-display text-2xl font-bold text-zinc-900">
                  Closing Day Report • {game.profile?.name}
                </h2>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border-3 border-zinc-900 mb-4 ${
              game.cashReserves >= gradeATarget
                ? 'bg-emerald-300'
                : game.cashReserves >= 8500
                ? 'bg-amber-200'
                : 'bg-rose-300'
            }`}>
              <div className="text-xs font-black uppercase text-zinc-900">Final Homebuyer Grade</div>
              <div className="font-display text-xl sm:text-2xl font-bold text-zinc-900 my-1">
                {game.cashReserves >= gradeATarget && '🏆 GRADE A: MASTER HOMEBUYER (KEYS UNLOCKED!)'}
                {game.cashReserves >= 8500 && game.cashReserves < gradeATarget && '👍 GRADE B: CLOSED THE DEAL, SOLID RESERVES!'}
                {game.cashReserves < 8500 && '⚠️ GRADE C: HOUSE POOR — REVIEW THE FIELD MANUAL!'}
              </div>
              <p className="text-xs sm:text-sm font-bold text-zinc-900">
                {game.cashReserves >= gradeATarget &&
                  `Awesome ${game.profile?.campaignMiles}-mile run in your ${game.profile?.loanType}! You finished with $${game.cashReserves.toLocaleString()}!`}
                {game.cashReserves >= 8500 && game.cashReserves < gradeATarget &&
                  `You got the keys with $${game.cashReserves.toLocaleString()} left! Replay to steer into every smart lane for Grade A!`}
                {game.cashReserves < 8500 &&
                  `You finished with $${game.cashReserves.toLocaleString()}. Check the 9-Term Field Guide to see how Seller Credits, Rate Locks, and Comps Appeals protect your cash!`}
              </p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border-2 border-zinc-900 mb-4 space-y-2 max-h-60 overflow-y-auto">
              <div className="text-xs font-black uppercase text-zinc-600 mb-1">
                Full Campaign & Closing Audit Ledger
              </div>
              {game.history.map((h, i) => (
                <div key={i} className="bg-white border-2 border-zinc-900 rounded-xl p-2.5">
                  <div className="flex justify-between text-xs font-black text-zinc-900">
                    <span>{h.item}</span>
                    <span className={h.cost < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {h.cost >= 0 ? `+$${h.cost.toLocaleString()}` : `-$${Math.abs(h.cost).toLocaleString()}`}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 mt-0.5">{h.lesson}</p>
                </div>
              ))}
              <div className="border-t-2 border-zinc-900 pt-2 flex justify-between font-display text-lg font-bold text-zinc-900">
                <span>Final Cash Reserve Balance:</span>
                <span className="text-emerald-600">
                  ${game.cashReserves.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleStartNewGame(game.profile)}
                className="flex-1 arcade-btn py-3 bg-emerald-400 hover:bg-emerald-300 text-zinc-900 font-display font-bold text-lg rounded-xl flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} /> PLAY AGAIN
              </button>
              <button
                onClick={handleReset}
                className="arcade-btn py-3 px-5 bg-amber-300 hover:bg-amber-200 text-zinc-900 font-display font-bold text-base rounded-xl"
              >
                CHANGE VEHICLE / MODE
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
