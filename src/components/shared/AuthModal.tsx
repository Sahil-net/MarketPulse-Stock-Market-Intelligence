import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Radio, Mail, ArrowLeft, ShieldCheck, Loader2, X } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'email' | 'otp';

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { sendOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setStep('email');
      setEmail('');
      setOtp(['', '', '', '', '', '']);
      setError(null);
      setInfo(null);
    }
  }, [open]);

  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const { error } = await sendOtp(email);

    setLoading(false);
    if (error) {
      if (error.includes('rate limit') || error.includes('Rate limit')) {
        setError('Too many attempts. Please wait a moment before trying again.');
      } else {
        setError(error);
      }
    } else {
      setInfo(`A 6-digit verification code was sent to ${email}. Enter it below to continue.`);
      setStep('otp');
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const token = otp.join('');
    const { error } = await verifyOtp(email, token);

    setLoading(false);
    if (error) {
      if (error.includes('invalid') || error.includes('Invalid') || error.includes('expired')) {
        setError('The code is invalid or has expired. Please try again.');
      } else if (error.includes('rate limit') || error.includes('Rate limit')) {
        setError('Too many attempts. Please wait a moment before trying again.');
      } else {
        setError(error);
      }
    } else {
      onClose();
    }
  }

  function handleOtpChange(idx: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setError(null);

    if (digit && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }

    if (next.every((d) => d !== '') && next.join('').length === 6) {
      setTimeout(() => {
        const token = next.join('');
        setLoading(true);
        verifyOtp(email, token).then(({ error }) => {
          setLoading(false);
          if (error) {
            if (error.includes('invalid') || error.includes('Invalid') || error.includes('expired')) {
              setError('The code is invalid or has expired. Please try again.');
            } else {
              setError(error);
            }
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
          } else {
            onClose();
          }
        });
      }, 200);
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const next = pasted.split('').concat(Array(6 - pasted.length).fill(''));
      setOtp(next);
      if (pasted.length === 6) {
        otpRefs.current[5]?.focus();
      } else {
        otpRefs.current[pasted.length]?.focus();
      }
    }
  }

  function handleResend() {
    setOtp(['', '', '', '', '', '']);
    setError(null);
    setInfo(null);
    setLoading(true);
    sendOtp(email).then(({ error }) => {
      setLoading(false);
      if (error) {
        setError(error);
      } else {
        setInfo(`A new code was sent to ${email}.`);
        otpRefs.current[0]?.focus();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
            <Radio className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-lg">
            {step === 'email' ? 'Sign in or create account' : 'Verify your email'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 'email'
              ? 'Enter your email to receive a one-time code'
              : 'Enter the 6-digit code we sent you'}
          </DialogDescription>
        </DialogHeader>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="pl-9"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending code...
                </>
              ) : (
                'Send verification code'
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              New here? An account is created automatically — no password needed.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
            {info && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
                {info}
              </div>
            )}

            <div className="space-y-2">
              <Label>Enter the 6-digit code</Label>
              <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="h-12 w-12 rounded-lg border border-input bg-background text-center text-lg font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || otp.join('').length !== 6}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Verify & continue
                </>
              )}
            </Button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(null); setInfo(null); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Change email
              </button>
              <button
                type="button"
                onClick={handleResend}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
