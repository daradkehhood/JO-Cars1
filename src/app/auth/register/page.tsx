'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Car, User, Mail, Lock, Phone, Store, Eye, EyeOff, ArrowRight, Check, Wrench, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<'USER' | 'TRADER' | 'DEALER'>('USER');
  const isDealerLike = accountType === 'TRADER' || accountType === 'DEALER';
  const isTrader = accountType === 'TRADER';
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    dealerName: '', dealerDescription: '', dealerAddress: '', commercialReg: '',
  });

  const passwordRequirements = [
    { text: '8 أحرف على الأقل', met: form.password.length >= 8 },
    { text: 'حرف كبير (A-Z)', met: /[A-Z]/.test(form.password) },
    { text: 'حرف صغير (a-z)', met: /[a-z]/.test(form.password) },
    { text: 'رقم (0-9)', met: /\d/.test(form.password) },
    { text: 'رمز خاص (!@#$%^&*)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    setLoading(true);
    try {
      const role = accountType === 'USER' ? 'USER' : accountType;
      const payload = isTrader
        ? { name: form.name, email: form.email, password: form.password, phone: form.phone, role, dealerName: form.dealerName, dealerDescription: form.dealerDescription || undefined, dealerAddress: form.dealerAddress || undefined, commercialReg: form.commercialReg || undefined }
        : isDealerLike
        ? { name: form.name, email: form.email, password: form.password, phone: form.phone, role, dealerName: form.dealerName }
        : { name: form.name, email: form.email, password: form.password, phone: form.phone, role };
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        login(data.data.user, data.data.token);
        toast.success(isTrader ? 'تم استلام طلبك — سيتم مراجعته خلال 24 ساعة' : 'تم إنشاء الحساب بنجاح');
        router.push('/');
      } else { toast.error(data.error || 'فشل إنشاء الحساب'); }
    } catch { toast.error('حدث خطأ في الاتصال'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#080a0a]">
      {/* ═══ Left Panel ═══ */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/hero-porsche.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080a0a]/95 via-[#080a0a]/70 to-[#080a0a]/40" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#080a0a] to-transparent" />
        <div className="relative z-10 px-16 max-w-xl">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <div className="w-16 h-1 bg-gradient-to-r from-[#ffc640] to-[#ffc640]/40 rounded-full mb-8" />
            <h1 className="text-5xl font-bold text-white leading-tight mb-6" style={{ fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif" }}>
              انضم إلى<br /><span className="text-[#ffc640]">مجتمع السيارات</span><br />الأردني
            </h1>
            <p className="text-lg text-[#909096] leading-relaxed max-w-md">
              أنشئ حسابك مجاناً وابدأ في بيع أو شراء السيارات بسهولة وأمان.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className="mt-12 grid grid-cols-3 gap-6">
            {[{ number: 'مجاني', label: 'التسجيل' }, { number: '24 ساعة', label: 'تفعيل سريع' }, { number: 'آمن', label: 'تشفير كامل' }].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-xl font-bold text-[#ffc640]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{stat.number}</div>
                <div className="text-xs text-[#909096] mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }} className="absolute bottom-16 right-16 z-10">
          <div className="w-20 h-20 rounded-2xl bg-[#ffc640]/10 border border-[#ffc640]/20 flex items-center justify-center backdrop-blur-sm">
            <Car className="w-10 h-10 text-[#ffc640]" />
          </div>
        </motion.div>
      </div>

      {/* ═══ Right Panel — Register Form ═══ */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-8 relative overflow-y-auto">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#ffc640]/[0.03] rounded-full blur-[150px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10 py-8">
          {/* Mobile Logo */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ffc640] to-[#e3aa00] shadow-lg shadow-[#ffc640]/20 mb-4">
              <Car className="w-7 h-7 text-[#080a0a]" />
            </div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif" }}>JO Cars</h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif" }}>إنشاء حساب جديد</h2>
            <p className="text-[#909096] text-sm">انضم إلى مجتمع السيارات الأذكى في الأردن</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>
            <div className="bg-[#141616]/80 backdrop-blur-2xl rounded-3xl border border-[#282a2b]/60 p-8 shadow-2xl shadow-black/30">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-[#ffc640]/60 to-transparent rounded-full" />

              {/* Account Type Toggle */}
              <div className="flex bg-[#1a1c1c]/80 rounded-xl p-1 mb-6 border border-[#333535]/40">
                {[
                  { key: 'USER' as const, label: 'مستخدم' },
                  { key: 'TRADER' as const, label: 'تاجر سيارات', icon: Store },
                  { key: 'DEALER' as const, label: 'معرض' },
                ].map((tab) => (
                  <button key={tab.key} type="button" onClick={() => setAccountType(tab.key)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      accountType === tab.key ? 'bg-[#ffc640] text-[#080a0a] shadow-lg shadow-[#ffc640]/20' : 'text-[#909096] hover:text-[#c6c6cc]'
                    }`}>
                    {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                    {tab.label}
                  </button>
                ))}
              </div>

              {isTrader && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="mb-5 p-3 rounded-xl bg-[#ffc640]/5 border border-[#ffc640]/15 text-[#ffc640]/80 text-xs flex items-start gap-2">
                  <Wrench className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>حساب التاجر يتيح لك عرض معرضك وسياراتك. سيتم مراجعة طلبك واعتماده من الإدارة خلال 24 ساعة.</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">الاسم الكامل</label>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909096] group-focus-within:text-[#ffc640] transition-colors duration-300"><User className="w-5 h-5" /></div>
                    <input type="text" placeholder="أدخل اسمك" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                      className="w-full h-12 pr-12 pl-4 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-sm transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 focus:bg-[#1a1c1c] outline-none" />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">البريد الإلكتروني</label>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909096] group-focus-within:text-[#ffc640] transition-colors duration-300"><Mail className="w-5 h-5" /></div>
                    <input type="email" placeholder="example@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" inputMode="email" required
                      className="w-full h-12 pr-12 pl-4 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-sm transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 focus:bg-[#1a1c1c] outline-none" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">رقم الهاتف</label>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909096] group-focus-within:text-[#ffc640] transition-colors duration-300"><Phone className="w-5 h-5" /></div>
                    <input type="tel" placeholder="07XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" inputMode="tel"
                      className="w-full h-12 pr-12 pl-4 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-sm transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 focus:bg-[#1a1c1c] outline-none" />
                  </div>
                </div>

                {/* Dealer Name */}
                {isDealerLike && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                    <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">اسم المعرض / التاجر</label>
                    <div className="relative group">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909096] group-focus-within:text-[#ffc640] transition-colors duration-300"><Store className="w-5 h-5" /></div>
                      <input type="text" placeholder="أدخل اسم المعرض" value={form.dealerName} onChange={(e) => setForm({ ...form, dealerName: e.target.value })}
                        className="w-full h-12 pr-12 pl-4 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-sm transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 focus:bg-[#1a1c1c] outline-none" />
                    </div>
                  </motion.div>
                )}

                {/* Trader fields */}
                {isTrader && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">وصف المعرض</label>
                      <textarea placeholder="نبذة قصيرة عن المعرض…" value={form.dealerDescription} onChange={(e) => setForm({ ...form, dealerDescription: e.target.value })} rows={3} maxLength={1000}
                        className="w-full px-4 py-3 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-sm transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 focus:bg-[#1a1c1c] outline-none resize-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">عنوان المعرض</label>
                      <input type="text" placeholder="المدينة، الشارع" value={form.dealerAddress} onChange={(e) => setForm({ ...form, dealerAddress: e.target.value })} maxLength={300}
                        className="w-full h-12 px-4 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-sm transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 focus:bg-[#1a1c1c] outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">السجل التجاري (اختياري)</label>
                      <input type="text" placeholder="رقم السجل التجاري" value={form.commercialReg} onChange={(e) => setForm({ ...form, commercialReg: e.target.value })} maxLength={100}
                        className="w-full h-12 px-4 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-sm transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 focus:bg-[#1a1c1c] outline-none" />
                    </div>
                  </motion.div>
                )}

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">كلمة المرور</label>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909096] group-focus-within:text-[#ffc640] transition-colors duration-300"><Lock className="w-5 h-5" /></div>
                    <input type={showPassword ? 'text' : 'password'} placeholder="أنشئ كلمة مرور قوية" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" required
                      className="w-full h-12 pr-12 pl-12 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-sm transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 focus:bg-[#1a1c1c] outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#909096] hover:text-[#ffc640] transition-colors duration-200 flex items-center justify-center">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {form.password.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 space-y-1.5">
                      {passwordRequirements.map((req, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${req.met ? 'bg-[#12b76a]' : 'bg-[#333535]/60'}`}>
                            {req.met && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={req.met ? 'text-[#12b76a]' : 'text-[#909096]'}>{req.text}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Submit */}
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01, boxShadow: '0 0 30px rgba(255, 198, 64, 0.2)' }} whileTap={{ scale: 0.99 }}
                  className="w-full h-13 bg-gradient-to-r from-[#ffc640] to-[#e3aa00] hover:from-[#ffd060] hover:to-[#ffc640] text-[#080a0a] font-bold rounded-xl shadow-lg shadow-[#ffc640]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm"
                  style={{ fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif" }}>
                  {loading ? <div className="w-5 h-5 border-2 border-[#080a0a]/20 border-t-[#080a0a] rounded-full animate-spin" /> : <>إنشاء حساب<ArrowRight className="w-5 h-5 rotate-180" /></>}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#333535]/40" /></div>
                <div className="relative flex justify-center"><span className="px-4 bg-[#141616]/80 text-[#909096] text-xs uppercase tracking-wider">أو</span></div>
              </div>

              <Link href="/auth/login" className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-[#333535]/60 text-[#c6c6cc] font-medium hover:bg-[#1a1c1c] hover:border-[#ffc640]/30 transition-all duration-300 text-sm">
                لديك حساب بالفعل؟ تسجيل الدخول
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.7 }} className="text-center text-[#909096] text-xs mt-8 leading-relaxed">
            بالتسجيل، أنت توافق على{' '}
            <Link href="/terms" className="text-[#c6c6cc] hover:text-[#ffc640] transition-colors underline underline-offset-2">شروط الاستخدام</Link>
            {' '}و{' '}
            <Link href="/privacy" className="text-[#c6c6cc] hover:text-[#ffc640] transition-colors underline underline-offset-2">سياسة الخصوصية</Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
}
