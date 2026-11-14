import { supabase } from "../lib/supabase.js";

function requireSupabase() {
  if (!supabase) throw new Error("Fitur ini perlu koneksi Supabase. Lengkapi frontend/.env.local dan jalankan migrasi database.");
  return supabase;
}

function throwLearningProgressError(error) {
  if (error.code === "PGRST205") {
    throw new Error(
      "Tabel public.learning_progress tidak ditemukan pada database Supabase atau schema cache. " +
      "Jalankan database/migrations/20261111_create_learning_progress.sql di Supabase SQL Editor, " +
      "lalu muat ulang halaman. Riwayat jawaban latihan disimpan terpisah di exercise_attempts.",
    );
  }
  throw error;
}

export async function listProgress(userId) {
  const client = requireSupabase();
  const { data, error } = await client.from("learning_progress")
    .select("lesson_id, completion_status, progress_percentage, updated_at")
    .eq("user_id", userId);
  if (error) throwLearningProgressError(error);
  return data ?? [];
}

export async function saveProgress(userId, lessonId, completed) {
  const client = requireSupabase();
  const { error } = await client.from("learning_progress").upsert({
    user_id: userId,
    lesson_id: lessonId,
    completion_status: completed ? "completed" : "in_progress",
    progress_percentage: completed ? 100 : 50,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,lesson_id" });
  if (error) throwLearningProgressError(error);
}

export async function listAttempts() {
  const client = requireSupabase();
  const { data, error } = await client.from("exercise_attempts")
    .select("id, exercise_id, user_answer, is_correct, created_at")
    .order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function saveAttempt(exerciseId, answer) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("check_exercise_answer", {
    p_exercise_id: exerciseId,
    p_user_answer: answer,
  });
  if (error) throw error;

  if (!data || typeof data !== "object") {
    throw new Error("Respons pemeriksaan jawaban dari Supabase tidak valid.");
  }
  if (data.success !== true) {
    throw new Error(data.message || "Supabase tidak berhasil memeriksa jawaban.");
  }
  if (typeof data.is_correct !== "boolean" || typeof data.explanation !== "string") {
    throw new Error("Respons pemeriksaan jawaban dari Supabase tidak memiliki hasil yang valid.");
  }
  return { is_correct: data.is_correct, explanation: data.explanation };
}

export async function listReflections(userId) {
  const client = requireSupabase();
  const { data, error } = await client.from("reflections")
    .select("id, question, answer, created_at").eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveReflection(userId, question, answer) {
  const client = requireSupabase();
  const { error } = await client.from("reflections").insert({ user_id: userId, question, answer });
  if (error) throw error;
}

export async function listDiscussions() {
  const client = requireSupabase();
  const { data, error } = await client.from("discussions")
    .select("id, user_id, title, content, created_at, profiles!discussions_user_id_fkey(username), discussion_comments(id, user_id, parent_comment_id, content, created_at, profiles!discussion_comments_user_id_fkey(username)), discussion_likes(user_id)")
    .order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function createDiscussion(userId, title, content) {
  const client = requireSupabase();
  const { error } = await client.from("discussions").insert({ user_id: userId, title, content });
  if (error) throw error;
}

export async function createComment(userId, discussionId, content, parentCommentId = null) {
  const client = requireSupabase();
  const { error } = await client.from("discussion_comments").insert({
    user_id: userId, discussion_id: discussionId, parent_comment_id: parentCommentId, content,
  });
  if (error) throw error;
}

export async function toggleDiscussionLike(userId, discussionId, liked) {
  const client = requireSupabase();
  const query = liked
    ? client.from("discussion_likes").delete().eq("user_id", userId).eq("discussion_id", discussionId)
    : client.from("discussion_likes").insert({ user_id: userId, discussion_id: discussionId });
  const { error } = await query;
  if (error) throw error;
}

export async function reportDiscussion(userId, discussionId, reason) {
  const client = requireSupabase();
  const { error } = await client.from("discussion_reports").insert({
    reporter_id: userId, discussion_id: discussionId, reason,
  });
  if (error) throw error;
}

export async function deleteOwnDiscussion(userId, discussionId, canModerate = false) {
  const client = requireSupabase();
  let query = client.from("discussions").delete().eq("id", discussionId);
  if (!canModerate) query = query.eq("user_id", userId);
  const { error } = await query;
  if (error) throw error;
}

export async function listConversations(userId) {
  const client = requireSupabase();
  const { data, error } = await client.from("ai_conversations")
    .select("id, title, created_at, ai_messages(id, role, content, created_at)")
    .eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createConversation(userId, title) {
  const client = requireSupabase();
  const { data, error } = await client.from("ai_conversations")
    .insert({ user_id: userId, title }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function saveAiMessage(conversationId, role, content) {
  const client = requireSupabase();
  const { error } = await client.from("ai_messages").insert({ conversation_id: conversationId, role, content });
  if (error) throw error;
}

export async function deleteConversation(conversationId) {
  const client = requireSupabase();
  const { error } = await client.from("ai_conversations").delete().eq("id", conversationId);
  if (error) throw error;
}
