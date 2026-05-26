import { SYLLABUS_TOPICS, Topic } from "../constants";
import {
  FlaskConical, BookOpen, GraduationCap, Menu, X, ChevronDown,
  Target, ClipboardCheck, History, Atom, Home, Flame
} from "lucide-react";
import { cn } from "../lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useFirebase } from "../lib/FirebaseProvider";
import { memoryService, DAILY_CAP, DAILY_CAP_PREMIUM, isAdmin } from "../services/memoryService";

interface SidebarProps {
  selectedTopicId?: string;
  onTopicSelect: (topic: Topic | null) => void;
  onHome?: () => void;
  onUpgradeClick?: () => void;
  className?: string;
}

/**
 * Sidebar v2:
 *  - Renamed everywhere from "AI Nexus / Neural Core" → "Cikgu Kimia"
 *  - Footer shows STREAK + messages remaining (not "Neural Energy" battery)
 *  - Decorative pulsing dots / italic uppercase removed
 *  - Polls memory every 60s (was 30s) — same data, less load
 */
export function Sidebar({ selectedTopicId, onTopicSelect, onHome, onUpgradeClick, className }: SidebarProps) {
  const { user, isSubscriber, subscriptionPlan } = useFirebase();
  const isEffectiveSubscriber = isSubscriber || (user ? isAdmin(user.email) : false);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedForm, setExpandedForm] = useState<number | null>(4);
  const [isLatihanExpanded, setIsLatihanExpanded] = useState(true);
  const [recentThreads, setRecentThreads] = useState<any[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [dailyMessages, setDailyMessages] = useState<number>(0);

  const form4 = SYLLABUS_TOPICS.filter(t => t.form === 4);
  const form5 = SYLLABUS_TOPICS.filter(t => t.form === 5);

  const toggleForm = (form: number) => setExpandedForm(expandedForm === form ? null : form);

  useEffect(() => {
    if (!user) return;
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedTopicId, isEffectiveSubscriber]);

  const refresh = async () => {
    if (!user) return;
    try {
      const mem = await memoryService.getMemory(user.uid);
      setStreak(mem.currentStreak ?? 0);
      setDailyMessages(mem.dailyMessages ?? 0);
    } catch (e) { console.error("sidebar memory", e); }

    try {
      const q = query(
        collection(db, `users/${user.uid}/history`),
        orderBy("timestamp", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
      const unique = new Map();
      snap.docs.forEach(d => {
        const data = d.data();
        if (!data.topicId || unique.has(data.topicId)) return;
        const found = SYLLABUS_TOPICS.find(t => t.id === data.topicId) || {
          id: data.topicId,
          title: data.topicId.includes("exam") ? "Exam Session" :
                 data.topicId.includes("quiz") ? "Quiz Session" :
                 data.topicId.charAt(0).toUpperCase() + data.topicId.slice(1).replace(/-/g, " "),
          form: 0,
        };
        unique.set(data.topicId, {
          ...found,
          lastMessage: data.text,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
        });
      });
      setRecentThreads([...unique.values()].slice(0, 5));
    } catch (e) { console.error("recent threads", e); }
  };

  const remaining = Math.max(0, DAILY_CAP - dailyMessages);

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden fixed top-3 left-3 z-[60]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 bg-white rounded-xl shadow-md border border-slate-200 text-slate-600 active:scale-95"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <motion.aside
        initial={{ x: -400 }}
        animate={{ x: 0 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 flex flex-col transition-transform lg:translate-x-0 lg:static shadow-2xl",
          !isOpen && "translate-x-[-100%] lg:translate-x-0",
          className
        )}
      >
        {/* Brand */}
        <button
          onClick={() => { onHome?.(); setIsOpen(false); }}
          className="px-6 pt-6 pb-5 border-b border-white/5 text-left flex items-center gap-3 hover:bg-white/5 transition group"
        >
          <div className="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-white/10 bg-slate-800 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Cikgu Kimia"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement!.innerHTML = `<div class="flex items-center justify-center w-full h-full text-white font-semibold text-sm">CK</div>`;
              }}
            />
          </div>
          <div>
            <div className="font-display text-xl text-white leading-none">Cikgu Kimia</div>
            <div className="text-[10px] font-mono text-slate-400 tracking-widest uppercase mt-1.5">
              KSSM SPM
            </div>
          </div>
        </button>

        {/* Scrollable nav */}
        <nav className="flex-grow overflow-y-auto p-4 space-y-7">

          {/* Home */}
          <button
            onClick={() => { onHome?.(); setIsOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition",
              !selectedTopicId
                ? "bg-white text-slate-900"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            )}
          >
            <Home className="w-4 h-4" />
            Laman utama
          </button>

          {/* Recent threads */}
          {recentThreads.length > 0 && (
            <section>
              <div className="px-2 mb-3 flex items-center gap-2">
                <History className="w-3 h-3 text-slate-500" />
                <h3 className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase">Sesi lepas</h3>
              </div>
              <div className="space-y-1">
                {recentThreads.map(thread => (
                  <button
                    key={thread.id}
                    onClick={() => { onTopicSelect(thread); setIsOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg transition flex items-center justify-between gap-2 group",
                      selectedTopicId === thread.id
                        ? "bg-brand-accent/20 text-white"
                        : "hover:bg-white/5 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <span className="text-xs font-medium truncate flex-1">{thread.title}</span>
                    <span className="text-[9px] font-mono opacity-50 flex-shrink-0">
                      {thread.timestamp.toLocaleDateString("ms-MY", { day: "numeric", month: "short" })}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Form 4 */}
          <section>
            <button
              onClick={() => toggleForm(4)}
              className="w-full px-2 mb-3 flex items-center justify-between group"
            >
              <h3 className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase group-hover:text-slate-300 transition">
                Tingkatan 4
              </h3>
              <ChevronDown className={cn("w-3 h-3 text-slate-500 transition-transform", expandedForm === 4 && "rotate-180")} />
            </button>
            <motion.div initial={false} animate={{ height: expandedForm === 4 ? "auto" : 0 }} className="space-y-1 overflow-hidden">
              {form4.map(t => <TopicRow key={t.id} topic={t} selected={selectedTopicId === t.id} onClick={() => { onTopicSelect(t); setIsOpen(false); }} />)}
            </motion.div>
          </section>

          {/* Form 5 */}
          <section>
            <button
              onClick={() => toggleForm(5)}
              className="w-full px-2 mb-3 flex items-center justify-between group"
            >
              <h3 className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase group-hover:text-slate-300 transition">
                Tingkatan 5
              </h3>
              <ChevronDown className={cn("w-3 h-3 text-slate-500 transition-transform", expandedForm === 5 && "rotate-180")} />
            </button>
            <motion.div initial={false} animate={{ height: expandedForm === 5 ? "auto" : 0 }} className="space-y-1 overflow-hidden">
              {form5.map(t => <TopicRow key={t.id} topic={t} selected={selectedTopicId === t.id} onClick={() => { onTopicSelect(t); setIsOpen(false); }} />)}
            </motion.div>
          </section>

          {/* Latihan */}
          <section>
            <button
              onClick={() => setIsLatihanExpanded(!isLatihanExpanded)}
              className="w-full px-2 mb-3 flex items-center justify-between group"
            >
              <h3 className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase group-hover:text-slate-300 transition">
                Latihan
              </h3>
              <ChevronDown className={cn("w-3 h-3 text-slate-500 transition-transform", isLatihanExpanded && "rotate-180")} />
            </button>
            <motion.div initial={false} animate={{ height: isLatihanExpanded ? "auto" : 0 }} className="space-y-1.5 overflow-hidden">
              {[
                { id: "quiz-obj",       title: "Kuiz Objektif",     icon: <Target className="w-3.5 h-3.5" /> },
                { id: "periodic-table", title: "Jadual Berkala",    icon: <Atom className="w-3.5 h-3.5" /> },
                { id: "exam-struct",    title: "Kertas 2 — Struktur", icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
                { id: "exam-essay",     title: "Kertas 2 — Esei",   icon: <GraduationCap className="w-3.5 h-3.5" /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTopicSelect({ id: item.id, title: item.title, description: item.title, form: 4, subtopics: [] });
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg transition flex items-center gap-3",
                    selectedTopicId === item.id
                      ? "bg-brand-accent text-white"
                      : "bg-white/5 hover:bg-white/10 text-slate-300"
                  )}
                >
                  <span className={cn("opacity-60", selectedTopicId === item.id && "opacity-100")}>{item.icon}</span>
                  <span className="text-xs font-medium">{item.title}</span>
                </button>
              ))}
            </motion.div>
          </section>
        </nav>

        {/* Footer — streak + messages remaining */}
        <div className="p-4 border-t border-white/5 space-y-2.5">
          {/* Subscriber Promo or Badge */}
          {isEffectiveSubscriber ? (
            <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-2xl p-2.5 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest leading-none">Status</div>
                <div className="font-display text-xs font-semibold text-white mt-1">Cikgu Pro 👑</div>
              </div>
              <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-[8px] tracking-wide uppercase px-2 py-0.5 rounded-full">
                {subscriptionPlan === "trial" && (user && isAdmin(user.email)) ? "Admin" : (subscriptionPlan === "yearly" ? "Yly" : "Mthly")}
              </span>
            </div>
          ) : (
            <button
              onClick={onUpgradeClick}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:scale-[1.02] active:scale-[0.98] transition rounded-2xl text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/5"
            >
              👑 Langgan Cikgu Pro
            </button>
          )}

          <div className="flex gap-2">
            {/* Streak */}
            <div className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2.5">
              <div className="text-[9px] font-mono font-semibold text-slate-500 tracking-widest uppercase">Streak</div>
              <div className="font-display text-xl text-white leading-none mt-1.5 flex items-baseline gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                {streak}
              </div>
            </div>
            {/* Mesej tinggal */}
            <div className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2.5">
              <div className="text-[9px] font-mono font-semibold text-slate-500 tracking-widest uppercase">Mesej</div>
              <div className="font-display text-xl text-white leading-none mt-1.5">
                {Math.max(0, (isEffectiveSubscriber ? DAILY_CAP_PREMIUM : DAILY_CAP) - dailyMessages)}
                <span className="text-slate-500 text-base">/{isEffectiveSubscriber ? DAILY_CAP_PREMIUM : DAILY_CAP}</span>
              </div>
            </div>
          </div>
          <div className="text-[9px] font-mono text-slate-500 tracking-wider text-center">
            {isEffectiveSubscriber ? "Sokongan Prioriti GPU aktif" : "reset 5:00 pagi MYT"}
          </div>
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}

function TopicRow({ topic, selected, onClick }: { topic: Topic; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg transition flex items-start gap-3 group",
        selected
          ? "bg-white/10 text-white"
          : "hover:bg-white/5 text-slate-400 hover:text-slate-200"
      )}
    >
      <BookOpen className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", selected ? "text-brand-accent-soft" : "text-slate-500")} />
      <div className="min-w-0">
        <div className="text-xs font-medium leading-snug line-clamp-2">{topic.title}</div>
        <div className="text-[9px] font-mono opacity-50 mt-0.5">
          Bab {topic.id.split("-c")[1]}
        </div>
      </div>
    </button>
  );
}
