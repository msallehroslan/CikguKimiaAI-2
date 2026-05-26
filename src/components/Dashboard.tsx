import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Trophy, Flame, MessageCircle, AlertCircle, BookOpen } from "lucide-react";
import { useFirebase } from "../lib/FirebaseProvider";
import { memoryService, StudentMemory, DAILY_CAP, DAILY_CAP_PREMIUM, isAdmin } from "../services/memoryService";
import { SYLLABUS_TOPICS, Topic } from "../constants";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { navigate } from "../lib/router";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface DashboardProps {
  onPickTopic: (topic: Topic) => void;
  onUpgradeClick?: () => void;
}

interface RecentThread {
  topicId: string;
  topic?: Topic;
  lastText: string;
  at: Date;
}

/**
 * Logged-in landing page. Uses real memory data + recent threads to give the
 * student one obvious next step. Replaces the v1 TopicExplorer "Neural Feed"
 * grid which showed cosmetic content over real personalised guidance.
 */
export function Dashboard({ onPickTopic, onUpgradeClick }: DashboardProps) {
  const { user, isSubscriber, subscriptionPlan } = useFirebase();
  const isEffectiveSubscriber = isSubscriber || (user ? isAdmin(user.email) : false);
  const [memory, setMemory] = useState<StudentMemory | null>(null);
  const [recent, setRecent] = useState<RecentThread[]>([]);
  const [insights, setInsights] = useState<{ topic: string; insight: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    memoryService.getMemory(user.uid).then(setMemory).catch(console.error);
    loadRecent();
    loadInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSubscriber]);

  const loadRecent = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, `users/${user.uid}/history`),
        orderBy("timestamp", "desc"),
        limit(40)
      );
      const snap = await getDocs(q);
      const seen = new Map<string, RecentThread>();
      snap.docs.forEach(d => {
        const data = d.data();
        if (!data.topicId) return;
        if (seen.has(data.topicId)) return;
        const topic = SYLLABUS_TOPICS.find(t => t.id === data.topicId);
        seen.set(data.topicId, {
          topicId: data.topicId,
          topic,
          lastText: data.text || "",
          at: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
        });
      });
      setRecent([...seen.values()].slice(0, 4));
    } catch (e) {
      console.error("recent threads failed", e);
    }
  };

  const loadInsights = async () => {
    try {
      const q = query(collection(db, "global_insights"), orderBy("createdAt", "desc"), limit(3));
      const snap = await getDocs(q);
      setInsights(snap.docs.map(d => d.data() as any));
    } catch (e) {
      // not critical
    }
  };

  if (!memory) {
    return <div className="h-full flex items-center justify-center text-slate-400 text-sm">Memuatkan…</div>;
  }

  const streak = memory.currentStreak ?? 0;
  const used = memory.dailyMessages ?? 0;
  const remaining = Math.max(0, DAILY_CAP - used);
  const weakTopics = memory.weakTopics ?? [];
  const mastery = memory.mastery ?? {};
  const mostRecent = recent[0];

  const firstName = user?.displayName?.split(" ")[0] ?? "Pelajar";

  // Pick the "next step" suggestion
  const suggested: { topic: Topic; reason: string } | null = (() => {
    // 1. If we have weak topics, prioritize explaining those
    if (weakTopics.length > 0) {
      const t = SYLLABUS_TOPICS.find(t =>
        weakTopics.some(w => t.title.toLowerCase().includes(w.toLowerCase()) || w.toLowerCase().includes(t.title.toLowerCase()) || t.id === w)
      );
      if (t) return {
        topic: t,
        reason: "Berdasarkan sejarah anda, bab ini perlukan perhatian lebih."
      };
    }
    // 2. Otherwise suggest continuing where they left off
    if (mostRecent?.topic) {
      const days = Math.floor((Date.now() - mostRecent.at.getTime()) / 86_400_000);
      return {
        topic: mostRecent.topic,
        reason: days > 0
          ? `Sesi terakhir anda ${days} hari lepas.`
          : "Sambung sesi terakhir anda.",
      };
    }
    // 3. Fallback to Form-based starting point
    const fallbackId = (memory as any).form === 5 ? "f5-c1" : "f4-c1";
    const fallback = SYLLABUS_TOPICS.find(st => st.id === fallbackId);
    if (fallback) return {
      topic: fallback,
      reason: "Mari mulakan pengenalan Kimia hari ini.",
    };

    return null;
  })();

  return (
    <div className="h-full overflow-y-auto bg-stone-50">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12 sm:py-16">

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="text-[10px] font-mono font-semibold text-slate-400 tracking-widest uppercase mb-2">
            {new Date().toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-slate-900 leading-tight tracking-tight">
            Salam, {firstName}.{" "}
            {streak > 0 && <em className="text-brand-accent">Hari ke-{streak}.</em>}
          </h1>
          <p className="text-slate-500 mt-2.5 text-base">
            {streak === 0 ? "Mari mula hari ini." : "Teruskan momentum belajar Kimia anda."}
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <StatCard
            label="Mesej hari ini"
            value={`${used} / ${isEffectiveSubscriber ? DAILY_CAP_PREMIUM : DAILY_CAP}`}
            sub={isEffectiveSubscriber ? "Pakej Premium Cikgu Pro 👑" : "Pakej Percuma / Had Percubaan"}
            icon={<MessageCircle className="w-4 h-4" />}
          />
          <StatCard
            label="Streak"
            value={`🔥 ${streak}`}
            sub={`terpanjang · ${memory.longestStreak ?? streak}`}
            icon={<Flame className="w-4 h-4 text-orange-500" />}
          />
          <StatCard
            label="Bab disentuh"
            value={`${Object.keys(mastery).length} / 13`}
            sub={Object.keys(mastery).length === 0 ? "mula dengan mana-mana bab" : "teruskan"}
            icon={<Trophy className="w-4 h-4 text-brand-accent" />}
            className="col-span-2 lg:col-span-1"
          />
        </div>

        {/* Premium Promo Bannder (Visible only to non-subscribers) */}
        {!isEffectiveSubscriber ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="text-center sm:text-left">
              <div className="font-display font-bold text-slate-900 text-sm flex items-center justify-center sm:justify-start gap-1.5 ">
                👑 Naik Taraf Ke Cikgu Premium Pro
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Kunci had {DAILY_CAP_PREMIUM} soalan sehari, soalan KBAT SPM lanjutan, & keutamaan respons pelayan.
              </p>
            </div>
            <button
              onClick={onUpgradeClick}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs tracking-wide shadow-md transition active:scale-[0.98] shrink-0"
            >
              Langgan Sekarang
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 mb-8 flex items-center gap-3"
          >
            <span className="text-lg">👑</span>
            <div className="text-xs text-slate-700 leading-normal">
              Status anda: <span className="font-bold text-emerald-700">Pelajar VIP Cikgu Premium ({subscriptionPlan === "trial" && (user && isAdmin(user.email)) ? "Akses Admin" : (subscriptionPlan === "yearly" ? "Tahunan" : "Bulanan")})</span>. Terima kasih atas sokongan anda! Anda mendapat akses keutamaan.
            </div>
          </motion.div>
        )}

        {/* Continue card */}
        {suggested && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => onPickTopic(suggested.topic)}
            className="w-full text-left mb-8 group relative overflow-hidden bg-brand-navy text-white rounded-2xl p-7 sm:p-9 shadow-xl hover:shadow-2xl transition-all"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 blur-3xl rounded-full -translate-y-32 translate-x-20 pointer-events-none" />
            <div className="relative">
              <div className="text-[10px] font-mono font-semibold text-brand-accent-soft tracking-widest uppercase mb-3">
                → Teruskan
              </div>
              <div className="font-display text-3xl sm:text-4xl leading-tight mb-2">
                {suggested.topic.title}
              </div>
              <p className="text-slate-400 text-sm mb-5">{suggested.reason}</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full text-sm font-semibold group-hover:gap-3 transition-all">
                Mula belajar <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>
        )}

        {/* Weak topics */}
        {weakTopics.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <h2 className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase">
                Tumpuan minggu ini
              </h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="space-y-3">
                {weakTopics.slice(0, 5).map((w, i) => {
                  const topic = SYLLABUS_TOPICS.find(t =>
                    t.title.toLowerCase().includes(w.toLowerCase()) || w.toLowerCase().includes(t.title.toLowerCase())
                  );
                  const pct = topic ? mastery[topic.id] ?? 30 : 30;
                  return (
                    <button
                      key={i}
                      onClick={() => topic && onPickTopic(topic)}
                      className="w-full flex items-center justify-between gap-3 group hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg transition"
                    >
                      <span className="text-sm font-medium text-slate-800 flex-shrink-0 text-left">{topic?.title ?? w}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-accent rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono text-xs text-slate-500 w-12 text-right">{pct}%</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Recent threads */}
        {recent.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <h2 className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase">
                Sesi lepas
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recent.map(r => (
                <button
                  key={r.topicId}
                  onClick={() => r.topic && onPickTopic(r.topic)}
                  className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-accent/30 transition group"
                >
                  <div className="text-[10px] font-mono font-semibold text-slate-400 tracking-widest uppercase mb-1.5">
                    {r.at.toLocaleDateString("ms-MY", { day: "numeric", month: "short" })}
                  </div>
                  <div className="font-display text-lg text-slate-900 leading-tight mb-1.5">
                    {r.topic?.title ?? r.topicId.replace(/-/g, " ")}
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {r.lastText && (r.lastText.trim().startsWith("<") || r.lastText.toLowerCase().includes("<html") || r.lastText.toLowerCase().includes("<!doctype"))
                      ? "Sesi bimbingan interaktif dan latihan soalan."
                      : r.lastText.replace(/[*#`_>]/g, "").slice(0, 120)}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Global insights — only if we actually have data */}
        {insights.length > 0 && (
          <section>
            <h2 className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase mb-4">
              Daripada pelajar lain
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {insights.map((it, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="text-[10px] font-mono font-semibold text-brand-accent tracking-widest uppercase mb-2">
                    {it.topic}
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {`"${it.insight}"`}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, icon, className = "",
}: {
  label: string; value: string; sub: string; icon: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase">{label}</div>
        <div className="text-slate-400">{icon}</div>
      </div>
      <div className="font-display text-3xl text-slate-900 leading-none">{value}</div>
      <div className="text-[11px] text-slate-500 mt-1.5">{sub}</div>
    </div>
  );
}
