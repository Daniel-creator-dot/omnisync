import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, Phone, CheckCircle2, ArrowRight, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword = ({ onBack }: ForgotPasswordProps) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Mask email for privacy (e.g. d***l@o***c.com)
  const maskEmail = (emailStr: string) => {
    const [user, domain] = emailStr.split('@');
    if (!user || !domain) return emailStr;
    const mask = (s: string) => s[0] + '***' + s[s.length - 1];
    return `${mask(user)}@${mask(domain)}`;
  };

  React.useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRequestOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Check your registered phone for the OTP code');
      setStep(2);
      setResendTimer(60);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setStep(3);
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successful! You can now log in.');
      onBack();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Forgot Password?</h2>
              <p className="text-slate-500 mt-2">Enter your email and we'll send an OTP to your registered phone number.</p>
            </div>

            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium text-slate-700">Account Email Address</Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="h-12 text-base rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500/20 transition-all pl-11"
                  />
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2 font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Send OTP via SMS <ArrowRight className="h-4 w-4" /></>}
              </Button>
              <button onClick={onBack} type="button" className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <Phone className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Verification Code</h2>
              <p className="text-slate-500 mt-2">We sent a 6-digit code to the phone associated with <br/> <span className="font-semibold text-indigo-600">{maskEmail(email)}</span></p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="font-medium text-slate-700 block text-center">Enter 6-Digit OTP</Label>
                <Input
                  id="otp"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  className="h-16 text-center text-4xl font-bold tracking-[0.2em] rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10 transition-all"
                />
              </div>
              <div className="space-y-4">
                <Button type="submit" disabled={loading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2 font-semibold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Verify Code <CheckCircle2 className="h-4 w-4" /></>}
                </Button>
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-slate-500">Didn't receive the code?</p>
                  <button 
                    onClick={() => handleRequestOTP()}
                    disabled={loading || resendTimer > 0}
                    type="button"
                    className="text-indigo-600 hover:text-indigo-700 font-semibold disabled:text-slate-400 transition-colors"
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP Now'}
                  </button>
                </div>

                <button onClick={() => setStep(1)} type="button" className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors pt-2">
                  <ArrowLeft className="h-4 w-4" /> Use different email
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                <KeyRound className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Secure Your Account</h2>
              <p className="text-slate-500 mt-2">Almost there! Choose a strong new password.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPass" className="font-medium text-slate-700">New Password</Label>
                <Input
                  id="newPass"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPass" className="font-medium text-slate-700">Confirm New Password</Label>
                <Input
                  id="confirmPass"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500/20"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2 font-semibold shadow-xl shadow-indigo-100 mt-4 transition-all">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Finalize Password Reset <CheckCircle2 className="h-4 w-4" /></>}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgotPassword;
