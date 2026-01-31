import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, ChevronRight, AlertCircle, Loader2, Mail, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import clsx from 'clsx';

// ============================================
// BRAND COLORS - Updated to Match Dashboard (Blue/Violet)
// ============================================
const BRAND = {
  primary: '#3b82f6',      // Dashboard Blue (Blue-500)
  primaryDark: '#2563eb',  // Blue-600
  primaryLight: '#60a5fa', // Blue-400
  accent: '#8b5cf6',       // Viz Mode Violet
  glow: 'rgba(59, 130, 246, 0.5)',
  glowLight: 'rgba(59, 130, 246, 0.2)',
};

// ============================================
// STARFIELD BACKGROUND - Many More Stars
// ============================================
const Starfield = ({ count = 150 }) => {
  const stars = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.7 + 0.3,
      twinkleDuration: Math.random() * 3 + 2,
      twinkleDelay: Math.random() * 5,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            width: star.size,
            height: star.size,
            left: `${star.x}%`,
            top: `${star.y}%`,
            boxShadow: star.size > 1.5 
              ? `0 0 ${star.size * 2}px ${star.size}px rgba(255,255,255,0.3)` 
              : 'none',
          }}
          animate={{
            opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3],
            scale: [1, star.size > 1.5 ? 1.3 : 1.1, 1],
          }}
          transition={{
            duration: star.twinkleDuration,
            delay: star.twinkleDelay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// INTERACTIVE PARTICLES COMPONENT
// ============================================
const InteractiveParticles = ({ count = 50, mousePosition }) => {
  const particlesRef = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      baseX: Math.random() * 100,
      baseY: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.2,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particlesRef.current.map((p) => {
        const mouseInfluence = mousePosition ? {
          x: (mousePosition.x / window.innerWidth) * 100,
          y: (mousePosition.y / window.innerHeight) * 100,
        } : { x: 50, y: 50 };
        
        const dx = p.baseX - mouseInfluence.x;
        const dy = p.baseY - mouseInfluence.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 30;
        
        const influence = Math.max(0, 1 - distance / maxDistance);
        const offsetX = dx * influence * 0.5;
        const offsetY = dy * influence * 0.5;

        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.baseX}%`,
              top: `${p.baseY}%`,
              backgroundColor: p.id % 2 === 0 ? BRAND.primary : BRAND.accent,
              boxShadow: `0 0 ${p.size * 3}px ${p.size}px ${BRAND.glowLight}`,
            }}
            animate={{
              x: offsetX,
              y: offsetY,
              opacity: [p.opacity, p.opacity + 0.3, p.opacity],
              scale: [1, 1 + influence * 0.5, 1],
            }}
            transition={{
              x: { type: "spring", stiffness: 50, damping: 20 },
              y: { type: "spring", stiffness: 50, damping: 20 },
              opacity: { duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 0.3 },
            }}
          />
        );
      })}
    </div>
  );
};

// ============================================
// AURORA BACKGROUND COMPONENT
// ============================================
const AuroraBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, ${BRAND.glowLight} 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), 
            radial-gradient(ellipse 50% 30% at 40% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 50%)
          `,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 150,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${BRAND.glowLight} 0%, transparent 70%)`,
          top: '-10%',
          left: '-5%',
          filter: 'blur(60px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)`,
          bottom: '-15%',
          right: '-10%',
          filter: 'blur(80px)',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -80, 0],
          y: [0, -60, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

// ============================================
// GRID PATTERN OVERLAY
// ============================================
const GridPattern = () => (
  <div 
    className="absolute inset-0 opacity-[0.03] pointer-events-none"
    style={{
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    }}
  />
);

// ============================================
// PREMIUM INPUT COMPONENT
// ============================================
const PremiumInput = ({ 
  label, 
  type, 
  value, 
  onChange, 
  placeholder, 
  icon: Icon, 
  hasError,
}) => {
  const [localFocus, setLocalFocus] = useState(false);
  
  return (
    <div className="space-y-2 relative">
      <motion.label 
        className="text-[10px] font-bold uppercase tracking-[0.2em] pl-1 flex items-center gap-2"
        animate={{
          color: localFocus ? BRAND.primaryLight : 'rgb(100, 116, 139)',
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.span
          animate={{
            scale: localFocus ? 1.2 : 1,
            opacity: localFocus ? 1 : 0.5,
            color: localFocus ? BRAND.accent : 'currentColor',
          }}
          transition={{ duration: 0.3 }}
        >
          <Sparkles className="w-3 h-3" />
        </motion.span>
        {label}
      </motion.label>
      
      <div className="relative group">
        <motion.div
          className="absolute -inset-0.5 rounded-2xl opacity-0 blur-sm"
          style={{
            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
          }}
          animate={{
            opacity: localFocus ? 0.3 : 0,
          }}
          transition={{ duration: 0.3 }}
        />
        
        <div className="relative">
          <motion.input 
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setLocalFocus(true)}
            onBlur={() => setLocalFocus(false)}
            className={clsx(
              "w-full bg-slate-950/60 backdrop-blur-xl border-2 rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-300 placeholder:text-slate-600",
              "hover:bg-slate-900/60",
              hasError 
                ? "border-red-500/50 focus:border-red-500" 
                : "border-slate-800 focus:border-blue-500/50"
            )}
            placeholder={placeholder}
            required
            style={{
              caretColor: BRAND.primary,
            }}
          />
          
          <motion.div 
            className="absolute right-4 top-4 pointer-events-none"
            animate={{
              color: localFocus ? BRAND.primary : 'rgb(71, 85, 105)',
            }}
            transition={{ duration: 0.3 }}
          >
            <Icon className="w-5 h-5" />
          </motion.div>

          <motion.div
            className="absolute bottom-0 left-1/2 h-[2px] rounded-full"
            style={{ 
              background: `linear-gradient(90deg, transparent, ${BRAND.primary}, transparent)`
            }}
            initial={{ width: 0, x: '-50%' }}
            animate={{
              width: localFocus ? '100%' : '0%',
              x: '-50%',
              opacity: localFocus ? 1 : 0
            }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// ELEGANT LOGO WITH MULTIPLE ORBITING DOTS
// ============================================
const LogoWithOrbitingRings = ({ isSuccess, hasError }) => {
  // Define multiple orbiting dots/planets
  const orbitingDots = [
    { size: 4, orbitSize: 56, duration: 6, color: '#ffffff', glowColor: 'rgba(255,255,255,0.8)', delay: 0 },
    { size: 3, orbitSize: 52, duration: 8, color: BRAND.primary, glowColor: BRAND.glow, delay: 2, reverse: true },
    { size: 2.5, orbitSize: 60, duration: 10, color: BRAND.accent, glowColor: 'rgba(139,92,246,0.6)', delay: 4 },
    { size: 2, orbitSize: 48, duration: 12, color: BRAND.primaryLight, glowColor: 'rgba(96,165,250,0.5)', delay: 1, reverse: true },
    { size: 3.5, orbitSize: 64, duration: 15, color: '#ffffff', glowColor: 'rgba(255,255,255,0.6)', delay: 3 },
  ];

  return (
    <motion.div 
      className="relative mx-auto mb-8 w-36 h-36 flex items-center justify-center"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      style={{ perspective: '500px' }}
    >
      {/* Orbiting Ring 1 - Horizontal ellipse */}
      <motion.div
        className="absolute w-28 h-28 rounded-full border opacity-40"
        style={{ 
          borderColor: BRAND.primary,
          borderWidth: '1px',
          transformStyle: 'preserve-3d',
        }}
        animate={{ 
          rotateY: 360,
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Orbiting Ring 2 - Tilted */}
      <motion.div
        className="absolute w-[100px] h-[100px] rounded-full border opacity-30"
        style={{ 
          borderColor: BRAND.accent,
          borderWidth: '1px',
          transform: 'rotateX(60deg)',
        }}
        animate={{ 
          rotateZ: 360,
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Orbiting Ring 3 - Counter rotation */}
      <motion.div
        className="absolute w-[115px] h-[115px] rounded-full border opacity-20"
        style={{ 
          borderColor: BRAND.primaryLight,
          borderWidth: '1px',
          transform: 'rotateX(-45deg) rotateY(45deg)',
        }}
        animate={{ 
          rotateZ: -360,
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Multiple Orbiting Dots/Planets */}
      {orbitingDots.map((dot, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{
            width: dot.orbitSize * 2,
            height: dot.orbitSize * 2,
            left: '50%',
            top: '50%',
            marginLeft: -dot.orbitSize,
            marginTop: -dot.orbitSize,
          }}
          animate={{ 
            rotate: dot.reverse ? -360 : 360 
          }}
          transition={{ 
            duration: dot.duration, 
            repeat: Infinity, 
            ease: "linear",
            delay: dot.delay,
          }}
        >
          {/* The Dot/Planet */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: dot.size,
              height: dot.size,
              backgroundColor: dot.color,
              boxShadow: `0 0 ${dot.size * 4}px ${dot.size}px ${dot.glowColor}`,
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.3,
            }}
          />
        </motion.div>
      ))}

      {/* Pulsing Glow Behind Eagle */}
      <motion.div
        className="absolute w-24 h-24 rounded-full"
        style={{
          background: `radial-gradient(circle, ${BRAND.glow} 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary glow layer */}
      <motion.div
        className="absolute w-20 h-20 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)`,
          filter: 'blur(15px)',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* THE EAGLE (No Box) */}
      <motion.img
        src="/barclays_logo.png"
        alt="Barclays"
        className="h-16 w-auto brightness-0 invert relative z-10 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]"
        animate={isSuccess ? {
          filter: ['drop-shadow(0 0 0px #3b82f6)', 'drop-shadow(0 0 40px #3b82f6)', 'drop-shadow(0 0 0px #3b82f6)'],
          scale: [1, 1.1, 1]
        } : {}}
        transition={{ duration: 1.5, repeat: isSuccess ? Infinity : 0 }}
      />
    </motion.div>
  );
};

// ============================================
// CORNER ACCENT COMPONENT
// ============================================
const CornerAccents = () => (
  <>
    {/* Top Left */}
    <div className="absolute top-4 left-4 w-10 h-10">
      <div 
        className="absolute top-0 left-0 w-full h-[2px] rounded-full"
        style={{ background: `linear-gradient(90deg, ${BRAND.primary}60, transparent)` }}
      />
      <div 
        className="absolute top-0 left-0 w-[2px] h-full rounded-full"
        style={{ background: `linear-gradient(180deg, ${BRAND.primary}60, transparent)` }}
      />
    </div>
    
    {/* Top Right */}
    <div className="absolute top-4 right-4 w-10 h-10">
      <div 
        className="absolute top-0 right-0 w-full h-[2px] rounded-full"
        style={{ background: `linear-gradient(-90deg, ${BRAND.primary}60, transparent)` }}
      />
      <div 
        className="absolute top-0 right-0 w-[2px] h-full rounded-full"
        style={{ background: `linear-gradient(180deg, ${BRAND.primary}60, transparent)` }}
      />
    </div>
    
    {/* Bottom Left */}
    <div className="absolute bottom-4 left-4 w-10 h-10">
      <div 
        className="absolute bottom-0 left-0 w-full h-[2px] rounded-full"
        style={{ background: `linear-gradient(90deg, ${BRAND.primary}60, transparent)` }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[2px] h-full rounded-full"
        style={{ background: `linear-gradient(0deg, ${BRAND.primary}60, transparent)` }}
      />
    </div>
    
    {/* Bottom Right */}
    <div className="absolute bottom-4 right-4 w-10 h-10">
      <div 
        className="absolute bottom-0 right-0 w-full h-[2px] rounded-full"
        style={{ background: `linear-gradient(-90deg, ${BRAND.primary}60, transparent)` }}
      />
      <div 
        className="absolute bottom-0 right-0 w-[2px] h-full rounded-full"
        style={{ background: `linear-gradient(0deg, ${BRAND.primary}60, transparent)` }}
      />
    </div>
  </>
);

// ============================================
// MAIN LOGIN PAGE COMPONENT
// ============================================
const LoginPage = () => {
  const { login, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const cardRef = useRef(null);

  // Mouse tracking for 3D tilt effect - MORE PRONOUNCED
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Increased tilt values for more noticeable effect
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-8deg", "8deg"]);
  
  const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  // Global mouse tracking for particles
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHoveringCard(false);
  }, [mouseX, mouseY]);

  const handleMouseEnter = useCallback(() => {
    setIsHoveringCard(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(r => setTimeout(r, 1200));
    
    const success = await login(email, password);
    
    if (success) {
      setIsSuccess(true);
    } else {
      setIsSubmitting(false);
    }
  };

  const handleRequestAccess = () => {
    const recipient = "sagar.mandal@barclays.com";
    const subject = encodeURIComponent("Access Request: Vantage Analytics Platform");
    const body = encodeURIComponent(`Dear Admin,\n\nI am requesting access to the Vantage Analytics Platform.\n\nName:\nDepartment:\nBusiness Justification:\n\nThank you.`);
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center relative overflow-hidden selection:bg-blue-500/30">
      
      {/* ========== CINEMATIC BACKGROUND LAYERS ========== */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#050b1d] to-slate-950" />
      <AuroraBackground />
      
      {/* MORE STARS */}
      <Starfield count={200} />
      
      <InteractiveParticles count={40} mousePosition={mousePosition} />
      <GridPattern />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,6,23,0.8)_100%)] pointer-events-none" />

      {/* ========== SUCCESS EXPLOSION ========== */}
      <AnimatePresence>
        {isSuccess && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 30, opacity: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute z-50 w-40 h-40 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, rgba(16, 185, 129, 0.8) 0%, ${BRAND.glow} 40%, transparent 70%)`,
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ========== MAIN CARD ========== */}
      <motion.div 
        className="z-10 w-full max-w-[420px] p-6"
        style={{ perspective: 1200 }}
      >
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            rotateX: springRotateX,
            rotateY: springRotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative"
        >
          {/* Card Outer Glow - Enhanced on hover */}
          <motion.div 
            className="absolute -inset-1 rounded-[32px] transition-all duration-500"
            style={{
              background: `linear-gradient(135deg, ${BRAND.primary}, transparent, ${BRAND.accent})`,
              filter: 'blur(20px)',
            }}
            animate={{
              opacity: isHoveringCard ? 0.5 : 0.25,
            }}
          />

          {/* Main Card Body */}
          <div className="relative bg-[#02040a]/80 backdrop-blur-2xl border border-white/[0.08] rounded-[30px] p-10 shadow-2xl overflow-hidden">
            
            {/* CORNER ACCENTS */}
            <CornerAccents />
            
            {/* Inner noise */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
            
            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />

            {/* ========== HEADER & LOGO ========== */}
            <div className="text-center mb-8 relative z-10">
              <LogoWithOrbitingRings isSuccess={isSuccess} hasError={authError} />

              <motion.h1
                className="text-4xl font-black tracking-tight mb-2 text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                VANTAGE
              </motion.h1>
              
              <motion.p 
                className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Enterprise Intelligence
              </motion.p>
            </div>

            {/* ========== ERROR MESSAGE ========== */}
            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -10 }}
                  animate={{ height: 'auto', opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 backdrop-blur-sm">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-red-300 text-xs font-medium">{authError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ========== FORM ========== */}
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <PremiumInput
                label="Barclays ID"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@barclays.com"
                icon={ShieldCheck}
                hasError={authError}
              />
              
              <PremiumInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                icon={Lock}
                hasError={authError}
              />

              {/* ========== SUBMIT BUTTON ========== */}
              <motion.button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className={clsx(
                  "relative w-full font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:cursor-not-allowed overflow-hidden mt-6 text-sm",
                  isSuccess
                    ? "bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    : "text-white shadow-[0_4px_20px_rgba(37,99,235,0.2)]"
                )}
                style={!isSuccess ? {
                  background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)`,
                } : {}}
                whileHover={!isSubmitting && !isSuccess ? { 
                  scale: 1.02,
                  boxShadow: `0 8px 30px rgba(37,99,235,0.3)`,
                } : {}}
                whileTap={!isSubmitting && !isSuccess ? { scale: 0.98 } : {}}
              >
                {/* Button shine sweep */}
                {!isSuccess && !isSubmitting && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                )}

                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </motion.div>
                  ) : isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <span>Access Granted</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <span>Authenticate</span>
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            {/* ========== FOOTER ========== */}
            <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col items-center gap-4">
              <motion.button
                onClick={handleRequestAccess}
                className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-2 group"
              >
                <Mail className="w-3.5 h-3.5 group-hover:text-blue-400 transition-colors" />
                <span>Request Access</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1 group-hover:translate-y-0" />
              </motion.button>

              <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono tracking-wide">
                <motion.span 
                  className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                SYSTEM SECURE • v2.1.0
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;