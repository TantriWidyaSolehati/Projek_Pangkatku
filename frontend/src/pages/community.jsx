import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CircleHelp, Flag, Heart, MessageCircle, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import {
  createComment, createConversation, createDiscussion, deleteConversation, deleteOwnDiscussion,
  listConversations, listDiscussions, reportDiscussion, saveAiMessage, toggleDiscussionLike,
} from "../services/data.js";
import { Notice, PageIntro, useRemote } from "./shared.jsx";

export function DiscussionsPage() {
  const { user, profile } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [replyingTo, setReplyingTo] = useState("");
  const [posting, setPosting] = useState(false);
  const canModerate = ["admin", "teacher"].includes(user.app_metadata?.role);

  const refresh = useCallback(async () => {
    setBusy(true); setError("");
    try { setDiscussions(await listDiscussions()); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!supabase) return undefined;
    const channel = supabase.channel("public-discussion-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "discussions" }, () => {
        setNotice("Ada pembaruan diskusi."); refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "discussion_comments" }, refresh)
      .subscribe((status, subscriptionError) => {
        if (subscriptionError) setError(`Realtime diskusi gagal: ${subscriptionError.message}`);
        if (status === "CHANNEL_ERROR") setError("Realtime diskusi tidak tersedia. Coba muat ulang halaman.");
      });
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  const filtered = discussions.filter((item) => `${item.title} ${item.content}`.toLowerCase().includes(search.toLowerCase()));
  async function submitDiscussion(event) {
    event.preventDefault();
    if (draft.title.trim().length < 5 || draft.content.trim().length < 10) {
      setError("Judul minimal 5 karakter dan isi diskusi minimal 10 karakter.");
      return;
    }
    setPosting(true); setError("");
    try {
      await createDiscussion(user.id, draft.title.trim(), draft.content.trim());
      setDraft({ title: "", content: "" }); setNotice("Pertanyaanmu berhasil dipublikasikan."); await refresh();
    } catch (err) { setError(err.message); }
    finally { setPosting(false); }
  }
  async function submitComment(event, discussionId, parentCommentId = null) {
    event.preventDefault();
    const key = parentCommentId || discussionId;
    const content = (commentDrafts[key] ?? "").trim();
    if (content.length < 2) return;
    setPosting(true); setError("");
    try {
      await createComment(user.id, discussionId, content, parentCommentId || null);
      setCommentDrafts({ ...commentDrafts, [key]: "" }); setReplyingTo(""); await refresh();
    } catch (err) { setError(err.message); }
    finally { setPosting(false); }
  }
  async function handleLike(item) {
    const liked = (item.discussion_likes ?? []).some((like) => like.user_id === user.id);
    try { await toggleDiscussionLike(user.id, item.id, liked); await refresh(); }
    catch (err) { setError(err.message); }
  }
  async function handleDelete(item) {
    if (!window.confirm("Hapus diskusi ini? Tindakan ini tidak dapat dibatalkan.")) return;
    try { await deleteOwnDiscussion(user.id, item.id, canModerate); setNotice("Diskusi berhasil dihapus."); await refresh(); }
    catch (err) { setError(err.message); }
  }
  async function handleReport(item) {
    const reason = window.prompt("Jelaskan alasan melaporkan diskusi ini (maksimal 300 karakter):");
    if (reason === null) return;
    if (!reason.trim()) { setError("Alasan laporan tidak boleh kosong."); return; }
    try { await reportDiscussion(user.id, item.id, reason.trim().slice(0, 300)); setNotice("Laporan diteruskan ke moderator."); }
    catch (err) { setError(err.message); }
  }
  return (
    <motion.div className="page-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageIntro eyebrow="BELAJAR BARENG" title="Ruang diskusi" description="Tanya, berbagi cara berpikir, dan bantu teman memahami eksponen." icon={MessageCircle} />
      {error && <Notice>{error}</Notice>}{notice && <Notice type="success">{notice}</Notice>}
      <section className="discussion-compose content-card"><div className="compose-title"><div className="discussion-avatar">{(profile?.username || "S").slice(0, 1).toUpperCase()}</div><div><h3>Punya pertanyaan?</h3><p>Teman-teman di sini siap berdiskusi.</p></div></div><form onSubmit={submitDiscussion}><input required minLength={5} maxLength={120} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Judul, misalnya: Kenapa 2⁻³ jadi pecahan?" aria-label="Judul diskusi" /><textarea required minLength={10} maxLength={2000} rows={3} value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="Tuliskan pertanyaan atau pemikiranmu..." aria-label="Isi diskusi" /><div className="compose-footer"><span>{draft.content.length}/2000 · Sopan dan saling menghargai, ya.</span><button className="button button-primary button-small" disabled={posting}><Send size={14} /> {posting ? "Mengirim..." : "Bagikan"}</button></div></form></section>
      <div className="discussion-toolbar"><div><span className="eyebrow">DISKUSI TERBARU</span><h2>Obrolan belajar</h2></div><label className="discussion-search"><CircleHelp size={15} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari topik..." aria-label="Cari topik diskusi" /></label></div>
      {busy ? <div className="loading-inline"><div className="spinner" /> Memuat diskusi...</div> : filtered.length ? <div className="discussion-list">{filtered.map((item) => {
        const likes = item.discussion_likes ?? [];
        const liked = likes.some((like) => like.user_id === user.id);
        const topComments = (item.discussion_comments ?? []).filter((comment) => !comment.parent_comment_id);
        const replies = (item.discussion_comments ?? []).filter((comment) => comment.parent_comment_id);
        return <article className="discussion-card" key={item.id}>
          <div className="discussion-author-row"><div className="discussion-avatar">{(item.profiles?.username || "S").slice(0, 1).toUpperCase()}</div><div className="discussion-author"><strong>{item.profiles?.username || "Siswa"}</strong><small>{new Date(item.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</small></div><button className="icon-button report-button" title="Laporkan diskusi" onClick={() => handleReport(item)}><Flag size={16} /></button>{(item.user_id === user.id || canModerate) && <button className="icon-button report-button" title={item.user_id === user.id ? "Hapus diskusimu" : "Moderasi: hapus diskusi"} onClick={() => handleDelete(item)}><Trash2 size={16} /></button>}</div>
          <h3>{item.title}</h3><p className="discussion-content">{item.content}</p>
          <div className="discussion-actions"><button className={`discussion-action ${liked ? "discussion-liked" : ""}`} onClick={() => handleLike(item)}><Heart size={16} fill={liked ? "currentColor" : "none"} /> {likes.length} suka</button><span><MessageCircle size={16} /> {item.discussion_comments?.length ?? 0} komentar</span></div>
          {topComments.length > 0 && <div className="comments-list">{topComments.map((comment) => <div className="comment-thread" key={comment.id}><div className="comment-item"><div className="comment-avatar">{(comment.profiles?.username || "S").slice(0, 1).toUpperCase()}</div><div className="comment-bubble"><strong>{comment.profiles?.username || "Siswa"}</strong><p>{comment.content}</p></div><button className="reply-link" onClick={() => setReplyingTo(replyingTo === comment.id ? "" : comment.id)}>Balas</button></div>
            {replies.filter((reply) => reply.parent_comment_id === comment.id).map((reply) => <div className="comment-item comment-reply" key={reply.id}><div className="comment-avatar">{(reply.profiles?.username || "S").slice(0, 1).toUpperCase()}</div><div className="comment-bubble"><strong>{reply.profiles?.username || "Siswa"}</strong><p>{reply.content}</p></div></div>)}
            {replyingTo === comment.id && <form className="reply-form" onSubmit={(event) => submitComment(event, item.id, comment.id)}><input required maxLength={1000} value={commentDrafts[comment.id] ?? ""} onChange={(event) => setCommentDrafts({ ...commentDrafts, [comment.id]: event.target.value })} placeholder={`Balas ${comment.profiles?.username || "siswa"}...`} /><button className="button button-soft button-small" disabled={posting}>Balas</button></form>}
          </div>)}</div>}
          <form className="comment-compose" onSubmit={(event) => submitComment(event, item.id)}><input required maxLength={1000} value={commentDrafts[item.id] ?? ""} onChange={(event) => setCommentDrafts({ ...commentDrafts, [item.id]: event.target.value })} placeholder="Tulis komentar..." aria-label="Tulis komentar" /><button className="icon-button send-comment" aria-label="Kirim komentar" disabled={posting}><Send size={16} /></button></form>
        </article>;
      })}</div> : <div className="empty-discussions"><MessageCircle size={24} /><strong>Belum ada diskusi</strong><span>Jadilah yang pertama mengajukan pertanyaan!</span></div>}
      <div className="community-guideline"><Sparkles size={16} /><span>Jaga ruang ini tetap ramah: sampaikan pendapat dengan sopan dan jangan bagikan informasi pribadi.</span></div>
    </motion.div>
  );
}

export function TutorPage() {
  const { user, session } = useAuth();
  const conversationsState = useRemote(() => listConversations(user.id), [user.id]);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || "";
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const apiUrl = (configuredApiUrl || (isLocalHost ? "http://localhost:8000" : "")).replace(/\/$/, "");
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    const selected = (conversationsState.data ?? []).find((item) => item.id === conversationId);
    setMessages((selected?.ai_messages ?? []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
  }, [conversationId, conversationsState.data]);
  const sendMessage = async (event, preparedText = input) => {
    event?.preventDefault();
    const text = preparedText.trim();
    if (!text || busy) return;
    setInput(""); setBusy(true); setError("");
    let activeConversation = conversationId;
    const optimistic = [...messages, { role: "user", content: text, localId: Date.now() }];
    setMessages(optimistic);
    try {
      if (!apiUrl) {
        throw new Error("URL API FastAPI belum dikonfigurasi. Isi VITE_API_URL di frontend/.env.local.");
      }
      if (window.location.protocol === "https:" && new URL(apiUrl).protocol !== "https:") {
        throw new Error("AI Tutor harus menggunakan URL API HTTPS saat website dibuka melalui HTTPS.");
      }
      if (!activeConversation) {
        activeConversation = await createConversation(user.id, text.slice(0, 70));
        setConversationId(activeConversation);
      }
      await saveAiMessage(activeConversation, "user", text);
      const response = await fetch(`${apiUrl}/api/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ messages: optimistic.slice(-10).map(({ role, content }) => ({ role, content })) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || `Tutor tidak dapat menjawab (HTTP ${response.status}).`);
      if (typeof payload.answer !== "string" || !payload.answer.trim()) throw new Error("Respons AI kosong atau tidak sesuai format.");
      await saveAiMessage(activeConversation, "assistant", payload.answer);
      setMessages((current) => [...current, { role: "assistant", content: payload.answer, localId: Date.now() + 1 }]);
      await conversationsState.refresh();
    } catch (err) {
      setError(err.message || "Tidak dapat menghubungi AI Tutor.");
      setMessages((current) => current.filter((message) => message.localId !== optimistic[optimistic.length - 1].localId));
    } finally { setBusy(false); }
  };
  async function clearConversation() {
    if (!conversationId) { setMessages([]); return; }
    if (!window.confirm("Hapus percakapan ini secara permanen?")) return;
    try {
      await deleteConversation(conversationId);
      setConversationId(""); setMessages([]); await conversationsState.refresh();
    } catch (err) { setError(err.message); }
  }
  const prompts = ["Mengapa 2⁻³ menjadi ⅛?", "Apa bedanya pangkat 0 dan pangkat negatif?", "Bantu aku memahami 3² × 3⁻⁴"];
  return (
    <motion.div className="page-stack tutor-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageIntro eyebrow="TEMAN BELAJAR" title="AI Tutor matematika" description="Tanya apa saja tentang bilangan berpangkat. Kita pahami langkahnya bersama-sama." icon={Sparkles} />
      <div className="tutor-layout">
        <aside className="tutor-history"><div className="tutor-history-head"><strong>Riwayat obrolan</strong><button className="icon-button" title="Mulai percakapan baru" onClick={() => { setConversationId(""); setMessages([]); }}><Plus size={18} /></button></div>
          {(conversationsState.data ?? []).length ? <div className="conversation-list">{conversationsState.data.map((conversation) => <button key={conversation.id} className={`conversation-link ${conversation.id === conversationId ? "conversation-active" : ""}`} onClick={() => setConversationId(conversation.id)}><MessageCircle size={15} /><span>{conversation.title}</span></button>)}</div> : <p className="history-empty">Percakapan tersimpan di sini.</p>}
        </aside>
        <section className="tutor-chat"><div className="tutor-chat-header"><div className="tutor-avatar"><Sparkles size={18} /></div><div><strong>Kak Eksponen</strong><small><i /> Siap membantu belajar</small></div>{conversationId && <button className="icon-button chat-delete" title="Hapus percakapan" onClick={clearConversation}><Trash2 size={17} /></button>}</div>
          <div className="chat-messages">
            {!messages.length && <div className="tutor-welcome"><div className="tutor-welcome-icon"><Sparkles size={22} /></div><h3>Halo, teman belajar!</h3><p>Aku bisa bantu jelaskan konsep dan memberi petunjuk langkah demi langkah. Mau mulai dari mana?</p><div className="prompt-chips">{prompts.map((prompt) => <button key={prompt} onClick={() => sendMessage(null, prompt)}>{prompt} <ArrowRight size={13} /></button>)}</div></div>}
            {messages.map((message, index) => <div className={`chat-message ${message.role === "user" ? "chat-message-user" : "chat-message-ai"}`} key={message.id || message.localId || index}><div className="message-avatar">{message.role === "user" ? (user.email?.slice(0, 1).toUpperCase() || "S") : <Sparkles size={14} />}</div><div className="message-content"><small>{message.role === "user" ? "Kamu" : "Kak Eksponen"}</small><p>{message.content}</p></div></div>)}
            {busy && <div className="typing-indicator"><span /><span /><span /> Kak Eksponen sedang berpikir...</div>}<div ref={bottomRef} />
          </div>
          {error && <div className="chat-error"><Notice>{error}</Notice><small>Pastikan backend FastAPI aktif dan AI_API_KEY sudah dikonfigurasi.</small></div>}
          <form className="chat-input-form" onSubmit={sendMessage}><textarea rows={2} maxLength={1500} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tulis pertanyaanmu di sini..." aria-label="Pesan untuk AI Tutor" disabled={busy} /><button className="send-chat-button" disabled={busy || !input.trim()} aria-label="Kirim pesan"><Send size={17} /></button><small>AI dapat keliru. Gunakan sebagai teman belajar, ya.</small></form>
        </section>
      </div>
    </motion.div>
  );
}
