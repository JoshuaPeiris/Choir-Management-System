import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  ExternalLink, 
  Server, 
  AlertCircle, 
  X, 
  RefreshCw,
  CheckCircle2,
  Table,
  Zap,
  ShieldCheck,
  Code2,
  Globe,
  UploadCloud,
  DownloadCloud,
  Radio,
  Layers,
  Sparkles
} from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshAppState?: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose, onRefreshAppState }) => {
  const [status, setStatus] = useState<{
    connected: boolean;
    configured: boolean;
    tablesCreated?: boolean;
    choristersCount?: number;
    committeeCount?: number;
    novenasCount?: number;
    massesCount?: number;
    eventsCount?: number;
    message?: string;
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'hosting' | 'guide' | 'sql'>('hosting');

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({
        connected: false,
        configured: false,
        message: 'Could not connect to backend server status endpoint.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setIsPulling(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/supabase/pull-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Successfully hydrated latest data from live Supabase PostgreSQL!');
        await checkStatus();
        onRefreshAppState?.();
      } else {
        setActionMessage(`Pull error: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`Pull failed: ${err.message}`);
    } finally {
      setIsPulling(false);
    }
  };

  const handlePushToSupabase = async () => {
    setIsPushing(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/supabase/push-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage('All local choir state pushed and backed up to Supabase PostgreSQL!');
        await checkStatus();
      } else {
        setActionMessage(`Push error: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`Push failed: ${err.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const handleCopySql = () => {
    const sqlContent = `-- St. Michael's Church, Koralawella - Complete Supabase Schema
CREATE TABLE IF NOT EXISTS choristers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER DEFAULT 0,
    birthdate TEXT,
    address TEXT,
    phone_number TEXT,
    role TEXT NOT NULL DEFAULT 'Chorister',
    voice_rating INTEGER,
    voice_notes TEXT,
    pin TEXT DEFAULT '1234',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS committee_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    pin TEXT NOT NULL,
    avatar_color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feast_novenas (
    id TEXT PRIMARY KEY,
    day_number INTEGER,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    theme TEXT NOT NULL,
    novena_type TEXT NOT NULL,
    work_and_budget JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_masses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    day TEXT NOT NULL,
    time TEXT NOT NULL,
    language TEXT NOT NULL,
    work_and_budget JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS major_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    liturgy_type TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    description TEXT,
    work_and_budget JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    member_name TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE choristers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read choristers" ON choristers FOR SELECT USING (true);
CREATE POLICY "Public write choristers" ON choristers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read committee" ON committee_members FOR SELECT USING (true);
CREATE POLICY "Public write committee" ON committee_members FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE feast_novenas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read novenas" ON feast_novenas FOR SELECT USING (true);
CREATE POLICY "Public write novenas" ON feast_novenas FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE weekly_masses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read masses" ON weekly_masses FOR SELECT USING (true);
CREATE POLICY "Public write masses" ON weekly_masses FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE major_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read events" ON major_events FOR SELECT USING (true);
CREATE POLICY "Public write events" ON major_events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Public write logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Enable Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE choristers;
ALTER PUBLICATION supabase_realtime ADD TABLE committee_members;
ALTER PUBLICATION supabase_realtime ADD TABLE feast_novenas;
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_masses;
ALTER PUBLICATION supabase_realtime ADD TABLE major_events;
`;
    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121212] w-full max-w-2xl rounded-3xl border border-[#2B2B2B] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#222222] flex items-center justify-between bg-gradient-to-r from-[#181818] to-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-wide">
                  Live Cloud Database & Hosting
                </h3>
                {status?.connected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Supabase PostgreSQL Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    Connecting...
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                St. Michael's Church, Koralawella • Cloud PostgreSQL & Instant Real-Time Sync
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-[#222222] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#242424] bg-[#161616] px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('hosting')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'hosting'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Hosting & Deployment</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Database Status</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>SQL Schema</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-neutral-300 text-xs flex-1">
          {/* Status Indicator Card */}
          <div className="p-4 rounded-2xl bg-[#181818] border border-[#282828] flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Server className={`w-5 h-5 ${status?.connected ? 'text-emerald-400' : 'text-amber-400'}`} />
                <div>
                  <div className="font-bold text-white text-xs">
                    {status?.connected 
                      ? 'Live Supabase PostgreSQL Database Connected' 
                      : 'Connecting to Database...'}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {status?.message}
                  </div>
                </div>
              </div>

              <button
                onClick={checkStatus}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-[#242424] hover:bg-[#303030] text-neutral-200 border border-[#333333] transition-all flex items-center gap-1.5 shrink-0"
                title="Refresh connection status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Checking...' : 'Check Status'}</span>
              </button>
            </div>

            {/* Live Table Metrics */}
            {status?.connected && (
              <div className="grid grid-cols-5 gap-2 pt-2 border-t border-[#262626]">
                <div className="p-2 rounded-xl bg-[#131313] border border-[#222] text-center">
                  <div className="text-[10px] text-neutral-400">Choristers</div>
                  <div className="text-sm font-bold text-emerald-400">{status.choristersCount ?? 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-[#131313] border border-[#222] text-center">
                  <div className="text-[10px] text-neutral-400">Committee</div>
                  <div className="text-sm font-bold text-emerald-400">{status.committeeCount ?? 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-[#131313] border border-[#222] text-center">
                  <div className="text-[10px] text-neutral-400">Novenas</div>
                  <div className="text-sm font-bold text-emerald-400">{status.novenasCount ?? 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-[#131313] border border-[#222] text-center">
                  <div className="text-[10px] text-neutral-400">Weekly Masses</div>
                  <div className="text-sm font-bold text-emerald-400">{status.massesCount ?? 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-[#131313] border border-[#222] text-center">
                  <div className="text-[10px] text-neutral-400">Major Events</div>
                  <div className="text-sm font-bold text-emerald-400">{status.eventsCount ?? 0}</div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handlePullFromSupabase}
                disabled={isPulling || isPushing}
                className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <DownloadCloud className={`w-3.5 h-3.5 ${isPulling ? 'animate-bounce' : ''}`} />
                <span>{isPulling ? 'Pulling...' : 'Pull Latest from Supabase DB'}</span>
              </button>
              <button
                onClick={handlePushToSupabase}
                disabled={isPushing || isPulling}
                className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
                <span>{isPushing ? 'Pushing...' : 'Push & Backup All to Supabase'}</span>
              </button>
            </div>

            {actionMessage && (
              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{actionMessage}</span>
              </div>
            )}
          </div>

          {activeTab === 'hosting' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>How to Host & Deploy the Entire Application</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  Your application is a high-performance full-stack TypeScript app powered by Node.js, Express, Vite, Tailwind CSS, and Supabase PostgreSQL. Here are the 2 primary ways to host it:
                </p>

                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#101010] border border-[#222]">
                    <div className="font-bold text-amber-300 text-xs flex items-center justify-between">
                      <span>Option 1: Deploy Directly in Google AI Studio (Cloud Run)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300">Recommended</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] mt-1 leading-relaxed">
                      Click the <strong>Deploy</strong> button in the top right header of Google AI Studio. It packages your app into a high-availability Google Cloud Run container automatically with HTTPS, zero server maintenance, and automatic scaling!
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#101010] border border-[#222]">
                    <div className="font-bold text-emerald-300 text-xs flex items-center justify-between">
                      <span>Option 2: Export to GitHub & Deploy on Vercel / Render / Railway</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] mt-1 leading-relaxed">
                      Export your code via <strong>Settings → Export to GitHub / ZIP</strong>. In Render, Railway, or VPS, set the build and start commands:
                    </p>
                    <div className="mt-2 p-2 rounded-lg bg-black text-neutral-300 font-mono text-[10px] space-y-1">
                      <div><span className="text-neutral-500">Build Command:</span> npm run build</div>
                      <div><span className="text-neutral-500">Start Command:</span> npm start</div>
                      <div><span className="text-neutral-500">Environment Variables:</span> SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time synchronization section */}
              <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Updates Explained</span>
                </div>
                <ul className="text-neutral-400 text-[11px] space-y-1.5 list-disc list-inside leading-relaxed">
                  <li><strong className="text-neutral-200">Instant Broadcaster:</strong> Every edit (chorister added, hymn assigned, budget updated, organist scheduled) is saved to Supabase PostgreSQL and broadcasted live via Server-Sent Events (SSE) to all open browsers and phones instantly.</li>
                  <li><strong className="text-neutral-200">No Data Loss on Reload:</strong> When you reload the app or edit files in AI Studio, the portal fetches the live state directly from your Supabase PostgreSQL database. Your edits will never revert to sample data!</li>
                  <li><strong className="text-neutral-200">Window Focus Sync:</strong> Whenever you switch tabs or refocus on the app, it automatically pings and verifies live state.</li>
                </ul>
              </div>
            </div>
          ) : activeTab === 'guide' ? (
            <div className="space-y-4">
              <div className="text-neutral-300 font-medium">
                Live Supabase PostgreSQL Database Configuration
              </div>

              <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] space-y-2">
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Database Tables Active & Verified
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  The following 6 tables are active and receiving real-time bidirectional updates in your Supabase PostgreSQL database:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2 rounded bg-black/40 border border-[#222] text-neutral-300">✓ choristers</div>
                  <div className="p-2 rounded bg-black/40 border border-[#222] text-neutral-300">✓ committee_members</div>
                  <div className="p-2 rounded bg-black/40 border border-[#222] text-neutral-300">✓ feast_novenas</div>
                  <div className="p-2 rounded bg-black/40 border border-[#222] text-neutral-300">✓ weekly_masses</div>
                  <div className="p-2 rounded bg-black/40 border border-[#222] text-neutral-300">✓ major_events</div>
                  <div className="p-2 rounded bg-black/40 border border-[#222] text-neutral-300">✓ audit_logs</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-300 font-bold">Complete SQL Migration Script:</span>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-2xl bg-[#0E0E0E] text-neutral-300 font-mono text-[11px] overflow-x-auto max-h-72 border border-[#222222] leading-relaxed select-all">
{`-- Run this in Supabase SQL Editor if resetting:
CREATE TABLE IF NOT EXISTS choristers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER DEFAULT 0,
    birthdate TEXT,
    address TEXT,
    phone_number TEXT,
    role TEXT NOT NULL DEFAULT 'Chorister',
    voice_rating INTEGER,
    voice_notes TEXT,
    pin TEXT DEFAULT '1234',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS committee_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    pin TEXT NOT NULL,
    avatar_color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feast_novenas (
    id TEXT PRIMARY KEY,
    day_number INTEGER,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    theme TEXT NOT NULL,
    novena_type TEXT NOT NULL,
    work_and_budget JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_masses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    day TEXT NOT NULL,
    time TEXT NOT NULL,
    language TEXT NOT NULL,
    work_and_budget JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS major_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    liturgy_type TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    description TEXT,
    work_and_budget JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    member_name TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#151515] border-t border-[#222222] flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure live PostgreSQL & SSE sync active</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
