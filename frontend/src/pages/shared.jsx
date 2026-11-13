import { useCallback, useEffect, useState } from "react";

export function PageIntro({ eyebrow, title, description, icon: Icon }) {
  return <div className="page-intro"><div className="intro-copy"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{Icon && <div className="intro-art"><Icon size={28} strokeWidth={1.6} /></div>}</div>;
}

export function useRemote(load, dependencies = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const refresh = useCallback(async () => {
    setBusy(true);
    setError("");
    try { setData(await load()); }
    catch (err) { setError(err.message || "Terjadi kesalahan saat memuat data."); }
    finally { setBusy(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, setData, error, busy, refresh };
}

export function Notice({ children, type = "error" }) {
  if (!children) return null;
  return <div className={`notice notice-${type}`} role="status">{children}</div>;
}
