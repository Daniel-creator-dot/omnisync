import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, ShieldCheck, Zap, BarChart3, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden p-6">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-200/40 rounded-full blur-[120px] -mr-96 -mt-96 opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[100px] -ml-64 -mb-64 opacity-50 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full relative z-10"
      >
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <span className="text-4xl font-extrabold tracking-tight text-slate-900">OmniSync</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Welcome back</h2>
          <p className="text-slate-500 text-lg">Sign in to manage your business with precision</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl shadow-slate-200/50 border border-white">
          <AnimatePresence mode="wait">
            {!isForgotMode ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {error && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="admin@omnisync.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="h-14 bg-white text-base rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-shadow"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                      <button 
                        type="button"
                        onClick={() => setIsForgotMode(true)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
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
                      className="h-14 bg-white text-base rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-shadow"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <LogIn className="h-5 w-5" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </div>
                </form>


              </motion.div>
            ) : (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ForgotPassword onBack={() => setIsForgotMode(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          By signing in, you agree to our <br className="sm:hidden" />
          <a href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">Privacy Policy</a>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
