import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingAnimation = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  // Simulate data loading progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 800); // Wait a bit after 100%
          return 100;
        }
        return prev + Math.random() * 15; // Random "loading" speed
      });
    }, 200);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 bg-[#020617] z-[9999] flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
    >
      {/* 1. Background: Subtle Premium Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(circle at center, #1e293b 1px, transparent 1px)', 
             backgroundSize: '24px 24px' 
           }} 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]" />

      {/* 2. Central Content */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* A. The "V" Logo - Self Drawing Animation */}
        <motion.svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mb-8 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        >
          {/* Hexagon Container */}
          <motion.path
            d="M60 10L103.3 35V85L60 110L16.7 85V35L60 10Z"
            stroke="#1e293b"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          {/* The "V" Shape */}
          <motion.path
            d="M35 45L60 80L85 45"
            stroke="#3b82f6" // Electric Blue
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
          />
        </motion.svg>

        {/* B. Typography - Cinematic Blur Reveal */}
        <div className="overflow-hidden mb-2">
          <motion.h1
            initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
            className="text-5xl font-bold text-white tracking-[0.2em] font-sans"
          >
            VANTAGE
          </motion.h1>
        </div>

        {/* C. Tagline - Staggered Fade */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="text-slate-500 text-xs font-medium tracking-[0.4em] uppercase"
        >
          Enterprise Intelligence
        </motion.p>
      </div>

      {/* 3. Minimalist Progress Line */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900">
        <motion.div 
          className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ ease: "linear" }}
        />
      </div>
    </motion.div>
  );
};

export default LoadingAnimation;