import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Train, Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6 dark:from-rail-950 dark:to-rail-900">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-rail-700 text-white shadow-lg">
              <Train size={36} />
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-white shadow-md">
              <Search size={16} />
            </div>
          </div>
        </div>

        <h1 className="text-7xl font-bold tracking-tight text-rail-700 dark:text-rail-400">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-200">Page Not Found</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          The page you're looking for may have been moved, deleted, or never existed.
          Please check the URL or return to the dashboard.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/dashboard" className="btn-primary">
            <Home size={16} /> Go to Dashboard
          </Link>
          <Link to="/" className="btn-secondary">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
