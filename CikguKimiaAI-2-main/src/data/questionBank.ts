/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SPM Chemistry Question Bank
 * Source: Modul Topikal Latihan Kimia (A+ EDU Factory)
 * Covers: Form 4 Bab 2,3,4/5,6,7,8 | Form 5 Bab 9,10,11,12,13
 */

export interface ExamQuestion {
  id: string;
  title: string;
  topicId: string;
  paperType: "struct" | "essay";
  questionText: string;
  markingScheme: string;
}

export const QUESTION_BANK: ExamQuestion[] = [

  // =========================================================
  // BAB 2: STRUKTUR ATOM (f4-c2)
  // =========================================================
  {
    id: "f4c2-struct-01",
    title: "Graf Pemanasan Naftalena & Model Atom Bohr",
    topicId: "f4-c2",
    paperType: "struct",
    questionText: `Rajah 1 menunjukkan graf pemanasan bagi naftalena. Takat lebur ditunjukkan pada 80°C.

(a) Nyatakan jenis zarah dalam naftalena. [1M]

(b) Apakah yang dimaksudkan dengan takat lebur? [1M]

(c) Apakah takat lebur bagi naftalena? [1M]

(d) Terangkan mengapa suhu naftalena tidak berubah dari B ke C (semasa peleburan). [2M]

---

Rajah 2 menunjukkan model atom dengan nukleus di tengah, X ialah petala dan Y ialah elektron.

(e) Apakah atom? [1M]

(f) Siapakah ahli sains yang mencadangkan model dalam Rajah 2? [1M]

(g) Apakah penemuan beliau berkenaan model tersebut? [1M]

(h) Kenal pasti X dan Y dalam rajah. [2M]`,
    markingScheme: `(a) Molekul [1M]

(b) Suhu malar apabila sesuatu bahan bertukar daripada keadaan pepejal menjadi cecair pada tekanan tertentu. [1M]

(c) 80°C [1M]

(d) - Tenaga haba diserap [1M]
- Digunakan untuk mengatasi daya tarikan antara zarah sehingga pepejal bertukar menjadi cecair [1M]

(e) Atom ialah jirim yang terdiri daripada zarah terkecil / unit asas jirim [1M]

(f) Niels Bohr [1M]

(g) Elektron di dalam atom bergerak di dalam petala di sekeliling nukleus [1M]

(h) X = Petala [1M], Y = Elektron [1M]`
  },

  {
    id: "f4c2-struct-02",
    title: "Isotop Magnesium & Pengiraan Jisim Atom Relatif",
    topicId: "f4-c2",
    paperType: "struct",
    questionText: `Jadual 1 menunjukkan maklumat tentang isotop magnesium:
- Magnesium-24: Kelimpahan 79.0%, Jisim isotop 24, Nombor proton 12
- Magnesium-25: Kelimpahan 10.0%, Jisim isotop 25, Nombor proton 12
- Magnesium-X: Kelimpahan 11.0%, Jisim isotop X, Nombor proton 12

(a) Nyatakan maksud nombor proton. [1M]

(b) Mengapakah isotop magnesium-24 dan isotop magnesium-25 mempunyai jisim isotop berlainan? [1M]

(c) Lukis struktur atom bagi isotop magnesium-25. [2M]

(d) Hitung jisim isotop bagi magnesium-X.
[Jisim atom relatif magnesium = 24.32] [2M]`,
    markingScheme: `(a) Bilangan proton dalam nukleus sesuatu atom [1M]

(b) Mempunyai bilangan neutron yang berbeza [1M]

(c) - Lukis nukleus atom dengan label 12p 13n yang betul [1M]
- Susunan elektron 2.8.5 yang betul pada petala [1M]

(d) (79.0 × 24) + (10.0 × 25) + (11.0 × X) = 24.32 × 100
1896 + 250 + 11X = 2432
11X = 286
X = 26 [2M] (1M untuk kaedah, 1M untuk jawapan)`
  },

  {
    id: "f4c2-struct-03",
    title: "Simbol Piawai Unsur X, Y, Z — Nombor Proton & Nukleon",
    topicId: "f4-c2",
    paperType: "struct",
    questionText: `Rajah 3 menunjukkan simbol piawai bagi unsur X, Y dan Z:
- Unsur X: Nombor nukleon 12, Nombor proton 6
- Unsur Y: Nombor nukleon 13, Nombor proton 6
- Unsur Z: Nombor nukleon 35, Nombor proton 17

(a) Berapakah bilangan neutron yang terkandung dalam nukleus atom unsur X? [1M]

(b) Tulis susunan elektron bagi atom unsur Z. [1M]

(c) (i) Apakah maksud nombor proton? [1M]
    (ii) Apakah maksud nombor nukleon? [1M]

(d) Unsur yang manakah merupakan isotop? Terangkan jawapan anda. [2M]

(e) Mengapakah atom X dan Y mempunyai sifat kimia yang sama? [1M]`,
    markingScheme: `(a) Neutron = 12 - 6 = 6 [1M]

(b) 2.8.7 [1M]

(c)(i) Bilangan proton dalam nukleus sesuatu atom [1M]
(c)(ii) Hasil tambah bilangan proton dan bilangan neutron dalam nukleus sesuatu atom [1M]

(d) X dan Y merupakan isotop [1M]
Sebab: Atom X dan atom Y mempunyai bilangan proton yang sama (6) tetapi bilangan neutron yang berbeza [1M]

(e) Atom X dan Y mempunyai bilangan elektron valens yang sama (4) [1M]`
  },

  // =========================================================
  // BAB 3: KONSEP MOL, FORMULA DAN PERSAMAAN KIMIA (f4-c3)
  // =========================================================
  {
    id: "f4c3-struct-01",
    title: "Formula Kimia Sebatian Ion & Pengiraan Mol Natrium Karbonat",
    topicId: "f4-c3",
    paperType: "struct",
    questionText: `(a) Lengkapkan jadual berikut dengan menuliskan formula kimia bagi sebatian:
- Natrium karbonat: ___
- Magnesium karbonat: MgCO₃
- Aluminium karbonat: ___ [1M]

(b) Tulis formula bagi kation dan anion yang hadir dalam natrium karbonat. [1M]

(c) Hitungkan jisim formula relatif bagi natrium karbonat.
[Jisim atom relatif: O=16, Na=23, C=12] [1M]

(d) Jisim bagi natrium karbonat ialah 14.2 g.
    (i) Hitungkan bilangan mol natrium karbonat. [1M]
    (ii) Hitungkan bilangan ion natrium dalam natrium karbonat. [1M]`,
    markingScheme: `(a) Natrium karbonat = Na₂CO₃ ; Aluminium karbonat = Al₂(CO₃)₃ [1M]

(b) Kation: Na⁺ ; Anion: CO₃²⁻ [1M]

(c) 2(23) + 12 + 3(16) = 106 g mol⁻¹ [1M]

(d)(i) n = 14.2 / 106 = 0.134 mol ≈ 0.13 mol [1M]

(d)(ii) 1 mol Na₂CO₃ mengandungi 2 mol ion Na⁺
Bilangan ion Na⁺ = 0.134 × 2 × 6.02 × 10²³ = 1.61 × 10²³ [1M]`
  },

  {
    id: "f4c3-essay-01",
    title: "Formula Empirik Magnesium Oksida (Eksperimen)",
    topicId: "f4-c3",
    paperType: "essay",
    questionText: `Satu eksperimen telah dijalankan untuk menentukan formula empirik bagi magnesium oksida. Keputusan eksperimen:

- Jisim mangkuk pijar + penutup = 24.0 g
- Jisim mangkuk pijar + penutup + pita magnesium = 26.4 g
- Jisim mangkuk pijar + penutup + magnesium oksida = 28.0 g

(a) Lukiskan susunan radas bagi eksperimen di atas. [2M]

(b) (i) Berdasarkan keputusan di atas, hitungkan jisim magnesium dan oksigen yang bertindak balas. [1M]
    (ii) Hitungkan nisbah mol bagi atom magnesium terhadap atom oksigen.
         [Jisim atom relatif: O = 16, Mg = 24] [1M]
    (iii) Tentukan formula empirik bagi magnesium oksida. [1M]
    (iv) Tulis persamaan kimia bagi tindak balas dalam eksperimen. [2M]

(c) Mengapa penutup mangkuk pijar perlu dibuka sekali sekala ketika eksperimen? [1M]

(d) Nyatakan satu contoh oksida logam lain yang formula empiriknya boleh ditentukan melalui kaedah yang sama. [1M]`,
    markingScheme: `(a) Rajah berlabel: Mangkuk pijar di atas alas segi tiga tanah liat + kaki retort + penunu Bunsen + penutup [2M]

(b)(i) Jisim Mg = 26.4 - 24.0 = 2.4 g
Jisim O = 28.0 - 26.4 = 1.6 g [1M]

(b)(ii) Mol Mg = 2.4/24 = 0.1 mol
Mol O = 1.6/16 = 0.1 mol
Nisbah Mg:O = 1:1 [1M]

(b)(iii) MgO [1M]

(b)(iv) Formula bahan & hasil betul [1M] + Persamaan seimbang [1M]
2Mg + O₂ → 2MgO

(c) Membenarkan oksigen masuk ke dalam mangkuk pijar untuk membantu pembakaran magnesium [1M]

(d) Zink oksida (ZnO) / Aluminium oksida (Al₂O₃) [1M]`
  },

  {
    id: "f4c3-essay-02",
    title: "Stoikiometri: Tindak Balas Y dengan Oksigen & Persamaan Fe₂O₃",
    topicId: "f4-c3",
    paperType: "essay",
    questionText: `(a) Apakah yang dimaksudkan dengan satu mol? [1M]

(b) 4 g Y bertindak balas lengkap dengan oksigen mengikut persamaan:
    2Y + O₂ → 2YO
    Hitungkan jisim bagi hasil yang terbentuk.
    [Jisim atom relatif: O = 16, Y = 40] [3M]

(c) Seimbangkan persamaan kimia berikut:
    ___ Fe(p) + ___ O₂(g) → Fe₂O₃(p) [1M]

(d) Tafsirkan persamaan Fe₂O₃ itu secara kualitatif dan kuantitatif. [2M]

(e) Alkena E mengandungi 85.7% karbon, 14.3% hidrogen mengikut jisim dan jisim molekul relatif bagi E ialah 42.
    Tentukan formula molekul bagi E.
    [Jisim atom relatif: H = 1, C = 12] [4M]`,
    markingScheme: `(a) Kuantiti suatu bahan yang mengandungi 6.02 × 10²³ zarah (sama dengan bilangan atom dalam 12 g karbon-12) [1M]

(b) Mol Y = 4/40 = 0.1 mol [1M]
2 mol Y : 2 mol YO → 0.1 mol Y : 0.1 mol YO [1M]
Jisim YO = 0.1 × (40+16) = 0.1 × 56 = 5.6 g [1M]

(c) 4Fe + 3O₂ → 2Fe₂O₃ [1M]

(d) Kualitatif: Pepejal ferum bertindak balas dengan gas oksigen menghasilkan pepejal ferum(III) oksida [1M]
Kuantitatif: 4 mol ferum bertindak balas dengan 3 mol oksigen menghasilkan 2 mol ferum(III) oksida [1M]

(e) C: 85.7/12 = 7.14 mol → 1; H: 14.3/1 = 14.3 mol → 2 [1M]
Formula empirik = CH₂ [1M]
Jisim formula empirik = 12+2 = 14; n = 42/14 = 3 [1M]
Formula molekul = C₃H₆ [1M]`
  },

  // =========================================================
  // BAB 4/5: JADUAL BERKALA & IKATAN KIMIA (f4-c4, f4-c5)
  // =========================================================
  {
    id: "f4c45-struct-01",
    title: "Jadual Berkala: Kumpulan 1, 17, 18 & Kereaktifan",
    topicId: "f4-c4",
    paperType: "struct",
    questionText: `Rajah menunjukkan sebahagian Jadual Berkala Unsur. Unsur-unsur dilabelkan A hingga F (bukan simbol sebenar).
A = Kumpulan 18, B & D = Kumpulan 1, C = Kumpulan 16, E = Kumpulan 13, F = Kumpulan 17.

(a) Nyatakan nama lain bagi Kumpulan 17. [1M]

(b) Unsur manakah yang wujud sebagai gas monoatom pada suhu bilik? Berikan sebab. [2M]

(c) (i) Unsur D dan F bertindak balas membentuk satu sebatian. Tuliskan persamaan kimia bagi tindak balas tersebut.
[Jisim atom relatif: D = 23, F = 35] [2M]
    (ii) Jika 0.1 mol unsur D bertindak balas dengan unsur F, kira jisim sebatian yang terbentuk. [1M]

(d) Unsur G berada lebih bawah dalam kumpulan 1 berbanding unsur B dan D.
    Ramalkan kereaktifan unsur G terhadap air. Terangkan. [3M]`,
    markingScheme: `(a) Halogen [1M]

(b) Unsur A (Kumpulan 18 / Gas Nadir) [1M]
Sebab: Atom A sudah mencapai susunan elektron yang stabil (oktet/duplet), tidak perlu berkongsi/menderma/menerima elektron [1M]

(c)(i) 2D + F₂ → 2DF (contoh: 2Na + Cl₂ → 2NaCl) [2M]
(c)(ii) 0.1 mol D → 0.1 mol DF; Jisim = 0.1 × 58 = 5.8 g [1M]

(d) G lebih reaktif daripada D dan B [1M]
Saiz atom G lebih besar, elektron valens G lebih jauh dari nukleus [1M]
Elektron valens G lebih mudah dilepaskan / daya tarikan nukleus terhadap elektron valens lebih lemah [1M]`
  },

  {
    id: "f4c5-struct-01",
    title: "Ikatan Hidrogen, Kovalen & Ikatan Datif dalam NH₃ + HCl",
    topicId: "f4-c5",
    paperType: "struct",
    questionText: `Rajah 3.1 menunjukkan ikatan yang terbentuk antara molekul etanol:
- X = ikatan antara molekul etanol
- Y = ikatan dalam molekul etanol

(a) Nyatakan ikatan X dan ikatan Y. [2M]

(b) Apakah yang dimaksudkan dengan ikatan X yang dinyatakan? [1M]

(c) Apabila gas ammonia (NH₃) dan gas hidrogen klorida (HCl) bercampur, wasap putih terhasil.
    Dengan menggunakan Struktur Lewis, lukiskan pembentukan produk tindak balas dan labelkan ikatan datif yang terbentuk. [2M]

(d) Terangkan pembentukan ikatan datif di dalam ion ammonium, NH₄⁺. [1M]`,
    markingScheme: `(a) X: Ikatan hidrogen [1M]; Y: Ikatan kovalen [1M]

(b) Ikatan hidrogen adalah daya tarikan antara atom hidrogen yang terikat kepada atom yang lebih tinggi keelektronegatifan (N, O atau F) dengan atom N, O atau F dalam molekul lain [1M]

(c) Struktur Lewis menunjukkan [NH₄]⁺ dan [Cl]⁻ [1M]; Label ikatan datif di tempat yang betul (dari N ke H⁺) [1M]

(d) H⁺ dari hidrogen klorida tidak mempunyai elektron [1M]
Pasangan elektron bebas pada atom nitrogen yang tidak terlibat dalam ikatan kovalen akan dikongsi kepada ion hidrogen membentuk ikatan datif [1M] (terima 1M untuk penerangan lengkap)`
  },

  // =========================================================
  // BAB 6: ASID, BES DAN GARAM (f4-c6)
  // =========================================================
  {
    id: "f4c6-struct-01",
    title: "HCl dalam Pelarut Berbeza & Kepekatan Asid Sulfurik",
    topicId: "f4-c6",
    paperType: "struct",
    questionText: `Eksperimen: Gas hidrogen klorida dilarutkan dalam Pelarut K dan Pelarut L.
- Pelarut K: Kertas litmus biru TIADA perubahan
- Pelarut L: Kertas litmus biru bertukar merah

(a) Cadangkan bahan untuk pelarut K dan L. [2M]

(b) Terangkan mengapa kertas litmus biru tidak berubah dalam eksperimen menggunakan pelarut K. [1M]

(c) Dua bikar S dan T diisi dengan asid sulfurik pada kepekatan berbeza:
    S = 0.1 mol dm⁻³; T = 0.001 mol dm⁻³

    (i) Apakah yang dimaksudkan dengan asid? [1M]
    (ii) Terangkan mengapakah asid sulfurik ialah asid kuat? [1M]
    (iii) Larutan manakah memberi nilai pH yang lebih rendah? Terangkan mengapa. [2M]

(d) 25 cm³ larutan kalium hidroksida 0.1 mol dm⁻³ dititratkan dengan larutan S.
    (i) Tulis persamaan kimia bagi tindak balas tersebut. [2M]
    (ii) Hitung isi padu asid sulfurik yang digunakan. [2M]`,
    markingScheme: `(a) K: Metilbenzena / propanon / pelarut organik [1M]; L: Air / air suling [1M]

(b) Tiada ion H⁺ terbentuk kerana HCl tidak mengion dalam pelarut organik [1M]

(c)(i) Bahan yang mengion dalam air menghasilkan ion H⁺ [1M]
(c)(ii) Asid sulfurik mengion lengkap dalam air menghasilkan kepekatan ion H⁺ yang tinggi [1M]
(c)(iii) S memberi pH lebih rendah [1M]; Kepekatan ion H⁺ dalam S lebih tinggi daripada T [1M]

(d)(i) 2KOH + H₂SO₄ → K₂SO₄ + 2H₂O [1M formula betul + 1M seimbang]

(d)(ii) Mol KOH = 0.1 × 25/1000 = 0.0025 mol
2 mol KOH : 1 mol H₂SO₄
Mol H₂SO₄ = 0.00125 mol
Isi padu = 0.00125/0.1 × 1000 = 12.5 cm³ [1M kaedah + 1M jawapan]`
  },

  {
    id: "f4c6-essay-01",
    title: "Ujian Ion Logam Berat (Pb²⁺ & Zn²⁺) dalam Air Sisa Industri",
    topicId: "f4-c6",
    paperType: "essay",
    questionText: `Carta alir menunjukkan ujian kehadiran ion logam berat dalam air sisa buangan industri:

Ujian 1: + KI → Mendakan kuning Q → Ion Pb²⁺ hadir
Ujian 2: + NH₃ → Mendakan putih → + NH₃ berlebihan → Mendakan putih larut → Ion R hadir

(a) Apakah maksud kation? [1M]

(b) Berdasarkan Ujian 1:
    (i) Namakan mendakan kuning Q yang terbentuk. [1M]
    (ii) Apakah yang akan berlaku sekiranya mendakan tersebut dipanaskan dan disejukkan semula? [2M]
    (iii) Tuliskan persamaan ion untuk pembentukan mendakan Q. [2M]
    (iv) Sekiranya 0.0002 mol larutan kalium iodida ditambahkan, hitung jisim mendakan Q yang terbentuk.
         [Jisim molar Q = 461 g mol⁻¹] [2M]

(c) Berdasarkan Ujian 2, kenal pasti ion R. [1M]

(d) Air buangan industri mungkin mengandungi ion kuprum(II). Huraikan secara ringkas ujian kimia untuk mengesahkan kehadiran ion Cu²⁺. [2M]`,
    markingScheme: `(a) Ion bercas positif [1M]

(b)(i) Plumbum(II) iodida / PbI₂ [1M]
(b)(ii) Mendakan kuning akan larut apabila dipanaskan [1M]; Mendakan kuning akan muncul semula apabila disejukkan [1M]
(b)(iii) Pb²⁺ + 2I⁻ → PbI₂ [1M persamaan + 1M seimbang]
(b)(iv) Mol KI = 0.0002 mol → mol I⁻ = 0.0002; 2 mol I⁻ : 1 mol PbI₂
Mol PbI₂ = 0.0001 mol; Jisim = 0.0001 × 461 = 0.0461 g [1M kaedah + 1M jawapan]

(c) Ion Zn²⁺ [1M]

(d) Tambah larutan natrium hidroksida berlebihan atau larutan ammonia berlebihan ke dalam sampel [1M]
Mendakan biru terbentuk (NaOH) / Mendakan biru tua terbentuk (NH₃ berlebihan) [1M]`
  },

  // =========================================================
  // BAB 7: KADAR TINDAK BALAS (f4-c7)
  // =========================================================
  {
    id: "f4c7-essay-01",
    title: "Kadar Tindak Balas: Zink + Asid Nitrik & Kesan Mangkin H₂O₂",
    topicId: "f4-c7",
    paperType: "essay",
    questionText: `Aufa menjalankan dua set eksperimen tindak balas antara zink dan asid nitrik:

Set I: Serbuk zink + 20 cm³ asid nitrik 1.0 mol dm⁻³ → Masa = 20 saat
Set II: Serbuk zink + 50 cm³ asid nitrik 0.4 mol dm⁻³ → Masa = 50 saat

(a)(i) Nyatakan maksud kadar tindak balas dan satu faktor yang mempengaruhi kadar tindak balas.
       Tulis persamaan kimia yang seimbang bagi tindak balas di Set I. [4M]

(a)(ii) Hitung kadar tindak balas purata bagi Set I dan Set II.
        Bandingkan kadar tindak balas menggunakan teori perlanggaran. [7M]

(b) Satu eksperimen lain mengkaji kesan mangkin dalam tindak balas penguraian hidrogen peroksida (H₂O₂).
    Graf menunjukkan Set A (kadar lebih tinggi) dan Set B (kadar lebih rendah).

    (i) Set eksperimen manakah menggunakan mangkin? Namakan mangkin yang digunakan. [2M]

    (ii) Tindak balas penguraian H₂O₂ adalah eksotermik. Lukis gambar rajah profil tenaga bagi kedua-dua set.
         Labelkan E'ₐ (tenaga pengaktifan dengan mangkin) dan Eₐ (tanpa mangkin).
         Berdasarkan teori perlanggaran, terangkan kesan penggunaan mangkin terhadap kadar tindak balas. [7M]`,
    markingScheme: `(a)(i) Kadar tindak balas = isipadu gas yang terbebas per unit masa [1M]
Faktor: kepekatan / suhu / saiz zarah / mangkin [1M]
Zn + 2HNO₃ → Zn(NO₃)₂ + H₂ [2M — 1M formula betul, 1M seimbang]

(a)(ii) Kadar Set I = 50/20 = 2.5 cm³ s⁻¹ [1M]
Kadar Set II = 50/50 = 1.0 cm³ s⁻¹ [1M]
Kadar Set I lebih tinggi [1M]
Kepekatan asid dalam Set I lebih tinggi [1M]
Bilangan ion H⁺ per unit isipadu dalam Set I lebih tinggi [1M]
Frekuensi perlanggaran antara ion H⁺ dengan atom Zn lebih tinggi [1M]
Frekuensi perlanggaran berkesan lebih tinggi → kadar tindak balas lebih tinggi [1M]

(b)(i) Set A menggunakan mangkin [1M]; Mangan(IV) oksida / MnO₂ [1M]

(b)(ii) Graf profil tenaga yang betul dengan Eₐ > E'ₐ [3M]
Kehadiran mangkin menyediakan lintasan alternatif dengan tenaga pengaktifan lebih rendah [1M]
Lebih banyak zarah mencapai tenaga pengaktifan [1M]
Frekuensi perlanggaran berkesan bertambah [1M]
Kadar tindak balas bertambah [1M]`
  },

  {
    id: "f4c7-essay-02",
    title: "Graf Isi Padu CO₂ vs Masa — Dua Eksperimen",
    topicId: "f4-c7",
    paperType: "essay",
    questionText: `Dua set eksperimen mengumpul gas karbon dioksida:

Eksperimen I (masa 0-270s): 0, 14.0, 23.0, 27.5, 32.0, 35.0, 37.0, 40.0, 40.0, 40.0 cm³
Eksperimen II (masa 0-270s): 0, 19.0, 28.0, 33.0, 35.0, 38.5, 40.0, 40.0, 40.0, 40.0 cm³

(a)(i) Hitung kadar tindak balas purata bagi Eksperimen I dan II.
       Bandingkan kadar tindak balas. Nyatakan DUA faktor yang mempengaruhi kadar tindak balas. [5M]

(a)(ii) Plot graf untuk menunjukkan perbandingan antara kedua-dua eksperimen pada paksi yang sama. [3M]

(b) Eksperimen I ialah tindak balas antara serbuk kalsium karbonat berlebihan dengan 25 cm³ asid hidroklorik.
    Tulis persamaan kimia seimbang dan hitung kepekatan asid hidroklorik.
    [1 mol gas menempati 24 dm³ mol⁻¹ pada keadaan bilik] [5M]

(c) Cadangkan DUA faktor yang boleh dimanipulasikan untuk menghasilkan keputusan seperti Eksperimen II.
    Terangkan menggunakan teori perlanggaran. [7M]`,
    markingScheme: `(a)(i) Kadar Eksp I = 40/210 = 0.190 cm³ s⁻¹ [1M]; Kadar Eksp II = 40/180 = 0.222 cm³ s⁻¹ [1M]
Kadar Eksp II lebih tinggi daripada Eksp I [1M]
Dua faktor: kepekatan / suhu / saiz zarah / mangkin [2M]

(a)(ii) Label paksi x dan y [1M]; Plot kedua-dua graf dengan label betul [2M]

(b) CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂ [2M]
Mol CO₂ = 0.04/24 = 0.00167 mol [1M]
Mol HCl = 0.00167 × 2 = 0.00334 mol [1M]
Kepekatan HCl = 0.00334/0.025 = 0.134 mol dm⁻³ [1M]

(c) Faktor 1 — Suhu [1M]: Suhu tinggi → tenaga kinetik zarah bertambah [1M] → lebih banyak zarah mencapai tenaga pengaktifan [1M] → frekuensi perlanggaran berkesan bertambah [1M]
Faktor 2 — Saiz zarah [1M]: Zarah lebih kecil/serbuk → luas permukaan total bertambah [1M] → lebih banyak perlanggaran berkesan berlaku [1M]`
  },

  // =========================================================
  // BAB 8: BAHAN BUATAN DALAM INDUSTRI (f4-c8)
  // =========================================================
  {
    id: "f4c8-struct-01",
    title: "Aloi: Gangsa, Loyang & Duralumin",
    topicId: "f4-c8",
    paperType: "struct",
    questionText: `Jadual menunjukkan komposisi tiga jenis aloi:
- R (Gangsa): 90% Kuprum + 10% Timah → Kegunaan: Trofi
- Loyang: 70% Kuprum + 30% Zink → Kegunaan: Kunci
- Duralumin: 93% Al + 3% Cu + 3% Mg + 1% Mn → Kegunaan: Badan kapal terbang

(a) Namakan R. [1M]

(b) Cadangkan aloi yang sesuai untuk basikal lumba Ahmad. Berikan alasan anda. [2M]

(c) Anda diberikan kunci gangsa dan kunci loyang, masing-masing 140 g. Hitung jisim kuprum dalam setiap kunci. [2M]

(d) Eksperimen membandingkan kekerasan antara gangsa dan kuprum tulen menggunakan bebola keluli jatuh:
    - Kuprum: diameter lekuk 0.8 cm
    - Gangsa: diameter lekuk 0.6 cm
    Jelaskan perbezaan diameter lekuk yang terbentuk. [2M]`,
    markingScheme: `(a) Gangsa / Bronze [1M]

(b) Duralumin [1M]; Lebih ringan (93% aluminium), keras, tidak berkarat — sesuai untuk basikal lumba yang memerlukan kelajuan [1M]

(c) Kunci gangsa: 90/100 × 140 = 126 g kuprum [1M]
Kunci loyang: 70/100 × 140 = 98 g kuprum [1M]

(d) Kuprum tulen terdiri daripada atom yang sama saiz, mudah menggelongsor → lekuk lebih besar [1M]
Gangsa terdiri daripada atom berbeza saiz (Cu + Sn), sukar menggelongsor → lebih keras → lekuk lebih kecil [1M]`
  },

  {
    id: "f4c8-struct-02",
    title: "Jenis Kaca, Seramik, Bahan Komposit & Superkonduktor",
    topicId: "f4-c8",
    paperType: "struct",
    questionText: `(a) Namakan komponen utama kaca. [1M]

(b) Padankan jenis kaca dengan kegunaannya:
    1. Kaca borosilikat → ___
    2. ___ → Lampu hiasan, Prisma
    3. ___ → Botol, Cermin [2M]

(c) Dua pasang cermin mata: Y (kaca silika terlakur) dan Z (kaca fotokromik bertukar gelap bila terkena cahaya matahari).
    (i) Nyatakan DUA bahan fotokromik yang digunakan dalam cermin mata Z. [2M]
    (ii) Nyatakan kelebihan kaca fotokromik tersebut. [1M]

(d) Jadual menunjukkan bahan komposit V, W dan X:
    V: Kaca + kuprum(I) klorida + argentum klorida
    W: Itrium(III) karbonat + barium karbonat + kuprum(II) karbonat + oksigen
    X: Konkrit + keluli
    Kenal pasti bahan komposit V, W dan X. [3M]`,
    markingScheme: `(a) Silika / Silikon dioksida / SiO₂ [1M]

(b) 1. Kaca borosilikat → Alatan memasak, Radas kaca makmal [1M]
2. Kaca plumbum → Lampu hiasan, Prisma [1M — terima jawapan separa]
3. Kaca soda kapur → Botol, Cermin [satu betul = 1M, dua betul = 2M untuk soalan (b)]

(c)(i) Argentum klorida (AgCl) [1M]; Kuprum(I) klorida (CuCl) [1M]
(c)(ii) Melindungi mata pengguna daripada sinaran UV [1M]

(d) V: Kaca fotokromik [1M]
W: Superkonduktor [1M]
X: Konkrit diperkukuhkan / Reinforced concrete [1M]`
  },

  // =========================================================
  // BAB 9: KESEIMBANGAN REDOKS (f5-c1a, f5-c1b)
  // =========================================================
  {
    id: "f5c1-struct-01",
    title: "Sel Kimia Zink-Kuprum: Notasi, E° Sel & Penyaduran",
    topicId: "f5-c1b",
    paperType: "struct",
    questionText: `Rajah menunjukkan susunan radas sel kimia: elektrod zink dalam larutan zink nitrat 1.0 mol dm⁻³ dan elektrod kuprum dalam larutan kuprum(II) sulfat 1.0 mol dm⁻³, disambungkan melalui pasu berliang.

Siri Keupayaan Elektrod Piawai:
- Mg²⁺ + 2e ⇌ Mg: E° = -2.38 V
- Zn²⁺ + 2e ⇌ Zn: E° = -0.76 V
- Fe²⁺ + 2e ⇌ Fe: E° = -0.44 V
- Cu²⁺ + 2e ⇌ Cu: E° = +0.34 V

(a) Nyatakan warna bagi larutan kuprum(II) sulfat. [1M]

(b) Kenal pasti semua kation yang hadir dalam pasu berliang. [1M]

(c)(i) Tuliskan notasi sel untuk tindak balas itu. [2M]
   (ii) Hitung nilai E° sel bagi tindak balas itu. [1M]
   (iii) Apa yang perlu dilakukan pada anod untuk meningkatkan nilai E° sel? Terangkan. [3M]

(d) Rajah menunjukkan penyaduran kunci besi menggunakan larutan CuSO₄ dan elektrod kuprum.
    Set I: kunci besi sebagai katod; Set II: kunci besi sebagai anod.
    Terangkan perbezaan pemerhatian pada kunci besi bagi kedua-dua set. [2M]`,
    markingScheme: `(a) Biru [1M]

(b) Ion Kuprum(II) Cu²⁺ dan ion Hidrogen H⁺ [1M]

(c)(i) Zn(p) | Zn²⁺(ak) || Cu²⁺(ak) | Cu(p) [2M]
(c)(ii) E° sel = E° katod - E° anod = +0.34 - (-0.76) = +1.10 V [1M]
(c)(iii) Gantikan elektrod zink dengan elektrod magnesium [1M]; Nilai E° magnesium (-2.38 V) lebih negatif daripada zink [1M]; Perbezaan E° antara Mg dan Cu lebih besar → E° sel lebih tinggi [1M]

(d) Set I (kunci = katod): Lapisan perang kuprum terbentuk pada kunci besi [1M]
Set II (kunci = anod): Kunci besi menjadi nipis/larut kerana ion Fe²⁺ dibebaskan ke larutan [1M]`
  },

  {
    id: "f5c1-essay-01",
    title: "Elektrolisis CuSO₄ dan CuCl₂ dengan Elektrod Karbon",
    topicId: "f5-c1b",
    paperType: "essay",
    questionText: `Dua eksperimen elektrolisis menggunakan elektrod karbon:
- Eksperimen I: Larutan kuprum(II) sulfat 1.0 mol dm⁻³
- Eksperimen II: Larutan kuprum(II) klorida 1.0 mol dm⁻³
Pemerhatian katod (kedua-dua): Enapan perang terbentuk.

(a) Nyatakan kation yang hadir dalam larutan kuprum(II) klorida. [1M]

(b) Nyatakan pemerhatian di anod bagi kedua-dua eksperimen. [2M]

(c) Berdasarkan Eksperimen I:
    (i) Namakan gas yang terbebas di anod. [1M]
    (ii) Cadangkan satu ujian untuk mengesahkan gas tersebut. [2M]

(d) Berdasarkan Eksperimen II:
    (i) Nyatakan ion yang dipilih untuk dinyahcaskan di anod. Berikan sebab. [2M]
    (ii) Tulis setengah persamaan untuk tindak balas di anod. [1M]
    (iii) Nyatakan hasil yang terbentuk di anod. [1M]`,
    markingScheme: `(a) Ion kuprum(II) Cu²⁺ dan ion hidrogen H⁺ [1M]

(b) Eksp I: Gas tidak berwarna dibebaskan di anod [1M]
Eksp II: Gas kuning kehijauan dibebaskan di anod [1M]

(c)(i) Oksigen [1M]
(c)(ii) Masukkan kayu uji berbara ke dalam tabung uji berhampiran anod [1M]; Kayu uji berbara menyala semula [1M]

(d)(i) Ion klorin Cl⁻ [1M]; Kepekatan ion Cl⁻ lebih tinggi daripada ion OH⁻, ion Cl⁻ lebih mudah dinyahcaskan [1M]
(d)(ii) 2Cl⁻ → Cl₂ + 2e [1M]
(d)(iii) Gas klorin / Cl₂ [1M]`
  },

  // =========================================================
  // BAB 10: SEBATIAN KARBON (f5-c2)
  // =========================================================
  {
    id: "f5c2-struct-01",
    title: "Struktur Alkana & Alkena: Penamaan IUPAC & Isomer",
    topicId: "f5-c2",
    paperType: "struct",
    questionText: `Rajah menunjukkan formula struktur dua hidrokarbon:
Sebatian X: H-C-C-C-C-H (rantai lurus, 4C, semua ikatan tunggal)
Sebatian Y: H-C=C-C-C-H (ikatan ganda dua di C1-C2, 4C)

(a)(i) Nyatakan siri homolog bagi sebatian Y. [1M]
   (ii) Nyatakan nama sebatian X dan sebatian Y menggunakan penamaan IUPAC. [2M]
   (iii) Lukis formula struktur untuk SATU lagi isomer sebatian X. [1M]
   (iv) Namakan proses bagi penukaran sebatian Y kepada sebatian X. [1M]

(b)(i) Bandingkan kejelagaan nyalaan semasa pembakaran hidrokarbon X dan Y dalam oksigen berlebihan. [1M]
   (ii) Terangkan mengapa terdapat perbezaan kejelagaan hidrokarbon X dan Y.
        [Jisim atom relatif: C = 12, H = 1] [2M]
   (iii) Tuliskan persamaan kimia yang seimbang bagi pembakaran sebatian Y. [2M]`,
    markingScheme: `(a)(i) Alkena [1M]
(a)(ii) Sebatian X = Butana [1M]; Sebatian Y = But-1-ena [1M]
(a)(iii) 2-metilpropana (isobutana) — lukis struktur bercabang [1M]
(a)(iv) Tindak balas penghidrogenan [1M]

(b)(i) Hidrokarbon Y menghasilkan lebih banyak jelaga berbanding hidrokarbon X [1M]
(b)(ii) % jisim karbon X (C₄H₁₀) = 48/58 × 100 = 82.76%; % jisim karbon Y (C₄H₈) = 48/56 × 100 = 85.71% [1M]; Y mempunyai % jisim karbon lebih tinggi → lebih banyak jelaga [1M]
(b)(iii) C₄H₈ + 6O₂ → 4CO₂ + 4H₂O [2M — 1M formula betul, 1M seimbang]`
  },

  {
    id: "f5c2-essay-01",
    title: "Sebatian Karbon: Alkohol, Ester & Asid Karboksilik",
    topicId: "f5-c2",
    paperType: "essay",
    questionText: `Rajah menunjukkan carta alir tindak balas melibatkan sebatian karbon:
Sebatian P (C₄H₈) ← Pendehidratan ← Sebatian Q → Pengoksidaan (+KMnO₄ berasid) → Sebatian R

(a)(i) Nyatakan siri homolog bagi sebatian P. [1M]
   (ii) Lukiskan formula struktur bagi 2 isomer sebatian P dan namakan kedua-duanya. [4M]

(b)(i) Sebatian Q ditukarkan ke sebatian P melalui pendehidratan. Lukiskan gambar rajah berlabel radas yang digunakan. [2M]
   (ii) Tuliskan persamaan kimia bagi tindak balas pendehidratan dalam carta alir. [2M]

(c) Sebatian Q dan sebatian R ialah cecair tidak berwarna dan sukar dibezakan.
    Huraikan bagaimana anda dapat membezakan antara sebatian Q dan sebatian R berdasarkan sifat kimia. [3M]`,
    markingScheme: `(a)(i) Alkena [1M]
(a)(ii) But-1-ena (struktur betul) [1M + 1M nama]; But-2-ena (struktur betul) [1M + 1M nama]
(Terima juga 2-metilprop-1-ena)

(b)(i) Rajah berlabel: tabung didih + serpihan porselin + kapas + penampung gas + penunu Bunsen [2M]
(b)(ii) C₄H₉OH → C₄H₈ + H₂O (dengan kehadiran Al₂O₃/H₃PO₄ panas) [2M]

(c) Tambahkan kalsium karbonat (serbuk) ke dalam sebatian Q dan R berasingan [1M]
Sebatian R (asid karboksilik) akan menghasilkan pembuakan / gas CO₂ keluar [1M]
Sebatian Q (alkohol) tidak menunjukkan sebarang perubahan [1M]`
  },

  // =========================================================
  // BAB 11: TERMOKIMIA (f5-c3)
  // =========================================================
  {
    id: "f5c3-struct-01",
    title: "Haba Peneutralan HCl + NaOH & Kesan Alkali Lemah",
    topicId: "f5-c3",
    paperType: "struct",
    questionText: `Rajah menunjukkan: 50 cm³ asid hidroklorik 1.0 mol dm⁻³ + 50 cm³ larutan natrium hidroksida 1.0 mol dm⁻³ dalam cawan polistirena. Suhu campuran meningkat daripada 29.0°C kepada 35.5°C.

(a)(i) Nyatakan definisi bagi haba peneutralan. Apakah jenis tindak balas ini? [2M]

(a)(ii) Hitung haba peneutralan.
[Muatan haba tentu larutan = 4.2 J g⁻¹°C⁻¹; ketumpatan larutan = 1 g cm⁻³] [4M]

(a)(iii) Nilai haba peneutralan yang diperoleh di makmal adalah lebih rendah daripada nilai teorinya (-57 kJ mol⁻¹). Beri sebab. [1M]

(a)(iv) Bina gambar rajah aras tenaga bagi tindak balas itu. [2M]

(a)(v) Ramalkan haba peneutralan apabila larutan natrium hidroksida diganti dengan larutan ammonia. Terangkan jawapan anda. [3M]`,
    markingScheme: `(a)(i) Perubahan haba apabila 1 mol air terbentuk daripada tindak balas peneutralan asid dan alkali [1M]; Tindak balas eksotermik [1M]

(a)(ii) Perubahan suhu = 35.5 - 29.0 = 6.5°C [1M]
Mol HCl/NaOH = 0.05 mol [1M]
Q = (50+50) × 4.2 × 6.5 = 2730 J [1M]
ΔH = -2730/0.05 = -54,600 J mol⁻¹ = -54.6 kJ mol⁻¹ [1M]

(a)(iii) Haba terbebas ke persekitaran / diserap oleh radas eksperimen [1M]

(a)(iv) Gambar rajah aras tenaga eksotermik: HCl + NaOH lebih tinggi, ΔH = -54.6 kJ mol⁻¹, NaCl + H₂O lebih rendah [2M]

(a)(v) Nilai haba peneutralan lebih rendah daripada -54.6 kJ mol⁻¹ [1M]
Ammonia adalah alkali lemah yang mengion separa dalam air [1M]
Sebahagian haba yang dibebaskan diserap untuk mengionkan molekul ammonia sepenuhnya [1M]`
  },

  {
    id: "f5c3-essay-01",
    title: "Haba Penyesaran Kuprum & Pek Panas/Sejuk",
    topicId: "f5-c3",
    paperType: "essay",
    questionText: `Rajah menunjukkan susunan radas untuk menentukan haba penyesaran bagi kuprum: serbuk logam K berlebihan ditambah ke dalam 100 cm³ larutan kuprum(II) sulfat 0.5 mol dm⁻³. Suhu meningkat dari 29.0°C ke 32.0°C.

(a)(i) Nyatakan maksud haba penyesaran.
       Apabila serbuk logam K ditambah ke dalam larutan kuprum(II) sulfat, warna biru larutan tidak berubah.
       Cadangkan serbuk logam K yang sesuai dan nyatakan pemerhatian lain. [3M]

(a)(ii) Hitung haba penyesaran bagi tindak balas tersebut.
[Muatan haba tentu larutan = 4.2 J g⁻¹°C⁻¹; ketumpatan larutan = 1 g cm⁻³] [4M]

(b)(i) Bandingkan tindak balas dalam Situasi A (pek panas) dan Situasi B (pek sejuk) dari segi:
       - Jenis tindak balas
       - Perubahan haba
       - Perubahan suhu
       - Jumlah kandungan tenaga bahan tindak balas dan hasil [4M]

(b)(ii) Huraikan satu eksperimen untuk menentukan perubahan suhu apabila bahan dilarutkan dalam air suling.
        Cadangkan bagaimana menghasilkan produk pek sejuk menggunakan salah satu bahan:
        Ammonium nitrat / Kalium nitrat / Pelet natrium hidroksida / Air suling. [9M]`,
    markingScheme: `(a)(i) Perubahan haba apabila 1 mol logam disesarkan daripada larutan garamnya oleh logam yang lebih elektropositif [1M]
Logam K yang sesuai: Mg / Al / Zn / Fe (yang lebih elektropositif daripada Cu) [1M]
Pemerhatian lain: Bacaan termometer meningkat / serbuk logam K larut / warna larutan menjadi pudar [1M]

(a)(ii) ΔT = 32.0 - 29.0 = 3.0°C [1M]
Mol Cu²⁺ = 0.5 × 0.1 = 0.05 mol [1M]
Q = 100 × 4.2 × 3.0 = 1260 J [1M]
ΔH = -1260/0.05 = -25,200 J mol⁻¹ = -25.2 kJ mol⁻¹ [1M]

(b)(i) A (pek panas): Eksotermik [1M]; Haba dibebaskan ke persekitaran; Suhu meningkat; Kandungan tenaga bahan tindak balas > hasil [1M]
B (pek sejuk): Endotermik [1M]; Haba diserap; Suhu menurun; Kandungan tenaga bahan tindak balas < hasil [1M]

(b)(ii) Prosedur (sukat 20 cm³ air, rekod suhu awal, tambah bahan, kacau, rekod suhu) [3M]
Penjadualan data [2M]
Cadangan pek sejuk: Ammonium nitrat (tindak balas endotermik) [1M] — pilihan betul [1M]; penjelasan kenapa suhu turun [1M]; cara pembungkusan dua beg [1M]; jumlah 9M]`
  },

  // =========================================================
  // BAB 12: POLIMER (f5-c4)
  // =========================================================
  {
    id: "f5c4-struct-01",
    title: "Polimer Semula Jadi & Sintetik: PVC, Getah, Nilon",
    topicId: "f5-c4",
    paperType: "struct",
    questionText: `Jadual menunjukkan polimer dan monomernya:
- K: Monomer = Stirena
- Selulosa: Monomer = Glukosa
- L: Monomer = Asid amino
- Polivinil klorida (PVC): Monomer = Vinil klorida

(a)(i) Namakan polimer K dan L. [2M]
   (ii) Kelaskan polimer-polimer di atas mengikut sumbernya (sintetik/semula jadi). [2M]

(b) PVC ialah contoh termoplastik.
    (i) Apakah termoplastik? [1M]
    (ii) Lukis struktur monomer PVC dan tulis nama monomernya mengikut IUPAC. [2M]
    (iii) Berikan satu sebab mengapa PVC tidak sesuai dilupuskan dengan pembakaran. [1M]

(c) Getah asli sangat lembut dan tidak tahan haba. Huraikan secara ringkas bagaimana anda dapat memperbaiki sifat getah asli agar menghasilkan barangan yang lebih bermutu. [2M]`,
    markingScheme: `(a)(i) K = Polistirena [1M]; L = Protein [1M]
(a)(ii) Polimer sintetik: Polistirena, PVC [1M]; Polimer semula jadi: Selulosa, Protein [1M]

(b)(i) Plastik yang bertukar menjadi lembut apabila dipanaskan dan menjadi keras apabila disejukkan, dan proses ini boleh dilakukan berulang kali [1M]
(b)(ii) Struktur CH₂=CHCl yang betul [1M]; Nama IUPAC: Kloroetena / Chloroethene [1M]
(b)(iii) Pembakaran PVC menghasilkan gas beracun dan berasid (gas HCl) yang mencemarkan udara [1M]

(c) Rendamkan kepingan getah asli ke dalam larutan disulfur diklorida (S₂Cl₂) selama 5 minit [1M]; Rangkai silang sulfur terbentuk di antara rantai polimer → getah tervulkan lebih keras, kenyal, tahan haba [1M]`
  },

  // =========================================================
  // BAB 13: KIMIA KONSUMER DAN INDUSTRI (f5-c5)
  // =========================================================
  {
    id: "f5c5-struct-01",
    title: "Sabun, Detergen & Bahan Tambah Makanan",
    topicId: "f5-c5",
    paperType: "struct",
    questionText: `(a) Proses X: Minyak sawit + Alkali pekat → Bahan X + Sabun
    (i) Apakah nama tindak balas di atas? [1M]
    (ii) Sabun yang terhasil adalah kalium palmitat. Apakah alkali yang perlu digunakan? [1M]

(b) Pembantu rumah menggunakan banyak sabun untuk mencuci pakaian tetapi tidak berkesan.
    Dengan pengetahuan kimia anda, bagaimana anda membantu mengatasi masalah tersebut? Terangkan. [3M]

(c) Label pada botol sos cili: Cili, gula, garam, tepung jagung, pewarna tiruan dan natrium benzoat.
    (i) Nyatakan jenis bahan tambah makanan bagi natrium benzoat dan fungsinya. [2M]
    (ii) Apakah kesan pengambilan natrium benzoat secara berlebihan dalam tempoh masa yang panjang? [1M]

(d) Selepas mengambil makanan laut, Ali mengalami kegatalan dan hidung berair.
    Apakah yang dialami oleh Ali? Nyatakan jenis ubat yang perlu diambil untuk meredakan gejala tersebut. [2M]`,
    markingScheme: `(a)(i) Saponifikasi [1M]
(a)(ii) Kalium hidroksida / KOH [1M]

(b) Gunakan detergen sebagai ganti sabun [1M]; Anion detergen bertindak balas dengan ion Ca²⁺ dan Mg²⁺ dalam air liat untuk membentuk garam yang larut dalam air [1M]; Tidak membentuk kekat / berkesan dalam air liat [1M]

(c)(i) Jenis: Pengawet [1M]; Fungsi: Merencatkan / membantutkan pertumbuhan bakteria untuk memanjangkan jangka hayat makanan [1M]
(c)(ii) Menyebabkan alahan / meningkatkan risiko penyakit asma [1M]

(d) Alergik / tindak balas alergi [1M]; Ubat antialergi / antihistamin [1M]`
  },

  {
    id: "f5c5-essay-01",
    title: "Marjerin, Lemak Tepu & Teknologi Hijau Grafen",
    topicId: "f5-c5",
    paperType: "essay",
    questionText: `(a) Rajah menunjukkan proses menyediakan marjerin daripada minyak kelapa sawit melalui Proses X dengan Mangkin Y.
    Namakan Proses X dan Mangkin Y. [2M]

(b) Poster "Sayangi Jantung Anda" mengesyorkan: lebih minyak sayuran, kurang lemak haiwan.
    Minyak sayuran dan lemak haiwan mengandungi lemak tepu dan lemak tak tepu.
    Berdasarkan poster, kenal pasti lemak yang boleh menyebabkan perubahan keadaan arteri. Terangkan mengapa. [4M]

(c) Rajah menunjukkan helaian grafen (saiz 0.142 nm antara atom karbon).
    (i) Apakah maksud nanoteknologi? [1M]
    (ii) Terangkan mengapa grafen sesuai digunakan dalam pembuatan sensor. [1M]

(d) Bateri litium-ion yang dipertingkatkan dengan grafen boleh digunakan sebagai peranti storan tenaga kenderaan elektrik.
    Nyatakan TIGA ciri istimewa penggunaan grafen dalam peranti storan tenaga. [3M]`,
    markingScheme: `(a) Proses X: Penghidrogenan [1M]; Mangkin Y: Nikel / Platinum [1M]

(b) Lemak tepu [1M]; Lemak tepu wujud sebagai pepejal pada suhu bilik [1M]; Lemak tepu berkumpul / mendap di dinding arteri [1M]; Arteri menjadi sempit atau tersumbat → masalah jantung [1M]

(c)(i) Pembangunan bahan atau peranti dengan memanfaatkan ciri-ciri zarah berskala nano (1-100 nm) [1M]
(c)(ii) Grafen mempunyai luas permukaan yang sangat tinggi/besar → lebih sensitif untuk mengesan perubahan [1M]

(d) Tiga daripada yang berikut [3M]:
- Membolehkan kapasiti penyimpanan/storan yang lebih besar (superkapasitor)
- Keupayaan pengecasan yang lebih pantas
- Jangka hayat bateri yang lebih lama
- Ringan dan fleksibel
- Pengalir elektrik yang sangat baik`
  },

];
