import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function TermsPage() {
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
          شروط الاستخدام
        </h1>

        <div className="prose prose-surface dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">١. القبول بالشروط</h2>
            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
              باستخدامك لمنصة JO Cars، أنت توافق على هذه الشروط والأحكام. إذا كنت لا توافق، يرجى عدم استخدام المنصة.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">٢. استخدام المنصة</h2>
            <ul className="list-disc list-inside text-surface-600 dark:text-surface-400 space-y-2">
              <li>يجب أن تكون فوق 18 سنة لاستخدام المنصة</li>
              <li>يُحظر نشر محتوى مزيف أو مضلل</li>
              <li>يُحظر استخدام المنصة لأغراض غير قانونية</li>
              <li>يجب أن تكون المعلومات المنشورة صحيحة ومحدثة</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">٣. الإعلانات</h2>
            <ul className="list-disc list-inside text-surface-600 dark:text-surface-400 space-y-2">
              <li>الإعلانات مجانية لجميع المستخدمين</li>
              <li>يحق لنا حذف أي إعلان يخالف الشروط</li>
              <li>يجب أن تكون الصور أصلية وليست مسروقة</li>
              <li>يُمنع الإعلان عن سيارات مسروقة أو غير قانونية</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">٤. المعاملات</h2>
            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
              المنصة ليست طرفاً في أي معاملة بين البائع والمشتري. نحن نوفر منصة للتواصل فقط. يتحمل كل طرف مسؤولية التحقق من صحة المعلومات.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">٥. حقوق الملكية الفكرية</h2>
            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
              جميع المحتويات والشعارات والتصاميم على المنصة محمية بحقوق الملكية الفكرية. يُحظر النسخ أو استخدام المحتوى بدون إذن.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">٦. إلغاء الحساب</h2>
            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
              يمكنك إلغاء حسابك في أي وقت من إعدادات الحساب. يحق لنا تعليق أو حذف الحسابات التي تخالف الشروط.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">٧. تعديل الشروط</h2>
            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
              نحتفظ بحق تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو المنصة.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">٨. التواصل</h2>
            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
              لأي استفسارات حول شروط الاستخدام، يرجى التواصل عبر البريد الإلكتروني: support@jo-cars.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
