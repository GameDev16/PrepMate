import React, { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { X, Check, ArrowRight } from 'lucide-react';
import { apiJson } from '../lib/api';
import { validatePassword, getStrengthColor, getStrengthPercent } from '../lib/password';
import FloatingShapes from '../components/Shapes';

const requirements = [
  { label: 'At least 8 characters', check: (p) => p.length >= 8 },
  { label: 'One uppercase letter', check: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', check: (p) => /[a-z]/.test(p) },
  { label: 'One number', check: (p) => /[0-9]/.test(p) },
  { label: 'One special character', check: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordValidation = useMemo(() => {
    return validatePassword(password);
  }, [password]);

  const passwordsMatch = password === confirmPassword;

  if (!token) {
    return (
      <div className="min-h-screen bg-chalk flex items-center justify-center p-4 relative font-body text-ink selection:bg-frost">
        <FloatingShapes />
        <div className="w-full max-w-md relative z-10">
          <div className="bg-paper border border-frost rounded-[24px] p-8 shadow-hard text-center">
            <div className="w-16 h-16 bg-marker-red rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-hard-sm">
              <X size={30} strokeWidth={2.5} />
            </div>
            <h1 className="font-display font-normal text-3xl text-ink mb-3 tracking-tight">Invalid link</h1>
            <p className="text-base text-ink/70 leading-relaxed mb-6 font-normal">
              This password recovery link is invalid or has expired.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-electric-iris text-white font-normal text-lg rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              <span>Request New Link</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-chalk flex items-center justify-center p-4 relative font-body text-ink selection:bg-frost">
        <FloatingShapes />
        <div className="w-full max-w-md relative z-10 animate-fade-in-up">
          <div className="bg-paper border border-frost rounded-[24px] p-8 shadow-hard text-center">
            <div className="w-16 h-16 bg-jelly-green rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-hard-sm">
              <Check size={30} strokeWidth={3} />
            </div>
            <h1 className="font-display font-normal text-3xl text-ink mb-3 tracking-tight">Password updated!</h1>
            <p className="text-base text-ink/70 leading-relaxed mb-6 font-normal">
              Your password has been successfully reset. You can now access your creative workspace.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-electric-iris text-white font-normal text-lg rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              <span>Sign In</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!passwordValidation.isValid) {
      setError('Please fix password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await apiJson('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chalk flex items-center justify-center p-4 relative font-body text-ink selection:bg-frost">
      <FloatingShapes />
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <span className="font-display font-extrabold text-3xl tracking-tight text-ink">PrepMate</span>
          </Link>
          <h1 className="font-display font-normal text-[42px] text-ink tracking-tight leading-tight">New password</h1>
          <p className="text-lg text-ink/70 mt-1 font-normal">Create a strong password for your account</p>
        </div>

        <div className="bg-paper border border-frost rounded-[24px] p-8 shadow-hard">
          {error && (
            <div className="mb-6 p-4 bg-marker-red/10 border border-marker-red rounded-2xl text-marker-red text-sm font-normal text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-normal text-ink mb-2">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-chalk border border-frost rounded-full focus:outline-none focus:ring-2 focus:ring-electric-iris transition-colors text-ink font-normal"
                placeholder="••••••••"
              />

              {password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-normal text-ink/60">Password strength</span>
                    <span
                      className="text-xs font-normal capitalize"
                      style={{ color: getStrengthColor(passwordValidation.strength) }}
                    >
                      {passwordValidation.strength}
                    </span>
                  </div>
                  <div className="h-2 bg-frost rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${getStrengthPercent(passwordValidation.strength)}%`,
                        backgroundColor: getStrengthColor(passwordValidation.strength),
                      }}
                    />
                  </div>
                </div>
              )}

              <ul className="mt-4 space-y-2">
                {requirements.map((req) => {
                  const passed = req.check(password);
                  return (
                    <li key={req.label} className="flex items-center gap-2 text-sm font-normal">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          passed
                            ? 'bg-jelly-green text-white'
                            : 'bg-frost text-ink/40'
                        }`}
                      >
                        {passed && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className={passed ? 'text-ink' : 'text-ink/50'}>
                        {req.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <label className="block text-sm font-normal text-ink mb-2">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full px-5 py-3.5 bg-chalk border rounded-full focus:outline-none transition-colors text-ink font-normal ${
                  confirmPassword && !passwordsMatch
                    ? 'border-marker-red'
                    : confirmPassword && passwordsMatch
                    ? 'border-jelly-green'
                    : 'border-frost focus:ring-2 focus:ring-electric-iris'
                }`}
                placeholder="••••••••"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs font-normal text-marker-red mt-1 pl-3">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordValidation.isValid || !passwordsMatch}
              className="w-full py-3.5 bg-electric-iris text-white font-normal text-lg rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
