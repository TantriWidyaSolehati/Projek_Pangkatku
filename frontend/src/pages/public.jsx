import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowRight, ArrowLeft, BookOpen, Check, MessageCircle, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import { Notice } from "./shared.jsx";

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="brand-lockup landing-brand"><div className="brand-mark"><span>x</span><sup>n</sup></div><div><strong>ruang<span>eksponen</span></strong><small>Belajar matematika, yuk!</small></div></Link>
        <div className="landing-nav-links"><a href="#cara-belajar">Cara belajar</a><a href="#fitur">Fitur</a><Link to="/login" className="landing-login">Masuk</Link><Link to="/register" className="button button-primary button-small">Mulai belajar <ArrowRight size={16} /></Link></div>
      </header>
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="kicker-dot" /> RUANG BELAJAR MATEMATIKA SMP</div>
            <h1>Eksponen? <span>Ternyata</span><br />bisa semudah itu.</h1>
            <p>Pelajari bilangan berpangkat positif dan negatif dengan visualisasi, latihan bertahap, dan tutor yang siap membantu.</p>
            <div className="hero-actions"><Link to="/register" className="button button-primary">Mulai belajar gratis <ArrowRight size={17} /></Link><a className="text-link" href="#cara-belajar">Lihat cara belajar <ArrowDownRight size={16} /></a></div>
            <div className="hero-proof"><div className="proof-avatars"><span>A</span><span>N</span><span>R</span></div><span>Belajar pelan-pelan, <strong>pasti bisa</strong></span></div>
          </div>
          <motion.div className="hero-visual" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="floating-chip chip-top"><span className="chip-icon chip-green"><Check size={15} /></span><span><strong>Langkah kecil</strong><small>jadi makin paham</small></span></div>
            <div className="hero-math-card"><div className="math-card-top"><span>YUK, LIHAT POLANYA</span><span className="math-card-stars">✦ ✦ ✦</span></div><div className="math-eq"><span className="eq-base">2</span><sup>−3</sup><span className="eq-equals">=</span><span className="eq-fraction"><b>1</b><i /><b>8</b></span></div><div className="math-card-divider" /><div className="math-card-bottom"><span className="mini-step"><i>1</i> Pangkat negatif</span><ArrowRight size={15} /><span className="mini-step"><i>2</i> Jadi kebalikan</span></div></div>
            <div className="floating-chip chip-bottom"><span className="chip-icon chip-purple"><Sparkles size={15} /></span><span><strong>Belajar sesuai ritmemu</strong><small>kamu pasti bisa!</small></span></div>
            <div className="hero-doodle">×</div>
          </motion.div>
        </section>
        <section className="feature-strip" id="fitur"><div><span className="strip-icon strip-blue"><BookOpen size={19} /></span><span><strong>Materi terstruktur</strong><small>Dari dasar sampai mahir</small></span></div><div><span className="strip-icon strip-peach"><Target size={19} /></span><span><strong>Latihan bertahap</strong><small>Soal menyesuaikan kamu</small></span></div><div><span className="strip-icon strip-lilac"><MessageCircle size={19} /></span><span><strong>Belajar bareng</strong><small>Diskusi & tutor AI</small></span></div></section>
        <section className="landing-explain" id="cara-belajar"><div><span className="eyebrow">BELAJAR TANPA TERBURU-BURU</span><h2>Satu konsep, satu langkah kecil.</h2><p>Mulai dari mengingat perkalian, kenali pola eksponen, lalu coba soal dengan petunjuk yang bisa dikurangi saat kamu siap.</p></div><div className="landing-steps"><div><i>01</i><span><strong>Kenali konsep</strong><small>Materi ringkas dengan contoh yang jelas.</small></span></div><div><i>02</i><span><strong>Lihat polanya</strong><small>Geser pangkat dan amati perubahannya.</small></span></div><div><i>03</i><span><strong>Coba sendiri</strong><small>Latihan adaptif dan pembahasan langkah demi langkah.</small></span></div></div></section>
        <section className="landing-cta"><div className="cta-star">✦</div><div><h2>Yuk, mulai petualangan eksponenmu!</h2><p>Belajar dengan nyaman, tanpa takut salah.</p></div><Link to="/register" className="button button-white">Buat akun gratis <ArrowRight size={16} /></Link></section>
      </main>
      <footer className="landing-footer"><Link to="/" className="landing-brand brand-lockup"><div className="brand-mark"><span>x</span><sup>n</sup></div><div><strong>ruang<span>eksponen</span></strong></div></Link><span>Matematika terasa lebih dekat.</span></footer>
    </div>
  );
}

export function AuthPage({ mode }) {
  const { signIn, signUp, configured } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const title = mode === "register" ? "Buat akun belajarmu" : mode === "forgot" || mode === "reset" ? "Atur ulang kata sandi" : "Senang melihatmu lagi!";
  async function submit(event) {
    event.preventDefault();
    setError(""); setMessage(""); setBusy(true);
    try {
      if (!configured) throw new Error("Supabase belum tersambung. Salin frontend/.env.example menjadi frontend/.env.local, lalu isi URL dan anon key Supabase.");
      if (mode === "register") {
        const data = await signUp(form.email, form.password, form.username.trim());
        setMessage(data.session ? "Akun berhasil dibuat. Selamat belajar!" : "Akun dibuat. Periksa email untuk mengonfirmasi pendaftaran.");
        if (data.session) navigate("/app");
      } else if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` });
        if (resetError) throw resetError;
        setMessage("Tautan pengaturan ulang kata sandi sudah dikirim ke emailmu.");
      } else if (mode === "reset") {
        const { error: resetError } = await supabase.auth.updateUser({ password: form.password });
        if (resetError) throw resetError;
        setMessage("Kata sandi berhasil diperbarui. Kamu bisa masuk dengan kata sandi baru.");
      } else {
        await signIn(form.email, form.password);
        navigate("/app");
      }
    } catch (err) { setError(err.message || "Tidak dapat memproses permintaan."); }
    finally { setBusy(false); }
  }
  return (
    <div className="auth-page">
      <div className="auth-art"><Link to="/" className="brand-lockup landing-brand"><div className="brand-mark"><span>x</span><sup>n</sup></div><div><strong>ruang<span>eksponen</span></strong><small>Belajar matematika, yuk!</small></div></Link><div className="auth-art-copy"><span className="eyebrow">SEDIKIT DEMI SEDIKIT</span><h2>Setiap langkah<br />membuatmu <em>lebih paham.</em></h2><p>Ruang aman untuk mencoba, bertanya, dan menemukan pola.</p><div className="auth-art-equation">2<sup>−2</sup> <span>=</span> ¼ <i>✦</i></div></div><div className="auth-art-footer">Belajar matematika dengan caramu sendiri.</div></div>
      <div className="auth-panel"><Link to="/" className="auth-back"><ArrowLeft size={16} /> Kembali ke beranda</Link><div className="auth-form-wrap"><div className="eyebrow">{mode === "register" ? "MULAI PETUALANGANMU" : mode === "forgot" || mode === "reset" ? "BANTUAN AKUN" : "SELAMAT DATANG KEMBALI"}</div><h1>{title}</h1><p className="auth-subtitle">{mode === "register" ? "Daftar dulu, lalu belajar dengan nyaman." : mode === "forgot" ? "Kami akan mengirim tautan ke emailmu." : mode === "reset" ? "Buat kata sandi baru untuk akunmu." : "Masuk dan lanjutkan perjalanan belajarmu."}</p>
        <Notice>{error}</Notice><Notice type="success">{message}</Notice>
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && <label>Nama panggilan<input autoComplete="nickname" required maxLength={40} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Contoh: Naya" /></label>}
          {(mode === "register" || mode === "login" || mode === "forgot") && <label>Email<input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" /></label>}
          {(mode === "register" || mode === "login" || mode === "reset") && <label>Kata sandi<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 8 karakter" />{mode === "login" && <Link to="/forgot-password" className="forgot-link">Lupa kata sandi?</Link>}</label>}
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Memproses..." : mode === "register" ? "Buat akun" : mode === "forgot" ? "Kirim tautan" : mode === "reset" ? "Simpan kata sandi" : "Masuk"} <ArrowRight size={17} /></button>
        </form>
        {mode === "register" || mode === "login"
          ? <p className="auth-switch">{mode === "register" ? "Sudah punya akun?" : "Belum punya akun?"} <Link to={mode === "register" ? "/login" : "/register"}>{mode === "register" ? "Masuk" : "Daftar sekarang"}</Link></p>
          : mode === "reset" && <p className="auth-switch"><Link to="/login">Kembali ke masuk</Link></p>}
      </div></div>
    </div>
  );
}
