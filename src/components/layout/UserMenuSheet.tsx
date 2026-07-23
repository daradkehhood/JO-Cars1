'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Heart, MessageCircle, Car, Wrench, Tag, Bell, ShieldCheck, LogOut } from 'lucide-react';

export function UserMenuSheet() {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.03,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.985 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('toggleUserMenu', handler);
    return () => window.removeEventListener('toggleUserMenu', handler);
  }, []);

  const close = () => setOpen(false);

  return (
    <AnimatePresence>
      {open && isAuthenticated && (
        <div className="fixed inset-0 z-[200]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 max-h-[80dvh] bg-white dark:bg-surface-900 rounded-t-3xl overflow-hidden flex flex-col shadow-soft-xl"
          >
            <button
              onClick={close}
              className="flex justify-center pt-3 pb-1 w-full"
            >
              <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
            </button>

            <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 text-lg font-bold">
                  {user?.image ? (
                    <img src={user.image} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || 'U'
                  )}
                </div>
                <div>
                  <p className="font-bold text-surface-900 dark:text-white">{user?.name}</p>
                  <p className="text-sm text-surface-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="flex-1 overflow-y-auto overscroll-contain p-3"
            >
              {[
                { href: '/auth/profile', label: 'الملف الشخصي', icon: User },
                { href: '/favorites', label: 'المفضلة', icon: Heart },
                { href: '/messages', label: 'الرسائل', icon: MessageCircle, badge: unreadCount },
                { href: '/my-cars', label: 'إعلاناتي', icon: Car },
                { href: '/my-garage', label: 'مرآبي', icon: Wrench },
                { href: '/my-wants', label: 'طلباتي', icon: Tag },
                { href: '/price-alerts', label: 'تنبيهات الأسعار', icon: Bell },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div key={item.href} variants={itemVariants}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 active:bg-surface-100 dark:active:bg-surface-700 transition-all duration-200"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-surface-400" />
                        {item.label}
                      </span>
                      {item.badge ? (
                        <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {item.badge}
                        </span>
                      ) : (
                        <svg className="w-4 h-4 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
              {user?.role === 'ADMIN' && (
                <motion.div variants={itemVariants}>
                  <Link
                    href="/admin"
                    onClick={close}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-200"
                  >
                    <ShieldCheck className="w-5 h-5 text-surface-400" />
                    لوحة التحكم
                  </Link>
                </motion.div>
              )}
            </motion.div>

            <div className="p-3 border-t border-surface-100 dark:border-surface-800">
              <button
                onClick={() => { logout(); close(); }}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold text-accent-600 bg-accent-50 dark:bg-accent-500/10 hover:bg-accent-100 dark:hover:bg-accent-500/20 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                تسجيل خروج
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
