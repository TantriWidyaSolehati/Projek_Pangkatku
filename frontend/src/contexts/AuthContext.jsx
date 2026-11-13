import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error("Could not load auth session:", error.message);
      if (active) {
        setSession(data?.session ?? null);
      }
    }).catch((error) => {
      console.error("Could not load auth session:", error);
      if (active) setSession(null);
    }).finally(() => {
      if (active) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setProfile(null);
      setLoading(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) return;
    let active = true;
    supabase.from("profiles").select("id, username").eq("id", session.user.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("Could not load profile:", error.message);
        if (active) setProfile(data ?? { id: session.user.id, username: session.user.email?.split("@")[0] });
      });
    return () => { active = false; };
  }, [session]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    configured: isSupabaseConfigured,
    async signIn(email, password) {
      if (!supabase) throw new Error("Supabase belum dikonfigurasi. Isi frontend/.env.local terlebih dahulu.");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp(email, password, username) {
      if (!supabase) throw new Error("Supabase belum dikonfigurasi. Isi frontend/.env.local terlebih dahulu.");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
      return data;
    },
    async signOut() {
      if (!supabase) return;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
