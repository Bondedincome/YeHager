"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, FacebookIcon, InstagramIcon, Mail, MapPin, Phone, TelegramIcon, TiktokIcon } from "./icons";
import { useAppearance } from "./AppearanceProvider";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "New In", href: "/products" },
      { label: "Shop All", href: "/products" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Orders", href: "/orders" },
      { label: "My Account", href: "/account" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { cms } = useAppearance();
  const f = cms.footer;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 5000);
  };

  const socials = [
    { href: f?.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: f?.tiktokUrl, label: "TikTok", Icon: TiktokIcon },
    { href: f?.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    { href: f?.telegramUrl, label: "Telegram", Icon: TelegramIcon },
  ].filter((s) => s.href);

  return (
    <footer className="bg-white text-black border-t border-line mt-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Newsletter */}
          <div className="lg:col-span-5 space-y-5">
            <h2 className="heading-display text-3xl sm:text-4xl">Join the list</h2>
            <p className="text-sm text-neutral-600 max-w-sm">
              New drops, restocks and stories from the studio. No spam.
            </p>
            <form onSubmit={handleSubscribe} className="flex max-w-md border-b border-black">
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-transparent py-3 text-sm placeholder:text-neutral-500 outline-none"
              />
              <button type="submit" className="w-10 flex items-center justify-center" aria-label="Sign up">
                {subscribed ? <Check className="size-5" /> : <ArrowRight className="size-5" />}
              </button>
            </form>
            {subscribed && <p className="text-xs text-neutral-600">Thanks for signing up.</p>}
          </div>

          {/* Link columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {COLUMNS.map((col) => (
              <div key={col.title} className="space-y-4">
                <h3 className="eyebrow">{col.title}</h3>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-neutral-600 hover:text-black transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="space-y-4 col-span-2 sm:col-span-1">
              <h3 className="eyebrow">Visit</h3>
              <ul className="space-y-3 text-sm text-neutral-600">
                {f?.boutiqueAddress && (
                  <li className="flex gap-2">
                    <MapPin className="size-4 mt-0.5" />
                    <span>{f.boutiqueAddress}</span>
                  </li>
                )}
                {f?.conciergePhone && (
                  <li className="flex gap-2">
                    <Phone className="size-4 mt-0.5" />
                    <a href={`tel:${f.conciergePhone.replace(/\s+/g, "")}`} className="hover:text-black">
                      {f.conciergePhone}
                    </a>
                  </li>
                )}
                {f?.conciergeEmail && (
                  <li className="flex gap-2">
                    <Mail className="size-4 mt-0.5" />
                    <a href={`mailto:${f.conciergeEmail}`} className="hover:text-black break-all">
                      {f.conciergeEmail}
                    </a>
                  </li>
                )}
                {f?.openingHours && <li className="text-xs">{f.openingHours}</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-1">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="w-10 h-10 flex items-center justify-center hover:opacity-60 transition-opacity"
              >
                <Icon className="size-5" />
              </a>
            ))}
          </div>
          <p className="text-xs text-neutral-500 text-center">
            © {new Date().getFullYear()} YeHagere{cms.footerNotice ? ` · ${cms.footerNotice}` : ""}
          </p>
        </div>
      </div>
    </footer>
  );
}
