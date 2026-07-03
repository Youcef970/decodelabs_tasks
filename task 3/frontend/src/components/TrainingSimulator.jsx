import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Check,
  X,
  Star,
  Trophy,
  Target,
  ArrowRight,
  Loader2,
  Inbox,
} from 'lucide-react';
import api from '../api';

const RED_FLAGS = [
  { id: 'suspicious_url', label: 'Suspicious URL' },
  { id: 'urgent_language', label: 'Urgent / time-pressure language' },
  { id: 'threat_language', label: 'Threat or intimidation' },
  { id: 'sensitive_info', label: 'Requests sensitive info' },
  { id: 'authority_impersonation', label: 'Authority impersonation' },
  { id: 'brand_impersonation', label: 'Brand impersonation' },
  { id: 'generic_greeting', label: 'Generic greeting' },
  { id: 'secrecy_request', label: 'Secrecy / bypass request' },
];

const flagLabel = (id) => RED_FLAGS.find((f) => f.id === id)?.label || id.replace(/_/g, ' ');

export default function TrainingSimulator() {
  const [samples, setSamples] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    api
      .getTrainingSamples()
      .then(setSamples)
      .catch(() => toast.error('Could not load training samples'))
      .finally(() => setIsLoading(false));
  }, []);

  const current = samples[index];

  const toggleFlag = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.validateTraining({
        sample_id: current.id,
        identified_flags: selected,
      });
      setResult(res);
      setAttempts((a) => a + 1);
      if (res.is_correct) {
        setCorrectCount((c) => c + 1);
        setScore((s) => s + Math.round(res.score * 10));
        toast.success('Correct — well spotted');
      } else {
        toast.error('Not quite — review the breakdown below');
      }
    } catch (error) {
      toast.error(error.message || 'Could not validate your answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setIndex((i) => Math.min(i + 1, samples.length - 1));
    setSelected([]);
    setResult(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-paper-400 animate-spin" />
      </div>
    );
  }

  if (!samples.length) {
    return (
      <div className="text-center py-20">
        <Inbox className="w-10 h-10 text-paper-400 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-paper-400">No training samples available right now.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-1.5">Awareness drill</p>
          <h1 className="text-2xl font-semibold text-paper-100">Spot the red flags</h1>
        </div>
        <div className="flex items-center gap-5 font-mono text-xs text-paper-300">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-signal" /> {score} pts
          </span>
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-paper-400" /> {correctCount}/{attempts}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-ink-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-signal transition-all duration-300"
            style={{ width: `${((index + 1) / samples.length) * 100}%` }}
          />
        </div>
        <span className="font-mono text-xs text-paper-400 whitespace-nowrap">
          {index + 1} / {samples.length}
        </span>
      </div>

      <div className="panel overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-ink-700 space-y-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1.5 min-w-0">
              <p className="font-mono text-xs text-paper-400">
                FROM <span className="text-paper-200">{current.sender}</span>
              </p>
              <p className="text-sm font-medium text-paper-100">{current.subject}</p>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < current.difficulty ? 'text-signal fill-signal' : 'text-ink-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 bg-ink-950">
          <p className="text-sm text-paper-200 whitespace-pre-wrap leading-relaxed font-mono">
            {current.body}
          </p>
        </div>

        <div className="p-5 sm:p-6 border-t border-ink-700">
          <p className="eyebrow mb-3">Select every red flag present</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RED_FLAGS.map((flag) => {
              const isSelected = selected.includes(flag.id);
              return (
                <button
                  key={flag.id}
                  onClick={() => !result && toggleFlag(flag.id)}
                  disabled={!!result}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-sm text-left transition-colors border ${
                    isSelected
                      ? 'bg-signal/10 border-signal/40 text-paper-100'
                      : 'bg-ink-950 border-ink-700 text-paper-300 hover:border-ink-500'
                  } ${result ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                >
                  <span
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-signal border-signal' : 'border-ink-500'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-ink-950" strokeWidth={3} />}
                  </span>
                  {flag.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-5">
            {!result ? (
              <>
                <button
                  onClick={handleSubmit}
                  disabled={selected.length === 0 || isSubmitting}
                  className="btn-primary inline-flex items-center gap-2 text-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Submit answer
                </button>
                <button onClick={() => setSelected([])} className="btn-ghost text-sm">
                  Clear selection
                </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                disabled={index >= samples.length - 1}
                className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-40"
              >
                {index < samples.length - 1 ? 'Next sample' : 'All samples complete'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {result && (
        <div className="panel p-5 sm:p-6 space-y-4">
          <div>
            <p className="eyebrow mb-2">Why this matters</p>
            <p className="text-sm text-paper-200 leading-relaxed">{current.explanation}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="eyebrow mb-2 text-safe">You identified</p>
              <div className="flex flex-wrap gap-2">
                {selected.length > 0 ? (
                  selected.map((f) => (
                    <span key={f} className="tag tag-safe">
                      {flagLabel(f)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-paper-400">Nothing selected</span>
                )}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-2 text-danger">Missed flags</p>
              <div className="flex flex-wrap gap-2">
                {result.missed_flags.length > 0 ? (
                  result.missed_flags.map((f) => (
                    <span key={f} className="tag tag-danger">
                      {flagLabel(f)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-safe">None — full marks</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
