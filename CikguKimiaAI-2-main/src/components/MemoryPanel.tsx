import { motion } from "motion/react";
import { X, AlertCircle, ImagePlus, Target, Trophy } from "lucide-react";
import { StudentMemory } from "../services/memoryService";

interface MemoryPanelProps {
  memory: StudentMemory;
  onClose: () => void;
}

/**
 * Slide-in "Progres saya" panel.
 *
 * Renders ONLY real data from the memory layer (no more hard-coded fake
 * "syllabus insights"). Empty states invite action instead of showing
 * placeholder content.
 */
export function MemoryPanel({ memory, onClose }: MemoryPanelProps) {
  const weakCount = memory.weakTopics?.length ?? 0;
  const mistakeCount = memory.identifiedMistakes?.length ?? 0;
  const examCount = memory.examPapersAnalysis?.length ?? 0;
  const streak = memory.currentStreak ?? 0;
  const longest = memory.longestStreak ?? 0;
  const masteryEntries = Object.entries(memory.mastery ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="absolute inset-y-0 right-0 w-full sm:w-96 bg-white border-l border-slate-200 z-50 shadow-2xl overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 flex justify-between items-center">
        <div>
          <h3 className="font-display text-2xl text-slate-900 leading-none">Progres saya</h3>
          <p className="text-[10px] font-mono font-semibold text-slate-400 tracking-widest uppercase mt-1.5">
            Disimpan oleh Cikgu
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition" aria-label="Tutup">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="px-6 py-6 space-y-8">

        {/* Streak + summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <div className="text-[10px] font-mono font-semibold text-orange-600/70 tracking-widest uppercase">Streak</div>
            <div className="font-display text-3xl text-orange-700 leading-none mt-2 flex items-baseline gap-1.5">
              🔥 {streak}
            </div>
            <div className="text-[11px] text-orange-700/70 mt-1.5">terpanjang · {longest}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase">Hari ini</div>
            <div className="font-display text-3xl text-slate-900 leading-none mt-2">
              {memory.dailyMessages ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1.5">mesej dihantar</div>
          </div>
        </div>

        {/* Mastery */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-3.5 h-3.5 text-brand-accent" />
            <h4 className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase">Penguasaan Bab</h4>
          </div>
          {masteryEntries.length > 0 ? (
            <div className="space-y-2">
              {masteryEntries.slice(0, 8).map(([topicId, pct]) => (
                <div key={topicId}>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="text-slate-700 font-medium truncate">{topicId}</span>
                    <span className="font-mono text-slate-500">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full bg-brand-accent rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint
              icon={<Trophy className="w-4 h-4 text-slate-400" />}
              text="Jawab kuiz / latihan untuk mula bina penguasaan."
            />
          )}
        </section>

        {/* Weak topics */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <h4 className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase">Perlu Tumpuan</h4>
          </div>
          {weakCount > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {memory.weakTopics.map((topic, i) => (
                <span key={i} className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-medium border border-rose-100">
                  {topic}
                </span>
              ))}
            </div>
          ) : (
            <EmptyHint
              icon={<Target className="w-4 h-4 text-slate-400" />}
              text="Cikgu akan kenal pasti topik lemah dari masa ke masa."
            />
          )}
        </section>

        {/* Mistakes */}
        {mistakeCount > 0 && (
          <section>
            <h4 className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase mb-3">
              Kesilapan dikenal pasti
            </h4>
            <div className="space-y-2">
              {memory.identifiedMistakes.slice(-5).map((m, i) => (
                <div key={i} className="px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800 leading-relaxed">
                  {m}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Exam papers */}
        <section>
          <h4 className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase mb-3">
            Analisis kertas peperiksaan
          </h4>
          {examCount > 0 ? (
            <div className="space-y-2">
              {memory.examPapersAnalysis.slice(-3).map((item, i) => (
                <div key={i} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed italic">
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint
              icon={<ImagePlus className="w-4 h-4 text-slate-400" />}
              text="Hantar gambar kertas exam — Cikgu akan analisis kelemahan."
            />
          )}
        </section>
      </div>
    </motion.aside>
  );
}

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-4 py-5 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex items-center gap-3">
      <div className="p-2 bg-white rounded-lg border border-slate-200">{icon}</div>
      <div className="text-xs text-slate-500 leading-relaxed">{text}</div>
    </div>
  );
}
