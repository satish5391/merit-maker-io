import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, signInWithPassword, signUpWithPassword } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const submit = async () => {
    setLoading(true);
    try {
      if (tab === 'signin') {
        const { error } = await signInWithPassword(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUpWithPassword(email, password);
        if (error) throw error;
      }
      closeAuthModal();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      // show a simple alert — app uses sonner elsewhere but keep this local
      alert(e instanceof Error ? e.message : 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => closeAuthModal()} />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6">
        <div className="mb-5 flex justify-center">
          <img src="/logo.png" alt="Rankdon Logo" className="h-16 w-auto object-contain" />
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{tab === 'signin' ? 'Sign In' : 'Sign Up'}</h3>
          <div className="flex gap-2">
            <button className={`px-3 py-1 text-sm ${tab === 'signin' ? 'font-semibold' : 'text-muted-foreground'}`} onClick={() => setTab('signin')}>Sign In</button>
            <button className={`px-3 py-1 text-sm ${tab === 'signup' ? 'font-semibold' : 'text-muted-foreground'}`} onClick={() => setTab('signup')}>Sign Up</button>
          </div>
        </div>

        <div className="mt-4">
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
          <Label className="mt-3">Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => closeAuthModal()}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={loading}>{tab === 'signin' ? 'Sign In' : 'Create Account'}</Button>
        </div>
      </div>
    </div>
  );
}
