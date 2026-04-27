import { useState, useEffect, useRef } from 'react';

// Breathing phases for 4-7-8 technique
const PHASES = [
  { name: 'Breathe in', duration: 4, type: 'inhale', instruction: 'Breathe in through your nose' },
  { name: 'Hold', duration: 7, type: 'hold', instruction: 'Hold gently' },
  { name: 'Breathe out', duration: 8, type: 'exhale', instruction: 'Exhale slowly through your mouth' },
];

export default function BreathingWidget({ onClose }) {
  const [cycleIndex, setCycleIndex] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(PHASES[0].duration);
  const timerRef = useRef(null);

  const currentPhase = PHASES[phaseIndex];
  const totalCycles = 3;

  useEffect(() => {
    setCountdown(currentPhase.duration);

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Move to next phase
          const nextPhaseIndex = (phaseIndex + 1) % PHASES.length;
          if (nextPhaseIndex === 0) {
            // Completed a full cycle
            const nextCycle = cycleIndex + 1;
            if (nextCycle >= totalCycles) {
              // All done
              setTimeout(onClose, 1000);
              return 0;
            }
            setCycleIndex(nextCycle);
          }
          setPhaseIndex(nextPhaseIndex);
          return PHASES[nextPhaseIndex].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phaseIndex, cycleIndex]);

  const phaseEmoji = {
    inhale: '🌊',
    hold: '✨',
    exhale: '🍃',
  };

  return (
    <div className="breathing-widget" role="dialog" aria-labelledby="breathing-title">
      <div className="breathing-card">
        <h3 id="breathing-title">4-7-8 Breathing</h3>
        <p className="sub-text">A gentle technique to calm your nervous system</p>

        <div className="breathing-circle-wrapper">
          <div className="breathing-ring" />
          <div className={`breathing-circle ${currentPhase.type}`} key={`${phaseIndex}-${cycleIndex}`}>
            <span style={{ fontSize: '32px' }}>{phaseEmoji[currentPhase.type]}</span>
          </div>
        </div>

        <div className="breathing-label">{countdown}</div>
        <div className="breathing-phase">{currentPhase.name}</div>
        <p className="breathing-count">
          {currentPhase.instruction} · Cycle {cycleIndex + 1} of {totalCycles}
        </p>

        <button className="btn-end-breathing" onClick={onClose} id="end-breathing-btn">
          I feel calmer now
        </button>
      </div>
    </div>
  );
}
