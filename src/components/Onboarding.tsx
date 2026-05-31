import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Upload, Check, X, Camera } from "lucide-react";
import { SYLLABUS_TOPICS } from "../constants";
import { memoryService } from "../services/memoryService";
import { useFirebase } from "../lib/FirebaseProvider";
import { compressImageFile } from "../lib/imageCompress";

interface OnboardingProps {
  onDone: () => void;
}

const STORAGE_KEY = "cikgu:onboarded:v1";

export function hasOnboarded(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function markOnboarded() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, "1");
}

/**
 * 3-step first-run flow:
 *   1. Pick your form (T4 or T5 — primary focus)
 *   2. Pick a chapter you find difficult (seeds weakTopics)
 *   3. Optional: upload latest exam paper (seeds examPapersAnalysis)
 */
export function Onboarding({ onDone }: OnboardingProps) {
  const { user } = useFirebase();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<4 | 5 | null>(null);
  const [weak, setWeak] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const formTopics = SYLLABUS_TOPICS.filter(t => t.form === form);

  const finish = async (skipUpload = false) => {
    if (user) {
      try {
        await memoryService.saveMemory(user.uid, { 
          weakTopics: weak,
          form: form ?? undefined
        });
      } catch (e) {
        console.error("onboarding save failed", e);
      }
    }
    markOnboarded();
    if (skipUpload) onDone();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const compressed = await compressImageFile(file);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: "",
          images: [{ mimeType: compressed.mimeType, data: compressed.base64 }],
        }),
      });
      const data = await res.json();
      if (data.analysis?.examPapersAnalysis?.length) {
        await memoryService.saveMemory(user.uid, {
          examPapersAnalysis: data.analysis.examPapersAnalysis,
          weakTopics: [...weak, ...(data.analysis.weakTopics ?? [])],
        });
      }
      await finish(false);
      onDone();
    } catch (err) {
      console.error("Onboarding upload failed", err);
      await finish(false);
      onDone();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-stone-50 flex flex-col">
      {/* Progress */}
      <div className="px-6 sm:px-12 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all ${s <= step ? "bg-brand-accent w-12" : "bg-slate-200 w-8"}`}
            />
          ))}
        </div>
        <button
          onClick={() => { markOnboarded(); onDone(); }}
          className="text-xs text-slate-400 hover:text-slate-600 font-medium font-display"
        >
          Langkau
        </button>
      </div>

      <div className="flex-grow flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="max-w-xl w-full">
          <AnimatePresence mode="wait">

            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="text-[10px] font-mono font-semibold text-brand-accent tracking-widest uppercase mb-3">
                  Langkah 1 / 3
                </div>
                <h2 className="font-display text-4xl sm:text-5xl text-slate-900 leading-tight mb-3">
                  Anda di tingkatan mana?
                </h2>
                <p className="text-slate-500 mb-10 leading-relaxed">
                  Cikgu akan utamakan silabus tingkatan ini, tapi anda boleh tanya soalan dari mana-mana bab.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[4, 5].map(f => (
                    <button
                      key={f}
                      onClick={() => setForm(f as 4 | 5)}
                      className={`relative p-8 rounded-2xl border-2 transition-all text-left ${
                        form === f
                          ? "border-brand-accent bg-brand-accent/5"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {form === f && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-accent flex items-center justify-center border-2 border-white shadow-sm">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="text-[10px] font-mono font-semibold text-slate-400 tracking-widest uppercase mb-2">
                        Tingkatan
                      </div>
                      <div className="font-display text-5xl text-slate-900 leading-none">{f}</div>
                      <div className="text-xs text-slate-500 mt-3">
                        {f === 4 ? "8 bab · asas" : "5 bab · lanjutan"}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  disabled={!form}
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  Teruskan <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 2 && form && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="text-[10px] font-mono font-semibold text-brand-accent tracking-widest uppercase mb-3">
                  Langkah 2 / 3
                </div>
                <h2 className="font-display text-4xl sm:text-5xl text-slate-900 leading-tight mb-3">
                  Bab mana paling mencabar?
                </h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  Pilih satu atau dua. Cikgu akan tumpukan latihan pada bab-bab ini.
                </p>

                <div className="space-y-2 mb-8">
                  {formTopics.map(t => {
                    const picked = weak.includes(t.title);
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setWeak(prev => picked
                            ? prev.filter(x => x !== t.title)
                            : prev.length < 2 ? [...prev, t.title] : prev);
                        }}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                          picked
                            ? "border-brand-accent bg-brand-accent/5"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                          picked ? "bg-brand-accent border-brand-accent" : "border-slate-300"
                        }`}>
                          {picked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{t.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-grow py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
                  >
                    Teruskan <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="text-[10px] font-mono font-semibold text-brand-accent tracking-widest uppercase mb-3">
                  Langkah 3 / 3 · pilihan
                </div>
                <h2 className="font-display text-4xl sm:text-5xl text-slate-900 leading-tight mb-3">
                  Ada kertas peperiksaan terkini?
                </h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  Hantar gambar — Cikgu akan kenal pasti corak kesilapan dan tumpukan latihan pada kelemahan sebenar anda. Boleh langkau sekarang dan hantar nanti.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Option 1: File Browser / Media Library */}
                  <div 
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-brand-accent hover:bg-brand-accent/5 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px]"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Upload className="w-7 h-7 text-slate-400 mb-2" />
                    <div className="font-semibold text-slate-700 text-sm">
                      {uploading ? "Sedang proses…" : "Muat Naik Gambar"}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Pilih dari galeri foto</div>
                  </div>

                  {/* Option 2: Direct Phone Camera */}
                  <div 
                    onClick={() => !uploading && cameraInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 rounded-2xl p-6 text-center hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px]"
                  >
                    <input
                      type="file"
                      ref={cameraInputRef}
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Camera className="w-7 h-7 text-emerald-500 mb-2" />
                    <div className="font-semibold text-emerald-700 text-sm">
                      Snap Kamera Live 
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Tangkap terus dengan kamera telefon</div>
                  </div>
                </div>

                {uploading && (
                  <div className="text-center py-2 text-xs font-mono font-bold text-brand-accent animate-pulse mb-3 bg-red-50 border border-red-100 rounded-xl">
                    🔄 Cikgu AI sedang menganalisis kertas exam anda... Sila tunggu sebentar.
                  </div>
                )}

                <button
                  onClick={async () => { await finish(true); onDone(); }}
                  disabled={uploading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-3 transition active:scale-[0.98]"
                >
                  {uploading ? "Tunggu…" : "Mula belajar — langkau buat masa ini"}
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 mt-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                >
                  Kembali
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
