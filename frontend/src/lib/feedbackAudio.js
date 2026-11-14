export function playFeedbackSound(type) {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return Promise.reject(new Error("Browser ini tidak mendukung efek suara."));

  const context = new AudioContextConstructor();
  const notes = type === "correct" || type === "complete" ? [660, 880] : [330, 247];
  const gain = context.createGain();
  gain.gain.value = 0.07;
  gain.connect(context.destination);

  return context.resume().then(() => {
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const noteGain = context.createGain();
      const startAt = context.currentTime + index * 0.12;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      noteGain.gain.setValueAtTime(0.001, startAt);
      noteGain.gain.linearRampToValueAtTime(0.7, startAt + 0.025);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.22);
      oscillator.connect(noteGain);
      noteGain.connect(gain);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.24);
      if (index === notes.length - 1) oscillator.addEventListener("ended", () => context.close(), { once: true });
    });
  }).catch((error) => {
    context.close();
    throw error;
  });
}
