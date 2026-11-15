import { motion } from "framer-motion";
import { BookOpen, Check, Sparkles, Target, UserRound } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { hasValidEssayScore, listAttempts, listProgress, listReflections } from "../services/data.js";
import { lessons, prerequisiteLessons } from "../data/curriculum.js";
import { Notice, PageIntro, useRemote } from "./shared.jsx";

const essayExerciseIds = new Set(["q1", "q2", "q3", "q4"]);

export function ProfilePage() {
  const { user, profile } = useAuth();
  const progressState = useRemote(() => listProgress(user.id), [user.id]);
  const attemptsState = useRemote(() => listAttempts(user.id), [user.id]);
  const reflectionsState = useRemote(() => listReflections(user.id), [user.id]);
  const progress = progressState.data ?? [];
  const completedLessons = progress.filter((item) => item.completion_status === "completed");
  const attemptList = attemptsState.data ?? [];
  const essayAttempts = attemptList.filter((attempt) => essayExerciseIds.has(attempt.exercise_id));
  const otherAttempts = attemptList.filter((attempt) => !essayExerciseIds.has(attempt.exercise_id));
  const scoredEssayAttempts = essayAttempts.filter(hasValidEssayScore);
  const essayScore = scoredEssayAttempts.reduce((total, attempt) => total + attempt.score, 0);
  const essayMaxScore = scoredEssayAttempts.reduce((total, attempt) => total + attempt.max_score, 0);
  const essayAchievement = essayMaxScore > 0 ? Math.round(essayScore / essayMaxScore * 100) : null;
  const accuracy = otherAttempts.length
    ? Math.round(otherAttempts.filter((item) => item.is_correct === true).length / otherAttempts.length * 100)
    : 0;
  return (
    <motion.div className="page-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageIntro eyebrow="PROFIL SISWA" title="Perjalanan belajarmu" description="Lihat progres, latihan, dan refleksi yang sudah kamu kumpulkan." icon={UserRound} />
      {(progressState.error || attemptsState.error || reflectionsState.error) && <Notice>{progressState.error || attemptsState.error || reflectionsState.error}</Notice>}
      <section className="profile-hero"><div className="profile-avatar-large">{(profile?.username || user.email || "S").slice(0, 1).toUpperCase()}</div><div><span className="eyebrow">AKUN BELAJARMU</span><h2>{profile?.username || user.email?.split("@")[0]}</h2><p>{user.email}</p><small>Bergabung {new Date(user.created_at).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</small></div></section>
      <div className="stats-grid profile-stats"><div className="stat-card"><div className="stat-heading"><span className="stat-icon stat-icon-purple"><BookOpen size={18} /></span><span>Materi selesai</span></div><strong className="stat-number">{completedLessons.length}<small> / {lessons.length + prerequisiteLessons.length}</small></strong><p>Langkah demi langkah.</p></div><div className="stat-card"><div className="stat-heading"><span className="stat-icon stat-icon-blue"><Target size={18} /></span><span>Latihan dikerjakan</span></div><strong className="stat-number">{attemptList.length}<small> soal</small></strong><p>Akurasi selain essay q1–q4: {accuracy}%</p></div><div className="stat-card"><div className="stat-heading"><span className="stat-icon stat-icon-peach"><Sparkles size={18} /></span><span>Refleksi tersimpan</span></div><strong className="stat-number">{(reflectionsState.data ?? []).length}<small> jawaban</small></strong><p>Pemahamanmu berkembang.</p></div></div>
      <section className="content-card">
        <div className="card-title-row"><div><span className="eyebrow">PENILAIAN MANDIRI</span><h3>Essay q1–q4</h3></div></div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-heading"><span>Jumlah pengerjaan essay</span></div><strong className="stat-number">{essayAttempts.length}<small> attempt</small></strong></div>
          <div className="stat-card"><div className="stat-heading"><span>Total skor essay</span></div><strong className="stat-number">{essayMaxScore > 0 ? <>{essayScore}<small> / {essayMaxScore}</small></> : "Belum tersedia"}</strong><p>Hanya attempt dengan skor valid yang dijumlahkan.</p></div>
          <div className="stat-card"><div className="stat-heading"><span>Capaian essay</span></div><strong className="stat-number">{essayAchievement === null ? "Belum tersedia" : `${essayAchievement}%`}</strong><p>Persentase skor terhadap skor maksimal, bukan akurasi jawaban benar.</p></div>
        </div>
      </section>
      <section className="content-card profile-progress"><div className="card-title-row"><div><span className="eyebrow">MATERI YANG SUDAH KAMU SELESAIKAN</span><h3>Kemajuan belajar</h3></div><span className="profile-completion">{completedLessons.length} / {lessons.length + prerequisiteLessons.length}</span></div>
        {[...prerequisiteLessons, ...lessons].map((lesson) => <div className="profile-lesson-row" key={lesson.id}><span className={`profile-check ${completedLessons.some((item) => item.lesson_id === lesson.id) ? "profile-check-done" : ""}`}>{completedLessons.some((item) => item.lesson_id === lesson.id) && <Check size={13} />}</span><span>{lesson.title}</span><small>{completedLessons.some((item) => item.lesson_id === lesson.id) ? "Selesai" : "Belum dimulai"}</small></div>)}
      </section>
    </motion.div>
  );
}
