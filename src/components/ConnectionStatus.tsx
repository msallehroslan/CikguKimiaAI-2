import React, { useEffect, useState } from 'react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Wifi, WifiOff, Cloud, CloudOff, Activity, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConnectionState {
  firebase: 'checking' | 'online' | 'offline';
  gemini: 'checking' | 'online' | 'offline';
  telegram: 'checking' | 'online' | 'offline';
}

export const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<ConnectionState>({
    firebase: 'checking',
    gemini: 'checking',
    telegram: 'checking'
  });
  const [isOpen, setIsOpen] = useState(false);

  const checkStatus = async () => {
    // Check Firebase
    try {
      await getDocFromServer(doc(db, 'system', 'heartbeat'));
      setStatus(prev => ({ ...prev, firebase: 'online' }));
    } catch (error) {
      if (error instanceof Error && error.message.includes('offline')) {
        setStatus(prev => ({ ...prev, firebase: 'offline' }));
      } else {
        setStatus(prev => ({ ...prev, firebase: 'online' }));
      }
    }

    // Check Gemini & Telegram (Backend Health)
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      if (data.status === 'ok') {
        setStatus(prev => ({ 
          ...prev, 
          gemini: data.gemini ? 'online' : 'offline',
          telegram: data.telegram ? 'online' : 'offline'
        }));
      } else {
        setStatus(prev => ({ ...prev, gemini: 'offline', telegram: 'offline' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, gemini: 'offline', telegram: 'offline' }));
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  const allOnline = status.firebase === 'online' && status.gemini === 'online';

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-64 mb-2 overflow-hidden"
          >
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Sistem Status
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {status.firebase === 'online' ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-rose-500" />}
                  <span>Firebase Database</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  status.firebase === 'online' ? 'bg-emerald-50 text-emerald-600' : 
                  status.firebase === 'offline' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                }`}>
                  {status.firebase === 'online' ? 'Online' : status.firebase === 'offline' ? 'Offline' : 'Checking...'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {status.gemini === 'online' ? <Cloud className="w-4 h-4 text-emerald-500" /> : <CloudOff className="w-4 h-4 text-rose-500" />}
                  <span>Cikgu AI (Enjin Pintar)</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  status.gemini === 'online' ? 'bg-emerald-50 text-emerald-600' : 
                  status.gemini === 'offline' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                }`}>
                  {status.gemini === 'online' ? 'Online' : status.gemini === 'offline' ? 'Offline' : 'Checking...'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {status.telegram === 'online' ? <MessageCircle className="w-4 h-4 text-emerald-500" /> : <MessageCircle className="w-4 h-4 text-rose-500" />}
                  <span>Telegram Bot</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  status.telegram === 'online' ? 'bg-emerald-50 text-emerald-600' : 
                  status.telegram === 'offline' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                }`}>
                  {status.telegram === 'online' ? 'Online' : status.telegram === 'offline' ? 'Offline' : 'Checking...'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        id="status-indicator-toggle"
        className={`p-3 rounded-full shadow-lg transition-all transform hover:scale-110 active:scale-95 ${
          allOnline ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'
        }`}
      >
        {allOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
      </button>
    </div>
  );
};
