import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ChevronDown, ChevronUp, Play, CreditCard, MessageCircle, HelpCircle } from 'lucide-react';

export default function HelpCenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      category: 'General',
      icon: Play,
      questions: [
        { q: 'What is NaijaMation?', a: 'NaijaMation is a premium streaming platform dedicated to high-quality Nollywood films, series, and African creator content.' },
        { q: 'How do I start watching?', a: 'Simply sign up for a free account to browse, or subscribe to a premium plan for an ad-free experience.' }
      ]
    },
    {
      category: 'Billing',
      icon: CreditCard,
      questions: [
        { q: 'How do I cancel my subscription?', a: 'Go to your Account settings, then select "Subscription" to manage or cancel your plan.' },
        { q: 'What payment methods are accepted?', a: 'We accept Credit/Debit cards, Bank Transfers, and Mobile Money via Paystack and PayPal.' }
      ]
    },
    {
      category: 'Creators',
      icon: MessageCircle,
      questions: [
        { q: 'Can I upload my own films?', a: 'Yes! Our platform is open to independent African creators. Use the "Upload" section to submit your work for moderation.' },
        { q: 'How do I earn from my content?', a: 'We offer a revenue-sharing model based on watch time for verified creators.' }
      ]
    }
  ];

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

        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-6">
            How can we <span className="text-red-600">help?</span>
          </h1>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for articles, guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {faqs.map((group) => (
            <div key={group.category} className="p-6 bg-gray-900/40 border border-white/5 rounded-3xl text-center group hover:border-red-500/30 transition-all cursor-pointer">
              <group.icon className="w-8 h-8 text-red-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-bold">{group.category}</h3>
              <p className="text-xs text-gray-500 mt-1">{group.questions.length} Articles</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <HelpCircle className="text-red-500 w-6 h-6" />
            Frequently Asked Questions
          </h2>
          {faqs.flatMap(g => g.questions).map((item, idx) => (
            <div key={idx} className="bg-gray-900/40 border border-white/5 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-white font-medium">{item.q}</span>
                {openFaq === idx ? <ChevronUp className="text-red-500" /> : <ChevronDown className="text-gray-500" />}
              </button>
              {openFaq === idx && (
                <div className="p-5 pt-0 text-gray-400 text-sm leading-relaxed border-t border-white/5 bg-black/20">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
