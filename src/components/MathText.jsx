import React from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

// Splits a string on $$...$$ (block math) and $...$ (inline math),
// rendering each math segment with KaTeX and everything else as plain
// text. Question text and options are typed as, e.g.:
//   "Solve $x^2 + 5x + 6 = 0$ for x."
//   "The value of $\frac{1}{2} + \frac{1}{3}$ is:"
// Falls back to showing the raw text if a segment fails to parse (a typo
// in the LaTeX shouldn't crash the whole exam page for a student).
const MathText = ({ text = "", className = "" }) => {
  if (!text) return null;

  // Split on block ($$...$$) first, then inline ($...$) within the non-block parts.
  const blockParts = text.split(/(\$\$[^$]+\$\$)/g);

  return (
    <span className={className}>
      {blockParts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const formula = part.slice(2, -2);
          try {
            return <BlockMath key={i} math={formula} errorColor="#DC2626" />;
          } catch {
            return <span key={i}>{part}</span>;
          }
        }

        // Within this plain-text segment, split on inline $...$ math
        const inlineParts = part.split(/(\$[^$]+\$)/g);
        return (
          <React.Fragment key={i}>
            {inlineParts.map((seg, j) => {
              if (seg.startsWith("$") && seg.endsWith("$") && seg.length > 1) {
                const formula = seg.slice(1, -1);
                try {
                  return <InlineMath key={j} math={formula} errorColor="#DC2626" />;
                } catch {
                  return <span key={j}>{seg}</span>;
                }
              }
              return <span key={j}>{seg}</span>;
            })}
          </React.Fragment>
        );
      })}
    </span>
  );
};

export default MathText;
