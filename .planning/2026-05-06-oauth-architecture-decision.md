# OAuth multi-cliente — decisión arquitectónica

**Audit Studio · hallazgo #13 · 2026-05-06**

Decisión: **el flow OAuth está deployado pero no activado.** Lo activamos cuando tengamos el primer cliente real que pida Social Wall en producción. Razones y opciones a futuro abajo.

---

## Estado actual

- Schema `integrations.socialOauth.{instagram,facebook,tiktok,x}` en KV per kiosk.
- Endpoints `/api/oauth/[platform]/{start,callback}` deployados y funcionales.
- UI en SocialWallEditor con 4 botones "Connect" que llaman al endpoint.
- Sin envvars `*_CLIENT_ID/SECRET` configuradas → cada botón devuelve 503 con mensaje claro.

Ningún cliente ve estos botones rotos en producción porque ningún kiosk en producción tiene el módulo Social Wall activo todavía.

---

## Cómo escala el modelo actual

Con **una sola app de developer de TrueOmni** en cada plataforma, cada cliente conecta SU cuenta dentro de SU kiosk:

```
TrueOmni (1 app Meta) → kiosk hotel-A → access_token_A
                      → kiosk hotel-B → access_token_B
                      → kiosk dmo-C   → access_token_C
```

Cada token vive en `cfg.integrations.socialOauth.{platform}` del kiosk del dueño. Nunca cruzan al iframe ni a otro kiosk.

**Operativa por cliente nuevo:**
1. Creas el kiosk en `/studio`.
2. Cliente abre Social Wall → Connect Instagram (en sesión de onboarding contigo o vía link compartido).
3. Logueado con su cuenta, el token queda guardado en su kiosk.

---

## Límites de escalado

- **Meta Development Mode:** solo 25 personas pueden conectar (admins/devs/testers añadidos manualmente). Alcanza para 5-10 clientes. Después → App Review.
- **TikTok Sandbox:** mismo límite.
- **X:** sin límite, pero requiere plan Basic ($100/mes) para LEER timeline.

---

## Tres rutas cuando lleguemos a ~5 clientes

### A) App Review de Meta + TikTok (TrueOmni-as-platform)

- One-time. Toma 2-4 semanas con back-and-forth Meta.
- Requisitos: Business Verification, Privacy Policy URL pública, video demostrando el flow, justificación scope-by-scope.
- Después: cualquier cliente conecta sin fricción, sin pagar nada extra.
- **Indicado si TrueOmni se posiciona como plataforma white-label "alquilada".**

### B) CrowdRiff por cliente (SaaS turnkey)

- Cliente paga CrowdRiff ($500-2000/mes) o se cobra como add-on premium.
- CrowdRiff agrega IG/FB/TikTok/X con UN solo API key → lo pones en `Integrations → CrowdRiff`.
- Cero OAuth, cero mantenimiento.
- **Indicado si target son DMOs grandes** (Visit Phoenix, Visit Florida, etc. — muchas ya tienen CrowdRiff).

### C) App propia por cliente

- Descartado. Los clientes no quieren registrar developer accounts.

---

## Decisión actual (2026-05-06)

1. **Primeros 5 clientes:** modelo actual (app TrueOmni, conexión por cliente como Tester). Sin envvars, sin App Review.
2. **5to cliente firmado con Social Wall:** decidir A vs B según perfil del cliente típico:
   - Hotels boutique / kioscos corporativos → ruta **A** (App Review).
   - DMOs grandes / agencias turísticas → ruta **B** (CrowdRiff bundled).
3. **X queda fuera** hasta que un cliente lo pida explícitamente y justifique los $100/mes.

---

## Trigger para revisar esta decisión

Cualquiera de los siguientes:
- Llega el cliente nº 5 con Social Wall activo.
- Meta nos avisa que estamos cerca del límite de 25 testers.
- Cliente DMO grande pide setup turnkey sin OAuth.
- Roadmap incluye "Social Wall as core feature" en algún milestone próximo.

---

**Última revisión:** 2026-05-06 · responsable: Rubén (`ruba.trejo@gmail.com`)
