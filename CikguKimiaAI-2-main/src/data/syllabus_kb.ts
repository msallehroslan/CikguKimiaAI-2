/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Expanded KSSM Chemistry Knowledge Base
 * Generated from: NOTA_KIMIA_TINGKATAN_4_V1.pdf & NOTA_KIMIA_TINGKATAN_5_V1.pdf
 * Covers: Form 4 Bab 1-8 | Form 5 Bab 1-5
 */

export interface SyllabusFact {
  topicId: string;
  title: string;
  context: string;
  keyPoints: string[];
}

export const SYLLABUS_KNOWLEDGE_BASE: SyllabusFact[] = [

  // ============================================================
  // FORM 4
  // ============================================================

  {
    topicId: "f4-c1",
    title: "Pengenalan kepada Kimia",
    context: "Skop kimia, kepentingan kimia dalam kehidupan, kaedah saintifik, dan keselamatan makmal.",
    keyPoints: [
      "Kimia ialah bidang sains yang mengkaji struktur, sifat, komposisi & interaksi antara jirim. Berasal dari perkataan Arab 'alkimiya'.",
      "Bahan kimia dalam kehidupan: Makanan (pengawet, pewarna, penstabil), Perubatan (antibiotik, antiseptik, kemoterapi), Pertanian (herbisid, pestisid, hormon), Industri (kaca, seramik, detergen).",
      "Kerjaya berkaitan kimia: Bioteknologi, Farmaseutikal, Teknologi Hijau, Jurutera Bioperubatan, Doktor, Ahli sains pemakanan.",
      "Kaedah Saintifik: Membuat pemerhatian → Membuat inferens → Mengenal pasti masalah → Membuat hipotesis → Mengenal pasti pembolehubah → Mengawal pembolehubah → Merancang eksperimen → Mengumpul data → Mentafsir data → Membuat kesimpulan → Menulis laporan.",
      "Pemboleh ubah: Dimanipulasikan (diubah), Bergerak balas (diukur/diperhatikan), Dimalarkan (dikekalkan).",
      "Alat Pelindung Diri: Goggles (mata), Topeng muka (pernafasan), Sarung tangan (tangan), Baju makmal (badan), Kasut makmal (kaki).",
      "Peralatan keselamatan: Kebuk wasap (gas beracun), Pancuran air (tumpahan di badan), Eyewash (tumpahan di mata), Alat pemadam kebakaran.",
      "Penyimpanan bahan kimia: Logam reaktif (Li, Na, K) dalam minyak parafin; hidrokarbon & pelarut organik di tempat teduh jauh dari haba; bahan sensitif cahaya (HNO3 pekat, H2O2, AgNO3) dalam botol gelap; bahan pH<5 & pH>9 dalam kabinet khas berkunci.",
      "Pelupusan bahan kimia: Sisa pepejal (bekas khas), pelarut organik (bekas kaca/plastik khas, jangan ke singki), logam berat (beg plastik, sisa disejat dalam kebuk wasap), bahan mudah meruap (bekas tertutup jauh dari cahaya & haba).",
      "Langkah kemalangan tumpahan merkuri: Maklum guru → kawasan larangan → taburkan serbuk sulfur → hubungi Bomba.",
    ]
  },

  {
    topicId: "f4-c2",
    title: "Jirim dan Struktur Atom",
    context: "Konsep asas jirim, perkembangan model atom, struktur atom, isotop dan penggunaannya.",
    keyPoints: [
      "Jirim: mempunyai jisim & memenuhi ruang. Terdiri daripada zarah halus & diskrit. Tiga keadaan: pepejal, cecair, gas.",
      "Pepejal: zarah padat & teratur, tenaga kinetik rendah, daya tarikan kuat. Cecair: zarah padat tapi tak teratur, tenaga kinetik sederhana. Gas: zarah berjauhan, tenaga kinetik sangat tinggi, daya tarikan lemah.",
      "Pengelasan jirim: Unsur (Atom: C, Molekul: O2) | Sebatian (Molekul: H2O, Ion: NaCl).",
      "Takat Lebur: suhu tetap semasa pepejal → cecair (haba diserap, suhu tidak berubah). Takat Beku: cecair → pepejal (haba dibebaskan).",
      "Perkembangan Model Atom: Dalton (sfera pejal) → J.J. Thomson (sfera positif + elektron) → Rutherford (nukleus + elektron luar nukleus) → Niels Bohr (elektron dalam petala) → Chadwick (neutron dalam nukleus).",
      "Zarah subatom: Proton (p, cas +1, jisim 1) dalam nukleus; Neutron (n, cas 0, jisim 1) dalam nukleus; Elektron (e, cas -1, jisim 1/1840) mengorbit nukleus.",
      "Nombor proton (Z) = bilangan proton = bilangan elektron (dalam atom neutral).",
      "Nombor nukleon (A) = bilangan proton + bilangan neutron.",
      "Perwakilan piawai: A atas kiri, Z bawah kiri, simbol unsur. Contoh: 12C (A=12, Z=6, neutron=6).",
      "Susunan elektron: Petala 1 maks 2e, petala 2 maks 8e, petala 3 maks 8e (untuk Z=1-20). Contoh Al (Z=13): 2.8.3.",
      "Elektron valens: elektron pada petala terluar. Menentukan sifat kimia unsur.",
      "Isotop: atom unsur sama, proton sama, neutron berbeza. Contoh: Cl-35 & Cl-37 (sama proton=17, neutron berbeza).",
      "Jisim atom relatif = Σ(% isotop × jisim isotop) / 100. Contoh: Cl = (75×35 + 25×37)/100 = 35.5.",
      "Penggunaan isotop: Kobalt-60 (radioterapi & sterilisasi), Iodin-131 (rawatan tiroid), Fosforus-32 (metabolisme tumbuhan), Uranium-235 (penjana nuklear), Karbon-14 (arkeologi umur artifak), Natrium-24 (kesan kebocoran paip).",
    ]
  },

  {
    topicId: "f4-c3",
    title: "Konsep Mol, Formula dan Persamaan Kimia",
    context: "Jisim atom relatif, konsep mol, formula kimia empirik & molekul, persamaan kimia dan stoikiometri.",
    keyPoints: [
      "Jisim Atom Relatif (JAR): jisim purata 1 atom unsur berbanding 1/12 jisim atom karbon-12. Karbon-12 sebagai piawai kerana mudah dikendalikan (pepejal), mudah bergabung dengan unsur lain.",
      "Jisim Molekul Relatif (JMR): jisim purata 1 molekul berbanding 1/12 jisim karbon-12. Dikira dengan menjumlahkan JAR semua atom.",
      "Jisim Formula Relatif (JFR): untuk sebatian ion. Contoh: ZnCl2 = 65 + 2(35.5) = 136.",
      "Pemalar Avogadro NA = 6.02 × 10²³ mol⁻¹. Satu mol mengandungi 6.02 × 10²³ zarah.",
      "Bilangan mol (n) = Bilangan zarah / NA.",
      "Bilangan mol (n) = Jisim (g) / Jisim molar (g mol⁻¹). Jisim molar = nilai JMR dalam g mol⁻¹.",
      "Bilangan mol (n) = Isi padu gas / Isi padu molar. Isi padu molar: 22.4 dm³ mol⁻¹ (STP) atau 24 dm³ mol⁻¹ (keadaan bilik).",
      "Formula empirik: nisbah paling ringkas bilangan atom. Formula molekul: bilangan sebenar atom. Formula molekul = (Formula empirik)n.",
      "Penentuan formula empirik: Jisim → Bilangan mol atom → Nisbah mol → Nisbah paling ringkas.",
      "Formula kimia sebatian ion: kation + anion, cas positif & negatif mesti seimbang (kaedah silang).",
      "Ion lazim - Kation: Na⁺, K⁺, Al³⁺, Zn²⁺, Mg²⁺, Fe²⁺, Fe³⁺, Cu²⁺, Ca²⁺, Ag⁺, Pb²⁺, NH4⁺. Anion: O²⁻, Cl⁻, Br⁻, F⁻, I⁻, OH⁻, CO3²⁻, NO3⁻, SO4²⁻, PO4³⁻, MnO4⁻, Cr2O7²⁻, S2O3²⁻.",
      "Penamaan sebatian ion: nama kation dahulu, diikuti nama anion. Logam berbilang cas guna angka Roman: Fe²⁺ = ferum(II), Fe³⁺ = ferum(III).",
      "Persamaan kimia: bahan tindak balas (kiri) → hasil tindak balas (kanan). Mesti seimbang (Hukum Keabadian Jisim). Tulis keadaan fizik: (p), (ce), (g), (ak).",
      "Stoikiometri: gunakan pekali persamaan untuk nisbah mol. n mol A bertindak balas dengan pekali nisbah mol B.",
    ]
  },

  {
    topicId: "f4-c4",
    title: "Jadual Berkala Unsur",
    context: "Perkembangan jadual berkala, susunan unsur moden, sifat Kumpulan 18, 1, 17, Kala 3, dan unsur peralihan.",
    keyPoints: [
      "Perkembangan: Lavoisier (kumpulan umum) → Dobereiner (Triad) → Newlands (Hukum Oktaf) → Meyer (graf isi padu atom) → Mendeleev (susunan jisim atom, ramalan unsur) → Moseley (susunan nombor proton).",
      "Jadual Berkala Moden: unsur disusun mengikut nombor proton menaik. Kumpulan = lajur menegak (18 kumpulan). Kala = baris mengufuk (7 kala).",
      "Kedudukan kumpulan ditentukan oleh bilangan elektron valens. Kedudukan kala ditentukan oleh bilangan petala berisi elektron.",
      "Kumpulan 18 (Gas Adi): He, Ne, Ar, Kr, Xe, Rn, Og. Tidak reaktif kerana petala valens penuh (duplet/oktet stabil). Wujud sebagai monoatom.",
      "Menuruni Kumpulan 18: jejari atom bertambah → takat lebur & takat didih bertambah (daya tarikan antara atom lebih kuat).",
      "Kegunaan Gas Adi: He (belon kaji cuaca, tangki penyelam), Ne (lampu iklan), Ar (mentol elektrik, mengimpal), Kr (lampu denyar kamera), Xe (lampu rumah api, ubat bius), Rn (rawatan kanser).",
      "Kumpulan 1 (Logam Alkali): Li, Na, K, Rb, Cs, Fr. 1 elektron valens. Lembut, ketumpatan rendah, terapung di air. Takat lebur & takat didih rendah berbanding logam lain.",
      "Menuruni Kumpulan 1: jejari atom bertambah → ikatan logam lemah → takat lebur/didih berkurang → kereaktifan bertambah (elektron valens lebih mudah didermakan).",
      "Tindak balas Kumpulan 1: dengan air → hidroksida + H2 (misal: 2Li + 2H2O → 2LiOH + H2). Dengan oksigen → oksida logam (4Li + O2 → 2Li2O). Dengan klorin → logam klorida (2Na + Cl2 → 2NaCl).",
      "Kumpulan 17 (Halogen): F, Cl, Br, I, At, Ts. 7 elektron valens. Wujud sebagai molekul dwiatom. Menerima 1 elektron → ion bercas -1.",
      "Menuruni Kumpulan 17: saiz molekul bertambah → daya tarikan antara molekul kuat → takat lebur/didih bertambah → kereaktifan berkurang (sukar menarik elektron).",
      "Warna halogen: Cl2 (kuning kehijauan, gas), Br2 (perang kemerahan, cecair), I2 (hitam keunguan, pepejal).",
      "Tindak balas halogen: dengan air → larutan berasid (Cl2 + H2O ⇌ HCl + HOCl). Dengan logam → halida logam. Dengan alkali → halida + halat + air.",
      "Penyesaran halogen: halogen lebih atas (lebih reaktif) menyesarkan halogen lebih bawah dari larutan halidanya.",
      "Kala 3: Na, Mg, Al, Si, P, S, Cl, Ar. Merentasi kala kiri ke kanan: saiz atom mengecil, keelektronegatifan meningkat, keadaan fizik berubah pepejal → gas.",
      "Sifat oksida merentasi Kala 3: Na2O & MgO (oksida bes) → Al2O3 (oksida amfoterik) → SiO2, P4O10, SO3, Cl2O7 (oksida asid).",
      "Unsur Peralihan: terletak antara Kumpulan 2 & 13. Contoh: Cr, Mn, Fe, Cu. Keras, ketumpatan tinggi, takat lebur/didih tinggi, permukaan berkilat.",
      "Ciri istimewa unsur peralihan: (1) mangkin (Fe dalam Proses Haber, V2O5 dalam Proses Sentuh, Pt dalam Proses Ostwald), (2) membentuk ion berwarna, (3) lebih dari satu nombor pengoksidaan, (4) membentuk ion kompleks.",
      "Warna ion peralihan: Cu²⁺ (biru), Fe²⁺ (hijau), Fe³⁺ (perang/kuning), Cr³⁺ (hijau), Mn²⁺ (merah jambu), MnO4⁻ (ungu), Cr2O7²⁻ (jingga).",
    ]
  },

  {
    topicId: "f4-c5",
    title: "Ikatan Kimia",
    context: "Pembentukan ikatan ion, ikatan kovalen, ikatan hidrogen, ikatan logam, serta sifat sebatian ion dan kovalen.",
    keyPoints: [
      "Ikatan kimia terbentuk apabila atom mencapai susunan elektron duplet (2) atau oktet (8) yang stabil. Hanya melibatkan elektron valens.",
      "Ikatan Ion: pemindahan elektron dari atom logam kepada atom bukan logam. Atom logam → kation (+). Atom bukan logam → anion (-). Sebatian ion terbentuk melalui daya tarikan elektrostatik antara ion berlainan cas.",
      "Ikatan Kovalen: perkongsian elektron antara atom bukan logam. Ikatan tunggal (1 pasang e dikongsi), ikatan ganda dua (2 pasang), ikatan ganda tiga (3 pasang).",
      "Ikatan Datif/Koordinat: pasangan elektron yang dikongsi berasal dari satu atom sahaja. Contoh: pembentukan ion hidroksonium H3O⁺.",
      "Struktur Lewis: menggambarkan ikatan kovalen menggunakan pasangan elektron atau garisan antara atom.",
      "Ikatan Hidrogen: daya tarikan antara atom H (yang terikat pada N, O, atau F) dengan atom N, O, atau F dalam molekul lain. Contoh: antara molekul H2O.",
      "Kesan ikatan hidrogen: takat didih lebih tinggi (lebih banyak haba diperlukan untuk memutuskan ikatan), keterlarutan dalam air (contoh etanol larut dalam air).",
      "Ikatan Logam: daya tarikan elektrostatik antara lautan elektron (elektron valens dinyahsetempatkan) dengan ion logam bercas positif. Sebab logam mengkonduksi elektrik.",
      "Persamaan Ikatan Ion vs Kovalen: kedua-duanya melibatkan elektron valens sahaja, atom mencapai oktet/duplet stabil. Perbezaan: ion → pemindahan e, kovalen → perkongsian e.",
      "Sifat Sebatian Ion: takat lebur & didih tinggi, mengkonduksi elektrik dalam leburan/larutan akueus (bukan pepejal), larut dalam air (bukan pelarut organik).",
      "Sifat Sebatian Kovalen (molekul ringkas): takat lebur & didih rendah (daya van der Waals lemah), tidak mengkonduksi elektrik dalam semua keadaan, larut dalam pelarut organik (bukan air, kecuali yang mempunyai kumpulan OH atau ikatan hidrogen).",
      "Sebatian kovalen molekul gergasi (contoh SiO2): takat lebur & didih sangat tinggi (ikatan kovalen kuat dalam seluruh struktur), keras, tidak mengkonduksi elektrik.",
      "Kegunaan: Sebatian ion (LiI dalam bateri, NH4NO3 & KCl dalam baja). Sebatian kovalen (parasetamol C8H9NO2 merawat demam, gliserol C3H5(OH)3 dalam produk kulit).",
    ]
  },

  {
    topicId: "f4-c6",
    title: "Asid, Bes dan Garam",
    context: "Sifat asid dan alkali, pH, kekuatan asid/alkali, tindak balas kimia, kepekatan larutan, peneutralan, garam, penyediaan garam, tindakan haba, analisis kualitatif.",
    keyPoints: [
      "Asid (Arrhenius): bahan yang mengion dalam air untuk menghasilkan ion hidrogen H⁺. Contoh: HCl(ak) → H⁺(ak) + Cl⁻(ak).",
      "Bes: bahan yang bertindak balas dengan asid menghasilkan garam + air sahaja. Oksida logam & hidroksida logam ialah bes.",
      "Alkali: bes yang larut dalam air, mengion menghasilkan ion hidroksida OH⁻. Contoh: NaOH, KOH, Ca(OH)2, NH3(ak).",
      "Air diperlukan untuk menunjukkan sifat keasidan & kealkalian (ion H⁺ / OH⁻ perlu bebas bergerak).",
      "Skala pH: 0-6 (asid), 7 (neutral), 8-14 (alkali). pH = -log[H⁺]. pOH = -log[OH⁻]. pH + pOH = 14.",
      "Kebesan asid: monoprotik (HCl, HNO3 → 1 H⁺/molekul), diprotik (H2SO4 → 2 H⁺/molekul), triprotik (H3PO4 → 3 H⁺/molekul).",
      "Asid kuat: mengion lengkap dalam air (HCl, H2SO4, HNO3). Asid lemah: mengion separa (CH3COOH, darjah 1.54%).",
      "Alkali kuat: mengion lengkap (NaOH, KOH). Alkali lemah: mengion separa (NH3, darjah 1.3%).",
      "Kepekatan (g dm⁻³) = Jisim terlarut (g) / Isi padu larutan (dm³). Kemolaran (mol dm⁻³) = Bilangan mol / Isi padu (dm³). n = MV (V dalam dm³) atau n = MV/1000 (V dalam cm³).",
      "Larutan piawai: kepekatan diketahui dengan tepat. NaOH tidak sesuai (higroskopik & menyerap CO2). Asid oksalik H2C2O4.2H2O boleh digunakan.",
      "Pencairan larutan piawai: M1V1 = M2V2 (bilangan mol tak berubah semasa pencairan).",
      "Sifat kimia asid: + bes → garam + air; + logam reaktif → garam + H2; + karbonat logam → garam + air + CO2.",
      "Sifat kimia alkali: + asid → garam + air; + garam ammonium → garam + air + NH3; + ion logam → hidroksida logam.",
      "Peneutralan: H⁺(ak) + OH⁻(ak) → H2O(ce). Persamaan ion am bagi semua peneutralan asid-alkali.",
      "Pentitratan: kaedah menentukan isi padu asid/alkali untuk peneutralan lengkap. Penunjuk: fenolftalein (tak berwarna→merah jambu dalam alkali), metil jingga (merah→jingga dalam alkali).",
      "Garam: sebatian ion terbentuk apabila H⁺ asid digantikan dengan ion logam atau NH4⁺.",
      "Keterlarutan garam: Semua nitrat larut. Semua sulfat larut kecuali BaSO4, PbSO4, CaSO4. Semua klorida larut kecuali AgCl, HgCl2, PbCl2. Karbonat: hanya Na2CO3, K2CO3, (NH4)2CO3 larut. Semua garam ammonium, natrium, kalium larut.",
      "Penyediaan garam terlarut: (1) peneutralan asid+alkali, (2) asid+logam reaktif, (3) asid+oksida logam, (4) asid+karbonat logam, (5) asid+ammonia akueus.",
      "Penyediaan garam tak terlarut: tindak balas penguraian ganda dua (dua larutan garam dicampurkan → mendakan terbentuk).",
      "Tindakan haba ke atas garam: karbonat → oksida logam + CO2. Nitrat → oksida logam + NO2 + O2. Ammonium klorida → NH3 + HCl.",
      "Analisis kualitatif - Ujian anion: CO3²⁻ (asid cair → gas CO2 mengeruhkan air kapur), Cl⁻ (HNO3 + AgNO3 → mendakan putih AgCl), SO4²⁻ (HCl + BaCl2 → mendakan putih BaSO4), NO3⁻ (H2SO4 + FeSO4 pekat → cincin perang).",
      "Analisis kualitatif - Ujian kation dengan NaOH: Zn²⁺, Al³⁺, Pb²⁺ (mendakan putih, larut dalam NaOH berlebihan), Mg²⁺, Ca²⁺ (mendakan putih, tidak larut), Fe²⁺ (mendakan hijau), Fe³⁺ (mendakan perang), Cu²⁺ (mendakan biru), NH4⁺ (gas NH3 berbau).",
      "Ujian kation dengan NH3: Cu²⁺ (mendakan biru → larutan biru tua dalam NH3 berlebihan), Zn²⁺ (mendakan putih → larutan tak berwarna).",
      "Ujian pengesahan: Pb²⁺ vs Al³⁺ → tambah KI (mendakan kuning PbI2 → Pb²⁺ ada). Fe²⁺ → K4[Fe(CN)6] (mendakan biru tua). Fe³⁺ → K3[Fe(CN)6] (mendakan biru tua) atau KSCN (larutan merah darah).",
    ]
  },

  {
    topicId: "f4-c7",
    title: "Kadar Tindak Balas",
    context: "Penentuan kadar tindak balas, faktor-faktor yang mempengaruhi, teori perlanggaran.",
    keyPoints: [
      "Kadar tindak balas = Perubahan kuantiti bahan tindak balas atau hasil / Masa. Unit: g s⁻¹, cm³ s⁻¹, mol dm⁻³ s⁻¹.",
      "Cara mengukur kadar: (1) pembentukan mendakan (masa tanda × hilang), (2) pengurangan jisim (penimbang elektronik), (3) penambahan isi padu gas (picagari gas).",
      "Kadar purata = jumlah isi padu gas / tempoh masa. Kadar pada masa t = kecerunan tangen lengkung pada masa t.",
      "4 faktor yang mempengaruhi kadar tindak balas: (1) Saiz bahan tindak balas, (2) Kepekatan, (3) Suhu, (4) Mangkin.",
      "Saiz ↑ (lebih kecil) → luas permukaan ↑ → kadar ↑. Aplikasi: tablet antasid dikunyah, kentang dipotong nipis.",
      "Kepekatan ↑ → bilangan zarah per unit isi padu ↑ → frekuensi perlanggaran ↑ → kadar ↑. Tekanan gas ↑ → kesan sama.",
      "Suhu ↑ → tenaga kinetik zarah ↑ → lebih zarah mencapai tenaga pengaktifan → frekuensi perlanggaran berkesan ↑ → kadar ↑. Setiap +10°C → kadar ×2.",
      "Mangkin: menurunkan tenaga pengaktifan dengan menyediakan lintasan tindak balas alternatif. Tidak berubah secara kimia pada akhir tindak balas.",
      "Teori Perlanggaran: perlanggaran berkesan perlu (1) tenaga ≥ tenaga pengaktifan, (2) orientasi yang betul. Kadar bergantung kepada frekuensi perlanggaran berkesan.",
      "Tenaga pengaktifan (Ea): tenaga minimum yang diperlukan untuk memulakan tindak balas. Ditunjukkan dalam gambar rajah profil tenaga.",
      "Tindak balas eksotermik: ΔH negatif, tenaga hasil < tenaga bahan tindak balas. Tindak balas endotermik: ΔH positif, tenaga hasil > tenaga bahan tindak balas.",
      "Mangkin hadir → Ea lebih rendah (Ea') → lebih zarah mencapai tenaga pengaktifan → kadar ↑. Gambar rajah profil tenaga menunjukkan dua lengkung (dengan & tanpa mangkin).",
      "Aplikasi suhu: mencuci dengan air panas + detergen (dua faktor). Memasak dalam minyak lebih cepat (suhu minyak > 100°C).",
      "Aplikasi kepekatan: hujan asid mengkakis bangunan besi (SO2 tinggi → keasidan tinggi). Pemampatan wap petrol + udara dalam enjin kereta → pembakaran cepat.",
    ]
  },

  {
    topicId: "f4-c8",
    title: "Bahan Buatan dalam Industri",
    context: "Aloi, kaca, seramik, dan bahan komposit: komposisi, sifat, dan kegunaan.",
    keyPoints: [
      "Aloi: campuran dua atau lebih logam. Sifat lebih baik daripada logam tulen (lebih keras, tahan kakisan, berkilat).",
      "Cara aloi lebih keras: atom logam asing menyusup di antara atom logam tulen → menghalang lapisan dari menggelongsor.",
      "Contoh aloi: Duralumin (93% Al, 3% Cu, 3% Mg, 1% Mn) → badan kapal terbang. Gangsa (90% Cu, 10% Sn) → pingat, tugu. Loyang (70% Cu, 30% Zn) → kunci, alat muzik. Keluli (98% Fe, 0.2-2% C) → bahan binaan. Keluli nirkarat (73% Fe, 18% Cr, 8% Ni) → sudu, alat pembedahan. Piuter (95% Sn, 3.5% Sb, 1.5% Cu) → cenderamata.",
      "Superkonduktor: aloi tanpa rintangan elektrik pada suhu sangat rendah. Digunakan dalam kereta api Maglev.",
      "Kaca: Sifat asas: keras tapi rapuh, lengai kimia, lutsinar, kalis air, penebat haba & elektrik.",
      "Jenis kaca: (1) Silika terlakur (SiO2 tulen, takat lebur ~1800°C, tidak mengembang/mengecut) → kanta teleskop. (2) Soda kapur (SiO2+Na2CO3+CaCO3, takat lebur ~1000°C, mudah dibentuk) → botol, jag. (3) Borosilikat (SiO2+Na2CO3+CaCO3+B2O3+Al2O3, tahan haba) → radas makmal. (4) Plumbum (SiO2+Na2CO3+PbO, indeks biasan tinggi) → prisma.",
      "Seramik: pepejal bukan organik & bukan logam, dikeraskan melalui pemanasan suhu tinggi. Sifat: rintangan haba, keras & kuat, lengai kimia, mudah pecah.",
      "Seramik tradisional: dari tanah liat (kaolin, Al2O3.2SiO2.2H2O) → batu-bata, tembikar, pinggan mangkuk.",
      "Seramik termaju: dari oksida, karbida, nitrida → rintangan haba & lelasan lebih tinggi, superkonduktiviti. Contoh: SiC (cakera pemotong, cakera brek), tungsten karbida (cincin tahan lelasan).",
      "Aplikasi seramik: perubatan (implan gigi, tulang lutut, MRI), pengangkutan (komponen enjin), penjanaan tenaga (penebat elektrik voltan tinggi).",
      "Bahan Komposit: gabungan dua atau lebih bahan tak homogen (bahan matriks + bahan pengukuhan). Sifat lebih baik daripada komponen asal.",
      "Contoh komposit: Konkrit diperkukuhkan (konkrit+keluli → jambatan, empangan). Kaca gentian (plastik+gentian kaca → topi keledar, bampar kereta). Gentian optik (kaca silika+plastik → penghantaran data cahaya). Kaca fotokromik (kaca+AgCl+CuCl → gelap dalam cahaya matahari, lindungi UV). Superkonduktor YBCO (seramik → elektromagnet, NMR, MRI).",
    ]
  },

  // ============================================================
  // FORM 5
  // ============================================================

  {
    topicId: "f5-c1a",
    title: "Keseimbangan Redoks - Pengoksidaan dan Penurunan",
    context: "Definisi pengoksidaan & penurunan dari pelbagai sudut, nombor pengoksidaan, agen pengoksidaan & penurunan, setengah persamaan.",
    keyPoints: [
      "Tindak balas redoks: pengoksidaan & penurunan berlaku serentak.",
      "Dari segi oksigen: Pengoksidaan = penambahan oksigen. Penurunan = kehilangan oksigen.",
      "Dari segi hidrogen: Pengoksidaan = kehilangan hidrogen. Penurunan = penambahan hidrogen.",
      "Dari segi elektron: Pengoksidaan = kehilangan elektron. Penurunan = penerimaan elektron. (OIL RIG: Oxidation Is Loss, Reduction Is Gain).",
      "Dari segi nombor pengoksidaan: Pengoksidaan = nombor pengoksidaan bertambah. Penurunan = nombor pengoksidaan berkurang.",
      "Agen pengoksidaan: bahan yang mengoksidakan bahan lain & sendiri diturunkan (menerima elektron).",
      "Agen penurunan: bahan yang menurunkan bahan lain & sendiri dioksidakan (mendermakan elektron).",
      "Garis panduan nombor pengoksidaan: (1) unsur bebas = 0, (2) ion monoatom = nilai cas, (3) Kumpulan 1=+1, 2=+2, 13=+3, (4) jumlah dalam sebatian = 0, (5) jumlah dalam ion poliatom = cas ion, (6) H biasanya +1 (kecuali hidrida logam = -1), (7) O biasanya -2 (kecuali peroksida = -1), (8) halogen biasanya -1 (kecuali terikat O).",
      "Contoh agen pengoksidaan & setengah persamaan penurunannya: KMnO4 berasid (MnO4⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H2O), K2Cr2O7 berasid (Cr2O7²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H2O), Cl2(ak) + 2e⁻ → 2Cl⁻, Br2(ak) + 2e⁻ → 2Br⁻, Fe³⁺ + e⁻ → Fe²⁺, H2O2 berasid + 2H⁺ + 2e⁻ → 2H2O.",
      "Contoh agen penurunan & setengah persamaan pengoksidaannya: KI (2I⁻ → I2 + 2e⁻), KBr (2Br⁻ → Br2 + 2e⁻), FeSO4 (Fe²⁺ → Fe³⁺ + e⁻), logam reaktif Zn (Zn → Zn²⁺ + 2e⁻), SO2 (SO2 + 2H2O → SO4²⁻ + 4H⁺ + 2e⁻).",
      "Menulis setengah persamaan: (1) tulis bahan tindak balas & hasil, (2) seimbangkan bilangan atom, (3) hitung jumlah cas, (4) tambah elektron pada bahagian cas lebih positif untuk seimbang cas.",
      "Persamaan ion keseluruhan: gandakan setengah persamaan sehingga bilangan elektron sama, kemudian tambah.",
      "Tindak balas penyesaran logam: logam lebih elektropositif menyesarkan logam kurang elektropositif dari larutan garamnya. Contoh: Zn + Cu(NO3)2 → Zn(NO3)2 + Cu.",
      "Tindak balas penyesaran halogen: halogen lebih atas Kumpulan 17 (lebih reaktif) menyesarkan halogen lebih bawah dari larutan halidanya. Contoh: Cl2 + 2KBr → 2KCl + Br2.",
      "Pertukaran Fe²⁺ ↔ Fe³⁺: Fe²⁺ dioksidakan ke Fe³⁺ oleh KMnO4 atau K2Cr2O7 berasid. Fe³⁺ diturunkan ke Fe²⁺ oleh KI atau agen penurunan lain.",
    ]
  },

  {
    topicId: "f5-c1b",
    title: "Keseimbangan Redoks - Sel Kimia dan Elektrolisis",
    context: "Keupayaan elektrod piawai, sel kimia, sel elektrolisis, penyaduran, penulenan logam, pengekstrakan logam, pengaratan.",
    keyPoints: [
      "Keupayaan elektrod (E°): beza keupayaan antara kepingan logam & larutan ionnya dalam sel setengah. Diukur berbanding elektrod hidrogen piawai (E° = 0.00 V).",
      "Keadaan piawai: kepekatan ion 1.0 mol dm⁻³, tekanan 1 atm, suhu 25°C/298K, elektrod lengai Pt jika bukan logam.",
      "Siri Elektrokimia: disusun dari E° paling negatif (atas) ke paling positif (bawah). Logam atas = agen penurunan lebih kuat (lebih elektropositif, lebih mudah lepaskan elektron). Ion bawah = agen pengoksidaan lebih kuat.",
      "Sel Kimia (Galvani/Voltan): mengubah tenaga kimia → tenaga elektrik. Dua logam berlainan dalam elektrolit. Terminal negatif = anod (pengoksidaan). Terminal positif = katod (penurunan). Elektron mengalir dari anod → katod.",
      "E°sel = E°katod - E°anod. Sel Daniel contoh: Zn (anod, E°=-0.76V) | Cu (katod, E°=+0.34V). E°sel = +0.34 - (-0.76) = +1.10 V.",
      "Fungsi titian garam: melengkapkan litar elektrik dengan membenarkan pergerakan ion, mengekalkan kecairan larutan.",
      "Sel Elektrolisis: mengubah tenaga elektrik → tenaga kimia. Anod disambung terminal positif bateri. Katod disambung terminal negatif bateri. Anion → anod. Kation → katod.",
      "Faktor pemilihan ion dinyahcas: (1) Nilai E° (anod: anion E° lebih negatif didahulukan; katod: kation E° lebih positif didahulukan), (2) Kepekatan (ion halida kepekatan tinggi didahulukan di anod walaupun E° lebih positif), (3) Jenis elektrod (elektrod aktif seperti Cu → logam larut di anod, tiada anion dinyahcas).",
      "Elektrolisis leburan PbBr2: anod → Br⁻ → Br2 (gas perang). Katod → Pb²⁺ → Pb (pepejal kelabu).",
      "Elektrolisis larutan CuSO4 (elektrod karbon): anod → OH⁻ → O2 (gas). Katod → Cu²⁺ → Cu (pepejal perang). Warna biru larutan semakin pudar.",
      "Elektrolisis larutan CuSO4 (elektrod kuprum aktif): anod → Cu larut (Cu → Cu²⁺ + 2e⁻). Katod → Cu terenap. Warna larutan tidak berubah.",
      "Penyaduran logam: objek yang disadur = katod; logam penyadur = anod; larutan garam logam penyadur = elektrolit.",
      "Penulenan kuprum: kuprum tidak tulen = anod; kuprum tulen = katod; larutan Cu(NO3)2 = elektrolit. Impuriti terkumpul bawah anod.",
      "Pengekstrakan logam: logam lebih reaktif dari karbon → elektrolisis. Logam kurang reaktif dari karbon → penurunan oleh karbon (relau bagas). Pengekstrakan Al dari bauksit (Al2O3): elektrolisis leburan Al2O3 + kriolit Na3AlF6 (menurunkan takat lebur).",
      "Tindak balas termit: Al lebih reaktif menurunkan Fe2O3 → 2Al + Fe2O3 → Al2O3 + 2Fe. Untuk mengimpal landasan kereta api.",
      "Pengaratan besi: tindak balas redoks yang melibatkan Fe, O2 & air. Anod (kawasan O2 rendah): Fe → Fe²⁺ + 2e⁻. Katod (kawasan O2 tinggi): O2 + 2H2O + 4e⁻ → 4OH⁻. Produk akhir: Fe2O3.xH2O (karat, perang, rapuh, telap).",
      "Pengaratan lebih cepat dengan kehadiran asid atau garam (elektrolit lebih baik).",
      "Pencegahan pengaratan: (1) permukaan perlindungan (cat, minyak, plastik, penggalvanian-Zn, penyaduran timah-Sn, penyaduran Cr), (2) perlindungan logam korban (sambung Mg atau Zn, logam ini terkakis dahulu), (3) pengaloian (keluli nirkarat: Fe+Cr+Ni, Cr & Ni membentuk lapisan oksida pelindung).",
    ]
  },

  {
    topicId: "f5-c2",
    title: "Sebatian Karbon",
    context: "Jenis sebatian karbon, petroleum, siri homolog (alkana, alkena, alkuna, alkohol, asid karboksilik, ester), isomer, dan kegunaan.",
    keyPoints: [
      "Sebatian karbon: organik (dari benda hidup, ikatan kovalen karbon) & tak organik (CO2, CO3²⁻, CN⁻). Hidrokarbon = karbon + hidrogen sahaja. Bukan hidrokarbon = karbon + hidrogen + unsur lain (O, N, halogen).",
      "Hidrokarbon tepu: hanya ikatan tunggal C-C. Hidrokarbon tak tepu: sekurang-kurangnya satu ikatan ganda dua atau ganda tiga C=C atau C≡C.",
      "Petroleum: campuran hidrokarbon dari pereputan tumbuhan/haiwan berjuta tahun. Diproses melalui penyulingan berperingkat (diasingkan mengikut takat didih) & peretakan (rantai panjang dipecah kepada molekul lebih kecil menggunakan haba, tekanan tinggi, mangkin Al2O3+SiO2).",
      "Siri homolog: formula am sama, kumpulan berfungsi sama, sifat kimia sama, beza CH2 antara ahli berturutan, sifat fizik berubah beransur-ansur.",
      "Alkana: CnH(2n+2), n=1,2,3... Ikatan tunggal C-C. Nama: met, et, prop, but, pent, heks, hept, okt, non, dek + ana.",
      "Alkena: CnH2n, n=2,3... Ikatan ganda dua C=C. Nama: + ena. Alkuna: CnH(2n-2), n=2,3... Ikatan ganda tiga C≡C. Nama: + una.",
      "Alkohol: CnH(2n+1)OH, n=1,2,3... Kumpulan berfungsi: -OH (hidroksil). Nama: + ol.",
      "Asid Karboksilik: CnH(2n+1)COOH, n=0,1,2... Kumpulan berfungsi: -COOH (karboksil). Nama: + oik.",
      "Ester: CmH(2m+1)COOCnH(2n+1). Kumpulan berfungsi: -COO- (karboksilat). Terhasil dari asid karboksilik + alkohol + H2SO4 pekat (mangkin).",
      "Sifat fizik alkana/alkena/alkuna: takat lebur & didih rendah (meningkat dengan saiz molekul), tidak larut air, larut pelarut organik, tidak konduksi elektrik.",
      "Sifat fizik alkohol & asid karboksilik: takat didih lebih tinggi (ikatan hidrogen), alkohol & asid karbon rendah larut dalam air, keterlarutan berkurang dengan pertambahan saiz.",
      "Sifat kimia alkana: (1) Pembakaran lengkap → CO2 + H2O. Pembakaran tidak lengkap → C (jelaga) + CO + H2O. (2) Penukargantian dengan halogen di bawah sinaran UV (H digantikan satu demi satu oleh halogen).",
      "Sifat kimia alkena: (1) Pembakaran (jelaga lebih banyak dari alkana). (2) Penambahan: + H2 (penghidrogenan, 180°C, Ni/Pt), + X2 (penghalogenan, menyahwarnakan air bromin), + HX (penambahan halogen halida), + H2O (penghidratan, 300°C 60atm, H3PO4) → alkohol. (3) Pempolimeran penambahan → polimer.",
      "Ujian tak tepu: menyahwarnakan warna perang air bromin Br2 → tidak berwarna (alkena/alkuna bukan alkana).",
      "Penyediaan etanol: (1) Penapaian glukosa: C6H12O6 → enzim zimase → 2C2H5OH + 2CO2 (tanpa O2). (2) Penghidratan etena: C2H4 + H2O → H3PO4, 300°C, 60atm → C2H5OH.",
      "Sifat kimia alkohol: (1) Pembakaran → CO2 + H2O (nyalaan biru, tak berjelaga). (2) Pengoksidaan: alkohol → asid karboksilik (dengan KMnO4 berasid atau K2Cr2O7 berasid). (3) Pendehidratan: alkohol + serpihan porselin/Al2O3/H2SO4 pekat → alkena + H2O.",
      "Sifat kimia asid karboksilik: (1) Sebagai asid: + bes → garam + air, + karbonat → garam + CO2 + air, + logam aktif → garam + H2. (2) Pengesteran: + alkohol + H2SO4 pekat → ester + air.",
      "Penamaan ester: bahagian pertama dari alkohol (akhiran 'il'), bahagian kedua dari asid karboksilik (akhiran 'oat'). Contoh: etanol + asid etanoik → etil etanoat.",
      "Sifat ester: bau manis buah-buahan, ketumpatan rendah, tidak larut air, mudah meruap.",
      "Isomer struktur: formula molekul sama, formula struktur berbeza. Jenis: isomer rantai (susunan rantai C berbeza), isomer kedudukan (kedudukan kumpulan berfungsi berbeza).",
      "Isomer menunjukkan sifat kimia sama (kumpulan berfungsi sama) tetapi sifat fizik berbeza. Semakin banyak cabang → takat lebur & didih lebih rendah.",
      "Penamaan IUPAC isomer: (1) kenal pasti rantai C terpanjang, (2) nombor dari hujung terdekat cabang/kumpulan berfungsi, (3) namakan cabang (metil, etil, propil), (4) gunakan akhiran siri homolog.",
    ]
  },

  {
    topicId: "f5-c3",
    title: "Termokimia",
    context: "Perubahan haba dalam tindak balas, haba pemendakan, penyesaran, peneutralan, pembakaran, dan nilai bahan api.",
    keyPoints: [
      "Tindak balas eksotermik: membebaskan haba ke persekitaran. ΔH negatif. Suhu campuran meningkat. Contoh: pembakaran, peneutralan, penyesaran logam.",
      "Tindak balas endotermik: menyerap haba dari persekitaran. ΔH positif. Suhu campuran menurun. Contoh: fotosintesis, penguraian karbonat logam, melarutkan NH4NO3.",
      "ΔH = H(hasil tindak balas) - H(bahan tindak balas). Unit: kJ mol⁻¹.",
      "Gambar rajah aras tenaga: eksotermik (bahan tindak balas lebih tinggi dari hasil), endotermik (hasil lebih tinggi dari bahan tindak balas). Semua ada tenaga pengaktifan Ea.",
      "Pemutusan ikatan → serap tenaga. Pembentukan ikatan → bebaskan tenaga. Eksotermik: tenaga pembentukan > tenaga pemutusan.",
      "Penghitungan haba tindak balas: Q = mcθ. m = jisim larutan (g), c = muatan haba tentu = 4.2 J g⁻¹°C⁻¹, θ = perubahan suhu (°C). Anggapan: ketumpatan larutan = 1 g cm⁻³, tiada kehilangan haba.",
      "Haba Pemendakan: perubahan haba apabila 1 mol mendakan terbentuk dari ion-ionnya dalam larutan akueus.",
      "Haba Penyesaran: perubahan haba apabila 1 mol logam disesarkan dari larutan garamnya oleh logam lebih elektropositif.",
      "Haba Peneutralan: perubahan haba apabila 1 mol air terbentuk dari tindak balas peneutralan asid & alkali. Nilai teori asid kuat + alkali kuat = -57 kJ mol⁻¹.",
      "Haba peneutralan lebih rendah jika asid lemah atau alkali lemah (tenaga diperlukan untuk mengionkan asid/alkali lemah). Asid lemah+alkali lemah = paling rendah (~-50 kJ mol⁻¹).",
      "Asid diprotik H2SO4: peneutralan lengkap menghasilkan 2 mol air → 2×57 = 114 kJ. Tetapi haba peneutralan per mol air tetap -57 kJ mol⁻¹.",
      "Haba Pembakaran: haba dibebaskan apabila 1 mol bahan dibakar lengkap dalam oksigen berlebihan. ΔH negatif (eksotermik).",
      "Haba pembakaran alkohol meningkat dengan pertambahan atom karbon (lebih banyak CO2 & H2O terbentuk, lebih banyak haba dibebaskan). Peningkatan hampir sama antara ahli berturutan (~650 kJ mol⁻¹ per CH2).",
      "Nilai bahan api (kJ g⁻¹) = Haba pembakaran (kJ mol⁻¹) / Jisim molar bahan (g mol⁻¹). Nilai bahan api: Kayu (20), Metana (27), Arang (30), Etanol (30), Petrol (34), Kerosin (37), Gas asli (50), Hidrogen (143).",
    ]
  },

  {
    topicId: "f5-c4",
    title: "Polimer",
    context: "Jenis polimer, tindak balas pempolimeran penambahan & kondensasi, getah asli, getah sintetik.",
    keyPoints: [
      "Polimer: molekul berantai panjang dari pencantuman banyak monomer. Pempolimeran = tindak balas pencantuman monomer.",
      "Polimer semula jadi: kanji, selulosa (monomer: glukosa), protein (monomer: asid amino), getah asli (monomer: isoprena).",
      "Polimer sintetik: nilon, polietena, polistirena, PVC.",
      "Polimer termoplastik: boleh diacukan semula apabila dipanaskan (melebur). Contoh: polietena, PVC, nilon.",
      "Polimer termoset: tidak boleh diacukan semula (terurai/hangus apabila dipanaskan). Contoh: melamin, bakelit.",
      "Polimer elastomer: boleh diregang dan kembali ke bentuk asal. Contoh: poliuretana, getah stirena-butadiena (SBR).",
      "Pempolimeran Penambahan: monomer mempunyai ikatan kovalen ganda dua C=C. Ikatan ganda dua 'dibuka', monomer 'ditambah' pada rantai. Tiada hasil sampingan.",
      "Contoh pempolimeran penambahan: Etena → polietena (n C2H4 → [-CH2-CH2-]n). PVC dari kloroetena (vinil klorida). Polipropena dari propena. Polistirena dari stirena.",
      "Pempolimeran Kondensasi: sekurang-kurangnya dua jenis monomer berbeza, masing-masing ada dua kumpulan berfungsi. Menghasilkan polimer + molekul kecil (air atau HCl).",
      "Contoh kondensasi: Terilena (poliester) dari 1,2-etanadiol + asid tereftalik → polimer + nH2O. Nilon (poliamida) dari 1,6-heksadiamina + dekanadioil diklorida → polimer + nHCl.",
      "Lateks: cecair putih dari pokok getah (Hevea brasiliensis). Getah asli dalam lateks = poliisoprena.",
      "Monomer getah asli: isoprena (2-metilbut-1,3-diena). Membran protein bercas negatif menyebabkan zarah getah menolak antara satu sama lain → tidak menggumpal.",
      "Penggumpalan lateks: asid meneutralkan membran protein bercas negatif → zarah saling menarik → menggumpal. Berlaku secara semula jadi (bakteria → asid laktik) atau tambah asid lemah.",
      "Menghalang penggumpalan: tambah ammonia NH3 (alkali → meneutralkan asid, membran protein kekal bercas negatif).",
      "Pemvulkanan: proses menghasilkan getah lebih kenyal & berkualiti melalui rangkai silang sulfur antara rantai polimer. Sulfur bertindak balas dengan ikatan ganda dua C=C dalam getah. Hasil: getah tervulkan lebih keras, kenyal, tahan haba & pengoksidaan, lebih kuat.",
      "Getah sintetik: polimer sintetik bersifat kenyal. Contoh: Neoprena (tahan haba & pengoksidaan → tali sawat, sarung tangan petrol), SBR (tahan pelasan & haba → tayar, tapak kasut), Getah silikon (tahan suhu tinggi → implan perubatan), Tiokol & Getah nitril (tahan minyak & pelarut → sarung tangan).",
      "Polimer & alam sekitar: polimer sintetik lambat terurai → pencemaran lautan & tapak pelupusan. Penyelesaian: kitar semula, polimer terdegradasi (biodegradasi atau fotodegradasi).",
    ]
  },

  {
    topicId: "f5-c5",
    title: "Kimia Konsumer dan Industri",
    context: "Minyak & lemak, sabun & detergen, bahan tambah makanan, ubat-ubatan, kosmetik, nanoteknologi, teknologi hijau.",
    keyPoints: [
      "Minyak & lemak: ester dari gliserol + tiga molekul asid lemak (trigliserida). Minyak (tumbuhan, cecair, asid lemak tak tepu) vs Lemak (haiwan, pepejal, asid lemak tepu).",
      "Lemak tepu: hanya ikatan tunggal dalam rantai C. Lemak tak tepu: sekurang-kurangnya satu ikatan ganda dua C=C → takat lebur rendah, wujud cecair.",
      "Penghidrogenan: lemak tak tepu → lemak tepu melalui penambahan H2 (mangkin Ni, minyak panas). Menghasilkan marjerin dari minyak sayuran.",
      "Sabun: garam natrium/kalium bagi asid lemak. Dihasilkan melalui saponifikasi (hidrolisis minyak/lemak + NaOH/KOH pekat). Formula: RCOO⁻Na⁺ (R = rantai hidrokarbon panjang ≥8 C).",
      "Detergen: garam natrium bagi asid sulfonik. Dua jenis: natrium alkilbenzena sulfonat & natrium alkil sulfat. Dibuat dari pecahan petroleum + H2SO4.",
      "Tindakan pencucian sabun & detergen: molekul mempunyai bahagian hidrofilik (larut air, ion) & hidrofobik (larut minyak/gris, rantai karbon). Bahagian hidrofobik memasuki gris, bahagian hidrofilik menghadap air → emulsi → gris terapung.",
      "Sabun tidak berkesan dalam air liat (Ca²⁺ & Mg²⁺ membentuk garam tak larut = kerak). Detergen berkesan dalam air liat (garam detergen dengan Ca²⁺/Mg²⁺ larut dalam air).",
      "Bahan tambah makanan: ditambah untuk menghalang kerosakan atau memperbaik rupa, rasa, tekstur. Jenis: Pengawet, Pengantioksida, Perisa, Penstabil, Pengemulsi, Pemekat, Pewarna.",
      "Ubat tradisional: dari tumbuhan herba/haiwan, tidak diproses kimia. Ubat moden: pelbagai bentuk (pil, kapsul, serbuk, larutan), melalui ujian klinikal.",
      "Jenis ubat moden: Analgesik (aspirin, parasetamol, kodeina - melegakan sakit), Antimikrob (antibiotik membunuh bakteria, antiseptik, disinfektan), Ubat psikotik (haloperidol - gejala mental), Antialergi (antihistamin), Kortikosteroid (prednisalone - radang, alergi).",
      "Kosmetik: bahan digunakan secara luaran untuk membersih, melindungi, mencantikkan. Bahan asas: air, pewarna, pengawet, pelembap, pengemulsi, pemekat, pewangi.",
      "Nanosains: kajian bahan pada skala 1-100 nm. Nanoteknologi: pembangunan bahan/peranti menggunakan ciri zarah nano.",
      "Grafen: alotrop karbon (helaian atom karbon satu lapisan, saiz 0.1 nm). Sifat: kuat & keras, lutsinar, pengalir haba & elektrik yang baik, rintangan elektrik sangat rendah, kenyal, tidak telap.",
      "Kegunaan grafen: elektronik & semikonduktor, tenaga (bateri, sel solar), tekstil (kalis api, anti-UV), perubatan (sensor, penyampaian ubat), pertanian (racun perosak efektif), makanan (bahan tambah berskala nano).",
      "Teknologi Hijau: teknologi/aplikasi yang mengurangkan impak manusia terhadap alam sekitar. Sektor: bekalan tenaga (solar, hidro, angin, geoterma), pengangkutan (bahan api alternatif), bangunan (mesra alam), pengurusan sisa, pertanian (baja kompos), industri (alatan cekap tenaga).",
      "Pengurusan air sisa industri: menggunakan proses elektro-penggumpalan (elektrolisis dengan elektrod karbon/kuprum, air sisa sebagai elektrolit → bahan enapcemar bergumpal → diasingkan). Air terolah boleh digunakan semula untuk pengairan.",
    ]
  },

];
