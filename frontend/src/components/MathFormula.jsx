import katex from "katex";

export default function MathFormula({ children, block = false, className = "" }) {
  const html = katex.renderToString(children, { throwOnError: false, displayMode: block });
  const Tag = block ? "div" : "span";
  return <Tag className={`math-formula ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
