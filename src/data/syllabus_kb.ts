/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SyllabusFact {
  topicId: string;
  title: string;
  context: string;
  keyPoints: string[];
}

export const SYLLABUS_KNOWLEDGE_BASE: SyllabusFact[] = [
  // FORM 4
  {
    topicId: "f4-c2",
    title: "Jirim dan Struktur Atom",
    context: "Mengkaji tentang keadaan jirim, teori kinetik, dan sejarah pembangunan model atom.",
    keyPoints: [
      "Zarah-zarah seni dan diskrit (Atom, Molekul, Ion).",
      "Keadaan Jirim: Pepejal (getaran), Cecair (gelongsor), Gas (rawak).",
      "Takat Lebur/Beku: Suhu tetap semasa pertukaran fasa (haba pendam).",
      "Subatom: Proton (+1), Neutron (0), Elektron (-1).",
      "Nombor Nukleon = Bilangan Proton + Bilangan Neutron.",
      "Isotop: Unsur sama, bilangan proton sama, bilangan neutron berbeza (Contoh: Kobalt-60 utk radioterapi)."
    ]
  },
  {
    topicId: "f4-c3",
    title: "Konsep Mol, Formula dan Persamaan Kimia",
    context: "Asas pengiraan kimia melibatkan jisim, mol, dan isi padu gas.",
    keyPoints: [
      "Pemalar Avogadro: 6.02 x 10^23 zarah per mol.",
      "Jisim Molar: Jisim satu mol bahan (sama dengan JAR/JMR).",
      "Isi padu Molar: 22.4 dm3 (STP) atau 24 dm3 (Keadaan bilik).",
      "Formula Empirik: Nisbah teringkas bilangan atom.",
      "Formula Molekul: Bilangan sebenar atom.",
      "Persamaan Kimia: Mesti seimbang (Hukum Keabadian Jisim)."
    ]
  },
  {
    topicId: "f4-c6",
    title: "Asid, Bes dan Garam",
    context: "Memahami sifat keasidan, alkali, pH, dan teknik penyediaan pelbagai jenis garam.",
    keyPoints: [
      "Asid: Mengion dlm air hasilkan H+. Kuat (mengion lengkap) vs Lemah (mengion separa).",
      "Alkali: Mengion dlm air hasilkan OH-.",
      "Skala pH: 0-6 (asid), 7 (neutral), 8-14 (alkali).",
      "Peneutralan: Asid + Alkali -> Garam + Air.",
      "Garam Larut: Semua NO3-, semua K+/Na+/NH4+, Cl- (kecuali Ag/Hg/Pb), SO4 (kecuali Ba/Ca/Pb).",
      "Ujian Kenalpasti Kation: NaOH & NH3 akues.",
      "Ujian Anion: Klorida (AgNO3), Sulfat (BaCl2), Nitrat (Cincin Perang)."
    ]
  },
  // FORM 5
  {
    topicId: "f5-c1",
    title: "Keseimbangan Redoks",
    context: "Proses pemindahan elektron, nombor pengoksidaan, dan aplikasinya dalam sel elektrokimia.",
    keyPoints: [
      "Pengoksidaan: Derma elektron, tambah nombor pengoksidaan, tambah oksigen.",
      "Penurunan: Terima elektron, kurang nombor pengoksidaan, hilang oksigen.",
      "Agen Pengoksidaan: KMnO4 berasid, K2Cr2O7 berasid, halida.",
      "Sel Kimia: Tenaga kimia -> Tenaga elektrik. Logam elektropositif jadi Anod (-).",
      "Sel Elektrolisis: Tenaga elektrik -> Tenaga kimia. Anod (+) menarik anion.",
      "Siri Elektrokimia: Kedudukan menentukan kekuatan agen penurunan.",
      "Pengaratan Besi: Melibatkan oksigen dan air (Sel kimia ringkas)."
    ]
  },
  {
    topicId: "f5-c2",
    title: "Sebatian Karbon",
    context: "Senyawa organik seperti hidrokarbon, alkohol, asid karboksilik, dan ester.",
    keyPoints: [
      "Hidrokarbon Tepu (Alkana): Ikatan C-C tunggal. Penukargantian (UV).",
      "Hidrokarbon Tak Tepu (Alkena): Ikatan ganda dua C=C. Tindak balas penambahan.",
      "Siri Homolog: Formula am sama, sifat kimia sama, beza CH2.",
      "Alkohol (-OH): Dihasilkan melalui penapaian. Pengoksidaan hasilkan asid karboksilik.",
      "Ester: Dihasilkan drpd Asid Karboksilik + Alkohol (H2SO4 pekat sbg mangkin). Bau wangi."
    ]
  },
  {
    topicId: "f5-c3",
    title: "Termokimia",
    context: "Haba tindak balas dan perubahan tenaga dalam sistem kimia.",
    keyPoints: [
      "Eksotermik: Haba dibebaskan (Delta H negatif). Suhu persekitaran naik.",
      "Endotermik: Haba diserap (Delta H positif). Suhu persekitaran turun.",
      "Haba Peneutralan: Haba terbebas bagi pembentukan 1 mol air.",
      "Haba Pembakaran: Haba terbebas apbl 1 mol bahan terbakar lengkap.",
      "Gambar Rajah Aras Tenaga: Membandingkan aras tenaga bahan vs hasil tindak balas."
    ]
  },
  // PHYSICS (KSSM SPM)
  {
    topicId: "f4-p2",
    title: "Daya dan Gerakan I",
    context: "Mengkaji tentang gerakan linear, inersia, momentum, dan daya jatuh bebas.",
    keyPoints: [
      "Persamaan Gerakan Linear: $v = u + at$, $s = \\frac{1}{2}(u+v)t$, $s = ut + \\frac{1}{2}at^2$, $v^2 = u^2 + 2as$.",
      "Inersia: Sifat objek mengekalkan keadaan asal dlm pegun atau gerakan. Berkadar terus dengan Jisim ($m$).",
      "Momentum: Hasil darab Jisim dan Halaju ($p = mv$). Hukum Keabadian Momentum menyatakan jumlah momentum sebelum tindak balas sama dengan jumlah momentum selepas tindak balas jika tiada daya luar bertindak.",
      "Daya Graviti & Jatuh Bebas: Objek mengalami pecutan graviti sbg gerakan bebas di bawah tindakan daya tarikan graviti shj tanpa pengaruh rintangan udara sbg vakum ($g \\approx 9.81\\text{ m/s}^2$).",
      "Hukum Gerakan Newton Kedua: Kadar perubahan momentum berkadar terus dgn daya bertindak sbg $F = ma$."
    ]
  },
  {
    topicId: "f4-p4",
    title: "Haba",
    context: "Keseimbangan termal, muatan haba tentu, haba pendam tentu, dan hukum gas.",
    keyPoints: [
      "Keseimbangan Termal: Dua objek mempunyai suhu sama apabila kadar pemindahan haba bersih antara mereka adalah sifar.",
      "Muatan Haba Tentu ($c$): Amaun haba diperlukan untuk menaikkan suhu 1 kg bahan sebanyak $1^\\circ\\text{C}$ ($Q = mc\\Delta\\theta$). Air mempunyai muatan haba tentu yang sangat tinggi ($4200\\text{ J kg}^{-1}{^\\circ}\\text{C}^{-1}$).",
      "Haba Pendam Tentu ($l$): Haba yang diserap atau dibebaskan semasa perubahan fasa 1 kg bahan tanpa sebarang perubahan suhu ($Q = mL$). Haba Pendam Tentu Pelakuran vs Pengewapan.",
      "Hukum-hukum Gas: Hukum Boyle ($P_1V_1 = P_2V_2$ pada suhu malar), Hukum Charles ($V_1/T_1 = V_2/T_2$ pada tekanan malar), Hukum Gay-Lussac ($P_1/T_1 = P_2/T_2$ pada isi padu malar). Suhu mesti dalam Kelvin ($T/\\text{K} = \\theta/{^\\circ}\\text{C} + 273.15$)."
    ]
  },
  {
    topicId: "f5-p2",
    title: "Tekanan",
    context: "Tekanan cecair, tekanan atmosfera, prinsip Pascal, Archimedes, dan Bernoulli.",
    keyPoints: [
      "Tekanan Cecair: $P = h\\rho g$. Tekanan bertambah dengan kedalaman dan ketumpatan cecair.",
      "Prinsip Pascal: Tekanan yang dikenakan pada cecair yang ditutup dipindahkan secara seragam ke semua arah. Formulasi: $\\frac{F_1}{A_1} = \\frac{F_2}{A_2}$ (Sistem Hidraulik).",
      "Prinsip Archimedes: Objek yang direndam sebahagian atau sepenuhnya akan mengalami daya apung ($F_B$) yang menyamai berat bendalir yang disesarkan ($F_B = V\\rho g$). Hubungan: Daya Apung = Berat Objek (Prinsip Keapungan).",
      "Prinsip Bernoulli: Halaju aliran bendalir yang tinggi menghasilkan kawasan bertekanan rendah (misalnya aerofoil sayap kapal terbang, tiub venturi, penunu bunsen)."
    ]
  },
  // BIOLOGY (KSSM SPM)
  {
    topicId: "f4-b2",
    title: "Biologi Sel dan Organisasi Sel",
    context: "Struktur sel haiwan dan tumbuhan, berserta fungsi organel khusus sel.",
    keyPoints: [
      "Mitokondria: Tapak penjanaan tenaga melalui respirasi sel dlm bentuk ATP.",
      "Kloroplas: Mengandungi pigmen klorofil untuk menyerap tenaga cahaya matahari bagi fotosintesis.",
      "Jalinan Endoplasma Kasar (JEK): Mempunyai ribosom melekat padanya, berfungsi mengangkut protein yang disintesis dibantu Ribosom.",
      "Jasad Golgi: Memproses, membungkus, mengisih, dan mengangkut bahan organik seperti protein dan karbohidrat dlm vesikel rembesan.",
      "Lisosom: Mengandungi enzim hidrolisis (lisozim) untuk mencernakan organel rosak atau bakteria luar.",
      "Vakuol: Sel tumbuhan mempunyai vakuol besar berisi sap sel yang mengekalkan kesegahan sel supaya tumbuhan herba tegak."
    ]
  },
  {
    topicId: "f4-b4",
    title: "Metabolisme dan Enzim",
    context: "Penamaan enzim, sifat umum, hipotesis tindakan, dan aplikasi industri.",
    keyPoints: [
      "Sifat Umum Enzim: Pemangkin organik yang mempercepat tindak balas biokimia dengan merendahkan tenaga pengaktifan. Bersifat spesifik sbg mangga dan kunci.",
      "Hipotesis Mangga dan Kunci: Enzim ialah 'mangga' dan substrat ialah 'kunci'. Substrat mengikat secara tepat pada Tapak Aktif enzim untuk menghasilkan kompleks enzim-substrat sebelum hasil akhir terbebas.",
      "Kesan Suhu & pH: Suhu optimum bagi kebanyakan enzim manusia ialah $37^\\circ\\text{C}$. Suhu tinggi ($> 40^\\circ\\text{C}$) menyebabkannya Terdenaturasi kerana ikatan kimia terputus dan tapak aktif berubah bentuk.",
      "Aplikasi Industri: Amilase (pencernaan kanji), Protease (menghilangkan kotoran protein dlm detergen), Laktase (susu bebas laktosa)."
    ]
  },
  {
    topicId: "f5-b2",
    title: "Struktur dan Fungsi Daun",
    context: "Fotosintesis, pembenahan gas, struktur stoma, dan sel mesofil.",
    keyPoints: [
      "Sel Mesofil Palisad: Sel tegak, padat rapat penuh kloroplas di bahagian atas daun untuk menyerap cahaya maksimum.",
      "Sel Mesofil Span: Tersusun longgar dengan banyak ruang sel udara untuk pertukaran gas $CO_2$ dan $O_2$ yang cekap.",
      "Mekanisme Pembukaan Stoma: Ion kalium ($K^+$) dipam secara aktif masuk ke dalam sel pengawal. Menyebabkan sel pengawal hipertonik, air masuk merintasi membran secara osmosis, sel menjadi segah dan membengkok ke luar membuka liang stoma.",
      "Fotosintesis Tindak Balas Cahaya: Berlaku di membran tilakoid kloroplas, memecahkan $H_2O$ menghasilkan $H^+$, gas $O_2$ (fotolisis air), dan ATP.",
      "Fotosintesis Tindak Balas Gelap: Berlaku di stroma kloroplas, menurunkan gas $CO_2$ menggunakan $H^+$ daripada tindak balas cahaya menghasilkan glukosa ($C_6H_{12}O_6$)."
    ]
  }
];
