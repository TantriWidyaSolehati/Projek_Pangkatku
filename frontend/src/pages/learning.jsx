import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, CircleHelp, Clock3, Compass, Lightbulb, Pause, Play, RotateCcw,
  Sparkles, Target, Trophy, X, ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { listAttempts, listProgress, saveProgress } from "../services/data.js";
import { lessons, normalizedAnswer, prerequisiteLessons } from "../data/curriculum.js";
import MathFormula from "../components/MathFormula.jsx";
import { Notice, PageIntro, useRemote } from "./shared.jsx";

export function DashboardPage() {
  const { user, profile } = useAuth();
  const progressState = useRemote(() => listProgress(user.id), [user.id]);
  const attemptState = useRemote(() => listAttempts(user.id), [user.id]);
  const progress = progressState.data ?? [];
  const attempts = attemptState.data ?? [];
  const completed = progress.filter((item) => item.completion_status === "completed").length;
  const percentage = Math.round(completed / (lessons.length + prerequisiteLessons.length) * 100);
  const latest = attempts.slice(0, 3);
  return (
    <motion.div className="page-stack" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <section className="welcome-banner"><div className="welcome-copy"><div className="eyebrow">RUANG BELAJARMU</div><h1>Hai, {profile?.username || user.email?.split("@")[0]} <span className="wave">✦</span></h1><p>Siap menemukan pola baru hari ini? Belajar pelan-pelan, ya.</p><Link className="button button-primary" to="/app/lessons">Lanjutkan belajar <ArrowRight size={16} /></Link></div><div className="welcome-illustration"><div className="welcome-circle"><span>2</span><sup>−3</sup></div><span className="welcome-note">setiap langkah berarti ✦</span></div></section>
      {(progressState.error || attemptState.error) && <Notice>{progressState.error || attemptState.error}</Notice>}
      <div className="section-heading"><div><span className="eyebrow">PERJALANANMU</span><h2>Terus bertumbuh</h2></div><Link to="/app/profile" className="subtle-link">Lihat progres <ArrowRight size={15} /></Link></div>
      <section className="stats-grid">
        <div className="stat-card stat-progress"><div className="stat-heading"><span className="stat-icon stat-icon-purple"><Target size={18} /></span><span>Progres belajar</span></div><div className="progress-stat-line"><strong>{percentage}%</strong><span>materi selesai</span></div><div className="progress-track"><span style={{ width: `${percentage}%` }} /></div><small>{completed} dari {lessons.length + prerequisiteLessons.length} materi</small></div>
        <div className="stat-card"><div className="stat-heading"><span className="stat-icon stat-icon-blue"><BookOpen size={18} /></span><span>Materi selesai</span></div><strong className="stat-number">{completed}<small> / {lessons.length + prerequisiteLessons.length}</small></strong><p>Setiap konsep baru itu kemajuan!</p></div>
        <div className="stat-card"><div className="stat-heading"><span className="stat-icon stat-icon-peach"><Trophy size={18} /></span><span>Latihan dikerjakan</span></div><strong className="stat-number">{attempts.length}<small> soal</small></strong><p>Terus coba, kamu makin jago.</p></div>
      </section>
      <div className="dashboard-columns"><section className="content-card continue-card"><div className="card-title-row"><div><span className="eyebrow">MATERI UTAMA</span><h3>Pangkat negatif</h3></div><span className="card-mini-icon">x<sup>−n</sup></span></div><p>Yuk pahami mengapa pangkat negatif berarti kebalikan, bukan bilangan negatif.</p><div className="lesson-card-footer"><span><Clock3 size={14} /> 9 menit</span><Link to="/app/lessons">Buka materi <ArrowRight size={15} /></Link></div></section>
        <section className="content-card activity-card"><div className="card-title-row"><div><span className="eyebrow">LATIHAN TERAKHIR</span><h3>Aktivitasmu</h3></div><Link to="/app/exercises" className="icon-link" aria-label="Buka latihan"><ArrowUpRight size={18} /></Link></div>
          {attemptState.busy ? <div className="small-loading">Memuat aktivitas...</div> : latest.length ? <div className="activity-list">{latest.map((attempt) => <div className="activity-item" key={attempt.id}><span className={`activity-check ${attempt.score ? "correct" : "incorrect"}`}>{attempt.score ? <Check size={13} /> : <X size={13} />}</span><span><strong>Latihan {attempt.exercise_id}</strong><small>{new Date(attempt.created_at).toLocaleDateString("id-ID")}</small></span><b>{attempt.score ? "Benar" : "Coba lagi"}</b></div>)}</div> : <div className="empty-inline"><CircleHelp size={18} /><span>Belum ada latihan. Yuk, coba soal pertamamu!</span></div>}
        </section></div>
      <section className="quick-links"><Link to="/app/visualization"><span className="quick-icon quick-purple"><Activity size={19} /></span><span><strong>Lihat pola eksponen</strong><small>Visualisasi interaktif</small></span><ChevronRight size={17} /></Link><Link to="/app/tutor"><span className="quick-icon quick-blue"><Sparkles size={19} /></span><span><strong>Tanya AI Tutor</strong><small>Belajar dengan petunjuk</small></span><ChevronRight size={17} /></Link></section>
    </motion.div>
  );
}

export function LessonsPage({ prerequisites = false }) {
  const { user } = useAuth();
  const items = prerequisites ? prerequisiteLessons : lessons;
  const progressState = useRemote(() => listProgress(user.id), [user.id]);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(items[0]?.id);
  async function completeLesson(id) {
    setError(""); setSaving(id);
    try { await saveProgress(user.id, id, true); await progressState.refresh(); }
    catch (err) { setError(err.message); }
    finally { setSaving(""); }
  }
  const completedIds = new Set((progressState.data ?? []).filter((row) => row.completion_status === "completed").map((row) => row.lesson_id));
  const completedCount = items.filter((item) => completedIds.has(item.id)).length;
  const diagnosticAnswered = items.filter((item) => Object.hasOwn(answers, item.id));
  const diagnosticCorrect = prerequisites ? items.filter((item) => answers[item.id] === normalizedAnswer(item.practice.answer)) : [];
  const diagnosticComplete = prerequisites && diagnosticAnswered.length === items.length;
  const recommendedLessons = prerequisites ? items.filter((item) => answers[item.id] !== undefined && answers[item.id] !== normalizedAnswer(item.practice.answer)) : [];
  return (
    <motion.div className="page-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageIntro eyebrow={prerequisites ? "MULAI DARI DASAR" : "MATERI PEMBELAJARAN"} title={prerequisites ? "Pemanasan dulu, yuk!" : "Belajar bilangan berpangkat"} description={prerequisites ? "Ulang materi dasar supaya kamu makin siap memahami eksponen." : "Materi singkat, contoh nyata, dan latihan kecil di setiap langkah."} icon={prerequisites ? Compass : BookOpen} />
      {error && <Notice>{error}</Notice>}
      <div className="lesson-progress-bar"><div><span>Progres bagian ini</span><strong>{completedCount} / {items.length} selesai</strong></div><div className="progress-track"><span style={{ width: `${completedCount / items.length * 100}%` }} /></div></div>
      {prerequisites ? <div className="prereq-grid">{items.map((item, index) => {
        const isComplete = completedIds.has(item.id);
        const correct = answers[item.id] === normalizedAnswer(item.practice.answer);
        return <article id={item.id} className={`prereq-card ${isComplete ? "prereq-done" : ""}`} key={item.id}>
          <div className="prereq-top"><span className="prereq-icon">{item.icon}</span><span className="lesson-index">DASAR {String(index + 1).padStart(2, "0")}</span>{isComplete && <CheckCircle2 className="completed-icon" size={18} />}</div>
          <h3>{item.title}</h3><p>{item.description}</p><div className="formula-box"><MathFormula>{item.formula}</MathFormula></div><div className="example-note"><Lightbulb size={15} /><span>{item.example}</span></div>
          <form className="mini-practice" onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const value = new FormData(form).get("answer")?.toString() ?? "";
            setAnswers({ ...answers, [item.id]: normalizedAnswer(value) });
          }}>
            <label htmlFor={`answer-${item.id}`}>Coba: {item.practice.prompt}</label>
            <div className="mini-practice-row"><input id={`answer-${item.id}`} name="answer" maxLength={30} required placeholder="Jawabanmu" /><button className="button button-soft button-small">Periksa</button></div>
            {answers[item.id] && <span className={`practice-feedback ${correct ? "feedback-good" : "feedback-bad"}`}>{correct ? "Betul! Kamu siap lanjut." : `Belum tepat. Ulangi penjelasan dan contoh di atas, lalu coba lagi. Jawaban: ${item.practice.answer}`}</span>}
          </form>
          <button className={`button ${isComplete ? "button-completed" : "button-outline"} lesson-complete`} disabled={saving === item.id || isComplete} onClick={() => completeLesson(item.id)}>{isComplete ? <><Check size={15} /> Selesai</> : saving === item.id ? "Menyimpan..." : "Tandai selesai"}</button>
        </article>;
      })}</div> : <div className="lesson-list">{items.map((lesson, index) => {
        const isComplete = completedIds.has(lesson.id);
        const isOpen = expanded === lesson.id;
        return <article className={`lesson-row ${isOpen ? "lesson-row-open" : ""}`} key={lesson.id}>
          <button className="lesson-row-head" onClick={() => setExpanded(isOpen ? "" : lesson.id)} aria-expanded={isOpen}>
            <span className={`lesson-number ${isComplete ? "lesson-number-done" : ""}`}>{isComplete ? <Check size={16} /> : String(index + 1).padStart(2, "0")}</span><span className="lesson-row-text"><small>BAB {lesson.chapter} · {lesson.duration}</small><strong>{lesson.title}</strong><span>{lesson.description}</span></span><ChevronDown size={18} className={`lesson-chevron ${isOpen ? "rotate-chevron" : ""}`} />
          </button>
          {isOpen && <div className="lesson-detail">
            {lesson.sections.map((section) => <div className="lesson-section" key={section.heading}><h4>{section.heading}</h4><p>{section.text}</p></div>)}
            <div className="formula-box formula-large"><MathFormula block>{lesson.formula}</MathFormula></div><div className="example-note"><Lightbulb size={16} /><span>Contoh: <strong>{lesson.example}</strong></span></div>
            <div className="lesson-actions"><Link className="text-link" to="/app/visualization">Coba visualisasi <ArrowRight size={15} /></Link><button className={`button ${isComplete ? "button-completed" : "button-primary"} button-small`} disabled={saving === lesson.id || isComplete} onClick={() => completeLesson(lesson.id)}>{isComplete ? <><Check size={14} /> Selesai</> : saving === lesson.id ? "Menyimpan..." : "Tandai selesai"}</button></div>
          </div>}
        </article>;
      })}</div>}
      {prerequisites && <div className="diagnostic-banner"><div className="diagnostic-icon"><Target size={20} /></div><div><strong>{diagnosticComplete ? `Hasil cek kesiapan: ${diagnosticCorrect.length} / ${items.length} benar` : "Tes kesiapan materi prasyarat"}</strong><p>{!diagnosticComplete ? `Jawab latihan di setiap materi untuk mengecek kesiapanmu (${diagnosticAnswered.length}/${items.length} terjawab).` : diagnosticCorrect.length === items.length ? "Hebat! Kamu siap masuk ke materi bilangan berpangkat." : `Ulangi materi yang masih perlu dilatih: ${recommendedLessons.map((item) => item.title).join(", ")}.`}</p></div>{diagnosticComplete && diagnosticCorrect.length === items.length ? <Link className="button button-primary button-small" to="/app/lessons">Masuk materi utama <ArrowRight size={15} /></Link> : <a className="button button-soft button-small" href={`#${diagnosticComplete ? recommendedLessons[0]?.id : items.find((item) => answers[item.id] === undefined)?.id}`}>{diagnosticComplete ? "Ulangi materi rekomendasi" : "Lanjutkan tes"} <ArrowRight size={15} /></a>}</div>}
    </motion.div>
  );
}

const exponentSteps = [
  { exponent: 3, value: "8", numerator: "8", denominator: "1", explanation: "Mulai dari pangkat positif: 2³ = 2 × 2 × 2 = 8." },
  { exponent: 2, value: "4", numerator: "4", denominator: "1", explanation: "Pangkat turun satu, jadi hasil sebelumnya dibagi 2: 8 ÷ 2 = 4." },
  { exponent: 1, value: "2", numerator: "2", denominator: "1", explanation: "Turun satu pangkat lagi: 4 ÷ 2 = 2." },
  { exponent: 0, value: "1", numerator: "1", denominator: "1", explanation: "Setiap bilangan bukan nol berpangkat nol bernilai 1: 2 ÷ 2 = 1." },
  { exponent: -1, value: "1/2", numerator: "1", denominator: "2", explanation: "Hasil 1 dibagi 2 menjadi ½. Inilah kebalikan dari 2¹." },
  { exponent: -2, value: "1/4", numerator: "1", denominator: "4", explanation: "Turun satu pangkat: ½ ÷ 2 = ¼." },
  { exponent: -3, value: "1/8", numerator: "1", denominator: "8", explanation: "Turun lagi: ¼ ÷ 2 = ⅛. Jadi 2⁻³ = ⅛." },
];

export function VisualizationPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [base, setBase] = useState("2");
  const [power, setPower] = useState("-3");
  const step = exponentSteps[stepIndex];
  useEffect(() => {
    if (!playing) return undefined;
    if (stepIndex >= exponentSteps.length - 1) {
      setPlaying(false);
      setStepIndex(0);
      return undefined;
    }
    const timer = window.setTimeout(() => setStepIndex(stepIndex + 1), 2600);
    return () => window.clearTimeout(timer);
  }, [playing, stepIndex]);
  const baseValue = Number(base);
  const powerValue = Number(power);
  const validInput = base.trim() !== "" && power.trim() !== "" && Number.isInteger(baseValue) && Number.isInteger(powerValue) && baseValue !== 0 && Math.abs(baseValue) <= 20 && powerValue >= -12 && powerValue <= 12;
  const computed = validInput ? baseValue ** powerValue : NaN;
  const interactiveAnswer = validInput && powerValue < 0
    ? `1/${baseValue ** Math.abs(powerValue)}`
    : validInput ? String(computed) : "";

  function setStep(next) { setPlaying(false); setStepIndex(Math.max(0, Math.min(exponentSteps.length - 1, next))); }
  return (
    <motion.div className="page-stack" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <PageIntro eyebrow="LIHAT POLANYA" title="Pangkat bergerak, nilai berubah" description="Amati apa yang terjadi setiap pangkat berkurang satu. Kamu bisa coba basis lain di bawah." icon={Activity} />
      <section className="visualizer-card">
        <div className="visualizer-topline"><span className="eyebrow">PERJALANAN DARI POSITIF KE NEGATIF</span><span className="step-count">LANGKAH {stepIndex + 1} <i>/ {exponentSteps.length}</i></span></div>
        <div className="visualizer-stage">
          <div className="stage-axis"><span>Perpangkatan</span><i /><span>Pecahan</span></div>
          <AnimatePresence mode="wait"><motion.div className="big-equation" key={stepIndex} initial={{ opacity: 0, y: 15, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <span className="big-base">2</span><sup>{step.exponent < 0 ? `−${Math.abs(step.exponent)}` : step.exponent}</sup><span className="big-equals">=</span>
            <span className="big-result">{step.exponent < 0 ? <span className="stacked-fraction"><b>{step.numerator}</b><i /><b>{step.denominator}</b></span> : step.value}</span>
          </motion.div></AnimatePresence>
          <div className="step-explanation"><span className="explanation-sparkle"><Sparkles size={16} /></span>{step.explanation}</div>
          <div className="step-pips" aria-label={`Langkah ${stepIndex + 1} dari ${exponentSteps.length}`}>{exponentSteps.map((item, index) => <button key={item.exponent} aria-label={`Ke langkah ${index + 1}`} className={`step-pip ${index === stepIndex ? "step-pip-active" : ""} ${index < stepIndex ? "step-pip-done" : ""}`} onClick={() => setStep(index)} />)}</div>
          <div className="visual-controls"><button className="button button-outline button-small" disabled={stepIndex === 0} onClick={() => setStep(stepIndex - 1)}><ChevronLeft size={16} /> Sebelumnya</button><button className="button button-primary button-small" onClick={() => stepIndex === exponentSteps.length - 1 ? setStep(0) : setStep(stepIndex + 1)}>{stepIndex === exponentSteps.length - 1 ? "Ulangi" : "Selanjutnya"} <ChevronRight size={16} /></button></div>
          <div className="play-controls"><button onClick={() => setPlaying(false)} disabled={!playing}><Pause size={15} /> Jeda</button><button onClick={() => { if (stepIndex === exponentSteps.length - 1) setStepIndex(0); setPlaying(true); }} disabled={playing}><Play size={15} /> Putar animasi</button><button onClick={() => { setPlaying(false); setStepIndex(0); }}><RotateCcw size={15} /> Ulangi</button></div>
        </div>
      </section>
      <div className="visual-bottom-grid">
        <section className="content-card pattern-card"><span className="eyebrow">POLANYA</span><h3>Setiap pangkat turun satu…</h3><p>…hasilnya dibagi bilangan pokok. Saat melewati nol, bilangan berpangkat berubah menjadi pecahan.</p><div className="pattern-flow"><span>2² = 4</span><ArrowRight size={15} /><span className="flow-operation">÷ 2</span><ArrowRight size={15} /><span>2¹ = 2</span><ArrowRight size={15} /><span>2⁰ = 1</span></div><div className="pattern-flow pattern-flow-negative"><span>2⁰ = 1</span><ArrowRight size={15} /><span className="flow-operation">÷ 2</span><ArrowRight size={15} /><span>2⁻¹ = ½</span><ArrowRight size={15} /><span>2⁻² = ¼</span></div></section>
        <section className="content-card calculator-card"><span className="eyebrow">COBA SENDIRI</span><h3>Kalkulator eksponen</h3><p>Ubah basis dan pangkat untuk melihat hasilnya langsung.</p><div className="calculator-inputs"><label>Bilangan pokok<input type="number" min="-20" max="20" step="1" value={base} onChange={(event) => setBase(event.target.value)} aria-label="Bilangan pokok" /></label><span className="calc-exponent-symbol">^</span><label>Pangkat<input type="number" min="-12" max="12" step="1" value={power} onChange={(event) => setPower(event.target.value)} aria-label="Pangkat" /></label></div>{!validInput ? <Notice>{baseValue === 0 && powerValue < 0 ? "Bilangan pokok tidak boleh nol untuk pangkat negatif." : "Masukkan bilangan bulat: basis −20 sampai 20 (bukan 0), pangkat −12 sampai 12."}</Notice> : <div className="calculator-result"><span>Hasil perhitungan</span><strong>{baseValue}<sup>{powerValue < 0 ? `−${Math.abs(powerValue)}` : powerValue}</sup> = {interactiveAnswer}</strong>{powerValue < 0 && <small>Pangkat negatif menunjukkan kebalikan, bukan tanda negatif.</small>}</div>}</section>
      </div>
    </motion.div>
  );
}
