"use client";

import React, { useState } from "react";
import LogoMark from "../components/LogoMark";
import { getSupabase } from "../lib/supabase";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("inquiries").insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        });
      }
    } catch {
      // Fallback gracefully to client acknowledgment
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black py-16 px-4 sm:px-8">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <LogoMark size="md" className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Client Concierge
          </h1>
          <p className="text-xs text-neutral-600 max-w-md mx-auto">
            Our team is at your disposal for sizing guidance, order tracking, and private styling appointments.
          </p>
        </div>

        {submitted ? (
          <div className="bg-[#f9f9f9] border border-neutral-200 p-8 text-center space-y-3">
            <h2 className="text-lg font-bold text-black">Message Sent</h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Thank you for contacting YeHagere Client Services. A concierge advisor will reply to {formData.email} within 24 hours.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: "", email: "", subject: "General Inquiry", message: "" });
              }}
              className="mt-4 text-xs font-bold uppercase tracking-wider underline hover:opacity-75"
            >
              Send Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-black uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full bg-[#f4f4f4] border-none px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-black uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full bg-[#f4f4f4] border-none px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">
                Inquiry Topic
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-[#f4f4f4] border-none px-4 py-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="Order & Shipping">Order &amp; Shipping</option>
                <option value="Sizing & Fit Advice">Sizing &amp; Fit Advice</option>
                <option value="Returns & Exchanges">Returns &amp; Exchanges</option>
                <option value="Press & Collaborations">Press &amp; Collaborations</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-black uppercase tracking-wider">
                Message
              </label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="How may we assist you today?"
                className="w-full bg-[#f4f4f4] border-none px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Inquiry"}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-neutral-200 text-center sm:text-left text-xs">
          <div>
            <p className="font-bold text-black uppercase tracking-wider mb-1">Flagship Studio</p>
            <p className="text-neutral-600">Bole Medhanialem Avenue</p>
            <p className="text-neutral-600">Addis Ababa, Ethiopia</p>
          </div>
          <div>
            <p className="font-bold text-black uppercase tracking-wider mb-1">Direct Support</p>
            <p className="text-neutral-600">concierge@yehagere.com</p>
            <p className="text-neutral-600">+251 11 661 8890</p>
          </div>
          <div>
            <p className="font-bold text-black uppercase tracking-wider mb-1">Operating Hours</p>
            <p className="text-neutral-600">Mon - Sat: 9:00 - 19:00</p>
            <p className="text-neutral-600">Sunday: By Appointment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
