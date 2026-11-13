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
  { id: "q1", level: "Mudah", prompt: "Pada bentuk 7⁴, berapakah bilangan pokoknya?", choices: ["4", "7", "28", "11"], answer: "7", hint: "Bilangan pokok adalah angka yang menjadi faktor berulang.", hints: ["Perhatikan angka biasa dan angka kecil di atasnya.", "Bilangan pokok adalah angka yang menjadi faktor berulang.", "Pada 7⁴, angka 7 dikalikan berulang sebanyak empat kali.", "Jadi bilangan pokoknya adalah angka 7."], explanation: "Pada 7⁴, 7 adalah bilangan pokok dan 4 adalah pangkat." },
  { id: "q2", level: "Mudah", prompt: "Hitung nilai 2³.", choices: ["6", "8", "9", "16"], answer: "8", hint: "Tuliskan 2³ sebagai perkalian berulang.", hints: ["Pangkat menunjukkan banyaknya faktor yang sama.", "Tuliskan 2³ sebagai perkalian berulang.", "2³ = 2 × 2 × 2. Kalikan dua faktor pertama dulu.", "2 × 2 × 2 = 4 × 2 = 8."], explanation: "2³ = 2 × 2 × 2 = 8." },
  { id: "q3", level: "Mudah", prompt: "Bentuk pecahan dari 3⁻² adalah …", choices: ["−9", "1/6", "1/9", "9"], answer: "1/9", hint: "Pangkat negatif menunjukkan kebalikan: a⁻ⁿ = 1/aⁿ.", hints: ["Pangkat negatif tidak berarti hasilnya negatif.", "Gunakan aturan a⁻ⁿ = 1/aⁿ.", "Ubah menjadi 1/3², lalu hitung penyebutnya.", "3² = 9, sehingga pecahannya 1/9."], explanation: "3⁻² = 1/3² = 1/9. Hasilnya bukan negatif." },
  { id: "q4", level: "Sedang", prompt: "Sederhanakan 5² × 5³.", choices: ["5⁵", "5⁶", "25⁶", "10⁵"], answer: "5⁵", hint: "Untuk perkalian dengan basis sama, pangkatnya dijumlahkan.", hints: ["Kedua bilangan berpangkat memiliki basis yang sama.", "Untuk perkalian dengan basis sama, pangkatnya dijumlahkan.", "Jumlahkan eksponen: 2 + 3.", "Hasilnya adalah 5⁵."], explanation: "5² × 5³ = 5²⁺³ = 5⁵." },
  { id: "q5", level: "Sedang", prompt: "Sederhanakan 2⁴ ÷ 2⁶.", choices: ["2¹⁰", "2²", "2⁻²", "1"], answer: "2⁻²", hint: "Kurangkan pangkat pembilang dengan pangkat penyebut.", hints: ["Basis pada pembilang dan penyebut sama.", "Kurangkan pangkat pembilang dengan pangkat penyebut.", "Hitung 4 − 6.", "4 − 6 = −2, jadi hasilnya 2⁻²."], explanation: "2⁴ ÷ 2⁶ = 2⁴⁻⁶ = 2⁻² = 1/4." },
  { id: "q6", level: "Sedang", prompt: "Hitung (3²)³.", choices: ["3⁵", "3⁶", "9⁶", "3⁸"], answer: "3⁶", hint: "Pangkat dari pangkat: kalikan kedua eksponen.", hints: ["Di sini ada pangkat di dalam tanda kurung dan pangkat di luar.", "Untuk pangkat dari pangkat, kedua eksponen dikalikan.", "Hitung 2 × 3 untuk memperoleh eksponen baru.", "Hasilnya 3⁶, yaitu 729."], explanation: "(3²)³ = 3²×³ = 3⁶ = 729." },
  { id: "q7", level: "Sulit", prompt: "Sederhanakan 2⁻³ × 2⁵.", choices: ["2⁻¹⁵", "2²", "2⁻²", "2⁸"], answer: "2²", hint: "Gabungkan pangkat dengan basis sama, kemudian evaluasi.", hints: ["Perhatikan bahwa kedua suku memiliki basis 2.", "Untuk perkalian dengan basis sama, jumlahkan pangkatnya.", "Hitung −3 + 5.", "−3 + 5 = 2, jadi hasilnya 2² = 4."], explanation: "2⁻³ × 2⁵ = 2⁻³⁺⁵ = 2² = 4." },
  { id: "q8", level: "Sulit", prompt: "Sebuah bakteri membelah menjadi dua setiap jam. Jika mula-mula 1 bakteri, berapa jumlahnya setelah 5 jam?", choices: ["2⁴ = 16", "2⁵ = 32", "5² = 25", "10"], answer: "2⁵ = 32", hint: "Setiap jam jumlahnya dikali 2. Tuliskan perkalian 2 sebanyak lima faktor.", hints: ["Jumlah bakteri bertambah dengan faktor yang sama setiap jam.", "Setiap jam jumlahnya dikali 2.", "Tuliskan faktor 2 sebanyak lima kali: 2 × 2 × 2 × 2 × 2.", "Perkalian itu adalah 2⁵ = 32 bakteri."], explanation: "Setelah 5 jam ada 1 × 2⁵ = 32 bakteri." },
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
