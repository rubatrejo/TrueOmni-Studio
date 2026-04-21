import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

import { AccessibilityIcon, EnglishButton } from './billboard-footer-parts';

/**
 * Billboard 1 — variante "Grid + Clock + Weather".
 *
 * Layout replicado del SVG `designs/TNT/Billboard/Billboard 1.svg`:
 * - Header 1020×310 @ (30, 30) con landscape photo + overlay gradient,
 *   reloj y fecha (izquierda), temperatura + condición + icono weather
 *   (derecha).
 * - Grid izquierdo (x=30, width=495):
 *   · THINGS TO DO 495×410 @ y=374 con foto cityscape.
 *   · EVENTS 495×410 @ y=810 con foto fireworks.
 *   · ITINERARY BUILDER 495×208 @ y=1250 olive #b9bd39 con icono ruta.
 *   · PHOTO BOOTH 495×208 @ y=1488 azul #1796d6.
 * - Card derecha grande 495×1326 @ (555, 370) con valentino street +
 *   "TOUCH TO START" 70px Montserrat-Bold + icono click (paths SVG).
 * - Footer 1080×194 @ y=1726 plano #004f8b con logo TrueOmni.
 *
 * Todos los textos y posiciones son verbatim del SVG (Protocolo
 * pixel-perfect paso 2). Icono click-2384 copiado 1:1 sin lucide.
 */
export function Billboard1() {
  return (
    <div
      data-billboard="1"
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: '#fff' }}
    >
      {/* Header 1020×310 @ (30,30): landscape photo + gradient overlay 0.74
          (linear #015cb7 → #f2f2f2 horizontal) + clock/weather widget.
          Texto posicionado con coords verbatim del SVG. */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: '30px',
          top: '30px',
          width: '1020px',
          height: '310px',
          borderRadius: '9px',
        }}
      >
        <img
          src="/assets/billboard-1/header-bg.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Overlay gradient horizontal verbatim: stops #015cb7 → #f2f2f2, opacity 0.74 */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, #015cb7 0%, #f2f2f2 100%)',
            opacity: 0.74,
          }}
        />

        {/* 10:37 a.m. baseline (80,191) abs → header-relative (50,161). fontSize 80 */}
        <span
          className="absolute font-display font-bold text-white"
          style={{ left: '50px', top: '95px', fontSize: '80px', lineHeight: '1' }}
        >
          10:37 a.m.
        </span>
        {/* Friday, December 10, 2025 baseline (80,250) abs → (50,220). fontSize 30 */}
        <span
          className="absolute font-display font-bold text-white"
          style={{ left: '50px', top: '195px', fontSize: '30px', lineHeight: '1' }}
        >
          Friday, December 10, 2025
        </span>

        {/* Weather widget: icono + 50° + Cloudy, alineado a la derecha */}
        <div className="absolute flex items-center gap-5" style={{ right: '50px', top: '60px' }}>
          <img
            src="/assets/billboard-1/weather-icon.png"
            alt=""
            style={{ width: '140px', height: 'auto' }}
          />
          <div className="flex flex-col items-start">
            <span
              className="font-display font-bold text-white"
              style={{ fontSize: '90px', lineHeight: '1' }}
            >
              50°
            </span>
            <span
              className="font-display font-bold text-white"
              style={{ fontSize: '32px', lineHeight: '1', marginTop: '18px' }}
            >
              Cloudy
            </span>
          </div>
        </div>
      </div>

      {/* THINGS TO DO card (495×410 @ 30, 374) */}
      <div
        className="absolute overflow-hidden"
        style={{ left: '30px', top: '374px', width: '495px', height: '410px', borderRadius: '9px' }}
      >
        <img
          src="/assets/billboard-1/things-to-do.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
        <span
          className="absolute font-display font-bold uppercase text-white"
          style={{ left: '70px', top: '336px', fontSize: '50px', letterSpacing: '0.02em' }}
        >
          Things to do
        </span>
      </div>

      {/* EVENTS card (495×410 @ 30, 810) */}
      <div
        className="absolute overflow-hidden"
        style={{ left: '30px', top: '810px', width: '495px', height: '410px', borderRadius: '9px' }}
      >
        <img
          src="/assets/billboard-1/events.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(17,16,13,0.352)' }} />
        <span
          className="absolute font-display font-bold uppercase text-white"
          style={{ left: '40px', bottom: '40px', fontSize: '50px', letterSpacing: '0.02em' }}
        >
          Events
        </span>
      </div>

      {/* ITINERARY BUILDER card (495×208 @ 30, 1250) olive #b9bd39 */}
      <div
        className="absolute flex items-center overflow-hidden"
        style={{
          left: '30px',
          top: '1250px',
          width: '495px',
          height: '208px',
          borderRadius: '9px',
          backgroundColor: '#b9bd39',
          paddingLeft: '36px',
          paddingRight: '36px',
        }}
      >
        <div
          className="font-display font-bold uppercase leading-[1.05] text-white"
          style={{ fontSize: '50px' }}
        >
          Itinerary
          <br />
          Builder
        </div>
        {/* Route icon — paths verbatim de designs/TNT/Billboard/Itinery-Icon.svg */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="120"
          height="120"
          viewBox="0 0 101.998 102.58"
          fill="#fff"
          className="ml-auto"
          role="img"
          aria-label="Ruta"
        >
          <g transform="translate(-1.377)">
            <path
              d="M136.294,71.716H101.052a5.914,5.914,0,0,1,0-11.828h29.012a9.517,9.517,0,1,0,12.145-12.145V0H109.857V27.761h26.007V47.744a9.563,9.563,0,0,0-5.8,5.8H101.052a12.259,12.259,0,0,0,0,24.519h35.242a5.914,5.914,0,0,1,0,11.828H77.165a9.518,9.518,0,1,0,0,6.345h59.129a12.259,12.259,0,0,0,0-24.519ZM116.2,21.416V6.345h19.662V21.416Zm22.834,32.127a3.173,3.173,0,1,1-3.173,3.173A3.176,3.176,0,0,1,139.036,53.543ZM68.193,96.235a3.173,3.173,0,1,1,3.173-3.173A3.176,3.176,0,0,1,68.193,96.235Z"
              transform="translate(-45.179)"
            />
            <path
              d="M83.481,161.9a7.4,7.4,0,1,0-7.4,7.4A7.411,7.411,0,0,0,83.481,161.9Z"
              transform="translate(-53.064 -121.821)"
            />
            <path
              d="M39.99,122.237a21.4,21.4,0,0,0,4.66-13.4,21.637,21.637,0,1,0-43.273,0,21.407,21.407,0,0,0,4.666,13.409l16.971,21.337Zm-32.268-13.4a15.292,15.292,0,0,1,30.583,0,15.111,15.111,0,0,1-3.286,9.459L23.014,133.388l-12-15.087A15.116,15.116,0,0,1,7.722,108.836Z"
              transform="translate(0 -68.756)"
            />
          </g>
        </svg>
      </div>

      {/* PHOTO BOOTH card (495×208 @ 30, 1488) blue #1796d6 */}
      <div
        className="absolute flex items-center overflow-hidden"
        style={{
          left: '30px',
          top: '1488px',
          width: '495px',
          height: '208px',
          borderRadius: '9px',
          backgroundColor: '#1796d6',
          paddingLeft: '36px',
          paddingRight: '36px',
        }}
      >
        {/* Camera icon — verbatim de designs/TNT/Billboard/Photo_Booth-Icon.svg */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="120"
          height="114"
          viewBox="0 0 110.382 104.639"
          fill="none"
          stroke="#fff"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="img"
          aria-label="Cámara"
        >
          <path
            d="M3,43.2H8.743c5.352,0,8.028,0,10.139.874A11.488,11.488,0,0,1,25.1,50.3c.874,2.111.874,4.787.874,10.139s0,8.028-.874,10.139a11.488,11.488,0,0,1-6.217,6.217c-2.111.874-4.787.874-10.139.874H3M94.9,20.23V14.487A11.487,11.487,0,0,0,83.408,3H71.921A11.487,11.487,0,0,0,60.435,14.487V20.23M21.379,100.639H88c6.433,0,9.65,0,12.107-1.252a11.485,11.485,0,0,0,5.02-5.02c1.252-2.457,1.252-5.674,1.252-12.107V38.609c0-6.433,0-9.65-1.252-12.107a11.485,11.485,0,0,0-5.02-5.02C97.653,20.23,94.436,20.23,88,20.23H21.379c-6.433,0-9.65,0-12.107,1.252a11.486,11.486,0,0,0-5.02,5.02C3,28.959,3,32.176,3,38.609V82.26c0,6.433,0,9.65,1.252,12.107a11.485,11.485,0,0,0,5.02,5.02C11.729,100.639,14.946,100.639,21.379,100.639Zm62.029-40.2A17.23,17.23,0,1,1,66.178,43.2,17.23,17.23,0,0,1,83.408,60.435Z"
            transform="translate(0.5 0.5)"
          />
        </svg>
        <div
          className="ml-auto font-display font-bold uppercase leading-[1.05] text-white"
          style={{ fontSize: '50px' }}
        >
          Photo
          <br />
          Booth
        </div>
      </div>

      {/* Right big card (valentino hero + TOUCH TO START + click icon) @ (555, 370) */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: '555px',
          top: '370px',
          width: '495px',
          height: '1326px',
          borderRadius: '9px',
        }}
      >
        <img
          src="/assets/billboard-1/hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(17,16,13,0.352)' }} />
        {/* TOUCH TO START text @ (804, 898) absolute → relative to card (804-555, 898-370) = (249, 528) */}
        <div
          className="absolute text-center font-display font-bold uppercase leading-[1.2] text-white"
          style={{ left: '0', right: '0', top: '500px', fontSize: '70px' }}
        >
          Touch
          <br />
          to Start
        </div>
        {/* Click icon (hand with radiating lines) @ (684.773, 1205) absolute → (129, 835) relative */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100"
          height="150"
          viewBox="50 50 170 180"
          fill="#fff"
          className="absolute"
          style={{ left: '200px', top: '750px' }}
          role="img"
          aria-label="Toca aquí"
        >
          <path
            d="M166.764,106.407H165.8a14.166,14.166,0,0,0-5.947,1.3,14.285,14.285,0,0,0-13.939-11.243h-.965a14.175,14.175,0,0,0-6.733,1.692,14.279,14.279,0,0,0-13.151-8.749H124.1a14.159,14.159,0,0,0-5.624,1.157V70.154A14.273,14.273,0,0,0,104.219,55.9h-.965A14.274,14.274,0,0,0,89,70.154V122.51l-6.485,4.922A23.762,23.762,0,0,0,78.4,161.3l20.238,25.02v9.944a10.939,10.939,0,0,0,10.924,10.926h50.521a10.939,10.939,0,0,0,10.926-10.926l0-9.441a45.947,45.947,0,0,0,10.011-28.576V120.665A14.28,14.28,0,0,0,166.764,106.407Zm5.626,51.84a37.32,37.32,0,0,1-8.975,24.221,4.3,4.3,0,0,0-1.036,2.805v10.993a2.3,2.3,0,0,1-2.294,2.294H109.566a2.3,2.3,0,0,1-2.292-2.294V184.794a4.316,4.316,0,0,0-.96-2.715l-21.2-26.207a15.131,15.131,0,0,1,2.616-21.567L89,133.347v11.858a4.316,4.316,0,0,0,8.632,0V70.152a5.631,5.631,0,0,1,5.626-5.626h.965a5.632,5.632,0,0,1,5.626,5.626V103.67l.022,27.875a4.315,4.315,0,0,0,4.316,4.312h0a4.315,4.315,0,0,0,4.312-4.32l-.019-27.871A5.63,5.63,0,0,1,124.1,98.04h.965a5.632,5.632,0,0,1,5.626,5.626v7.061l.019,20.818a4.315,4.315,0,0,0,4.316,4.312h0a4.316,4.316,0,0,0,4.312-4.32l-.019-20.816a5.63,5.63,0,0,1,5.624-5.626h.965a5.632,5.632,0,0,1,5.626,5.626v8.822c-.013.142-.043.281-.043.425l.022,11.58a4.314,4.314,0,0,0,4.316,4.307h.009a4.316,4.316,0,0,0,4.307-4.325l-.019-10.471c.013-.134.041-.261.041-.4a5.632,5.632,0,0,1,5.626-5.626h.962a5.632,5.632,0,0,1,5.626,5.626v37.584Z"
            transform="translate(-7.851 -12.969)"
          />
          <path
            d="M170.562,69.078H144.226a4.316,4.316,0,1,1,0-8.632h26.336a4.316,4.316,0,0,1,0,8.632Z"
            transform="translate(-23.35 -14.025)"
          />
          <path
            d="M111.054,34.968a4.318,4.318,0,0,1-4.316-4.316V4.316a4.316,4.316,0,1,1,8.632,0V30.652A4.315,4.315,0,0,1,111.054,34.968Z"
            transform="translate(-15.653)"
          />
          <path
            d="M135.144,43.585a4.316,4.316,0,0,1-3.051-7.367L150.716,17.6a4.315,4.315,0,0,1,6.1,6.1L138.2,42.321A4.3,4.3,0,0,1,135.144,43.585Z"
            transform="translate(-21.243 -3.79)"
          />
          <path
            d="M69.928,69.078H43.591a4.316,4.316,0,0,1,0-8.632H69.928a4.316,4.316,0,1,1,0,8.632Z"
            transform="translate(0 -14.025)"
          />
          <path
            d="M81.341,43.585a4.3,4.3,0,0,1-3.051-1.265L59.668,23.7a4.315,4.315,0,0,1,6.1-6.1L84.392,36.218a4.316,4.316,0,0,1-3.051,7.367Z"
            transform="translate(-4.438 -3.79)"
          />
        </svg>
      </div>

      {/* Footer 1080×194 @ y=1726 plano #004f8b: logo + accesibilidad + ENGLISH */}
      <div
        className="absolute left-0 right-0 flex items-center justify-between"
        style={{
          bottom: '0',
          height: '194px',
          backgroundColor: '#004f8b',
          paddingLeft: '59px',
          paddingRight: '59px',
        }}
      >
        <TrueOmniLogo className="h-[65px] w-auto text-white" />
        <AccessibilityIcon size={80} color="#fff" />
        <EnglishButton width={244} height={80} fontSize={26} />
      </div>
    </div>
  );
}
