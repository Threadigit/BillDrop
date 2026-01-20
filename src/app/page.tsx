'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Mail, Bell, Zap, Shield, ArrowRight, CheckCircle, CreditCard, Calendar, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Animation variants
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

// Sample subscription data for floating cards
const sampleSubscriptions = [
  { name: 'Netflix', amount: '$15.99/mo', icon: '🎬', color: '#E50914' },
  { name: 'Spotify', amount: '$9.99/mo', icon: '🎵', color: '#1DB954' },
  { name: 'Adobe CC', amount: '$54.99/mo', icon: '🎨', color: '#FF0000' },
];

// Feature data
const features = [
  {
    icon: Mail,
    title: 'Scan your email',
    description: 'Connect Gmail or Outlook and we\'ll find every subscription hiding in your inbox.',
    gradient: 'from-purple-100 to-blue-100'
  },
  {
    icon: Bell,
    title: 'Get alerts before charges',
    description: 'Receive reminders 3 days before renewal. Never get surprised by a charge again.',
    gradient: 'from-orange-100 to-yellow-100'
  },
  {
    icon: Zap,
    title: 'Cancel in seconds',
    description: 'Step-by-step guides and direct links to cancellation pages. No more hunting.',
    gradient: 'from-green-100 to-teal-100'
  },
  {
    icon: Shield,
    title: 'Never link your bank',
    description: 'We only read your email receipts. Your financial data stays private.',
    gradient: 'from-pink-100 to-red-100'
  },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const logoHref = session ? '/dashboard' : '/';
  const ctaHref = session ? '/dashboard' : '/login';
  
  return (
    <div className="min-h-screen bg-[var(--background)] hero-pattern">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[var(--background)]/80 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left - Logo */}
          <Link href={logoHref} className="flex items-center gap-2">
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
            <Link href="/pricing" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">Pricing</Link>
            <Link href="/#faq" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">FAQ</Link>
          </div>
          
          {/* Right - Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {session ? (
              <Link href="/dashboard" className="btn-primary text-sm py-2 px-3 sm:px-4">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm py-2 px-3 sm:px-4 hidden sm:block">Log in</Link>
                <Link href="/login" className="btn-primary text-sm py-2 px-3 sm:px-4">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <motion.div 
          className="max-w-6xl mx-auto"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <motion.div {...fadeInUp} className="mb-6">
                <span className="pill inline-flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse"></span>
                  Users find 6+ hidden bills on average
                </span>
              </motion.div>
              
              <motion.h1 
                {...fadeInUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                style={{ letterSpacing: '-0.03em' }}
              >
                Paying for{' '}
                <span className="gradient-text">subscriptions</span>{' '}
                you don&apos;t use?
              </motion.h1>
              
              <motion.p 
                {...fadeInUp}
                className="text-lg sm:text-xl text-[var(--foreground-muted)] mb-8 max-w-lg mx-auto lg:mx-0"
              >
                We&apos;ll help you find and cancel them in minutes. 
                No bank linking required — just your email.
              </motion.p>
              
              <motion.div {...fadeInUp} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/login" className="btn-primary flex items-center justify-center gap-2 text-sm py-2.5 px-4">
                  <Mail className="w-4 h-4" />
                  Connect with Gmail
                </Link>
                <button 
                  className="btn-secondary flex flex-col items-center justify-center gap-1 text-sm py-2.5 px-4 opacity-60 cursor-not-allowed"
                  disabled
                >
                  <span>Connect with Outlook</span>
                  <span className="flex items-center gap-1 text-xs text-amber-600">
                    <Clock className="w-3 h-3" />
                    Coming Soon
                  </span>
                </button>
              </motion.div>
              
              <motion.div {...fadeInUp} className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-[var(--foreground-muted)]">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-[var(--accent-success)]" />
                  Free to start
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-[var(--accent-success)]" />
                  No credit card
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-[var(--accent-success)]" />
                  Cancel anytime
                </span>
              </motion.div>
            </div>
            
            {/* Right Content - Floating Cards */}
            <div className="relative h-[400px] hidden lg:block">
              {sampleSubscriptions.map((sub, index) => (
                <motion.div
                  key={sub.name}
                  className="subscription-preview absolute floating-card"
                  style={{
                    top: `${index * 100 + 20}px`,
                    left: `${index * 40}px`,
                    animationDelay: `${index * -2}s`
                  }}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                >
                  <div 
                    className="subscription-logo"
                    style={{ backgroundColor: `${sub.color}20` }}
                  >
                    {sub.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{sub.name}</div>
                    <div className="text-[var(--foreground-muted)] text-sm">{sub.amount}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="pill-warning text-xs px-2 py-1 rounded-full">
                      Review
                    </span>
                  </div>
                </motion.div>
              ))}
              
              {/* Decorative Elements */}
              <motion.div 
                className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.7, 0.5]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-20 left-0 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-yellow-200/30 rounded-full blur-2xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.6, 0.4]
                }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {[
              { value: '$12,847', label: 'Saved this month' },
              { value: '523', label: 'Active users' },
              { value: '2,341', label: 'Subscriptions found' },
              { value: '847', label: 'Subscriptions cancelled' },
            ].map((stat) => (
              <motion.div 
                key={stat.label}
                className="text-center"
                variants={fadeInUp}
              >
                <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-[var(--foreground-muted)] text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto">
              Stop wasting money on forgotten subscriptions. Our smart email scanner finds them all.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="feature-card"
                variants={fadeInUp}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-7 h-7 text-[var(--foreground)]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-[var(--foreground-muted)] text-sm leading-relaxed">
                  {feature.description}
                </p>
                {index === 0 && (
                  <div className="mt-4 flex gap-2">
                    <span className="text-xs bg-black/5 px-2 py-1 rounded-full">Gmail</span>
                    <span className="text-xs bg-black/5 px-2 py-1 rounded-full">Outlook</span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-white/50">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Your subscriptions, organized
            </h2>
            <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto">
              See exactly what you&apos;re paying for each month. Get alerts before renewals.
            </p>
          </motion.div>
          
          <motion.div 
            className="card p-8 bg-white max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-black/5">
              <div>
                <h3 className="text-xl font-semibold">Monthly Overview</h3>
                <p className="text-[var(--foreground-muted)]">January 2026</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-[var(--foreground-muted)]">Total spending</div>
                  <div className="text-2xl font-bold">$156.96</div>
                </div>
                <div className="w-px h-12 bg-black/10"></div>
                <div className="text-right">
                  <div className="text-sm text-[var(--foreground-muted)]">Saved</div>
                  <div className="text-2xl font-bold text-[var(--accent-success)]">$45.00</div>
                </div>
              </div>
            </div>
            
            {/* Subscription List */}
            <div className="space-y-4">
              {[
                { name: 'Netflix', amount: '$15.99', cycle: 'monthly', date: 'Jan 23', status: 'active', icon: '🎬' },
                { name: 'Spotify', amount: '$9.99', cycle: 'monthly', date: 'Jan 28', status: 'active', icon: '🎵' },
                { name: 'Adobe Creative Cloud', amount: '$54.99', cycle: 'monthly', date: 'Feb 1', status: 'review', icon: '🎨' },
                { name: 'ChatGPT Plus', amount: '$20.00', cycle: 'monthly', date: 'Feb 5', status: 'active', icon: '🤖' },
              ].map((sub) => (
                <motion.div 
                  key={sub.name}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-black/[0.02] transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center text-xl">
                    {sub.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{sub.name}</div>
                    <div className="text-sm text-[var(--foreground-muted)]">{sub.cycle}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{sub.amount}</div>
                    <div className="text-sm text-[var(--foreground-muted)] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {sub.date}
                    </div>
                  </div>
                  <span className={`
                    text-xs px-3 py-1 rounded-full font-medium
                    ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                  `}>
                    {sub.status === 'active' ? 'Active' : 'Review'}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6" id="faq">
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


      {/* CTA Section - Conversion Sandwich */}
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
              {/* TOP: Emotional Hook */}
              <p className="text-white/70 text-sm uppercase tracking-wider mb-3">
                Users find 6+ hidden bills on average
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-8 leading-tight">
                Stop paying for subscriptions<br />you don&apos;t use
              </h2>
              
              {/* MIDDLE: CTA Button */}
              <Link href="/login" className="inline-block bg-white text-[var(--accent-primary)] font-semibold px-10 py-4 rounded-full hover:scale-105 transition-transform shadow-lg text-lg mb-8">
                Get Started Free
              </Link>
              
              {/* BOTTOM: Trust Indicators */}
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
            <a href="#" className="hover:text-[var(--foreground)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors">Terms</a>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
