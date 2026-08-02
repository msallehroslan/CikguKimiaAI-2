import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, BookOpen, Send, HelpCircle } from "lucide-react";

interface Formula {
  latex: string;
  name: string;
  description: string;
  variables: { symbol: string; meaning: string; unit: string }[];
  category: string;
  kbatTip: string;
}

const FORMULAS: Formula[] = [
  // Daya & Gerakan
  {
    latex: "v = u + at",
    name: "Halaju Akhir Gerakan Linear",
    description: "Menghitung halaju akhir objek dengan pecutan seragam.",
    variables: [
      { symbol: "v", meaning: "Halaju akhir", unit: "m s⁻¹" },
      { symbol: "u", meaning: "Halaju awal", unit: "m s⁻¹" },
      { symbol: "a", meaning: "Pecutan", unit: "m s⁻²" },
      { symbol: "t", meaning: "Masa", unit: "s" }
    ],
    category: "Daya & Gerakan",
    kbatTip: "Semak tanda pecutan (a). Jika objek membrek atau memperlahankan gerakan, pecutan bertanda negatif (nyahpecutan)."
  },
  {
    latex: "s = ut + \\frac{1}{2}at^2",
    name: "Sesaran Linear",
    description: "Menghitung sesaran objek bergerak dengan pecutan seragam.",
    variables: [
      { symbol: "s", meaning: "Sesaran", unit: "m" },
      { symbol: "u", meaning: "Halaju awal", unit: "m s⁻¹" },
      { symbol: "a", meaning: "Pecutan", unit: "m s⁻²" },
      { symbol: "t", meaning: "Masa", unit: "s" }
    ],
    category: "Daya & Gerakan",
    kbatTip: "Gunakan formula ini apabila nilai halaju akhir (v) tidak diberikan dalam soalan."
  },
  {
    latex: "F = ma",
    name: "Hukum Gerakan Kedua Newton",
    description: "Menyatakan perkaitan antara daya bersih, jisim dan pecutan.",
    variables: [
      { symbol: "F", meaning: "Dya Bersih (Hasil Tambah Daya-Daya)", unit: "N (atau kg m s⁻²)" },
      { symbol: "m", meaning: "Jisim objek", unit: "kg" },
      { symbol: "a", meaning: "Pecutan", unit: "m s⁻²" }
    ],
    category: "Daya & Gerakan",
    kbatTip: "Bagi lift bergerak bebas, daya bersih F = R - mg (jika memecut ke atas) atau F = mg - R (jika memecut ke bawah)."
  },
  {
    latex: "p = mv",
    name: "Momentum",
    description: "Kuantiti gerakan objek berdasarkan jisim dan halaju.",
    variables: [
      { symbol: "p", meaning: "Momentum", unit: "kg m s⁻¹" },
      { symbol: "m", meaning: "Jisim", unit: "kg" },
      { symbol: "v", meaning: "Halaju", unit: "m s⁻¹" }
    ],
    category: "Daya & Gerakan",
    kbatTip: "Ingat arah momentum! Kerana halaju adalah vektor, jika objek melantun balik, halaju akhir bertanda negatif."
  },

  // Haba
  {
    latex: "Q = mc\\Delta\\theta",
    name: "Haba yang diserap / dibebaskan",
    description: "Menghitung perubahan haba tanpa melibatkan bahan bertukar fasa.",
    variables: [
      { symbol: "Q", meaning: "Tenaga haba", unit: "J" },
      { symbol: "m", meaning: "Jisim bahan", unit: "kg" },
      { symbol: "c", meaning: "Muatan haba tentu", unit: "J kg⁻¹ °C⁻¹" },
      { symbol: "Δθ", meaning: "Perubahan suhu (hujung - awal)", unit: "°C atau K" }
    ],
    category: "Haba",
    kbatTip: "Sering digabungkan dengan pemanas elektrik: E = Pt, maka Pt = mcΔθ untuk mencari kuasa pemanas."
  },
  {
    latex: "Q = mL",
    name: "Haba Pendam Tentu",
    description: "Haba yang diserap atau dibebaskan semasa perubahan fasa pada suhu malar.",
    variables: [
      { symbol: "Q", meaning: "Tenaga haba", unit: "J" },
      { symbol: "m", meaning: "Jisim bahan", unit: "kg" },
      { symbol: "L", meaning: "Haba pendam tentu (Pelakuran / Penguapan)", unit: "J kg⁻¹" }
    ],
    category: "Haba",
    kbatTip: "Suhu kekal malar semasa pertukaran fasa (cth: takat lebur atau takat didih) kerana tenaga haba digunakan untuk memutuskan ikatan antara zarah."
  },

  // Gelombang & Cahaya
  {
    latex: "v = f\\lambda",
    name: "Persamaan Gelombang Semesta",
    description: "Menghubungkaitkan laju gelombang dengan frekuensi dan panjang gelombang.",
    variables: [
      { symbol: "v", meaning: "Laju gelombang", unit: "m s⁻¹" },
      { symbol: "f", meaning: "Frekuensi gelombang", unit: "Hz (s⁻¹)" },
      { symbol: "λ", meaning: "Panjang gelombang (Lambda)", unit: "m" }
    ],
    category: "Gelombang & Cahaya",
    kbatTip: "Suhu atau kedalaman air mempengaruhi kelajuan v. Air dalam mempunyai kelajuan v tinggi dan panjang gelombang λ besar."
  },
  {
    latex: "n = \\frac{\\sin i}{\\sin r} = \\frac{c}{v}",
    name: "Indeks Pembiasan Cahaya",
    description: "Mengukur nisbah kelajuan cahaya di vakum berbanding bahan atau nisbah sudut sin.",
    variables: [
      { symbol: "n", meaning: "Indeks pembiasan", unit: "Tiada unit" },
      { symbol: "i", meaning: "Sudut tuju di medium kurang tumpat", unit: "darjah (°)" },
      { symbol: "r", meaning: "Sudut biashan di medium lebih tumpat", unit: "darjah (°)" },
      { symbol: "c", meaning: "Kelajuan cahaya dalam vakum (3.0 × 10⁸)", unit: "m s⁻¹" },
      { symbol: "v", meaning: "Kelajuan cahaya dalam medium", unit: "m s⁻¹" }
    ],
    category: "Gelombang & Cahaya",
    kbatTip: "Semakin tinggi indeks pembiasan n, semakin tinggi ketumpatan optik bahannya dan kelajuan cahaya di dalamnya menjadi lambat."
  },
  {
    latex: "n = \\frac{1}{\\sin c}",
    name: "Sudut Genting dan Pantulan Dalam Penuh",
    description: "Hubungan indeks pembiasan dengan sudut genting (paling tumpat ke kurang tumpat).",
    variables: [
      { symbol: "n", meaning: "Indeks pembiasan", unit: "Tiada unit" },
      { symbol: "c", meaning: "Sudut genting (Critical Angle)", unit: "darjah (°)" }
    ],
    category: "Gelombang & Cahaya",
    kbatTip: "Syarat pantulan dalam penuh berlaku: 1) Cahaya merambat dari tinggi ketumpatan ke rendah ketumpatan; 2) Sudut tuju i > sudut genting c."
  },
  {
    latex: "\\frac{1}{f} = \\frac{1}{u} + \\frac{1}{v}",
    name: "Rumus Kanta Nipis",
    description: "Menghitung jarak objek, jarak imej dan panjang fokus kanta atau cermin melengkung.",
    variables: [
      { symbol: "f", meaning: "Panjang fokus (Positif = Cembung, Negatif = Cekung)", unit: "cm / m" },
      { symbol: "u", meaning: "Jarak objek dari pusat kanta", unit: "cm / m" },
      { symbol: "v", meaning: "Jarak imej (Positif = Nyata, Negatif = Maya)", unit: "cm / m" }
    ],
    category: "Gelombang & Cahaya",
    kbatTip: "Bagi kanta cembung (penumpu), f bernilai positif (+). Bagi kanta cekung (pencapah), f sentiasa bernilai negatif (-)."
  },

  // Tekanan
  {
    latex: "P = \\frac{F}{A}",
    name: "Tekanan Pepejal",
    description: "Kadar daya bersih bertindak serenjang ke atas luas permukaan.",
    variables: [
      { symbol: "P", meaning: "Tekanan", unit: "Pa (atau N m⁻²)" },
      { symbol: "F", meaning: "Daya", unit: "N" },
      { symbol: "A", meaning: "Luas permukaan sentuh", unit: "m²" }
    ],
    category: "Tekanan",
    kbatTip: "Untuk tekanan maksimum, kecilkan luas permukaan sentuh (contoh: tapak kasut pepaku, mata pisau tumpat)."
  },
  {
    latex: "P = h\\rho g",
    name: "Tekanan Cecair",
    description: "Tekanan pada kedalaman tertentu di dalam bendalir diam.",
    variables: [
      { symbol: "P", meaning: "Tekanan cecair", unit: "Pa" },
      { symbol: "h", meaning: "Kedalaman dari permukaan cecair", unit: "m" },
      { symbol: "ρ", meaning: "Ketumpatan cecair (Density - Rho)", unit: "kg m⁻³" },
      { symbol: "g", meaning: "Pecutan graviti (~9.81 m s⁻²)", unit: "m s⁻²" }
    ],
    category: "Tekanan",
    kbatTip: "Ingat! Tekanan SEBENAR pada kedalaman ialah Tekanan Cecair + Tekanan Atmosfera (P_total = hρg + P_atm)."
  },

  // Elektrik & Medan Magnet
  {
    latex: "V = IR",
    name: "Hukum Ohm",
    description: "Hubungan voltan, arus dan rintangan bagi konduktor ohm.",
    variables: [
      { symbol: "V", meaning: "Beza keupayaan (Voltan)", unit: "V" },
      { symbol: "I", meaning: "Arus elektrik", unit: "A" },
      { symbol: "R", meaning: "Rintangan elektrik", unit: "Ω (Ohm)" }
    ],
    category: "Elektrik & Magnet",
    kbatTip: "Hubungkait rintangan R dengan panjang konduktor (L), luas keratan rentas (A), jenis bahan dan suhu."
  },
  {
    latex: "\\mathcal{E} = I(R + r)",
    name: "Daya Gerak Elektrik (d.g.e.) & Rintangan Dalam",
    description: "Mengira susutan voltan dalam sel kering akibat fungsi rintangan dalam r.",
    variables: [
      { symbol: "E", meaning: "Daya gerak elektrik (d.g.e.) sel", unit: "V" },
      { symbol: "I", meaning: "Arus mengalir dalam litar", unit: "A" },
      { symbol: "R", meaning: "Rintangan luar", unit: "Ω" },
      { symbol: "r", meaning: "Rintangan dalam sel", unit: "Ω" }
    ],
    category: "Elektrik & Magnet",
    kbatTip: "Apabila suis litar dimatikan (tiada arus I = 0), bacaan voltmeter bersamaan d.g.e. Apabila suis dihidupkan, bacaan voltmeter susut sedikit kerana Ir."
  },
  {
    latex: "\\frac{V_p}{V_s} = \\frac{N_p}{N_s}",
    name: "Persamaan Transformer",
    description: "Menghitung beza keupayaan berdasarkan nisbah lilitan gegelung primer dan sekunder.",
    variables: [
      { symbol: "Vp", meaning: "Voltan input (Primer)", unit: "V" },
      { symbol: "Vs", meaning: "Voltan output (Sekunder)", unit: "V" },
      { symbol: "Np", meaning: "Bilangan lilitan gegelung primer", unit: "Tiada unit" },
      { symbol: "Ns", meaning: "Bilangan lilitan gegelung sekunder", unit: "Tiada unit" }
    ],
    category: "Elektrik & Magnet",
    kbatTip: "Transformer Injap Naik (Step Up): N_s > N_p untuk menaikkan voltan. Untuk bekalan kuasa Grid Nasional."
  },

  // Kuantum & Nuklear
  {
    latex: "E = mc^2",
    name: "Kesetaraan Jisim-Tenaga Einstein",
    description: "Kehilangan jisim semasa reputan radioaktif ditukarkan ke bentuk tenaga haba.",
    variables: [
      { symbol: "E", meaning: "Tenaga nuklear dibebaskan", unit: "J" },
      { symbol: "m", meaning: "Cacatan jisim (Mass defect)", unit: "kg" },
      { symbol: "c", meaning: "Laju cahaya dalam vakum (3.00 × 10⁸)", unit: "m s⁻¹" }
    ],
    category: "Nuklear & Kuantum",
    kbatTip: "Berhati-hati menukarkan unit beza jisim daripada amu (u) kepada kilogram (kg) sebelum mendarab dengan c² (1 u = 1.66 × 10⁻²⁷ kg)."
  },
  {
    latex: "E = hf",
    name: "Teori Kuantum Tenaga Einstein-Planck",
    description: "Tenaga satu kuantum cahaya (foton) adalah berkadar terus dengan frekuensinya.",
    variables: [
      { symbol: "E", meaning: "Tenaga foton", unit: "J" },
      { symbol: "h", meaning: "Pemalar Planck (6.63 × 10⁻³⁴)", unit: "J s" },
      { symbol: "f", meaning: "Frekuensi cahaya", unit: "Hz" }
    ],
    category: "Nuklear & Kuantum",
    kbatTip: "Selalunya digabungkan dengan fungsi kerja logam (W = hf_0) untuk mencari tenaga kinetik maksimum elektron terpancar: K_max = hf - W."
  }
];

interface Props {
  onClose: () => void;
  onAskTutor: (promptText: string) => void;
}

export function PhysicsFormulas({ onClose, onAskTutor }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Semua");

  const categories = ["Semua", "Daya & Gerakan", "Haba", "Gelombang & Cahaya", "Tekanan", "Elektrik & Magnet", "Nuklear & Kuantum"];

  const filtered = FORMULAS.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || 
                          f.latex.toLowerCase().includes(search.toLowerCase()) ||
                          f.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "Semua" || f.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base leading-none">Hub Formula & Rumus Fizik SPM</h3>
              <p className="text-[10px] font-mono text-sky-400 uppercase tracking-wider mt-1">Silibus KSSM Tingkatan 4 & 5</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bars / Search */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama rumus, simbol, atau konsep... (cth: m s-1, Hooke, Planck)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          
          <div className="flex gap-1.5 overflow-x-auto pb-1 select-none no-scrollbar scroll-smooth">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Formula list */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              Tiada rumus dijumpai bagi carian "{search}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-sky-300 transition hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Top line info */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 bg-sky-50 text-[9px] font-mono font-bold text-sky-700 tracking-wider rounded uppercase">
                        {f.category}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-sm text-slate-950 mb-1">{f.name}</h4>
                    <p className="text-xs text-slate-500 mb-4">{f.description}</p>

                    {/* Math Block */}
                    <div className="flex items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-xl mb-4 font-mono text-base font-bold text-slate-800">
                      {f.latex}
                    </div>

                    {/* Variable Definitions */}
                    <div className="space-y-1.5 mb-4">
                      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Glosari Simbol:</div>
                      {f.variables.map((v, idx) => (
                        <div key={idx} className="flex text-xs">
                          <span className="font-mono font-bold text-sky-600 w-8">{v.symbol}</span>
                          <span className="text-slate-700 min-w-[100px] flex-1">{v.meaning}</span>
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded ml-2">{v.unit}</span>
                        </div>
                      ))}
                    </div>

                    {/* KBAT Tip */}
                    <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-xs text-amber-800 mb-4 leading-relaxed">
                      <strong className="font-semibold block">⚠️ Tips KBAT SPM:</strong>
                      {f.kbatTip}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onAskTutor(`Cikgu, boleh terangkan penggunaan rumus ${f.name} (${f.latex}) dalam soalan KSSM SPM? Kongsikan satu contoh pengiraan penuh berserta strategi pemarkahan markah.`);
                      onClose();
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-sky-500 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <Send className="w-3.5 h-3.5" /> Tanya Cikgu Fizik tentang rumus ini
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
