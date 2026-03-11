import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import collegeLogo from '@/assets/college-logo.jpg';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 600);
    }, 2800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.08 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.04 }}
              transition={{ delay: 0.5, duration: 1.5 }}
              className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.04 }}
              transition={{ delay: 0.7, duration: 1.5 }}
              className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-primary blur-3xl"
            />
          </div>

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex flex-col items-center gap-7 relative z-10"
          >
            {/* Logo with 3D effect */}
            <motion.div
              initial={{ y: 30, opacity: 0, rotateX: -20 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              transition={{ delay: 0.15, duration: 0.6, type: 'spring', stiffness: 120 }}
              className="relative"
              style={{ perspective: '600px', transformStyle: 'preserve-3d' }}
            >
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-3xl overflow-hidden shadow-2xl border-3 border-primary/20 bg-white relative">
                <img 
                  src={collegeLogo} 
                  alt="Sathyabama Institute of Science and Technology" 
                  className="w-full h-full object-contain p-2"
                />
                {/* Shine effect */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ delay: 1, duration: 0.8, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                />
              </div>
              {/* Decorative ring */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="absolute -inset-3 rounded-[1.5rem] border-2 border-dashed border-primary/15"
              />
            </motion.div>

            {/* College Name */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-center space-y-2"
            >
              <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-wider"
                style={{ textShadow: '0 2px 12px hsl(var(--primary) / 0.2)' }}
              >
                SATHYABAMA
              </h1>
              <p className="text-sm md:text-base text-foreground font-semibold tracking-wide">
                Institute of Science and Technology
              </p>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">
                (Deemed to be University)
              </p>
            </motion.div>

            {/* Motto with line decorations */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
              <p className="text-sm font-bold text-primary tracking-[0.25em] uppercase">
                Justice • Peace • Revolution
              </p>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/40" />
            </motion.div>

            {/* Loading Indicator - Premium dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-6 flex items-center gap-3"
            >
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* App Name at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="absolute bottom-8 text-center"
          >
            <p className="text-base font-bold text-primary tracking-wide">
              Campus Connect
            </p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Issue Reporting System
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
