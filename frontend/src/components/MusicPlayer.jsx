import { useEffect, useRef, useState } from "react";
import { Music2, Pause, Play, Volume2, VolumeX } from "lucide-react";

const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46];

function playTone(context, output, frequency, startAt, duration, level) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(0.001, startAt);
  envelope.gain.linearRampToValueAtTime(level, startAt + 0.035);
  envelope.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  oscillator.connect(envelope);
  envelope.connect(output);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function playStep(context, output, step) {
  const now = context.currentTime;
  playTone(context, output, melody[step % melody.length], now, 0.32, 0.16);
  if (step % 4 === 0) playTone(context, output, melody[step % melody.length] / 2, now, 0.42, 0.08);
}

export default function MusicPlayer({ userId }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.18);
  const [error, setError] = useState("");
  const [preferenceError, setPreferenceError] = useState("");
  const [loadedPreferenceKey, setLoadedPreferenceKey] = useState("");
  const contextRef = useRef(null);
  const outputRef = useRef(null);
  const timerRef = useRef(null);
  const stepRef = useRef(0);
  const preferenceKey = `pangkatku-music-v1-${userId}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(preferenceKey);
      if (saved) {
        const preferences = JSON.parse(saved);
        if (
          typeof preferences.volume !== "number" || preferences.volume < 0 || preferences.volume > 0.5 ||
          typeof preferences.muted !== "boolean"
        ) {
          throw new Error("Format preferensi musik tidak dikenali.");
        }
        setVolume(preferences.volume);
        setMuted(preferences.muted);
      }
      setPreferenceError("");
    } catch (preferenceLoadError) {
      setPreferenceError(`Preferensi musik tidak dapat dibaca: ${preferenceLoadError.message}`);
    } finally {
      setLoadedPreferenceKey(preferenceKey);
    }
  }, [preferenceKey]);

  useEffect(() => {
    if (loadedPreferenceKey !== preferenceKey) return;
    try {
      window.localStorage.setItem(preferenceKey, JSON.stringify({ volume, muted }));
      setPreferenceError("");
    } catch (preferenceSaveError) {
      setPreferenceError(`Preferensi musik tidak dapat disimpan: ${preferenceSaveError.message}`);
    }
  }, [loadedPreferenceKey, muted, preferenceKey, volume]);

  useEffect(() => {
    if (outputRef.current) outputRef.current.gain.value = muted ? 0 : volume;
  }, [muted, volume]);

  useEffect(() => () => {
    window.clearInterval(timerRef.current);
    if (contextRef.current && contextRef.current.state !== "closed") {
      contextRef.current.close().catch((closeError) => console.error("Could not close music audio:", closeError));
    }
  }, []);

  async function togglePlayback() {
    setError("");
    try {
      if (playing) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
        await contextRef.current.suspend();
        setPlaying(false);
        return;
      }

      if (!contextRef.current) {
        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextConstructor) throw new Error("Browser ini tidak mendukung musik belajar.");
        contextRef.current = new AudioContextConstructor();
        outputRef.current = contextRef.current.createGain();
        outputRef.current.gain.value = muted ? 0 : volume;
        outputRef.current.connect(contextRef.current.destination);
      }

      await contextRef.current.resume();
      playStep(contextRef.current, outputRef.current, stepRef.current);
      stepRef.current = (stepRef.current + 1) % melody.length;
      timerRef.current = window.setInterval(() => {
        playStep(contextRef.current, outputRef.current, stepRef.current);
        stepRef.current = (stepRef.current + 1) % melody.length;
      }, 420);
      setPlaying(true);
    } catch (playError) {
      setError(playError.message || "Musik belajar tidak dapat diputar.");
      setPlaying(false);
    }
  }

  return (
    <div className="study-music">
      <button className="music-play-button" onClick={togglePlayback} aria-label={playing ? "Jeda musik belajar" : "Putar musik belajar"} title={playing ? "Jeda musik belajar" : "Putar musik belajar"}>
        {playing ? <Pause size={15} /> : <Play size={15} />}
        <span className="music-player-label">{playing ? "Jeda musik" : "Musik belajar"}</span>
      </button>
      <details className="music-settings">
        <summary aria-label="Pengaturan musik belajar" title="Pengaturan musik"><Music2 size={16} /></summary>
        <div className="music-popover">
          <strong>Musik belajar</strong>
          <p>Instrumental sintetis orisinal. Tidak diputar otomatis.</p>
          <button className="music-mute-button" onClick={() => setMuted((value) => !value)}>
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            {muted ? "Nyalakan suara" : "Bisukan"}
          </button>
          <label className="music-volume">
            Volume
            <input type="range" min="0" max="0.5" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Volume musik belajar" />
          </label>
          {error && <span className="music-error" role="status">{error}</span>}
          {preferenceError && <span className="music-error" role="status">{preferenceError}</span>}
        </div>
      </details>
      {(error || preferenceError) && <span className="music-error music-inline-error" role="status">{error || preferenceError}</span>}
    </div>
  );
}
