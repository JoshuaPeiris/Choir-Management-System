import React from 'react';
import { 
  History, 
  X, 
  ShieldCheck, 
  Clock, 
  User, 
  FileText,
  RotateCcw
} from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
  onResetDemo: () => Promise<void>;
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onResetDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="bg-[#121212] w-full max-w-md h-full shadow-2xl flex flex-col border-l border-[#242424] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="bg-[#0D0D0D] text-white p-5 flex items-center justify-between border-b border-[#222222]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                President & Committee Audit Log
              </h3>
              <p className="text-xs text-neutral-400">
                Real-time tracking of liturgical workflow modifications
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 divide-y divide-[#1F1F1F]">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              No activity logs recorded yet.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="pt-3 first:pt-0">
                <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                  <span className="font-mono">{log.timestamp}</span>
                  <span className="px-2 py-0.5 rounded-full font-semibold bg-[#1C1C1C] text-neutral-300 border border-[#2E2E2E]">
                    {log.role}
                  </span>
                </div>
                <div className="font-bold text-xs text-white">
                  {log.action}
                </div>
                <div className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                  {log.details}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-neutral-500" />
                  <span>By {log.memberName}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0D0D0D] border-t border-[#222222] flex items-center justify-between">
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 text-neutral-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
