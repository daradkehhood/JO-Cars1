import Link from 'next/link';
import { ArrowRight, Car, Users, Shield, Zap, MapPin } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 mb-8 font-medium"
        >
          <ArrowRight className="w-5 h-5" />
          العودة للرئيسية
        </Link>

        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-4">
          عن JO Cars
        </h1>
        <p className="text-lg text-surface-600 dark:text-surface-400 mb-12">
          المنصة الأردنية الأولى لبيع وشراء السيارات
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-4">رؤيتنا</h2>
            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
              نسعى لبناء منصة موثوقة وسهلة تربط بين بائعي ومشتري السيارات في الأردن، مع توفير أدوات ذكية تساعد في اتخاذ قرارات أفضل.
            </p>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-4">مهمتنا</h2>
            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
              تمكين الأردنيين من بيع وشراء السيارات بثقة وسهولة، من خلال منصة آمنة توفر معلومات دقيقة وأدوات تحليل متقدمة بالذكاء الاصطناعي.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-8 text-center">لماذا JO Cars؟</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { icon: Car, title: 'سوق متكامل', desc: 'آلاف الإعلانات عن السيارات الجديدة والمستعملة' },
            { icon: Shield, title: 'آمن وموثوق', desc: 'تحقق من الهوية وحماية المستخدمين' },
            { icon: Zap, title: 'ذكاء اصطناعي', desc: 'تقدير الأسعار وتحليل الحالة بالذكاء الاصطناعي' },
            { icon: Users, title: 'مجتمع نشط', desc: 'منتدى نقاش ومشاركة الخبرات' },
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-semibold text-surface-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-surface-600 dark:text-surface-400">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-2xl p-8 shadow-sm text-center">
          <MapPin className="w-8 h-8 mx-auto mb-4 text-primary-600" />
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">نحن في الأردن</h2>
          <p className="text-surface-600 dark:text-surface-400">
            منصة صنع في الأردن، للأردنيين. نخدم جميع المحافظات من عمان إلى إربد والزرقاء ومعان والعقبة وغيرها.
          </p>
        </div>
      </div>
    </div>
  );
}
