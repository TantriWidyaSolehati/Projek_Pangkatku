export const prerequisiteLessons = [
  {
    id: "prereq-multiply", title: "Perkalian bilangan bulat", duration: "5 menit", icon: "×",
    description: "Perkalian adalah penjumlahan berulang. Tanda bilangan menentukan tanda hasilnya.",
    formula: "3 × 4 = 4 + 4 + 4 = 12",
    example: "Negatif × negatif menghasilkan positif: (−2) × (−3) = 6.",
    practice: { prompt: "(−3) × 4 = ?", answer: "-12" },
  },
  {
    id: "prereq-divide", title: "Pembagian bilangan bulat", duration: "5 menit", icon: "÷",
    description: "Pembagian membagi suatu jumlah menjadi beberapa kelompok sama besar.",
    formula: "12 ÷ 3 = 4",
    example: "Tanda berbeda menghasilkan negatif: (−15) ÷ 3 = −5.",
    practice: { prompt: "(−24) ÷ (−6) = ?", answer: "4" },
  },
  {
    id: "prereq-fraction", title: "Mengenal pecahan", duration: "6 menit", icon: "½",
    description: "Pecahan menunjukkan bagian dari keseluruhan. Pembilang di atas, penyebut di bawah.",
    formula: "\\frac{1}{2} = 1 ÷ 2",
    example: "Pada ¾, angka 3 adalah pembilang dan 4 adalah penyebut.",
    practice: { prompt: "Pada pecahan ⅗, berapa penyebutnya?", answer: "5" },
  },
  {
    id: "prereq-fraction-multiply", title: "Perkalian pecahan", duration: "6 menit", icon: "×",
    description: "Kalikan pembilang dengan pembilang dan penyebut dengan penyebut.",
    formula: "\\frac{a}{b} × \\frac{c}{d} = \\frac{ac}{bd}",
    example: "\\frac{1}{2} × \\frac{2}{3} = \\frac{2}{6} = \\frac{1}{3}",
    practice: { prompt: "½ × ⅓ = ? (jawab 1/6)", answer: "1/6" },
  },
  {
    id: "prereq-fraction-divide", title: "Pembagian pecahan", duration: "6 menit", icon: "÷",
    description: "Membagi dengan pecahan sama dengan mengalikan dengan kebalikannya.",
    formula: "\\frac{a}{b} ÷ \\frac{c}{d} = \\frac{a}{b} × \\frac{d}{c}",
    example: "\\frac{1}{2} ÷ \\frac{1}{4} = \\frac{1}{2} × \\frac{4}{1} = 2",
    practice: { prompt: "½ ÷ ¼ = ?", answer: "2" },
  },
  {
    id: "prereq-pattern", title: "Pola perkalian berulang", duration: "5 menit", icon: "↗",
    description: "Perkalian bilangan yang sama berulang dapat ditulis lebih ringkas sebagai perpangkatan.",
    formula: "2 × 2 × 2 × 2 = 2⁴",
    example: "Angka 2 dikalikan sebanyak empat kali, sehingga pangkatnya adalah 4.",
    practice: { prompt: "5 × 5 × 5 dapat ditulis sebagai 5 pangkat berapa?", answer: "3" },
  },
];

export const lessons = [
  {
    id: "lesson-intro", title: "Mengenal bilangan berpangkat", chapter: 1, duration: "8 menit",
    description: "Kenali bilangan pokok, pangkat, dan cara membaca bentuk perpangkatan.",
    sections: [
      { heading: "Apa itu bilangan berpangkat?", text: "Bilangan berpangkat adalah cara ringkas menulis perkalian berulang dengan bilangan yang sama." },
      { heading: "Bagian-bagiannya", text: "Pada aⁿ, a disebut bilangan pokok (basis) dan n disebut pangkat (eksponen). Pangkat menyatakan berapa kali bilangan pokok menjadi faktor." },
    ],
    formula: "a^n = \\underbrace{a × a × \\dots × a}_{n\\text{ faktor}}",
    example: "2³ = 2 × 2 × 2 = 8",
  },
  {
    id: "lesson-positive", title: "Pangkat bulat positif", chapter: 2, duration: "7 menit",
    description: "Hitung perpangkatan positif sebagai perkalian berulang.",
    sections: [
      { heading: "Pangkat positif", text: "Pangkat bilangan bulat positif menunjukkan banyaknya faktor bilangan pokok yang dikalikan." },
      { heading: "Langkah menghitung", text: "Tuliskan bilangan pokok sebagai faktor sebanyak nilai pangkat, lalu kalikan bertahap." },
    ],
    formula: "a^n = a × a × \\dots × a",
    example: "3⁴ = 3 × 3 × 3 × 3 = 81",
  },
  {
    id: "lesson-negative", title: "Pangkat bulat negatif", chapter: 3, duration: "9 menit",
    description: "Pahami mengapa pangkat negatif menunjukkan kebalikan, bukan nilai negatif.",
    sections: [
      { heading: "Pangkat negatif berarti kebalikan", text: "Pangkat negatif tidak membuat hasil menjadi negatif. Pangkat itu menunjukkan kebalikan dari perpangkatan positif dengan bilangan pokok yang sama." },
      { heading: "Syarat penting", text: "Bilangan pokok tidak boleh nol karena pembagian dengan nol tidak terdefinisi." },
    ],
    formula: "a^{-n} = \\frac{1}{a^n}, \\quad a \\ne 0",
    example: "2⁻³ = 1 ÷ 2³ = 1 ÷ 8 = ⅛",
  },
  {
    id: "lesson-laws", title: "Sifat-sifat perpangkatan", chapter: 4, duration: "12 menit",
    description: "Gunakan aturan perpangkatan untuk menyederhanakan perhitungan.",
    sections: [
      { heading: "Perkalian & pembagian basis sama", text: "Saat basis sama dikalikan, jumlahkan pangkat. Saat dibagi, kurangkan pangkat (penyebut tidak boleh nol)." },
      { heading: "Pangkat dari pangkat", text: "Kalikan kedua pangkat. Pangkat pada perkalian atau pembagian berlaku pada setiap faktor." },
    ],
    formula: "a^m a^n = a^{m+n} \\quad \\frac{a^m}{a^n} = a^{m-n} \\quad (a^m)^n = a^{mn} \\quad (ab)^n = a^n b^n \\quad (\\frac{a}{b})^n = \\frac{a^n}{b^n}",
    example: "2³ × 2⁻⁵ = 2⁻² = 1/4",
  },
];

export const exercises = [
  {
    id: "q1",
    level: "Sedang",
    prompt: "Sebuah laboratorium meneliti dua jenis bakteri, yaitu Bakteri P dan Bakteri Q. Bakteri P membelah diri menjadi 2 kali lipat setiap 1 jam. Bakteri Q membelah diri menjadi 3 kali lipat setiap 2 jam. Pada awal pengamatan, jumlah keduanya sama, yaitu 1.000 sel. Setelah 4 jam, bakteri manakah yang lebih banyak?",
    choices: [
      "Bakteri Q, karena 1.000 × 3² = 9.000 lebih besar dari 1.000 × 2⁴ = 16.000.",
      "Bakteri P, karena 1.000 × 2⁴ = 16.000 dan 1.000 × 3² = 9.000.",
      "Keduanya sama, karena sama-sama dimulai dari 1.000 sel.",
      "Tidak dapat ditentukan tanpa data jam ke-0.",
    ],
    answer: "Bakteri P, karena 1.000 × 2⁴ = 16.000 dan 1.000 × 3² = 9.000.",
    hint: "Hitung pertumbuhan masing-masing bakteri dalam interval yang sesuai, lalu bandingkan hasilnya.",
    hints: [
      "Bakteri P tumbuh dengan faktor 2 setiap 1 jam, jadi setelah 4 jam ia membelah 4 kali.",
      "Bakteri Q tumbuh dengan faktor 3 setiap 2 jam, jadi dalam 4 jam ada 2 siklus pembelahan.",
      "Hitung hasilnya: 1.000 × 2⁴ = 16.000 dan 1.000 × 3² = 9.000.",
      "Karena 16.000 > 9.000, Bakteri P lebih banyak setelah 4 jam.",
    ],
    explanation: "Bakteri P lebih banyak karena 1.000 × 2⁴ = 16.000 sel, sedangkan Bakteri Q = 1.000 × 3² = 9.000 sel. Jadi, 16.000 > 9.000 dan Bakteri P unggul.",
  },
  {
    id: "q2",
    level: "Mudah",
    prompt: "Sebuah startup mencatat jumlah pengguna aktif bulanan pada bulan pertama sebanyak 500 orang. Setiap bulan, jumlah pengguna meningkat menjadi 4 kali lipat dari bulan sebelumnya. Berapa jumlah pengguna pada bulan ke-4?",
    choices: [
      "500 × 4³ = 32.000",
      "500 × 4² = 8.000",
      "500 × 4⁴ = 128.000",
      "500 × 3⁴ = 40.500",
    ],
    answer: "500 × 4³ = 32.000",
    hint: "Model pertumbuhannya adalah Uₙ = 500 × 4⁽ⁿ⁻¹⁾, lalu substitusikan n = 4.",
    hints: [
      "Nilai awal adalah 500, rasio pengali adalah 4, dan n = 4.",
      "Bentuk pola bulan ke-4 adalah 500 × 4³.",
      "4³ = 64 dan 500 × 64 = 32.000.",
      "Jadi jumlah pengguna pada bulan ke-4 adalah 32.000 orang.",
    ],
    explanation: "Model matematika yang tepat adalah Uₙ = 500 × 4⁽ⁿ⁻¹⁾. Untuk bulan ke-4, U₄ = 500 × 4³ = 500 × 64 = 32.000 orang.",
  },
  {
    id: "q3",
    level: "Sedang",
    prompt: "Sebuah kotak penyimpanan berbentuk kubus memiliki panjang sisi 3 × 10² milimeter. Berapa volume kotak tersebut dalam bentuk bilangan berpangkat dan bentuk biasa?",
    choices: [
      "V = (3 × 10²)³ = 27 × 10⁶ = 27.000.000 mm³",
      "V = 3 × 10² = 300 mm³",
      "V = 3³ × 10² = 27 × 100 = 2.700 mm³",
      "V = (3 × 10²)² = 9 × 10⁴ = 90.000 mm³",
    ],
    answer: "V = (3 × 10²)³ = 27 × 10⁶ = 27.000.000 mm³",
    hint: "Gunakan rumus volume kubus V = s³ dan sifat eksponen (a × b)ⁿ = aⁿ × bⁿ.",
    hints: [
      "Rumus volume kubus adalah V = s × s × s = s³.",
      "Substitusikan s = 3 × 10², sehingga V = (3 × 10²)³.",
      "Gunakan sifat (a × b)ⁿ = aⁿ × bⁿ, maka V = 3³ × (10²)³ = 27 × 10⁶.",
      "Ubah ke bentuk biasa: 27 × 1.000.000 = 27.000.000 mm³.",
    ],
    explanation: "Volume kubus adalah V = s³ = (3 × 10²)³ = 3³ × (10²)³ = 27 × 10⁶ = 27.000.000 mm³.",
  },
  {
    id: "q4",
    level: "Sulit",
    prompt: "Sebuah zat radioaktif bermassa awal 1.000 gram mengalami peluruhan sehingga massanya menjadi setengah dari massa sebelumnya setiap 3 hari. Jika setelah 9 hari, seorang siswa menyimpulkan bahwa massa zat tersisa adalah 333,33 gram, apakah kesimpulan tersebut benar?",
    choices: [
      "Tidak benar. Massa yang sebenarnya adalah 1.000 × (1/2)³ = 125 gram.",
      "Benar, karena 1.000 dibagi 3 periode sama dengan 333,33 gram.",
      "Tidak benar. Massa yang sebenarnya adalah 1.000 × (1/2)² = 250 gram.",
      "Benar, karena peluruhan dilakukan secara proporsional dengan 3 periode.",
    ],
    answer: "Tidak benar. Massa yang sebenarnya adalah 1.000 × (1/2)³ = 125 gram.",
    hint: "Peluruhan mengikuti pemangkatan bukan pembagian linear; hitung 9 hari = 3 periode, lalu kalikan dengan (1/2)³.",
    hints: [
      "9 hari dibagi 3 hari per periode sama dengan 3 periode.",
      "Persamaan peluruhan adalah M = 1.000 × (1/2)ᵗ, dengan t = 3.",
      "M = 1.000 × (1/2)³ = 1.000 × 1/8 = 125.",
      "Kesimpulan 333,33 gram salah karena peluruhan dilakukan secara berulang bukan linear.",
    ],
    explanation: "Kesimpulan siswa tidak benar. Peluruhan mengikuti pola eksponensial, bukan pembagian linear. Setelah 3 periode, massa = 1.000 × (1/2)³ = 125 gram.",
  },
];

export const reflectionQuestions = [
  "Apa yang kamu pahami tentang bilangan berpangkat?",
  "Apa perbedaan pangkat positif dan pangkat negatif?",
  "Mengapa pangkat negatif dapat diubah menjadi bentuk pecahan?",
  "Bagaimana hubungan bilangan pokok dan pangkat?",
  "Bagian mana yang masih sulit kamu pahami?",
];

export function normalizedAnswer(value) {
  return value.trim().replace(/\s+/g, "").replace(/[−–]/g, "-").toLowerCase();
}
