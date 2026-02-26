'use client';

import { useMemo } from 'react';
import katex from 'katex';

/**
 * Replace common Unicode characters with their LaTeX equivalents
 * so pasted text renders correctly in KaTeX.
 */
function normalizeMathUnicode(text: string): string {
  return text
    .replace(/\u2212/g, '-')       // minus sign
    .replace(/\u00D7/g, '\\times') // multiplication sign ×
    .replace(/\u00F7/g, '\\div')   // division sign ÷
    .replace(/\u22C5/g, '\\cdot')  // dot operator ⋅
    .replace(/\u2264/g, '\\leq')   // ≤
    .replace(/\u2265/g, '\\geq')   // ≥
    .replace(/\u2260/g, '\\neq')   // ≠
    .replace(/\u221E/g, '\\infty') // ∞
    .replace(/\u03B1/g, '\\alpha') // α
    .replace(/\u03B2/g, '\\beta')  // β
    .replace(/\u03B3/g, '\\gamma') // γ
    .replace(/\u03B4/g, '\\delta') // δ
    .replace(/\u03C0/g, '\\pi')    // π
    .replace(/\u03B8/g, '\\theta') // θ
    .replace(/\u03BB/g, '\\lambda')// λ
    .replace(/\u03C3/g, '\\sigma') // σ
    .replace(/\u2211/g, '\\sum')   // ∑
    .replace(/\u220F/g, '\\prod')  // ∏
    .replace(/\u222B/g, '\\int')   // ∫
    .replace(/\u221A/g, '\\surd')   // √ (standalone radical sign)
    .replace(/\u2192/g, '\\to')    // →
    .replace(/\u2190/g, '\\leftarrow'); // ←
}

function renderKatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(normalizeMathUnicode(latex), {
      displayMode,
      throwOnError: false,
      output: 'html',
    });
  } catch {
    return latex;
  }
}

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Renders text with LaTeX math expressions.
 * - Block math: $$...$$
 * - Inline math: $...$
 * Plain text segments are rendered as-is.
 */
export default function MathText({ text, className }: MathTextProps) {
  const rendered = useMemo(() => {
    if (!text) return '';
    // Split on block math ($$...$$) and inline math ($...$)
    // Process block math first to avoid conflict with inline math
    const parts: { type: 'text' | 'block' | 'inline'; content: string }[] = [];
    // Regex: match $$...$$ (block) or $...$ (inline), non-greedy
    const mathRegex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
    let lastIndex = 0;
    let match;

    while ((match = mathRegex.exec(text)) !== null) {
      // Add preceding text
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      if (match[1] !== undefined) {
        // Block math ($$...$$)
        parts.push({ type: 'block', content: match[1] });
      } else if (match[2] !== undefined) {
        // Inline math ($...$)
        parts.push({ type: 'inline', content: match[2] });
      }
      lastIndex = match.index + match[0].length;
    }
    // Remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts;
  }, [text]);

  if (!text) return null;

  if (typeof rendered === 'string') return <span className={className}>{rendered}</span>;

  // If no math found, render as plain text
  if (rendered.length === 1 && rendered[0].type === 'text') {
    return <span className={className}>{rendered[0].content}</span>;
  }

  return (
    <span className={className}>
      {rendered.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.content}</span>;
        }
        const displayMode = part.type === 'block';
        const html = renderKatex(part.content, displayMode);
        // KaTeX.renderToString produces safe HTML output
        if (displayMode) {
          return (
            <span
              key={i}
              className="block my-2"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
}
