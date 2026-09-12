import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-white tracking-tight font-mono">404</h1>
          <h2 className="text-lg font-bold text-slate-200">Security Checkpoint: Route Undefined</h2>
          <p className="text-xs text-slate-400">
            The requested resource could not be found or has been quarantined.
          </p>
        </div>
        <Link to="/">
          <Button variant="primary" size="md" icon={ArrowLeft}>
            Return to Safety
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
