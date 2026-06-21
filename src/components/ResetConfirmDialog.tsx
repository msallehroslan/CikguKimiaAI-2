import { motion } from "motion/react";
import { X, Trash2, AlertTriangle } from "lucide-react";

interface ResetConfirmDialogProps {
  topicTitle: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

/**
 * Confirmation dialog before the student resets their conversational session history.
 */
export function ResetConfirmDialog({
  topicTitle,
  onClose,
  onConfirm,
  isLoading = false,
}: ResetConfirmDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !isLoading && onClose()}
    >
      <motion.div
        initial={{ y: 30, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 30, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200"
      >
        <div className="px-6 py-6 sm:p-7">
          <div className="flex justify-between items-start mb-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1.5 hover:bg-stone-100 rounded-lg transition text-stone-400 disabled:opacity-50"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 leading-tight mb-2">
            Mula Semula Sesi Saya?
          </h3>
          
          <div className="space-y-3 mb-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              Tindakan ini akan memadamkan secara kekal semua sejarah perbualan anda bagi topik ini:
            </p>
            
            <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-750 text-xs font-semibold">
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-0.5">Topik</span>
              {topicTitle}
            </div>

            <p className="text-xs text-rose-600 bg-rose-50/50 border border-rose-100/70 rounded-xl px-4 py-2.5 leading-relaxed">
              ⚠️ <b>Perhatian:</b> Sesi ini akan bermula kembali dari awal dan semua mesej sebelum ini tidak dapat dikembalikan lagi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row-reverse gap-2">
            <button
              id="btn-confirm-reset"
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold text-white text-xs tracking-wide shadow-md hover:shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Ya, Mula Semula
            </button>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl border border-stone-250 text-stone-600 hover:bg-stone-50 font-semibold text-xs transition active:scale-[0.98] disabled:opacity-65"
            >
              Batal
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
