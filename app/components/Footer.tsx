"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Send, Globe } from "lucide-react";
import LogoMark from "./LogoMark";
import { useAppearance } from "./AppearanceProvider";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { cms } = useAppearance();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 5000);
  };

  return (
    <footer className="bg-white border-t border-neutral-100 pt-16 pb-12 text-black">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-16">
          {/* Newsletter Column */}
          <div className="lg:col-span-5 max-w-md">
            <p className="text-xs text-neutral-600 leading-relaxed mb-6 font-normal">
              By signing up, I agree to receive emails and texts from YeHagere and accept the{" "}
              <Link href="/terms" className="underline hover:text-black">Terms of Use</Link> (including arbitration) and{" "}
              <Link href="/privacy" className="underline hover:text-black">Privacy Policy</Link>. Message and Data Rates may apply. Message frequency varies. Reply STOP to opt-out.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#f4f4f4] border-none px-4 py-3.5 text-sm text-black placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-black"
              />
              <button
                type="submit"
                className="w-full bg-black text-white py-3.5 text-sm font-semibold hover:bg-neutral-800 transition-colors"
              >
                {subscribed ? "Thank you for subscribing" : "Sign up"}
              </button>
            </form>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-1" />

          {/* Navigation Links Columns */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-2 gap-8 text-sm">
            {/* Column 1 */}
            <div className="space-y-3.5">
              <div>
                <Link href="/about" className="text-black hover:text-neutral-500 transition-colors font-normal">
                  About Us
                </Link>
              </div>
              <div>
                <Link href="/contact" className="text-black hover:text-neutral-500 transition-colors font-normal">
                  Contact Us
                </Link>
              </div>
              <div>
                <Link href="/press" className="text-black hover:text-neutral-500 transition-colors font-normal">
                  Press Inquiries
                </Link>
              </div>
              <div>
                <Link href="/careers" className="text-black hover:text-neutral-500 transition-colors font-normal">
                  We&apos;re Hiring
                </Link>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-3.5">
              <div>
                <Link href="/faq" className="text-black hover:text-neutral-500 transition-colors font-normal">
                  FAQ
                </Link>
              </div>
              <div>
                <Link href="/shipping" className="text-black hover:text-neutral-500 transition-colors font-normal">
                  Shipping
                </Link>
              </div>
              <div>
                <Link href="/orders" className="text-black hover:text-neutral-500 transition-colors font-normal">
                  Account Orders
                </Link>
              </div>
              <div>
                <Link href="/returns" className="text-black hover:text-neutral-500 transition-colors font-normal">
                  Returns
                </Link>
              </div>
              <div>
                <Link href="/international" className="text-black hover:text-neutral-500 transition-colors font-normal">
                  International
                </Link>
              </div>
              <div>
                <span className="text-neutral-600 font-normal">Klarna</span>
              </div>
              <div>
                <span className="text-neutral-600 font-normal">After Pay</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Icons & Concierge Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-neutral-100 text-black">
          {/* Atelier Concierge Details */}
          <div className="text-xs text-neutral-600 space-y-0.5 text-center sm:text-left">
            {cms.footer?.boutiqueAddress && (
              <p className="font-medium text-black">{cms.footer.boutiqueAddress}</p>
            )}
            <div className="flex items-center gap-3 text-[11px] justify-center sm:justify-start">
              {cms.footer?.conciergePhone && (
                <span>Tel: {cms.footer.conciergePhone}</span>
              )}
              {cms.footer?.conciergeEmail && (
                <>
                  <span>•</span>
                  <span>{cms.footer.conciergeEmail}</span>
                </>
              )}
              {cms.footer?.openingHours && (
                <>
                  <span className="hidden md:inline">•</span>
                  <span className="hidden md:inline text-neutral-500">{cms.footer.openingHours}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-5 sm:gap-6 flex-wrap">
            <a
              href={cms.footer?.instagramUrl || "https://instagram.com"}
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:text-neutral-500 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            <a
              href={cms.footer?.tiktokUrl || "https://tiktok.com"}
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:text-neutral-500 transition-colors"
              aria-label="TikTok"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.81 4.48 6.27 6.27 0 0 0 1.87-4.47V8.69a8.28 8.28 0 0 0 4.91 1.6v-3.6z" />
              </svg>
            </a>
            <a
              href={cms.footer?.facebookUrl || "https://facebook.com"}
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:text-neutral-500 transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a
              href={cms.footer?.telegramUrl || "https://t.me"}
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:text-neutral-500 transition-colors"
              aria-label="Telegram"
            >
              <Send className="w-5 h-5 stroke-[1.75]" />
            </a>
            <a
              href="https://yehagere.com"
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:text-neutral-500 transition-colors"
              aria-label="Global"
            >
              <Globe className="w-5 h-5 stroke-[1.75]" />
            </a>
          </div>
        </div>

        {/* Bottom Bar: Logo Mark on Left, Copyright on Right */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-100 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <LogoMark size="sm" />
            {cms?.footerNotice && (
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 border-l border-neutral-200 pl-3 hidden md:inline-block">
                {cms.footerNotice}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-600">
            ©2026 YeHagere. All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}

