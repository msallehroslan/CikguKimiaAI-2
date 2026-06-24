import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { 
  X, RefreshCw, Sparkles, BookOpen, ChevronRight, ChevronLeft, 
  RotateCw, Plus, Check, AlertCircle, Trash2, Layers, Search, HelpCircle,
  Award, ThumbsUp, Heart, Settings, Flame, Star, Atom, Calculator
} from "lucide-react";
import { cn } from "../lib/utils";
import { GeminiService } from "../services/geminiService";
import { useFirebase } from "../lib/FirebaseProvider";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: "definition" | "formula" | "reaction" | "general";
  categoryLabel: string;
  topicLabel: string;
  isCustom?: boolean;
  mastered?: boolean;
}

const CHEMISTRY_FLASHCARDS: Flashcard[] = [
  {
    id: "fc-chem-1",
    question: "Apakah maksud **Isotop**?",
    answer: "Atom-atom bagi unsur yang sama yang mempunyai **bilangan proton yang sama** tetapi **bilangan neutron yang berbeza**.",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 2: Jirim dan Struktur Atom"
  },
  {
    id: "fc-chem-2",
    question: "Apakah formula kimia bagi **Gas Karbon Dioksida**?",
    answer: "$CO_2$\n\nGas ini terdiri daripada satu atom Karbon ($C$) yang berikatan kovalen ganda dua dengan dua atom Oksigen ($O$).",
    category: "formula",
    categoryLabel: "Formula Kimia",
    topicLabel: "Bab 3: Konsep Mol, Formula & Persamaan"
  },
  {
    id: "fc-chem-3",
    question: "Apakah maksud **Formula Empirik**?",
    answer: "Formula kimia yang menunjukkan **nisbah termudah** bilangan atom bagi setiap jenis unsur dalam sesuatu sebatian.",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 3: Konsep Mol, Formula & Persamaan"
  },
  {
    id: "fc-chem-4",
    question: "Apakah formula kimia bagi **Asid Hidroklorik**?",
    answer: "$HCl$\n\nIa merupakan asid monoprotik kuat yang mengion lengkap di dalam air untuk menghasilkan kepekatan ion hidrogen, $H^+$, yang tinggi.",
    category: "formula",
    categoryLabel: "Formula Kimia",
    topicLabel: "Bab 6: Asid, Bes dan Garam"
  },
  {
    id: "fc-chem-5",
    question: "Apakah definisi **Haba Peneutralan**?",
    answer: "Perubahan haba apabila **1 mol air** terbentuk daripada tindak balas peneutralan antara asid dan alkali.",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 3 (T5): Termokimia"
  },
  {
    id: "fc-chem-6",
    question: "Apakah maksud **Aloi**?",
    answer: "**Campuran** dua atau lebih unsur di mana unsur utamanya ialah **logam**. \n\n*Tujuan:* Meningkatkan kekuatan, mencegah kakisan, dan mencantikkan rupa logam.",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 5 (T5): Kimia Pengguna dan Industri"
  },
  {
    id: "fc-chem-7",
    question: "Apakah formula kimia bagi garam **Kuprum(II) Sulfat**?",
    answer: "$CuSO_4$\n\nGaram terlarut berwarna biru ini sering digunakan untuk membina hablur biru pekat.",
    category: "formula",
    categoryLabel: "Formula Kimia",
    topicLabel: "Bab 6: Asid, Bes dan Garam"
  },
  {
    id: "fc-chem-8",
    question: "Apakah maksud **Agen Pengoksidaan**?",
    answer: "Bahan yang **mengoksidakan** bahan lain, manakala dirinya sendiri mengalami **penurunan** (menerima elektron / nombor pengoksidaan berkurang).",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 1 (T5): Keseimbangan Redoks"
  },
  {
    id: "fc-chem-9",
    question: "Apakah formula kimia bagi **Gas Amonia**?",
    answer: "$NH_3$\n\nGas beralkali lemah yang mempunyai bau sengit, dihasilkan melalui Proses Haber ($N_2 + 3H_2 \\rightleftharpoons 2NH_3$).",
    category: "formula",
    categoryLabel: "Formula Kimia",
    topicLabel: "Bab 5 (T5): Kimia Pengguna dan Industri"
  },
  {
    id: "fc-chem-10",
    question: "Apakah definisi **Kadar Tindak Balas**?",
    answer: "**Perubahan kuantiti** bahan tindak balas atau hasil tindak balas **per unit masa**.\n\n$$\\text{Kadar Tindak Balas} = \\frac{\\Delta \\text{Kuantiti}}{\\text{Masa}}$$",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 7: Kadar Tindak Balas"
  }
];

const PHYSICS_FLASHCARDS: Flashcard[] = [
  {
    id: "fc-phys-1",
    question: "Apakah maksud **Inersia**?",
    answer: "Kecenderungan suatu objek untuk **menentang sebarang perubahan** terhadap keadaan asal objek itu, sama ada sedang pegun atau sedang bergerak.",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 2: Daya dan Gerakan I"
  },
  {
    id: "fc-phys-2",
    question: "Nyatakan **Prinsip Archimedes**.",
    answer: "Suatu objek yang terendam sebahagian atau sepenuhnya di dalam suatu bendalir mengalami daya apung yang **sama dengan berat bendalir** yang disesarkan.\n\n$$F_B = \\rho V g$$",
    category: "general",
    categoryLabel: "Prinsip Fizik",
    topicLabel: "Bab 2 (T5): Tekanan"
  },
  {
    id: "fc-phys-3",
    question: "Apakah formula bagi **Laju** dan unit SInya?",
    answer: "$$v = \\frac{s}{t}$$\n\n*Unit SI:* $m\\ s^{-1}$\n- $v$ = laju / halaju\n- $s$ = jarak / sesaran\n- $t$ = masa",
    category: "formula",
    categoryLabel: "Formula Fizik",
    topicLabel: "Bab 2: Daya dan Gerakan I"
  },
  {
    id: "fc-phys-4",
    question: "Apakah **Hukum Gerakan Newton Pertama**?",
    answer: "Sesuatu objek akan kekal dalam keadaan pegun atau bergerak dengan halaju malar jika **tiada daya luar** yang bertindak ke atasnya.",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 2: Daya dan Gerakan I"
  },
  {
    id: "fc-phys-5",
    question: "Apakah takrifan **Haba Pendam Tentu Pelakuran**, $l_f$?",
    answer: "Kuantiti haba yang diserap semasa peleburan atau kuantiti haba yang dibebaskan semasa pembekuan bagi **1 kg bahan tanpa sebarang perubahan suhu**.\n\n$$Q = m l_f$$",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 4: Haba"
  },
  {
    id: "fc-phys-6",
    question: "Apakah **Prinsip Keabadian Tenaga**?",
    answer: "Tenaga **tidak boleh dicipta atau dimusnahkan**, tetapi hanya boleh **berubah** dari satu bentuk ke bentuk yang lain.",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 2: Daya dan Gerakan I"
  }
];

const BIOLOGY_FLASHCARDS: Flashcard[] = [
  {
    id: "fc-bio-1",
    question: "Apakah maksud **Mitosis**?",
    answer: "Proses pembahagian sel nukleus yang menghasilkan **dua sel anak** yang mengandungi **bilangan kromosom dan kandungan genetik yang sama** dengan sel induk.",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 6: Pembahagian Sel"
  },
  {
    id: "fc-bio-2",
    question: "Apakah persamaan kimia keseluruhan bagi **Fotosintesis**?",
    answer: "$$6CO_2 + 6H_2O \\xrightarrow{\\text{Cahaya \& Klorofil}} C_6H_{12}O_6 + 6O_2$$\n\nGas karbon dioksida dan air digunakan dengan kehadiran tenaga cahaya untuk menghasilkan glukosa dan oksigen.",
    category: "formula",
    categoryLabel: "Persamaan Biologi",
    topicLabel: "Bab 2 (T5): Struktur Daun dan Fotosintesis"
  },
  {
    id: "fc-bio-3",
    question: "Apakah maksud proses **Asimilasi** makanan?",
    answer: "Proses penukaran nutrien yang diserap (seperti asid amino dan glukosa) menjadi **sebatian kompleks** atau **protoplasma baharu** dalam sel hidup.",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 9: Nutrisi dan Sistem Pencernaan"
  },
  {
    id: "fc-bio-4",
    question: "Apakah maksud **Homeostasis**?",
    answer: "Pengawalaturan persekitaran dalam badan (faktor fizikal dan kimia) supaya sentiasa berada dalam **keadaan seimbang dan stabil** untuk sel berfungsi secara optimum.",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 13: Homeostasis dan Sistem Urinari"
  },
  {
    id: "fc-bio-5",
    question: "Apakah persamaan perkataan bagi **Respirasi Aerob**?",
    answer: "$$\\text{Glukosa} + \\text{Oksigen} \\rightarrow \\text{Karbon Dioksida} + \\text{Air} + \\text{Tenaga (38 ATP)}$$\n\nBerlaku terutamanya di dalam **mitokondria** sel dengan kehadiran oksigen lengkap.",
    category: "formula",
    categoryLabel: "Persamaan Biologi",
    topicLabel: "Bab 7: Respirasi Sel"
  },
  {
    id: "fc-bio-6",
    question: "Apakah maksud **Plasmolisis** pada sel tumbuhan?",
    answer: "Proses di mana **sitoplasma dan membran plasma mengecut** dan menjauh dari dinding sel tumbuhan akibat kehilangan air secara osmosis ke persekitaran hipertonik.",
    category: "definition",
    categoryLabel: "Definisi & Konsep",
    topicLabel: "Bab 3: Pergerakan Bahan Merentasi Membran"
  }
];

const DEFAULT_FLASHCARDS_MAP: Record<string, Flashcard[]> = {
  chemistry: CHEMISTRY_FLASHCARDS,
  physics: PHYSICS_FLASHCARDS,
  biology: BIOLOGY_FLASHCARDS
};

interface FlashcardHubProps {
  onClose: () => void;
  subjectId?: string; // chemistry, physics, or biology
}

export function FlashcardHub({ onClose, subjectId = "chemistry" }: FlashcardHubProps) {
  const { user } = useFirebase();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [streak, setStreak] = useState(0);

  // Form states for manual card
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState<"definition" | "formula" | "reaction" | "general">("definition");
  const [newTopic, setNewTopic] = useState("");

  // AI State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeDefaultList = useMemo(() => {
    return DEFAULT_FLASHCARDS_MAP[subjectId] || CHEMISTRY_FLASHCARDS;
  }, [subjectId]);

  const subjectMeta = useMemo(() => {
    switch (subjectId) {
      case "physics":
        return {
          title: "Kad Imbas Fizik SPM",
          subtitle: "Kuasai Rumus & Teori KSSM",
          themeColor: "text-sky-600 bg-sky-50 border-sky-100",
          btnColor: "bg-sky-600 hover:bg-sky-700",
          aiTheme: "from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:from-sky-400 disabled:to-indigo-400",
          icon: <Calculator className="w-5 h-5 text-sky-600" />,
          langSubject: "Fizik KSSM SPM"
        };
      case "biology":
        return {
          title: "Kad Imbas Biologi SPM",
          subtitle: "Kuasai Konsep Sel & Proses Hidup",
          themeColor: "text-emerald-600 bg-emerald-50 border-emerald-100",
          btnColor: "bg-emerald-600 hover:bg-emerald-700",
          aiTheme: "from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-emerald-400 disabled:to-teal-400",
          icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
          langSubject: "Biologi KSSM SPM"
        };
      case "chemistry":
      default:
        return {
          title: "Kad Imbas Kimia SPM",
          subtitle: "Kuasai Formula & Definisi KSSM",
          themeColor: "text-teal-600 bg-teal-50 border-teal-100",
          btnColor: "bg-teal-600 hover:bg-teal-700",
          aiTheme: "from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 disabled:from-teal-400 disabled:to-indigo-400",
          icon: <Atom className="w-5 h-5 text-teal-600" />,
          langSubject: "Kimia KSSM SPM"
        };
    }
  }, [subjectId]);

  // Load from localStorage on mount & when subject changes
  useEffect(() => {
    const storageKey = `spm_${subjectId}_flashcards`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCards(JSON.parse(saved));
      } catch (e) {
        setCards(activeDefaultList);
      }
    } else {
      setCards(activeDefaultList);
    }

    const streakKey = `spm_${subjectId}_flashcard_streak`;
    const savedStreak = localStorage.getItem(streakKey);
    if (savedStreak) {
      setStreak(parseInt(savedStreak, 10));
    } else {
      setStreak(0);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [subjectId, activeDefaultList]);

  // Save to localStorage whenever cards change
  const saveCards = (newCards: Flashcard[]) => {
    setCards(newCards);
    const storageKey = `spm_${subjectId}_flashcards`;
    localStorage.setItem(storageKey, JSON.stringify(newCards));
  };

  const handleUpdateStreak = () => {
    const nextStreak = streak + 1;
    setStreak(nextStreak);
    const streakKey = `spm_${subjectId}_flashcard_streak`;
    localStorage.setItem(streakKey, nextStreak.toString());
  };

  // Filter cards
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // Category filter
      if (activeTab !== "all" && card.category !== activeTab) {
        if (activeTab === "mastered" && !card.mastered) return false;
        if (activeTab === "unmastered" && card.mastered) return false;
        if (activeTab !== "mastered" && activeTab !== "unmastered") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          card.question.toLowerCase().includes(query) ||
          card.answer.toLowerCase().includes(query) ||
          card.topicLabel.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [cards, activeTab, searchQuery]);

  const activeCard = filteredCards[currentIndex];

  // Motion values for swipe gestures
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 180], [-18, 18]);
  const opacity = useTransform(x, [-180, -120, 0, 120, 180], [0.4, 1, 1, 1, 0.4]);
  
  // Glowing border effect based on drag direction
  const borderGlow = useTransform(
    x,
    [-150, 0, 150],
    ["rgba(239, 68, 68, 0.4)", "rgba(226, 232, 240, 1)", "rgba(16, 185, 129, 0.4)"]
  );

  // Reset flip state when card index changes
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleMaster = (mastered: boolean) => {
    if (!activeCard) return;
    
    const updated = cards.map(c => {
      if (c.id === activeCard.id) {
        return { ...c, mastered };
      }
      return c;
    });
    saveCards(updated);

    if (mastered) {
      handleUpdateStreak();
    }

    // Go to next card automatically after a short delay
    setTimeout(() => {
      if (currentIndex < filteredCards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Wrap around or show end-of-deck screen
        setCurrentIndex(prev => prev + 1); // Trigger summary view
      }
    }, 150);
  };

  const handleResetMastery = () => {
    const updated = cards.map(c => ({ ...c, mastered: false }));
    saveCards(updated);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleDeleteCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = cards.filter(c => c.id !== id);
    saveCards(updated);
    if (currentIndex >= updated.length && currentIndex > 0) {
      setCurrentIndex(updated.length - 1);
    }
  };

  const handleAddManualCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) {
      setErrorMsg("Sila isi soalan dan jawapan!");
      return;
    }

    const categoryLabels = {
      definition: "Definisi & Konsep",
      formula: subjectId === "physics" ? "Formula Fizik" : subjectId === "biology" ? "Persamaan Biologi" : "Formula Kimia",
      reaction: subjectId === "physics" ? "Fenomena Daya" : subjectId === "biology" ? "Proses Hidup" : "Tindak Balas",
      general: "Am / Fokus SPM"
    };

    const newCard: Flashcard = {
      id: `fc-custom-${Date.now()}`,
      question: newQuestion,
      answer: newAnswer,
      category: newCategory,
      categoryLabel: categoryLabels[newCategory],
      topicLabel: newTopic.trim() ? newTopic : "Topik Tambahan",
      isCustom: true
    };

    const updated = [newCard, ...cards];
    saveCards(updated);
    
    // Clear forms and state
    setNewQuestion("");
    setNewAnswer("");
    setNewCategory("definition");
    setNewTopic("");
    setShowAddForm(false);
    setErrorMsg("");
    setCurrentIndex(0);
  };

  // Generate with AI
  const handleGenerateWithAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) {
      setErrorMsg("Sila nyatakan tajuk atau kata kunci!");
      return;
    }

    setIsGenerating(true);
    setErrorMsg("");

    try {
      // Lazy init Gemini service with dummy/empty memory
      const gemini = new GeminiService({
        weakTopics: [],
        identifiedMistakes: [],
        examPapersAnalysis: []
      });

      const prompt = 
        `Sila bina satu kad imbas (flashcard) ${subjectMeta.langSubject} bertemakan "${aiPrompt}".\n` +
        `Sila pastikan soalan dan jawapan berkualiti tinggi dan bertepatan dengan skema peperiksaan SPM KSSM Tingkatan 4 atau Tingkatan 5.\n` +
        `Kembalikan maklum balas anda dalam format JSON sahaja tanpa sebarang penjelasan luaran:\n` +
        `{\n` +
        `  "question": "Satu soalan ringkas tentang konsep/definisi/formula tersebut (dalam Bahasa Melayu, gunakan markdown **bold** untuk istilah penting)",\n` +
        `  "answer": "Jawapan ringkas, padat dan tepat mengikut skema pemarkahan SPM (dalam Bahasa Melayu, gunakan markdown/LaTeX jika sesuai. Contoh: gunakan $H_2O$ atau $v = u + at$)",\n` +
        `  "category": "definition" atau "formula" atau "reaction" atau "general",\n` +
        `  "categoryLabel": "Label kategori yang sesuai (cth: Definisi & Konsep, Formula Fizik, Persamaan Biologi, Am / Fokus SPM)",\n` +
        `  "topicLabel": "Nama bab SPM KSSM yang berkaitan (cth: Bab 2 Tingkatan 5)"\n` +
        `}`;

      const res = await gemini.sendMessage(prompt);
      
      // Parse response cleanly
      const jsonStr = res.replace(/```json/gi, "").replace(/```/g, "").trim();
      const data = JSON.parse(jsonStr);

      const newCard: Flashcard = {
        id: `fc-ai-${Date.now()}`,
        question: data.question || `Apakah ulasan penting bagi ${aiPrompt}?`,
        answer: data.answer || `Penerangan lengkap mengenai ${aiPrompt}.`,
        category: data.category || "general",
        categoryLabel: data.categoryLabel || "Fokus SPM",
        topicLabel: data.topicLabel || "Penjanaan Pintar AI",
        isCustom: true
      };

      const updated = [newCard, ...cards];
      saveCards(updated);
      setAiPrompt("");
      setShowAiForm(false);
      setCurrentIndex(0);
    } catch (e) {
      console.error(e);
      setErrorMsg("Gagal menjana kad imbas pintar. Sila cuba lagi atau guna kata kunci yang berbeza.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Drag handlers
  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 120) {
      handleMaster(true);
    } else if (info.offset.x < -120) {
      handleMaster(false);
    }
  };

  const masteredCount = cards.filter(c => c.mastered).length;
  const masteryPercentage = cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 50, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 50, scale: 0.96 }}
        className="w-full max-w-2xl bg-slate-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", subjectMeta.themeColor)}>
              {subjectMeta.icon}
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-800 leading-none">{subjectMeta.title}</h3>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-1">
                {subjectMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-full text-xs font-semibold" title="Rentetan Latihan">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{streak}</span>
              </div>
            )}
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-slate-500 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "Semua" },
              { id: "definition", label: "Definisi" },
              { id: "formula", label: subjectId === "physics" ? "Formula Fizik" : "Formula/Persamaan" },
              { id: "mastered", label: "Kuasai" },
              { id: "unmastered", label: "Belum Kuasai" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentIndex(0);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap",
                  activeTab === tab.id
                    ? subjectId === "physics" 
                      ? "bg-sky-600 text-white shadow-sm"
                      : subjectId === "biology"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-teal-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kad imbas..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentIndex(0);
              }}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg text-xs border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center min-h-[360px]">
          {/* Add Manual Form */}
          {showAddForm && (
            <form onSubmit={handleAddManualCard} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-teal-600" /> Tambah Kad Imbas Baru
                </h4>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 text-xs">Batal</button>
              </div>

              {errorMsg && (
                <div className="bg-red-50 text-red-600 border border-red-100 px-3 py-2 rounded-lg text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Soalan / Istilah</label>
                <input
                  type="text"
                  placeholder="Apakah maksud konsep ini?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Jawapan / Penerangan / Formula</label>
                <textarea
                  placeholder="Penerangan atau jawapan tepat..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white"
                  >
                    <option value="definition">Definisi & Konsep</option>
                    <option value="formula">{subjectId === "physics" ? "Formula Fizik" : "Formula & Persamaan"}</option>
                    <option value="reaction">{subjectId === "physics" ? "Fenomena Daya" : subjectId === "biology" ? "Proses Hidup" : "Tindak Balas"}</option>
                    <option value="general">Am / Fokus SPM</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Bab / Topik</label>
                  <input
                    type="text"
                    placeholder="Bab 2 Tingkatan 4"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={cn("w-full py-2 text-white font-medium text-xs rounded-lg shadow-sm transition", subjectMeta.btnColor)}
              >
                Simpan Kad Imbas
              </button>
            </form>
          )}

          {/* AI Generator Form */}
          {showAiForm && (
            <form onSubmit={handleGenerateWithAi} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" /> Penjana Kad Imbas AI
                </h4>
                <button type="button" onClick={() => setShowAiForm(false)} className="text-slate-400 hover:text-slate-600 text-xs" disabled={isGenerating}>Batal</button>
              </div>

              {errorMsg && (
                <div className="bg-red-50 text-red-600 border border-red-100 px-3 py-2 rounded-lg text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <p className="text-xs text-slate-500 leading-relaxed">
                Masukkan topik, rumus, atau istilah {subjectId === "physics" ? "Fizik" : subjectId === "biology" ? "Biologi" : "Kimia"} untuk menjana definisi pintar mengikut skema KSSM secara automatik.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Kata Kunci / Topik</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={
                      subjectId === "physics" 
                        ? "Contoh: Hukum Hooke, Transistor, Archimedes..." 
                        : subjectId === "biology" 
                          ? "Contoh: Meiosis, Sel Stem, Kitar Nitrogen..." 
                          : "Contoh: Ikatan Logam, Polimer, CuSO4..."
                    }
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={isGenerating}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none bg-slate-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className={cn(
                  "w-full py-2.5 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition bg-gradient-to-r",
                  subjectMeta.aiTheme
                )}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cikgu sedang menyusun kad imbas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Jana Kad Imbas KSSM Pintar</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Flashcard Game Board */}
          {!showAddForm && !showAiForm && (
            <div className="w-full max-w-sm flex flex-col items-center">
              {filteredCards.length === 0 ? (
                <div className="text-center bg-white border border-slate-100 rounded-2xl p-8 shadow-sm w-full">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">Tiada Kad Dijumpai</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Tiada kad imbas dalam kategori ini atau carian anda tidak sepadan. Sila tambah kad baru atau tukar kategori.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab("all");
                      setSearchQuery("");
                    }}
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                  >
                    Set Semula Penapis
                  </button>
                </div>
              ) : currentIndex >= filteredCards.length ? (
                /* Deck Finished Screen */
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white border border-slate-100 rounded-3xl p-8 shadow-md text-center w-full space-y-5"
                >
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-lg">Tahniah! Dek Selesai</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Anda telah melengkapkan ulasan kad imbas untuk penapis semasa.
                    </p>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100/80">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{masteredCount}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Sudah Dikuasai</div>
                    </div>
                    <div className="text-center border-l border-slate-200">
                      <div className={cn("text-2xl font-bold", subjectId === "physics" ? "text-sky-600" : subjectId === "biology" ? "text-emerald-600" : "text-teal-600")}>{masteryPercentage}%</div>
                      <div className="text-[10px] text-slate-500 font-medium">Kadar Penguasaan</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => setCurrentIndex(0)}
                      className={cn("w-full py-2.5 text-white font-medium text-xs rounded-xl shadow-sm transition", subjectMeta.btnColor)}
                    >
                      Ulangi Sesi Ini
                    </button>
                    <button
                      onClick={handleResetMastery}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 transition text-slate-700 font-medium text-xs rounded-xl"
                    >
                      Set Semula Semua Status Kad
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Active Flashcard */
                <div className="w-full space-y-6">
                  {/* Progress Indicator */}
                  <div className="w-full flex justify-between items-center text-[11px] text-slate-500">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                      Kad {currentIndex + 1} daripada {filteredCards.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      Penguasaan: <strong className={subjectId === "physics" ? "text-sky-600" : subjectId === "biology" ? "text-emerald-600" : "text-teal-600"}>{masteryPercentage}%</strong>
                    </span>
                  </div>

                  {/* Swipeable & Flippable Card Deck Container */}
                  <div className="relative w-full h-80 perspective-1000">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeCard.id}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={handleDragEnd}
                        style={{ x, rotate, opacity }}
                        whileDrag={{ scale: 1.02 }}
                        animate={{ rotateY: isFlipped ? 180 : 0, scale: 1, x: 0 }}
                        initial={{ scale: 0.95, opacity: 0 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 w-full h-full cursor-pointer preserve-3d select-none"
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                        {/* FRONT SIDE */}
                        <motion.div 
                          className="absolute inset-0 w-full h-full p-6 flex flex-col justify-between rounded-3xl bg-white border-2 shadow-xl hover:shadow-2xl backface-hidden"
                          style={{ borderColor: borderGlow }}
                        >
                          <div className="flex justify-between items-start">
                            <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full border border-opacity-50", 
                              subjectId === "physics" 
                                ? "bg-sky-50 text-sky-600 border-sky-100" 
                                : subjectId === "biology"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-teal-50 text-teal-600 border-teal-100"
                            )}>
                              {activeCard.categoryLabel}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {activeCard.topicLabel}
                            </span>
                          </div>

                          <div className="my-auto text-center px-2 py-4">
                            <div className="text-slate-800 text-lg font-bold font-display leading-relaxed markdown-body">
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {activeCard.question}
                              </ReactMarkdown>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-50 shrink-0">
                            <span className="flex items-center gap-1">
                              <RotateCw className={cn("w-3 h-3 animate-pulse", subjectId === "physics" ? "text-sky-600" : subjectId === "biology" ? "text-emerald-600" : "text-teal-600")} /> Ketik untuk semak jawapan
                            </span>
                            {activeCard.isCustom && (
                              <button 
                                onClick={(e) => handleDeleteCard(activeCard.id, e)}
                                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                                title="Padam kad"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </motion.div>

                        {/* BACK SIDE */}
                        <motion.div 
                          className="absolute inset-0 w-full h-full p-6 flex flex-col justify-between rounded-3xl bg-slate-900 text-white border-2 shadow-xl hover:shadow-2xl backface-hidden"
                          style={{ borderColor: borderGlow, rotateY: 180 }}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-semibold bg-white/10 text-white px-2.5 py-1 rounded-full">
                              JAWAPAN
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {activeCard.topicLabel}
                            </span>
                          </div>

                          <div className="my-auto text-center overflow-y-auto max-h-[160px] px-2 py-1 scrollbar-thin">
                            <div className="text-slate-100 text-sm sm:text-base leading-relaxed markdown-body">
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {activeCard.answer}
                              </ReactMarkdown>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-white/5 shrink-0">
                            <span className="flex items-center gap-1">
                              <RotateCw className="w-3 h-3 text-teal-400" /> Ketik untuk pusing balik
                            </span>
                            {activeCard.mastered ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Kuasai
                              </span>
                            ) : null}
                          </div>
                        </motion.div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Manual Mastery Controls */}
                  <div className="flex justify-center items-center gap-4 pt-2 shrink-0">
                    <button
                      onClick={() => handleMaster(false)}
                      className="w-12 h-12 rounded-full bg-white border border-red-100 hover:bg-red-50 text-red-500 flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 group"
                      title="Ulang Nanti"
                    >
                      <X className="w-5 h-5 transition-transform group-hover:rotate-12" />
                    </button>
                    
                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                    >
                      <RotateCw className="w-3.5 h-3.5" /> Pusing
                    </button>

                    <button
                      onClick={() => handleMaster(true)}
                      className="w-12 h-12 rounded-full bg-white border border-emerald-100 hover:bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 group"
                      title="Kuasai"
                    >
                      <Check className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </button>
                  </div>

                  {/* Swipe Help Note */}
                  <p className="text-[10px] text-slate-400 text-center leading-relaxed max-w-[240px] mx-auto">
                    Ketik untuk pusing. Seret kad ke <strong className="text-red-400/90 font-medium">KIRI</strong> jika belum kuasai, atau <strong className="text-emerald-500/90 font-medium">KANAN</strong> jika sudah kuasai.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Speed Dials */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex gap-2 sm:justify-between items-center shrink-0">
          {!showAddForm && !showAiForm ? (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setErrorMsg("");
                  }}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs rounded-xl font-medium border border-slate-200/60 flex items-center gap-1.5 transition"
                >
                  <Plus className={cn("w-3.5 h-3.5", subjectId === "physics" ? "text-sky-600" : subjectId === "biology" ? "text-emerald-600" : "text-teal-600")} /> Tambah Manual
                </button>
                <button
                  onClick={() => {
                    setShowAiForm(true);
                    setErrorMsg("");
                  }}
                  className={cn("px-3 py-2 text-teal-700 text-xs rounded-xl font-medium border flex items-center gap-1.5 transition",
                    subjectId === "physics" 
                      ? "bg-sky-50 hover:bg-sky-100 border-sky-100 text-sky-700" 
                      : subjectId === "biology"
                        ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-700"
                        : "bg-teal-50 hover:bg-teal-100 border-teal-100 text-teal-700"
                  )}
                >
                  <Sparkles className={cn("w-3.5 h-3.5 animate-bounce", subjectId === "physics" ? "text-sky-600" : subjectId === "biology" ? "text-emerald-600" : "text-teal-600")} /> Minta AI Kad
                </button>
              </div>

              {filteredCards.length > 0 && currentIndex < filteredCards.length && (
                <div className="flex gap-1.5">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-[10px] text-slate-400 italic">
              Kad imbas tersimpan selamat dalam storan peranti anda.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
