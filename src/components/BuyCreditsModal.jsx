import React, { useState } from 'react';
import { X, Coins, Sprout, Rocket, Zap, Lock, CheckCircle2 } from 'lucide-react';
import { apiJson } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const PACKS = [
  {
    id: 'starter',
    name: 'Starter Pack',
    priceINR: 49,
    credits: 10,
    badge: null,
    icon: Sprout,
    description: 'Perfect for quick study sessions and single topic reviews.',
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    priceINR: 99,
    credits: 25,
    badge: 'Most Popular',
    icon: Rocket,
    description: 'Great value for mid-term exams and multiple subject courses.',
  },
  {
    id: 'power',
    name: 'Power Pack',
    priceINR: 199,
    credits: 60,
    badge: 'Best Value',
    icon: Zap,
    description: 'Maximum savings for comprehensive semester preparation.',
  },
];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function BuyCreditsModal({ isOpen, onClose }) {
  const { user, refreshUser } = useAuth();
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleBuy = async (pack) => {
    setError(null);
    setSuccessMsg(null);
    setLoadingId(pack.id);

    try {
      const orderRes = await apiJson('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ packId: pack.id }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Check if mock mode order
      if (orderData.orderId.startsWith('order_mock_') || orderData.keyId === 'rzp_test_placeholder') {
        const verifyRes = await apiJson('/api/payments/verify', {
          method: 'POST',
          body: JSON.stringify({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: 'mock_signature_valid',
          }),
        });

        const verifyData = await verifyRes.json();

        if (verifyRes.ok && verifyData.success) {
          await refreshUser();
          setSuccessMsg(`Successfully added ${pack.credits} credits! You now have ${verifyData.credits} credits.`);
          setLoadingId(null);
          return;
        } else {
          throw new Error(verifyData.error || 'Mock payment verification failed');
        }
      }

      // Real Razorpay Checkout flow
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay checkout SDK. Check your network connection.');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'PrepMate',
        description: `${pack.name} — ${pack.credits} Credits`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#2727e6',
        },
        handler: async function (response) {
          try {
            const verifyRes = await apiJson('/api/payments/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              await refreshUser();
              setSuccessMsg(`Successfully added ${pack.credits} credits! You now have ${verifyData.credits} credits.`);
            } else {
              setError(verifyData.error || 'Payment verification failed');
            }
          } catch (verErr) {
            setError('Error verifying payment.');
          } finally {
            setLoadingId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setLoadingId(null);
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      setError(err.message || 'Payment initiation failed');
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in-up">
      <div
        className="bg-paper border border-frost card-rounded p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-hard relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl border-2 border-ink/20 hover:border-ink text-ink transition-all"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-electric-iris/10 border-2 border-ink rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-hard-sm">
            <Coins size={30} strokeWidth={1.75} className="text-electric-iris" />
          </div>
          <h2 className="font-display font-normal text-[32px] text-ink tracking-tight">
            Buy AI Study Credits
          </h2>
          <p className="text-ink/60 mt-1">
            Top up your balance to turn more PDFs into study notes, flashcards & MCQs.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-marker-red/10 border-2 border-marker-red rounded-xl text-marker-red font-medium text-sm text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-jelly-green/10 border-2 border-jelly-green rounded-xl text-jelly-green font-bold text-sm text-center flex items-center justify-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            {successMsg}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {PACKS.map((pack) => {
            const isLoading = loadingId === pack.id;
            return (
              <div
                key={pack.id}
                className={`bg-paper border border-frost card-rounded p-6 shadow-hard flex flex-col justify-between relative transition-all hover:-translate-y-1 ${
                  pack.badge ? 'border-electric-iris bg-electric-iris/5' : ''
                }`}
              >
                {pack.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-electric-iris text-white text-xs font-bold rounded-full shadow-hard-sm">
                    {pack.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <pack.icon size={26} strokeWidth={1.75} className="text-electric-iris" />
                    <span className="font-display font-bold text-2xl text-ink">
                      ₹{pack.priceINR}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-ink mb-1">
                    {pack.name}
                  </h3>
                  <div className="text-electric-iris font-bold text-xl mb-3">
                    {pack.credits} Credits
                  </div>
                  <p className="text-xs text-ink/60 leading-relaxed mb-6">
                    {pack.description}
                  </p>
                </div>

                <button
                  onClick={() => handleBuy(pack)}
                  disabled={!!loadingId}
                  className="w-full py-3 bg-electric-iris text-white font-bold btn-pill shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : `Buy ₹${pack.priceINR}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center text-xs text-ink/50 border-t-2 border-ink/10 pt-4 flex items-center justify-center gap-1.5">
          <Lock size={12} className="shrink-0" />
          Secure INR payments powered by Razorpay. Each AI generation costs 1 credit.
        </div>
      </div>
    </div>
  );
}

export default BuyCreditsModal;
