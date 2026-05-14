import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, User, ChevronLeft, Loader2, Sparkles, ImagePlus, X, Brain, FlaskConical, RefreshCw, ClipboardCheck, LogOut, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Message, GeminiService } from "../services/geminiService";
import { Topic } from "../constants";
import { cn } from "../lib/utils";
import { memoryService, StudentMemory } from "../services/memoryService";
import { useFirebase } from "../lib/FirebaseProvider";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

import { EquationGuide } from "./EquationGuide";
import { EquationBalancer } from "./EquationBalancer";

interface ChatProps {
  initialTopic?: Topic | null;
}

interface SelectedImage {
  id: string;
  file: File;
  preview: string;
  base64: string;
  mimeType: string;
}

export function Chat({ initialTopic }: ChatProps) {
  const { user, logout } = useFirebase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [memory, setMemory] = useState<StudentMemory>({
    weakTopics: [],
    identifiedMistakes: [],
    examPapersAnalysis: []
  });
  const [showMemory, setShowMemory] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showBalancer, setShowBalancer] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize GeminiService with existing memory
  const gemini = useMemo(() => new GeminiService(memory), [memory]);

  const hasHandledInitial = useRef(false);

  // Load memory and history on mount
  useEffect(() => {
    if (user) {
      loadMemory();
      loadHistory();
    }
  }, [user]);

  const loadMemory = async () => {
    if (!user) return;
    const mem = await memoryService.getMemory(user.uid);
    setMemory(mem);
  };

  const loadHistory = async () => {
    if (!user || !initialTopic) return;
    // Loading history is optional but good for persistent experience
    // For now, we only show current session to keep it clean, 
    // but we can fetch last 10 messages if needed.
  };

  useEffect(() => {
    if (initialTopic) {
      if (!hasHandledInitial.current && messages.length === 0) {
        handleInitialTopic(initialTopic);
        hasHandledInitial.current = true;
      }
    } else if (messages.length === 0) {
      setMessages([
        {
          role: "model",
          text: `Salam sejahtera, ${user?.displayName || "Pelajar"}! Saya Cikgu Kimia, rakan belajar anda. Ada apa-apa masalah Kimia SPM yang saya boleh bantu hari ini? 🧪\n\nSaya telah memuatkan silabus KSSM terbaru dan skema markah rasmi untuk memastikan jawapan saya tepat.`
        }
      ]);
    }
  }, [initialTopic, user]);

  const handleInitialTopic = async (topic: Topic) => {
    let text = "";
    if (topic.id.startsWith('quiz')) {
      text = `Cikgu, saya nak buat "${topic.title}". Boleh berikan satu soalan objektif mencabar dari mana-mana bab SPM? Sila berikan jawapan hanya selepas saya menjawab.`;
    } else if (topic.id.startsWith('exam')) {
      text = `Cikgu, mari buat simulasi "${topic.title}". Sila berikan:
1. Satu soalan Paper 2 (Bahagian A - Struktur) yang mempunyai sub-soalan (a, b, c).
2. Satu soalan Paper 2 (Bahagian B/C - Esei) yang memerlukan huraian dan perancangan eksperimen (jika sesuai).
Sertakan peruntukan markah $[... markah]$ untuk setiap bahagian. Jangan berikan jawapan lagi.`;
    } else {
      text = `Cikgu, saya nak tanya pasal topik "${topic.title}". Boleh kongsikan ringkasan utama?`;
    }
    handleSend(text);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Periodic memory update
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "model") {
      const lastUserMsg = messages[messages.length - 2];
      const hasAssets = lastUserMsg?.role === "user" && lastUserMsg.images && lastUserMsg.images.length > 0;
      
      if (hasAssets || messages.length % 4 === 0) {
        updateMemory();
      }
    }
  }, [messages]);

  const updateMemory = async (recentMessages: Message[] = messages.slice(-4)) => {
    if (isLoading || !user) return;
    try {
      const recentConversation = recentMessages.map(m => `${m.role}: ${m.text}`).join("\n");
      const latestAssets = recentMessages.find(m => m.role === "user" && m.images && m.images.length > 0)?.images || [];
      
      const analysis = await gemini.analyzeForMemory(recentConversation, latestAssets);
      if (analysis) {
        await memoryService.addExamAnalysis(user.uid, analysis);
        const newMemory = await memoryService.getMemory(user.uid);
        setMemory(newMemory);
      }
    } catch (e) {
      console.error("Memory update failed", e);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

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
        setSelectedImages(prev => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: "",
            base64: btoa(text),
            mimeType: file.type
          }
        ]);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(",")[1];
        const preview = isImage ? event.target?.result as string : "";
        
        setSelectedImages(prev => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview,
            base64,
            mimeType: file.type
          }
        ]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (id: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSend = async (text: string = input) => {
    const finalImages = [...selectedImages];
    const inputText = text;
    
    if ((!inputText.trim() && finalImages.length === 0) || isLoading || !user) return;

    const userMessage: Message = { 
      role: "user", 
      text: inputText,
      images: finalImages.map(img => ({ mimeType: img.mimeType, data: img.base64 }))
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Persist to Firestore
    try {
      await addDoc(collection(db, `users/${user.uid}/history`), {
        ...userMessage,
        userId: user.uid,
        timestamp: serverTimestamp(),
        topicId: initialTopic?.id || "general"
      });
    } catch (e) {
      console.error("Failed to save history", e);
    }

    setInput("");
    setSelectedImages([]);
    setIsLoading(true);

    try {
      let fullResponse = "";
      setMessages((prev) => [...prev, { role: "model", text: "" }]);
      
      const payloadImages = finalImages.map(img => ({ mimeType: img.mimeType, data: img.base64 }));
      
      await gemini.sendMessageStream(inputText || "Sila terangkan rajah ini.", payloadImages, (chunk) => {
        fullResponse += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === "model") {
            lastMsg.text = fullResponse;
          }
          return newMessages;
        });
      });

      // Save model response to Firestore
      await addDoc(collection(db, `users/${user.uid}/history`), {
        role: "model",
        text: fullResponse,
        userId: user.uid,
        timestamp: serverTimestamp(),
        topicId: initialTopic?.id || "general"
      });
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Maaf, Cikgu mengalami sedikit gangguan talian. Sila cuba lagi sebentar. 🙏" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Chat Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 overflow-hidden shadow-xl shadow-blue-500/10 rotate-3 flex items-center justify-center border border-slate-800">
             <img 
               src="/logo.png" 
               alt="IoTera" 
               className="w-full h-full object-cover"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.parentElement!.innerHTML = `
                   <div class="flex flex-col items-center justify-center bg-slate-900 w-full h-full -rotate-3">
                     <span class="text-white font-black text-[10px] leading-none">IO</span>
                   </div>
                 `;
               }}
             />
          </div>
          <div>
            <h2 className="font-black text-slate-900 tracking-tight flex items-center gap-2 italic uppercase">
              {initialTopic ? initialTopic.title : "Cikgu AI Nexus"}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_#0ea5e9]" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                IoTera Intelligence
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {initialTopic && !initialTopic.id.startsWith('quiz') && !initialTopic.id.startsWith('exam') && (
            <button 
              onClick={() => handleSend(`Cikgu, saya nak masuk 'Exam Mode' untuk topik ${initialTopic.title}. Sila berikan satu set soalan Paper 2 yang mengandungi soalan Struktur DAN soalan Esei yang berkaitan. Sertakan markah penuh bagi setiap soalan. Jangan bagi jawapan lagi.`)}
              className="p-2 rounded-xl transition-all flex items-center gap-2 border bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
              title="Mula simulasi peperiksaan Kertas 2"
            >
              <ClipboardCheck className="w-5 h-5" />
              <span className="text-xs font-black hidden sm:inline uppercase">Exam Mode</span>
            </button>
          )}

          <button 
            onClick={() => setShowBalancer(!showBalancer)}
            className={cn(
              "p-2 rounded-xl transition-all flex items-center gap-2 border",
              showBalancer ? "bg-blue-50 border-blue-200 text-brand-blue" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            )}
          >
            <RefreshCw className={cn("w-5 h-5", showBalancer && "animate-spin")} />
            <span className="text-xs font-bold hidden sm:inline">Persamaan</span>
          </button>

          <button 
            onClick={() => setShowGuide(!showGuide)}
            className={cn(
              "p-2 rounded-xl transition-all flex items-center gap-2 border",
              showGuide ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            )}
          >
            <FlaskConical className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">Panduan Persamaan</span>
          </button>

          <button 
            onClick={() => setShowMemory(!showMemory)}
            className={cn(
              "p-2 rounded-xl transition-all flex items-center gap-2 border",
              showMemory ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            )}
          >
            <Brain className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">Memori Pelajar</span>
          </button>

          <button 
            onClick={() => window.open('https://t.me/CikguKimiaSPMBot', '_blank')}
            className="p-2 rounded-xl transition-all flex items-center gap-2 border bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100"
            title="Hubungi Cikgu di Telegram"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-black hidden sm:inline uppercase">Telegram</span>
          </button>

          <button 
            onClick={logout}
            className="p-2 rounded-xl transition-all flex items-center gap-2 border bg-white border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            title="Log keluar"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Equation Guide Overlay */}
      <AnimatePresence>
        {showGuide && <EquationGuide onClose={() => setShowGuide(false)} />}
        {showBalancer && <EquationBalancer onClose={() => setShowBalancer(false)} />}
      </AnimatePresence>

      {/* Memory Sidebar Overlay */}
      <AnimatePresence>
        {showMemory && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="absolute top-[73px] right-0 bottom-0 w-full sm:w-80 bg-white border-l border-slate-200 z-30 shadow-2xl p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-slate-900">Memori Cikgu</h3>
              <button 
                onClick={() => setShowMemory(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-6">Cikgu menyimpan maklumat penting untuk bantu awak jadi lebih bijak dalam Kimia.</p>

            <div className="space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 bg-brand-blue rounded-full shadow-[0_0_8px_#3b82f6]" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Syllabus Insights</h4>
                </div>
                <div className="space-y-2">
                  {[
                    "Kekerapan mention 'Effective Collision' adalah kunci markah penuh.",
                    "Sering tertukar warna KMnO4 (Ungu → Tdk Berwarna) dlm Redox.",
                    "Reaktiviti Kumpulan 1 MENINGKAT menuruni kumpulan."
                  ].map((insight, i) => (
                    <div key={i} className="p-3 bg-slate-900 text-[11px] font-medium text-slate-300 leading-relaxed rounded-2xl border border-slate-800 shadow-xl">
                      {insight}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Analisis Kertas Exam</h4>
                </div>
                {memory.examPapersAnalysis.length > 0 ? (
                  <div className="space-y-2">
                    {memory.examPapersAnalysis.map((item, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] italic text-slate-600 leading-relaxed shadow-sm">
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed italic">
                      Hantar gambar kertas exam anda untuk Cikgu analisis kelemahan.
                    </p>
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Topik Lemah Awak</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {memory.weakTopics.length > 0 ? (
                    memory.weakTopics.map((topic, i) => (
                      <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black border border-red-100 shadow-sm">
                        {topic}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold italic bg-slate-50 px-3 py-2 rounded-xl">Belum dikenal pasti</span>
                  )}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg transform rotate-3 transition-transform hover:rotate-0",
                msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-gradient-to-tr from-brand-navy to-brand-purple text-white"
              )}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />}
              </div>
              <div className={cn(
                "max-w-[85%] space-y-2",
                msg.role === "user" ? "flex flex-col items-end" : "flex flex-col items-start"
              )}>
                {/* Images and Files in message */}
                {msg.images && msg.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-1 justify-end">
                    {msg.images.map((img, i) => (
                      img.mimeType.startsWith("image/") ? (
                        <img 
                          key={i} 
                          src={`data:${img.mimeType};base64,${img.data}`} 
                          alt="Uploaded chemistry problem"
                          className="max-w-[240px] rounded-2xl shadow-2xl border-2 border-white"
                        />
                      ) : (
                        <div key={i} className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl shadow-md border border-slate-100 text-brand-navy">
                          <FlaskConical className="w-4 h-4 text-brand-blue" />
                          <span className="text-[10px] font-black uppercase tracking-tight">Dokumen Analisis</span>
                        </div>
                      )
                    ))}
                  </div>
                )}
                
                {/* Text content */}
                <div className={cn(
                  "rounded-[1.5rem] p-5 shadow-xl transition-all",
                  msg.role === "user" 
                    ? "bg-slate-900 text-white rounded-tr-none border border-slate-800" 
                    : "bg-white text-slate-700 border border-slate-100 rounded-tl-none w-full"
                )}>
                  <div className={cn(
                    "prose prose-sm max-w-none",
                    msg.role === "user" ? "prose-invert prose-p:text-slate-300 prose-headings:text-white prose-strong:text-cyan-400" : "prose-slate prose-headings:text-brand-navy prose-strong:text-slate-900 prose-code:text-brand-purple"
                  )}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          if (!inline && match && match[1] === "svg") {
                            return (
                              <div 
                                className="my-6 p-4 bg-white rounded-3xl border-2 border-slate-50 flex flex-col items-center shadow-inner overflow-hidden"
                              >
                                <div className="text-[10px] font-black text-blue-400 mb-4 tracking-[0.2em] uppercase">Rajah Visual</div>
                                <div 
                                  className="w-full flex justify-center"
                                  dangerouslySetInnerHTML={{ __html: String(children).replace(/\n$/, "") }}
                                />
                              </div>
                            );
                          }
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 w-32 shadow-sm rounded-tl-none">
              <div className="flex gap-1 justify-center">
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        {/* Image Preview Strip */}
        <AnimatePresence>
          {selectedImages.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex gap-2 mb-3 overflow-x-auto pb-2"
            >
              {selectedImages.map((img) => (
                <div key={img.id} className="relative group flex-shrink-0">
                  {img.mimeType.startsWith("image/") ? (
                    <img src={img.preview} alt="preview" className="w-20 h-20 object-cover rounded-lg border-2 border-blue-500" />
                  ) : (
                    <div className="w-20 h-20 flex flex-col items-center justify-center bg-slate-100 rounded-lg border-2 border-blue-500 p-2">
                       <FlaskConical className="w-6 h-6 text-blue-600 mb-1" />
                       <span className="text-[8px] font-black text-slate-500 uppercase truncate w-full text-center">{img.file.name}</span>
                    </div>
                  )}
                  <button 
                    onClick={() => removeImage(img.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*,application/pdf,text/plain" 
            multiple 
            className="hidden" 
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
            title="Lampirkan nota atau soalan peperiksaan (PDF/Imej/Teks)"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={selectedImages.length > 0 ? "Beritahu Cikgu pasal gambar ini..." : "Tanya soalan Kimia di sini..."}
            className="flex-grow p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all text-slate-700"
          />
          <button
            type="submit"
            disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
            className="p-4 bg-gradient-to-r from-brand-navy to-slate-800 text-white rounded-2xl hover:to-brand-purple disabled:opacity-50 transition-all shadow-xl active:scale-95 border border-slate-800"
          >
            <Send className="w-5 h-5 text-cyan-400" />
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-2">
          Hantar gambar kertas exam untuk bina memori belajar | SPM KSSM
        </p>
      </div>
    </div>
  );
}
