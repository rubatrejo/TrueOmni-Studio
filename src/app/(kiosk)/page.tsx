import { getClientSlug } from '@/lib/client-env';
import { KIOSK_PHASE_1_PLACEHOLDER } from '@/lib/kiosk-placeholder';

export default function KioskHomePage() {
  const slug = getClientSlug();
  const { titulo, subtitulo, nota, labelClienteActivo } = KIOSK_PHASE_1_PLACEHOLDER;

  return (
    <main className="flex h-full flex-col items-center justify-center gap-8 text-center">
      <h1 className="text-4xl font-serif tracking-tight text-foreground">{titulo}</h1>
      <p className="text-xl text-muted-foreground">{subtitulo}</p>
      <div className="rounded-lg bg-secondary px-8 py-4 text-secondary-foreground">
        <span className="text-base">{labelClienteActivo}</span>
        <span className="ml-3 text-base font-mono text-primary">{slug}</span>
      </div>
      <p className="text-sm text-muted-foreground">{nota}</p>
    </main>
  );
}
