'use client';

import type { SignageClientResolved } from '@/lib/signage/schema';
import type { SignageHeaderWeather } from '@/lib/signage/weather-adapter';

import { useSignageClock, type SignageClockState } from './use-signage-clock';

/**
 * `<SignageHeader>` — header universal de los Digital Displays.
 *
 * Replica pixel-perfect el group `Display_Info_Header` del SVG
 * `designs/signage/01-full-events.svg` (común a los 8 templates):
 *  - Logo TrueOmni izquierda (paths verbatim del XD)
 *  - Current temp + 3 weather icons + 2 dividers (centro-izquierda)
 *  - 3 forecast cards FRI/SAT/SUN con day label + high/low + divider
 *  - Clock + date derecha
 *
 * Los strings dinámicos (clock, date, day labels, temps) se sustituyen en los
 * `<tspan>` correspondientes. Los paths SVG (logo, icons, dividers) son
 * verbatim del XD.
 *
 * Tokens consumidos: `--signage-header-bg`, `--signage-header-text`.
 *
 * Nota sobre el color `#0088ce` (Path_12, Path_13 del logo): es parte del
 * isotipo de TrueOmni (producto), NO del cliente. Se mantiene hardcoded en
 * el path como brand identity. Cuando el cliente onboardee su propio logo
 * (sub-fase futura), el componente Logo se reemplaza por su SVG.
 */
export interface SignageHeaderProps {
  client: SignageClientResolved;
  weather: SignageHeaderWeather;
  initialClock: SignageClockState;
}

const HEADER_W = 1920;
const HEADER_H = 155;

export function SignageHeader({ client, weather, initialClock }: SignageHeaderProps) {
  const { clockText, dateText } = useSignageClock(
    initialClock,
    client.locale,
    client.timezone,
    client.header.clockFormat,
  );

  // 3 forecast slots fijos (matching SVG). Si forecastDays === 0 las celdas se
  // ocultan; si > 3 se clamp a 3 (el SVG solo tiene espacio para 3).
  const showForecast = client.header.forecastDays !== 0;
  const f0 = weather.forecast[0];
  const f1 = weather.forecast[1];
  const f2 = weather.forecast[2];

  return (
    <svg
      width={HEADER_W}
      height={HEADER_H}
      viewBox={`0 0 ${HEADER_W} ${HEADER_H}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="sig-clip-sun-cloud">
          <rect width="94.11" height="81.219" fill="#fff" />
        </clipPath>
        <clipPath id="sig-clip-logo">
          <rect width="315.668" height="58.341" />
        </clipPath>
      </defs>

      {/* Header_Background */}
      <rect width={HEADER_W} height={HEADER_H} fill="hsl(var(--signage-header-bg))" />

      {/* Display_Time_Info — clock + date right-aligned al edge derecho del SVG.
          El SVG fuente posicionaba en (1693, 29) con anchor start; usamos
          text-anchor="end" en x=1834 para que strings de longitud variable
          (5:50 AM / 11:30 PM / Wed May 7 / Mon Apr 15) queden right-aligned. */}
      <g transform="translate(1834 29)">
        <text
          fill="hsl(var(--signage-header-text))"
          fontSize="40"
          fontFamily="Montserrat-Bold, Montserrat"
          fontWeight="700"
          textAnchor="end"
        >
          <tspan x="0" y="39">
            {clockText}
          </tspan>
        </text>
        <text
          fill="hsl(var(--signage-header-text))"
          fontSize="28"
          fontFamily="Montserrat-Medium, Montserrat"
          fontWeight="500"
          textAnchor="end"
        >
          <tspan x="0" y="83">
            {dateText}
          </tspan>
        </text>
      </g>

      {/* Display_Weather_Info — translate(388, 0) */}
      <g transform="translate(388 0)">
        {/* Current temp text */}
        <text
          transform="translate(201 104)"
          fill="hsl(var(--signage-header-text))"
          fontSize="70"
          fontFamily="OpenSans-Semibold, Open Sans"
          fontWeight="600"
        >
          <tspan x="0" y="0">
            {weather.currentTempText}
          </tspan>
        </text>

        {/* Sun rays icon (path id="icon") at translate(428.5, 37.86) */}
        <path
          d="M37.445,75.281a2.891,2.891,0,0,1-2.88-2.9V66.594a2.88,2.88,0,1,1,5.761,0v5.791A2.891,2.891,0,0,1,37.445,75.281ZM61.887,65.1a2.849,2.849,0,0,1-2.036-.848l-4.075-4.1a2.909,2.909,0,0,1,0-4.094,2.869,2.869,0,0,1,4.073,0l4.074,4.1a2.909,2.909,0,0,1,0,4.094A2.856,2.856,0,0,1,61.887,65.1ZM13,65.1a2.849,2.849,0,0,1-2.036-.848,2.908,2.908,0,0,1,0-4.094l4.074-4.1a2.869,2.869,0,0,1,4.073,0,2.908,2.908,0,0,1,0,4.094l-4.074,4.1A2.851,2.851,0,0,1,13,65.1Zm24.442-7.2A20.268,20.268,0,1,1,57.608,37.64,20.238,20.238,0,0,1,37.445,57.908Zm0-34.745a14.477,14.477,0,1,0,14.4,14.477A14.456,14.456,0,0,0,37.445,23.163ZM72.01,40.536H66.249a2.9,2.9,0,0,1,0-5.791H72.01a2.9,2.9,0,0,1,0,5.791Zm-63.369,0H2.881a2.9,2.9,0,0,1,0-5.791H8.641a2.9,2.9,0,0,1,0,5.791ZM57.812,20.062a2.851,2.851,0,0,1-2.037-.848,2.909,2.909,0,0,1,0-4.094l4.075-4.1a2.869,2.869,0,0,1,4.073,0,2.909,2.909,0,0,1,0,4.094l-4.074,4.1A2.849,2.849,0,0,1,57.812,20.062Zm-40.735,0a2.851,2.851,0,0,1-2.037-.848l-4.074-4.1a2.908,2.908,0,0,1,0-4.094,2.869,2.869,0,0,1,4.073,0l4.074,4.1a2.908,2.908,0,0,1,0,4.094A2.849,2.849,0,0,1,17.078,20.062Zm20.367-8.481a2.891,2.891,0,0,1-2.88-2.9V2.9a2.88,2.88,0,1,1,5.761,0V8.686A2.891,2.891,0,0,1,37.445,11.581Z"
          transform="translate(428.5 37.86)"
          fill="hsl(var(--signage-header-text))"
        />

        {/* Divider 2x113 between current and forecast (translate 518.64, 19) */}
        <rect
          width="2"
          height="113"
          rx="1"
          transform="translate(518.64 19)"
          fill="hsl(var(--signage-header-text))"
        />

        {/* Sun+cloud composite icon (Group_4) at translate(641.25, 36.39) */}
        <g transform="translate(641.25 36.39)">
          <g clipPath="url(#sig-clip-sun-cloud)">
            <path
              d="M132.6,5.6c0-.949.036-1.9-.008-2.846A2.774,2.774,0,0,0,129.751,0a2.725,2.725,0,0,0-2.65,2.83c-.022,1.775-.019,3.55,0,5.325a2.721,2.721,0,0,0,2.684,2.883A2.766,2.766,0,0,0,132.6,8.171c.025-.856,0-1.714,0-2.57M163.75,20.794a2.714,2.714,0,0,0-4.09-2.414c-1.613.872-3.193,1.808-4.768,2.748a2.744,2.744,0,1,0,2.727,4.761c1.608-.881,3.189-1.816,4.768-2.749a2.645,2.645,0,0,0,1.364-2.347"
              transform="translate(-95.891 0)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M0,213.616a4.768,4.768,0,0,1,2.237-2.166c1.268-.669,2.487-1.428,3.735-2.136a2.757,2.757,0,1,1,2.8,4.733c-1.284.767-2.584,1.506-3.878,2.254-2.32,1.342-3.556,1.034-4.894-1.215Z"
              transform="translate(0 -157.578)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M0,75.374c1.313-2.25,2.571-2.565,4.889-1.227,1.269.732,2.543,1.453,3.806,2.2a2.772,2.772,0,1,1-2.8,4.752C4.679,80.4,3.483,79.659,2.243,79A4.846,4.846,0,0,1,0,76.844Z"
              transform="translate(0 -55.348)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M58.686,108.8a23.522,23.522,0,0,1-5.624-5.17c-10.076-12.88-2.523-32.392,13.593-35.1A21.965,21.965,0,0,1,90.347,80.575a1.042,1.042,0,0,0,1.023.668q12.542.775,18.134,12.047a1.193,1.193,0,0,0,1.285.814,19.271,19.271,0,0,1,4.315,38.173,27.607,27.607,0,0,1-4.739.375q-19.151.044-38.3.01a15.429,15.429,0,0,1-15.515-12.743A15.144,15.144,0,0,1,58.686,108.8m33.1,18.35v-.031c6.642,0,13.285.023,19.927-.006a13.76,13.76,0,1,0-2.347-27.365c-2.622.367-3.467-.127-4.214-2.463a15.14,15.14,0,0,0-29.066.705,14.78,14.78,0,0,0-.4,5.729,2.769,2.769,0,0,1-3.027,3.41c-.4-.007-.8-.023-1.194-.016a10.017,10.017,0,0,0,.392,20.028c6.642.04,13.285.009,19.928.009M84.838,81.987c-.155-.269-.286-.543-.458-.787-3.892-5.533-9.19-8.123-15.942-7.342A16.4,16.4,0,0,0,54.47,86.3a16.667,16.667,0,0,0,6.574,17.468c.993.7,1.813,1.018,2.769.054a1.982,1.982,0,0,1,.713-.406c1.789-.67,3.584-1.324,5.452-2.011.72-9.509,5.629-16.063,14.86-19.416"
              transform="translate(-36.599 -51.459)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M132.6,5.6c0,.857.022,1.714,0,2.57a2.766,2.766,0,0,1-2.817,2.868A2.721,2.721,0,0,1,127.1,8.156c-.017-1.775-.02-3.55,0-5.324A2.725,2.725,0,0,1,129.75,0a2.773,2.773,0,0,1,2.843,2.754c.044.947.008,1.9.009,2.846"
              transform="translate(-95.89 0)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M244.82,76.177a2.647,2.647,0,0,1-1.364,2.346c-1.58.933-3.16,1.868-4.768,2.749a2.744,2.744,0,1,1-2.727-4.761c1.575-.94,3.155-1.876,4.768-2.748a2.715,2.715,0,0,1,4.091,2.414"
              transform="translate(-176.96 -55.382)"
              fill="hsl(var(--signage-header-text))"
            />
          </g>
        </g>

        {/* Divider 2x113 between sun+cloud and cloud-only (translate 756, 19) */}
        <rect
          width="2"
          height="113"
          rx="1"
          transform="translate(756 19)"
          fill="hsl(var(--signage-header-text))"
        />

        {/* Cloud-only icon (path id="ic_weather") at translate(878, 56.68) */}
        <path
          d="M58.713,18.3a18.312,18.312,0,0,0-34.732-8.1A9.772,9.772,0,0,0,8.865,17.687a13.453,13.453,0,0,0,4.607,26.1H57.258a12.391,12.391,0,0,0,1.435-24.7C58.707,18.819,58.713,18.56,58.713,18.3Z"
          transform="translate(878 56.68)"
          fill="none"
          stroke="hsl(var(--signage-header-text))"
          strokeMiterlimit="10"
          strokeWidth="5"
        />

        {/* Forecast cards (FRI/SAT/SUN). Hidden si forecastDays === 0. */}
        {showForecast ? (
          <>
            {/* FRI card (Group_1) at translate(-345.5, 41) */}
            <g transform="translate(-345.5 41)">
              <text
                transform="translate(713.75 26)"
                fill="hsl(var(--signage-header-text))"
                fontSize="40"
                fontFamily="Montserrat-Bold, Montserrat"
                fontWeight="700"
              >
                <tspan x="-34.04" y="0">
                  {f0?.dayLabel ?? '---'}
                </tspan>
              </text>
              <text
                transform="translate(670.25 77)"
                fill="hsl(var(--signage-header-text))"
                fontSize="22"
                fontFamily="Montserrat-Bold, Montserrat"
                fontWeight="700"
              >
                <tspan x="0" y="0">
                  {f0?.highText ?? '--°'}
                </tspan>
              </text>
              <text
                transform="translate(722.25 77)"
                fill="hsl(var(--signage-header-text))"
                fontSize="22"
                fontFamily="Montserrat-Light, Montserrat"
                fontWeight="300"
              >
                <tspan x="0" y="0">
                  {f0?.lowText ?? '--°'}
                </tspan>
              </text>
              <rect
                width="2"
                height="90"
                rx="1"
                transform="translate(758.75 39) rotate(90)"
                fill="hsl(var(--signage-header-text))"
              />
            </g>

            {/* SAT card (Group_8) at translate(-195.36, -28) */}
            <g transform="translate(-195.36 -28)">
              <text
                transform="translate(781.36 95)"
                fill="hsl(var(--signage-header-text))"
                fontSize="40"
                fontFamily="Montserrat-Bold, Montserrat"
                fontWeight="700"
              >
                <tspan x="-39.74" y="0">
                  {f1?.dayLabel ?? '---'}
                </tspan>
              </text>
              <text
                transform="translate(737.86 146)"
                fill="hsl(var(--signage-header-text))"
                fontSize="22"
                fontFamily="Montserrat-Bold, Montserrat"
                fontWeight="700"
              >
                <tspan x="0" y="0">
                  {f1?.highText ?? '--°'}
                </tspan>
              </text>
              <text
                transform="translate(789.86 146)"
                fill="hsl(var(--signage-header-text))"
                fontSize="22"
                fontFamily="Montserrat-Light, Montserrat"
                fontWeight="300"
              >
                <tspan x="0" y="0">
                  {f1?.lowText ?? '--°'}
                </tspan>
              </text>
              <rect
                width="2"
                height="90"
                rx="1"
                transform="translate(826.36 108) rotate(90)"
                fill="hsl(var(--signage-header-text))"
              />
            </g>

            {/* SUN card (Group_9) at translate(-66.75, -60.5) */}
            <g transform="translate(-66.75 -60.5)">
              <text
                transform="translate(884.75 127.5)"
                fill="hsl(var(--signage-header-text))"
                fontSize="40"
                fontFamily="Montserrat-Bold, Montserrat"
                fontWeight="700"
              >
                <tspan x="-44.68" y="0">
                  {f2?.dayLabel ?? '---'}
                </tspan>
              </text>
              <g transform="translate(-0.25 -3)">
                <text
                  transform="translate(841 181.5)"
                  fill="hsl(var(--signage-header-text))"
                  fontSize="22"
                  fontFamily="Montserrat-Bold, Montserrat"
                  fontWeight="700"
                >
                  <tspan x="0" y="0">
                    {f2?.highText ?? '--°'}
                  </tspan>
                </text>
                <text
                  transform="translate(893 181.5)"
                  fill="hsl(var(--signage-header-text))"
                  fontSize="22"
                  fontFamily="Montserrat-Light, Montserrat"
                  fontWeight="300"
                >
                  <tspan x="0" y="0">
                    {f2?.lowText ?? '--°'}
                  </tspan>
                </text>
              </g>
              <rect
                width="2"
                height="90"
                rx="1"
                transform="translate(929.75 140.5) rotate(90)"
                fill="hsl(var(--signage-header-text))"
              />
            </g>
          </>
        ) : null}
      </g>

      {/* Group_12 — TrueOmni logo at translate(18, -15.67) */}
      <g transform="translate(18 -15.67)">
        <g transform="translate(32 64)">
          <g clipPath="url(#sig-clip-logo)">
            <path
              d="M209.257,30.981h-11.8V61.61h-7.124V30.981h.069V24.688h18.86Z"
              transform="translate(-103.941 -13.483)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M247.114,51.593a13.748,13.748,0,0,0-5.672,1.224,7.152,7.152,0,0,0-3.584,3.508V72.81H230.89V45.56h6.4v5.825A12.422,12.422,0,0,1,239,48.863a13.2,13.2,0,0,1,2.132-1.949,9.868,9.868,0,0,1,2.314-1.274,6.386,6.386,0,0,1,2.262-.442h.857a2.836,2.836,0,0,1,.545.051Z"
              transform="translate(-126.092 -24.683)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M286.1,73.768a7.735,7.735,0,0,1-6.4-2.7q-2.183-2.7-2.184-8.008V46h6.968V61.549q0,6.293,4.524,6.293a7.156,7.156,0,0,0,3.927-1.222,8.783,8.783,0,0,0,3.094-3.718V46H303V65.239a2.448,2.448,0,0,0,.393,1.56,1.7,1.7,0,0,0,1.274.524v5.928a14.853,14.853,0,0,1-1.742.262c-.468.034-.893.052-1.274.052a5.017,5.017,0,0,1-3.042-.859,3.376,3.376,0,0,1-1.378-2.36l-.156-2.184a11.619,11.619,0,0,1-4.68,4.212,14.079,14.079,0,0,1-6.293,1.4"
              transform="translate(-151.559 -25.121)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M362.336,73.206a15.13,15.13,0,0,1-5.928-1.118A13.372,13.372,0,0,1,349,64.573a14.342,14.342,0,0,1-1.014-5.357,15.172,15.172,0,0,1,.989-5.487,13.385,13.385,0,0,1,2.859-4.524,13.647,13.647,0,0,1,4.551-3.094,15.152,15.152,0,0,1,6.007-1.145,14.775,14.775,0,0,1,5.955,1.145,13.711,13.711,0,0,1,4.472,3.068,13.068,13.068,0,0,1,2.808,4.472,14.91,14.91,0,0,1,.962,5.3q0,.676-.026,1.3a5.344,5.344,0,0,1-.131,1.04H355.366a8.077,8.077,0,0,0,.787,2.859A7,7,0,0,0,360,67.639a7.35,7.35,0,0,0,2.6.468,8.041,8.041,0,0,0,3.933-1.013,5.375,5.375,0,0,0,2.521-2.678l5.981,1.665a12.155,12.155,0,0,1-4.81,5.122,14.91,14.91,0,0,1-7.878,2m7.073-16.432a7.25,7.25,0,0,0-2.261-4.914,7.028,7.028,0,0,0-11.18,2.158,7.5,7.5,0,0,0-.7,2.753Z"
              transform="translate(-190.04 -24.559)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M438.576,61.557a15.265,15.265,0,0,1-7.021-1.611,18.121,18.121,0,0,1-5.461-4.212,18.815,18.815,0,0,1-3.54-5.981,19.82,19.82,0,0,1-1.248-6.916,19.193,19.193,0,0,1,1.33-7.073,19.779,19.779,0,0,1,3.641-5.981,17.418,17.418,0,0,1,5.487-4.134,15.556,15.556,0,0,1,6.865-1.534,15.229,15.229,0,0,1,7.047,1.637,17.7,17.7,0,0,1,5.46,4.29,19.829,19.829,0,0,1,3.51,6.006,19.554,19.554,0,0,1-3.718,19.867,17.617,17.617,0,0,1-5.487,4.107,15.555,15.555,0,0,1-6.865,1.534M423.963,42.835a17.763,17.763,0,0,0,1.066,6.111,16.482,16.482,0,0,0,3.015,5.2,14.842,14.842,0,0,0,4.659,3.616,13.058,13.058,0,0,0,5.928,1.352,12.742,12.742,0,0,0,6.006-1.4,14.662,14.662,0,0,0,4.577-3.718A17.629,17.629,0,0,0,452.1,36.726a16.912,16.912,0,0,0-3.042-5.2,15.053,15.053,0,0,0-4.6-3.613,12.636,12.636,0,0,0-5.825-1.352,12.893,12.893,0,0,0-6.031,1.4,14.858,14.858,0,0,0-4.628,3.718,17.081,17.081,0,0,0-2.964,5.227,17.481,17.481,0,0,0-1.041,5.928"
              transform="translate(-230.086 -13.169)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M551.781,72.941h-2.6V57.864q0-5.147-1.586-7.592a5.393,5.393,0,0,0-4.863-2.444,8.21,8.21,0,0,0-3.173.624,9.609,9.609,0,0,0-2.753,1.742,11.229,11.229,0,0,0-2.158,2.652,13.952,13.952,0,0,0-1.43,3.409V72.941h-2.6V57.864q0-5.2-1.56-7.618a5.348,5.348,0,0,0-4.836-2.419,8.334,8.334,0,0,0-3.147.6,9.272,9.272,0,0,0-2.731,1.716,12.323,12.323,0,0,0-2.21,2.652,12.807,12.807,0,0,0-1.483,3.409V72.941h-2.6V45.9h2.444v6.446a13.167,13.167,0,0,1,4.368-5.1,10.478,10.478,0,0,1,5.981-1.82,7.735,7.735,0,0,1,5.564,2.028,8.553,8.553,0,0,1,2.554,5.306q3.848-7.333,10.609-7.333a6.8,6.8,0,0,1,6.319,3.146,17.121,17.121,0,0,1,1.9,8.815Z"
              transform="translate(-279.64 -24.813)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M639.56,72.936h-2.6V57.859q0-5.251-1.483-7.643a5.128,5.128,0,0,0-4.705-2.393,9.763,9.763,0,0,0-3.409.624,11.525,11.525,0,0,0-3.147,1.769,12.908,12.908,0,0,0-2.549,2.678,11.03,11.03,0,0,0-1.612,3.3V72.936h-2.6V45.895H619.9v6.446a12.707,12.707,0,0,1,2.054-2.834,12.948,12.948,0,0,1,2.753-2.184,13.9,13.9,0,0,1,3.255-1.405,12.729,12.729,0,0,1,3.54-.494q4.419,0,6.24,3.094a17.673,17.673,0,0,1,1.82,8.866Z"
              transform="translate(-337.206 -24.808)"
              fill="hsl(var(--signage-header-text))"
            />
            <rect
              width="2.6"
              height="27.041"
              transform="translate(310.466 21.087)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M56.969,85.458a10.374,10.374,0,0,1-5.192-1.392l-8.146,8.15a21.7,21.7,0,0,0,26.863-.139l-8.128-8.128a10.373,10.373,0,0,1-5.4,1.51"
              transform="translate(-23.828 -45.846)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M57,16.305a21.658,21.658,0,0,0-13.317,4.573l8.149,8.149a10.373,10.373,0,0,1,10.537.122l8.128-8.128a21.67,21.67,0,0,0-13.5-4.712"
              transform="translate(-23.854 -8.904)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M103.9,37.758a21.57,21.57,0,0,0,0-17.155L117.165,0l-16.04,15.888-.033-.046-8.148,8.149a10.383,10.383,0,0,1,.014,10.357h-.014l1.725,1.7,6.44,6.44.026-.035,16.03,15.883Z"
              transform="translate(-50.758)"
              fill="hsl(var(--signage-header-text))"
            />
            <path
              d="M13.261,37.758a21.57,21.57,0,0,1,0-17.155L0,0,16.04,15.888l.033-.046,8.148,8.149a10.383,10.383,0,0,0-.014,10.357h.014l-1.725,1.7-6.44,6.44-.026-.035L0,58.341Z"
              fill="hsl(var(--signage-header-text))"
            />
            {/* Path_12 + Path_13 — 2 puntos cyan #0088ce del isotipo TrueOmni.
                Brand identity del producto, NO del cliente. Hardcoded por diseño. */}
            <path
              d="M175.794,27.554a3.738,3.738,0,1,1-3.738-3.738,3.738,3.738,0,0,1,3.738,3.738"
              transform="translate(-91.922 -13.007)"
              fill="#0088ce"
            />
            <path
              d="M686.49,28.487a3.738,3.738,0,1,1-3.738-3.738,3.738,3.738,0,0,1,3.738,3.738"
              transform="translate(-370.822 -13.519)"
              fill="#0088ce"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}
