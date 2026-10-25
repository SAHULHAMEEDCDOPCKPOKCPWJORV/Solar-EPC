import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { SunMedium, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Zap, CheckCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useProject();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid work email address (e.g., engineer@solarepc.com).');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your session password.');
      return;
    }

    login(email.trim(), rememberMe);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#060b17] via-[#0b1730] to-[#040915] text-white">
      {/* Background Graphic Elements: Subtle Grid & Solar Array Glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Ambient Sun & Energy Glow Spheres */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Floating Solar Badges */}
      <div className="absolute top-10 left-10 hidden lg:flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-700/50 backdrop-blur-md text-xs text-slate-300 shadow-xl">
        <SunMedium className="w-4 h-4 text-amber-400 animate-spin-slow" />
        <span>Primavera P6 & MS Project Grade Solar EPC Planning</span>
      </div>

      <div className="absolute bottom-8 right-10 hidden lg:flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> CPM Engine Ready</span>
        <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-blue-400" /> Dynamic WBS Generation</span>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 p-8 sm:p-10 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-3 flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/25 border border-blue-400/30">
            <SunMedium className="w-8 h-8 text-amber-300" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900">
              <Zap className="w-3 h-3 text-slate-950" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Solar EPC <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-amber-300">Baseline Pro</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Pre-Execution Baseline Scheduling & Critical Path Gantt Studio
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <span className="font-semibold">Notice:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@solarepc-project.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Workspace Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
              />
              <span>Remember session on this device</span>
            </label>
            <span className="text-blue-400 text-[11px] hover:underline cursor-pointer">
              Demo Access Mode
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Sign In to Scheduling Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Version 2.4.0 Pro</span>
          <span className="flex items-center gap-1 text-slate-400">
            <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
            Enterprise Edition
          </span>
        </div>
      </div>
    </div>
  );
};
