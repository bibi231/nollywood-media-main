import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Scale, FileText } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Terms of <span className="text-red-600">Service</span>
          </h1>
          <p className="text-gray-400">Last updated: February 25, 2026</p>
        </div>

        <div className="space-y-12 text-gray-300 leading-relaxed">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">1. Acceptance of Terms</h2>
            </div>
            <p>
              By accessing or using NaijaMation, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services. We reserve the right to modify these terms at any time, and your continued use of the platform constitutes acceptance of those changes.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">2. User Eligibility</h2>
            </div>
            <p>
              You must be at least 18 years old to use this service. If you are under 18, you may only use NaijaMation under the supervision of a parent or legal guardian who agrees to be bound by these terms.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">3. Content & Copyright</h2>
            </div>
            <p className="mb-4">
              Our platform hosts both licensed Nollywood content and user-generated content. All trademarks, logos, and content on NaijaMation are the property of their respective owners.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Users may not download, record, or redistribute content without explicit permission.</li>
              <li>Creators retain ownership of their uploaded content but grant NaijaMation a non-exclusive license to host and distribute it.</li>
              <li>We respond to valid DMCA takedown notices and terminate repeat infringers.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">₦</div>
              <h2 className="text-2xl font-bold text-white">4. Subscriptions & Payments</h2>
            </div>
            <p>
              NaijaMation offers tiered subscription plans. Payments are processed via Paystack or PayPal. Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period. Refunds are handled on a case-by-case basis in accordance with local regulations.
            </p>
          </section>

          <div className="p-8 bg-gray-900/50 border border-white/5 rounded-3xl text-sm text-gray-500 text-center">
            Questions about our Terms? Contact us at <a href="mailto:legal@naijamation.com" className="text-red-500 hover:underline">legal@naijamation.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
