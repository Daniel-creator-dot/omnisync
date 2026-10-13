import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, AlertCircle, Landmark, Users, Shield } from 'lucide-react';
import ForgotPassword from './ForgotPassword';

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-100 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] dark:bg-zinc-950">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-zinc-950 text-white px-12 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.35),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.2),transparent_40%)]" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500">
            <Landmark className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Bytz360</span>
        </div>
        <div className="relative max-w-md">
          <p className="text-sm font-medium text-indigo-200">Accounting, people, and insurance</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight leading-[1.1]">A calmer desk for the whole business.</h1>
          <ul className="mt-8 space-y-4 text-sm text-slate-300">
            <li className="flex gap-3"><Landmark className="mt-0.5 h-4 w-4 text-indigo-300 shrink-0" /> Ledgers, invoices, and reports that stay in balance.</li>
            <li className="flex gap-3"><Users className="mt-0.5 h-4 w-4 text-indigo-300 shrink-0" /> Payroll, leave, and the rest of the HR suite.</li>
            <li className="flex gap-3"><Shield className="mt-0.5 h-4 w-4 text-indigo-300 shrink-0" /> Clients, policies, leads, and products in one place.</li>
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">Total Assets = Total Liabilities + Total Equity</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-8 lg:hidden flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Landmark className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">Bytz360</span>
          </div>
          <div className="rounded-3xl bg-white px-6 py-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80 sm:px-8 dark:bg-zinc-900 dark:ring-white/10">
            <AnimatePresence mode="wait">
              {!isForgotMode ? (
                <motion.div key="login" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Sign in</h2>
                  <p className="mt-1 text-sm text-slate-500">Use your work email to open the desk.</p>

                  {error && (
                    <div className="mt-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-slate-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="h-10 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-slate-700">Password</Label>
                        <button
                          type="button"
                          onClick={() => setIsForgotMode(true)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="h-10 bg-white"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="h-10 w-full bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {isLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <>
                          <LogIn className="h-4 w-4" />
                          Sign in
                        </>
                      )}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="forgot" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                  <ForgotPassword onBack={() => setIsForgotMode(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-5 text-center text-xs text-slate-500">
            By signing in, you agree to the Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default LoginPage;
