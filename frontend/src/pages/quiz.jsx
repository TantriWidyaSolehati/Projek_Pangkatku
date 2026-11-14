import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, RotateCcw, Volume2, XCircle } from "lucide-react";
import { exponentQuestions, shuffleItems } from "../data/interactiveLearning.js";
import { playFeedbackSound } from "../lib/feedbackAudio.js";
import { PageIntro } from "./shared.jsx";

export function QuizPage() {
  const [questions, setQuestions] = useState(() => shuffleItems(exponentQuestions));
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundError, setSoundError] = useState("");
  const question = questions[index];
  const correctCount = questions.filter((item) => answers[item.id] === item.answer).length;
  const answeredCount = questions.filter((item) => Object.hasOwn(answers, item.id)).length;

  function playSound(type) {
    if (!soundEnabled) return;
    setSoundError("");
    try {
      playFeedbackSound(type).catch((error) => setSoundError(error.message));
    } catch (error) {
      setSoundError(error.message);
    }
  }

  function chooseAnswer(value) {
    setAnswers((current) => ({ ...current, [question.id]: value }));
    playSound(value === question.answer ? "correct" : "wrong");
  }

  function goNext() {
    if (index + 1 === questions.length) {
      setFinished(true);
      playSound("complete");
      return;
    }
    setIndex((current) => current + 1);
  }

  function retryQuiz() {
    setQuestions(shuffleItems(exponentQuestions));
    setAnswers({});
    setIndex(0);
    setFinished(false);
    setSoundError("");
  }

  return (
    <motion.div className="page-stack" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <PageIntro eyebrow="CEK PEMAHAMANMU" title="Kuis Eksponen" description="12 soal acak dari mudah hingga sulit. Jawab satu per satu dan pelajari pembahasannya." icon={ClipboardList} />
      {soundError && <p className="music-error" role="status">{soundError}</p>}
      {!finished ? (
        <section className="quiz-card">
          <div className="quiz-toolbar">
            <div className="quiz-progress-copy"><strong>Soal {index + 1} dari {questions.length}</strong><span>{answeredCount} terjawab</span></div>
            <label className="sound-toggle"><input type="checkbox" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} /> <Volume2 size={15} /> Efek suara</label>
          </div>
          <div className="progress-track" role="progressbar" aria-label="Progres kuis" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index + 1}>
            <span style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
          </div>
          <div className="quiz-question">
            <span className={`difficulty-label difficulty-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>
            <h2>{question.prompt}</h2>
          </div>
          <div className="quiz-choices">
            {question.choices.map((choice, choiceIndex) => {
              const selected = answers[question.id] === choice;
              return <button key={`${question.id}-${choice}`} className={`quiz-choice ${selected ? "quiz-choice-selected" : ""}`} aria-pressed={selected} onClick={() => chooseAnswer(choice)}>
                <span>{String.fromCharCode(65 + choiceIndex)}</span>{choice}
              </button>;
            })}
          </div>
          {Object.hasOwn(answers, question.id) && <div className={`quiz-live-feedback ${answers[question.id] === question.answer ? "quiz-live-correct" : "quiz-live-wrong"}`} role="status">
            {answers[question.id] === question.answer ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
            <span>{answers[question.id] === question.answer ? "Jawabanmu benar. " : `Belum tepat; jawaban yang benar ${question.answer}. `}{question.explanation}</span>
          </div>}
          <div className="quiz-navigation">
            <button className="button button-outline" disabled={index === 0} onClick={() => setIndex((current) => current - 1)}><ArrowLeft size={15} /> Kembali</button>
            <button className="button button-primary" disabled={!Object.hasOwn(answers, question.id)} onClick={goNext}>{index + 1 === questions.length ? "Lihat hasil" : "Lanjut"} <ArrowRight size={15} /></button>
          </div>
        </section>
      ) : (
        <section className="quiz-result">
          <div className="quiz-result-heading"><div className="quiz-result-icon"><CheckCircle2 size={24} /></div><div><span className="eyebrow">HASIL KUIS</span><h2>{correctCount} dari {questions.length} benar</h2></div></div>
          <div className="quiz-result-stats"><div><strong>{correctCount}</strong><span>Benar</span></div><div><strong>{questions.length - correctCount}</strong><span>Salah</span></div><div><strong>{Math.round((correctCount / questions.length) * 100)}%</strong><span>Nilai sesi</span></div></div>
          <h3>Pembahasan</h3>
          <div className="quiz-review">{questions.map((item, itemIndex) => {
            const correct = answers[item.id] === item.answer;
            return <article className={`quiz-review-item ${correct ? "quiz-review-good" : "quiz-review-bad"}`} key={item.id}>
              <div className="quiz-review-title"><span>{correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />} Soal {itemIndex + 1} · {item.difficulty}</span><strong>{correct ? "Benar" : "Perlu diulang"}</strong></div>
              <p>{item.prompt}</p>
              {!correct && <small>Jawabanmu: {answers[item.id] || "Belum dijawab"} · Jawaban: {item.answer}</small>}
              <div className="quiz-review-explanation">{item.explanation}</div>
            </article>;
          })}</div>
          <button className="button button-primary" onClick={retryQuiz}><RotateCcw size={15} /> Ulangi kuis dengan soal acak</button>
          <p className="game-privacy-note">Nilai ini hanya skor latihan lokal di halaman dan tidak dicatat sebagai nilai resmi di Supabase.</p>
        </section>
      )}
    </motion.div>
  );
}
