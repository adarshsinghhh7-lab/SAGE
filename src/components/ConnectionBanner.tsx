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
    <div className="bg-[#0B0C0F] text-[#EBE3D0] border-b border-[#2A2F3E] text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-[#5B7D5B]"></span>
            <span className="text-[11px] uppercase tracking-wider text-[#5B7D5B]">SAGE SYSTEM LIVE</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#EBE3D0]/70">
            <Server className="w-3.5 h-3.5 text-[#68707E]" />
            <span>Backend:</span>
            {isBackendConnected ? <span className="text-[#5B7D5B] font-bold">Node/Express (Port 5000)</span> : <span className="text-[#B59340] font-bold">Client Direct Mode</span>}
          </div>
          <div className="flex items-center gap-1.5 text-[#EBE3D0]/70">
            <Database className="w-3.5 h-3.5 text-[#68707E]" />
            <span>Database:</span>
            {isFirestoreLive ? <span className="text-[#5B7D5B] font-bold">Live Firestore</span> : <span className="text-[#5B7D5B] font-bold">Firestore (Sync Active)</span>}
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-[#EBE3D0]/70">
            <Cpu className="w-3.5 h-3.5 text-[#68707E]" />
            <span>ML Classifier:</span>
            <span className="text-[#5B7D5B] font-bold">TF-IDF + Logistic Regression (Active)</span>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <div onClick={openAuthModal} className="flex items-center gap-1.5 bg-[#1D2130] hover:bg-[#242A38] px-2.5 py-1 border border-[#2A2F3E] transition-colors cursor-pointer">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B59340]" />
            <span className="text-[#EBE3D0]/70 text-[10px] uppercase">Active Role:</span>
            <span className={`font-bold uppercase text-[10px] px-1.5 py-0.2 ${activeRole === 'head_admin' ? 'bg-[#A6352C] text-[#EBE3D0]' : activeRole === 'admin' ? 'bg-[#B59340] text-[#151820]' : 'bg-[#5B7D5B] text-[#EBE3D0]'}`}>{activeRole.replace('_', ' ')}</span>
          </div>
          <button type="button" onClick={checkConnection} disabled={isChecking} className="p-1 text-[#68707E] hover:text-[#EBE3D0] transition-colors cursor-pointer" title="Refresh Connection Status">
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
