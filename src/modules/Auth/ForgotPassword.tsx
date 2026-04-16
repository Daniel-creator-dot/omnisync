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

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Check your phone for the OTP code');
      setStep(2);
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
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
                <Label htmlFor="email" className="font-medium">User Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-12 text-base rounded-xl border-slate-200"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 bg-indigo-600 rounded-xl gap-2 font-semibold">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Send OTP via SMS <ArrowRight className="h-4 w-4" /></>}
              </Button>
              <button onClick={onBack} type="button" className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <Phone className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Verification Code</h2>
              <p className="text-slate-500 mt-2">Enter the 6-digit code sent to your phone <br/> <span className="font-medium text-slate-700">{email}</span></p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="font-medium">6-Digit OTP</Label>
                <Input
                  id="otp"
                  maxLength={6}
                  placeholder="000 000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  className="h-16 text-center text-3xl font-bold tracking-[0.5em] rounded-xl border-slate-200"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 bg-indigo-600 rounded-xl gap-2 font-semibold">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Verify Code <CheckCircle2 className="h-4 w-4" /></>}
              </Button>
              <button onClick={() => setStep(1)} type="button" className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Use different email
              </button>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                <KeyRound className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
              <p className="text-slate-500 mt-2">Almost there! Set your new secure password below.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPass" className="font-medium">New Password</Label>
                <Input
                  id="newPass"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPass" className="font-medium">Confirm Password</Label>
                <Input
                  id="confirmPass"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-slate-200"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 bg-indigo-600 rounded-xl gap-2 font-semibold">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Set New Password <CheckCircle2 className="h-4 w-4" /></>}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgotPassword;
