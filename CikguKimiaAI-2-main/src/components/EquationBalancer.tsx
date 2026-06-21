import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, RefreshCw, Wand2, Info } from "lucide-react";
import { GeminiService } from "../services/geminiService";
import { memoryService, StudentMemory } from "../services/memoryService";
import { useFirebase } from "../lib/FirebaseProvider";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "../lib/utils";

interface EquationBalancerProps {
  onClose: () => void;
}

/**
 * Equation Balancer — v2
 *  - Stripped "IoTera Neural Engine", "Status: Balanced", "Verified for KSSM" HUD chrome
 *  - Calmer card; result on a single light bubble, explanation below
 */
export function EquationBalancer({ onClose }: EquationBalancerProps) {
  const { user } = useFirebase();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [memory, setMemory] = useState<StudentMemory>({
    weakTopics: [],
    identifiedMistakes: [],
    examPapersAnalysis: []
  });

  useEffect(() => {
    if (user) memoryService.getMemory(user.uid).then(setMemory);
  }, [user]);

  const gemini = useMemo(() => new GeminiService(memory), [memory]);

  const handleBalance = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const response = await gemini.sendMessage(
        `Balance this chemical equation: ${input}.\n\n` +
        `Format your response EXACTLY:\n\n` +
        `[EQUATION]\nthe balanced equation in LaTeX, e.g. $2H_2 + O_2 \\rightarrow 2H_2O$\n[/EQUATION]\n\n` +
        `[EXPLANATION]\nClear step-by-step explanation in Bahasa Melayu, with bullets.\n` +
        `Identify the reaction type (Pembakaran, Peneutralan, dll). Follow SPM KSSM format.\n[/EXPLANATION]`
      );
      setResult(response);
    } catch (e) {
      console.error(e);
      setResult("Maaf, Cikgu gagal mengimbang persamaan ini. Sila pastikan formula kimia betul.");
    } finally {
      setIsLoading(false);
    }
  };

  const parsed = useMemo(() => {
    if (!result) return null;
    const eq = result.match(/\[EQUATION\]([\s\S]*?)\[\/EQUATION\]/i);
    const ex = result.match(/\[EXPLANATION\]([\s\S]*?)\[\/EXPLANATION\]/i);
    return {
      equation: eq ? eq[1].trim() : result.split("\n\n")[0],
      explanation: ex ? ex[1].trim() : (result.includes("\n\n") ? result.substring(result.indexOf("\n\n") + 2) : result)
    };
  }, [result]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 60, scale: 0.96 }}
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] border border-slate-200"
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center">
              <RefreshCw className={cn("w-5 h-5 text-brand-accent", isLoading && "animate-spin")} />
            </div>
            <div>
              <h3 className="font-display text-xl text-slate-900 leading-none">Imbang Persamaan</h3>
              <p className="text-[10px] font-mono text-slate-400 tracking-widest uppercase mt-1.5">
                Persamaan & jenis tindak balas
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-7 py-6 flex-1 overflow-y-auto space-y-6">
          {/* Input */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase">
              Persamaan kimia
            </label>
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="cth: H2 + O2 = H2O"
                onKeyDown={(e) => e.key === "Enter" && handleBalance()}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-accent focus:bg-white transition"
              />
              <button
                onClick={handleBalance}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-2 bottom-2 px-5 bg-brand-accent hover:bg-brand-accent/90 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-semibold text-sm transition active:scale-95 flex items-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span className="hidden sm:inline">Imbang</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
              <Info className="w-3 h-3 text-slate-400" />
              Guna <code className="text-brand-accent bg-brand-accent/5 px-1.5 py-0.5 rounded-md">=</code> atau{" "}
              <code className="text-brand-accent bg-brand-accent/5 px-1.5 py-0.5 rounded-md">→</code> antara bahan dan hasil.
            </div>
          </div>

          {/* Result */}
          <AnimatePresence mode="wait">
            {parsed && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="p-6 bg-slate-900 text-white rounded-2xl">
                  <div className="text-[10px] font-mono text-slate-400 tracking-widest uppercase mb-4">
                    Persamaan seimbang
                  </div>
                  <div className="flex justify-center items-center py-2 text-2xl sm:text-3xl">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {parsed.equation}
                    </ReactMarkdown>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase mb-3">
                    Penerangan
                  </div>
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
                    <div className="prose prose-sm prose-slate max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {parsed.explanation}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-7 py-4 bg-stone-50 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
          <b>Tips:</b> Bilangan atom di kiri & kanan panah mesti sama. Untuk persamaan ion, jangan lupa cas.
        </div>
      </motion.div>
    </motion.div>
  );
}
