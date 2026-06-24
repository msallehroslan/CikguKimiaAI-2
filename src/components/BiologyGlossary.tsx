import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Heart, Send, BookOpen, HelpCircle } from "lucide-react";

interface GlossaryTerm {
  term: string;
  category: string;
  definition: string;
  functionInfo: string;
  kssmKeynote: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Biologi Sel
  {
    term: "Mitokondria (Mitochondria)",
    category: "Biologi Sel",
    definition: "Organel berbentuk rod berlipat ganda dalam sel haiwan dan tumbuhan.",
    functionInfo: "Mengjanakan tenaga sel dalam bentuk adenosina trifosfat (ATP) melalui proses respirasi sel.",
    kssmKeynote: "Sangat padat dalam sel penerima aktif tenaga tinggi seperti sel otot penerbang burung, sel sperma, sel otot kardium, dan sel meristem."
  },
  {
    term: "Jasad Golgi (Golgi Apparatus)",
    category: "Biologi Sel",
    definition: "Satu himpunan kantung rata bersalut membran yang disusun selari.",
    functionInfo: "Memodifikasi, membungkus, mengisih, dan mengangkut glycoprotein, lipids, dan enzim ke bahagian sel lain atau dirembes keluar.",
    kssmKeynote: "Bekerjasama rapat dengan Jalinan Endoplasma Kasar (JEK). Kaya dalam sel kelenjar rembesan (rembes enzim pencernaan, air liur, insulin)."
  },
  {
    term: "Kloroplas (Chloroplast)",
    category: "Biologi Sel",
    definition: "Organel dwimembran berbentuk cakera yang mengandungi pigmen hijau (klorofil).",
    functionInfo: "Menyerap cahaya matahari untuk menjalankan tindak balas fotosintesis mendatar mencerahkan glukosa.",
    kssmKeynote: "Mengandungi klorofil di dalam tilakoid (grana) untuk tindak balas bersandarkan cahaya, dan stroma untuk tindak balas tidak bersandarkan cahaya."
  },

  // Metabolisme & Enzim
  {
    term: "Enzim (Enzyme)",
    category: "Metabolisme & Enzim",
    definition: "Mangkin biologi organik yang dibina daripada protein.",
    functionInfo: "Mempercepatkan kadar tindak balas biokimia dalam sel dengan merendahkan tenaga pengaktifan (activation energy).",
    kssmKeynote: "Sifat kualitatif: Sangat spesifik (hipotesis mangga dan kunci), tidak musnah selepas tindak balas, dan sensitif terhadap suhu dan pH."
  },
  {
    term: "Denaturasi Enzim (Enzyme Denaturation)",
    category: "Metabolisme & Enzim",
    definition: "Kerosakan struktur tiga dimensi (3D) protein enzim.",
    functionInfo: "Apabila terdedah kepada suhu melebihi 40°C atau pH ekstrem, ikatan hidrogen dalam protein pecah, memusnahkan tapak aktif enzim.",
    kssmKeynote: "Menyebabkan tapak aktif berubah bentuk kekal, substrat tidak lagi boleh bergabung. Tindak balas terhenti sama sekali."
  },

  // Pembahagian Sel
  {
    term: "Mitosis",
    category: "Pembahagian Sel",
    definition: "Proses pembahagian nukleus sel soma menghasilkan dua sel anak.",
    functionInfo: "Menghasilkan sel anak yang mempunyai bilangan kromosom diploid (2n) dan maklumat genetik yang sama persis dengan sel induk.",
    kssmKeynote: "Penting untuk pertumbuhan fizikal, menggantikan sel-sel mati/rosak, dan pembiakan aseksual (contoh: belahan dedua bakteria)."
  },
  {
    term: "Meiosis",
    category: "Pembahagian Sel",
    definition: "Proses pembahagian sel khas di organ pembiakan menghasilkan gamet haploid (n).",
    functionInfo: "Mengurangkan bilangan kromosom kepada separuh (haploid) supaya bilangan dipulihkan kepada diploid semula selepas persenyawaan.",
    kssmKeynote: "Memperkenalkan variasi genetik melalui Proses Pindah Silang (crossing over) d profasa I, dan Penyusunan Bebas kromosom homolog di metafasa I."
  },

  // Fisiologi Manusia
  {
    term: "Hutang Oksigen (Oxygen Debt)",
    category: "Fisiologi Manusia",
    definition: "Keadaan di mana badan mengalami kekurangan bekalan oksigen berbanding keperluan sebenar semasa aktiviti cergas rutin.",
    functionInfo: "Yis/Otot menjalankan penapaian asid laktik tanpa oksigen. Glukosa separa diurai membentukkan asid laktik terkumpul.",
    kssmKeynote: "Asid laktik tinggi menyebabkan keletihan dan kejang otot. Pelajar perlu bernafas tercungap-cungap selepas larian untuk membekalkan oksigen ekstra bagi mengoksidakan asid laktik."
  },
  {
    term: "Asimilasi (Assimilation)",
    category: "Fisiologi Manusia",
    definition: "Proses menggunakan nutrien yang diserap untuk membina sebatian kompleks atau struktur sel baru.",
    functionInfo: "Hati mengawal asimilasi: Asid amino digunakan untuk sintesis protein plasma, manakala glukosa berlebihan ditukar kepada glikogen.",
    kssmKeynote: "Hepatic portal vein (Vena Portal Hepatik) membawa asid amino, glukosa, dan vitamin larut air terus dari vilum usus ke hati."
  },

  // Fisiologi Tumbuhan
  {
    term: "Transpirasi (Transpiration)",
    category: "Fisiologi Tumbuhan",
    definition: "Proses kehilangan air dalam bentuk wap air dari permukaan daun ke atmosfera secara sejatan.",
    functionInfo: "Menghasilkan daya tarikan transpirasi untuk menarik air dan garam mineral dari akar ke seluruh bahagian tumbuhan, serta sejukkan tumbuhan.",
    kssmKeynote: "Laju dipengaruhi oleh: Keamatan cahaya, kelembapan bandingan udara, suhu persekitaran, dan kelajuan angin."
  },
  {
    term: "Translokasi (Translocation)",
    category: "Fisiologi Tumbuhan",
    definition: "Pengangkutan bahan organik hasil fotosintesis (sukrosa) dari daun ke bahagian lain.",
    functionInfo: "Mengangkut gula daripada punca (daun) ke kawasan simpanan atau pertumbuhan (akar, buah, pucuk muda) melalui tiub tapis silindrik floem.",
    kssmKeynote: "Berbeza dengan xilem (sehala), pengangkutan bahan dalam salur floem adalah dua hala (bidirectional) mengikut kecerunan tumpuan."
  },
  {
    term: "Auksin (Auxin)",
    category: "Fisiologi Tumbuhan",
    definition: "Fitohormon utama yang disintesis di hujung pucuk dan hujung akar tumbuhan.",
    functionInfo: "Mengawal atur pemanjangan sel, pembahagian sel, pemulaan akar, dominan paksi melintang, dan gerak balas tropisme.",
    kssmKeynote: "Kesan Auksin bertentangan: Merangsang pemanjangan sel di pucuk tetapi menghalang/memperlahankan pemanjangan sel di akar (kepekatan tinggi)."
  }
];

interface Props {
  onClose: () => void;
  onAskTutor: (promptText: string) => void;
}

export function BiologyGlossary({ onClose, onAskTutor }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Semua");

  const categories = ["Semua", "Biologi Sel", "Metabolisme & Enzim", "Pembahagian Sel", "Fisiologi Manusia", "Fisiologi Tumbuhan"];

  const filtered = GLOSSARY_TERMS.filter(g => {
    const matchesSearch = g.term.toLowerCase().includes(search.toLowerCase()) || 
                          g.definition.toLowerCase().includes(search.toLowerCase()) ||
                          g.functionInfo.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "Semua" || g.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base leading-none">Glosari & Kamus Biologi SPM</h3>
              <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mt-1">Silibus KSSM Tingkatan 4 & 5</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-emerald-600/60" />
            <input
              type="text"
              placeholder="Cari kata kunci biologi... (cth: Mitokondria, ATP, Penapaian, Auksin)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          
          <div className="flex gap-1.5 overflow-x-auto pb-1 select-none no-scrollbar scroll-smooth">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeCategory === cat
                    ? "bg-emerald-900 text-white"
                    : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content list */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              Tiada istilah biologi dijumpai bagi carian "{search}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((g, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white border border-emerald-100 rounded-2xl p-5 hover:border-emerald-300 transition hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 bg-emerald-50 text-[9px] font-mono font-bold text-emerald-700 tracking-wider rounded uppercase">
                        {g.category}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-sm text-emerald-950 mb-2">{g.term}</h4>
                    
                    <div className="space-y-2 mb-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Definisi:</span>
                        <p className="text-xs text-slate-700 leading-relaxed">{g.definition}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Fungsi Utama:</span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{g.functionInfo}</p>
                      </div>
                    </div>

                    {/* Nota Fokus KSSM */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 mb-4 leading-relaxed">
                      <strong className="font-semibold block text-emerald-800">📌 Fokus Soalan SPM:</strong>
                      {g.kssmKeynote}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onAskTutor(`Cikgu, boleh huraikan secara terperinci konsep biologi **${g.term}**? Tolong sertakan kata kunci penting (skema pemarkahan) yang wajib saya tulis dlm Kertas 2 Struktur/Esei SPM.`);
                      onClose();
                    }}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <Send className="w-3.5 h-3.5" /> Tanya Cikgu Biologi tentang istilah ini
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
