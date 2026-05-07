import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Tailwind consume los tokens CSS definidos en clients/{slug}/tokens.css.
 * Todos los colores se expresan como hsl(var(--token)) — cero hardcoded.
 * Los valores reales viven en tokens.css y pueden cambiar por cliente.
 *
 * darkMode: 'class' → las variantes `dark:` se activan cuando algún ancestor
 * tiene la clase `.dark`. El Studio aplica esa clase desde StudioThemeProvider.
 *
 * El kiosk usa `[data-contrast="high"]` para sobreescribir variables CSS en
 * tokens.css (modo alto contraste accesible), independiente de Tailwind.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        // ----------------------------------------------------------------
        // Tokens del producto Digital Displays (signage). Aislados del kiosk.
        // Consumidos exclusivamente por componentes de src/components/signage
        // y src/app/(signage). Cero hardcoded — siempre vía hsl(var(--signage-*)).
        // ----------------------------------------------------------------
        signage: {
          'brand-primary': 'hsl(var(--signage-brand-primary))',
          'brand-secondary': 'hsl(var(--signage-brand-secondary))',
          'brand-accent': 'hsl(var(--signage-brand-accent))',
          'brand-neutral': 'hsl(var(--signage-brand-neutral))',
          surface: 'hsl(var(--signage-surface))',
          'surface-alt': 'hsl(var(--signage-surface-alt))',
          'surface-dark': 'hsl(var(--signage-surface-dark))',
          'stage-bg': 'hsl(var(--signage-stage-bg))',
          text: 'hsl(var(--signage-text))',
          'text-muted': 'hsl(var(--signage-text-muted))',
          'text-on-brand': 'hsl(var(--signage-text-on-brand))',
          'text-on-dark': 'hsl(var(--signage-text-on-dark))',
          'header-bg': 'hsl(var(--signage-header-bg))',
          'header-text': 'hsl(var(--signage-header-text))',
          'events-accent': 'hsl(var(--signage-events-accent))',
          'social-accent': 'hsl(var(--signage-social-accent))',
          'news-accent': 'hsl(var(--signage-news-accent))',
          'weather-accent': 'hsl(var(--signage-weather-accent))',
          'ads-accent': 'hsl(var(--signage-ads-accent))',
          'video-accent': 'hsl(var(--signage-video-accent))',
          border: 'hsl(var(--signage-border))',
          ring: 'hsl(var(--signage-ring))',
          success: 'hsl(var(--signage-success))',
          warning: 'hsl(var(--signage-warning))',
          destructive: 'hsl(var(--signage-destructive))',
        },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        xs: 'var(--font-xs)',
        sm: 'var(--font-sm)',
        base: 'var(--font-base)',
        lg: 'var(--font-lg)',
        xl: 'var(--font-xl)',
        '2xl': 'var(--font-2xl)',
        '3xl': 'var(--font-3xl)',
        '4xl': 'var(--font-4xl)',
        'billboard-cta': 'var(--font-billboard-cta)',
        'billboard-cat-lg': 'var(--font-billboard-cat-lg)',
        'billboard-cat-md': 'var(--font-billboard-cat-md)',
        'billboard-time': 'var(--font-billboard-time)',
        'billboard-weather': 'var(--font-billboard-weather)',
        'billboard-small': 'var(--font-billboard-small)',
      },
      lineHeight: {
        tight: 'var(--leading-tight)',
        snug: 'var(--leading-snug)',
        normal: 'var(--leading-normal)',
        relaxed: 'var(--leading-relaxed)',
      },
      letterSpacing: {
        tight: 'var(--tracking-tight)',
        normal: 'var(--tracking-normal)',
        wide: 'var(--tracking-wide)',
      },
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      spacing: {
        'safe-top': 'var(--safe-area-top)',
        'safe-bottom': 'var(--safe-area-bottom)',
        'safe-x': 'var(--safe-area-x)',
        'kiosk-w': 'var(--kiosk-width)',
        'kiosk-h': 'var(--kiosk-height)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        'out-kiosk': 'var(--ease-out)',
        'in-out-kiosk': 'var(--ease-in-out)',
      },
    },
  },
  plugins: [animate],
};

export default config;
