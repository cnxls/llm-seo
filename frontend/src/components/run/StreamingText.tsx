import { useState, useEffect, useMemo } from 'react';

interface StreamingTextProps {
  text: string;
  speed?: number;
  targetBrand: string;
  knownBrands: string[];
  onDone?: () => void;
}

export default function StreamingText({ text, speed = 12, targetBrand, knownBrands, onDone }: StreamingTextProps) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) {
        clearInterval(id);
        setTimeout(() => onDone?.(), 0);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  const visible = text.slice(0, shown);

  const parts = useMemo(() => {
    if (!knownBrands.length) return [{ t: visible, brand: null as string | null }];
    const escaped = knownBrands.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const re = new RegExp(`\\b(${escaped.join('|')})\\b`, 'g');
    const out: { t: string; brand: string | null }[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(visible)) !== null) {
      if (m.index > last) out.push({ t: visible.slice(last, m.index), brand: null });
      out.push({ t: m[0], brand: m[0] });
      last = m.index + m[0].length;
    }
    if (last < visible.length) out.push({ t: visible.slice(last), brand: null });
    return out;
  }, [visible, knownBrands]);

  const isDone = shown >= text.length;

  return (
    <span className="text-[13px] leading-relaxed text-foreground/85">
      {parts.map((p, i) =>
        p.brand
          ? <span key={i} className={p.brand === targetBrand ? 'mention-you' : 'mention-other'}>{p.t}</span>
          : <span key={i}>{p.t}</span>
      )}
      {!isDone && <span className="caret" />}
    </span>
  );
}
