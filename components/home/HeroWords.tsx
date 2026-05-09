"use client";

const WORDS = [
  { w: "A" },
  { w: "friendlier", em: true },
  { w: "way" },
  { w: "to" },
  { w: "talk" },
  { w: "to" },
  { w: "data." },
];

export function HeroWords() {
  return (
    <h1 className="font-grotesk font-medium m-0 leading-[0.92] -tracking-[0.04em] text-[clamp(48px,7.6vw,112px)] max-w-[11ch] relative z-[2]">
      {WORDS.map((part, i) => (
        <span
          key={i}
          className="inline-block opacity-0 translate-y-7"
          style={{
            animation: `ba-rise 0.9s cubic-bezier(0.2,0.8,0.2,1) ${0.05 + i * 0.12}s forwards`,
            marginRight: "0.18em",
          }}
        >
          {part.em ? (
            <em className="not-italic text-green">{part.w}</em>
          ) : (
            part.w
          )}
        </span>
      ))}
    </h1>
  );
}
