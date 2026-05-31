import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Trophy, Flame, MessageCircle, AlertCircle, BookOpen, Camera } from "lucide-react";
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

  // Admin Panel states
  const [adminTab, setAdminTab] = useState<"students" | "knowledge" | "exams">("students");

  // Custom knowledge base states for Admin Panel
  const [customFacts, setCustomFacts] = useState<any[]>([]);
  const [loadingFacts, setLoadingFacts] = useState(false);
  const [editingFact, setEditingFact] = useState<any | null>(null);
  const [showFactForm, setShowFactForm] = useState(false);
  const [idInput, setIdInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [contextInput, setContextInput] = useState("");
  const [pointsInput, setPointsInput] = useState<string[]>([""]);
  const [formStatus, setFormStatus] = useState({ type: "", text: "" });

  // Student list tracking states
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Custom exam questions management states
  const [customExams, setCustomExams] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [showExamForm, setShowExamForm] = useState(false);
  const [examIdInput, setExamIdInput] = useState("");
  const [examTitleInput, setExamTitleInput] = useState("");
  const [examTopicInput, setExamTopicInput] = useState("general");
  const [examPaperTypeInput, setExamPaperTypeInput] = useState<"struct" | "essay">("struct");
  const [examQuestionInput, setExamQuestionInput] = useState("");
  const [examMarkingSchemeInput, setExamMarkingSchemeInput] = useState("");
  const [examFormStatus, setExamFormStatus] = useState({ type: "", text: "" });

  // AI Ingest state fields
  const [ingestDraftText, setIngestDraftText] = useState("");
  const [ingestFile, setIngestFile] = useState<File | null>(null);
  const [ingestFilePreview, setIngestFilePreview] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestStatus, setIngestStatus] = useState("");

  // AI Ingest Notes state fields
  const [ingestNoteDraft, setIngestNoteDraft] = useState("");
  const [ingestNoteFile, setIngestNoteFile] = useState<File | null>(null);
  const [ingestNotePreview, setIngestNotePreview] = useState("");
  const [ingestNoteLoading, setIngestNoteLoading] = useState(false);
  const [ingestNoteStatus, setIngestNoteStatus] = useState("");

  useEffect(() => {
    if (!user) return;
    memoryService.getMemory(user.uid).then(setMemory).catch(console.error);
    loadRecent();
    loadInsights();
    if (isAdmin(user.email)) {
      loadFacts();
      loadStudents();
      loadExams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSubscriber]);

  const loadStudents = async () => {
    if (!user || !isAdmin(user.email)) return;
    setLoadingStudents(true);
    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(user.email || "")}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.list || []);
      }
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleToggleSubscriber = async (student: any) => {
    if (!user) return;
    const nextStatus = !student.isSubscriber;
    const confirmMsg = nextStatus 
      ? `Adakah anda pasti mahu mengaktifkan langganan premium untuk pelajar "${student.name || student.email || student.uid}"?`
      : `Adakah anda pasti mahu membatalkan langganan premium untuk pelajar "${student.name || student.email || student.uid}"?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const studentRef = doc(db, 'users', student.uid);
      await setDoc(studentRef, {
        isSubscriber: nextStatus,
        subscriptionPlan: nextStatus ? 'premium' : 'trial'
      }, { merge: true });
      alert("Status langganan berjaya dikemaskini!");
      loadStudents();
    } catch (e: any) {
      alert("Gagal mengemaskini: " + e.message);
    }
  };

  const loadExams = async () => {
    if (!user || !isAdmin(user.email)) return;
    setLoadingExams(true);
    try {
      const res = await fetch(`/api/admin/exams?email=${encodeURIComponent(user.email || "")}`);
      const data = await res.json();
      if (data.success) {
        setCustomExams(data.list || []);
      }
    } catch (err) {
      console.error("Failed to load custom exams", err);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!examIdInput.trim() || !examTitleInput.trim() || !examQuestionInput.trim() || !examMarkingSchemeInput.trim()) {
      setExamFormStatus({ type: "error", text: "Semua medan adalah wajib." });
      return;
    }

    setExamFormStatus({ type: "loading", text: "Menyimpan soalan ke pangkalan data..." });

    const examData = {
      id: examIdInput.trim().toLowerCase().replace(/\s+/g, "-"),
      title: examTitleInput.trim(),
      topicId: examTopicInput,
      paperType: examPaperTypeInput,
      questionText: examQuestionInput.trim(),
      markingScheme: examMarkingSchemeInput.trim()
    };

    try {
      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          exam: examData
        })
      });
      const data = await res.json();
      if (data.success) {
        setExamFormStatus({ type: "success", text: data.message || "Soalan peperiksaan berjaya disimpan!" });
        setExamIdInput("");
        setExamTitleInput("");
        setExamTopicInput("general");
        setExamPaperTypeInput("struct");
        setExamQuestionInput("");
        setExamMarkingSchemeInput("");
        setEditingExam(null);
        setShowExamForm(false);
        loadExams();
      } else {
        setExamFormStatus({ type: "error", text: data.error || "Gagal menyimpan soalan peperiksaan." });
      }
    } catch (err: any) {
      setExamFormStatus({ type: "error", text: err.message || "Ralat rangkaian berlaku." });
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!user) return;
    if (!confirm("Adakah anda pasti mahu memadam soalan peperiksaan ini? Cikgu Kimia tidak lagi boleh menggunakan soalan ini.")) return;

    try {
      const res = await fetch(`/api/admin/exams/${id}?email=${encodeURIComponent(user.email || "")}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        loadExams();
      } else {
        alert(data.error || "Gagal memadam.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditExam = (ex: any) => {
    setEditingExam(ex);
    setExamIdInput(ex.id);
    setExamTitleInput(ex.title);
    setExamTopicInput(ex.topicId || "general");
    setExamPaperTypeInput(ex.paperType || "struct");
    setExamQuestionInput(ex.questionText || "");
    setExamMarkingSchemeInput(ex.markingScheme || "");
    setShowExamForm(true);
    setExamFormStatus({ type: "", text: "" });
  };

  const handleIngestFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setIngestFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIngestFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setIngestFilePreview("");
    }
  };

  const handleAiIngestAnalyse = async () => {
    if (!user) return;
    setIngestLoading(true);
    setIngestStatus("");
    setExamFormStatus({ type: "", text: "" });

    try {
      let assets: { mimeType: string; data: string }[] = [];
      if (ingestFile) {
        const base64Data = ingestFilePreview.split(",")[1];
        assets.push({
          mimeType: ingestFile.type,
          data: base64Data
        });
      }

      const res = await fetch("/api/admin/exams/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          questionText: ingestDraftText,
          assets
        })
      });

      const data = await res.json();
      if (data.success && data.result) {
        const item = data.result;
        setExamIdInput(item.id || "");
        setExamTitleInput(item.title || "");
        setExamTopicInput(item.topicId || "general");
        setExamPaperTypeInput(item.paperType || "struct");
        setExamQuestionInput(item.questionText || "");
        setExamMarkingSchemeInput(item.markingScheme || "");
        setIngestStatus("Berjaya dicerna oleh AI!");
      } else {
        setExamFormStatus({ type: "error", text: data.error || "Gagal mencerna kandungan soalan." });
      }
    } catch (err: any) {
      setExamFormStatus({ type: "error", text: err.message || "Ralat berlaku ketika memanggil API." });
    } finally {
      setIngestLoading(false);
    }
  };

  const handleIngestNoteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setIngestNoteFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIngestNotePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setIngestNotePreview("");
    }
  };

  const handleAiIngestNoteAnalyse = async () => {
    if (!user) return;
    setIngestNoteLoading(true);
    setIngestNoteStatus("");
    setFormStatus({ type: "", text: "" });

    try {
      let assets: { mimeType: string; data: string }[] = [];
      if (ingestNoteFile) {
        const base64Data = ingestNotePreview.split(",")[1];
        assets.push({
          mimeType: ingestNoteFile.type,
          data: base64Data
        });
      }

      const res = await fetch("/api/admin/knowledge/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          noteText: ingestNoteDraft,
          assets
        })
      });

      const data = await res.json();
      if (data.success && data.result) {
        const item = data.result;
        setIdInput(item.topicId || "");
        setTitleInput(item.title || "");
        setContextInput(item.context || "");
        
        if (item.keyPoints && Array.isArray(item.keyPoints)) {
          setPointsInput(item.keyPoints);
        } else {
          setPointsInput([""]);
        }
        setIngestNoteStatus("Nota berjaya dicerna oleh AI!");
      } else {
        setFormStatus({ type: "error", text: data.error || "Gagal mencerna kandungan nota." });
      }
    } catch (err: any) {
      setFormStatus({ type: "error", text: err.message || "Ralat berlaku ketika memanggil API." });
    } finally {
      setIngestNoteLoading(false);
    }
  };

  const loadFacts = async () => {
    if (!user || !isAdmin(user.email)) return;
    setLoadingFacts(true);
    try {
      const res = await fetch(`/api/admin/knowledge?email=${encodeURIComponent(user.email || "")}`);
      const data = await res.json();
      if (data.success) {
        setCustomFacts(data.list || []);
      }
    } catch (err) {
      console.error("Failed to load custom knowledge", err);
    } finally {
      setLoadingFacts(false);
    }
  };

  const handleSaveFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const filteredPoints = pointsInput.map(p => p.trim()).filter(p => p.length > 0);
    if (!idInput.trim() || !titleInput.trim() || !contextInput.trim()) {
      setFormStatus({ type: "error", text: "ID Topik, Tajuk, dan Konteks adalah wajib." });
      return;
    }
    
    setFormStatus({ type: "loading", text: "Menyimpan ke pangkalan data..." });
    
    const factData = {
      topicId: idInput.trim().toLowerCase().replace(/\s+/g, "-"),
      title: titleInput.trim(),
      context: contextInput.trim(),
      keyPoints: filteredPoints
    };
    
    try {
      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          fact: factData
        })
      });
      const data = await res.json();
      if (data.success) {
        setFormStatus({ type: "success", text: data.message || "Rujukan pintar berjaya disimpan!" });
        setIdInput("");
        setTitleInput("");
        setContextInput("");
        setPointsInput([""]);
        setEditingFact(null);
        setShowFactForm(false);
        loadFacts();
      } else {
        setFormStatus({ type: "error", text: data.error || "Gagal menyimpan rujukan." });
      }
    } catch (err: any) {
      setFormStatus({ type: "error", text: err.message || "Ralat rangkaian berlaku." });
    }
  };

  const handleDeleteFact = async (topicId: string) => {
    if (!user) return;
    if (!confirm("Adakah anda pasti mahu memadam rujukan pengetahuan ini? Cikgu Kimia tidak lagi boleh merujuk fakta ini.")) return;
    
    try {
      const res = await fetch(`/api/admin/knowledge/${topicId}?email=${encodeURIComponent(user.email || "")}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        loadFacts();
      } else {
        alert(data.error || "Gagal memadam.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (f: any) => {
    setEditingFact(f);
    setIdInput(f.topicId);
    setTitleInput(f.title);
    setContextInput(f.context);
    setPointsInput(f.keyPoints && f.keyPoints.length > 0 ? f.keyPoints : [""]);
    setShowFactForm(true);
    setFormStatus({ type: "", text: "" });
  };

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

        {/* Admin Section */}
        {user && isAdmin(user.email) && (
          <section className="mt-16 pt-12 border-t border-slate-200">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-rose-600 text-[10px] font-mono font-bold text-white uppercase rounded-md tracking-widest animate-pulse">
                  SUPER ADMIN PANEL
                </span>
                <p className="text-[10px] font-mono font-semibold text-slate-500 tracking-widest uppercase">
                  DASHBOARD KAWALAN PENTADBIR
                </p>
              </div>
              <h2 className="font-display text-3xl font-black text-slate-900 tracking-tight">
                🎛️ Cikgu Kimia Admin Console
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Uruskan akses pelajar, muat naik ke pangkalan memori pengetahuan AI (RAG), dan cipta soalan peperiksaan bertindak balas pintar.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 mb-8 font-mono text-xs overflow-x-auto shrink-0 select-none pb-px">
              <button
                onClick={() => setAdminTab("students")}
                className={`pb-3 px-5 font-bold border-b-2 transition shrink-0 tracking-wide ${adminTab === "students" ? "border-slate-950 text-slate-950" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                👥 SENARAI PELAJAR ({students.length})
              </button>
              <button
                onClick={() => setAdminTab("knowledge")}
                className={`pb-3 px-5 font-bold border-b-2 transition shrink-0 tracking-wide ${adminTab === "knowledge" ? "border-slate-950 text-slate-950" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                🧠 RUJUKAN RAG PINTAR ({customFacts.length})
              </button>
              <button
                onClick={() => setAdminTab("exams")}
                className={`pb-3 px-5 font-bold border-b-2 transition shrink-0 tracking-wide ${adminTab === "exams" ? "border-slate-950 text-slate-950" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                ✍️ SOALAN PEPERIKSAAN ({customExams.length})
              </button>
            </div>

            {/* TAB 1: SENARAI PELAJAR (STUDENT LIST) */}
            {adminTab === "students" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    Sistem Pemantauan & Langganan Pelajar
                  </h3>
                  {loadingStudents && <span className="text-xs font-mono text-slate-400">Menyegarkan...</span>}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  {students.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Tiada data pelajar yang dijumpai dalam pangkalan data.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 font-bold uppercase tracking-wider">
                            <th className="p-4">Nama / Pengguna</th>
                            <th className="p-4">Email</th>
                            <th className="p-4 text-center">Status Langganan</th>
                            <th className="p-4 text-center">Aktiviti / Streak</th>
                            <th className="p-4 text-center">Tindakan Premium</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {students.map((st, i) => (
                            <tr key={i} className="hover:bg-slate-50/40 transition">
                              <td className="p-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  {st.photoURL ? (
                                    <img
                                      src={st.photoURL}
                                      alt=""
                                      referrerPolicy="no-referrer"
                                      className="w-7 h-7 rounded-full bg-slate-100 object-cover border border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                                      {st.name ? st.name.slice(0, 2).toUpperCase() : "PL"}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-slate-900">{st.name || "Pelajar Cikgu"}</div>
                                    <div className="text-[10px] font-mono text-slate-400">{st.uid.slice(0, 8)}...</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 py-3.5 text-slate-600 font-mono font-medium">
                                {st.email || "tiada@email.com"}
                              </td>
                              <td className="p-4 py-3.5 text-center">
                                {st.isSubscriber ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    ★ PREMIUM ({st.subscriptionPlan || "sub"})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200/60">
                                    Trial (Free)
                                  </span>
                                )}
                              </td>
                              <td className="p-4 py-3.5 text-center">
                                <div className="font-mono font-semibold text-slate-800">
                                  ⚡ {st.currentStreak || 0} Hari (Max: {st.longestStreak || 0})
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Mesej Hari Ini: <span className="font-bold text-slate-600">{st.dailyMessages || 0}</span>
                                </div>
                              </td>
                              <td className="p-4 py-3.5 text-center">
                                <button
                                  onClick={() => handleToggleSubscriber(st)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${st.isSubscriber ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100" : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"}`}
                                >
                                  {st.isSubscriber ? "Batalkan Premium" : "Berikan Premium ★"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 2: RUJUKAN RAG PINTAR */}
            {adminTab === "knowledge" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      RAG Knowledge Base & Custom Memori Cikgu
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tambat memori konseptual atau key points tertentu untuk soalan KSSM.
                    </p>
                  </div>
                  {!showFactForm && (
                    <button
                      onClick={() => {
                        setEditingFact(null);
                        setIdInput("");
                        setTitleInput("");
                        setContextInput("");
                        setPointsInput([""]);
                        setShowFactForm(true);
                        setFormStatus({ type: "", text: "" });
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl tracking-wide shadow transition"
                    >
                      + Tambah Rujukan Pintar Baru
                    </button>
                  )}
                </div>

                {showFactForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border text-left border-slate-200 rounded-2xl p-6 sm:p-8 shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                      <h4 className="font-display font-bold text-base text-slate-900">
                        {editingFact ? `Kemaskini Rujukan: ${editingFact.title}` : "Daftarkan Rujukan RAG Minda Cikgu"}
                      </h4>
                      <button
                        onClick={() => setShowFactForm(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                      >
                        Batal
                      </button>
                    </div>

                    <form onSubmit={handleSaveFact} className="space-y-5">
                      {/* Syllabus selector mapping (Requested Shortcut helper) */}
                      {!editingFact && (
                        <div className="p-3.5 bg-blue-50/50 border border-blue-200/60 rounded-xl">
                          <label className="block text-[11px] font-mono font-bold text-blue-700 uppercase tracking-wide mb-1.5">
                            Auto-Set Mengikut Bab Sedia Ada (Shortcut)
                          </label>
                          <select
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "custom") {
                                setIdInput("");
                                setTitleInput("");
                              } else {
                                const found = SYLLABUS_TOPICS.find(t => t.id === val);
                                if (found) {
                                  setIdInput(found.id);
                                  setTitleInput(found.title);
                                }
                              }
                            }}
                            defaultValue="custom"
                            className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition"
                          >
                            <option value="custom">-- Bina ID Dan Bab Baru (Kunci Kira Manual) --</option>
                            {SYLLABUS_TOPICS.map(t => (
                              <option key={t.id} value={t.id}>Tingkatan {t.form} — Bab {t.id.split('-c')[1]}: {t.title}</option>
                            ))}
                          </select>
                          <p className="text-[10px] text-blue-600/70 mt-1">Menggunakan pilihan ini akan menetapkan ID & Tajuk secara automatik bersesuaian dengan struktur index data.</p>
                        </div>
                      )}

                      {/* AI Ingest Helper for Study Notes (Ingest Nota Pintar) */}
                      {!editingFact && (
                        <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 sm:p-5 mb-6 text-left">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="p-1 px-1.5 bg-emerald-600 text-[9px] font-mono font-bold text-white uppercase rounded tracking-wider animate-pulse">PROSES / INGEST NOTA AI</span>
                            <h5 className="font-display font-bold text-sm text-slate-800">Cikgu AI Auto-Ingest Nota & Huraian Bab</h5>
                          </div>
                          <p className="text-xs text-slate-500 mb-4 leading-normal">
                            Ambil gambar helaian nota/buku teks atau tampal draf teks sains rujukan. Cikgu AI akan mengekstrak huraian konseptual secara automatik, membina senarai Key Points dengan LaTeX ($...$) yang padat, dan menyelaraskan ID Bab mengikut skema KSSM!
                          </p>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wide mb-1.5">Kandungan Teks Nota Rujukan (Atau biarkan kosong jika hanya guna Gambar)</label>
                              <textarea
                                value={ingestNoteDraft}
                                onChange={(e) => setIngestNoteDraft(e.target.value)}
                                placeholder="Tampal sebarang nota ringkas, ringkasan silibus, atau draf mentah..."
                                rows={3}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wide mb-1.5 font-bold">Sumber Rujukan: Gambar Fail atau Kamera Telefon</label>
                              <div className="space-y-3 bg-white border border-slate-200 p-3 rounded-xl">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Standard upload */}
                                  <div className="flex flex-col p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                    <span className="text-[10px] font-bold text-slate-500 mb-1 font-mono uppercase">1. Pilih dari Fail/Galeri</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleIngestNoteFileChange}
                                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 transition cursor-pointer"
                                    />
                                  </div>

                                  {/* Direct Camera on mobile */}
                                  <div className="flex flex-col p-2 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                                    <span className="text-[10px] font-bold text-emerald-700 mb-1 font-mono uppercase flex items-center gap-1">
                                      <Camera className="w-3 h-3" /> 2. Ambil Foto Kamera Live
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      onChange={handleIngestNoteFileChange}
                                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 transition cursor-pointer"
                                    />
                                  </div>
                                </div>

                                {ingestNotePreview && (
                                  <div className="mt-2 flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100 animate-fade-in">
                                    <div className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                                      <img src={ingestNotePreview} alt="Preview" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIngestNoteFile(null);
                                          setIngestNotePreview("");
                                        }}
                                        className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center text-[10px] opacity-0 hover:opacity-100 font-bold transition"
                                      >
                                        Padam
                                      </button>
                                    </div>
                                    <div className="text-xs text-slate-600 font-mono">
                                      Helaian nota sedia untuk dicatit & dianalisis oleh AI!
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                disabled={ingestNoteLoading || (!ingestNoteDraft.trim() && !ingestNoteFile)}
                                onClick={handleAiIngestNoteAnalyse}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 rounded-xl font-bold text-xs tracking-wide shadow-md transition flex items-center gap-2 cursor-pointer"
                              >
                                {ingestNoteLoading ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Menganalisis & Mengekstrak...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Cerna Nota Pintar Dengan Cikgu AI 🧠🧪</span>
                                  </>
                                )}
                              </button>
                              {ingestNoteStatus && (
                                <motion.span 
                                  initial={{ opacity: 0 }} 
                                  animate={{ opacity: 1 }} 
                                  className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100"
                                >
                                  ✨ {ingestNoteStatus}
                                </motion.span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID Topik / Rujukan (Unik)</label>
                          <input
                            type="text"
                            placeholder="Contoh: f4-c2, tips-kbat, garam-klorida"
                            value={idInput}
                            onChange={e => setIdInput(e.target.value)}
                            disabled={!!editingFact}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white transition disabled:opacity-60"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tajuk Bab / Konsep</label>
                          <input
                            type="text"
                            placeholder="Contoh: Jadual Berkala Unsur"
                            value={titleInput}
                            onChange={e => setTitleInput(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-slate-950 focus:bg-white transition"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">Huraian Konseptual & Konteks Umum</label>
                        <textarea
                          placeholder="Menerangkan huraian umum atau ringkasan topik ini yang akan dijadikan jangkar konteks bagi prompts AI."
                          value={contextInput}
                          onChange={e => setContextInput(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-slate-950 focus:bg-white transition"
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Fakta Utama (Key Points) & Notasi Peperiksaan</label>
                          <button
                            type="button"
                            onClick={() => setPointsInput([...pointsInput, ""])}
                            className="text-xs font-semibold text-rose-600 hover:underline mb-1"
                          >
                            + Tambah Poin
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {pointsInput.map((pt, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-400 shrink-0 w-5">{index + 1}.</span>
                              <input
                                type="text"
                                placeholder="Contoh: Gas helium adalah monatom bermolekul stabil dan tidak reaktif."
                                value={pt}
                                onChange={e => {
                                  const next = [...pointsInput];
                                  next[index] = e.target.value;
                                  setPointsInput(next);
                                }}
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-slate-950 focus:bg-white transition"
                              />
                              {pointsInput.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = pointsInput.filter((_, i) => i !== index);
                                    setPointsInput(next);
                                  }}
                                  className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-2 rounded-lg"
                                >
                                  Padam
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {formStatus.text && (
                        <div className={`p-4 rounded-xl text-left text-xs font-medium ${formStatus.type === "error" ? "bg-rose-50 text-rose-700 border border-rose-200" : formStatus.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                          {formStatus.text}
                        </div>
                      )}

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setShowFactForm(false)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={formStatus.type === "loading"}
                          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs tracking-wide shadow-md transition disabled:opacity-50"
                        >
                          {formStatus.type === "loading" ? "Menyimpan ..." : "Simpan Pengetahuan Pintar ini 🧠"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Facts list */}
                <div className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase">
                      SENARAI MEMORI CUSTOM ({customFacts.length})
                    </span>
                    {loadingFacts && <span className="text-[10px] font-mono text-slate-400">Memuatkan...</span>}
                  </div>

                  {customFacts.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Tiada rujukan adat ditambah dalam pangkalan data. Klik butang di atas untuk mendaftarkan nota pintar yang baru!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                      {customFacts.map((f, i) => (
                        <div key={i} className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-slate-50/50 transition">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 uppercase">
                                {f.topicId}
                              </span>
                              <h4 className="font-display font-bold text-slate-900 text-base">
                                {f.title}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-normal mb-3">
                              {f.context}
                            </p>
                            <div className="space-y-1">
                              {(f.keyPoints || []).map((pt: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                                  <span className="text-slate-400 shrink-0 select-none">•</span>
                                  <span className="leading-snug">{pt}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                            <button
                              onClick={() => handleStartEdit(f)}
                              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition"
                            >
                              Sunting
                            </button>
                            <button
                              onClick={() => handleDeleteFact(f.topicId)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold text-rose-600 transition"
                            >
                              Padam
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 3: SOALAN PEPERIKSAAN (CUSTOM EXAMS BOARD) */}
            {adminTab === "exams" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      Sistem Pendaftaran Soalan Peperiksaan Kertas 2
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pelajar yang memulakan sesi Simulasi Kertas 2 akan diberi soalan daripada bank soalan ini.
                    </p>
                  </div>
                  {!showExamForm && (
                    <button
                      onClick={() => {
                        setEditingExam(null);
                        setExamIdInput("");
                        setExamTitleInput("");
                        setExamTopicInput("general");
                        setExamPaperTypeInput("struct");
                        setExamQuestionInput("");
                        setExamMarkingSchemeInput("");
                        setShowExamForm(true);
                        setExamFormStatus({ type: "", text: "" });
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl tracking-wide shadow transition"
                    >
                      + Bina Soalan Peperiksaan Baru
                    </button>
                  )}
                </div>

                {showExamForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border text-left border-slate-200 rounded-2xl p-6 sm:p-8 shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                      <h4 className="font-display font-bold text-base text-slate-900">
                        {editingExam ? `Kemaskini Soalan: ${editingExam.title}` : "Daftarkan Soalan Peperiksaan SPM Baru"}
                      </h4>
                      <button
                        onClick={() => setShowExamForm(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                      >
                        Batal
                      </button>
                    </div>

                    <form onSubmit={handleSaveExam} className="space-y-5">
                      {/* AI Ingest Helper (Ingest Pintar) */}
                      {!editingExam && (
                        <div className="bg-rose-50/45 border border-rose-100 rounded-2xl p-4 sm:p-5 mb-6 text-left">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="p-1 px-1.5 bg-rose-600 text-[9px] font-mono font-bold text-white uppercase rounded tracking-wider animate-pulse">PROSES / INGEST AI</span>
                            <h5 className="font-display font-bold text-sm text-slate-800">Cikgu AI Auto-Ingest Soalan & Skema</h5>
                          </div>
                          <p className="text-xs text-slate-500 mb-4 leading-normal">
                            Tampal deraf teks soalan di bawah ATAU muat naik foto/lampiran soalan peperiksaan. Cikgu AI akan menganalisis soalan tersebut, mengesan bab sukatan KSSM (Topic), jenis ujian (struktur/esei), menjana tajuk, memformatkan formula ke LaTeX ($...$), dan merumuskan skema markah secara automatik!
                          </p>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wide mb-1.5">Deraf Teks Soalan (Atau biarkan kosong jika hanya guna Gambar)</label>
                              <textarea
                                value={ingestDraftText}
                                onChange={(e) => setIngestDraftText(e.target.value)}
                                placeholder="Tampal teks soalan kasar atau draf rujukan di sini..."
                                rows={3}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wide mb-1.5 font-bold">Sumber Soalan: Gambar / Tangkapan Skrin</label>
                              <div className="space-y-3 bg-white border border-slate-200 p-3 rounded-xl">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Standard upload */}
                                  <div className="flex flex-col p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                    <span className="text-[10px] font-bold text-slate-500 mb-1 font-mono uppercase">1. Pilih dari Fail/Galeri</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleIngestFileChange}
                                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 transition cursor-pointer"
                                    />
                                  </div>

                                  {/* Direct Camera on mobile */}
                                  <div className="flex flex-col p-2 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                                    <span className="text-[10px] font-bold text-emerald-700 mb-1 font-mono uppercase flex items-center gap-1">
                                      <Camera className="w-3 h-3" /> 2. Ambil Foto Kamera Live
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      onChange={handleIngestFileChange}
                                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 transition cursor-pointer"
                                    />
                                  </div>
                                </div>

                                {ingestFilePreview && (
                                  <div className="mt-2 flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100 animate-fade-in">
                                    <div className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                                      <img src={ingestFilePreview} alt="Preview" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIngestFile(null);
                                          setIngestFilePreview("");
                                        }}
                                        className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center text-[10px] opacity-0 hover:opacity-100 font-bold transition"
                                      >
                                        Padam
                                      </button>
                                    </div>
                                    <div className="text-xs text-slate-600 font-mono">
                                      Kandungan gambar bersedia untuk dicerna oleh AI!
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                disabled={ingestLoading || (!ingestDraftText.trim() && !ingestFile)}
                                onClick={handleAiIngestAnalyse}
                                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 rounded-xl font-bold text-xs tracking-wide shadow-md transition flex items-center gap-2 cursor-pointer"
                              >
                                {ingestLoading ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Menganalisis & Mencerna...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Ingest Pintar Dengan Cikgu AI 🧠🧪</span>
                                  </>
                                )}
                              </button>
                              {ingestStatus && (
                                <motion.span 
                                  initial={{ opacity: 0 }} 
                                  animate={{ opacity: 1 }} 
                                  className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100"
                                >
                                  ✨ {ingestStatus}
                                </motion.span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID Soalan (Satu Perkataan/Sengkang)</label>
                          <input
                            type="text"
                            placeholder="Contoh: spm-2025-perak-q1"
                            value={examIdInput}
                            onChange={e => setExamIdInput(e.target.value)}
                            disabled={!!editingExam}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-slate-950 focus:bg-white transition disabled:opacity-60"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tajuk Soalan</label>
                          <input
                            type="text"
                            placeholder="Contoh: Soalan 1 — Sel Kimia Ringkas"
                            value={examTitleInput}
                            onChange={e => setExamTitleInput(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-slate-950 focus:bg-white transition"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hubungkan Kepada Bab Terbina</label>
                          <select
                            value={examTopicInput}
                            onChange={e => setExamTopicInput(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-slate-950 focus:bg-white transition"
                          >
                            <option value="general">Umum / Semua Bab (General)</option>
                            {SYLLABUS_TOPICS.map(t => (
                              <option key={t.id} value={t.id}>Tingkatan {t.form} — {t.title}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bahagian Soalan (Format Kertas 2)</label>
                          <select
                            value={examPaperTypeInput}
                            onChange={e => setExamPaperTypeInput(e.target.value as any)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-slate-950 focus:bg-white transition"
                          >
                            <option value="struct">Bahagian A — Struktur (Kertas 2)</option>
                            <option value="essay">Bahagian B/C — Esei (Kertas 2)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kandungan Teks Soalan (Boleh Guna Markdown & LaTeX)</label>
                        <textarea
                          placeholder="Tuliskan soalan peperiksaan di sini. Sila sertakan sub-soalan (a, b) beserta peruntukan markah (contoh: [2 markah]). Nyatakan dengan jelas."
                          value={examQuestionInput}
                          onChange={e => setExamQuestionInput(e.target.value)}
                          rows={6}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:border-slate-950 focus:bg-white transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Skema Pemarkahan & Peraturan Menjawab (Skema Pemarkahan)</label>
                        <textarea
                          placeholder="Nyatakan perkataan kunci yang wajib ditulis pelajar untuk mendapatkan markah penuh (contoh: 'kadar resapan', 'saiz zarah'). Skema ini digunakan oleh Cikgu untuk menilai."
                          value={examMarkingSchemeInput}
                          onChange={e => setExamMarkingSchemeInput(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:border-slate-950 focus:bg-white transition"
                          required
                        />
                      </div>

                      {examFormStatus.text && (
                        <div className={`p-4 rounded-xl text-left text-xs font-medium ${examFormStatus.type === "error" ? "bg-rose-50 text-rose-700 border border-rose-200" : examFormStatus.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                          {examFormStatus.text}
                        </div>
                      )}

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setShowExamForm(false)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={examFormStatus.type === "loading"}
                          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs tracking-wide shadow-md transition disabled:opacity-50"
                        >
                          {examFormStatus.type === "loading" ? "Menyimpan ..." : "Simpan Soalan Peperiksaan! ✍️"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Exam questions list */}
                <div className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase">
                      SENARAI SOALAN PEPERIKSAAN AKTIF ({customExams.length})
                    </span>
                    {loadingExams && <span className="text-[10px] font-mono text-slate-400">Memuatkan...</span>}
                  </div>

                  {customExams.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Tiada soalan peperiksaan tersuai ditambah dalam pangkalan data. Klik butang "+ Bina Soalan Peperiksaan Baru" untuk mendaftarkan soalan yang tersusun!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                      {customExams.map((ex, i) => (
                        <div key={i} className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-slate-50/50 transition">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded uppercase">
                                {ex.id}
                              </span>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded">
                                {ex.paperType === "struct" ? "KERTAS 2 — STRUKTUR" : "KERTAS 2 — ESEI"}
                              </span>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded">
                                Bab: {ex.topicId || "general"}
                              </span>
                              <h4 className="font-display font-bold text-slate-900 text-base ml-2">
                                {ex.title}
                              </h4>
                            </div>
                            <div className="text-xs text-slate-500 bg-slate-50 border p-3 rounded-lg overflow-x-auto select-all max-h-32 font-mono whitespace-pre-wrap leading-normal mb-3">
                              {ex.questionText}
                            </div>
                            <div className="bg-emerald-50/40 border border-emerald-100/50 p-2.5 rounded-lg">
                              <div className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wide">Skema Pemarkahan:</div>
                              <p className="text-xs text-emerald-700 leading-normal font-mono">{ex.markingScheme}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                            <button
                              onClick={() => handleStartEditExam(ex)}
                              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition"
                            >
                              Sunting
                            </button>
                            <button
                              onClick={() => handleDeleteExam(ex.id)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold text-rose-600 transition"
                            >
                              Padam
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
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
