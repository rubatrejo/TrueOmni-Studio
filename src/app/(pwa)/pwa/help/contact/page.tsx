import { HelpContactScreen } from '@/components/pwa/help-contact-screen';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Help — contacto (`/pwa/help/contact`). Formulario mock (From + mensaje + SEND) →
 * éxito inline, + opción de llamar (`tel:`). Textos desde `config.features.pwa.help.contact`;
 * teléfono reutilizado de `connectWithUs.phone`.
 */
export default async function PwaHelpContactPage() {
  const config = await getConfig();
  const h = config.features?.pwa?.help;
  if (!h) {
    return (
      <MobileCanvas>
        <div className="flex h-full w-full items-center justify-center text-foreground">
          {config.client.nombre}
        </div>
      </MobileCanvas>
    );
  }

  const c = h.contact;
  // El "From" usa el nombre del perfil del usuario (mock en config); fallback al default.
  const profileName = config.features?.pwa?.profile?.user?.name;

  return (
    <MobileCanvas>
      <HelpContactScreen
        title={c.title}
        fromLabel={c.fromLabel}
        fromDefault={profileName || c.fromDefault}
        messagePlaceholder={c.messagePlaceholder}
        send={c.send}
        callCta={c.callCta}
        successTitle={c.successTitle}
        successBody={c.successBody}
        phone={config.features?.pwa?.connectWithUs?.phone}
      />
    </MobileCanvas>
  );
}
