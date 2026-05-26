import { motion } from "motion/react";
import { X, Clock, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

interface CapDialogProps {
  resetAt: number;   // epoch ms
  cap: number;
  onClose: () => void;
}

/**
 * Friendly daily-cap-reached dialog. Replaces the v1 "Tenaga Neural Rendah"
 * dark error screen. Frames the limit as today's allowance, not a battery dying.
 */
export function CapDialog({ resetAt, cap, onClose }: CapDialogProps) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, resetAt - Date.now());
      const h = Math.floor(remaining / 3_600_000);
      const m = Math.floor((remaining % 3_600_000) / 60_000);
      setCountdown(`${h} jam ${m} min`);
    };
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, [resetAt]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 30, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 30, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200"
      >
        <div className="px-7 py-7">
          <div className="flex justify-between items-start mb-5">
            <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-2xl">
              ☕
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="font-display text-2xl text-slate-900 leading-tight mb-2">
            Cikgu perlu rehat sekejap.
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Anda sudah hantar <b>{cap} mesej</b> hari ini — bagus! Belajar sikit-sikit tapi konsisten lebih baik daripada lebihan.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase mb-2">
              <Clock className="w-3 h-3" /> Reset dalam
            </div>
            <div className="font-display text-2xl text-slate-900 leading-none">{countdown}</div>
            <div className="text-xs text-slate-500 mt-1.5">Setiap hari pada 5:00 pagi (MYT)</div>
          </div>

          <div className="bg-brand-accent/5 border border-brand-accent/10 rounded-xl p-4 mb-5 flex items-start gap-3">
            <Trophy className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
            <div className="text-xs text-brand-accent/90 leading-relaxed">
              <b>Sambung streak anda esok.</b> Datang balik selepas reset dan teruskan momentum.
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition active:scale-[0.98]"
          >
            Faham, jumpa esok
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
