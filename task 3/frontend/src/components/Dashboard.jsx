import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  Ban,
  ScanSearch,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../api';

const weeklyTrend = [
  { name: 'Mon', safe: 40, suspicious: 20, phishing: 10 },
  { name: 'Tue', safe: 35, suspicious: 25, phishing: 15 },
  { name: 'Wed', safe: 45, suspicious: 15, phishing: 8 },
  { name: 'Thu', safe: 30, suspicious: 30, phishing: 20 },
  { name: 'Fri', safe: 50, suspicious: 10, phishing: 5 },
  { name: 'Sat', safe: 55, suspicious: 12, phishing: 3 },
  { name: 'Sun', safe: 60, suspicious: 8, phishing: 2 },
];

const recentActivity = [
  { id: 1, domain: 'netflix.secure-update.tk', verdict: 'PHISHING', timestamp: '2 min ago' },
  { id: 2, domain: 'linkedin-com-verify.ml', verdict: 'PHISHING', timestamp: '15 min ago' },
  { id: 3, domain: 'company-intranet.com', verdict: 'SAFE', timestamp: '41 min ago' },
  { id: 4, domain: 'paypal-login.world', verdict: 'PHISHING', timestamp: '1 hour ago' },
  { id: 5, domain: 'docs.google.com', verdict: 'SAFE', timestamp: '3 hours ago' },
];

const verdictStyles = {
  SAFE: { tag: 'tag-safe', label: 'Safe' },
  SUSPICIOUS: { tag: 'tag-flag', label: 'Flagged' },
  PHISHING: { tag: 'tag-danger', label: 'Blocked' },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => setStats(null));
  }, []);

  const summaryCards = [
    {
      label: 'Total scans',
      value: stats?.total_scans ?? 0,
      icon: ScanSearch,
      accent: 'text-paper-100',
    },
    {
      label: 'Phishing caught',
      value: stats?.phishing_detected ?? 0,
      icon: Ban,
      accent: 'text-danger',
    },
    {
      label: 'Flagged suspicious',
      value: stats?.suspicious_detected ?? 0,
      icon: AlertTriangle,
      accent: 'text-signal',
    },
    {
      label: 'Confirmed safe',
      value: stats?.safe_detected ?? 0,
      icon: ShieldCheck,
      accent: 'text-safe',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-1.5">Live overview</p>
          <h1 className="text-2xl font-semibold text-paper-100">Threat console</h1>
        </div>
        <Link to="/analyze" className="btn-primary inline-flex items-center gap-2 text-sm">
          <ScanSearch className="w-4 h-4" />
          Run an analysis
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="panel p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow mb-2">{card.label}</p>
                <p className={`text-3xl font-mono font-semibold ${card.accent}`}>
                  {card.value.toLocaleString()}
                </p>
              </div>
              <card.icon className={`w-5 h-5 ${card.accent}`} strokeWidth={1.75} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Trend chart */}
        <div className="xl:col-span-2 panel p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <p className="eyebrow mb-1">Weekly pattern</p>
              <h3 className="text-sm font-medium text-paper-100">Verdict trends</h3>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px] text-paper-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-safe" />Safe
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-signal" />Suspicious
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-danger" />Phishing
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1E2430" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#1E2430' }}
              />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161B26',
                  border: '1px solid #2A3140',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#E8EAED' }}
              />
              <Line type="monotone" dataKey="safe" stroke="#3FB950" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="suspicious" stroke="#FFB627" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="phishing" stroke="#E5484D" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent activity */}
        <div className="panel p-5 sm:p-6">
          <p className="eyebrow mb-1">Live feed</p>
          <h3 className="text-sm font-medium text-paper-100 mb-4">Recent activity</h3>
          <div className="space-y-2">
            {recentActivity.map((activity) => {
              const style = verdictStyles[activity.verdict];
              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-2 border-b border-ink-700 last:border-0"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="font-mono text-xs text-paper-200 truncate">{activity.domain}</p>
                    <p className="text-[11px] text-paper-400 mt-0.5">{activity.timestamp}</p>
                  </div>
                  <span className={`tag ${style.tag} whitespace-nowrap`}>{style.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
