import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send, User, X, ImagePlus, FlaskConical, RefreshCw, ClipboardCheck,
  LogOut, Atom, MoreVertical, Sparkles, Calculator, ListChecks, PencilLine, Beaker,
  Menu, Trophy, BookOpen, Camera
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Message, GeminiService } from "../services/geminiService";
import { Topic } from "../constants";
import { cn } from "../lib/utils";
import { memoryService, StudentMemory, DAILY_CAP, DAILY_CAP_PREMIUM, isAdmin } from "../services/memoryService";
import { useFirebase } from "../lib/FirebaseProvider";
import { collection, query, orderBy, limit, getDocs, where, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { compressImageFile } from "../lib/imageCompress";
import { qaCache } from "../lib/qaCache";

import { EquationBalancer } from "./EquationBalancer";
import { PeriodicTable } from "./PeriodicTable";
import { CapDialog } from "./CapDialog";
import { MemoryPanel } from "./MemoryPanel";

const cleanMessageText = (txt: string) => {
  if (!txt) return "";
  return txt
    .replace(/\[CONTEXT SHIFT DETECTED\]:.*?\n/g, "")
    .replace(/\[MASTERY\][^\n]*\n?/g, "")
    .replace(/\[NEURAL_INSIGHT\][^\n]*\n?/g, "")
    .trim();
};

const bubbleVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 24,
      mass: 0.8
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 }
  }
} as const;

interface ChatProps {
  initialTopic?: Topic | null;
  onUpgradeClick?: () => void;
}

interface SelectedImage {
  id: string;
  file: File;
  preview: string;
  base64: string;
  mimeType: string;
}

// Component state and main logic
export function Chat({ initialTopic, onUpgradeClick }: ChatProps) {
  const { user, logout, isSubscriber } = useFirebase();
  const isEffectiveSubscriber = isSubscriber || (user ? isAdmin(user.email) : false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionTitle, setSessionTitle] = useState<string>(initialTopic?.title || "Cikgu Kimia");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [compressing, setCompressing] = useState(false);

  const [memory, setMemory] = useState<StudentMemory>({
    weakTopics: [],
    identifiedMistakes: [],
    examPapersAnalysis: [],
    dailyMessages: 0,
    currentStreak: 0,
  });

  const [showMemory, setShowMemory] = useState(false);
  const [showBalancer, setShowBalancer] = useState(false);
  const [showPeriodicTable, setShowPeriodicTable] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [capOpen, setCapOpen] = useState(false);
  const [activePeriodicTab, setActivePeriodicTab] = useState<"table" | "chat">("table");

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const hasHandledInitial = useRef(false);

  const gemini = useMemo(() => new GeminiService(memory), [memory]);

  // ── group messages by date for in-thread separators ───────────────────
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    messages.forEach((msg) => {
      const date = msg.timestamp
        ? new Date(msg.timestamp).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" })
        : "Baru-baru ini";
      const last = groups[groups.length - 1];
      if (last && last.date === date) last.messages.push(msg);
      else groups.push({ date, messages: [msg] });
    });
    return groups;
  }, [messages]);

  const getTopicGreeting = (topic: Topic): Message[] => {
    let greetingText = "";
    if (topic.id.startsWith("quiz")) {
      greetingText = `Selamat datang ke sesi **${topic.title}**! 📝\n\nAdakah anda bersedia untuk menguji pengetahuan Kimia SPM anda? Cikgu akan berikan soalan objektif aras SPM satu demi satu.\n\nSila klik butang di bawah untuk mula!`;
    } else if (topic.id.startsWith("exam")) {
      greetingText = `Selamat datang ke sesi simulasi **${topic.title}**! 📑\n\nSesi ini direka untuk melatih anda menjawab soalan Kertas 2 (Bahagian A, B, atau C) seakan-akan peperiksaan SPM sebenar.\n\nSila klik butang di bawah untuk menjana set soalan simulasi anda!`;
    } else if (topic.id === "periodic-table") {
      greetingText = `Selamat datang ke meneroka **Jadual Berkala Unsur**! \n\nSila guna borang interaktif di bawah untuk menganalisis sifat unsur, atau tanya Cikgu apa-apa soalan.`;
    } else {
      const subList = topic.subtopics || [];
      const subtopicsList = subList.map(s => `- ${s}`).join("\n");
      const formText = topic.form ? ` (Tingkatan ${topic.form})` : "";
      greetingText = `Salam sejahtera! Jom kita bincangkan topik **${topic.title}**${formText} bersama-sama. 🧪\n\n${
        subtopicsList ? `Antara kandungan penting dalam bab ini:\n${subtopicsList}\n\n` : ""
      }Apakah bahagian yang anda ingin fahami hari ini? Anda boleh tanya apa-apa soalan, hantar gambar soalan peperiksaan, atau pilih salah satu menu tindakan / butang tindakan di bawah untuk mula!`;
    }
    return [{
      role: "model",
      text: greetingText,
      timestamp: Date.now()
    }];
  };

  // ── load memory + history + handle greeting when topic changes ───────
  useEffect(() => {
    if (!user) return;

    // Reset periodic table tab back to default whenever the topic changes
    setActivePeriodicTab("table");

    setIsHistoryLoading(true);
    setMessages([]); // Start clean to avoid flashing the welcome greeting while searching for history
    hasHandledInitial.current = false;

    let active = true;

    const init = async () => {
      try {
        await loadMemory();
        if (!active) return;

        if (initialTopic) {
          try {
            const historyQuery = query(
              collection(db, `users/${user.uid}/history`),
              where("topicId", "==", initialTopic.id),
              limit(20)
            );
            const snap = await getDocs(historyQuery);
            if (!active) return;

            const loaded: Message[] = snap.docs
              .map((d) => {
                const data = d.data();
                return {
                  role: data.role,
                  text: cleanMessageText(data.text),
                  images: data.images,
                  timestamp: data.timestamp?.toDate 
                    ? data.timestamp.toDate().getTime() 
                    : (typeof data.timestamp === "number" ? data.timestamp : Date.now()),
                };
              })
              .sort((a, b) => {
                const tA = typeof a.timestamp === 'number' ? a.timestamp : 0;
                const tB = typeof b.timestamp === 'number' ? b.timestamp : 0;
                return tA - tB;
              });

            if (loaded.length > 0) {
              if (hasHandledInitial.current) return;
              // Smoothly swap greeting with physical conversation history if it exists
              // Prepend the topic greeting so it remains pinned at the very top of the thread and never flashes out!
              const greeting = getTopicGreeting(initialTopic)[0];
              const firstLoadedText = loaded[0]?.text;
              if (firstLoadedText === greeting.text) {
                setMessages(loaded);
              } else {
                setMessages([greeting, ...loaded]);
              }
              hasHandledInitial.current = true;
            } else {
              // No history found -> Render the greeting with action buttons
              if (!active) return;
              setMessages(getTopicGreeting(initialTopic));
              hasHandledInitial.current = true;
            }
          } catch (historyErr) {
            console.error("Failed to load topic history from Firestore:", historyErr);
            // Non-blocking fallback: Do not stall, let student continue with the seeded greeting
            if (active) {
              setMessages(getTopicGreeting(initialTopic));
            }
            hasHandledInitial.current = true;
          } finally {
            if (active) {
              setIsHistoryLoading(false);
            }
          }
        } else {
          if (active) {
            setMessages([{
              role: "model",
              text: `Salam sejahtera, ${user.displayName || "Pelajar"}! Saya Cikgu Kimia. Boleh saya bantu hari ini? 🧪\n\nPilih topik di kiri, atau tanya apa-apa.`,
              timestamp: Date.now(),
            }]);
            hasHandledInitial.current = true;
            setIsHistoryLoading(false);
          }
        }
      } catch (err) {
        console.error("Error in init:", err);
        if (active) {
          setIsHistoryLoading(false);
        }
      }
    };

    init();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialTopic?.id]);

  const used = memory.dailyMessages ?? 0;
  const currentCap = isEffectiveSubscriber ? DAILY_CAP_PREMIUM : DAILY_CAP;
  const remaining = Math.max(0, currentCap - used);

  const loadMemory = async () => {
    if (!user) return;
    try {
      const mem = await memoryService.getMemory(user.uid);
      setMemory(mem);
    } catch (err) {
      console.error("Failed to load memory from Firestore, using fallback:", err);
      setMemory({
        weakTopics: [],
        identifiedMistakes: [],
        examPapersAnalysis: [],
        dailyMessages: 0,
        currentStreak: 0,
      });
    }
  };

  const handleResetSession = async () => {
    if (!user || !initialTopic) return;
    setIsLoading(true);
    setToolsOpen(false);
    try {
      const historyQuery = query(
        collection(db, `users/${user.uid}/history`),
        where("topicId", "==", initialTopic.id)
      );
      const snap = await getDocs(historyQuery);
      const deletePromises = snap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Reset local messages to the initial greeting to show interactive buttons again
      setMessages(getTopicGreeting(initialTopic));
    } catch (err) {
      console.error("Failed to reset session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialTopic = async (topic: Topic) => {
    let text = "";
    if (topic.id.startsWith("quiz")) {
      text = `Cikgu, saya nak buat "${topic.title}". Boleh berikan satu soalan objektif mencabar dari mana-mana bab SPM? Sila berikan jawapan hanya selepas saya menjawab.`;
    } else if (topic.id.startsWith("exam")) {
      text = `Cikgu, mari buat simulasi "${topic.title}". Sila berikan:\n1. Satu soalan Paper 2 (Bahagian A — Struktur) dengan sub-soalan (a, b, c).\n2. Satu soalan Paper 2 (Bahagian B/C — Esei) yang memerlukan huraian.\nSertakan peruntukan markah untuk setiap bahagian. Jangan beri jawapan lagi.`;
    } else {
      text = `Cikgu, saya nak tanya pasal topik "${topic.title}". Boleh kongsikan ringkasan utama dan apa yang biasa keluar dalam SPM?`;
    }
    const greeting = getTopicGreeting(topic);
    handleSend(text, greeting);
  };

  // ── auto-scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    const scroll = () => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    };
    scroll();
    const t = setTimeout(scroll, 150);
    return () => clearTimeout(t);
  }, [messages, isLoading]);

  // ── memory analysis: every 10 messages, or after image upload ─────────
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== "model") return;
    const prev = messages[messages.length - 2];
    const hasImage = prev?.role === "user" && (prev.images?.length ?? 0) > 0;
    if (hasImage || messages.length % 10 === 0) {
      updateMemory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const updateMemory = async (recentMessages: Message[] = messages.slice(-8)) => {
    if (isLoading || !user || messages.length < 4) return;
    try {
      let conversation = recentMessages.map(m => `${m.role}: ${m.text}`).join("\n");
      const latestImages = recentMessages.find(m => m.role === "user" && m.images?.length)?.images ?? [];

      // If the thread is long, get a summary of the historical context first
      if (messages.length > 12) {
        const summary = await gemini.summariseThread(messages.slice(0, -8), initialTopic?.id);
        if (summary) {
          conversation = `SESI SEBELUM INI (RINGKASAN):\n${summary}\n\nSESI TERKINI:\n${conversation}`;
        }
      }

      const analysis = await gemini.analyzeForMemory(conversation, latestImages);
      if (!analysis || Object.keys(analysis).length === 0) return;

      const next = { ...memory };
      let dirty = false;

      if (Array.isArray(analysis.weakTopics)) {
        for (const t of analysis.weakTopics) {
          if (!next.weakTopics.includes(t)) { next.weakTopics.push(t); dirty = true; }
        }
      }
      if (Array.isArray(analysis.identifiedMistakes)) {
        for (const m of analysis.identifiedMistakes) {
          if (!next.identifiedMistakes.includes(m)) { next.identifiedMistakes.push(m); dirty = true; }
        }
      }
      if (Array.isArray(analysis.examPapersAnalysis)) {
        for (const item of analysis.examPapersAnalysis) {
          next.examPapersAnalysis.push(item);
          if (next.examPapersAnalysis.length > 5) next.examPapersAnalysis.shift();
          dirty = true;
        }
      }
      if (dirty) {
        await memoryService.saveMemory(user.uid, {
          weakTopics: next.weakTopics,
          identifiedMistakes: next.identifiedMistakes,
          examPapersAnalysis: next.examPapersAnalysis,
        });
        setMemory(next);
      }
    } catch (e) {
      console.error("Memory update failed", e);
    }
  };

  // ── file upload (with compression) ────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setCompressing(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith("image/");
        const isPDF = file.type === "application/pdf";
        const isText = file.type === "text/plain";

        if (!isImage && !isPDF && !isText) {
          alert("Cikgu hanya boleh baca Gambar, PDF, atau fail Teks buat masa ini.");
          continue;
        }

        if (isText) {
          const text = await file.text();
          setSelectedImages(prev => [...prev, {
            id: rid(), file, preview: "",
            base64: btoa(text), mimeType: file.type,
          }]);
          continue;
        }

        if (isImage) {
          const compressed = await compressImageFile(file);
          if (compressed.compressedBytes < compressed.originalBytes) {
            console.log(`[image] ${file.name}: ${(compressed.originalBytes / 1024).toFixed(0)}KB → ${(compressed.compressedBytes / 1024).toFixed(0)}KB`);
          }
          setSelectedImages(prev => [...prev, {
            id: rid(), file,
            preview: compressed.preview,
            base64: compressed.base64,
            mimeType: compressed.mimeType,
          }]);
          continue;
        }

        // PDF — leave as-is
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = (ev) => resolve(ev.target?.result as string);
          r.onerror = () => reject(r.error);
          r.readAsDataURL(file);
        });
        setSelectedImages(prev => [...prev, {
          id: rid(), file,
          preview: "",
          base64: dataUrl.split(",")[1] ?? "",
          mimeType: file.type,
        }]);
      }
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (id: string) =>
    setSelectedImages(prev => prev.filter(img => img.id !== id));

  // ── send a message ────────────────────────────────────────────────────
  const handleSend = async (text: string = input, customHistory?: Message[]) => {
    const finalImages = [...selectedImages];
    if ((!text.trim() && finalImages.length === 0) || isLoading || !user) return;

    hasHandledInitial.current = true;
    setIsLoading(true);

    try {
      // Daily budget check (single Firestore read)
      let isAllowed = true;
      let remainingCount = 5;
      try {
        const check = await memoryService.canSend(user.uid);
        isAllowed = check.ok;
        remainingCount = check.remaining;
      } catch (checkErr) {
        console.error("Failed to check message limits:", checkErr);
        // Fail-safe: allow the request rather than locking up the screen
      }

      if (!isAllowed) {
        setCapOpen(true);
        setIsLoading(false);
        return;
      }
      console.log(`[budget] ${remainingCount - 1} messages remaining today`);

      const userMessage: Message = {
        role: "user", text,
        images: finalImages.map(img => ({ mimeType: img.mimeType, data: img.base64 })),
        timestamp: Date.now(),
      };

      // Atomically append user message and model placeholder message to the array
      setMessages(prev => [
        ...prev, 
        userMessage, 
        { role: "model", text: "", timestamp: Date.now() + 1 }
      ]);
      setInput("");
      setSelectedImages([]);

      let fullResponse = "";

      // QA cache short-circuit — only on plain text questions with no images
      let cachedAnswer: string | null = null;
      if (finalImages.length === 0 && text.length > 6 && messages.length < 4) {
        cachedAnswer = qaCache.hit(text, initialTopic?.id);
      }

      if (cachedAnswer) {
        // Replay cached answer with a tiny stream delay so the UI still feels alive
        const tokens = cachedAnswer.match(/.{1,30}/g) ?? [cachedAnswer];
        for (const t of tokens) {
          fullResponse += t;
          setMessages(prev => {
            const arr = [...prev];
            const last = arr[arr.length - 1];
            if (last && last.role === "model") last.text = fullResponse;
            return arr;
          });
          await new Promise(r => setTimeout(r, 12));
        }
      } else {
        const payloadImages = finalImages.map(img => ({ mimeType: img.mimeType, data: img.base64 }));
        // Build history straight from React state or customHistory — no Firestore re-fetch.
        const history = buildHistoryForServer(customHistory !== undefined ? customHistory : messages, 4);

        let detectedShift = false;

        await gemini.sendMessageStream(text || "Sila terangkan rajah ini.", payloadImages, (chunk) => {
          fullResponse += chunk;

          // Detect server-side topic-shift marker
          if (!detectedShift && fullResponse.includes("[CONTEXT SHIFT DETECTED]")) {
            const m = fullResponse.match(/\[CONTEXT SHIFT DETECTED\]: Student is now asking about (.*?)\./);
            if (m) {
              setSessionTitle(m[1]);
              detectedShift = true;
            }
          }

          setMessages(prev => {
            const arr = [...prev];
            const last = arr[arr.length - 1];
            if (last && last.role === "model") {
              last.text = cleanMessageText(fullResponse);
            }
            return arr;
          });
        }, history, initialTopic?.id);

        // Handle [MASTERY] topicId +delta
        if (fullResponse.includes("[MASTERY]")) {
          const mMastery = fullResponse.match(/\[MASTERY\]\s+([a-zA-Z0-9\-]+)\s+([\+\-]?\d+)/);
          if (mMastery) {
            const tId = mMastery[1].trim();
            const delta = parseInt(mMastery[2], 10);
            if (tId && !isNaN(delta)) {
              try {
                await memoryService.bumpMastery(user.uid, tId, delta);
                await loadMemory();
              } catch (mErr) {
                console.error("Failed to bump mastery level:", mErr);
              }
            }
          }
        }

        // Cache the response for future identical questions
        if (finalImages.length === 0 && text.length > 6) {
          qaCache.set(text, fullResponse, initialTopic?.id);
        }

        // Forward [NEURAL_INSIGHT] to global feed
        if (fullResponse.includes("[NEURAL_INSIGHT]")) {
          const m = fullResponse.match(/\[NEURAL_INSIGHT\] \((.*?)\) (.*)/);
          if (m) {
            const topic = m[1];
            const insight = m[2].split("\n")[0];
            fetch("/api/discovery", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ topic, insight }),
            }).catch(console.error);
          }
        }
      }

      // Atomic batched write: increment usage, persist user+model messages, update streak
      try {
        const updatedMem = await memoryService.recordTurn(user.uid, {
          topicId: initialTopic?.id,
          userMessage: { text, images: userMessage.images },
          modelMessage: { text: fullResponse },
        });
        setMemory(updatedMem);
      } catch (turnErr) {
        console.error("Failed to persist turn to database:", turnErr);
        // Optimistic UI updates: increment count locally on memory state
        setMemory(prev => ({
          ...prev,
          dailyMessages: (prev.dailyMessages ?? 0) + 1,
        }));
      }

    } catch (error: any) {
      console.error("Chat Error:", error);
      const errMsg = error instanceof Error ? error.message : String(error);

      let friendly = `Maaf, Cikgu mengalami gangguan teknikal (${errMsg}). Sila cuba lagi sebentar. 🙏`;
      if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        friendly = "Sistem sedang sibuk seketika. Cuba lagi dalam beberapa saat. ⏳";
      }
      setMessages(prev => {
        const arr = [...prev];
        // Replace the empty model placeholder if present
        const last = arr[arr.length - 1];
        if (last && last.role === "model" && !last.text) arr[arr.length - 1] = { role: "model", text: friendly, timestamp: Date.now() };
        else arr.push({ role: "model", text: friendly, timestamp: Date.now() });
        return arr;
      });
    } finally {
      setIsLoading(false);
    }
  };



  const getTopicQuickActions = () => {
    const base = [
      { id: "quiz", label: "Kuiz 5 soalan", icon: <ListChecks className="w-4 h-4 text-brand-accent" />, prompt: "Sila berikan 5 soalan objektif (MCQ) aras SPM untuk topik ini." },
      { id: "mark", label: "Semak Jawapan", icon: <ClipboardCheck className="w-4 h-4 text-blue-500" />, prompt: "Cikgu, sila semak jawapan saya ini berdasarkan skema markah SPM terbaru." },
    ];

    if (!initialTopic) return [
      ...base,
      { id: "intro", label: "Apa itu Kimia?", icon: <Sparkles className="w-4 h-4 text-amber-500" />, prompt: "Cikgu, boleh terangkan secara ringkas apa yang paling penting untuk saya tahu dalam Kimia SPM?" },
      { id: "tips", label: "Tips Skor A", icon: <Trophy className="w-4 h-4 text-orange-500" />, prompt: "Apakah topik-topik KBAT yang wajib saya kuasai untuk skor A+?" },
    ];

    const topicId = initialTopic.id;
    const actions = [...base];

    if (topicId.includes("chapter") || topicId.includes("-c")) {
       actions.push({ id: "apparatus", label: "Lukis Radas", icon: <PencilLine className="w-4 h-4 text-rose-500" />, prompt: "Cikgu, boleh lukiskan rajah susunan radas (SVG) untuk eksperimen utama dalam bab ini?" });
    }

    if (topicId === "f4-c3" || topicId === "f5-c1") { // Mole concept or Redox
       actions.push({ id: "balancer", label: "Imbang Persamaan", icon: <Calculator className="w-4 h-4 text-emerald-500" />, prompt: "Cikgu, bantu saya imbang satu persamaan kimia yang susah dalam bab ini." });
    } else {
       actions.push({ id: "summary", label: "Ringkasan Bab", icon: <BookOpen className="w-4 h-4 text-slate-500" />, prompt: "Cikgu, boleh berikan ringkasan mind-map (teks) untuk bab ini?" });
    }

    return actions;
  };

  const dynamicQuickActions = getTopicQuickActions();

  // ── render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-stone-50 relative overflow-hidden font-sans">
      {/* Header — slim, editorial */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 ring-2 ring-white shadow-sm">
            <img
              src="/logo.png"
              alt="Cikgu Kimia"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement!.innerHTML = `<div class="flex items-center justify-center w-full h-full bg-slate-900 text-white text-xs font-semibold">CK</div>`;
              }}
            />
          </div>
          <div className="min-w-0">
            {initialTopic && (
              <div className="text-[10px] font-mono font-semibold text-slate-400 tracking-widest uppercase leading-none mb-1">
                Tingkatan {initialTopic.form} · Bab {initialTopic.id.split("-c")[1] ?? "—"}
              </div>
            )}
            <h2 className="font-display text-lg sm:text-xl text-slate-900 leading-none truncate">
              {sessionTitle}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Streak chip */}
          {(memory.currentStreak ?? 0) > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-orange-700 text-xs font-semibold">
              <span>🔥</span> {memory.currentStreak}
            </div>
          )}

          {/* Messages remaining */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider">
            {isAdmin(user?.email) ? (
              "Tanpa had"
            ) : (
              <>{remaining} / {currentCap} Peluang</>
            )}
          </div>

          {initialTopic && messages.length > 1 && (
            <button
              id="btn-header-reset"
              onClick={handleResetSession}
              className="p-2.5 rounded-xl bg-indigo-50/75 hover:bg-indigo-100/75 text-indigo-700 border border-indigo-150 active:scale-95 transition-all flex items-center gap-1.5 select-none"
              title="Mula Semula Sesi"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-bold">Mula Semula</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setToolsOpen(v => !v)}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold">Menu</span>
              </div>
            </button>
            {toolsOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setToolsOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1.5 overflow-hidden">
                  {initialTopic && !initialTopic.id.startsWith("quiz") && !initialTopic.id.startsWith("exam") && (
                    <button
                      onClick={() => {
                        setToolsOpen(false);
                        handleSend(`Cikgu, saya nak masuk Exam Mode untuk topik ${initialTopic.title}. Berikan satu set soalan Paper 2 — Struktur dan Esei — dengan markah. Jangan bagi jawapan lagi.`);
                      }}
                      className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm hover:bg-slate-50 text-amber-700"
                    >
                      <ClipboardCheck className="w-4 h-4" /> Exam Mode
                    </button>
                  )}
                  <button
                    onClick={() => { setShowBalancer(true); setToolsOpen(false); }}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm hover:bg-slate-50 text-slate-700"
                  >
                    <Calculator className="w-4 h-4" /> Imbang persamaan
                  </button>
                  <button
                    onClick={() => { setShowPeriodicTable(true); setToolsOpen(false); }}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm hover:bg-slate-50 text-slate-700"
                  >
                    <Atom className="w-4 h-4" /> Jadual Berkala
                  </button>
                  <button
                    onClick={() => { setShowMemory(true); setToolsOpen(false); }}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm hover:bg-slate-50 text-slate-700"
                  >
                    <Sparkles className="w-4 h-4" /> Progres saya
                  </button>
                  {initialTopic && (
                    <button
                      onClick={handleResetSession}
                      className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm hover:bg-slate-50 text-indigo-600 font-semibold"
                    >
                      <RefreshCw className="w-4 h-4 text-indigo-500" /> Mula Semula Sesi
                    </button>
                  )}
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => { setToolsOpen(false); logout(); }}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm hover:bg-rose-50 text-rose-600"
                  >
                    <LogOut className="w-4 h-4" /> Log keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {initialTopic?.id === "periodic-table" && (
        <div className="bg-white border-b border-stone-200 px-4 sm:px-8 py-2.5 flex items-center justify-center gap-3 sticky top-0 z-10 shadow-sm">
          <button
            onClick={() => setActivePeriodicTab("table")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
              activePeriodicTab === "table"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            )}
          >
            <Atom className="w-3.5 h-3.5" /> Jadual Berkala (Interaktif)
          </button>
          <button
            onClick={() => setActivePeriodicTab("chat")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
              activePeriodicTab === "chat"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" /> Tanya Cikgu ({messages.length > 1 ? messages.length - 1 : 0})
          </button>
        </div>
      )}

      {/* Overlays */}
      <AnimatePresence>
        {showPeriodicTable && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            <PeriodicTable
              onClose={() => {
                setShowPeriodicTable(false);
                handleSend("Cikgu, terangkan secara ringkas kepentingan Jadual Berkala dalam silabus Kimia SPM?");
              }}
              onAnalyze={(el) => {
                setShowPeriodicTable(false);
                setTimeout(() => handleSend(`Cikgu, beri analisis lengkap untuk unsur ${el.name} (${el.symbol}): sifat kimia, kegunaan industri, dan cara topik ini biasa ditanya dalam SPM (Paper 2).`), 100);
              }}
              onExplore={(el) => {
                setShowPeriodicTable(false);
                setTimeout(() => handleSend(`Cikgu, bantu saya teroka ciri-ciri unsur ${el.name}. Apakah sifat fizik dan sifat kimia yang wajib saya tahu untuk SPM?`), 100);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBalancer && <EquationBalancer onClose={() => setShowBalancer(false)} />}
        {showMemory && <MemoryPanel memory={memory} onClose={() => setShowMemory(false)} />}
        {capOpen && (
          <CapDialog
            resetAt={memoryService.getNextResetAt()}
            cap={currentCap}
            onClose={() => setCapOpen(false)}
            onUpgrade={() => {
              setCapOpen(false);
              if (onUpgradeClick) onUpgradeClick();
            }}
          />
        )}
      </AnimatePresence>

      {/* Messages */}
      {initialTopic?.id === "periodic-table" && activePeriodicTab === "table" ? (
        <div className="flex-grow overflow-y-auto bg-stone-50">
          <PeriodicTable 
            onClose={() => {
              setActivePeriodicTab("chat");
              handleSend("Cikgu, terangkan secara ringkas kepentingan Jadual Berkala?");
            }} 
            onAnalyze={(el) => {
              setActivePeriodicTab("chat");
              setTimeout(() => {
                handleSend(`Cikgu, terangkan secara mendalam tentang unsur ${el.name} (${el.symbol}) berkaitan silibus SPM. Sila berikan kedudukan dalam Jadual Berkala, Sifat Fizik dan Sifat Kimia.`);
              }, 100);
            }}
            onExplore={(el) => {
              setActivePeriodicTab("chat");
              setTimeout(() => {
                handleSend(`Cikgu, apakah kegunaan industri atau fakta menarik tentang ${el.name} yang patut saya tahu untuk soalan Kimia SPM?`);
              }, 100);
            }}
          />
        </div>
      ) : (
        <div ref={scrollRef} className="flex-grow overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 space-y-8">
            {isHistoryLoading && (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-700 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px]">🧪</span>
                  </div>
                </div>
                <div className="space-y-1 text-center animate-pulse">
                  <p className="text-xs font-semibold text-slate-700">Menganalisis sejarah pembelajaran...</p>
                  <p className="text-[10px] text-slate-400 font-mono tracking-tight">Menyiapkan bilik darjah interaktif anda</p>
                </div>
              </div>
            )}

            {!isHistoryLoading && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12 flex flex-col items-center text-center space-y-6"
              >
                <div className="px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Syllabus KSSM SPM v2.0 Ready</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display text-slate-900">Apa yang kita nak belajar hari ini?</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                    Tanya apa-apa soalan Kimia, hantar gambar soalan peperiksaan, atau guna butang menu untuk alat khas.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md pt-4">
                   {dynamicQuickActions.slice(0, 4).map(qa => (
                     <button
                       key={qa.id}
                       onClick={() => handleSend(qa.prompt)}
                       className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-brand-accent/40 hover:shadow-sm transition-all group"
                     >
                       <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-brand-accent/5 transition-colors">
                         {qa.icon}
                       </div>
                       <span className="text-xs font-semibold text-slate-700">{qa.label}</span>
                     </button>
                   ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {groupedMessages.map((group, gi) => (
                <div key={gi} className="space-y-6">
                  <div className="flex justify-center">
                    <div className="text-[10px] font-mono font-semibold text-slate-400 tracking-[0.25em] uppercase">
                      · {group.date} ·
                    </div>
                  </div>
                  {group.messages.map((msg, mi) => (
                    <motion.div
                      key={msg.timestamp ? `${msg.role}-${msg.timestamp}` : `${gi}-${mi}`}
                      variants={bubbleVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout="position"
                      className={cn("flex gap-3 sm:gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                    >
                      <div className="flex-shrink-0">
                        {msg.role === "user" ? (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 ring-2 ring-white">
                            <User className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-900 ring-2 ring-white">
                            <img src="/logo.png" alt="Cikgu" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          </div>
                        )}
                      </div>

                      <div className={cn("max-w-[85%] sm:max-w-[78%]", msg.role === "user" ? "flex flex-col items-end" : "flex flex-col items-start")}>
                        {msg.images && msg.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2 justify-end">
                            {msg.images.map((img, i) => (
                              <div key={i} className="relative">
                                {img.mimeType.startsWith("image/") ? (
                                  <img
                                    src={`data:${img.mimeType};base64,${img.data}`}
                                    alt="Soalan"
                                    className="max-w-[240px] sm:max-w-xs rounded-2xl shadow-md border border-slate-200"
                                  />
                                ) : (
                                  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 text-slate-700">
                                    <FlaskConical className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm">{img.mimeType.includes("pdf") ? "PDF" : "Fail"}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className={cn(
                          "rounded-2xl px-5 py-4 shadow-sm border",
                          msg.role === "user"
                            ? "bg-slate-900 text-white border-slate-900 rounded-tr-md"
                            : "bg-white text-slate-800 border-slate-200 rounded-tl-md"
                        )}>
                          <div className={cn(
                            "prose prose-sm max-w-none",
                            msg.role === "user"
                              ? "prose-invert prose-p:text-slate-100"
                              : "prose-slate"
                          )}>
                            <StreamingMarkdown text={msg.text} />
                          </div>

                          {/* Interactive Start Button for Quiz/Exam/Syllabus */}
                          {msg.role === "model" && msg === messages[0] && initialTopic && (
                            initialTopic.id.startsWith("quiz") ? (
                              <button
                                id="btn-mula-kuiz"
                                onClick={() => handleSend(`Cikgu, saya sedia! Sila berikan satu soalan jackpot objektif dari "${initialTopic.title}".`)}
                                className="mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-md cursor-pointer border border-transparent"
                              >
                                🚀 Sedia, Mula Kuiz Sekarang
                              </button>
                            ) : initialTopic.id.startsWith("exam") ? (
                              <button
                                id="btn-mula-simulasi"
                                onClick={() => handleSend(`Cikgu, saya sedia! Sila mulakan simulasi peperiksaan "${initialTopic.title}" dengan soalan struktur atau esei.`)}
                                className="mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-md cursor-pointer border border-transparent"
                              >
                                📝 Sedia, Mula Peperiksaan Simulasi
                              </button>
                            ) : initialTopic.id !== "periodic-table" ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  id="btn-nota-ringkas"
                                  onClick={() => handleSend(`Cikgu, mohon kongsikan nota ringkas, rumusan konsep penting, serta tip peperiksaan SPM untuk topik "${initialTopic.title}".`)}
                                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer border border-transparent"
                                >
                                  📖 Beri Nota Ringkas & Tip SPM
                                </button>
                                <button
                                  id="btn-soalan-latihan"
                                  onClick={() => handleSend(`Cikgu, sila berikan saya satu soalan latihan Kertas 2 (Struktur/Esei) SPM bagi topik "${initialTopic.title}".`)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer border border-transparent"
                                >
                                  ❓ Berikan Soalan Latihan Kertas 2
                                </button>
                                <button
                                  id="btn-uji-minda"
                                  onClick={() => handleSend(`Cikgu, jom uji kefahaman saya dengan memberikan soalan konsep kilat untuk topik "${initialTopic.title}".`)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer border border-transparent"
                                >
                                  ⚡ Uji Saya Dengan Soalan Kilat
                                </button>
                              </div>
                            ) : null
                          )}
                        </div>

                        <div className="mt-1.5 text-[10px] text-slate-400 font-mono">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </AnimatePresence>

            {isLoading && messages[messages.length - 1]?.text === "" && (
              <div className="flex gap-3 sm:gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-900 ring-2 ring-white" />
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                          className="w-1.5 h-1.5 bg-slate-400 rounded-full block"
                        />
                      ))}
                    </span>
                    <span className="text-sm text-slate-500">Cikgu sedang berfikir…</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white border-t border-slate-200 px-4 sm:px-8 py-4 sm:py-5">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Image preview strip */}
          <AnimatePresence>
            {(selectedImages.length > 0 || compressing) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex gap-2 overflow-x-auto pb-1"
              >
                {compressing && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-slate-500 text-xs">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Memampatkan…
                  </div>
                )}
                {selectedImages.map(img => (
                  <div key={img.id} className="relative flex-shrink-0">
                    {img.mimeType.startsWith("image/") ? (
                      <img src={img.preview} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                    ) : (
                      <div className="w-20 h-20 flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-slate-200 p-2">
                        <FlaskConical className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[9px] truncate w-full text-center text-slate-500">{img.file.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-colors"
                      aria-label="Buang"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick actions */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
            {dynamicQuickActions.map(qa => (
              <button
                key={qa.id}
                type="button"
                onClick={() => handleSend(qa.prompt)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] sm:text-xs text-slate-700 font-medium transition-all"
              >
                <div className="text-slate-500 scale-75 sm:scale-100">{qa.icon}</div>
                {qa.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-2 py-2 focus-within:border-brand-accent focus-within:bg-white transition-all"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf,text/plain"
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 shrink-0"
                title="Muat naik fail/galeri"
              >
                <ImagePlus className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-white text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-all active:scale-95 shrink-0"
                title="Guna Kamera Telefon"
              >
                <Camera className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowPeriodicTable(true)}
                className="p-2.5 rounded-xl bg-white text-blue-500 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 transition-all active:scale-95 shrink-0"
                title="Buka Jadual Berkala"
              >
                <Atom className="w-5 h-5" />
              </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={selectedImages.length > 0 ? "Apa yang nak Cikgu buat dengan fail ini?" : "Tanya Cikgu Kimia... (cth: Terangkan beza elektrolit)"}
              rows={1}
              className="flex-grow py-2.5 px-2 bg-transparent focus:outline-none text-slate-800 resize-none max-h-32 text-sm sm:text-base"
            />

            <button
              type="submit"
              disabled={isLoading || (!input.trim() && selectedImages.length === 0)}
              className="p-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent/90 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-all active:scale-95"
              aria-label="Hantar"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          <div className="text-[10px] font-mono text-slate-400 text-center tracking-wider">
            Cikgu Kimia · bertarjamah daripada KSSM SPM
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────

function rid() { return Math.random().toString(36).slice(2, 11); }

/**
 * Build the conversation history for the server. Pulled straight from React state
 * (no extra Firestore read). Trims to the last `lookback` turns and trims long messages.
 */
function buildHistoryForServer(messages: Message[], lookback: number) {
  return messages
    .slice(-lookback * 2)
    .filter(m => m.text)
    .map(m => ({
      role: m.role,
      parts: [{ text: m.text.length > 1500 ? m.text.slice(0, 1500) + " […]" : m.text }],
    }));
}

/**
 * Render markdown while a response is streaming. If the buffer contains an
 * OPEN-but-unclosed ```svg fence, show a "Cikgu sedang melukis…" placeholder
 * for that chunk until the fence closes — avoids the half-flask flicker.
 */
function StreamingMarkdown({ text }: { text: string }) {
  // detect a code fence that hasn't yet closed
  const openFences = (text.match(/```/g) || []).length;
  const isInsideUnclosedFence = openFences % 2 === 1;
  const lastFenceIdx = text.lastIndexOf("```");
  let renderedText = text;

  if (isInsideUnclosedFence && lastFenceIdx >= 0) {
    const stub = text.slice(lastFenceIdx, lastFenceIdx + 6);
    if (stub.toLowerCase().startsWith("```svg")) {
      renderedText =
        text.slice(0, lastFenceIdx) +
        "\n\n_🖌️ Cikgu sedang melukis rajah…_\n\n";
    }
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          if (!inline && match && match[1] === "svg") {
            return (
              <div className="my-5 p-5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[10px] font-mono font-semibold text-slate-400 tracking-widest uppercase mb-3">Rajah</div>
                <div
                  className="w-full flex justify-center"
                  dangerouslySetInnerHTML={{ __html: String(children).replace(/\n$/, "") }}
                />
              </div>
            );
          }
          return (
            <code className={cn("font-mono", className)} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {renderedText}
    </ReactMarkdown>
  );
}
