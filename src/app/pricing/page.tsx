'use client';

import { motion } from 'framer-motion';
import { Check, Clock, Shield, CreditCard, Zap, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' as const }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[var(--background)]/80 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left - Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="BillDrop Logo" 
              width={40} 
              height={40} 
              className="rounded-xl"
            />
            <span className="font-semibold text-xl hidden sm:block">BillDrop</span>
          </Link>
          
          {/* Center - Nav Links (visible on all screens) */}
          <div className="flex items-center gap-4 sm:gap-8 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            <Link href="/pricing" className="text-sm font-medium text-[var(--accent-primary)]">Pricing</Link>
            <Link href="/#faq" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">FAQ</Link>
          </div>
          
          {/* Right - Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="btn-secondary text-sm py-2 px-3 sm:px-4 hidden sm:block">Log in</Link>
            <Link href="/login" className="btn-primary text-sm py-2 px-3 sm:px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-[var(--foreground-muted)] max-w-xl mx-auto">
              Start free, upgrade when you need more. No hidden fees, no surprises.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Tier */}
            <motion.div
              className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm"
              {...fadeInUp}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Free</h2>
                <p className="text-[var(--foreground-muted)]">Perfect to get started</p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-[var(--foreground-muted)]">/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[var(--accent-success)]" />
                  <span>Full email scanning</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[var(--accent-success)]" />
                  <span>Track up to 10 subscriptions</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[var(--accent-success)]" />
                  <span>Basic alerts</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[var(--accent-success)]" />
                  <span>Manual entry</span>
                </li>
              </ul>

              <Link 
                href="/login" 
                className="btn-secondary w-full flex items-center justify-center py-3"
              >
                Get Started Free
              </Link>
            </motion.div>

            {/* Pro Tier */}
            <motion.div
              className="bg-white rounded-3xl p-8 border-2 border-[var(--accent-primary)] shadow-lg relative overflow-hidden"
              {...fadeInUp}
              transition={{ delay: 0.1 }}
            >
              {/* Coming Soon Badge */}
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  <Clock className="w-3.5 h-3.5" />
                  Coming Soon
                </span>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Pro</h2>
                <p className="text-[var(--foreground-muted)]">Everything you need</p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold">$6.99</span>
                <span className="text-[var(--foreground-muted)]">/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[var(--accent-success)]" />
                  <span className="font-medium">Unlimited subscriptions</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[var(--accent-success)]" />
                  <span>3-day renewal alerts</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[var(--accent-success)]" />
                  <span>Price change detection</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[var(--accent-success)]" />
                  <span>Export data</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[var(--accent-success)]" />
                  <span>Priority support</span>
                </li>
              </ul>

              <button 
                disabled
                className="w-full py-3 rounded-full bg-slate-100 text-slate-400 font-medium cursor-not-allowed"
              >
                Coming Soon
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white/50" id="faq">
        <div className="max-w-3xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-[var(--foreground-muted)]">
              Everything you need to know about BillDrop
            </p>
          </motion.div>
          
          <motion.div 
            className="space-y-4"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {[
              {
                question: "Is my data safe?",
                answer: "Absolutely. We only scan for subscription-related emails. We never read personal emails, and we never sell your data. Your privacy is our #1 priority."
              },
              {
                question: "How does email scanning work?",
                answer: "We look for receipts and billing emails from subscription services. Our AI detects recurring charges and presents them for your review."
              },
              {
                question: "Do you automatically cancel subscriptions?",
                answer: "No. We give you the information and tools to cancel yourself. This keeps you in full control."
              },
              {
                question: "How do you make money?",
                answer: "We offer a free tier for up to 10 subscriptions. For unlimited tracking and advanced features, we charge $6.99/month. Simple and transparent."
              },
              {
                question: "Can I trust you with my Gmail?",
                answer: "We only request read-only access to emails. We can't send emails, delete anything, or access anything beyond receipts. Your credentials stay with Google."
              },
              {
                question: "What if I don't use Gmail?",
                answer: "Outlook support is coming soon. You can also manually add subscriptions."
              },
              {
                question: "How long does scanning take?",
                answer: "Usually 2-5 minutes. We scan the last 3 months of emails for subscription patterns."
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm border border-black/5"
                variants={fadeInUp}
              >
                <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                <p className="text-[var(--foreground-muted)] leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div 
            className="rounded-[28px] p-10 sm:p-14 text-white relative overflow-hidden text-center"
            style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)' }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <p className="text-white/70 text-sm uppercase tracking-wider mb-3">
                Join 500+ people saving money
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-8 leading-tight">
                Stop paying for subscriptions<br />you don&apos;t use
              </h2>
              
              <Link href="/login" className="inline-block bg-white text-[var(--accent-primary)] font-semibold px-10 py-4 rounded-full hover:scale-105 transition-transform shadow-lg text-lg mb-8">
                Get Started Free
              </Link>
              
              <div className="flex flex-wrap justify-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>No card needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>2-min setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-black/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="BillDrop Logo" 
              width={32} 
              height={32} 
              className="rounded-lg"
            />
            <span className="font-semibold">BillDrop</span>
          </div>
          <div className="text-sm text-[var(--foreground-muted)]">
            © 2026 BillDrop. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-[var(--foreground-muted)]">
            <Link href="/pricing" className="hover:text-[var(--foreground)] transition-colors">Pricing</Link>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors">Terms</a>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
