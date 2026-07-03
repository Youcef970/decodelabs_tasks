import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  ScanSearch,
  Link2,
  ShieldCheck,
  AlertTriangle,
  Ban,
  Loader2,
} from 'lucide-react';
import api from '../api';

const verdictMeta = {
  SAFE: {
    icon: ShieldCheck,
    color: 'text-safe',
    bg: 'bg-safe-bg',
    border: 'border-safe/30',
    label: 'Safe — no threats detected',
  },
  SUSPICIOUS: {
    icon: AlertTriangle,
    color: 'text-signal',
    bg: 'bg-suspicious-bg',
    border: 'border-signal/30',
    label: 'Suspicious — exercise caution',
  },
  PHISHING: {
    icon: Ban,
    color: 'text-danger',
    bg: 'bg-danger-bg',
    border: 'border-danger/30',
    label: 'Phishing — high risk detected',
  },
};

// Phrase groups used purely for inline highlighting in the email body preview.
// This mirrors (a simplified view of) what the backend's context analyzer looks for.
const HIGHLIGHT_GROUPS = [
  { pattern: /\b(urgent(ly)?|immediately|within \d+ hours?|asap|today|deadline|right now)\b/gi },
  { pattern: /\b(suspend(ed)?|terminat(e|ed)|deactivat(e|ed)|lock(ed)?|disabl(e|ed)|expire[sd]?|block(ed)?)\b/gi },
  { pattern: /\b(social security|ssn|password|bank account|credit card|wire transfer|verify identity|pin)\b/gi },
  { pattern: /\b(do not discuss|confidential|bypass standard approval|don't tell)\b/gi },
];

function highlightText(text) {
  if (!text) return null;
  // Build a single regex that captures any of the groups, so we can split and re-wrap once.
  const combined = new RegExp(HIGHLIGHT_GROUPS.map((g) => g.pattern.source).join('|'), 'gi');
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <mark key={`hl-${key++}`} className="flagged-term">
        {match[0]}
      </mark>
    );
    lastIndex = match.index + match[0].length;
    if (match[0].length === 0) combined.lastIndex++; // avoid infinite loop on zero-width matches
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export default function EmailAnalyzer() {
  const [url, setUrl] = useState('');
  const [emailText, setEmailText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const highlighted = useMemo(() => highlightText(emailText), [emailText]);

  const handleAnalyze = async () => {
    if (!url.trim() && !emailText.trim()) {
      toast.error('Enter a URL or paste email content first');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    try {
      const response = await api.analyze({
        url: url.trim() || undefined,
        email_body: emailText.trim() || undefined,
      });
      setResult(response);

      if (response.verdict === 'PHISHING') {
        toast.error('Phishing detected — do not interact with this content');
      } else if (response.verdict === 'SUSPICIOUS') {
        toast('Suspicious signals found — proceed with caution', { icon: '⚠️' });
      } else {
        toast.success('No threats detected');
      }
    } catch (error) {
      toast.error(error.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const meta = result ? verdictMeta[result.verdict] : null;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="eyebrow mb-1.5">Manual review</p>
        <h1 className="text-2xl font-semibold text-paper-100">Analyze a URL or message</h1>
        <p className="text-sm text-paper-400 mt-1">
          Paste a suspicious link or the full text of an email to score it across structural,
          linguistic, and visual signals.
        </p>
      </div>

      <div className="panel p-5 sm:p-6 space-y-4">
        <div>
          <label className="eyebrow block mb-2" htmlFor="url-input">
            URL
          </label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-400" />
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/verify-account"
              className="input-field pl-10 font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <label className="eyebrow block mb-2" htmlFor="email-input">
            Message content
          </label>
          <textarea
            id="email-input"
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder="Paste the email body here..."
            rows={7}
            className="input-field font-mono text-sm resize-none leading-relaxed"
          />
          {emailText && (
            <div className="mt-3 panel bg-ink-950 p-4">
              <p className="eyebrow mb-2">Live preview — flagged terms highlighted</p>
              <p className="text-sm text-paper-200 whitespace-pre-wrap leading-relaxed">
                {highlighted}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <ScanSearch className="w-4 h-4" />
                Run analysis
              </>
            )}
          </button>
          <button
            onClick={() => {
              setUrl('');
              setEmailText('');
              setResult(null);
            }}
            className="btn-ghost text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {result && (
        <div className={`panel p-5 sm:p-6 border ${meta.border} ${meta.bg}`}>
          <div className="flex items-start gap-4">
            <meta.icon className={`w-7 h-7 ${meta.color} flex-shrink-0`} strokeWidth={1.75} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className={`text-base font-semibold ${meta.color}`}>{meta.label}</h3>
                <span className="font-mono text-xs text-paper-400">
                  risk score {Math.round(result.score * 100)}% · confidence{' '}
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>

              {result.flags?.length > 0 && (
                <div className="mt-4">
                  <p className="eyebrow mb-2">Detected indicators</p>
                  <div className="flex flex-wrap gap-2">
                    {result.flags.map((flag) => (
                      <span key={flag} className="tag tag-flag">
                        {flag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.recommendations?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-ink-700">
                  <p className="eyebrow mb-2">Recommended action</p>
                  <ul className="space-y-1.5">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-paper-200 flex items-start gap-2">
                        <span className="text-paper-400 mt-0.5">—</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="panel p-5 sm:p-6 border-ink-600">
        <p className="eyebrow mb-3">Field notes</p>
        <ul className="space-y-2 text-sm text-paper-300">
          <li>Check the sender's actual address, not just the display name.</li>
          <li>Hover any link to see its real destination before clicking.</li>
          <li>Urgency, threats, and requests for credentials are the strongest signals.</li>
          <li>Verify unusual requests through a separate, known-good channel.</li>
        </ul>
      </div>
    </div>
  );
}
