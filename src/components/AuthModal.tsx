import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ShieldCheck, Smartphone, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TARGET_EXAM_OPTIONS_WITH_LABELS, DEFAULT_TARGET_EXAM } from '@/constants/exams';
import { useAuth } from '@/context/AuthContext';

const DEV_OTP = '123456';
const TARGET_EXAMS = TARGET_EXAM_OPTIONS_WITH_LABELS.map((option) => option.value);

export default function AuthModal() {
  const { authModalOpen, authModalTab, closeAuthModal, completeDevAuth } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>(authModalTab);
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [targetExam, setTargetExam] = useState(DEFAULT_TARGET_EXAM);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

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

  useEffect(() => {
    if (step !== 2 || countdown !== 0) return;
    if (import.meta.env.DEV) {
      toast.info(`Dev OTP: ${DEV_OTP}`);
    }
  }, [countdown, step]);

  const normalizedPhone = useMemo(() => {
    const digits = phone.replace(/\D/g, '').slice(0, 10);
    return digits ? `+91${digits}` : '';
  }, [phone]);

  const contactValue = useMemo(() => {
    if (tab === 'signup') {
      return normalizedPhone || 'your mobile';
    }
    return identifier || email || 'your contact';
  }, [email, identifier, normalizedPhone, tab]);

  const resendOtp = () => {
    setCountdown(30);
    if (import.meta.env.DEV) {
      toast.success(`New dev OTP sent: ${DEV_OTP}`);
    }
  };

  const resetState = () => {
    setStep(1);
    setOtp(Array(6).fill(''));
    setPhone('');
    setEmail('');
    setIdentifier('');
    setFullName('');
    setTargetExam(DEFAULT_TARGET_EXAM);
    setCountdown(30);
  };

  const handleContinue = () => {
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
    } else {
      const cleaned = identifier.trim();
      if (!cleaned) {
        toast.error('Please enter your mobile number or email address.');
        return;
      }
      const isEmail = /@/.test(cleaned);
      const phoneDigits = cleaned.replace(/\D/g, '');
      if (!isEmail && phoneDigits.length !== 10) {
        toast.error('Please enter a valid 10-digit mobile number or email address.');
        return;
      }
      if (isEmail && !cleaned.includes('@')) {
        toast.error('Please enter a valid email address.');
        return;
      }
    }

    if (import.meta.env.DEV) {
      toast.info(`Dev OTP: ${DEV_OTP}`);
    }

    setStep(2);
    setCountdown(30);
    setOtp(Array(6).fill(''));
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
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

  const verifyOtp = () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the 6-digit OTP.');
      return;
    }

    if (import.meta.env.DEV && code !== DEV_OTP) {
      toast.error(`Invalid OTP. Dev mode expects ${DEV_OTP}.`);
      return;
    }

    setLoading(true);

    try {
      if (tab === 'signup') {
        const cleanedPhone = phone.replace(/\D/g, '').slice(0, 10);
        const generatedEmail = `${cleanedPhone}@rankdon.local`;
        const profile = completeDevAuth({
          email: generatedEmail,
          phone: `+91${cleanedPhone}`,
          name: fullName.trim(),
          targetExam,
        });

        toast.success(`Welcome aboard, ${profile.name.split(' ')[0]}!`);
      } else {
        const normalizedIdentifier = identifier.trim();
        const isEmail = /@/.test(normalizedIdentifier);
        const profile = completeDevAuth({
          email: isEmail ? normalizedIdentifier : `${normalizedIdentifier.replace(/\D/g, '').slice(-10)}@rankdon.local`,
          phone: isEmail ? `+91${identifier.replace(/\D/g, '').slice(0, 10)}` : `+91${identifier.replace(/\D/g, '').slice(0, 10)}`,
          name: isEmail ? normalizedIdentifier.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : 'Rankdon Learner',
        });

        toast.success(`Welcome back, ${profile.name.split(' ')[0]}!`);
      }

      closeAuthModal();
      resetState();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!authModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm" onClick={() => closeAuthModal()} />
      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/10 bg-[#0f172a] p-5 shadow-2xl shadow-slate-950/40">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 ring-1 ring-cyan-400/30">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">Secure login</p>
              <h3 className="text-xl font-semibold text-white">{step === 1 ? (tab === 'signup' ? 'Create account' : 'Sign in') : 'Verify OTP'}</h3>
            </div>
          </div>
          <button onClick={() => closeAuthModal()} className="rounded-full border border-white/10 px-2 py-1 text-sm text-slate-300 hover:bg-white/5">✕</button>
        </div>

        <div className="mb-6 flex items-center justify-center rounded-full bg-slate-800/90 p-1">
          <button
            type="button"
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${tab === 'signin' ? 'bg-white text-slate-900' : 'text-slate-300'}`}
            onClick={() => setTab('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${tab === 'signup' ? 'bg-white text-slate-900' : 'text-slate-300'}`}
            onClick={() => setTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-3">
            {tab === 'signup' ? (
              <>
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="h-12 rounded-2xl border-slate-700 bg-slate-900/60 text-base text-white placeholder:text-slate-500"
                  placeholder="Full Name"
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
              </>
            ) : (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 text-sm font-medium text-slate-300">{identifier.includes('@') ? <Mail className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}</span>
                  <Input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="border-0 bg-transparent px-0 text-base text-white placeholder:text-slate-500 focus-visible:ring-0"
                    placeholder="Mobile number or email"
                  />
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={handleContinue}
              className="h-12 w-full rounded-2xl bg-cyan-500 text-base font-semibold text-slate-950 hover:bg-cyan-400"
            >
              {tab === 'signup' ? 'Create Account' : 'Get OTP'}
            </Button>

            <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <div className="h-px flex-1 bg-slate-700" />
              <span>OR</span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>

            <Button type="button" variant="outline" className="h-12 w-full rounded-2xl border-slate-700 bg-slate-900/50 text-base font-medium text-white hover:bg-slate-800">
              Continue with Google
            </Button>

            <p className="pt-2 text-center text-sm text-slate-400">
              {tab === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button type="button" onClick={() => setTab(tab === 'signup' ? 'signin' : 'signup')} className="font-semibold text-cyan-300 hover:text-cyan-200">
                {tab === 'signup' ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Verification sent to</p>
                  <p className="mt-1 text-sm font-medium text-white">{contactValue}</p>
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
              <span className="inline-flex items-center gap-1 text-slate-300"><Check className="h-4 w-4 text-emerald-400" /> Secure</span>
            </div>

            <Button
              type="button"
              onClick={verifyOtp}
              disabled={loading}
              className="h-12 w-full rounded-2xl bg-cyan-500 text-base font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Verifying...' : 'Verify & Proceed'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
