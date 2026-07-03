import React, { useState, useEffect } from 'react';
import { Loader2, Clock, Gauge } from 'lucide-react';
import api from '../api';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-paper-400 animate-spin" />
      </div>
    );
  }

  const total = stats?.total_scans ?? 0;
  const detectionPct = Math.round((stats?.detection_rate ?? 0) * 100);
  const circumference = 2 * Math.PI * 52;

  const cards = [
    { label: 'Total scans', value: stats?.total_scans ?? 0 },
    { label: 'Phishing', value: stats?.phishing_detected ?? 0, accent: 'text-danger' },
    { label: 'Suspicious', value: stats?.suspicious_detected ?? 0, accent: 'text-signal' },
    { label: 'Safe', value: stats?.safe_detected ?? 0, accent: 'text-safe' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1.5">Session analytics</p>
        <h1 className="text-2xl font-semibold text-paper-100">Detection statistics</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="panel p-5">
            <p className="eyebrow mb-2">{c.label}</p>
            <p className={`text-2xl font-mono font-semibold ${c.accent || 'text-paper-100'}`}>
              {c.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="panel p-5 sm:p-6">
          <p className="eyebrow mb-1">This session</p>
          <h3 className="text-sm font-medium text-paper-100 mb-4">Detection rate</h3>
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 120 120" className="w-28 h-28 -rotate-90">
                <circle cx="60" cy="60" r="52" stroke="#1E2430" strokeWidth="10" fill="none" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke="#FFB627"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(detectionPct / 100) * circumference} ${circumference}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-xl font-semibold text-paper-100">
                  {detectionPct}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-paper-300">
                {total > 0
                  ? `${detectionPct}% of ${total} scans were flagged suspicious or phishing.`
                  : 'No scans recorded yet this session.'}
              </p>
            </div>
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <p className="eyebrow mb-1">Performance</p>
          <h3 className="text-sm font-medium text-paper-100 mb-4">Average response time</h3>
          <div className="flex items-center gap-5">
            <div className="w-28 h-28 flex-shrink-0 flex items-center justify-center rounded-full bg-ink-950 border border-ink-700">
              <Clock className="w-9 h-9 text-signal" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-paper-100">
                {stats?.average_response_time ?? 0}ms
              </p>
              <p className="text-sm text-paper-400 mt-1">per analysis request</p>
            </div>
          </div>
        </div>
      </div>

      <div className="panel p-5 sm:p-6">
        <p className="eyebrow mb-1">Pattern frequency</p>
        <h3 className="text-sm font-medium text-paper-100 mb-4">Most common indicators</h3>
        {stats?.top_flags?.length > 0 ? (
          <div className="space-y-3">
            {stats.top_flags.map((flagObj, i) => {
              const [name, count] = Object.entries(flagObj)[0];
              const max = Math.max(...stats.top_flags.map((f) => Object.values(f)[0]));
              const pct = (count / max) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-paper-300 capitalize">{name.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-paper-100">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-ink-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-signal rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-paper-400 py-4">
            <Gauge className="w-4 h-4" />
            Run a few analyses to see indicator trends here.
          </div>
        )}
      </div>
    </div>
  );
}
