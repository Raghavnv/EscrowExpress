import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import EscrowScene from '../game/EscrowScene';

export default function PhaserCanvas({ isDriving, engineRunning, escrowPercent, stage, truckColor }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 220,
      backgroundColor: '#0f172a',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [EscrowScene],
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Sync React state changes into the Phaser scene
  useEffect(() => {
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene('EscrowScene');
    if (scene && scene.scene.isActive()) {
      scene.syncWithReact({ isDriving, engineRunning, escrowPercent, stage, truckColor });
    } else {
      // Wait briefly if scene is still initializing
      const timer = setTimeout(() => {
        const readyScene = gameRef.current?.scene.getScene('EscrowScene');
        if (readyScene) {
          readyScene.syncWithReact({ isDriving, engineRunning, escrowPercent, stage, truckColor });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isDriving, engineRunning, escrowPercent, stage, truckColor]);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner mb-6">
      <div ref={containerRef} className="w-full h-[200px] sm:h-[220px]" />
    </div>
  );
}
