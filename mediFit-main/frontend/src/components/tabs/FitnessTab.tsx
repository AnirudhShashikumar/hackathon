import React, { useState, useEffect } from 'react';
import {
  Dumbbell, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  ChevronRight, Sparkles, Target, Heart, Activity, Info
} from 'lucide-react';
import { analyzeFitness } from '../../api';
import type { Patient } from '../../types';

/* ── Types ─────────────────────────────────────────────── */

interface Exercise {
  name: string;
  sets_duration: string;
  target_area: string;
  therapeutic_intent: string;
}

interface FitnessResult {
  status: 'Cleared' | 'Modified' | 'Restricted';
  reasoning: string;
  hindrance_severity: string;
  equipment_used: string[];
  exercises: Exercise[];
  precautions: string[];
  next_step: string;
}

interface FitnessTabProps {
  patient: Patient;
  apiKey: string;
}

/* ── Equipment Presets ─────────────────────────────────── */

const EQUIPMENT_OPTIONS = [
  { id: 'dumbbells',        label: 'Dumbbells',         emoji: '🏋️' },
  { id: 'yoga_mat',         label: 'Yoga Mat',          emoji: '🧘' },
  { id: 'resistance_bands', label: 'Resistance Bands',  emoji: '🔗' },
  { id: 'treadmill',        label: 'Treadmill',         emoji: '🏃' },
  { id: 'exercise_ball',    label: 'Exercise Ball',     emoji: '⚽' },
  { id: 'foam_roller',      label: 'Foam Roller',       emoji: '🧱' },
  { id: 'kettlebell',       label: 'Kettlebell',        emoji: '🔔' },
  { id: 'pull_up_bar',      label: 'Pull-Up Bar',       emoji: '📏' },
  { id: 'stationary_bike',  label: 'Stationary Bike',   emoji: '🚴' },
  { id: 'none',             label: 'Bodyweight Only',   emoji: '🤸' },
];

/* ── Status Badge ──────────────────────────────────────── */

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = {
    Cleared:    { bg: 'bg-emerald-500/15', text: 'text-emerald-500', border: 'border-emerald-500/30', icon: CheckCircle2 },
    Modified:   { bg: 'bg-amber-500/15',   text: 'text-amber-500',   border: 'border-amber-500/30',   icon: AlertTriangle },
    Restricted: { bg: 'bg-red-500/15',     text: 'text-red-500',     border: 'border-red-500/30',     icon: XCircle },
  }[status] ?? { bg: 'bg-fg3/15', text: 'text-fg3', border: 'border-fg3/30', icon: Info };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.text} ${cfg.border} border text-[12px] font-semibold`}>
      <cfg.icon className="w-3.5 h-3.5" />
      {status}
    </div>
  );
};

/* ── Main Component ────────────────────────────────────── */

export const FitnessTab: React.FC<FitnessTabProps> = ({ patient, apiKey }) => {
  const [equipment, setEquipment]     = useState<string[]>([]);
  const [hindrance, setHindrance]     = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [result, setResult]           = useState<FitnessResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);

  // Load persisted state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mt_fitness_equipment');
      if (saved) setEquipment(JSON.parse(saved));
    } catch {}
  }, []);

  // Save equipment selection
  useEffect(() => {
    localStorage.setItem('mt_fitness_equipment', JSON.stringify(equipment));
  }, [equipment]);

  const toggleEquipment = (id: string) => {
    setEquipment(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleAnalyze = async (feedback?: string) => {
    setError(null);
    setIsLoading(true);
    setFeedbackGiven(null);

    try {
      const conditions = patient.conditions.length > 0
        ? patient.conditions
        : ['General wellness'];

      const equipLabels = equipment.map(
        id => EQUIPMENT_OPTIONS.find(o => o.id === id)?.label ?? id
      );

      const data: any = {
        conditions,
        equipment: equipLabels,
        hindrance: hindrance.trim(),
      };

      if (feedback && result) {
        data.feedback = feedback;
        data.previous_routine = JSON.stringify(result.exercises);
      }

      const res = await analyzeFitness(data, apiKey);
      setResult(res);

      if (feedback) setFeedbackGiven(feedback);
    } catch (e: any) {
      setError(e.message || 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (type: 'helped' | 'discomfort') => {
    handleAnalyze(type);
  };

  /* ── Empty state ─────────────────────────────────────── */
  if (!result && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto pb-16 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-grotesk text-fg tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              Therapeutic Fitness
            </h2>
            <p className="text-[13px] text-fg2 mt-1">AI-powered restorative exercise prescriptions tailored to your conditions</p>
          </div>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-line bg-card p-5 card-hover">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-[13px] font-semibold text-fg">Patient Readiness</div>
            <div className="text-[11.5px] text-fg3 mt-1">
              {patient.conditions.length > 0
                ? `${patient.conditions.length} condition${patient.conditions.length > 1 ? 's' : ''} detected`
                : 'No conditions set — add in Meds tab'
              }
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {patient.conditions.slice(0, 3).map(c => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{c}</span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5 card-hover">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-[13px] font-semibold text-fg">Equipment</div>
            <div className="text-[11.5px] text-fg3 mt-1">
              {equipment.length > 0
                ? `${equipment.length} item${equipment.length > 1 ? 's' : ''} selected`
                : 'Select your available equipment below'
              }
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5 card-hover">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center mb-3">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-[13px] font-semibold text-fg">Therapeutic Focus</div>
            <div className="text-[11.5px] text-fg3 mt-1">
              Restorative exercises designed to improve your condition safely
            </div>
          </div>
        </div>

        {/* Equipment Selection */}
        <div className="rounded-2xl border border-line bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="w-4 h-4 text-accent" />
            <h3 className="text-[14px] font-semibold text-fg">Available Equipment</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {EQUIPMENT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => toggleEquipment(opt.id)}
                className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border text-center transition-all ${
                  equipment.includes(opt.id)
                    ? 'border-accent bg-accent/10 text-accent shadow-sm shadow-accent/10'
                    : 'border-line bg-bg text-fg2 hover:bg-card2 hover:border-line2'
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-[11px] font-medium leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hindrance Input */}
        <div className="rounded-2xl border border-line bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-red-400" />
            <h3 className="text-[14px] font-semibold text-fg">Reported Hindrances</h3>
            <span className="text-[10px] text-fg3 ml-auto">Optional</span>
          </div>
          <textarea
            value={hindrance}
            onChange={e => setHindrance(e.target.value)}
            placeholder="Describe any pain, discomfort, or physical limitations you're currently experiencing… (e.g., 'mild knee stiffness', 'lower back tension after sitting')"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-line bg-bg text-[13px] text-fg
              placeholder-fg3 focus:outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        {/* Analyze CTA */}
        <button
          onClick={() => handleAnalyze()}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl text-white text-[14px] font-semibold
            hover:opacity-90 active:scale-[0.98] disabled:opacity-40 transition-all
            flex items-center justify-center gap-2.5
            shadow-lg shadow-emerald-500/25"
          style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyze & Generate Routine
            </>
          )}
        </button>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-[12px] text-red-400 font-medium">
            <XCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }

  /* ── Loading state ────────────────────────────────────── */
  if (isLoading && !result) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-24 gap-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
          <Dumbbell className="w-8 h-8 text-white animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-[18px] font-bold font-grotesk text-fg">Generating Your Routine…</h3>
          <p className="text-[13px] text-fg2">Analyzing conditions, equipment, and hindrances</p>
        </div>
        <div className="w-48 h-1.5 rounded-full bg-line overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 animate-pulse" style={{ width: '70%' }} />
        </div>
      </div>
    );
  }

  /* ── Results View ─────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6">

      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-grotesk text-fg tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          Your Therapeutic Routine
        </h2>
        <button
          onClick={() => { setResult(null); setFeedbackGiven(null); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-card
            text-[12px] font-medium text-fg2 hover:bg-card2 transition-colors"
        >
          New Analysis
        </button>
      </div>

      {/* Status & Clearance */}
      {result && (
        <div className="rounded-2xl border border-line bg-card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-fg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              Status & Clearance
            </h3>
            <StatusBadge status={result.status} />
          </div>
          <p className="text-[13px] text-fg2 leading-relaxed">{result.reasoning}</p>
          {result.equipment_used && result.equipment_used.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-fg3">Equipment:</span>
              {result.equipment_used.map(e => (
                <span key={e} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">{e}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Therapeutic Routine */}
      {result && result.exercises && result.exercises.length > 0 && (
        <div className="rounded-2xl border border-line bg-card overflow-hidden animate-slide-up stagger-1">
          <div className="px-6 py-4 border-b border-line">
            <h3 className="text-[14px] font-semibold text-fg flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Therapeutic Routine
            </h3>
          </div>
          <div className="divide-y divide-line">
            {result.exercises.map((ex, i) => (
              <div key={i} className="px-6 py-4 hover:bg-card2/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[13px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[14px] font-semibold text-fg">{ex.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                        {ex.target_area}
                      </span>
                    </div>
                    <div className="text-[12px] text-fg2 font-medium mb-1.5 flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-accent" />
                      {ex.sets_duration}
                    </div>
                    <p className="text-[12px] text-fg3 leading-relaxed">{ex.therapeutic_intent}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restricted state — no exercises */}
      {result && result.status === 'Restricted' && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/8 p-6 animate-slide-up stagger-1">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[14px] font-semibold text-red-400 mb-1">Activity Restricted</h3>
              <p className="text-[13px] text-fg2 leading-relaxed">
                Based on your reported symptoms, exercise is not recommended at this time.
                Please rest and consult your healthcare provider before attempting any physical activity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Safety Precautions */}
      {result && result.precautions && result.precautions.length > 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6 animate-slide-up stagger-2">
          <h3 className="text-[14px] font-semibold text-fg flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Safety Precautions & Guidance
          </h3>
          <ul className="space-y-2">
            {result.precautions.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-[7px]" />
                <span className="text-[12.5px] text-fg2 leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Post-Workout Feedback */}
      {result && result.status !== 'Restricted' && (
        <div className="rounded-2xl border border-line bg-card p-6 animate-slide-up stagger-3">
          <h3 className="text-[14px] font-semibold text-fg flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-accent" />
            Post-Workout Feedback
          </h3>
          {result.next_step && (
            <p className="text-[12.5px] text-fg2 leading-relaxed mb-4">{result.next_step}</p>
          )}

          {feedbackGiven ? (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[12.5px] font-medium ${
              feedbackGiven === 'helped'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
            }`}>
              {feedbackGiven === 'helped' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {feedbackGiven === 'helped'
                ? 'Routine updated with micro-progression'
                : 'Routine recalibrated for safety'}
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleFeedback('helped')}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                  bg-emerald-500/10 text-emerald-500 border border-emerald-500/20
                  font-semibold text-[13px] hover:bg-emerald-500/20 transition-all
                  disabled:opacity-40"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                ✅ Helped
              </button>
              <button
                onClick={() => handleFeedback('discomfort')}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                  bg-red-500/10 text-red-400 border border-red-500/20
                  font-semibold text-[13px] hover:bg-red-500/20 transition-all
                  disabled:opacity-40"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                ❌ Caused Discomfort
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-[12px] text-red-400 font-medium">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};
