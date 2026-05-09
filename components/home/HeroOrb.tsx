import Image from "next/image";

export function HeroOrb() {
  return (
    <div
      className="hero-orb absolute right-[4%] bottom-[24%] w-[26vw] max-w-[340px] aspect-square pointer-events-none z-[1] opacity-0 hidden md:block"
      style={{ animation: "ba-rise 1.2s ease 0.3s forwards" }}
    >
      <div
        className="absolute -inset-[10%] z-[-1]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(47,196,99,0.18), transparent 60%)",
          filter: "blur(30px)",
        }}
      />
      <Image
        src="/assets/ba-icon-green.png"
        alt=""
        width={340}
        height={340}
        className="w-full h-full object-contain animate-float"
      />
    </div>
  );
}
