'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function TermsPage() {
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
            <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
            <p className="text-[var(--foreground-muted)]">Last Updated: January 20, 2026</p>
          </div>

          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-black/5 shadow-sm space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-4">1. General Terms</h2>
              <p className="text-[var(--foreground-muted)] mb-4">
                By accessing or using BillDrop (“Service”), you agree to be bound by these Terms & Conditions (“Terms”). These Terms apply to all users of the BillDrop website, applications, and services operated by Threadigit, Inc.
              </p>
              <p className="text-[var(--foreground-muted)] mb-4">
                If you do not agree with these Terms, you may not access or use the Service.
              </p>
              <p className="text-[var(--foreground-muted)] mb-4">
                Under no circumstances shall BillDrop, its affiliates, or its representatives be liable for any direct, indirect, incidental, consequential, or special damages, including but not limited to loss of data, loss of profits, or business interruption, arising from your use of or inability to use the Service.
              </p>
              <p className="text-[var(--foreground-muted)]">
                BillDrop reserves the right to modify pricing, features, or usage policies at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">2. Definitions</h2>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
                <li><strong>BillDrop / “we” / “us” / “our”:</strong> The BillDrop service operated by Threadigit, Inc.</li>
                <li><strong>Website:</strong> https://www.billdrop.io</li>
                <li><strong>Service:</strong> Bill detection, subscription tracking, and related tools provided by BillDrop</li>
                <li><strong>You / User:</strong> Any individual or entity using BillDrop</li>
                <li><strong>Device:</strong> Any internet-connected device used to access the Service</li>
                <li><strong>Third-Party Services:</strong> External platforms or APIs integrated into BillDrop (including Google)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">3. License</h2>
              <p className="text-[var(--foreground-muted)]">
                BillDrop grants you a limited, revocable, non-exclusive, non-transferable license to access and use the Service strictly in accordance with these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">4. Restrictions</h2>
              <p className="text-[var(--foreground-muted)] mb-2">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
                <li>Copy, sell, resell, lease, sublicense, or commercially exploit the Service</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Remove or alter proprietary notices</li>
                <li>Use the Service in violation of applicable laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">5. Google Services Integration</h2>
              <p className="text-[var(--foreground-muted)] mb-4">
                BillDrop uses Google APIs, including Google OAuth and Gmail API, to provide certain features of the Service.
              </p>
              <p className="text-[var(--foreground-muted)] mb-4">
                By connecting your Google Account, you authorize BillDrop to access and process information from your Google Account strictly in accordance with your granted permissions and our <Link href="/privacy" className="text-[var(--accent-primary)] hover:underline">Privacy Policy</Link>.
              </p>
              <p className="text-[var(--foreground-muted)] mb-4">
                BillDrop’s use and transfer of information received from Google APIs complies with the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-primary)] hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
              </p>
              <p className="text-[var(--foreground-muted)]">
                You may revoke BillDrop’s access at any time via your Google Account security settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">6. Third-Party Services</h2>
              <p className="text-[var(--foreground-muted)]">
                BillDrop may rely on or link to third-party services. We are not responsible for the accuracy, availability, or practices of third-party services, which are governed by their own terms and policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">7. No Financial or Billing Guarantee</h2>
              <p className="text-[var(--foreground-muted)]">
                BillDrop provides automated bill and subscription insights based on available data. We do not guarantee completeness, accuracy, or timeliness of detected billing information. Users are responsible for verifying all financial information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">8. Termination</h2>
              <p className="text-[var(--foreground-muted)]">
                BillDrop may suspend or terminate your access at any time for any reason, including violation of these Terms. Upon termination, your right to use the Service immediately ceases.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">9. Intellectual Property</h2>
              <p className="text-[var(--foreground-muted)]">
                All content, software, trademarks, and materials associated with BillDrop are the exclusive property of Threadigit, Inc. Unauthorized use is strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">10. Disclaimer of Warranties</h2>
              <p className="text-[var(--foreground-muted)]">
                The Service is provided “AS IS” and “AS AVAILABLE”, without warranties of any kind, express or implied, including fitness for a particular purpose, accuracy, or uninterrupted availability.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">11. Limitation of Liability</h2>
              <p className="text-[var(--foreground-muted)]">
                To the maximum extent permitted by law, BillDrop’s total liability shall not exceed the amount paid by you (if any) for use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">12. Arbitration & Governing Law</h2>
              <p className="text-[var(--foreground-muted)]">
                Any dispute arising from these Terms shall be resolved by binding arbitration under the rules of the American Arbitration Association. These Terms are governed by the laws of the State of Delaware, USA.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">13. Changes to These Terms</h2>
              <p className="text-[var(--foreground-muted)]">
                We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">14. Entire Agreement</h2>
              <p className="text-[var(--foreground-muted)]">
                These Terms, together with the <Link href="/privacy" className="text-[var(--accent-primary)] hover:underline">Privacy Policy</Link>, constitute the entire agreement between you and BillDrop and supersede all prior agreements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">15. Contact Information</h2>
              <p className="text-[var(--foreground-muted)]">
                If you have questions about these Terms:<br />
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
