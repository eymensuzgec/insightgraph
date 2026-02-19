import type { Dict } from '../types'
import en from './en'

const ar: Dict = {
  ...en,
  app: { name: 'InsightGraph', tagline: 'ذكاء مفاهيم يركز على الخصوصية — يعمل محليًا في المتصفح.' },
  nav: { ...en.nav, language: 'اللغة', theme: 'المظهر', studio: 'الاستوديو', login: 'تسجيل الدخول', logout: 'تسجيل الخروج', account: 'الحساب', plan: 'الخطة' },
  editor: { ...en.editor, studio: 'استوديو النص', analyze: 'حلّل', analyzing: 'جارٍ التحليل…', placeholder: 'اكتب أو الصق النص… (يبقى على جهازك)' },
  results: { ...en.results, tabs: { summary: 'ملخص', keywords: 'كلمات', graph: 'رسم', report: 'تقرير', insights: 'رؤى' }, empty: 'شغّل التحليل لرؤية النتائج.' },
  billing: { ...en.billing, title: 'الخطط', subtitle: 'الدفع غير مفعّل بعد (بنية فقط).', free: 'مجاني', plus: 'بلس', ultra: 'ألترا بلس', perMonth: '/شهر', comingSoon: 'قريبًا', current: 'الخطة الحالية', choose: 'اختر الخطة' },
  common: { ...en.common, close: 'إغلاق', cancel: 'إلغاء', save: 'حفظ', ok: 'حسنًا', error: 'حدث خطأ ما' },
  onboarding: { ...en.onboarding, title: 'مرحبًا بك في InsightGraph', subtitle: 'بدون ذكاء اصطناعي خارجي — تجربة SaaS احترافية.' },
}

export default ar
