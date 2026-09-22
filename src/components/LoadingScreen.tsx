import { motion } from 'framer-motion';
import { Train } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-rail-900 via-rail-950 to-rail-900">
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-rail-600/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent-500/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-4 rounded-full border-4 border-transparent border-t-rail-400 border-r-rail-500/30"
          />
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur shadow-xl">
            <Train size={40} className="text-white" />
          </div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold tracking-tight text-white"
        >
          RailQR AI
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-1 text-sm text-rail-200"
        >
          Indian Railways Asset Management
        </motion.p>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 160 }}
          transition={{ duration: 1.2, delay: 0.4, repeat: Infinity, repeatType: 'reverse' }}
          className="mt-6 h-1 rounded-full bg-gradient-to-r from-rail-400 to-accent-400"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 text-xs text-rail-300"
        >
          Initializing system...
        </motion.p>
      </motion.div>
    </div>
  );
}
