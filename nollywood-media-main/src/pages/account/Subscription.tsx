import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Crown, Check, CreditCard, Calendar, AlertCircle } from 'lucide-react';

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  trial_days: number;
  features: string[];
  max_streams: number;
  max_download: number;
  video_quality: string;
  ads_enabled: boolean;
}

interface CurrentSubscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at: string | null;
  plan: Plan;
}

export function Subscription() {
  const { user, refreshTier } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadPlans();
    if (user) {
      loadCurrentSubscription();
    }
  }, [user]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      setCurrentSubscription(data as any);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      alert('Please sign in to subscribe');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          email: user.email,
          userId: user.id
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      // Redirect to Paystack
      window.location.href = result.data.authorization_url;
    } catch (error: any) {
      console.error('Error initializing payment:', error);
      alert(error.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/paystack/verify?reference=${reference}`);
      const result = await response.json();

      if (result.data?.status === 'success') {
        await refreshTier();
        await loadCurrentSubscription();
        alert('Subscription successful! Welcome to the premium experience.');
      } else {
        throw new Error(result.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      alert('Payment verification failed. Please contact support.');
    } finally {
      setLoading(false);
      setVerifying(false);
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('reference');
      url.searchParams.delete('status');
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference');
    if (reference && !verifying) {
      setVerifying(true);
      verifyPayment(reference);
    }
  }, []);

  const handleCancelSubscription = async () => {
    if (!currentSubscription || !confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          canceled_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id);

      if (error) throw error;

      alert('Your subscription will be canceled at the end of the billing period.');
      loadCurrentSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Loading subscription plans...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
          Choose Your <span className="text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]">Experience</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Unlock premium Nollywood content, AI creation tools, and an ad-free cinematic journey.
        </p>
      </div>

      {currentSubscription && (
        <div className="mb-12 p-1 bg-gradient-to-r from-red-600/20 to-transparent rounded-2xl border border-red-500/20 shadow-[0_0_20px_rgba(220,38,38,0.1)]">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="p-4 bg-red-600 rounded-2xl shadow-[0_0_15px_rgba(220,38,38,0.4)]">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h3 className="text-2xl font-bold text-white">
                  Active Subscription: {currentSubscription.plan.name}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-500/30">
                  Premium
                </span>
              </div>
              <p className="text-gray-400 mb-4 text-lg">
                {currentSubscription.plan.description}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-6 text-sm text-gray-300">
                {currentSubscription.current_period_end && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-500" />
                    <span>
                      Renews on {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {currentSubscription.cancel_at && (
                  <div className="flex items-center gap-2 text-amber-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      Cancels on {new Date(currentSubscription.cancel_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {!currentSubscription.cancel_at && (
              <button
                onClick={handleCancelSubscription}
                className="px-6 py-2 rounded-lg border border-gray-700 hover:border-red-500 hover:text-red-500 transition-all text-gray-400 text-sm"
              >
                Manage Plan
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription?.plan_id === plan.id;
          const isPremium = plan.code === 'PREMIUM';
          const isFree = plan.price === 0;

          return (
            <div
              key={plan.id}
              className={`flex flex-col relative rounded-3xl overflow-hidden transition-all duration-300 hover:translate-y-[-8px] ${isPremium
                ? 'bg-gradient-to-b from-gray-900 to-black border-2 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.15)]'
                : 'bg-gray-900/40 border border-gray-800 hover:border-gray-700'
                }`}
            >
              {isPremium && (
                <div className="bg-red-600 text-white text-center py-2 text-xs font-black tracking-widest uppercase">
                  Most Popular
                </div>
              )}

              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-8">
                  <h3 className={`text-2xl font-black mb-2 ${isPremium ? 'text-white' : 'text-gray-200'}`}>
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8 p-6 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">
                      ₦{plan.price * 1500}
                    </span>
                    <span className="text-gray-500 font-medium">
                      /{plan.interval}
                    </span>
                  </div>
                  {plan.trial_days > 0 && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                      <Check className="h-3 w-3" />
                      {plan.trial_days} DAYS FREE TRIAL
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                        <Check className="h-3 w-3 text-green-400" />
                      </div>
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                      <Check className="h-3 w-3 text-green-400" />
                    </div>
                    <span className="text-sm text-gray-300">
                      {plan.code === 'FREE' ? '1 AI Generation / day' : plan.code === 'BASIC' ? '5 AI Generations / day' : 'Unlimited AI Generations'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                      <Check className="h-3 w-3 text-green-400" />
                    </div>
                    <span className="text-sm text-gray-300">
                      High-quality streaming ({plan.video_quality})
                    </span>
                  </li>
                  {!plan.ads_enabled && (
                    <li className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                        <Check className="h-3 w-3 text-green-400" />
                      </div>
                      <span className="text-sm text-gray-300 font-medium text-red-400">
                        100% Ad-Free (Cinematic)
                      </span>
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrentPlan || verifying}
                  className={`relative w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden ${isCurrentPlan
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                    : isPremium
                      ? 'bg-red-600 text-white hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]'
                      : 'bg-white text-black hover:bg-gray-100'
                    }`}
                >
                  {isCurrentPlan ? (
                    'Current Plan'
                  ) : verifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      {isFree ? 'Start Streaming' : 'Subscribe Now'}
                      {!isFree && <CreditCard className="h-4 w-4 ml-1" />}
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16 p-8 bg-gray-900/60 border border-white/5 rounded-3xl backdrop-blur-sm">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-red-500" />
          Secure Payment Experience
        </h3>
        <p className="text-gray-400 mb-8 max-w-2xl">
          Your transactions are protected with industry-standard TLS encryption. We partner with Stripe and Paystack to ensure seamless local and international payments.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['Mastercard', 'Visa', 'Bank Transfer', 'Mobile Money'].map((method) => (
            <div key={method} className="px-4 py-3 bg-black/40 rounded-xl border border-white/5 text-center transition-hover hover:border-red-500/30">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{method}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
