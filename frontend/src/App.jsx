import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, BookOpen, BookOpenCheck, Bot, ChevronRight, CircleHelp, ClipboardList, Compass,
  Gamepad2, GraduationCap, LayoutDashboard, LogOut, Menu, MessageCircle, PenLine,
  Sparkles, UserRound, X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "./contexts/AuthContext.jsx";
import MusicPlayer from "./components/MusicPlayer.jsx";
import { AuthPage, LandingPage } from "./pages/public.jsx";
import { DashboardPage, LessonsPage, VisualizationPage } from "./pages/learning.jsx";
import { ExercisesPage, ReflectionPage } from "./pages/practice.jsx";
import { DiscussionsPage, TutorPage } from "./pages/community.jsx";
import { ProfilePage } from "./pages/profile.jsx";
import { GamesPage } from "./pages/games.jsx";
import { QuizPage } from "./pages/quiz.jsx";
import { ExamplesPage } from "./pages/examples.jsx";

const navigation = [
  { to: "/app", label: "Beranda", icon: LayoutDashboard, end: true },
  { to: "/app/prerequisites", label: "Materi prasyarat", icon: Compass },
  { to: "/app/lessons", label: "Materi utama", icon: BookOpen },
  { to: "/app/visualization", label: "Visualisasi", icon: Activity },
  { to: "/app/exercises", label: "Latihan soal", icon: PenLine },
  { to: "/app/games", label: "Game Eksponen", icon: Gamepad2 },
  { to: "/app/quiz", label: "Kuis Eksponen", icon: ClipboardList },
  { to: "/app/examples", label: "Contoh soal", icon: BookOpenCheck },
  { to: "/app/reflection", label: "Refleksi", icon: Sparkles },
  { to: "/app/discussions", label: "Ruang diskusi", icon: MessageCircle },
  { to: "/app/tutor", label: "AI Tutor", icon: Bot },
];

function AppLayout() {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      window.alert(`Gagal keluar: ${error.message}`);
    }
  }

  return (
    <div className="app-frame">
      {menuOpen && <button className="mobile-backdrop" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><span>x</span><sup>n</sup></div>
          <div><strong>ruang<span>eksponen</span></strong><small>Belajar matematika, yuk!</small></div>
          <button className="icon-button mobile-close" onClick={() => setMenuOpen(false)} aria-label="Tutup menu"><X size={19} /></button>
        </div>
        <div className="nav-caption">RUANG BELAJAR</div>
        <nav className="side-nav" aria-label="Navigasi utama">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {label === "AI Tutor" && <span className="nav-new">AI</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><div className="tip-icon"><Sparkles size={16} /></div><strong>Belajar sedikit demi sedikit</strong><p>Konsisten latihan membantu kamu makin jago.</p></div>
          <button className="profile-shortcut" onClick={() => { navigate("/app/profile"); setMenuOpen(false); }}>
            <div className="avatar">{(profile?.username || user?.email || "S").slice(0, 1).toUpperCase()}</div>
            <span className="profile-shortcut-name"><strong>{profile?.username || user?.email?.split("@")[0]}</strong><small>Siswa</small></span>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Buka menu"><Menu size={21} /></button>
          <div className="breadcrumb"><GraduationCap size={17} /><span>Matematika SMP</span><span className="breadcrumb-divider">/</span><strong>Bilangan Berpangkat</strong></div>
          <div className="topbar-actions"><MusicPlayer userId={user.id} /><span className="online-indicator"><i /> Ruang belajarmu</span><button className="icon-button logout-button" onClick={handleSignOut} title="Keluar"><LogOut size={18} /></button></div>
        </header>
        <main className="page-content"><Outlet /></main>
        <footer className="footer-note">Dibuat untuk belajar dengan tenang <span>✦</span> RuangEksponen</footer>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Navigasi mobile">
        {navigation.slice(0, 4).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `mobile-tab ${isActive ? "mobile-tab-active" : ""}`}>
            <Icon size={19} /><span>{label === "Materi prasyarat" ? "Prasyarat" : label === "Materi utama" ? "Materi" : label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Menyiapkan ruang belajarmu...</p></div>;
  return user ? <AppLayout /> : <Navigate to="/login" replace />;
}

function NotFound() {
  return <div className="empty-page"><CircleHelp size={42} /><h1>Halaman tidak ditemukan</h1><NavLink to="/">Kembali ke beranda</NavLink></div>;
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
        <Route path="/reset-password" element={<AuthPage mode="reset" />} />
        <Route path="/app" element={<RequireAuth />}>
          <Route index element={<DashboardPage />} />
          <Route path="prerequisites" element={<LessonsPage prerequisites />} />
          <Route path="lessons" element={<LessonsPage />} />
          <Route path="visualization" element={<VisualizationPage />} />
          <Route path="exercises" element={<ExercisesPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="examples" element={<ExamplesPage />} />
          <Route path="reflection" element={<ReflectionPage />} />
          <Route path="discussions" element={<DiscussionsPage />} />
          <Route path="tutor" element={<TutorPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}
