'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  const { data: session } = useSession();
  const logoHref = session ? '/dashboard' : '/';
  
  return (
    <div className="min-h-screen bg-[var(--background)]">
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

      {/* Content */}
      <section className="pt-32 pb-20 px-6">
        <motion.div 
          className="max-w-3xl mx-auto prose prose-slate lg:prose-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-[var(--foreground-muted)]">Last Updated: January 20, 2026</p>
          </div>

          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-black/5 shadow-sm space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-4">1. Introduction</h2>
              <p className="text-[var(--foreground-muted)] mb-4">
                BillDrop (“we,” “our,” or “us”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and disclose personal information when you use BillDrop, including our website and applications (collectively, the “Service”).
              </p>
              <p className="text-[var(--foreground-muted)]">
                By accessing or using BillDrop, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">2. Definitions</h2>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
                <li><strong>BillDrop:</strong> The bill detection and subscription management service operated by Threadigit, Inc.</li>
                <li><strong>Website:</strong> https://www.billdrop.io</li>
                <li><strong>Personal Data:</strong> Any information that identifies or can reasonably identify an individual</li>
                <li><strong>Service:</strong> BillDrop’s applications, APIs, and related services</li>
                <li><strong>Third-Party Services:</strong> External services integrated into BillDrop, including Google APIs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">3. Information We Collect</h2>
              
              <h3 className="font-semibold mb-2">A. Information You Provide</h3>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)] mb-4">
                <li>Email address</li>
                <li>Account and authentication details</li>
                <li>Customer support communications</li>
              </ul>

              <h3 className="font-semibold mb-2">B. Information from Google (OAuth-Based Access)</h3>
              <p className="text-[var(--foreground-muted)] mb-2">When you connect your Google account, BillDrop may access:</p>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)] mb-4">
                <li>Gmail message metadata and content only as required to detect bills and subscriptions</li>
                <li>Your Google account email address</li>
                <li>Basic profile information (name, profile image, language)</li>
              </ul>
              <div className="bg-amber-50 rounded-xl p-4 text-amber-800 text-sm font-medium">
                ⚠️ We do not access Google data unless you explicitly grant permission.
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">4. How We Use Information</h2>
              <p className="text-[var(--foreground-muted)] mb-2">We use collected information strictly to:</p>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)] mb-4">
                <li>Identify and detect bills and recurring subscriptions</li>
                <li>Provide subscription insights and alerts</li>
                <li>Improve Service accuracy and reliability</li>
                <li>Communicate essential Service updates</li>
              </ul>
              
              <p className="text-[var(--foreground-muted)] mb-2">We do NOT:</p>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
                <li>Sell personal or Google data</li>
                <li>Use Google data for advertising</li>
                <li>Use Google data to train AI or machine learning models</li>
                <li>Allow humans to read Gmail content except for debugging with explicit user consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">5. Google API Services & Limited Use Compliance</h2>
              <p className="text-[var(--foreground-muted)] mb-4">
                BillDrop’s use and transfer of information received from Google APIs complies with the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-primary)] hover:underline">Google API Services User Data Policy</a>, including Limited Use requirements.
              </p>
              <p className="text-[var(--foreground-muted)] mb-2">Specifically:</p>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
                <li>Google user data is used only to provide BillDrop’s core functionality</li>
                <li>Google data is not shared, sold, or used for marketing</li>
                <li>Google data is retained only as long as necessary to provide the Service</li>
                <li>Users can revoke Google access at any time via their Google Account security settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">6. Data Retention</h2>
              <p className="text-[var(--foreground-muted)] mb-2">We retain personal and Google-derived data only for as long as needed to:</p>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)] mb-4">
                <li>Provide the Service</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p className="text-[var(--foreground-muted)]">
                Upon account deletion or Google access revocation: Google data is deleted or anonymized within a reasonable period (not exceeding 60 days unless legally required).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">7. Data Sharing</h2>
              <p className="text-[var(--foreground-muted)] mb-2">We may share data only with:</p>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)] mb-4">
                <li>Trusted infrastructure providers (hosting, storage, analytics)</li>
                <li>Payment processors (when applicable)</li>
                <li>Legal authorities if required by law</li>
              </ul>
              <p className="font-medium text-slate-800">We never sell personal data.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">8. Cookies & Tracking Technologies</h2>
              <p className="text-[var(--foreground-muted)] mb-2">BillDrop uses cookies, local storage, and session technologies to:</p>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
                <li>Authenticate users</li>
                <li>Maintain session integrity</li>
                <li>Improve Service performance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">9. Data Security</h2>
              <p className="text-[var(--foreground-muted)] mb-2">We implement administrative, technical, and physical safeguards to protect your information, including:</p>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
                <li>Encrypted data transmission (SSL/TLS)</li>
                <li>Restricted internal access</li>
                <li>Secure infrastructure providers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">10. International Data Transfers</h2>
              <p className="text-[var(--foreground-muted)]">
                BillDrop is based in the United States. By using the Service, you consent to the transfer and processing of your data in the U.S. and other jurisdictions where our service providers operate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">11. Your Privacy Rights</h2>
              <p className="text-[var(--foreground-muted)] mb-2">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion</li>
                <li>Restrict processing</li>
                <li>Withdraw consent</li>
              </ul>
              <p className="text-[var(--foreground-muted)] mt-4">
                Requests can be made via <a href="mailto:info@billdrop.io" className="text-[var(--accent-primary)] hover:underline">info@billdrop.io</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">12. Children’s Privacy</h2>
              <p className="text-[var(--foreground-muted)]">
                BillDrop is not intended for children under 13. We do not knowingly collect data from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">13. Changes to This Policy</h2>
              <p className="text-[var(--foreground-muted)]">
                We may update this Privacy Policy periodically. Continued use of the Service constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">14. Contact Us</h2>
              <p className="text-[var(--foreground-muted)]">
                For privacy questions or data requests:<br />
                📧 Email: <a href="mailto:info@billdrop.io" className="text-[var(--accent-primary)] hover:underline">info@billdrop.io</a><br />
                🌐 Website: <a href="https://www.billdrop.io" className="text-[var(--accent-primary)] hover:underline">https://www.billdrop.io</a>
              </p>
            </section>
          </div>
        </motion.div>
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
            <Link href="/privacy" className="hover:text-[var(--foreground)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--foreground)] transition-colors">Terms</Link>
            <a href="mailto:info@billdrop.io" className="hover:text-[var(--foreground)] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
