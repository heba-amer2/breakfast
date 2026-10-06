"use client";

import Image from "next/image";

export function AuthHeroPanel() {
  return (
    <div className="relative hidden w-1/2 flex-col items-start justify-center overflow-hidden p-12 lg:flex">
      <Image
        src="/assets/breakfast-signup.jpg"
        alt="Office breakfast table with coffee and food"
        fill
        priority
        className="object-cover"
        sizes="50vw"
      />

      <div className="absolute inset-0 bg-linear-to-br from-emerald-950/85 via-emerald-900/65 to-amber-800/45" />

      <div className="absolute inset-0 opacity-25">
        <div className="absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-100/20" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-100/15" />
      </div>

      <div className="relative z-10 text-left">
        <h2 className="mb-4 text-4xl font-bold leading-tight text-white">
          Good morning,
          <br />
          let&apos;s order
          <br />
          breakfast together.
        </h2>

        <p className="max-w-xs text-base leading-relaxed text-emerald-50">
          Join your team&apos;s breakfast room, pick your favorites, and split
          the bill automatically.
        </p>
      </div>
    </div>
  );
}
