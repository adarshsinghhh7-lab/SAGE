import React, { useState, useEffect } from 'react';
import { Database, Server, RefreshCw, ShieldCheck, Cpu } from 'lucide-react';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BackendHealthResponse } from '../types';

export const ConnectionBanner: React.FC = () => {
  const { activeRole, openAuthModal } = useAuth();
  const [healthData, setHealthData] = useState<BackendHealthResponse | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const data = await ApiService.checkHealth();
      setHealthData(data);
    } catch {
      setHealthData(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  const isBackendConnected = !!healthData;
  const isFirestoreLive = healthData?.firebase?.connected;

  return (
    <div className="bg-surface/85 backdrop-blur border-b border-line text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-cat-hygiene animate-pulse-soft"></span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-accent-deep">SAGE System Live</span>
          </div>
          <div className="flex items-center gap-1.5 text-ink-faint">
            <Server className="w-3.5 h-3.5" />
            <span>Backend:</span>
            {isBackendConnected ? <span className="text-accent-deep font-bold">Node/Express (Port 5000)</span> : <span className="text-bronze-deep font-bold">Client Direct Mode</span>}
          </div>
          <div className="flex items-center gap-1.5 text-ink-faint">
            <Database className="w-3.5 h-3.5" />
            <span>Database:</span>
            {isFirestoreLive ? <span className="text-accent-deep font-bold">Live Firestore</span> : <span className="text-accent-deep font-bold">Firestore (Sync Active)</span>}
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-ink-faint">
            <Cpu className="w-3.5 h-3.5" />
            <span>ML Classifier:</span>
            <span className="text-accent-deep font-bold">TF-IDF + Logistic Regression</span>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <div onClick={openAuthModal} className="flex items-center gap-1.5 bg-surface-soft hover:bg-surface px-2.5 py-1 border border-line-strong rounded-lg transition-colors cursor-pointer">
            <ShieldCheck className="w-3.5 h-3.5 text-bronze" />
            <span className="text-ink-faint text-[10px] uppercase tracking-wider">Active Role:</span>
            <span className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded-md ${activeRole === 'head_admin' ? 'bg-clay-soft text-clay-deep' : activeRole === 'admin' ? 'bg-bronze-soft text-bronze-deep' : 'bg-accent-soft text-accent-deep'}`}>{activeRole.replace('_', ' ')}</span>
          </div>
          <button type="button" onClick={checkConnection} disabled={isChecking} className="p-1 text-ink-faint hover:text-ink transition-colors cursor-pointer" title="Refresh Connection Status">
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
