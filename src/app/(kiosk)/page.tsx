import { getClientSlug } from '@/lib/client-env';
import { getConfig } from '@/lib/config';

export default async function KioskHomePage() {
  const config = await getConfig();
  const slug = getClientSlug();
  const { titulo_principal, subtitulo, label_cliente_activo } = config.textos;

  return (
    <main className="flex h-full flex-col items-center justify-center gap-8 text-center">
      <h1 className="font-serif text-4xl tracking-tight text-foreground">{titulo_principal}</h1>
      <p className="text-xl text-muted-foreground">{subtitulo}</p>
      <div className="rounded-lg bg-secondary px-8 py-4 text-secondary-foreground">
        <span className="text-base">{label_cliente_activo}</span>
        <span className="ml-3 font-mono text-base text-primary">{slug}</span>
      </div>
    </main>
  );
}
