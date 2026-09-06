import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ShieldCheck, Mail, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TARGET_EXAM_OPTIONS_WITH_LABELS, DEFAULT_TARGET_EXAM } from '@/constants/exams';
import { useAuth } from '@/context/AuthContext';
// Import your supabase client instance
import { supabase } from '@/integrations/supabase/client'; // Adjust path if necessary

export default function AuthModal() {
  const { 
    authModalOpen, 
    authModalTab, 
    closeAuthModal, 
    signInWithGoogle, 
    sendEmailOtp, 
    verifyEmailOtp 
  } = useAuth();
  
  const [tab, setTab] = useState<'signin' | 'signup'>(authModalTab);
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [targetExam, setTargetExam] = useState(DEFAULT_TARGET_EXAM);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState(90);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // 1. Capture referral code from URL and persist in localStorage on load
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const refCode = queryParams.get('ref');
    if (refCode) {
      localStorage.setItem('rankdon_ref', refCode.trim().toUpperCase());
    }
  }, []);

  useEffect(() => {
    setTab(authModalTab);
  }, [authModalTab]);

  useEffect(() => {
    if (step !== 2) return;

    const timer = setInterval(() => {
      setCountdown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  const normalizedPhone = useMemo(() => {
    const digits = phone.replace(/\D/g, '').slice(0, 10);
    return digits ? `+91${digits}` : '';
  }, [phone]);

  const targetEmail = useMemo(() => {
    return (tab === 'signup' ? email : identifier).trim().toLowerCase();
  }, [email, identifier, tab]);

  const resetState = () => {
    setStep(1);
    setOtp(Array(6).fill(''));
    setPhone('');
    setEmail('');
    setIdentifier('');
    setFullName('');
    setTargetExam(DEFAULT_TARGET_EXAM);
    setCountdown(90);
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      if (result?.error) throw result.error;
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!targetEmail || !targetEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (tab === 'signup') {
      if (!fullName.trim()) {
        toast.error('Please enter your full name.');
        return;
      }
      const digits = phone.replace(/\D/g, '');
      if (digits.length !== 10) {
        toast.error('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await sendEmailOtp(targetEmail);
      if (error) throw error;

      toast.success(`OTP sent to ${targetEmail}`);
      setStep(2);
      setCountdown(90);
      setOtp(Array(6).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;
    try {
      const { error } = await sendEmailOtp(targetEmail);
      if (error) throw error;
      toast.success('New OTP sent to your email!');
      setCountdown(90);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Could not resend OTP.');
    }
  };

  const updateOtpDigit = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, '').slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = nextValue;
    setOtp(nextOtp);

    if (nextValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    const code = otp.join('').trim();
    if (code.length !== 6) {
      toast.error('Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const signupMeta = tab === 'signup' ? {
        full_name: fullName.trim(),
        phone: normalizedPhone,
        target_exam: targetExam
      } : undefined;

      const { error } = await verifyEmailOtp(targetEmail, code, signupMeta);
      if (error) throw error;

      // 2. Handle Safe Global Referral Processing with Strict Time-Window Check
      const storedRefCode = localStorage.getItem('rankdon_ref');
      if (storedRefCode) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Ensure account was created within the last 2 minutes and has no referrer yet
            const createdAt = new Date(user.created_at).getTime();
            const isBrandNewUser = (Date.now() - createdAt) < 120000;

            const { data: currentProfile } = await (supabase as any)
              .from('profiles')
              .select('referred_by')
              .eq('id', user.id)
              .single();

            if (currentProfile && !currentProfile.referred_by && isBrandNewUser) {
              // Find referrer by referral code
              const { data: referrer } = await (supabase as any)
                .from('profiles')
                .select('id, coins')
                .eq('referral_code', storedRefCode)
                .single();

              if (referrer && referrer.id !== user.id) {
                // Update new user's profile with referred_by and give them +10 coins
                await (supabase as any)
                  .from('profiles')
                  .update({ 
                    referred_by: referrer.id, 
                    coins: 10 
                  })
                  .eq('id', user.id);

                // Increment referrer's coins by +10
                await (supabase as any)
                  .from('profiles')
                  .update({ coins: (referrer.coins || 0) + 10 })
                  .eq('id', referrer.id);

                // Log transactions for audit history
                await (supabase as any).from('coin_transactions').insert([
                  { user_id: user.id, amount: 10, type: 'earned_referral', description: 'Bonus coins for signing up via referral' },
                  { user_id: referrer.id, amount: 10, type: 'earned_referral', description: 'Referral reward for inviting a friend' }
                ]);
              }
            }
          }
        } catch (refErr) {
          console.error('Error processing referral reward:', refErr);
        } finally {
          localStorage.removeItem('rankdon_ref');
        }
      }

      toast.success(tab === 'signup' ? `Welcome, ${fullName.trim()}! You got 10 coins!` : 'Welcome back!');
      closeAuthModal();
      resetState();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (!authModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm" onClick={() => closeAuthModal()} />
      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/10 bg-[#0f172a] p-6 shadow-2xl shadow-slate-950/40">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 ring-1 ring-cyan-400/30">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">Secure login</p>
              <h3 className="text-xl font-semibold text-white">
                {step === 1 ? (tab === 'signup' ? 'Create Account' : 'Sign In') : 'Verify OTP'}
              </h3>
            </div>
          </div>
          <button 
            onClick={() => closeAuthModal()} 
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-sm text-slate-300 transition hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 flex items-center justify-center rounded-full bg-slate-800/90 p-1">
          <button
            type="button"
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${tab === 'signin' ? 'bg-white text-slate-900' : 'text-slate-300'}`}
            onClick={() => { setTab('signin'); setStep(1); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${tab === 'signup' ? 'bg-white text-slate-900' : 'text-slate-300'}`}
            onClick={() => { setTab('signup'); setStep(1); }}
          >
            Sign Up
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute -top-2.5 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-cyan-500 px-2.5 py-0.5 text-[10px] font-semibold text-slate-950 shadow-md">
                <Sparkles className="h-3 w-3" /> Recommended
              </span>
              <button 
                type="button" 
                onClick={handleGoogleAuth}
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center rounded-2xl border border-white/15 bg-slate-800/90 px-4 text-base font-semibold text-white shadow-lg transition duration-200 hover:border-white/30 hover:bg-slate-700 active:scale-[0.99] disabled:opacity-50"
              >
                <svg className="mr-2.5 h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-white transition group-hover:text-white">
                  Continue with Google
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <div className="h-px flex-1 bg-slate-800" />
              <span>OR VIA EMAIL</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {tab === 'signup' ? (
              <div className="space-y-3">
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="h-12 rounded-2xl border-slate-700 bg-slate-900/60 text-base text-white placeholder:text-slate-500"
                  placeholder="Full Name"
                />

                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 rounded-2xl border-slate-700 bg-slate-900/60 text-base text-white placeholder:text-slate-500"
                  placeholder="Email address"
                />

                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 text-sm font-medium text-slate-300">+91</span>
                    <Input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="border-0 bg-transparent px-0 text-base text-white placeholder:text-slate-500 focus-visible:ring-0"
                      placeholder="9876543210"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <Select value={targetExam} onValueChange={setTargetExam}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-700 bg-slate-900/60 text-white">
                    <SelectValue placeholder="Select your target exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_EXAM_OPTIONS_WITH_LABELS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-2">
                <div className="flex items-center gap-2">
                  <Mail className="mx-2 h-4 w-4 text-slate-400" />
                  <Input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="border-0 bg-transparent px-0 text-base text-white placeholder:text-slate-500 focus-visible:ring-0"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="h-12 w-full rounded-2xl bg-cyan-500 text-base font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
            >
              {loading ? 'Sending OTP...' : (tab === 'signup' ? 'Get OTP to Register' : 'Get OTP')}
            </Button>

            <p className="pt-2 text-center text-sm text-slate-400">
              {tab === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                type="button" 
                onClick={() => { setTab(tab === 'signup' ? 'signin' : 'signup'); setStep(1); }} 
                className="font-semibold text-cyan-300 hover:text-cyan-200"
              >
                {tab === 'signup' ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="truncate">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Verification code sent to</p>
                  <p className="mt-1 truncate text-sm font-medium text-white">{targetEmail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  <ChevronLeft className="h-3 w-3" /> Edit
                </button>
              </div>
            </div>

            <div className="mb-5 flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => updateOtpDigit(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  className="h-12 w-11 rounded-xl border border-slate-700 bg-slate-900 text-center text-lg font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                />
              ))}
            </div>

            <div className="mb-5 flex items-center justify-between text-sm text-slate-400">
              <button
                type="button"
                onClick={resendOtp}
                disabled={countdown > 0}
                className="font-medium text-cyan-300 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
              </button>
              <span className="inline-flex items-center gap-1 text-slate-300">
                <Check className="h-4 w-4 text-emerald-400" /> Secure
              </span>
            </div>

            <Button
              type="button"
              onClick={verifyOtp}
              disabled={loading}
              className="h-12 w-full rounded-2xl bg-cyan-500 text-base font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Verifying...' : 'Verify & Proceed'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}