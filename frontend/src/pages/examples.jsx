import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, BookOpenCheck, CheckCircle2, Lightbulb } from "lucide-react";
import MathFormula from "../components/MathFormula.jsx";
import { workedExamples } from "../data/interactiveLearning.js";
import { PageIntro } from "./shared.jsx";

export function ExamplesPage() {
  const [openExamples, setOpenExamples] = useState([]);

  function toggleExample(id) {
    setOpenExamples((current) => current.includes(id)
      ? current.filter((exampleId) => exampleId !== id)
      : [...current, id]);
  }

  return (
    <motion.div className="page-stack" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <PageIntro eyebrow="PAHAMI LANGKAHNYA" title="Contoh Soal Eksponen" description="Buka pembahasan saat kamu siap. Setiap contoh memuat rumus, langkah, jawaban, dan konsep kuncinya." icon={BookOpenCheck} />
      <div className="examples-intro"><Lightbulb size={18} /><span>Coba kerjakan soalnya sendiri dulu, lalu pilih <strong>Lihat Pembahasan</strong> untuk membandingkan langkahmu.</span></div>
      <div className="worked-examples">
        {workedExamples.map((example, index) => {
          const isOpen = openExamples.includes(example.id);
          return <article className={`worked-example ${isOpen ? "worked-example-open" : ""}`} key={example.id}>
            <div className="worked-example-top"><span className="worked-example-number">{String(index + 1).padStart(2, "0")}</span><span className={`difficulty-label difficulty-${example.difficulty.toLowerCase()}`}>{example.difficulty}</span></div>
            <h2>{example.title}</h2>
            <p className="worked-example-question">{example.question}</p>
            <button className="button button-soft button-small" aria-expanded={isOpen} aria-controls={`${example.id}-solution`} onClick={() => toggleExample(example.id)}>
              {isOpen ? "Tutup Pembahasan" : "Lihat Pembahasan"} {isOpen ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            </button>
            {isOpen && <div className="worked-example-solution" id={`${example.id}-solution`}>
              <div><small>RUMUS YANG DIGUNAKAN</small><div className="formula-box"><MathFormula>{example.formula}</MathFormula></div></div>
              <div><small>LANGKAH PENYELESAIAN</small><ol>{example.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
              <div className="worked-example-answer"><CheckCircle2 size={17} /><span>Jawaban akhir: <strong>{example.answer}</strong></span></div>
              <div className="example-note"><Lightbulb size={15} /><span>{example.concept}</span></div>
            </div>}
          </article>;
        })}
      </div>
    </motion.div>
  );
}
