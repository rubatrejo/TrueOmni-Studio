'use client';

import type { WeatherData } from '@/lib/weather';

import { WeatherIcon } from './weather-icon';

/**
 * Weather Popup verbatim del SVG designs/Home/Weather Popup.svg.
 *
 * Canvas 684×956 rx=8 blanco.
 *
 * Blue header (path Background rounded-bottom 576×510 trans(55,0) inside popup):
 *   - Cloud icon white grande @ (~110, ~61)
 *   - 50° fontSize 151.667 OpenSans-Bold @ baseline (331, 223.5)
 *   - Line 1 white (75.5, 232.5) width 536
 *   - Date "Friday, December 9, 2025" fontSize 38 OpenSans-Semibold @ (110, 309.5)
 *   - Line 2 white (75.5, 359.5) width 536
 *   - Time "12:00" fontSize 65 + "PM" fontSize 35 @ baseline (227, 469)/(404, 458)
 *
 * Forecast row (Group_4 at (3, 587.5) inside popup):
 *   - 5 days at x = 52, 223, 348, 473, 598
 *   - Día texto fontSize 20 Helvetica-Light #4d4d4d
 *   - Weather icon grey
 *   - "50°" bold + "20°" light fontSize 20
 *   - Separator vertical lines 3×106 at x=148, 273, 398, 523 #4d4d4d
 *
 * OK button (182, 812): 320×71 rx=9 #1796d6 + "OK" fontSize 32 Helvetica-Bold white.
 */
export function WeatherPopup({ data, onClose }: { data: WeatherData; onClose: () => void }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Phoenix',
  });
  const hour12 = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Phoenix',
  });
  const [timeStr, ampm] = hour12.split(' '); // "12:00 PM" → ["12:00","PM"]

  // fixed inset-0 dentro del canvas transform:scale → cubre SOLO el frame del kiosk.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Cerrar pronóstico"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/75 focus:outline-none"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Pronóstico del tiempo"
        className="relative bg-white shadow-2xl"
        style={{ width: '684px', height: '956px', borderRadius: '8px' }}
      >
        {/* Blue header con corner bottom rounded 15px. SVG path:
            M0,0 H576 v495 C… A15 H15 A15 V0 — 576×510 at x=55,y=0 */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: '55px',
            top: '0',
            width: '576px',
            height: '510px',
            backgroundColor: '#004f8b',
            borderBottomLeftRadius: '15px',
            borderBottomRightRadius: '15px',
          }}
        >
          {/* Icono clima dinámico (mismo que el header). Alineado verticalmente
              al centro del 92°: temp height ~152, icon height ~170. */}
          <div className="absolute" style={{ left: '85px', top: '50px' }}>
            <WeatherIcon code={data.weatherCode} size={170} color="#fff" strokeWidth={4} />
          </div>

          {/* Temp grande. fontSize 151.667 OpenSans-Bold white.
              Baseline 223.5 centrado verticalmente con icono (50..220).
              Alineado horizontalmente a la derecha del icono. */}
          <span
            className="absolute font-sans font-bold text-white"
            style={{
              left: '325px',
              top: '75px',
              fontSize: '150px',
              lineHeight: '1',
            }}
          >
            {data.currentTempF}°
          </span>

          {/* Line 1 @ (75.5, 232.5) width 536 white 2px */}
          <div
            className="absolute"
            style={{
              left: '75.5px',
              top: '232.5px',
              width: '536px',
              height: '2px',
              backgroundColor: '#fff',
            }}
          />

          {/* Date "Friday, December 9, 2025" @ (110, 309.5) baseline.
              fontSize 38 OpenSans-Semibold white */}
          <span
            className="absolute font-sans text-white"
            style={{
              left: '110px',
              top: `${309.5 - 38 * 0.82}px`,
              fontSize: '38px',
              fontWeight: 600,
              lineHeight: '1',
            }}
          >
            {dateLabel}
          </span>

          {/* Line 2 @ (75.5, 359.5) */}
          <div
            className="absolute"
            style={{
              left: '75.5px',
              top: '359.5px',
              width: '536px',
              height: '2px',
              backgroundColor: '#fff',
            }}
          />

          {/* Time "12:00" @ baseline (227, 469). fontSize 65 OpenSans-Bold. */}
          <span
            className="absolute font-sans font-bold text-white"
            style={{
              left: '227px',
              top: `${469 - 65 * 0.82}px`,
              fontSize: '65px',
              lineHeight: '1',
            }}
          >
            {timeStr}
          </span>
          {/* "PM" @ (404, 458). fontSize 35 OpenSans-Bold. */}
          <span
            className="absolute font-sans font-bold text-white"
            style={{
              left: '404px',
              top: `${458 - 35 * 0.82}px`,
              fontSize: '35px',
              lineHeight: '1',
            }}
          >
            {ampm}
          </span>
        </div>

        {/* Forecast row (Group_4 at (3, 587.5) inside popup).
            5 days at x=52/223/348/473/598, 4 separators x=148/273/398/523 */}
        <div
          className="absolute"
          style={{ left: '3px', top: '587.5px', width: '678px', height: '150px' }}
        >
          {data.forecast5.slice(0, 5).map((d, i) => {
            // Posiciones verbatim SVG: Group_2 translates (52, 171, 296, 420, 545)
            const dayX = [52, 171, 296, 420, 545][i]!;
            return (
              <div
                key={i}
                className="absolute"
                style={{ left: `${dayX}px`, top: '0', width: '80px' }}
              >
                {/* Day name baseline y=15. fontSize 20 Helvetica-Light */}
                <span
                  className="absolute font-sans"
                  style={{
                    left: '0',
                    top: `${15 - 20 * 0.82}px`,
                    fontSize: '20px',
                    fontWeight: 300,
                    color: '#4d4d4d',
                  }}
                >
                  {d.dayName}
                </span>
                {/* Icono clima dinámico por día, color gris como el SVG */}
                <div className="absolute" style={{ left: '0', top: '41px' }}>
                  <WeatherIcon code={d.weatherCode} size={70} color="#4d4d4d" strokeWidth={3} />
                </div>
                {/* 50° bold + 20° light @ baseline y=153.5 */}
                <div
                  className="absolute flex items-baseline gap-1"
                  style={{ left: '0', top: '130px' }}
                >
                  <span
                    className="font-sans font-bold"
                    style={{ fontSize: '20px', color: '#4d4d4d', lineHeight: '1' }}
                  >
                    {d.highF}°
                  </span>
                  <span
                    className="font-sans"
                    style={{
                      fontSize: '20px',
                      fontWeight: 300,
                      color: '#4d4d4d',
                      lineHeight: '1',
                    }}
                  >
                    {d.lowF}°
                  </span>
                </div>
              </div>
            );
          })}
          {/* Separator verticals 3×106 rx=1.5 at x=148/273/398/523 y=27 */}
          {[148, 273, 398, 523].map((x) => (
            <div
              key={x}
              className="absolute"
              style={{
                left: `${x}px`,
                top: '27px',
                width: '3px',
                height: '106px',
                backgroundColor: '#4d4d4d',
                borderRadius: '1.5px',
              }}
            />
          ))}
        </div>

        {/* OK button (182, 812). 320×71 rx=9 #1796d6 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute flex items-center justify-center font-sans font-bold text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          style={{
            left: '182px',
            top: '812.5px',
            width: '320px',
            height: '71px',
            backgroundColor: '#1796d6',
            borderRadius: '9px',
            fontSize: '32px',
            letterSpacing: '0.02em',
          }}
        >
          OK
        </button>
      </section>
    </div>
  );
}
