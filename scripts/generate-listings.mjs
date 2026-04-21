#!/usr/bin/env node
/**
 * Genera el bloque `features.home.modules` con 3 módulos × ~30 listings
 * para `clients/default/config.json`. Usa URLs reales de Unsplash
 * (Phoenix-area coords, food/activities/hotels photos).
 *
 * Uso: node scripts/generate-listings.mjs > /tmp/modules.json
 * Después: copiar a mano el objeto al config.json dentro de features.home.
 */

// Coordenadas mock en Phoenix metro area
const PHX_COORDS = [
  { lat: 33.4484, lng: -112.074 }, // Downtown Phoenix
  { lat: 33.4942, lng: -111.9261 }, // Scottsdale
  { lat: 33.4255, lng: -111.94 }, // Tempe
  { lat: 33.4152, lng: -111.8315 }, // Mesa
  { lat: 33.3062, lng: -111.8413 }, // Chandler
  { lat: 33.5387, lng: -112.186 }, // Glendale
  { lat: 33.5806, lng: -112.2374 }, // Peoria
  { lat: 33.3528, lng: -111.7891 }, // Gilbert
  { lat: 33.6054, lng: -111.8226 }, // Paradise Valley
  { lat: 33.7005, lng: -112.1 }, // North Phoenix
];

const CITIES = [
  'Phoenix, AZ',
  'Scottsdale, AZ',
  'Tempe, AZ',
  'Mesa, AZ',
  'Chandler, AZ',
  'Glendale, AZ',
  'Peoria, AZ',
  'Gilbert, AZ',
  'Paradise Valley, AZ',
  'North Phoenix, AZ',
];

/** Ids de fotos estables de Unsplash por categoría. */
const UNSPLASH = {
  restaurants: [
    'N_Y88TWmGwA',
    'MqT0asuoIcU',
    '1SPu0KT-Ejg',
    'eiWoyoWtz6s',
    'IGfIGP5ONV0',
    'Yr4n8O_3UPc',
    'auIbTAcSH6E',
    '08bCYTsVdbg',
    'QyCH5jwrD_A',
    'SqYmTDQYMjo',
    'IqT6bLC-fGA',
    'fdlZBWIP0aM',
    'XoByiBymX20',
    'Orz90t6o0e4',
    'Nqqknk9PaPk',
    'UC0HZdUitWY',
    '4_jhDO54BYg',
    'ZI_Iuoa_SZY',
    'eBkEJ9cH5staff',
    'DRVRTFNL0rs',
    'N-Y88TWmGwB',
    'MqT0asuoIc_',
    '1SPu0KT-Ejh',
    'eiWoyoWtz6_',
    'IGfIGP5ON_0',
    'Yr4n8O_3UP_',
    'auIbTAcSH6_',
    '08bCYTsVdb_',
    'QyCH5jwrD__',
    'SqYmTDQYMj_',
  ],
  'things-to-do': [
    'J4kK8b9Fgj8',
    '7k9jBJNIvj0',
    'yEdkHvW7zjc',
    'NUhzoXT1d6o',
    'XkKCui44iM0',
    'QXevDflbl8A',
    'zs5X1MnnDvw',
    'YpVN6P0r76U',
    'FHnnjk1Yj7Y',
    'fgmQT3qzwZ0',
    '8sSoqy3uEKo',
    'PaTBHEH5v0E',
    '6anudmpILw4',
    'kcA-c3f_3FE',
    'MA5k-v_UmPo',
    'A-NVHPka9Rk',
    'KSdcVBlHovc',
    'WLxQvbMyfas',
    'x98fFBnrIBo',
    'SbaXcbJQjsY',
    'J4kK8b9Fgj9',
    '7k9jBJNIvj_',
    'yEdkHvW7zj_',
    'NUhzoXT1d6_',
    'XkKCui44iM_',
    'QXevDflbl8_',
    'zs5X1MnnDv_',
    'YpVN6P0r76_',
    'FHnnjk1Yj7_',
    'fgmQT3qzwZ_',
  ],
  stay: [
    'mEZ3PoFGs_c',
    'fMrH1iIxr-E',
    '9qpcpiKwIVc',
    '8manzosDSGM',
    'CpsTAUPoScw',
    'pqFxFfBP-Yk',
    'hSX1cZb8_9I',
    'SluA8HL11-g',
    'pVFH3a8V5M4',
    'R6Hl1w0NN_k',
    '6FdR-5875jE',
    'z8dpQZX-DaY',
    'nAOZCYcLND8',
    'QGCmL-ENmVQ',
    'TVllFyGaLEA',
    'qw6qQQyYQpo',
    'zWXvU_F2zmg',
    'CF5V14mboP8',
    'GFuzKWjX9b4',
    'HXkxxlVFm3E',
    'mEZ3PoFGs__',
    'fMrH1iIxr-_',
    '9qpcpiKwIV_',
    '8manzosDSG_',
    'CpsTAUPoSc_',
    'pqFxFfBP-Y_',
    'hSX1cZb8_9_',
    'SluA8HL11-_',
    'pVFH3a8V5M_',
    'R6Hl1w0NN__',
  ],
};

// Nombres temáticos por categoría (rotamos)
const NAMES = {
  restaurants: [
    'El Farolito',
    'Pizzeria Bianco',
    'The Mission',
    'Fry Bread House',
    'Binkley’s',
    'Chino Bandido',
    'Joyride Taco House',
    'Tratto',
    'Ocotillo',
    'Pane Bianco',
    'Lon’s at the Hermosa',
    'Cartwright’s Modern Cuisine',
    'Talavera',
    'Steak 44',
    'FnB',
    'Virtu Honest Craft',
    'Crudo',
    'Café Monarch',
    'Beckett’s Table',
    'Atlas Bistro',
    'Welcome Diner',
    'Café Lalibela',
    'Little Miss BBQ',
    'Matt’s Big Breakfast',
    'Lux Central',
    'Cartel Coffee Lab',
    'Los Olivos',
    'Postino WineCafé',
    'Churn',
    'Gallo Blanco',
  ],
  'things-to-do': [
    'Desert Botanical Garden',
    'Camelback Mountain',
    'Papago Park',
    'Heard Museum',
    'Musical Instrument Museum',
    'Phoenix Art Museum',
    'Tempe Town Lake',
    'OdySea Aquarium',
    'Phoenix Zoo',
    'Taliesin West',
    'Pueblo Grande Museum',
    'Arizona Science Center',
    'Piestewa Peak Trail',
    'South Mountain Park',
    'Butterfly Wonderland',
    'Hole-in-the-Rock',
    'Children’s Museum of Phoenix',
    'Arizona Capitol Museum',
    'Rosson House',
    'Japanese Friendship Garden',
    'Wrigley Mansion',
    'Castles n’ Coasters',
    'Arizona Boardwalk',
    'Ak-Chin Pavilion',
    'McCormick-Stillman Railroad Park',
    'Mystery Castle',
    'Goldfield Ghost Town',
    'Scottsdale Fashion Square',
    'Tovrea Castle',
    'Dolly Steamboat',
  ],
  stay: [
    'Arizona Biltmore',
    'The Phoenician',
    'Royal Palms Resort',
    'Sanctuary Camelback',
    'Four Seasons Scottsdale',
    'Hotel Valley Ho',
    'The Westin Kierland',
    'Boulders Resort',
    'Omni Scottsdale',
    'Hermosa Inn',
    'FireSky Resort',
    'Andaz Scottsdale',
    'Kimpton Palomar',
    'Camby Phoenix',
    'Clarendon Hotel',
    'Renaissance Phoenix Downtown',
    'Found:Re Phoenix',
    'Maricopa Manor',
    'Pointe Hilton Tapatio',
    'Wigwam Resort',
    'Hyatt Regency Scottsdale',
    'Fairmont Scottsdale',
    'Mountain Shadows',
    'L’Auberge de Sedona',
    'Westin Phoenix Downtown',
    'JW Marriott Desert Ridge',
    'Sheraton Grand Phoenix',
    'Tempe Mission Palms',
    'Graduate Tempe',
    'AC Hotel Phoenix Tempe',
  ],
};

const SUBCATS = {
  restaurants: ['Mexican', 'Italian', 'American', 'Cafes', 'Fine Dining', 'Bars', 'Bakery', 'BBQ'],
  'things-to-do': ['Museum', 'Park', 'Hike', 'Attraction', 'Theater', 'Zoo', 'Sports'],
  stay: ['Hotel', 'Resort', 'Boutique', 'B&B', 'Luxury'],
};

const FEATURES = {
  restaurants: [
    'WiFi',
    'Parking',
    'Kid-friendly',
    'Outdoor Seating',
    'Delivery',
    'Takeout',
    'Reservations',
  ],
  'things-to-do': [
    'Wheelchair Access',
    'Parking',
    'Kid-friendly',
    'Guided Tour',
    'Free Entry',
    'Audio Guide',
  ],
  stay: ['WiFi', 'Parking', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Pet-friendly', 'Kid-friendly'],
};

const HERO_IMAGES = {
  restaurants:
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&auto=format&fit=crop&q=80',
  'things-to-do':
    'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1600&auto=format&fit=crop&q=80',
  stay: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1600&auto=format&fit=crop&q=80',
};

const MODULE_LABELS = {
  restaurants: 'Food & Drink',
  'things-to-do': 'Things to Do',
  stay: 'Stay',
};

// Photos reales de Unsplash que existen (usando photo IDs verificados)
const UNSPLASH_PHOTOS = {
  restaurants: [
    'photo-1517248135467-4c7edcad34c4',
    'photo-1555396273-367ea4eb4db5',
    'photo-1559339352-11d035aa65de',
    'photo-1514933651103-005eec06c04b',
    'photo-1565958011703-44f9829ba187',
    'photo-1555939594-58d7cb561ad1',
    'photo-1504674900247-0877df9cc836',
    'photo-1540189549336-e6e99c3679fe',
    'photo-1559847844-5315695dadae',
    'photo-1528605248644-14dd04022da1',
    'photo-1551782450-a2132b4ba21d',
    'photo-1563805042-7684c019e1cb',
    'photo-1586999768265-24af89630739',
    'photo-1568901346375-23c9450c58cd',
    'photo-1580013759032-c96505e24c1f',
    'photo-1544025162-d76694265947',
    'photo-1482049016688-2d3e1b311543',
    'photo-1498837167922-ddd27525d352',
    'photo-1565557623262-b51c2513a641',
    'photo-1513104890138-7c749659a591',
    'photo-1552566626-52f8b828add9',
    'photo-1579027989536-b7b1f875659b',
    'photo-1476224203421-9ac39bcb3327',
    'photo-1481070555726-e2fe8357725c',
    'photo-1504674900247-ec6b0b1b798e',
    'photo-1559740021-3ef70b0a59ae',
    'photo-1520399892884-57f0bb10c0a5',
    'photo-1600891964092-4316c288032e',
    'photo-1550547660-d9450f859349',
    'photo-1574484284002-952d92456975',
  ],
  'things-to-do': [
    'photo-1506905925346-21bda4d32df4',
    'photo-1558642452-9d2a7deb7f62',
    'photo-1469854523086-cc02fe5d8800',
    'photo-1506929562872-bb421503ef21',
    'photo-1508672019048-805c876b67e2',
    'photo-1476514525535-07fb3b4ae5f1',
    'photo-1519681393784-d120267933ba',
    'photo-1483639220020-9c11cd5b7f9e',
    'photo-1509233725247-49e657c54213',
    'photo-1545062372-5dd4b15ae3ef',
    'photo-1527631746610-bca00a040d60',
    'photo-1472214103451-9374bd1c798e',
    'photo-1551632811-561732d1e306',
    'photo-1541872703-74c5e44368f1',
    'photo-1542044896530-05d85be9b11a',
    'photo-1533760881669-80db4d7b341a',
    'photo-1447752875215-b2761acb3c5d',
    'photo-1501785888041-af3ef285b470',
    'photo-1433086966358-54859d0ed716',
    'photo-1520250497591-112f2f40a3f4',
    'photo-1513635269975-59663e0ac1ad',
    'photo-1516251193007-45ef944ab0c6',
    'photo-1502780402662-acc01917aa77',
    'photo-1472851294608-062f824d29cc',
    'photo-1517649763962-0c623066013b',
    'photo-1493246507139-91e8fad9978e',
    'photo-1528543008541-a5ca3de0bb7f',
    'photo-1509316975850-ff9c5deb0cd9',
    'photo-1518391846015-55a9cc003b25',
    'photo-1504280390367-361c6d9f38f4',
  ],
  stay: [
    'photo-1566073771259-6a8506099945',
    'photo-1551882547-ff40c63fe5fa',
    'photo-1564501049412-61c2a3083791',
    'photo-1520250497591-112f2f40a3f4',
    'photo-1582719478250-c89cae4dc85b',
    'photo-1542314831-068cd1dbfeeb',
    'photo-1445019980597-93fa8acb246c',
    'photo-1455587734955-081b22074882',
    'photo-1568495248636-6432b97bd949',
    'photo-1590490360182-c33d57733427',
    'photo-1571003123894-1f0594d2b5d9',
    'photo-1606046604972-77cc76aee944',
    'photo-1578683010236-d716f9a3f461',
    'photo-1520637836862-4d197d17c55a',
    'photo-1551918120-9739cb430c6d',
    'photo-1578898887932-dce23a595ad4',
    'photo-1596436889106-be35e843f974',
    'photo-1578662996442-48f60103fc96',
    'photo-1618773928121-c32242e63f39',
    'photo-1590490350570-3cfe2dc3b38b',
    'photo-1587874522487-4e4f9a5b2716',
    'photo-1591088398332-8a7791972843',
    'photo-1578683010236-d716f9a3f461',
    'photo-1615880484746-a134be9a6ecf',
    'photo-1611892440504-42a792e24d32',
    'photo-1618773928121-c32242e63f39',
    'photo-1581974944026-5d6ed762f617',
    'photo-1590490359683-658d3d23f972',
    'photo-1584132967334-10e028bd69f7',
    'photo-1587985064135-0366536eab42',
  ],
};

function pick(arr, i) {
  return arr[i % arr.length];
}

function makeListing(moduleKey, i) {
  const name = NAMES[moduleKey][i];
  const slug = name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const subcats = SUBCATS[moduleKey];
  const feats = FEATURES[moduleKey];
  const coords = pick(PHX_COORDS, i);
  const city = pick(CITIES, i);
  const photoId = pick(UNSPLASH_PHOTOS[moduleKey], i);
  const subcategory = pick(subcats, i);

  // Features random pero determinísticos
  const featureCount = 2 + (i % 3);
  const features = [];
  for (let k = 0; k < featureCount; k++) features.push(pick(feats, i + k));

  const priceRange = (i % 4) + 1;
  const popularity = 50 + ((i * 17) % 50); // 50-99
  const hasReserve = moduleKey === 'restaurants' && i % 3 === 0;
  const has360 = i % 4 === 0;

  return {
    slug,
    title: name,
    subcategory,
    image: `https://images.unsplash.com/${photoId}?w=800&auto=format&fit=crop&q=80`,
    hours: i % 2 === 0 ? '7 am – 11 pm' : '10 am – 10 pm',
    openHours: {
      mon: [7, 23],
      tue: [7, 23],
      wed: [7, 23],
      thu: [7, 23],
      fri: [7, 24],
      sat: [8, 24],
      sun: [8, 22],
    },
    priceRange,
    features: [...new Set(features)],
    popularity,
    address: `${1000 + i * 37} Main St, ${city} 85001`,
    phone: `(602) 555-${String(1000 + i * 7).slice(0, 4)}`,
    coords,
    website: `https://example.com/${slug}`,
    ...(hasReserve ? { reserveUrl: `https://www.opentable.com/r/${slug}` } : {}),
    ...(has360 ? { threshold360Url: `https://my.threshold360.com/tour/${slug}` } : {}),
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin faucibus, ligula id facilisis interdum, enim odio ullamcorper risus, sit amet tristique ex erat quis mi. Cras ultricies pretium odio, et malesuada.',
    directions: [
      { icon: 'south', distance: '50 ft', instruction: 'Head south toward W Deloney Ave' },
      { icon: 'right', distance: '1.7 mi', instruction: 'Turn right onto W Deloney Ave' },
      {
        icon: 'left',
        distance: '1.7 mi',
        instruction: 'Turn left at the 1st cross street onto N Millward St',
      },
      {
        icon: 'right',
        distance: '350 ft',
        instruction: 'Turn right at the 1st cross street onto US-191 S/US-26 W/US-89 S/W Broadway',
      },
    ],
  };
}

function makeModule(moduleKey) {
  const listings = NAMES[moduleKey].map((_, i) => makeListing(moduleKey, i));
  return {
    label: MODULE_LABELS[moduleKey],
    heroImage: HERO_IMAGES[moduleKey],
    subcategories: SUBCATS[moduleKey],
    features: FEATURES[moduleKey],
    listings,
  };
}

const modules = {
  restaurants: makeModule('restaurants'),
  'things-to-do': makeModule('things-to-do'),
  stay: makeModule('stay'),
};

process.stdout.write(JSON.stringify(modules, null, 2));
