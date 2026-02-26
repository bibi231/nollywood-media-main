import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, Database } from 'lucide-react';

export default function Privacy() {
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
            Privacy <span className="text-red-600">Policy</span>
          </h1>
          <p className="text-gray-400">Protecting your data is our top priority.</p>
        </div>

        <div className="space-y-12 text-gray-300 leading-relaxed">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">Data We Collect</h2>
            </div>
            <p>
              We collect information you provide directly to us, such as when you create an account, subscribe to a plan, or contact support. This includes your email address, name, and payment information (processed securely by Paystack/Stripe).
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">How We Use Data</h2>
            </div>
            <p className="mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Provide, maintain, and improve our services.</li>
              <li>Process transactions and send related information.</li>
              <li>Send technical notices, updates, and support messages.</li>
              <li>Personalize your experience and recommendations.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">Security Measures</h2>
            </div>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide, please be aware that no security measures are perfect or impenetrable.
            </p>
          </section>

          <div className="p-8 bg-gray-900/50 border border-white/5 rounded-3xl text-sm text-gray-500 text-center">
            Concerned about your privacy? Reach out at <a href="mailto:privacy@naijamation.com" className="text-red-500 hover:underline">privacy@naijamation.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
