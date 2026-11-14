import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, Lightbulb, PenLine, Sparkles, Target, Trophy } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { listAttempts, listExercises, listReflections, saveAttempt, saveReflection } from "../services/data.js";
import { reflectionQuestions } from "../data/curriculum.js";
import { Notice, PageIntro, useRemote } from "./shared.jsx";

const difficultyOrder = ["Mudah", "Sedang", "Sulit"];
export function ExercisesPage() {
  const { user } = useAuth();
  const exercisesState = useRemote(() => listExercises(), [user.id]);
  const attemptsState = useRemote(() => listAttempts(user.id), [user.id]);
  const [level, setLevel] = useState("Mudah");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0, streak: 0, wrongStreak: 0 });
  const submissionInProgress = useRef(false);
  const levelQuestions = (exercisesState.data ?? []).filter((item) => item.level === level);
  const question = levelQuestions.length ? levelQuestions[questionIndex % levelQuestions.length] : null;
  useEffect(() => {
    if (!attemptsState.data?.length) return;
    const recent = attemptsState.data.slice(0, 3).map((item) => item.is_correct);
    if (recent.length >= 2 && recent.filter((isCorrect) => !isCorrect).length >= 2) setLevel("Mudah");
    else if (recent.length === 3 && recent.every(Boolean)) setLevel("Sulit");
  }, [attemptsState.data]);
  const submitAnswer = async (value) => {
    if (!value || result || !question || submissionInProgress.current) return;
    submissionInProgress.current = true;
    setSaving(true); setError("");
    try {
      const attempt = await saveAttempt(question.id, value);
      const correct = attempt.is_correct;
      setAnswer(value);
      setResult({ correct, explanation: attempt.explanation });
      const nextStreak = correct ? sessionScore.streak + 1 : 0;
      const rawWrongStreak = correct ? 0 : sessionScore.wrongStreak + 1;
      const shouldReduceDifficulty = rawWrongStreak >= 2;
      setSessionScore({
        correct: sessionScore.correct + Number(correct),
        total: sessionScore.total + 1,
        streak: nextStreak,
        wrongStreak: shouldReduceDifficulty ? 0 : rawWrongStreak,
      });
      if (nextStreak >= 3) setLevel((current) => difficultyOrder[Math.min(2, difficultyOrder.indexOf(current) + 1)]);
      if (shouldReduceDifficulty) {
        setLevel((current) => difficultyOrder[Math.max(0, difficultyOrder.indexOf(current) - 1)]);
      }
      await attemptsState.refresh();
    } catch (err) { setError(err.message); }
    finally { submissionInProgress.current = false; setSaving(false); }
  };
  function nextQuestion() {
    setQuestionIndex((index) => index + 1);
    setAnswer(""); setResult(null); setHintLevel(0);
  }
  if (exercisesState.busy) return <div className="loading-inline"><div className="spinner" /> Memuat soal latihan...</div>;
  if (exercisesState.error) return <><Notice>{exercisesState.error}</Notice><button className="button button-outline" onClick={exercisesState.refresh}>Coba lagi</button></>;
  if (!question) return <Notice>Belum ada soal untuk tingkat ini.</Notice>;
  return (
    <motion.div className="page-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageIntro eyebrow="COBA, TIDAK APA-APA SALAH" title="Saatnya latihan!" description="Pilih jawaban atau gunakan petunjuk. Soal akan menyesuaikan dengan kemajuanmu." icon={Target} />
      <div className="exercise-summary"><div className="difficulty-tabs">{difficultyOrder.map((item) => <button key={item} className={level === item ? "difficulty-active" : ""} onClick={() => { setLevel(item); setQuestionIndex(0); setResult(null); setAnswer(""); }}>{item}</button>)}</div><div className="score-pill"><Trophy size={16} /> {sessionScore.correct} benar dari {sessionScore.total}</div></div>
      {error && <Notice>{error}</Notice>}
      {attemptsState.error && <Notice>{attemptsState.error}</Notice>}
      <section className="exercise-card">
        <div className="exercise-card-top"><span className={`difficulty-label difficulty-${level.toLowerCase()}`}>{level}</span><span className="question-count">Soal {questionIndex % levelQuestions.length + 1} <i>·</i> {levelQuestions.length} soal di tingkat ini</span><span className="streak-label"><Sparkles size={14} /> {sessionScore.streak} beruntun</span></div>
        <h2>{question.prompt}</h2>
        <div className="answer-options">{question.choices.map((choice, index) => {
          const picked = answer === choice;
          const correctChoice = result?.correct && picked;
          return <button key={choice} disabled={Boolean(result) || saving} className={`answer-option ${picked ? "answer-picked" : ""} ${correctChoice ? "answer-correct" : result && picked && !result.correct ? "answer-incorrect" : ""}`} onClick={() => submitAnswer(choice)}><span className="option-letter">{String.fromCharCode(65 + index)}</span>{choice}{correctChoice && <CheckCircle2 size={17} />}</button>;
        })}</div>
        {!result && <div className="hint-area"><button className="hint-button" disabled={hintLevel >= question.hints.length} onClick={() => setHintLevel((current) => Math.min(question.hints.length, current + 1))}><Lightbulb size={16} /> {hintLevel === 0 ? "Butuh petunjuk?" : `Petunjuk ${hintLevel} dari ${question.hints.length}`}</button>{hintLevel > 0 && <div className="hint-message">{question.hints[hintLevel - 1]}</div>}</div>}
        {result && <div className={`answer-explanation ${result.correct ? "explanation-correct" : "explanation-incorrect"}`}><div className="explanation-title">{result.correct ? <CheckCircle2 size={19} /> : <Lightbulb size={19} />}{result.correct ? "Jawabanmu benar!" : "Belum tepat — terus mencoba!"}</div><p>{result.explanation}</p><button className="button button-primary button-small" onClick={nextQuestion}>Soal berikutnya <ArrowRight size={15} /></button></div>}
      </section>
      <div className="scaffold-note"><Sparkles size={16} /><span><strong>Bantuan bertahap</strong> — petunjuk dimulai dari arahan ringan, lalu ditambah hanya jika kamu membutuhkannya.</span></div>
    </motion.div>
  );
}

export function ReflectionPage() {
  const { user } = useAuth();
  const remote = useRemote(() => listReflections(user.id), [user.id]);
  const [drafts, setDrafts] = useState({});
  const [savingQuestion, setSavingQuestion] = useState("");
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const answered = new Set((remote.data ?? []).map((item) => item.question).filter(Boolean));
  async function submit(question) {
    const answer = (drafts[question] ?? "").trim();
    if (!answer) return;
    setSavingQuestion(question); setError(""); setSavedNotice("");
    try {
      await saveReflection(user.id, question, answer);
      setDrafts((value) => ({ ...value, [question]: "" }));
      await remote.refresh();
      setSavedNotice("Refleksimu tersimpan. Terima kasih sudah berpikir dengan teliti!");
    } catch (err) { setError(err.message); }
    finally { setSavingQuestion(""); }
  }
  return (
    <motion.div className="page-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageIntro eyebrow="BERHENTI SEJENAK, PIKIRKAN" title="Apa yang sudah kamu pahami?" description="Menjelaskan dengan kata-katamu sendiri membantu pemahaman bertahan lebih lama." icon={Sparkles} />
      <div className="reflection-progress"><div className="reflection-progress-icon"><PenLine size={18} /></div><div className="reflection-progress-copy"><strong>Refleksi pemahaman</strong><span>{answered.size} dari {reflectionQuestions.length} pertanyaan terjawab</span></div><div className="reflection-progress-track"><div className="progress-track"><span style={{ width: `${answered.size / reflectionQuestions.length * 100}%` }} /></div></div></div>
      {error && <Notice>{error}</Notice>}{savedNotice && <Notice type="success">{savedNotice}</Notice>}
      <div className="reflection-list">{reflectionQuestions.map((question, index) => {
        const previous = (remote.data ?? []).find((item) => item.question === question);
        return <article className="reflection-card" key={question}><div className="reflection-question"><span>{String(index + 1).padStart(2, "0")}</span><h3>{question}</h3>{answered.has(question) && <CheckCircle2 size={18} className="completed-icon" />}</div>{previous && <div className="reflection-previous"><small>JAWABANMU SEBELUMNYA</small><p>{previous.answer}</p></div>}<textarea maxLength={1500} rows={3} value={drafts[question] ?? ""} onChange={(event) => setDrafts({ ...drafts, [question]: event.target.value })} placeholder="Ceritakan pemahamanmu di sini..." aria-label={question} /><div className="reflection-card-bottom"><small>{(drafts[question] ?? "").length}/1500 karakter</small><button className="button button-soft button-small" disabled={savingQuestion === question || !(drafts[question] ?? "").trim()} onClick={() => submit(question)}>{savingQuestion === question ? "Menyimpan..." : "Simpan jawaban"} <Check size={14} /></button></div></article>;
      })}</div>
      {(remote.data ?? []).filter((item) => !item.question).length > 0 && <section className="content-card"><h3>Refleksi sebelumnya</h3>{(remote.data ?? []).filter((item) => !item.question).map((item) => <div className="reflection-previous" key={item.id}><p>{item.answer}</p></div>)}</section>}
      <div className="reflection-encouragement"><Sparkles size={17} /><span>Tidak harus sempurna — yang penting kamu berani mencoba menjelaskan.</span></div>
    </motion.div>
  );
}
