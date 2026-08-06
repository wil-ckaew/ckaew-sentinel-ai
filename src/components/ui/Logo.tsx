'use client';

import { ShieldCheckIcon } from '@heroicons/react/24/solid';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
          <ShieldCheckIcon className="w-6 h-6 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
      </div>
      {showText && (
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            CKAEW
          </h1>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium -mt-1">
            SENTINEL AI
          </p>
        </div>
      )}
    </div>
  );
}
