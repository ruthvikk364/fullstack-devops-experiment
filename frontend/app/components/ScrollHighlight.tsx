"use client";

import { useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";

interface ScrollHighlightProps {
  text: string;
  className?: string;
}

export default function ScrollHighlight({ text, className = "" }: ScrollHighlightProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.4"],
  });

  const words = text.split(" ");

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = (i + 1) / words.length;
        return (
          <Word key={i} word={word} progress={scrollYProgress} range={[start, end]} />
        );
      })}
    </p>
  );
}

function Word({
  word,
  progress,
  range,
}: {
  word: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.15, 0.7]);

  return (
    <m.span style={{ opacity }} className="inline-block mr-[0.3em] transition-colors duration-100">
      {word}
    </m.span>
  );
}
