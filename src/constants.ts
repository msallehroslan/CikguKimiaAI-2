/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Topic {
  id: string;
  title: string;
  form: 4 | 5;
  description: string;
  subtopics: string[];
}

export interface Subject {
  id: string;
  name: string;
  codename: string;
  tagline: string;
  logoShort: string;
  colorClass: string;
  topics: Topic[];
}

export const CHEMISTRY_TOPICS: Topic[] = [
  // Form 4
  {
    id: "f4-c2",
    title: "Jirim dan Struktur Atom",
    form: 4,
    description: "Memahami isotop, model atom, dan zarah subatom.",
    subtopics: ["Matter", "History of Atomic Models", "Structure of Atom", "Isotopes and their uses"],
  },
  {
    id: "f4-c3",
    title: "Konsep Mol, Formula dan Persamaan Kimia",
    form: 4,
    description: "Asas stoikiometri dan pengiraan kimia.",
    subtopics: ["Relative Atomic Mass", "Mole Concept", "Chemical Formulae", "Chemical Equations"],
  },
  {
    id: "f4-c4",
    title: "Jadual Berkala Unsur",
    form: 4,
    description: "Meneroka trend dan kumpulan unsur.",
    subtopics: ["Development of Periodic Table", "Group 18", "Group 1", "Group 17", "Elements in Period 3", "Transition Elements"],
  },
  {
    id: "f4-c5",
    title: "Ikatan Kimia",
    form: 4,
    description: "Bagaimana atom bergabung untuk membentuk bahan yang stabil.",
    subtopics: ["Ionic Bond", "Covalent Bond", "Hydrogen Bond", "Dative Bond", "Metallic Bond"],
  },
  {
    id: "f4-c6",
    title: "Asid, Bes dan Garam",
    form: 4,
    description: "Sifat larutan dan penyediaan garam.",
    subtopics: ["The Role of Water", "pH Value", "Neutralisation", "Preparation of Salts", "Qualitative Analysis"],
  },
  {
    id: "f4-c7",
    title: "Kadar Tindak Balas",
    form: 4,
    description: "Mengkaji kepantasan perubahan kimia berlaku.",
    subtopics: ["Factors Affecting Rate", "Collision Theory"],
  },
  // Form 5
  {
    id: "f5-c1",
    title: "Keseimbangan Redoks",
    form: 5,
    description: "Proses pengoksidaan dan penurunan serta sel.",
    subtopics: ["Oxidation and Reduction", "Standard Electrode Potential", "Voltaic Cell", "Electrolytic Cell", "Rusting"],
  },
  {
    id: "f5-c2",
    title: "Sebatian Karbon",
    form: 5,
    description: "Kimia organik: Alkana, Alkena, Alkohol dan banyak lagi.",
    subtopics: ["Saturated and Unsaturated Hydrocarbons", "Homologous Series", "Chemical Properties", "Esters"],
  },
  {
    id: "f5-c3",
    title: "Termokimia",
    form: 5,
    description: "Perubahan tenaga dalam tindak balas kimia.",
    subtopics: ["Heat of Precipitation", "Heat of Displacement", "Heat of Neutralisation", "Heat of Combustion"],
  },
  {
    id: "f5-c4",
    title: "Polimer",
    form: 5,
    description: "Makromolekul semula jadi dan sintetik.",
    subtopics: ["Polymerisation", "Natural Rubber", "Synthetic Rubber"],
  },
  {
    id: "f5-c5",
    title: "Kimia Pengguna dan Industri",
    form: 5,
    description: "Aplikasi kimia dalam kehidupan sebenar.",
    subtopics: ["Oils and Fats", "Cleaning Agents", "Food Additives", "Medicines", "Nanotechnology", "Green Technology"],
  },
];

export const PHYSICS_TOPICS: Topic[] = [
  // Form 4
  {
    id: "f4-p1",
    title: "Pengukuran",
    form: 4,
    description: "Memahami unit asas, kuantiti fizik, ralat, dan kaedah pengukuran jitu.",
    subtopics: ["Kuantiti Fizik", "Penyiasatan Saintifik", "Analisis Ralat Pengukuran"],
  },
  {
    id: "f4-p2",
    title: "Daya dan Gerakan I",
    form: 4,
    description: "Menganalisis gerakan linear, inersia, momentum, gerakan jatuh bebas, dan daya.",
    subtopics: ["Gerakan Linear", "Graf Gerakan Linear", "Inersia", "Momentum", "Kesan Daya"],
  },
  {
    id: "f4-p3",
    title: "Kegravitian",
    form: 4,
    description: "Hukum Kegravitian Semesta Newton, Hukum Kepler, dan satelit buatan.",
    subtopics: ["Hukum Kegravitian Semesta Newton", "Hukum Kepler", "Satelit Buatan Manusia"],
  },
  {
    id: "f4-p4",
    title: "Haba",
    form: 4,
    description: "Mengkaji keseimbangan termal, muatan haba tentu, haba pendam tentu, dan hukum-hukum gas.",
    subtopics: ["Keseimbangan Termal", "Muatan Haba Tentu", "Haba Pendam Tentu", "Hukum Gas (Boyle, Charles, Gay-Lussac)"],
  },
  {
    id: "f4-p5",
    title: "Gelombang",
    form: 4,
    description: "Meneroka ciri-ciri gelombang, pantulan, pembiasan, pembelauan, interferens, dan elektromagnet.",
    subtopics: ["Ciri Gelombang", "Pantulan Gelombang", "Pembiasan Gelombang", "Pembelauan Gelombang", "Interferens Gelombang", "Gelombang Elektromagnet"],
  },
  {
    id: "f4-p6",
    title: "Cahaya dan Optik",
    form: 4,
    description: "Mengkaji pantulan dalam penuh, pembiasan cahaya, kanta nipis, dan peralatan optik.",
    subtopics: ["Pembiasan Cahaya", "Pantulan Dalam Penuh", "Kanta Nipis", "Peralatan Optik"],
  },
  // Form 5
  {
    id: "f5-p1",
    title: "Daya dan Gerakan II",
    form: 5,
    description: "Memahami leraian daya, paduan daya, keseimbangan daya, dan kekenyalan.",
    subtopics: ["Daya Paduan", "Leraian Daya", "Keseimbangan Daya", "Kekenyalan (Hukum Hooke)"],
  },
  {
    id: "f5-p2",
    title: "Tekanan",
    form: 5,
    description: "Tekanan cecair, tekanan atmosfera, prinsip Pascal, Archimedes, dan Bernoulli.",
    subtopics: ["Tekanan Cecair", "Tekanan Atmosfera", "Prinsip Pascal", "Prinsip Archimedes", "Prinsip Bernoulli"],
  },
  {
    id: "f5-p3",
    title: "Elektrik",
    form: 5,
    description: "Mengkaji arus, beza keupayaan, rintangan, daya gerak elektrik (d.g.e.), rintangan dalam, dan tenaga elektrik.",
    subtopics: ["Arus dan Beza Keupayaan", "Rintangan", "Daya Gerak Elektrik (d.g.e.) dan Rintangan Dalam", "Tenaga dan Kuasa Elektrik"],
  },
  {
    id: "f5-p4",
    title: "Keelektromagnetan",
    form: 5,
    description: "Kesan magnet arus elektrik, aruhan elektromagnet, dan transformer.",
    subtopics: ["Medan Magnet Elektromagnet", "Daya ke atas Konduktor Pembawa Arus", "Aruhan Elektromagnet", "Transformer Semesta"],
  },
  {
    id: "f5-p5",
    title: "Elektronik",
    form: 5,
    description: "Pancaran termionik, diod semikonduktor, dan transistor.",
    subtopics: ["Sinar Katod dan Pancaran Termionik", "Diod Semikonduktor", "Transistor sebagai Suis & Penguat"],
  },
  {
    id: "f5-p6",
    title: "Fizik Nuklear",
    form: 5,
    description: "Pereputan radioaktif, separuh hayat, tenaga nuklear, pembelahan, dan pelakuran nuklear.",
    subtopics: ["Pereputan Radioaktif", "Tenaga Nuklear (E = mc²)", "Pembelahan dan Pelakuran Nuklear"],
  },
  {
    id: "f5-p7",
    title: "Fizik Kuantum",
    form: 5,
    description: "Teori kuantum cahaya, kesan fotoelektrik, dan teori Einstein.",
    subtopics: ["Teori Kuantum Cahaya", "Kesan Fotoelektrik", "Teori Einstein Kesan Fotoelektrik"],
  },
];

export const BIOLOGY_TOPICS: Topic[] = [
  // Form 4
  {
    id: "f4-b2",
    title: "Biologi Sel dan Organisasi Sel",
    form: 4,
    description: "Struktur sel haiwan dan tumbuhan, fungsi organel, dan proses hidup organisma unisel.",
    subtopics: ["Struktur dan Fungsi Sel", "Proses Hidup Organisma Unisel", "Organisasi Sel dalam Manusia"],
  },
  {
    id: "f4-b3",
    title: "Komposisi Kimia dalam Sel",
    form: 4,
    description: "Mengkaji air, karbohidrat, protein, lipid, dan asid nukleik dalam sel.",
    subtopics: ["Kepentingan Air", "Karbohidrat", "Protein", "Lipid", "Asid Nukleik"],
  },
  {
    id: "f4-b4",
    title: "Metabolisme dan Enzim",
    form: 4,
    description: "Memahami metabolisme, penamaan enzim, mekanisme tindakan enzim, dan aplikasi industri.",
    subtopics: ["Metabolisme", "Sifat Am Enzim", "Mekanisme Tindakan Enzim (Mangga & Kunci)", "Faktor Mempengaruhi Tindakan Enzim"],
  },
  {
    id: "f4-b5",
    title: "Pembahagian Sel",
    form: 4,
    description: "Kitar sel, proses mitosis, meiosis, dan kesan keabnormalan pada pembahagian sel.",
    subtopics: ["Kitar Sel dan Mitosis", "Meiosis", "Isu Kesihatan Pembahagian Sel"],
  },
  {
    id: "f4-b6",
    title: "Nutrisi dan Sistem Pencernaan Manusia",
    form: 4,
    description: "Struktur sistem pencernaan, pencernaan makanan, penyerapan, asimilasi, dan penyahtinjaan.",
    subtopics: ["Struktur Sistem Pencernaan", "Pencernaan Makanan", "Penyerapan dan Asimilasi Nutrien", "Gaya Hidup Sihat"],
  },
  {
    id: "f4-b7",
    title: "Respirasi Sel",
    form: 4,
    description: "Penghasilan tenaga melalui respirasi aerob, penapaian, dan hutang oksigen.",
    subtopics: ["Respirasi Aerob", "Penapaian Alkohol dan Asid Laktik", "Glikolisis"],
  },
  // Form 5
  {
    id: "f5-b1",
    title: "Organisasi Tisu Tumbuhan dan Pertumbuhan",
    form: 5,
    description: "Tisu meristem, tisu kekal, zon pertumbuhan, dan jenis tumbuhan berdasarkan jangka hayat.",
    subtopics: ["Tisu Tumbuhan", "Zon Pertumbuhan Epikal", "Pertumbuhan Primer dan Sekunder", "Tumbuhan Tahunan & Dwi-tahunan"],
  },
  {
    id: "f5-b2",
    title: "Struktur dan Fungsi Daun",
    form: 5,
    description: "Morfologi daun, pertukaran gas, pembukaan stoma, transpirasi, dan fotosintesis.",
    subtopics: ["Struktur Daun", "Pertukaran Gas dan Mekanisme Stoma", "Transpirasi", "Fotosintesis (Tindak Balas Cahaya & Gelap)"],
  },
  {
    id: "f5-b3",
    title: "Nutrisi dalam Tumbuhan",
    form: 5,
    description: "Makronutrien dan mikronutrien tumbuhan, serta kesan kekurangan unsur.",
    subtopics: ["Makronutrien & Mikronutrien Tumbuhan", "Kesan Kekurangan Unsur Penting", "Nutrisi Organik dan Tak Organik"],
  },
  {
    id: "f5-b4",
    title: "Pengangkutan dalam Tumbuhan",
    form: 5,
    description: "Pengangkutan air dan garam mineral melalui xilem, dan sebatian organik melalui floem.",
    subtopics: ["Laluan Air dari Tanah ke Daun", "Translokasi dalam Floem", "Fitoremediasi menggunakan Tumbuhan"],
  },
  {
    id: "f5-b5",
    title: "Gerak Balas dalam Tumbuhan",
    form: 5,
    description: "Bagaimana tumbuhan bertindak balas terhadap rangsangan menggunakan fitohormon (auksin, giberelin, etilena).",
    subtopics: ["Jenis Gerak Balas (Tropisme & Nastik)", "Fitohormon", "Aplikasi Hormon dalam Pertanian"],
  },
  {
    id: "f5-b8",
    title: "Biodiversiti",
    form: 5,
    description: "Sistem pengelasan organisma, mikroorganisma, virus, dan pemuliharaan biodiversiti.",
    subtopics: ["Pengelasan Organisma (Tiga Domain)", "Mikroorganisma dan Virus", "Pemuliharaan In Situ dan Ex Situ"],
  },
  {
    id: "f5-b9",
    title: "Ekosistem",
    form: 5,
    description: "Komponen biosis dan abiosis, aliran tenaga, rantai makanan, piramid ekologi, dan kolonisasi.",
    subtopics: ["Komponen Ekosistem", "Aliran Tenaga dalam Rantai Makanan", "Kolonisasi dan Sesaran dalam Paya Bakau"],
  },
];

export const SUBJECTS: Subject[] = [
  {
    id: "chemistry",
    name: "Cikgu Kimia",
    codename: "Kimia",
    tagline: "Kombinasi teori dan persamaan kimia yang tenang, berpandukan skema SPM.",
    logoShort: "CK",
    colorClass: "from-brand-navy to-brand-accent",
    topics: CHEMISTRY_TOPICS,
  },
  {
    id: "physics",
    name: "Cikgu Fizik",
    codename: "Fizik",
    tagline: "Formulas, daya, gerakan, dan hukum fizik dikuasai dengan eksperimentasi visual.",
    logoShort: "CF",
    colorClass: "from-sky-900 to-sky-500",
    topics: PHYSICS_TOPICS,
  },
  {
    id: "biology",
    name: "Cikgu Biologi",
    codename: "Biologi",
    tagline: "Sel hidup, ekosistem tumbuhan, dan pemahaman anatomi KSSM mendalam.",
    logoShort: "CB",
    colorClass: "from-emerald-950 to-emerald-600",
    topics: BIOLOGY_TOPICS,
  },
];

// Compatibility exports
export const SYLLABUS_TOPICS: Topic[] = CHEMISTRY_TOPICS;
export const ALL_TOPICS: Topic[] = [
  ...CHEMISTRY_TOPICS,
  ...PHYSICS_TOPICS,
  ...BIOLOGY_TOPICS,
];
