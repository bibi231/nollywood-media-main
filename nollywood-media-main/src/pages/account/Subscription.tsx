import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Crown, Check, X, CreditCard, Calendar, AlertCircle } from 'lucide-react';

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
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleSubscribe = (planId: string) => {
    alert('Payment integration coming soon! This will redirect to Stripe/Paystack checkout.');
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription || !confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Subscription Plans
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose the perfect plan for your viewing needs
        </p>
      </div>

      {currentSubscription && (
        <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Current Plan: {currentSubscription.plan.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {currentSubscription.plan.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                {currentSubscription.current_period_end && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Renews on {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {currentSubscription.cancel_at && (
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      Cancels on {new Date(currentSubscription.cancel_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              {!currentSubscription.cancel_at && (
                <button
                  onClick={handleCancelSubscription}
                  className="mt-4 text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription?.plan_id === plan.id;
          const isFree = plan.price === 0;

          return (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                plan.code === 'PREMIUM' ? 'ring-2 ring-red-600' : ''
              }`}
            >
              {plan.code === 'PREMIUM' && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}

              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      /{plan.interval}
                    </span>
                  </div>
                  {plan.trial_days > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      {plan.trial_days} day free trial
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features && Array.isArray(plan.features) && plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {plan.video_quality} quality
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {plan.max_streams} simultaneous {plan.max_streams === 1 ? 'stream' : 'streams'}
                    </span>
                  </li>
                  {plan.max_download > 0 && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {plan.max_download === 999 ? 'Unlimited' : plan.max_download} downloads
                      </span>
                    </li>
                  )}
                  {plan.ads_enabled && (
                    <li className="flex items-start gap-2">
                      <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Ad-supported
                      </span>
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    isCurrentPlan
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : plan.code === 'PREMIUM'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : isFree ? 'Get Started' : 'Subscribe'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Payment Methods
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          We accept all major credit cards and local payment methods via Stripe and Paystack.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Credit Card</span>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bank Transfer (Nigeria)</span>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Money</span>
          </div>
        </div>
      </div>
    </div>
  );
}
