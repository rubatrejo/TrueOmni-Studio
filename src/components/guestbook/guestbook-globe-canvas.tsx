'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';

export interface GlobeHandle {
  flyToZip: (coords: { lat: number; lng: number }) => Promise<void>;
  getMap: () => mapboxgl.Map | null;
  resize: () => void;
  setSpinning: (enabled: boolean) => void;
}

/**
 * Mapbox único del módulo Guestbook. Se monta una vez y persiste entre
 * las phases start/form/transition/map.
 *
 * - Phases `start` y `form`: `projection: 'globe'` + `satellite-streets-v12`
 *   + centrado en el world-view (earthStart). Visible en el crop inferior.
 * - Phase `transition`/`map`: después de `flyToZip`, el mapa queda centrado
 *   en la coord del zip con zoom 14 y (a partir de ese momento) usa el
 *   estilo `streets-v12` para el detalle urbano.
 *
 * API imperativa vía ref: `flyToZip({ lat, lng })` — resuelve cuando
 * termina la animación (`moveend`).
 */
export interface GlobeOverlayPin {
  id: string;
  coords: { lat: number; lng: number };
  image: string;
}

export const GuestbookGlobeCanvas = forwardRef<
  GlobeHandle,
  {
    token: string | undefined;
    earthStart?: { center: { lat: number; lng: number }; zoom: number };
    overlayPins?: readonly GlobeOverlayPin[];
    className?: string;
    style?: React.CSSProperties;
  }
>(function GuestbookGlobeCanvas({ token, earthStart, overlayPins, className, style }, ref) {
  const overlayMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onStreetsRef = useRef(false);
  const spinningRef = useRef(true);

  useEffect(() => {
    if (!token || !containerRef.current) return;
    mapboxgl.accessToken = token;

    const center = earthStart?.center ?? { lat: 20, lng: -60 };
    const zoom = earthStart?.zoom ?? 1.6;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [center.lng, center.lat],
      zoom,
      interactive: false,
      attributionControl: false,
    });
    // Padding.bottom sube el centro efectivo del globo dentro del canvas
    // para que el ecuador caiga dentro del crop visible. Valor bajo para
    // dejar el globo algo más abajo (se ve menos polo, pero no tanto que
    // el centro del planeta salga por debajo del viewport).
    map.setPadding({ top: 0, bottom: 100, left: 0, right: 0 });
    // Standard style tiene config properties para ocultar etiquetas.
    // Se aplica tras style.load para garantizar que el basemap está listo.
    map.on('style.load', () => {
      try {
        map.setConfigProperty('basemap', 'showPlaceLabels', false);
        map.setConfigProperty('basemap', 'showRoadLabels', false);
        map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
        map.setConfigProperty('basemap', 'showTransitLabels', false);
      } catch {
        /* estilo sin soporte de config */
      }
    });

    // Rotación continua del globo — efecto Framer/Globe interactivo.
    // Cada 'moveend' añade una pequeña rotación en lng si spinning está on
    // y el zoom es suficientemente out (solo en Start / Form).
    const SECONDS_PER_REVOLUTION = 60;
    const MAX_SPIN_ZOOM = 5;
    const spin = () => {
      if (!spinningRef.current) return;
      if (map.getZoom() > MAX_SPIN_ZOOM) return;
      const c = map.getCenter();
      const distancePerSec = 360 / SECONDS_PER_REVOLUTION;
      c.lng -= distancePerSec;
      map.easeTo({ center: c, duration: 1000, easing: (n) => n });
    };
    map.on('moveend', spin);
    map.on('load', () => spin());
    map.on('style.load', () => {
      try {
        map.setProjection('globe');
        // Fog sin galaxia: space-color match con el fondo claro de la
        // página (para que el planeta se vea flotando sobre blanco) y
        // star-intensity 0 (sin estrellas). Solo mantiene el halo
        // atmosférico azul alrededor del planeta.
        map.setFog({
          color: 'rgb(220, 230, 245)',
          'high-color': 'rgb(180, 210, 240)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(255, 255, 255)',
          'star-intensity': 0,
        });
      } catch {
        /* proyección no soportada en esta versión */
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se usan los campos primitivos (.lat/.lng/.zoom) de earthStart para evitar re-init del globo por nueva referencia del objeto con los mismos valores
  }, [token, earthStart?.center.lat, earthStart?.center.lng, earthStart?.zoom]);

  // Renderea los overlayPins como markers que giran con el globo.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !overlayPins) return;

    for (const m of overlayMarkersRef.current) m.remove();
    overlayMarkersRef.current = [];

    // Refs por pin para actualizar su transform 3D cada frame.
    const pinRefs: {
      el: HTMLElement;
      wrap: HTMLElement;
      img: HTMLImageElement;
      lat: number;
      lng: number;
    }[] = [];

    // 3D real del sprite: cada pin se orienta a la normal de la esfera en
    // su lat/lng. Damping 0.7 evita que pins en el ecuador visual se
    // aplasten totalmente (conservamos legibilidad del PNG).
    const TILT_DAMPING = 0.7;
    // Banda angular (en cosφ) en la que pin hace fade-in/fade-out + scale
    // cuando cruza el horizonte. 0.25 ≈ últimos ~25° antes del terminator.
    const FADE_START = 0.25;
    const updatePinOrientations = () => {
      // Por encima del zoom de globo, ya no hay curvatura — transform neutro.
      if (map.getZoom() > 5) {
        for (const { el, wrap, img } of pinRefs) {
          img.style.transform = '';
          wrap.style.transform = '';
          el.style.opacity = '1';
        }
        return;
      }
      const c = map.getCenter();
      for (const { el, wrap, img, lat, lng } of pinRefs) {
        let dLng = lng - c.lng;
        while (dLng > 180) dLng -= 360;
        while (dLng < -180) dLng += 360;
        const dLat = lat - c.lat;
        const dLatRad = (dLat * Math.PI) / 180;
        const dLngRad = (dLng * Math.PI) / 180;
        // cosφ = coseno del ángulo entre la normal del pin y el eje de
        // cámara. 1 = pin mirando de frente; 0 = pin en el horizonte;
        // <0 = pin detrás del globo.
        const cosPhi = Math.cos(dLatRad) * Math.cos(dLngRad);

        let opacity: number;
        let scale: number;
        if (cosPhi <= 0) {
          // Detrás del globo: invisible, escala mínima (base para la
          // próxima vez que emerja).
          opacity = 0;
          scale = 0.65;
        } else if (cosPhi < FADE_START) {
          // Zona de fade: cerca del horizonte. Interpola opacity y scale
          // suavemente con ease-out.
          const t = cosPhi / FADE_START;
          const ease = t * t * (3 - 2 * t); // smoothstep
          opacity = ease;
          scale = 0.65 + ease * 0.35;
        } else {
          opacity = 1;
          scale = 1;
        }
        el.style.opacity = String(opacity);
        wrap.style.transform = `scale(${scale})`;

        const rotX = -dLat * TILT_DAMPING;
        const rotY = dLng * TILT_DAMPING;
        img.style.transform = `perspective(560px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      }
    };

    void import('mapbox-gl').then((mod) => {
      const Marker = mod.Marker;
      if (!Marker) return;

      const addPins = () => {
        for (const p of overlayPins) {
          const el = document.createElement('div');
          el.style.pointerEvents = 'none';
          el.style.display = 'block';
          el.style.opacity = '0';
          el.style.willChange = 'opacity';
          // El `wrap` anida el pin + su sombra y recibe el `scale()` que
          // anima la aparición/desaparición. El `<img>` interno recibe
          // rotateX/rotateY por frame para el tilt según la normal.
          // `transform-origin: 50% 100%` en el wrap → el escalado pivota
          // en la base del pin (contacto con la superficie), que es
          // también el anchor del Marker de Mapbox.
          el.innerHTML = `
            <div style="position:relative;width:auto;height:140px;transform-style:preserve-3d;transform-origin:50% 100%;pointer-events:none;will-change:transform;">
              <div style="position:absolute;left:50%;bottom:-4px;transform:translateX(-50%) rotateX(75deg);width:76px;height:22px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0) 70%);"></div>
              <img src="${p.image}" alt="" style="position:relative;height:132px;width:auto;display:block;transform-origin:50% 100%;filter:drop-shadow(0 7px 9px rgba(0,0,0,0.4));will-change:transform;" />
            </div>
          `;
          const wrapEl = el.firstElementChild;
          const imgEl = el.querySelector('img');
          if (wrapEl instanceof HTMLElement && imgEl instanceof HTMLImageElement) {
            pinRefs.push({ el, wrap: wrapEl, img: imgEl, lat: p.coords.lat, lng: p.coords.lng });
          }
          const m = new Marker({
            element: el,
            anchor: 'bottom',
            // Deshabilitamos el fade nativo de Mapbox (occludedOpacity) —
            // manejamos opacidad y escala nosotros con cosφ para tener un
            // fade-in/fade-out continuo en la banda del terminator.
            occludedOpacity: 1,
          })
            .setLngLat([p.coords.lng, p.coords.lat])
            .addTo(map);
          overlayMarkersRef.current.push(m);
        }
        updatePinOrientations();
      };

      if (map.isStyleLoaded()) {
        addPins();
      } else {
        map.once('load', addPins);
      }
    });

    // 'render' se dispara en cada frame de animación del mapa. Al estar
    // el globo girando continuamente, esto refresca las orientaciones
    // de todos los pins a 60fps sin coste perceptible (15 pins).
    map.on('render', updatePinOrientations);

    return () => {
      map.off('render', updatePinOrientations);
      for (const m of overlayMarkersRef.current) m.remove();
      overlayMarkersRef.current = [];
    };
  }, [overlayPins]);

  useImperativeHandle(
    ref,
    (): GlobeHandle => ({
      getMap: () => mapRef.current,
      resize: () => mapRef.current?.resize(),
      setSpinning: (enabled) => {
        spinningRef.current = enabled;
      },
      flyToZip: (coords) =>
        new Promise<void>((resolve) => {
          const map = mapRef.current;
          if (!map) {
            resolve();
            return;
          }
          // Stop spinning antes del flyTo para que no compita con la animación.
          spinningRef.current = false;
          const done = () => {
            map.off('moveend', done);
            // Al llegar al zoom de calle, pasar a street-level style para
            // ver calles con nombres.
            if (!onStreetsRef.current) {
              onStreetsRef.current = true;
              map.setStyle('mapbox://styles/mapbox/streets-v12');
            }
            resolve();
          };
          map.once('moveend', done);
          map.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 14,
            curve: 1.6,
            speed: 0.55,
            essential: true,
            // Reset del padding del globo (usado en start/form para subir
            // el ecuador) para que en street-view el zip quede centrado.
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          });
        }),
    }),
    [],
  );

  if (!token) {
    return (
      <div
        role="img"
        aria-label="Globe"
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 50% 50%, hsl(var(--brand-primary)) 0%, #020912 80%)',
          color: '#ffffff',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '14px',
          ...style,
        }}
      >
        Globe unavailable
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Globe"
      className={className}
      style={{
        background: '#ffffff',
        ...style,
      }}
    />
  );
});
