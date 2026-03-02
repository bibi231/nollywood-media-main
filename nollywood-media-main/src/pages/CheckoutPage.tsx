import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Shield, CreditCard, ArrowLeft, Loader2, Lock, Sparkles, CheckCircle } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';

export function CheckoutPage() {
    const { user } = useAuth(); // Keeping for context if needed, but suppressing lint if unused
    const location = useLocation();
    const navigate = useNavigate();
    const plan = location.state?.plan;

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [method, setMethod] = useState<'card' | 'transfer' | 'paypal'>('card');

    if (!plan && !success) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <p className="text-slate-400 mb-6 font-bold tracking-widest uppercase text-xs">Session Invalid</p>
                    <h2 className="text-2xl font-black text-white mb-8">No Plan Selected</h2>
                    <button
                        onClick={() => navigate('/account/subscription')}
                        className="px-8 py-3 bg-red-600 text-white rounded-xl font-black shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Return to Subscription
                    </button>
                </motion.div>
            </div>
        );
    }

    const handlePayment = async () => {
        setLoading(true);
        // Simulate premium payment experience
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            setTimeout(() => navigate('/account/subscription'), 3000);
        }, 3000);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15)_0%,transparent_70%)] animate-pulse" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="text-center relative z-10"
                >
                    <div className="mb-8 inline-block relative">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="bg-red-600 p-6 rounded-full shadow-[0_0_50px_rgba(220,38,38,0.5)]"
                        >
                            <CheckCircle className="w-16 h-16 text-white" />
                        </motion.div>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-4 border-2 border-dashed border-red-600/30 rounded-full"
                        />
                    </div>
                    <h1 className="text-5xl font-black text-white mb-4">Payment Confirmed</h1>
                    <p className="text-xl text-slate-400 font-bold tracking-tight">Welcome to the <span className="text-red-600 uppercase italic">{plan?.name}</span> experience.</p>
                    <p className="mt-8 text-slate-500 font-mono text-sm animate-pulse">Redirecting to your dashboard...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-red-500/30 font-sans">
            <Header onMenuClick={() => { }} />

            <main className="max-w-6xl mx-auto px-4 py-32 relative">
                <div className="absolute top-20 right-0 w-96 h-96 bg-red-600/5 blur-[120px] rounded-full -z-10" />

                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-white mb-12 transition-all group font-black text-xs uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Plans
                </motion.button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Checkout Details */}
                    <div className="lg:col-span-7 space-y-12">
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-full text-red-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                                <Sparkles className="w-3 h-3" />
                                Premium Selection
                            </div>
                            <h1 className="text-6xl font-black mb-4 tracking-tighter">
                                Secure<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">Checkout</span>
                            </h1>
                            <p className="text-slate-400 max-w-md text-lg leading-relaxed">Complete your acquisition of the <span className="text-white font-bold">{plan.name}</span> tier with platform-grade security.</p>
                        </motion.section>

                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-6"
                        >
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
                                <div className="h-px w-8 bg-slate-800" />
                                Payment Method
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { id: 'card', label: 'Credit / Debit Card', icon: <CreditCard className="w-5 h-5" /> },
                                    { id: 'transfer', label: 'Bank Transfer (Local)', icon: <Shield className="w-5 h-5" /> },
                                    { id: 'paypal', label: 'PayPal Gateway', icon: <Lock className="w-5 h-5" /> }
                                ].map((item, i) => (
                                    <motion.button
                                        key={item.id}
                                        whileHover={{ scale: 1.01, x: 5 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setMethod(item.id as any)}
                                        className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 ${method === item.id
                                            ? 'border-red-600 bg-red-600/5 shadow-[0_0_30px_rgba(220,38,38,0.15)]'
                                            : 'border-slate-800 bg-white/[0.02] hover:bg-white/[0.05] hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`p-3 rounded-xl transition-colors ${method === item.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-slate-900 text-slate-500'}`}>
                                                {item.icon}
                                            </div>
                                            <span className={`font-black text-lg ${method === item.id ? 'text-white' : 'text-slate-400'}`}>{item.label}</span>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${method === item.id ? 'border-red-600' : 'border-slate-800'
                                            }`}>
                                            <AnimatePresence>
                                                {method === item.id && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                        className="w-3 h-3 bg-red-600 rounded-full"
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.section>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="pt-10"
                        >
                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full py-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xl shadow-[0_20px_40px_rgba(220,38,38,0.3)] hover:shadow-[0_20px_50px_rgba(220,38,38,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 group"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Inhibiting Interface...
                                    </>
                                ) : (
                                    <>
                                        Authorize Purchase
                                        <Check className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    </>
                                )}
                            </button>
                            <div className="flex items-center justify-center gap-8 mt-8 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                                <Lock className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">AES-256 Encryption Standard</span>
                                <Shield className="w-4 h-4" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Order Summary Card */}
                    <div className="lg:col-span-5">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="sticky top-32 bg-[#0a0a0b] p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-600/10 blur-[80px] rounded-full transition-all group-hover:bg-red-600/20" />

                            <h3 className="text-3xl font-black mb-10 relative">Platform<br /><span className="text-slate-500">Manifest</span></h3>

                            <div className="space-y-8 relative">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-2xl font-black text-white italic tracking-tighter uppercase">{plan.name}</div>
                                        <div className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">Billed per cycle</div>
                                    </div>
                                    <div className="text-4xl font-black text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]">₦{(plan.price * 1500).toLocaleString()}</div>
                                </div>

                                <div className="space-y-4 pt-8 border-t border-white/5">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Core Privileges:</h4>
                                    <ul className="space-y-4">
                                        {plan.features?.slice(0, 5).map((f: string, i: number) => (
                                            <motion.li
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 * i }}
                                                className="flex items-center gap-4 text-sm text-slate-400 font-bold"
                                            >
                                                <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                                                {f}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="pt-8 border-t border-white/5 space-y-4">
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-slate-500 uppercase tracking-widest">Processing Fee</span>
                                        <span className="text-slate-300">₦0.00</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-6 border-t border-white/10">
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Total Value</span>
                                        <span className="text-4xl font-black text-white">₦{(plan.price * 1500).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
