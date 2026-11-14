import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Award, Check, CheckCircle2, Clock3, Gamepad2, Lightbulb,
  LockKeyhole, Play, Puzzle, RotateCcw, Sparkles, Target, Trophy,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { exponentQuestions, shuffleItems } from "../data/interactiveLearning.js";
import { playFeedbackSound } from "../lib/feedbackAudio.js";
import { PageIntro } from "./shared.jsx";

const gameModes = [
  { id: "challenge", label: "Tantangan Pangkat", icon: Clock3 },
  { id: "match", label: "Susun Hasil Pangkat", icon: Puzzle },
  { id: "mission", label: "Misi Eksponen", icon: Award },
  { id: "guess", label: "Tebak Jawaban", icon: Lightbulb },
];

const missionLevels = ["Mudah", "Sedang", "Sulit"];

function chooseRandomQuestions(count, excludeId) {
  return shuffleItems(exponentQuestions.filter((question) => question.id !== excludeId)).slice(0, count);
}

function AnswerChoices({ question, onChoose, feedback }) {
  return (
    <div className="interactive-choices">
      {question.choices.map((choice, index) => {
        const selected = feedback?.choice === choice;
        const isCorrect = feedback && choice === question.answer;
        return (
          <button
            className={`interactive-choice ${selected ? "interactive-choice-selected" : ""} ${isCorrect ? "interactive-choice-correct" : selected && feedback && !feedback.correct ? "interactive-choice-wrong" : ""}`}
            disabled={Boolean(feedback)}
            key={`${question.id}-${choice}`}
            onClick={() => onChoose(choice)}
          >
            <span className="interactive-choice-letter">{String.fromCharCode(65 + index)}</span>
            <span>{choice}</span>
            {isCorrect && <CheckCircle2 size={17} />}
          </button>
        );
      })}
    </div>
  );
}

function GameFeedback({ question, feedback, onContinue, continueLabel = "Lanjut" }) {
  if (!feedback) return null;
  return (
    <div className={`interactive-feedback ${feedback.correct ? "interactive-feedback-good" : "interactive-feedback-retry"}`} role="status">
      <strong>{feedback.correct ? "Tepat sekali!" : "Belum tepat, coba pahami langkahnya."}</strong>
      <p>{question.explanation}</p>
      {!feedback.correct && <small>Jawaban: {question.answer}</small>}
      {onContinue && <button className="button button-primary button-small" onClick={onContinue}>{continueLabel} <ArrowRight size={14} /></button>}
    </div>
  );
}

function ChallengeMode({ playSound }) {
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const question = questions[index];

  useEffect(() => {
    if (!running) return undefined;
    if (timeLeft <= 0) {
      setRunning(false);
      setFinished(true);
      return undefined;
    }
    const timer = window.setTimeout(() => setTimeLeft((remaining) => remaining - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [running, timeLeft]);

  function startChallenge() {
    setQuestions(chooseRandomQuestions(10));
    setIndex(0);
    setScore(0);
    setTimeLeft(duration);
    setFeedback(null);
    setFinished(false);
    setRunning(true);
  }

  function answerQuestion(choice) {
    if (!question || feedback) return;
    const correct = choice === question.answer;
    setFeedback({ correct, choice });
    if (correct) setScore((current) => current + 1);
    playSound(correct ? "correct" : "wrong");
  }

  function nextQuestion() {
    if (index + 1 >= questions.length) {
      setRunning(false);
      setFinished(true);
      playSound("complete");
      return;
    }
    setIndex((current) => current + 1);
    setFeedback(null);
  }

  return (
    <section className="game-panel">
      <div className="interactive-panel-heading">
        <div><span className="eyebrow">JAWAB SEBELUM WAKTU HABIS</span><h2>Tantangan Pangkat</h2></div>
        <span className="game-score"><Trophy size={16} /> {score} poin</span>
      </div>
      {!running && !finished && (
        <div className="game-start">
          <p>Jawab sebanyak mungkin dari 10 soal. Pilih durasi yang nyaman untukmu.</p>
          <label className="duration-select">Batas waktu
            <select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
              <option value={15}>15 detik</option>
              <option value={30}>30 detik</option>
              <option value={45}>45 detik</option>
              <option value={60}>60 detik</option>
            </select>
          </label>
          <button className="button button-primary" onClick={startChallenge}><Play size={15} /> Mulai tantangan</button>
        </div>
      )}
      {running && question && (
        <>
          <div className="game-progress-row">
            <span>Soal {index + 1} dari {questions.length}</span>
            <span className={timeLeft <= 10 ? "timer-warning" : ""}><Clock3 size={15} /> {timeLeft} dtk</span>
          </div>
          <div className="progress-track" role="progressbar" aria-label="Progres tantangan" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index}><span style={{ width: `${(index / questions.length) * 100}%` }} /></div>
          <div className="game-question"><span className={`difficulty-label difficulty-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span><h3>{question.prompt}</h3></div>
          <AnswerChoices question={question} onChoose={answerQuestion} feedback={feedback} />
          <GameFeedback question={question} feedback={feedback} onContinue={feedback ? nextQuestion : null} continueLabel={index + 1 === questions.length ? "Lihat hasil" : "Soal berikutnya"} />
        </>
      )}
      {finished && (
        <div className="game-finished" role="status">
          <Trophy size={32} />
          <h3>Tantangan selesai!</h3>
          <p>Kamu menjawab benar <strong>{score}</strong> dari {questions.length} soal.</p>
          <button className="button button-primary" onClick={startChallenge}><RotateCcw size={15} /> Main lagi</button>
        </div>
      )}
    </section>
  );
}

function MatchMode({ playSound }) {
  const [pairs, setPairs] = useState(() => chooseRandomQuestions(5));
  const [answerOrder, setAnswerOrder] = useState(() => shuffleItems(pairs));
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [matchedIds, setMatchedIds] = useState([]);
  const [status, setStatus] = useState(null);

  function selectQuestion(question) {
    if (matchedIds.includes(question.id)) return;
    setSelectedQuestion(question.id);
    setStatus(null);
  }

  function selectAnswer(question) {
    if (!selectedQuestion || matchedIds.includes(question.id)) return;
    if (selectedQuestion === question.id) {
      const nextMatched = [...matchedIds, question.id];
      setMatchedIds(nextMatched);
      setStatus({ correct: true, text: nextMatched.length === pairs.length ? "Semua pasangan cocok. Hebat!" : "Pasangan cocok!" });
      setSelectedQuestion("");
      playSound(nextMatched.length === pairs.length ? "complete" : "correct");
    } else {
      setStatus({ correct: false, text: "Belum cocok. Pilih hasil yang sesuai dengan soal terpilih." });
      playSound("wrong");
    }
  }

  function shuffleMatches() {
    const nextPairs = chooseRandomQuestions(5);
    setPairs(nextPairs);
    setAnswerOrder(shuffleItems(nextPairs));
    setSelectedQuestion("");
    setMatchedIds([]);
    setStatus(null);
  }

  return (
    <section className="game-panel">
      <div className="interactive-panel-heading"><div><span className="eyebrow">PILIH SOAL, LALU PILIH HASIL</span><h2>Susun Hasil Pangkat</h2></div><span className="game-score"><Puzzle size={16} /> {matchedIds.length}/{pairs.length}</span></div>
      <p className="game-instructions">Cocokkan setiap soal dengan hasil yang benar. Mekanisme klik ini dapat digunakan dengan keyboard maupun layar sentuh.</p>
      <div className="matching-grid">
        <div><h3>Soal</h3>{pairs.map((question) => <button key={question.id} className={`matching-card ${selectedQuestion === question.id ? "matching-card-selected" : ""} ${matchedIds.includes(question.id) ? "matching-card-done" : ""}`} onClick={() => selectQuestion(question)} disabled={matchedIds.includes(question.id)}>{matchedIds.includes(question.id) && <Check size={15} />}{question.prompt}</button>)}</div>
        <div><h3>Hasil</h3>{answerOrder.map((question) => <button key={question.id} className={`matching-card ${matchedIds.includes(question.id) ? "matching-card-done" : ""}`} onClick={() => selectAnswer(question)} disabled={!selectedQuestion || matchedIds.includes(question.id)}>{matchedIds.includes(question.id) && <Check size={15} />}{question.answer}</button>)}</div>
      </div>
      {status && <div className={`matching-status ${status.correct ? "matching-status-good" : "matching-status-wrong"}`} role="status">{status.text}</div>}
      {matchedIds.length === pairs.length && <div className="achievement-chip"><Award size={17} /> Lencana: Ahli Pencocok Eksponen</div>}
      <button className="button button-outline button-small" onClick={shuffleMatches}><RotateCcw size={14} /> Acak ulang pasangan</button>
    </section>
  );
}

function MissionMode({ playSound }) {
  const { user } = useAuth();
  const storageKey = `pangkatku-missions-${user.id}`;
  const [completedLevels, setCompletedLevels] = useState([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [activeLevel, setActiveLevel] = useState(missionLevels[0]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [missionFinished, setMissionFinished] = useState(false);
  const questions = exponentQuestions.filter((question) => question.difficulty === activeLevel);
  const question = questions[index];
  const activeLevelIndex = missionLevels.indexOf(activeLevel);
  const progressPercent = Math.round(((activeLevelIndex + index / questions.length) / missionLevels.length) * 100);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || !parsed.every((level) => missionLevels.includes(level))) {
          throw new Error("Format progres misi tidak dikenali.");
        }
        setCompletedLevels(parsed);
      }
    } catch (error) {
      setStorageError(`Progres misi lokal tidak dapat dibaca: ${error.message}`);
    } finally {
      setStorageReady(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(completedLevels));
    } catch (error) {
      setStorageError(`Progres misi tidak dapat disimpan di perangkat: ${error.message}`);
    }
  }, [completedLevels, storageKey, storageReady]);

  function chooseLevel(level) {
    setActiveLevel(level);
    setIndex(0);
    setFeedback(null);
    setMissionFinished(false);
  }

  function answerQuestion(choice) {
    if (!question || feedback) return;
    const correct = choice === question.answer;
    setFeedback({ correct, choice });
    playSound(correct ? "correct" : "wrong");
  }

  function nextQuestion() {
    if (index + 1 < questions.length) {
      setIndex((current) => current + 1);
      setFeedback(null);
      return;
    }
    setCompletedLevels((levels) => [...new Set([...levels, activeLevel])]);
    setMissionFinished(true);
    playSound("complete");
  }

  function retryQuestion() {
    setFeedback(null);
  }

  return (
    <section className="game-panel">
      <div className="interactive-panel-heading"><div><span className="eyebrow">SELESAIKAN LEVEL UNTUK MEMBUKA MISI</span><h2>Misi Eksponen</h2></div><span className="game-score"><Award size={16} /> {completedLevels.length}/{missionLevels.length} level</span></div>
      {storageError && <p className="music-error" role="status">{storageError}</p>}
      <div className="mission-levels">{missionLevels.map((level, levelIndex) => {
        const unlocked = levelIndex === 0 || completedLevels.includes(missionLevels[levelIndex - 1]);
        const complete = completedLevels.includes(level);
        return <button key={level} className={`mission-level ${activeLevel === level ? "mission-level-active" : ""} ${complete ? "mission-level-complete" : ""}`} onClick={() => chooseLevel(level)} disabled={!unlocked || !storageReady}>
          {complete ? <CheckCircle2 size={18} /> : unlocked ? <Target size={18} /> : <LockKeyhole size={18} />}
          <span><strong>{level}</strong><small>{complete ? "Selesai" : `${exponentQuestions.filter((item) => item.difficulty === level).length} soal`}</small></span>
        </button>;
      })}</div>
      <div className="mission-progress"><div className="progress-track" role="progressbar" aria-label="Progres misi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><span style={{ width: `${progressPercent}%` }} /></div><small>Progres level {activeLevel}: {index} dari {questions.length} soal</small></div>
      {missionFinished ? (
        <div className="game-finished mission-finished" role="status"><Award size={30} /><h3>Misi {activeLevel} selesai!</h3><p>{activeLevelIndex < missionLevels.length - 1 ? `Level ${missionLevels[activeLevelIndex + 1]} sekarang terbuka.` : "Kamu menuntaskan seluruh misi eksponen!"}</p><button className="button button-primary button-small" onClick={() => activeLevelIndex < missionLevels.length - 1 ? chooseLevel(missionLevels[activeLevelIndex + 1]) : chooseLevel(activeLevel)}>{activeLevelIndex < missionLevels.length - 1 ? "Lanjut ke level berikutnya" : "Ulangi level"} <ArrowRight size={14} /></button></div>
      ) : question && (
        <>
          <div className="game-question"><span className={`difficulty-label difficulty-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span><span className="question-count">Misi {activeLevelIndex + 1} · Soal {index + 1}/{questions.length}</span><h3>{question.prompt}</h3></div>
          <AnswerChoices question={question} onChoose={answerQuestion} feedback={feedback} />
          <GameFeedback question={question} feedback={feedback} onContinue={feedback ? (feedback.correct ? nextQuestion : retryQuestion) : null} continueLabel={!feedback?.correct ? "Coba lagi" : index + 1 === questions.length ? "Selesaikan misi" : "Lanjut"} />
        </>
      )}
    </section>
  );
}

function GuessMode({ playSound }) {
  const [question, setQuestion] = useState(() => chooseRandomQuestions(1)[0]);
  const [feedback, setFeedback] = useState(null);

  function answerQuestion(choice) {
    if (feedback) return;
    const correct = choice === question.answer;
    setFeedback({ correct, choice });
    playSound(correct ? "correct" : "wrong");
  }

  function nextQuestion() {
    setQuestion(chooseRandomQuestions(1, question.id)[0]);
    setFeedback(null);
  }

  return (
    <section className="game-panel">
      <div className="interactive-panel-heading"><div><span className="eyebrow">SOAL ACAK, PENJELASAN LANGSUNG</span><h2>Tebak Jawaban</h2></div><span className="game-score"><Sparkles size={16} /> Tebak!</span></div>
      <div className="game-question"><span className={`difficulty-label difficulty-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span><h3>{question.prompt}</h3></div>
      <AnswerChoices question={question} onChoose={answerQuestion} feedback={feedback} />
      {feedback && <GameFeedback question={question} feedback={feedback} onContinue={nextQuestion} continueLabel="Soal acak berikutnya" />}
    </section>
  );
}

export function GamesPage() {
  const [mode, setMode] = useState("challenge");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundError, setSoundError] = useState("");

  function playSound(type) {
    if (!soundEnabled) return;
    setSoundError("");
    try {
      playFeedbackSound(type).catch((error) => setSoundError(error.message));
    } catch (error) {
      setSoundError(error.message);
    }
  }

  return (
    <motion.div className="page-stack" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <PageIntro eyebrow="BELAJAR SAMBIL BERMAIN" title="Game Eksponen" description="Pilih permainan, kumpulkan pencapaian, dan pahami konsep lewat tantangan singkat." icon={Gamepad2} />
      <div className="game-toolbar">
        <div className="game-mode-tabs" aria-label="Pilih permainan">
          {gameModes.map(({ id, label, icon: Icon }) => <button key={id} className={mode === id ? "game-mode-active" : ""} aria-pressed={mode === id} onClick={() => { setMode(id); setSoundError(""); }}><Icon size={16} /><span>{label}</span></button>)}
        </div>
        <label className="sound-toggle"><input type="checkbox" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} /> Efek suara</label>
      </div>
      {soundError && <p className="music-error" role="status">{soundError}</p>}
      <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {mode === "challenge" && <ChallengeMode playSound={playSound} />}
        {mode === "match" && <MatchMode playSound={playSound} />}
        {mode === "mission" && <MissionMode playSound={playSound} />}
        {mode === "guess" && <GuessMode playSound={playSound} />}
      </motion.div>
      <div className="game-privacy-note"><Lightbulb size={16} /><span>Skor dan progres misi disimpan di sesi/perangkat ini, bukan dikirim ke Supabase. Data ini hanya untuk pengalaman belajar dan bukan catatan nilai resmi.</span></div>
    </motion.div>
  );
}
