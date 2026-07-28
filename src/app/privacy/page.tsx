import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 mb-8 font-medium"
        >
          <ArrowRight className="w-5 h-5" />
          العودة للرئيسية
        </Link>

        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-8">
          سياسة الخصوصية
        </h1>

        <div className="prose prose-surface dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">١. مقدمة</h2>
            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
              مرحباً بك في منصة JO Cars. نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">٢. المعلومات التي نجمعها</h2>
            <ul className="list-disc list-inside text-surface-600 dark:text-surface-400 space-y-2">
              <li>الاسم والبريد الإلكتروني ورقم الهاتف</li>
              <li>معلومات الحساب (نوع الحساب، اسم المحل إن وجد)</li>
              <li>بيانات الإعلانات (الصور، المواصفات، الأسعار)</li>
              <li>سجل التصفح والبحث داخل المنصة</li>
              <li>معلومات الجهاز والمتصفح</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">٣. كيف نستخدم المعلومات</h2>
            <ul className="list-disc list-inside text-surface-600 dark:text-surface-400 space-y-2">
              <li>تشغيل وتحسين خدمات المنصة</li>
              <li>التواصل معك بشأن إعلاناتك وحسابك</li>
              <li>إرسال إشعارات مهمة تحديثات النظام</li>
              <li>منع الاحتيال وحماية أمن المستخدمين</li>
              <li>توفير تحليلات الأسعار والتوصيات بالذكاء الاصطناعي</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">٤. مشاركة المعلومات</h2>
            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
              لا نبيع بياناتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك فقط في الحالات التالية:
            </p>
            <ul className="list-disc list-inside text-surface-600 dark:text-surface-400 space-y-2 mt-2">
              <li>بموافقتك الصريحة</li>
              <li>للامتثال للقوانين والأنظمة</li>
              <li>لحماية حقوقنا وأمان مستخدمينا</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">٥. أمان البيانات</h2>
            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
              نستخدم تقنيات تشفير متقدمة لحماية بياناتك. يتم تخزين كلمات المرور بشكل مشفر ولا يمكننا الوصول إليها.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">٦. حقوقك</h2>
            <ul className="list-disc list-inside text-surface-600 dark:text-surface-400 space-y-2">
              <li>الوصول إلى بياناتك الشخصية</li>
              <li>تصحيح أو تحديث المعلومات</li>
              <li>حذف حسابك وبياناتك</li>
              <li>الإبلاغ عن أي استخدام غير مصرح به</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">٧. التواصل</h2>
            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
              لأي استفسارات حول سياسة الخصوصية، يرجى التواصل معنا عبر البريد الإلكتروني: support@jo-cars.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
