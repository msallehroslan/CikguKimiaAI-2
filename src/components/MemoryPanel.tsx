import { useState } from "react";
import { motion } from "motion/react";
import { X, AlertCircle, ImagePlus, Target, Trophy, Bell, Check, Loader2 } from "lucide-react";
import { StudentMemory } from "../services/memoryService";
import { reminderService, ReminderPrefs } from "../services/reminderService";

interface MemoryPanelProps {
  memory: StudentMemory;
  userId: string;
  onClose: () => void;
  onUpdateMemory: (mem: StudentMemory) => void;
}

/**
 * Slide-in "Progres saya" panel.
 *
 * Renders real data from the memory layer and includes study reminders settings (Option B).
 */
export function MemoryPanel({ memory, userId, onClose, onUpdateMemory }: MemoryPanelProps) {
  const weakCount = memory.weakTopics?.length ?? 0;
  const mistakeCount = memory.identifiedMistakes?.length ?? 0;
  const examCount = memory.examPapersAnalysis?.length ?? 0;
  const streak = memory.currentStreak ?? 0;
  const longest = memory.longestStreak ?? 0;
  const masteryEntries = Object.entries(memory.mastery ?? {}).sort((a, b) => b[1] - a[1]);

  const currentPrefs: ReminderPrefs = memory.reminderPrefs || {
    channel: "off",
    preferredHour: 19,
  };

  const [channel, setChannel] = useState<"off" | "telegram" | "in-app">(currentPrefs.channel);
  const [preferredHour, setPreferredHour] = useState<number>(currentPrefs.preferredHour);
  const [linkCode, setLinkCode] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleChannelChange = async (newChannel: "off" | "telegram" | "in-app") => {
    setChannel(newChannel);
    setLinkError("");
    setLinkSuccess("");
    if (!userId) return;

    try {
      setIsSaving(true);
      const updatedPrefs = await reminderService.setPrefs(userId, { channel: newChannel });
      onUpdateMemory({
        ...memory,
        reminderPrefs: updatedPrefs,
      });
    } catch (err) {
      console.error("Gagal menukar saluran peringatan:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleHourChange = async (hour: number) => {
    setPreferredHour(hour);
    if (!userId) return;

    try {
      setIsSaving(true);
      const updatedPrefs = await reminderService.setPrefs(userId, { preferredHour: hour });
      onUpdateMemory({
        ...memory,
        reminderPrefs: updatedPrefs,
      });
    } catch (err) {
      console.error("Gagal menukar masa peringatan:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkTelegram = async () => {
    setLinkError("");
    setLinkSuccess("");
    if (!linkCode.trim()) {
      setLinkError("Sila masukkan kod pautan.");
      return;
    }

    try {
      setIsLinking(true);
      const res = await reminderService.linkTelegram(userId, linkCode);
      if (res.success) {
        setLinkSuccess(res.message);
        setLinkCode("");
        // Update local memory state
        onUpdateMemory({
          ...memory,
          reminderPrefs: {
            ...currentPrefs,
            channel: "telegram",
            telegramChatId: res.telegramChatId || null,
          }
        });
      } else {
        setLinkError(res.message);
      }
    } catch (err: any) {
      setLinkError(err.message || "Gagal menghubungkan bot Telegram.");
    } finally {
      setIsLinking(false);
    }
  };

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

        {/* Peringatan Belajar / Reminders Section */}
        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-accent animate-pulse" />
            <h4 className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase">
              Peringatan Belajar
            </h4>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Dapatkan peringatan belajar automatik berdasarkan topik lemah anda untuk mengelakkan streak terputus.
          </p>

          {/* Channel buttons */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Saluran Peringatan</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(["off", "telegram", "in-app"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleChannelChange(ch)}
                  className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                    channel === ch
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {ch === "off" ? "Matikan" : ch === "telegram" ? "Telegram" : "Dalam App"}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred hour selection */}
          {channel !== "off" && (
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Masa Peringatan</label>
              <select
                value={preferredHour}
                onChange={(e) => handleHourChange(Number(e.target.value))}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-brand-accent outline-none text-slate-700 font-medium"
              >
                {Array.from({ length: 24 }).map((_, h) => {
                  const ampm = h >= 12 ? "PM" : "AM";
                  const displayHour = h % 12 === 0 ? 12 : h % 12;
                  return (
                    <option key={h} value={h}>
                      {`${displayHour}:00 ${ampm} (${String(h).padStart(2, "0")}:00)`}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Telegram pairing UI */}
          {channel === "telegram" && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              {currentPrefs.telegramChatId ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5">
                  <div className="p-1 bg-emerald-100 rounded-full text-emerald-600 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-emerald-800">Telegram Berjaya Dipautkan</div>
                    <div className="text-[10px] text-emerald-600 font-mono mt-0.5">ID Sembang: {currentPrefs.telegramChatId}</div>
                    <button
                      onClick={() => handleChannelChange("off")}
                      className="text-[10px] text-rose-500 hover:underline mt-2 font-medium block"
                    >
                      Putuskan Pautan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 space-y-3">
                  <div className="text-xs text-amber-800 font-semibold">Langkah Pautan Telegram:</div>
                  <ol className="text-[11px] text-amber-700/90 list-decimal pl-4 space-y-1.5 leading-relaxed">
                    <li>
                      Buka bot Telegram:{" "}
                      <a
                        href="https://t.me/cikgu_kimia_bot"
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-bold text-brand-accent hover:opacity-80"
                      >
                        @cikgu_kimia_bot
                      </a>
                    </li>
                    <li>Hantar mesej <b>/link</b> di dalam sembang bersama bot.</li>
                    <li>Salin 6-aksara kod pautan yang diberikan oleh bot.</li>
                  </ol>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-semibold text-slate-500 block uppercase">Kod Pautan</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="E.g. AX7B9"
                        value={linkCode}
                        onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                        className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-accent outline-none font-mono font-bold tracking-wider"
                      />
                      <button
                        onClick={handleLinkTelegram}
                        disabled={isLinking}
                        className="bg-brand-accent text-white text-xs font-medium px-3.5 py-1.5 rounded-lg hover:opacity-90 active:scale-95 transition disabled:opacity-50 flex items-center gap-1"
                      >
                        {isLinking ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Pautkan"
                        )}
                      </button>
                    </div>
                  </div>

                  {linkError && (
                    <div className="text-[11px] text-rose-600 font-medium leading-tight">{linkError}</div>
                  )}
                  {linkSuccess && (
                    <div className="text-[11px] text-emerald-600 font-medium leading-tight">{linkSuccess}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

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
