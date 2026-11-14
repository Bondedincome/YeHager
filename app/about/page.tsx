import React from "react";
import Link from "next/link";

const VALUES = [
  {
    title: "Handmade",
    body: "Every piece is spun, woven and finished by hand in Ethiopia by people we know by name.",
  },
  {
    title: "Natural materials",
    body: "Organic Ethiopian cotton, fine merino and pure linen, chosen to feel good and last for years.",
  },
  {
    title: "Ethically made",
    body: "Fair wages, safe workshops and small batches. Eco friendly and cruelty free, always.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-14 sm:pt-24 pb-12">
        <p className="eyebrow text-muted mb-4">About YeHagere</p>
        <h1 className="heading-display text-5xl sm:text-7xl lg:text-8xl max-w-5xl">
          Made with lots of hearts and souls.
        </h1>
        <p className="mt-8 text-base sm:text-lg text-neutral-700 max-w-2xl leading-relaxed">
          YeHagere is a handmade clothing brand from Ethiopia. We bring traditional Ethiopian craft into clean,
          modern pieces made to be worn every day and kept for years.
        </p>
      </section>

      <section className="border-t border-line">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
          {VALUES.map((v) => (
            <div key={v.title} className="space-y-3">
              <h2 className="heading-display text-2xl sm:text-3xl">{v.title}</h2>
              <p className="text-sm text-neutral-700 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-16 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h2 className="heading-display text-3xl sm:text-5xl">See the collection</h2>
          <Link href="/products" className="btn-primary self-start sm:self-auto">
            Shop all
          </Link>
        </div>
      </section>
    </div>
  );
}
