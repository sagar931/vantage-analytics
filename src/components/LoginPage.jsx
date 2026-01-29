import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, ChevronRight, AlertCircle, Loader2, Mail, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPage = () => {
  const { login, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Triggers the "Glow" animation

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Artificial delay for smooth UX feel
    await new Promise(r => setTimeout(r, 800));
    
    const success = await login(email, password);
    
    if (success) {
      setIsSuccess(true); 
      // The parent component (App.jsx) will unmount this page when 'isAuthenticated' becomes true.
    } else {
      setIsSubmitting(false);
    }
  };

  // --- EMAIL TEMPLATE GENERATOR ---
  const handleRequestAccess = () => {
    const recipient = "sagar.mandal@barclays.com"; // Replace with real admin email
    const subject = encodeURIComponent("Access Request: Vantage Analytics Platform");
    const body = encodeURIComponent(
`Dear Admin,

I am requesting access to the Vantage Analytics Platform.

**User Details:**
- Name: [Your Name]
- Department: [Your Department]
- Barclays ID: [Your Email]

**Justification:**
[Please explain why you require access to this fraud monitoring system...]

Regards,
`
    );
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* 1. Cinematic Background */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse duration-[8s]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse duration-[10s]" />
         {/* Grid Overlay */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* 2. SUCCESS ANIMATION (The "Light Blue Glow") */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 20, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute z-50 w-32 h-32 bg-cyan-400 rounded-full blur-xl mix-blend-screen pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="z-10 w-full max-w-[420px] p-6 relative">
        
        {/* Card Container */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl ring-1 ring-white/5 relative overflow-hidden"
        >
          {/* Top Sheen */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50"></div>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="mx-auto w-16 h-16 bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 shadow-inner group">
               <img src="/barclays_logo.png" alt="B" className="h-8 w-auto brightness-0 invert opacity-90 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
            <p className="text-slate-400 text-sm">Vantage Secure Analytics Gateway</p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {authError && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Barclays ID</label>
              <div className="relative group">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-white text-sm outline-none focus:border-blue-500/50 focus:bg-slate-900/80 transition-all placeholder:text-slate-700 group-hover:border-slate-700"
                  placeholder="name@barclays.com"
                  required
                />
                <div className="absolute right-3 top-3.5 text-slate-600 pointer-events-none">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Password</label>
              <div className="relative group">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-white text-sm outline-none focus:border-blue-500/50 focus:bg-slate-900/80 transition-all placeholder:text-slate-700 group-hover:border-slate-700"
                  placeholder="••••••••"
                  required
                />
                <div className="absolute right-3 top-3.5 text-slate-600 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || isSuccess}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden mt-4"
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
              
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...
                </>
              ) : isSuccess ? (
                <>
                  <ShieldCheck className="w-4 h-4" /> Access Granted
                </>
              ) : (
                <>
                  <span className="relative z-10">Authenticate</span>
                  <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3">
             <button 
               onClick={handleRequestAccess}
               className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors py-2 rounded-lg hover:bg-white/5 group"
             >
               <Mail className="w-3.5 h-3.5 group-hover:text-blue-400 transition-colors" />
               <span>New User? Request Access</span>
               <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
             </button>
             
             <div className="flex justify-center text-[10px] text-slate-600 font-mono">
               <span className="flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                 System Secure • v2.1.0
               </span>
             </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;