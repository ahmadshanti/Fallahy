import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'ar' | 'en';

type Dict = Record<string, string>;
const dictionaries: Record<Language, Dict> = {
  ar: {
    // Top-level
    'app.tagline': 'من الأرض لبيتك مباشرة',

    // Tabs
    'tab.home': 'الرئيسية',
    'tab.explore': 'تصفح',
    'tab.orders': 'طلباتي',
    'tab.chat': 'الدردشة',
    'tab.profile': 'حسابي',
    'tab.products': 'منتجاتي',
    'tab.earnings': 'أرباحي',

    // Common
    'common.back': 'رجوع',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.confirm': 'تأكيد',
    'common.search': 'بحث',
    'common.share': 'مشاركة',
    'common.favorite': 'مفضلة',
    'common.viewAll': 'عرض الكل',
    'common.notifications': 'التنبيهات',
    'common.cart': 'السلة',
    'common.add': 'إضافة',
    'common.remove': 'إزالة',
    'common.delete': 'حذف',
    'common.loading': 'جاري التحميل...',
    'common.empty': 'لا توجد بيانات',
    'common.retry': 'إعادة المحاولة',
    'common.language': 'اللغة',
    'common.arabic': 'العربية',
    'common.english': 'الإنجليزية',
    'common.logout': 'تسجيل الخروج',
    'common.listen': 'استمع',
    'common.stop': 'إيقاف',
    'common.unavailable': 'غير متاح',

    // Home
    'home.search.placeholder': 'ابحث عن خضار، فواكه أو مزارعين...',
    'home.most_ordered': 'الأكثر طلباً',
    'home.nearby_farmers': 'مزارعون قريبون منك',
    'home.savings.title': 'وفّرت {amount} شيكل هاد الشهر',
    'home.savings.start': 'ابدأ بالتسوق',
    'home.savings.subtitle': 'أنت بطل الاقتصاد الزراعي!',
    'home.no_products': 'لا توجد منتجات حالياً',

    // Adopt tree
    'adopt.title': 'تبنّى شجرة',
    'adopt.subtitle': 'ادعم المزارع وتابع شجرتك بصور حقيقية',
    'adopt.cta': 'تبنّى الآن',
    'adopt.visualize': 'شاهد شجرتك',
    'adopt.generating': 'يتم توليد صورة شجرتك...',
    'adopt.season': 'الموسم',

    // Filters
    'filter.organic_only': 'عضوي فقط',
    'filter.available_now': 'متاح الآن',
    'filter.retail': 'مفرق',
    'filter.wholesale': 'جملة',

    // Product
    'product.add_to_cart': 'أضف للسلة',
    'product.not_found': 'المنتج غير موجود',
    'product.market_price': 'السعر في السوق',
    'product.our_price': 'سعر الفلاحي',
    'product.you_save': 'وفّرت {percent}%',
    'product.read_aloud': 'استمع للوصف',

    // Cart / checkout
    'cart.title': 'سلتي',
    'cart.empty': 'السلة فارغة',
    'cart.empty.subtitle': 'ابدأ بإضافة منتجات طازجة!',
    'cart.browse': 'تصفح المنتجات',
    'cart.subtotal': 'المجموع الفرعي',
    'cart.delivery': 'التوصيل',
    'cart.free': 'مجاني',
    'cart.total': 'الإجمالي',
    'cart.checkout': 'إتمام الطلب',
    'cart.delivery_method': 'طريقة الاستلام',
    'cart.delivery.delivery': 'توصيل',
    'cart.delivery.pickup': 'استلام ذاتي',

    // Chat with farmer
    'chat.title': 'الرسائل',
    'chat.no_conversations': 'لا توجد محادثات',
    'chat.start_first': 'ابدأ محادثة من صفحة المزارع',
    'chat.with': 'محادثة مع {name}',
    'chat.placeholder': 'اكتب رسالتك...',
    'chat.send': 'إرسال',
  },
  en: {
    'app.tagline': 'From the farm to your home',

    'tab.home': 'Home',
    'tab.explore': 'Explore',
    'tab.orders': 'Orders',
    'tab.chat': 'Chat',
    'tab.profile': 'Profile',
    'tab.products': 'My Products',
    'tab.earnings': 'Earnings',

    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.confirm': 'Confirm',
    'common.search': 'Search',
    'common.share': 'Share',
    'common.favorite': 'Favorite',
    'common.viewAll': 'View all',
    'common.notifications': 'Notifications',
    'common.cart': 'Cart',
    'common.add': 'Add',
    'common.remove': 'Remove',
    'common.delete': 'Delete',
    'common.loading': 'Loading...',
    'common.empty': 'No data',
    'common.retry': 'Retry',
    'common.language': 'Language',
    'common.arabic': 'Arabic',
    'common.english': 'English',
    'common.logout': 'Sign out',
    'common.listen': 'Listen',
    'common.stop': 'Stop',
    'common.unavailable': 'Unavailable',

    'home.search.placeholder': 'Search vegetables, fruits or farmers…',
    'home.most_ordered': 'Most ordered',
    'home.nearby_farmers': 'Farmers near you',
    'home.savings.title': 'You saved {amount} ILS this month',
    'home.savings.start': 'Start shopping',
    'home.savings.subtitle': "You're a champion of local farming!",
    'home.no_products': 'No products yet',

    'adopt.title': 'Adopt a tree',
    'adopt.subtitle': 'Support a farmer and watch your tree grow with real photos',
    'adopt.cta': 'Adopt now',
    'adopt.visualize': 'See your tree',
    'adopt.generating': 'Generating an image of your tree…',
    'adopt.season': 'Season',

    'filter.organic_only': 'Organic only',
    'filter.available_now': 'Available now',
    'filter.retail': 'Retail',
    'filter.wholesale': 'Wholesale',

    'product.add_to_cart': 'Add to cart',
    'product.not_found': 'Product not found',
    'product.market_price': 'Market price',
    'product.our_price': 'Fallahy price',
    'product.you_save': 'You save {percent}%',
    'product.read_aloud': 'Read aloud',

    'cart.title': 'My cart',
    'cart.empty': 'Your cart is empty',
    'cart.empty.subtitle': 'Add some fresh produce!',
    'cart.browse': 'Browse products',
    'cart.subtotal': 'Subtotal',
    'cart.delivery': 'Delivery',
    'cart.free': 'Free',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.delivery_method': 'Delivery method',
    'cart.delivery.delivery': 'Delivery',
    'cart.delivery.pickup': 'Self pickup',

    'chat.title': 'Messages',
    'chat.no_conversations': 'No conversations',
    'chat.start_first': 'Start a conversation from a farmer page',
    'chat.with': 'Chat with {name}',
    'chat.placeholder': 'Type a message…',
    'chat.send': 'Send',
  },
};

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useI18nStore = create<I18nStore>()(
  persist(
    (set) => ({
      language: 'ar',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'fallahy.language',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function useT() {
  const language = useI18nStore((s) => s.language);
  return (key: string, params?: Record<string, string | number>): string => {
    const dict = dictionaries[language];
    let str = dict[key];
    if (str === undefined) {
      // Fall back to Arabic, then the key itself.
      str = dictionaries.ar[key] ?? key;
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  };
}

export function useLanguage() {
  return useI18nStore((s) => s.language);
}
