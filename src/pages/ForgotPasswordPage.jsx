import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { apiJson } from '../lib/api';
import FloatingShapes from '../components/Shapes';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiJson('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        if (data.token) {
          setDevToken(data.token);
        }
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-chalk flex items-center justify-center p-4 relative font-body text-ink selection:bg-frost">
        <FloatingShapes />
        <div className="w-full max-w-md relative z-10 animate-fade-in-up">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-6">
              <span className="font-display font-extrabold text-3xl tracking-tight text-ink">PrepMate</span>
            </Link>
          </div>

          <div className="bg-paper border border-frost rounded-[24px] p-8 shadow-hard text-center">
            <div className="w-16 h-16 bg-jelly-green rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-hard-sm">
              <Mail size={28} strokeWidth={2} />
            </div>
            <h1 className="font-display font-normal text-[35px] text-ink mb-3 tracking-tight">Check your inbox</h1>
            <p className="text-base text-ink/70 leading-relaxed mb-6 font-normal">
              If an account exists with <strong className="text-ink font-normal underline decoration-frost decoration-2">{email}</strong>, you will receive a password reset link shortly.
            </p>

            {devToken && (
              <div className="mb-6 p-4 bg-hi-yellow/20 border border-ink rounded-2xl text-left">
                <p className="text-xs font-mono uppercase tracking-wider text-ink mb-2">Dev Mode: Reset Link</p>
                <Link
                  to={`/reset-password?token=${devToken}`}
                  className="text-sm font-normal text-electric-iris hover:underline break-all block"
                >
                  /reset-password?token={devToken}
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-electric-iris text-white font-normal text-lg rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              <span>Back to Sign In</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chalk flex items-center justify-center p-4 relative font-body text-ink selection:bg-frost">
      <FloatingShapes />
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <span className="font-display font-extrabold text-3xl tracking-tight text-ink">PrepMate</span>
          </Link>
          <h1 className="font-display font-normal text-[42px] text-ink tracking-tight leading-tight">Reset password</h1>
          <p className="text-lg text-ink/70 mt-1 font-normal">No worries, we'll send you recovery instructions</p>
        </div>

        <div className="bg-paper border border-frost rounded-[24px] p-8 shadow-hard">
          {error && (
            <div className="mb-6 p-4 bg-marker-red/10 border border-marker-red rounded-2xl text-marker-red text-sm font-normal text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-normal text-ink mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-chalk border border-frost rounded-full focus:outline-none focus:ring-2 focus:ring-electric-iris transition-colors text-ink font-normal"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-electric-iris text-white font-normal text-lg rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sending link...' : 'Send Reset Link'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="text-center text-sm text-ink/70 mt-6 font-normal">
            Remember your password?{' '}
            <Link to="/login" className="text-electric-iris font-normal hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
