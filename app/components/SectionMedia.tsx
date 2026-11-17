"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "./icons";
import type { MediaType } from "./AppearanceProvider";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const usePrefersReducedMotion = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );

/**
 * Background media for homepage sections: an image (optionally a separate phone
 * image) or a silent looping video with the image as its poster.
 * Video never autoplays for people who ask for reduced motion, and always has
 * a pause button.
 */
export default function SectionMedia({
  mediaType = "image",
  imageUrl,
  mobileImageUrl,
  videoUrl,
  alt,
  className = "",
  imageClassName = "object-cover",
  controlsPosition = "bottom-right",
}: {
  mediaType?: MediaType;
  imageUrl?: string;
  mobileImageUrl?: string;
  videoUrl?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  controlsPosition?: "bottom-right" | "top-right";
}) {
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  // Starts false: shows "Play" until the video actually starts.
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const showVideo = mediaType === "video" && Boolean(videoUrl) && !failed;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
      return;
    }
    video.play().catch(() => {
      // Autoplay can be blocked (e.g. low-power mode); the poster stays visible.
    });
  }, [reducedMotion, videoUrl, showVideo]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  };

  if (showVideo) {
    return (
      <>
        <video
          ref={videoRef}
          key={videoUrl}
          className={`absolute inset-0 w-full h-full ${imageClassName} ${className}`}
          src={videoUrl}
          poster={imageUrl || undefined}
          muted
          loop
          playsInline
          autoPlay={!reducedMotion}
          preload="metadata"
          aria-label={alt}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setFailed(true)}
        />
        <button
          type="button"
          onClick={(e) => {
            // Sections are often wrapped in links; don't navigate when pausing.
            e.preventDefault();
            e.stopPropagation();
            toggle();
          }}
          aria-label={playing ? "Pause video" : "Play video"}
          className={`absolute z-10 ${
            controlsPosition === "top-right" ? "top-4 right-4" : "bottom-4 right-4"
          } size-10 rounded-full bg-black/45 text-white backdrop-blur-sm flex items-center justify-center hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-white`}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
      </>
    );
  }

  if (!imageUrl) return <div className={`absolute inset-0 bg-surface ${className}`} />;

  return (
    <picture>
      {mobileImageUrl && <source media="(max-width: 639px)" srcSet={mobileImageUrl} />}
      <img src={imageUrl} alt={alt} className={`absolute inset-0 w-full h-full ${imageClassName} ${className}`} />
    </picture>
  );
}
