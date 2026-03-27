import { useState, useCallback, useRef } from "react";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

export function useMatrixText(finalText, speed = 40) {
  const [display, setDisplay] = useState(finalText);
  const raf = useRef(null);

  const scramble = useCallback(() => {
    let iter = 0;
    const total = finalText.length * 8;
    clearTimeout(raf.current);

    const tick = () => {
      setDisplay(
        finalText.split("").map((ch, i) => {
          if (ch === " ") return " ";
          if (i < Math.floor(iter / 8)) return ch;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join("")
      );
      iter++;
      if (iter < total) {
        raf.current = setTimeout(tick, speed);
      } else {
        setDisplay(finalText);
      }
    };
    tick();
  }, [finalText, speed]);

  return { display, scramble };
}
