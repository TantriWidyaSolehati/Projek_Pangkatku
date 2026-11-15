import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, Lightbulb, PenLine, Sparkles, Target, Trophy } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  getEssaySolution,
  listEssayExercises,
  listReflections,
  saveEssaySelfAssessment,
  saveReflection,
} from "../services/data.js";
import { reflectionQuestions } from "../data/curriculum.js";
import { Notice, PageIntro, useRemote } from "./shared.jsx";

const difficultyOrder = ["Mudah", "Sedang", "Sulit"];
export function ExercisesPage() {
  const { user } = useAuth();
  const exercisesState = useRemote(async () => {
    const data = await listEssayExercises();
    if (!data.every((exercise) =>
      exercise && typeof exercise.id === "string" &&
      typeof exercise.question === "string" &&
      exercise.question_type === "short_answer" &&
      difficultyOrder.includes(exercise.difficulty) &&
      Array.isArray(exercise.hints) &&
      exercise.hints.every((hint) => typeof hint === "string")
    )) {
      throw new Error("Data soal essay dari Supabase tidak sesuai format yang diharapkan.");
    }
    return data;
  }, [user.id]);
  const [level, setLevel] = useState("Mudah");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [solution, setSolution] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [checkedStageIds, setCheckedStageIds] = useState([]);
  const [assessmentConfirmed, setAssessmentConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [answerError, setAnswerError] = useState("");
  const solutionRequestInProgress = useRef(false);
  const saveInProgress = useRef(false);
  const exercises = exercisesState.data ?? [];
  const levelQuestions = exercises.filter((item) => item.difficulty === level);
  const question = levelQuestions.length ? levelQuestions[questionIndex % levelQuestions.length] : null;

  async function loadSolution() {
    if (!question || solutionRequestInProgress.current) return;
    solutionRequestInProgress.current = true;
    setLoadingSolution(true);
    setSolutionError("");
    try {
      const data = await getEssaySolution(question.id);
      if (
        !Array.isArray(data.solution_steps) ||
        !data.solution_steps.every((step) =>
          step && typeof step === "object" && !Array.isArray(step) &&
          typeof step.id === "string" &&
          typeof step.content === "string"
        ) ||
        !Array.isArray(data.rubric) ||
        !data.rubric.every((stage) =>
          stage && typeof stage.id === "string" &&
          typeof stage.label === "string" &&
          typeof stage.weight === "number"
        )
      ) {
        throw new Error("Data pembahasan atau rubrik essay dari Supabase tidak sesuai format.");
      }
      setSolution(data);
    } catch (err) {
      setSolutionError(err.message || "Pembahasan essay gagal dimuat.");
    } finally {
      solutionRequestInProgress.current = false;
      setLoadingSolution(false);
    }
  }

  async function submitAnswer(event) {
    event.preventDefault();
    if (!answer.trim()) {
      setAnswerError("Tuliskan jawaban sebelum melanjutkan.");
      return;
    }
    if (!question || submittedAnswer || solutionRequestInProgress.current) return;
    setAnswerError("");
    setSubmittedAnswer(answer);
    await loadSolution();
  }

  async function saveAssessment() {
    if (!question || !submittedAnswer || !solution || !assessmentConfirmed || saveInProgress.current) return;
    saveInProgress.current = true;
    setSaving(true);
    setSaveError("");
    try {
      const result = await saveEssaySelfAssessment(question.id, submittedAnswer, checkedStageIds);
      setSaveResult(result);
    } catch (err) {
      setSaveError(err.message || "Penilaian essay gagal disimpan.");
    } finally {
      saveInProgress.current = false;
      setSaving(false);
    }
  }

  function nextQuestion() {
    setQuestionIndex((index) => index + 1);
    setAnswer("");
    setSubmittedAnswer("");
    setSolution(null);
    setSaveResult(null);
    setHintLevel(0);
    setCheckedStageIds([]);
    setAssessmentConfirmed(false);
    setSolutionError("");
    setSaveError("");
    setAnswerError("");
  }

  function changeLevel(nextLevel) {
    setLevel(nextLevel);
    setQuestionIndex(0);
    setAnswer("");
    setSubmittedAnswer("");
    setSolution(null);
    setSaveResult(null);
    setHintLevel(0);
    setCheckedStageIds([]);
    setAssessmentConfirmed(false);
    setSolutionError("");
    setSaveError("");
    setAnswerError("");
  }

  if (exercisesState.busy) return <div className="loading-inline"><div className="spinner" /> Memuat soal latihan...</div>;
  if (exercisesState.error) return <><Notice>{exercisesState.error}</Notice><button className="button button-outline" onClick={exercisesState.refresh}>Coba lagi</button></>;
  if (!exercises.length) return <Notice>Belum ada soal essay di Supabase.</Notice>;
  return (
    <motion.div className="page-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageIntro eyebrow="LATIHAN ESSAY" title="Jelaskan langkah berpikirmu" description="Tuliskan jawaban, pelajari pembahasan, lalu nilai tahapan pengerjaanmu dengan rubric." icon={Target} />
      <div className="exercise-summary">
        <div className="difficulty-tabs">
          {difficultyOrder.map((item) => (
            <button
              key={item}
              className={level === item ? "difficulty-active" : ""}
              disabled={!exercises.some((exercise) => exercise.difficulty === item) || Boolean(submittedAnswer) || loadingSolution || saving}
              onClick={() => changeLevel(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {saveResult && <div className="score-pill"><Trophy size={16} /> Skor {saveResult.score} / {saveResult.max_score}</div>}
      </div>
      {!question ? <Notice>Tidak ada soal essay untuk tingkat {level}.</Notice> : (
      <section className="exercise-card">
        <div className="exercise-card-top">
          <span className={`difficulty-label difficulty-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>
          <span className="question-count">{question.id} <i>·</i> Soal {questionIndex % levelQuestions.length + 1} dari {levelQuestions.length}</span>
          <span className="streak-label">Essay</span>
        </div>
        <h2>{question.question}</h2>
        <form onSubmit={submitAnswer}>
          <textarea
            rows={6}
            value={submittedAnswer || answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Tuliskan jawaban dan langkah penyelesaianmu..."
            aria-label={`Jawaban essay ${question.id}`}
            disabled={Boolean(submittedAnswer) || loadingSolution || saving}
            required
            style={{ width: "100%", padding: "12px", resize: "vertical", border: "1px solid #e9eaf1", borderRadius: "10px", color: "#414357", lineHeight: 1.6 }}
          />
          {answerError && <Notice>{answerError}</Notice>}
          {!submittedAnswer && <button className="button button-primary button-small" type="submit" disabled={!answer.trim() || loadingSolution}>Kirim jawaban <ArrowRight size={15} /></button>}
        </form>

        {question.hints.length > 0 && (
          <div className="hint-area">
            {hintLevel > 0 && (
              <ol>
                {question.hints.slice(0, hintLevel).map((hint, index) => <li className="hint-message" key={`${question.id}-hint-${index}`}>{hint}</li>)}
              </ol>
            )}
            {!submittedAnswer && (
              <button
                className="hint-button"
                disabled={hintLevel >= Math.min(question.hints.length, 4)}
                onClick={() => setHintLevel((current) => Math.min(current + 1, question.hints.length, 4))}
              >
                <Lightbulb size={16} /> {hintLevel === 0 ? "Butuh petunjuk?" : `Petunjuk ${hintLevel} dari ${Math.min(question.hints.length, 4)}`}
              </button>
            )}
          </div>
        )}

        {submittedAnswer && (
          <div className="hint-message" style={{ whiteSpace: "pre-wrap" }}>
            <strong>Jawabanmu</strong>
            <p>{submittedAnswer}</p>
          </div>
        )}
        {loadingSolution && <div className="small-loading">Memuat pembahasan dan rubric...</div>}
        {solutionError && (
          <div>
            <Notice>{solutionError}</Notice>
            <button className="button button-outline button-small" disabled={loadingSolution} onClick={loadSolution}>Coba lagi</button>
          </div>
        )}
        {solution && (
          <div className="answer-explanation explanation-correct">
            <div className="explanation-title"><CheckCircle2 size={19} /> Pembahasan</div>
            <ol>
              {solution.solution_steps.map((step) => <li key={step.id}>{step.content}</li>)}
            </ol>
            <h3>Rubric penilaian mandiri</h3>
            <div className="answer-options" style={{ gridTemplateColumns: "1fr" }}>
              {solution.rubric.map((stage) => (
                <label className="answer-option" key={stage.id} style={{ cursor: saveResult ? "default" : "pointer" }}>
                  <input
                    type="checkbox"
                    checked={checkedStageIds.includes(stage.id)}
                    disabled={Boolean(saveResult) || saving}
                    onChange={(event) => setCheckedStageIds((current) =>
                      event.target.checked
                        ? [...current, stage.id]
                        : current.filter((id) => id !== stage.id)
                    )}
                  />
                  <span>{stage.label}</span>
                  <small style={{ marginLeft: "auto" }}>Bobot {stage.weight}</small>
                </label>
              ))}
            </div>
            {!saveResult && (
              <>
                <label className="answer-option" style={{ marginTop: "12px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={assessmentConfirmed}
                    disabled={saving}
                    onChange={(event) => setAssessmentConfirmed(event.target.checked)}
                  />
                  <span>Saya sudah menilai semua tahap rubric.</span>
                </label>
                {saveError && <Notice>{saveError}</Notice>}
                <button
                  className="button button-primary button-small"
                  disabled={!assessmentConfirmed || saving}
                  onClick={saveAssessment}
                  style={{ marginTop: "12px" }}
                >
                  {saving ? "Menyimpan..." : "Simpan penilaian"}
                </button>
              </>
            )}
            {saveResult && (
              <div>
                <p>Penilaian tersimpan: {saveResult.score} / {saveResult.max_score}</p>
                <button className="button button-primary button-small" onClick={nextQuestion}>Soal berikutnya <ArrowRight size={15} /></button>
              </div>
            )}
          </div>
        )}
      </section>
      )}
      <div className="scaffold-note"><Sparkles size={16} /><span><strong>Penilaian mandiri</strong> — pilih tahapan yang sudah kamu kerjakan; skor akhir berasal dari Supabase.</span></div>
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
