import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';
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
    <div className="bg-[#1C1C1C] text-[#FAF9F6] border-b-2 border-[#1C1C1C] text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: System Status Chips */}
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] uppercase tracking-wider text-emerald-400">SAGE SYSTEM LIVE</span>
          </div>

          {/* Backend Status */}
          <div className="flex items-center gap-1.5 text-stone-300">
            <Server className="w-3.5 h-3.5 text-stone-400" />
            <span>Backend:</span>
            {isBackendConnected ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Node/Express (Port 5000)
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                Client Direct Mode
              </span>
            )}
          </div>

          {/* Firestore Status */}
          <div className="flex items-center gap-1.5 text-stone-300">
            <Database className="w-3.5 h-3.5 text-stone-400" />
            <span>Database:</span>
            {isFirestoreLive ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Live Firestore
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Firestore (Sync Active)
              </span>
            )}
          </div>

          {/* ML Urgency Classifier Status */}
          <div className="hidden md:flex items-center gap-1.5 text-stone-300">
            <Cpu className="w-3.5 h-3.5 text-stone-400" />
            <span>ML Classifier:</span>
            <span className="text-emerald-400 font-bold">
              TF-IDF + Logistic Regression (Active)
            </span>
          </div>
        </div>

        {/* Right: Active Role & Role Switcher */}
        <div className="flex items-center gap-3 ml-auto">
          <div 
            onClick={openAuthModal}
            className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 px-2.5 py-1 border border-stone-600 transition-colors cursor-pointer"
            title="Click to change Firebase Auth Role"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-stone-300 text-[10px] uppercase">Active Role:</span>
            <span className={`font-bold uppercase text-[10px] px-1.5 py-0.2 ${
              activeRole === 'head_admin'
                ? 'bg-red-700 text-white'
                : activeRole === 'admin'
                ? 'bg-amber-600 text-white'
                : 'bg-emerald-800 text-white'
            }`}>
              {activeRole.replace('_', ' ')}
            </span>
          </div>

          <button
            type="button"
            onClick={checkConnection}
            disabled={isChecking}
            className="p-1 text-stone-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh Connection Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
