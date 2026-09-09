import React from "react";
import Link from "next/link";
import LogoMark from "../components/LogoMark";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-black py-16 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <LogoMark size="lg" className="mx-auto mb-6" />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black">
            The YeHagere Ethos
          </h1>
          <p className="text-sm text-neutral-600 max-w-xl mx-auto leading-relaxed">
            Crafting architectural simplicity, refined natural textiles, and timeless silhouettes.
          </p>
        </div>

        <div className="space-y-6 text-sm text-neutral-800 leading-relaxed pt-6 border-t border-neutral-200">
          <p>
            Founded with a vision to redefine everyday luxury, YeHagere merges ancestral Ethiopian craftsmanship with clean, modernist silhouettes. Every piece—from our micro cable polo to our signature low slung baggy denim—is designed to be lived in, layered, and cherished for seasons to come.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div className="p-6 bg-[#f9f9f9] border border-neutral-200 space-y-2">
              <h3 className="font-bold text-black text-base">Conscious Materials</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                We select ethically sourced fine merino wool, raw cotton twills, and pure flax linens to create garments with natural tactile richness.
              </p>
            </div>
            <div className="p-6 bg-[#f9f9f9] border border-neutral-200 space-y-2">
              <h3 className="font-bold text-black text-base">Architectural Cut</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Precision proportions, relaxed drape, and discreet tailoring ensure seamless movement between casual days and evening gatherings.
              </p>
            </div>
          </div>

          <p className="pt-4">
            Our collections are released in thoughtful, limited batches to prioritize quality over volume. Thank you for being part of our journey.
          </p>
        </div>

        <div className="pt-8 text-center">
          <Link
            href="/"
            className="inline-block bg-black text-white! px-8 py-3.5 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
          >
            Explore the Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
