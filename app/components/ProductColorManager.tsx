"use client";

import React from "react";
import { Plus, Trash2, Star, Palette, Image as ImageIcon, Check } from "lucide-react";
import { ProductColor } from "../lib/products-store";

const PRESET_PALETTES: { name: string; hex: string; defaultImage?: string }[] = [
  {
    name: "Tena Indigo",
    hex: "#3b5998",
    defaultImage: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1000&auto=format&fit=crop&q=80",
  },
  {
    name: "Off White / Raw Silk",
    hex: "#f3f4f6",
    defaultImage: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1000&auto=format&fit=crop&q=80",
  },
  {
    name: "Charcoal Onyx",
    hex: "#27272a",
    defaultImage: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1000&auto=format&fit=crop&q=80",
  },
  {
    name: "Saffron Ochre",
    hex: "#d97706",
    defaultImage: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1000&auto=format&fit=crop&q=80",
  },
  {
    name: "Forest Emerald",
    hex: "#1e3a2b",
    defaultImage: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1000&auto=format&fit=crop&q=80",
  },
  {
    name: "Terracotta Earth",
    hex: "#c25e40",
    defaultImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80",
  },
  {
    name: "Camel Sand",
    hex: "#c49a6c",
    defaultImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=80",
  },
  {
    name: "Stonewash Blue",
    hex: "#60a5fa",
    defaultImage: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1000&auto=format&fit=crop&q=80",
  },
];

export interface ProductColorManagerProps {
  colors: ProductColor[];
  activeColorIndex: number;
  onChange: (colors: ProductColor[], activeIndex: number) => void;
}

export default function ProductColorManager({
  colors,
  activeColorIndex,
  onChange,
}: ProductColorManagerProps) {
  // Ensure we have at least one colorway
  const safeColors = React.useMemo(() => {
    if (!colors || colors.length === 0) {
      return [
        { name: "Off White", hex: "#f3f4f6", active: true },
        { name: "Charcoal", hex: "#27272a", active: true },
      ];
    }
    return colors;
  }, [colors]);

  const safeActiveIndex = Math.max(0, Math.min(activeColorIndex, safeColors.length - 1));

  const handleUpdateColor = (
    index: number,
    field: keyof ProductColor,
    value: string | boolean | undefined
  ) => {
    const next = [...safeColors];
    next[index] = { ...next[index], [field]: value };
    onChange(next, safeActiveIndex);
  };

  const handleSetActive = (index: number) => {
    onChange(safeColors, index);
  };

  const handleAddColor = () => {
    const next = [
      ...safeColors,
      {
        name: `Colorway ${safeColors.length + 1}`,
        hex: "#7071e8",
        active: true,
      },
    ];
    onChange(next, safeActiveIndex);
  };

  const handleAddPreset = (preset: (typeof PRESET_PALETTES)[0]) => {
    // If color name already exists, highlight it as active
    const existingIndex = safeColors.findIndex(
      (c) => c.name.toLowerCase() === preset.name.toLowerCase()
    );
    if (existingIndex !== -1) {
      onChange(safeColors, existingIndex);
      return;
    }

    const next = [
      ...safeColors,
      {
        name: preset.name,
        hex: preset.hex,
        image: preset.defaultImage,
        active: true,
      },
    ];
    onChange(next, safeActiveIndex);
  };

  const handleRemoveColor = (index: number) => {
    if (safeColors.length <= 1) return;
    const next = safeColors.filter((_, i) => i !== index);
    let nextActive = safeActiveIndex;
    if (index === safeActiveIndex) {
      nextActive = 0;
    } else if (index < safeActiveIndex) {
      nextActive = safeActiveIndex - 1;
    }
    onChange(next, nextActive);
  };

  const activeColor = safeColors[safeActiveIndex];

  return (
    <div className="space-y-4 rounded-xs border border-neutral-200 bg-neutral-50/70 p-4">
      {/* Header & Active Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-black" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-black">
            Colorways &amp; Active Garment Color
          </h4>
        </div>

        {activeColor && (
          <div className="flex items-center gap-2 bg-white px-2.5 py-1 border border-neutral-200 shadow-2xs">
            <span className="text-[11px] text-neutral-500 font-medium">Storefront Active Default:</span>
            <div className="flex items-center gap-1.5 font-bold text-xs text-black">
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/20"
                style={{ backgroundColor: activeColor.hex }}
              />
              <span>{activeColor.name}</span>
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-neutral-600">
        Add multiple colors for this garment. The <strong className="text-black">Active Color</strong> will be displayed by default in the catalog and storefront, and customers can easily check the clothes in each available color.
      </p>

      {/* Colors List */}
      <div className="space-y-3">
        {safeColors.map((color, idx) => {
          const isActive = idx === safeActiveIndex;

          return (
            <div
              key={idx}
              className={`p-3 rounded-xs border transition-all ${
                isActive
                  ? "bg-amber-50/40 border-amber-300 ring-1 ring-amber-300 shadow-2xs"
                  : "bg-white border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                {/* Left: Swatch picker & Name */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0 w-full md:w-auto">
                  {/* Swatch Picker */}
                  <div className="relative flex-shrink-0 group">
                    <input
                      type="color"
                      value={color.hex || "#000000"}
                      onChange={(e) => handleUpdateColor(idx, "hex", e.target.value)}
                      className="w-8 h-8 rounded-none border border-neutral-300 cursor-pointer p-0 bg-transparent block"
                      title="Click to choose color"
                    />
                    <div
                      className="absolute inset-0 pointer-events-none border border-black/20"
                      style={{ backgroundColor: color.hex }}
                    />
                  </div>

                  {/* Name Input */}
                  <div className="flex-1 min-w-[130px]">
                    <input
                      type="text"
                      value={color.name}
                      placeholder="e.g. Saffron Gold"
                      onChange={(e) => handleUpdateColor(idx, "name", e.target.value)}
                      className="w-full bg-[#f8f8f8] border border-neutral-300 px-2.5 py-1.5 text-xs font-semibold text-black focus:outline-none focus:bg-white focus:ring-1 focus:ring-black"
                    />
                  </div>

                  {/* Hex Input */}
                  <div className="w-24 flex-shrink-0">
                    <input
                      type="text"
                      value={color.hex}
                      placeholder="#000000"
                      onChange={(e) => handleUpdateColor(idx, "hex", e.target.value)}
                      className="w-full bg-[#f8f8f8] border border-neutral-300 px-2 py-1.5 text-xs font-mono text-neutral-700 text-center uppercase focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {/* Center: Garment Image in this color */}
                <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={color.image || ""}
                      placeholder="Garment photo URL for this colorway..."
                      onChange={(e) => handleUpdateColor(idx, "image", e.target.value)}
                      className="w-full bg-[#f8f8f8] border border-neutral-300 pl-7 pr-2 py-1.5 text-xs text-neutral-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-black truncate"
                    />
                    <ImageIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-2.5" />
                  </div>

                  {/* Image thumbnail preview if available */}
                  {color.image ? (
                    <div className="w-8 h-8 bg-neutral-100 flex-shrink-0 border border-neutral-200 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={color.image}
                        alt={color.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-neutral-100 border border-dashed border-neutral-300 flex items-center justify-center flex-shrink-0 text-[9px] text-neutral-400">
                      Auto
                    </div>
                  )}
                </div>

                {/* Right: Actions (Set Active, Available toggle, Delete) */}
                <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                  {isActive ? (
                    <span className="px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-700 text-amber-700" />
                      <span>Active Default</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetActive(idx)}
                      className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-700 hover:text-black border border-neutral-300 hover:bg-neutral-100 transition-colors flex items-center gap-1"
                      title="Set as the default active colorway customers will see first"
                    >
                      <Check className="w-3 h-3" />
                      <span>Make Active</span>
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(idx)}
                    disabled={safeColors.length <= 1}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors disabled:opacity-30 disabled:hover:text-neutral-400 disabled:hover:bg-transparent"
                    title={safeColors.length <= 1 ? "At least one colorway is required" : "Remove colorway"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Colorway & Quick Presets */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleAddColor}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-neutral-100 border border-neutral-300 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Color</span>
          </button>

          <span className="text-[11px] text-neutral-500 font-medium">
            Or quick-add an Ethiopian atelier tone:
          </span>
        </div>

        {/* Quick Atelier Palette Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {PRESET_PALETTES.map((preset) => {
            const isAdded = safeColors.some(
              (c) => c.name.toLowerCase() === preset.name.toLowerCase()
            );

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleAddPreset(preset)}
                className={`text-[11px] px-2 py-1 border flex items-center gap-1.5 transition-all ${
                  isAdded
                    ? "bg-neutral-100 text-neutral-700 border-neutral-300 opacity-60"
                    : "bg-white text-black border-neutral-200 hover:border-black hover:bg-neutral-50 shadow-2xs"
                }`}
                title={isAdded ? "Already in product (click to activate)" : `Add ${preset.name}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/20"
                  style={{ backgroundColor: preset.hex }}
                />
                <span>{preset.name}</span>
                {!isAdded && <Plus className="w-2.5 h-2.5 text-neutral-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
