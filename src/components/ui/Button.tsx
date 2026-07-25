'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, fullWidth, ...props }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-r from-primary-700 to-primary-600 text-white shadow-primary hover:from-primary-800 hover:to-primary-700 hover:shadow-primary-lg active:from-primary-900 active:to-primary-800',
      gold: 'bg-gradient-gold text-primary-900 font-bold shadow-gold hover:shadow-gold-lg active:scale-[0.98]',
      secondary: 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 hover:shadow-soft active:bg-surface-100 dark:active:bg-surface-700/70',
      ghost: 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 active:bg-surface-200 dark:active:bg-surface-700',
      danger: 'bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-lg shadow-accent-500/25 hover:from-accent-500 hover:to-accent-400 active:from-accent-700 active:to-accent-600',
      outline: 'border-2 border-primary-600 dark:border-primary-500 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-500/10 active:bg-primary-100 dark:active:bg-primary-500/20',
    };

    const sizes = {
      sm: 'px-4 py-2.5 text-xs min-h-[40px] rounded-xl',
      md: 'px-6 py-3.5 text-sm min-h-[48px] rounded-xl',
      lg: 'px-8 py-4 text-base min-h-[52px] rounded-2xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed select-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
