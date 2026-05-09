/**
 * Catálogo de locales ISO 639-1 disponibles para añadir al kiosk desde el
 * Studio. ~150 idiomas con código, nombre en inglés, nombre nativo (endonym)
 * y región para agrupar en el modal de "Add language".
 *
 * El operador no está limitado a este catálogo — el bundle del kiosk acepta
 * cualquier string como key (ver `I18nBundleSchema` en `schema.ts`). Pero
 * este catálogo cubre los idiomas comunes y permite búsqueda en el modal.
 *
 * Fuente: ISO 639-1 (códigos de 2 letras). Se priorizan los idiomas con
 * mayor número de hablantes y/o relevancia turística para clientes TrueOmni
 * (kioscos en hoteles, museos, aeropuertos).
 */

export type LocaleRegion = 'Europe' | 'Americas' | 'Asia' | 'Middle East' | 'Africa' | 'Pacific';

export type LocaleEntry = {
  /** Código ISO 639-1 de 2 letras (en minúsculas). */
  code: string;
  /** Nombre en inglés del idioma. Para búsquedas con keyboard latín. */
  englishName: string;
  /** Nombre nativo (endonym). Lo que vería un hablante nativo. */
  nativeName: string;
  /** Región geográfica para agrupar en la UI. */
  region: LocaleRegion;
};

/** Validador básico de código ISO 639-1: dos letras minúsculas. */
export const LOCALE_CODE_REGEX = /^[a-z]{2}$/;

/**
 * Catálogo curado. ~150 entries cubriendo los idiomas con mayor relevancia
 * para clientes globales. NO es exhaustivo — el operador puede añadir
 * cualquier ISO 639-1 vía override manual si su idioma no aparece aquí.
 */
export const LOCALE_CATALOG: readonly LocaleEntry[] = [
  // ── Europe ──────────────────────────────────────────────────────────────
  { code: 'en', englishName: 'English', nativeName: 'English', region: 'Europe' },
  { code: 'es', englishName: 'Spanish', nativeName: 'Español', region: 'Europe' },
  { code: 'fr', englishName: 'French', nativeName: 'Français', region: 'Europe' },
  { code: 'de', englishName: 'German', nativeName: 'Deutsch', region: 'Europe' },
  { code: 'it', englishName: 'Italian', nativeName: 'Italiano', region: 'Europe' },
  { code: 'pt', englishName: 'Portuguese', nativeName: 'Português', region: 'Europe' },
  { code: 'nl', englishName: 'Dutch', nativeName: 'Nederlands', region: 'Europe' },
  { code: 'pl', englishName: 'Polish', nativeName: 'Polski', region: 'Europe' },
  { code: 'sv', englishName: 'Swedish', nativeName: 'Svenska', region: 'Europe' },
  { code: 'da', englishName: 'Danish', nativeName: 'Dansk', region: 'Europe' },
  { code: 'fi', englishName: 'Finnish', nativeName: 'Suomi', region: 'Europe' },
  { code: 'no', englishName: 'Norwegian', nativeName: 'Norsk', region: 'Europe' },
  { code: 'is', englishName: 'Icelandic', nativeName: 'Íslenska', region: 'Europe' },
  { code: 'cs', englishName: 'Czech', nativeName: 'Čeština', region: 'Europe' },
  { code: 'sk', englishName: 'Slovak', nativeName: 'Slovenčina', region: 'Europe' },
  { code: 'sl', englishName: 'Slovenian', nativeName: 'Slovenščina', region: 'Europe' },
  { code: 'hu', englishName: 'Hungarian', nativeName: 'Magyar', region: 'Europe' },
  { code: 'ro', englishName: 'Romanian', nativeName: 'Română', region: 'Europe' },
  { code: 'bg', englishName: 'Bulgarian', nativeName: 'Български', region: 'Europe' },
  { code: 'el', englishName: 'Greek', nativeName: 'Ελληνικά', region: 'Europe' },
  { code: 'hr', englishName: 'Croatian', nativeName: 'Hrvatski', region: 'Europe' },
  { code: 'sr', englishName: 'Serbian', nativeName: 'Српски', region: 'Europe' },
  { code: 'bs', englishName: 'Bosnian', nativeName: 'Bosanski', region: 'Europe' },
  { code: 'sq', englishName: 'Albanian', nativeName: 'Shqip', region: 'Europe' },
  { code: 'mk', englishName: 'Macedonian', nativeName: 'Македонски', region: 'Europe' },
  { code: 'ru', englishName: 'Russian', nativeName: 'Русский', region: 'Europe' },
  { code: 'uk', englishName: 'Ukrainian', nativeName: 'Українська', region: 'Europe' },
  { code: 'be', englishName: 'Belarusian', nativeName: 'Беларуская', region: 'Europe' },
  { code: 'lt', englishName: 'Lithuanian', nativeName: 'Lietuvių', region: 'Europe' },
  { code: 'lv', englishName: 'Latvian', nativeName: 'Latviešu', region: 'Europe' },
  { code: 'et', englishName: 'Estonian', nativeName: 'Eesti', region: 'Europe' },
  { code: 'ga', englishName: 'Irish', nativeName: 'Gaeilge', region: 'Europe' },
  { code: 'cy', englishName: 'Welsh', nativeName: 'Cymraeg', region: 'Europe' },
  { code: 'ca', englishName: 'Catalan', nativeName: 'Català', region: 'Europe' },
  { code: 'gl', englishName: 'Galician', nativeName: 'Galego', region: 'Europe' },
  { code: 'eu', englishName: 'Basque', nativeName: 'Euskara', region: 'Europe' },
  { code: 'mt', englishName: 'Maltese', nativeName: 'Malti', region: 'Europe' },
  { code: 'lb', englishName: 'Luxembourgish', nativeName: 'Lëtzebuergesch', region: 'Europe' },

  // ── Americas ────────────────────────────────────────────────────────────
  { code: 'qu', englishName: 'Quechua', nativeName: 'Runasimi', region: 'Americas' },
  { code: 'ay', englishName: 'Aymara', nativeName: 'Aymar aru', region: 'Americas' },
  { code: 'gn', englishName: 'Guarani', nativeName: "Avañe'ẽ", region: 'Americas' },
  { code: 'ht', englishName: 'Haitian Creole', nativeName: 'Kreyòl ayisyen', region: 'Americas' },

  // ── Asia ────────────────────────────────────────────────────────────────
  { code: 'zh', englishName: 'Chinese', nativeName: '中文', region: 'Asia' },
  { code: 'ja', englishName: 'Japanese', nativeName: '日本語', region: 'Asia' },
  { code: 'ko', englishName: 'Korean', nativeName: '한국어', region: 'Asia' },
  { code: 'hi', englishName: 'Hindi', nativeName: 'हिन्दी', region: 'Asia' },
  { code: 'bn', englishName: 'Bengali', nativeName: 'বাংলা', region: 'Asia' },
  { code: 'pa', englishName: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'Asia' },
  { code: 'gu', englishName: 'Gujarati', nativeName: 'ગુજરાતી', region: 'Asia' },
  { code: 'mr', englishName: 'Marathi', nativeName: 'मराठी', region: 'Asia' },
  { code: 'ta', englishName: 'Tamil', nativeName: 'தமிழ்', region: 'Asia' },
  { code: 'te', englishName: 'Telugu', nativeName: 'తెలుగు', region: 'Asia' },
  { code: 'kn', englishName: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'Asia' },
  { code: 'ml', englishName: 'Malayalam', nativeName: 'മലയാളം', region: 'Asia' },
  { code: 'or', englishName: 'Odia', nativeName: 'ଓଡ଼ିଆ', region: 'Asia' },
  { code: 'as', englishName: 'Assamese', nativeName: 'অসমীয়া', region: 'Asia' },
  { code: 'ur', englishName: 'Urdu', nativeName: 'اردو', region: 'Asia' },
  { code: 'ne', englishName: 'Nepali', nativeName: 'नेपाली', region: 'Asia' },
  { code: 'si', englishName: 'Sinhala', nativeName: 'සිංහල', region: 'Asia' },
  { code: 'th', englishName: 'Thai', nativeName: 'ไทย', region: 'Asia' },
  { code: 'lo', englishName: 'Lao', nativeName: 'ລາວ', region: 'Asia' },
  { code: 'km', englishName: 'Khmer', nativeName: 'ខ្មែរ', region: 'Asia' },
  { code: 'my', englishName: 'Burmese', nativeName: 'မြန်မာ', region: 'Asia' },
  { code: 'vi', englishName: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Asia' },
  { code: 'id', englishName: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Asia' },
  { code: 'ms', englishName: 'Malay', nativeName: 'Bahasa Melayu', region: 'Asia' },
  { code: 'tl', englishName: 'Tagalog', nativeName: 'Tagalog', region: 'Asia' },
  { code: 'mn', englishName: 'Mongolian', nativeName: 'Монгол', region: 'Asia' },
  { code: 'ka', englishName: 'Georgian', nativeName: 'ქართული', region: 'Asia' },
  { code: 'hy', englishName: 'Armenian', nativeName: 'Հայերեն', region: 'Asia' },
  { code: 'az', englishName: 'Azerbaijani', nativeName: 'Azərbaycan', region: 'Asia' },
  { code: 'kk', englishName: 'Kazakh', nativeName: 'Қазақ', region: 'Asia' },
  { code: 'ky', englishName: 'Kyrgyz', nativeName: 'Кыргызча', region: 'Asia' },
  { code: 'uz', englishName: 'Uzbek', nativeName: "O'zbek", region: 'Asia' },
  { code: 'tg', englishName: 'Tajik', nativeName: 'Тоҷикӣ', region: 'Asia' },
  { code: 'tk', englishName: 'Turkmen', nativeName: 'Türkmen', region: 'Asia' },

  // ── Middle East ─────────────────────────────────────────────────────────
  { code: 'ar', englishName: 'Arabic', nativeName: 'العربية', region: 'Middle East' },
  { code: 'he', englishName: 'Hebrew', nativeName: 'עברית', region: 'Middle East' },
  { code: 'tr', englishName: 'Turkish', nativeName: 'Türkçe', region: 'Middle East' },
  { code: 'fa', englishName: 'Persian', nativeName: 'فارسی', region: 'Middle East' },
  { code: 'ku', englishName: 'Kurdish', nativeName: 'Kurdî', region: 'Middle East' },
  { code: 'ps', englishName: 'Pashto', nativeName: 'پښتو', region: 'Middle East' },

  // ── Africa ──────────────────────────────────────────────────────────────
  { code: 'sw', englishName: 'Swahili', nativeName: 'Kiswahili', region: 'Africa' },
  { code: 'am', englishName: 'Amharic', nativeName: 'አማርኛ', region: 'Africa' },
  { code: 'ha', englishName: 'Hausa', nativeName: 'Hausa', region: 'Africa' },
  { code: 'yo', englishName: 'Yoruba', nativeName: 'Yorùbá', region: 'Africa' },
  { code: 'ig', englishName: 'Igbo', nativeName: 'Igbo', region: 'Africa' },
  { code: 'zu', englishName: 'Zulu', nativeName: 'isiZulu', region: 'Africa' },
  { code: 'xh', englishName: 'Xhosa', nativeName: 'isiXhosa', region: 'Africa' },
  { code: 'af', englishName: 'Afrikaans', nativeName: 'Afrikaans', region: 'Africa' },
  { code: 'so', englishName: 'Somali', nativeName: 'Soomaali', region: 'Africa' },
  { code: 'rw', englishName: 'Kinyarwanda', nativeName: 'Kinyarwanda', region: 'Africa' },
  { code: 'mg', englishName: 'Malagasy', nativeName: 'Malagasy', region: 'Africa' },

  // ── Pacific ─────────────────────────────────────────────────────────────
  { code: 'mi', englishName: 'Māori', nativeName: 'Te Reo Māori', region: 'Pacific' },
  { code: 'sm', englishName: 'Samoan', nativeName: 'Gagana Sāmoa', region: 'Pacific' },
  { code: 'to', englishName: 'Tongan', nativeName: 'Lea Faka-Tonga', region: 'Pacific' },
  { code: 'fj', englishName: 'Fijian', nativeName: 'Vosa Vakaviti', region: 'Pacific' },
  { code: 'haw', englishName: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', region: 'Pacific' },
] as const;

/**
 * Lookup rápido por código. Si el código no está en el catálogo, devuelve un
 * fallback con el code como nombre (ej: el operador añadió un locale custom
 * fuera del catálogo).
 */
export function getLocaleInfo(code: string): LocaleEntry {
  const found = LOCALE_CATALOG.find((loc) => loc.code === code);
  if (found) return found;
  return {
    code,
    englishName: code.toUpperCase(),
    nativeName: code.toUpperCase(),
    region: 'Europe',
  };
}

/** Agrupa el catálogo por región (para renderizar secciones en el modal). */
export function groupCatalogByRegion(): Record<LocaleRegion, LocaleEntry[]> {
  const groups: Record<LocaleRegion, LocaleEntry[]> = {
    Europe: [],
    Americas: [],
    Asia: [],
    'Middle East': [],
    Africa: [],
    Pacific: [],
  };
  for (const entry of LOCALE_CATALOG) {
    groups[entry.region].push(entry);
  }
  return groups;
}
