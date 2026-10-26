// Generates HiddenSpot seed JSON in ../data. Deterministic: same output every run.
// Usage: npm run seed:generate (from the repository root).
//
// Real places use only well-established facts (name, district, state, kind of place).
// Coordinates come from verified-coordinates.json: values accepted only when Wikipedia and
// OpenStreetMap agree. Addresses, hours and fees stay null until verified.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] ?? join(here, '..', 'data');
const verified = JSON.parse(readFileSync(join(here, 'verified-coordinates.json'), 'utf8'));
const write = (name, data) => writeFileSync(join(out, name), JSON.stringify(data, null, 2) + '\n');

/* ---------------- Categories ---------------- */

const categories = [
  {
    id: 'waterfalls',
    name: 'Waterfalls',
    icon: 'droplets',
    description: 'Cascades and plunge pools, at their fullest after the rains.',
  },
  {
    id: 'beaches',
    name: 'Beaches',
    icon: 'umbrella',
    description: 'Quiet shorelines, cliffs and estuaries along the coast.',
  },
  {
    id: 'hill-viewpoints',
    name: 'Hill Viewpoints',
    icon: 'mountain',
    description: 'Ridges, peaks and lookouts above the clouds.',
  },
  {
    id: 'forests-lakes',
    name: 'Forests and Lakes',
    icon: 'trees',
    description: 'Protected forests, still lakes and backwater edges.',
  },
  {
    id: 'temples-churches',
    name: 'Temples and Churches',
    icon: 'landmark',
    description: 'Historic places of worship. Visit respectfully.',
  },
  {
    id: 'peaceful',
    name: 'Peaceful Places',
    icon: 'leaf',
    description: 'Slow, quiet spots to rest and recharge.',
  },
  {
    id: 'photoshoot',
    name: 'Photoshoot Spots',
    icon: 'camera',
    description: 'Locations with strong light, views or texture.',
  },
  {
    id: 'hidden-gems',
    name: 'Other Hidden Gems',
    icon: 'compass',
    description: 'Lesser-known places that do not fit one box.',
  },
].map((c, i) => ({ ...c, slug: c.id, sortOrder: i + 1 }));

/* ---------------- Demo users ---------------- */

const avatar = (seed) => `https://picsum.photos/seed/hs-user-${seed}/96/96`;
const users = [
  {
    id: 'usr-hiddenspot-team',
    displayName: 'HiddenSpot Team',
    role: 'curator',
    avatarUrl: null,
    homeDistrict: null,
    joinedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr-moderator',
    displayName: 'Demo Moderator',
    role: 'moderator',
    avatarUrl: null,
    homeDistrict: 'Ernakulam',
    joinedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr-anu',
    displayName: 'Anu Thomas',
    role: 'explorer',
    avatarUrl: avatar('anu'),
    homeDistrict: 'Kottayam',
    joinedAt: '2026-02-03T09:00:00.000Z',
  },
  {
    id: 'usr-rahul',
    displayName: 'Rahul Menon',
    role: 'explorer',
    avatarUrl: null,
    homeDistrict: 'Thrissur',
    joinedAt: '2026-02-11T09:00:00.000Z',
  },
  {
    id: 'usr-fathima',
    displayName: 'Fathima Rahman',
    role: 'explorer',
    avatarUrl: avatar('fathima'),
    homeDistrict: 'Kozhikode',
    joinedAt: '2026-03-02T09:00:00.000Z',
  },
  {
    id: 'usr-arjun',
    displayName: 'Arjun Nair',
    role: 'explorer',
    avatarUrl: null,
    homeDistrict: 'Wayanad',
    joinedAt: '2026-03-18T09:00:00.000Z',
  },
  {
    id: 'usr-meera',
    displayName: 'Meera Pillai',
    role: 'explorer',
    avatarUrl: avatar('meera'),
    homeDistrict: 'Thiruvananthapuram',
    joinedAt: '2026-04-07T09:00:00.000Z',
  },
  {
    id: 'usr-joseph',
    displayName: 'Joseph Varghese',
    role: 'explorer',
    avatarUrl: null,
    homeDistrict: 'Idukki',
    joinedAt: '2026-04-21T09:00:00.000Z',
  },
  {
    id: 'usr-lakshmi',
    displayName: 'Lakshmi Iyer',
    role: 'explorer',
    avatarUrl: avatar('lakshmi'),
    homeDistrict: 'Palakkad',
    joinedAt: '2026-05-09T09:00:00.000Z',
  },
].map((u) => ({ ...u, isDemo: true }));

/* ---------------- Category guidance (general, not place-specific facts) ---------------- */

const BEST_TIME = {
  waterfalls:
    'Generally fullest during and just after the monsoon. Check local advisories before visiting in heavy rain.',
  beaches: 'Generally most pleasant outside the main monsoon months, when the sea is calmer.',
  'hill-viewpoints': 'Clear views are more likely on dry days and early mornings.',
  'forests-lakes':
    'Cooler months are generally more comfortable. Some protected areas restrict entry seasonally.',
  peaceful: 'Early mornings and weekdays are usually quietest.',
  photoshoot: 'Early morning and late afternoon usually give the softest light.',
};

const SAFETY = {
  waterfalls: [
    'Rocks near water are slippery. Stay behind barriers and follow posted guidance.',
    'Do not swim where it is prohibited. Water levels can rise quickly after rain.',
  ],
  beaches: [
    'Swim only where it is permitted and follow lifeguard flags if present.',
    'Currents can be strong during the monsoon.',
  ],
  'hill-viewpoints': [
    'Keep away from unfenced edges, especially in mist.',
    'Weather can change quickly at height. Carry rain protection.',
  ],
  'forests-lakes': [
    'Stay on marked trails and follow forest department rules.',
    'Do not feed or approach wildlife.',
  ],
  'temples-churches': ['Follow dress codes and photography rules posted at the entrance.'],
  peaceful: ['Carry water and keep noise low for other visitors.'],
  photoshoot: ['Respect private property and ask before photographing people.'],
  'hidden-gems': ['Tell someone where you are going. Mobile signal may be weak.'],
};

const img = (slug, n) =>
  Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/hs-${slug}-${i + 1}/1200/900`);

/* ---------------- Places ---------------- */
// [slug, name, district, categoryIds, shortDescription, description|null, tags, imageCount, synthetic, createdBy]
const RAW = [
  [
    'athirappilly-falls',
    'Athirappilly Falls',
    'Thrissur',
    ['waterfalls', 'photoshoot'],
    'One of the best-known waterfalls in Kerala, on the Chalakudy River.',
    'A wide waterfall framed by forest on the Chalakudy River. It is one of the most visited waterfalls in the state, so weekday mornings are calmer.',
    ['river', 'forest', 'monsoon'],
    3,
  ],
  [
    'vazhachal-falls',
    'Vazhachal Falls',
    'Thrissur',
    ['waterfalls', 'forests-lakes'],
    'A gentler cascade on the Chalakudy River, surrounded by forest.',
    'A broad, stepped cascade in a forested stretch of the Chalakudy River, often visited together with Athirappilly.',
    ['river', 'forest'],
    2,
  ],
  [
    'meenmutty-falls',
    'Meenmutty Falls',
    'Wayanad',
    ['waterfalls', 'hidden-gems'],
    'A tiered waterfall in Wayanad reached by a forest walk.',
    null,
    ['trek', 'forest'],
    2,
  ],
  [
    'soochipara-falls',
    'Soochipara Falls',
    'Wayanad',
    ['waterfalls'],
    'A tall waterfall in Wayanad set in tea and forest country.',
    'Also known as Sentinel Rock Waterfalls. The approach passes through tea estates and forest.',
    ['tea', 'forest'],
    2,
  ],
  [
    'thommankuthu-falls',
    'Thommankuthu Falls',
    'Idukki',
    ['waterfalls', 'forests-lakes'],
    'A series of small falls and pools along a forest trail.',
    null,
    ['trail', 'pools'],
    2,
  ],
  [
    'palaruvi-falls',
    'Palaruvi Falls',
    'Kollam',
    ['waterfalls'],
    'A waterfall whose name is often translated as "stream of milk".',
    'A tall, narrow waterfall in the forests of eastern Kollam, near the Tamil Nadu border.',
    ['forest', 'monsoon'],
    1,
  ],
  [
    'attukad-waterfalls',
    'Attukad Waterfalls',
    'Idukki',
    ['waterfalls', 'peaceful'],
    'A quieter waterfall in the hills near Munnar.',
    null,
    ['munnar', 'hills'],
    2,
  ],
  [
    'varkala-beach',
    'Varkala Beach',
    'Thiruvananthapuram',
    ['beaches', 'photoshoot'],
    'A beach below dramatic red laterite cliffs.',
    'Known for the cliffs that rise straight above the sand, with a walkway along the top. Sunset views from the cliff are popular.',
    ['cliffs', 'sunset'],
    3,
  ],
  [
    'marari-beach',
    'Marari Beach',
    'Alappuzha',
    ['beaches', 'peaceful'],
    'A calm, palm-lined beach near a fishing village.',
    'A relaxed stretch of coast north of Alappuzha town, quieter than the larger resort beaches.',
    ['palms', 'village'],
    2,
  ],
  [
    'kappad-beach',
    'Kappad Beach',
    'Kozhikode',
    ['beaches'],
    'A rocky-edged beach associated with the arrival of Vasco da Gama in 1498.',
    null,
    ['history', 'rocks'],
    2,
  ],
  [
    'muzhappilangad-beach',
    'Muzhappilangad Drive-in Beach',
    'Kannur',
    ['beaches', 'photoshoot'],
    'A long, firm-sand beach known for allowing driving along the shore.',
    'A long beach with firm sand. Driving rules and access can change, so follow the signs on site.',
    ['drive-in', 'long beach'],
    2,
  ],
  [
    'cherai-beach',
    'Cherai Beach',
    'Ernakulam',
    ['beaches', 'peaceful'],
    'A beach on Vypin island with backwaters close by.',
    null,
    ['backwaters', 'island'],
    2,
  ],
  [
    'bekal-fort-beach',
    'Bekal Fort and Beach',
    'Kasaragod',
    ['beaches', 'photoshoot'],
    'A large seaside fort beside a sandy beach in northern Kerala.',
    'A historic keyhole-shaped fort overlooking the sea, with a beach park next to it.',
    ['fort', 'history', 'sea'],
    3,
  ],
  [
    'ponmudi-hills',
    'Ponmudi Hills',
    'Thiruvananthapuram',
    ['hill-viewpoints'],
    'A hill station reached by a road of many hairpin bends.',
    'Rolling hills and tea slopes within reach of the capital. Mist is common, and views depend on the weather.',
    ['hairpin road', 'mist'],
    2,
  ],
  [
    'vagamon-meadows',
    'Vagamon Meadows',
    'Idukki',
    ['hill-viewpoints', 'photoshoot'],
    'Open grassy hills, pine plantations and wide views.',
    'Rolling meadows and a pine plantation make Vagamon a favourite for walks and photography.',
    ['meadows', 'pine'],
    3,
  ],
  [
    'kolukkumalai',
    'Kolukkumalai',
    'Idukki',
    ['hill-viewpoints', 'photoshoot'],
    'High tea estate country above Munnar, popular for sunrise.',
    null,
    ['sunrise', 'tea'],
    2,
  ],
  [
    'ramakkalmedu',
    'Ramakkalmedu',
    'Idukki',
    ['hill-viewpoints'],
    'A windy hilltop viewpoint looking out towards Tamil Nadu.',
    null,
    ['wind', 'viewpoint'],
    2,
  ],
  [
    'paithalmala',
    'Paithalmala',
    'Kannur',
    ['hill-viewpoints', 'hidden-gems'],
    'A forested hill in Kannur reached on foot.',
    'A trek through forest leads to open grassland on top, with views over the Western Ghats.',
    ['trek', 'grassland'],
    2,
  ],
  [
    'chembra-peak',
    'Chembra Peak',
    'Wayanad',
    ['hill-viewpoints', 'forests-lakes'],
    'A peak in Wayanad known for a heart-shaped lake on the way up.',
    'Trekking access is regulated by the forest department and can close at times. Check before planning.',
    ['trek', 'lake'],
    2,
  ],
  [
    'illikkal-kallu',
    'Illikkal Kallu',
    'Kottayam',
    ['hill-viewpoints', 'hidden-gems'],
    'A rocky hilltop with sweeping views in eastern Kottayam.',
    null,
    ['rock', 'viewpoint'],
    2,
  ],
  [
    'pookode-lake',
    'Pookode Lake',
    'Wayanad',
    ['forests-lakes', 'peaceful'],
    'A small natural lake surrounded by forest.',
    null,
    ['lake', 'boating'],
    2,
  ],
  [
    'silent-valley-national-park',
    'Silent Valley National Park',
    'Palakkad',
    ['forests-lakes'],
    'A protected rainforest with controlled visitor access.',
    'One of the best-known protected forests in the Western Ghats. Entry is managed by the forest department.',
    ['rainforest', 'protected area'],
    2,
  ],
  [
    'thenmala',
    'Thenmala',
    'Kollam',
    ['forests-lakes'],
    'A forested area in eastern Kollam with eco-tourism trails.',
    null,
    ['eco-tourism', 'forest'],
    2,
  ],
  [
    'sasthamkotta-lake',
    'Sasthamkotta Lake',
    'Kollam',
    ['forests-lakes', 'peaceful'],
    'A large freshwater lake in Kollam.',
    'Often described as the largest freshwater lake in Kerala. A calm place for an unhurried walk.',
    ['freshwater', 'lake'],
    1,
  ],
  [
    'gavi',
    'Gavi',
    'Pathanamthitta',
    ['forests-lakes', 'hidden-gems'],
    'Forest and reservoir country with regulated entry.',
    'A remote forest area with reservoirs. Entry is regulated and may require advance permission.',
    ['forest', 'reservoir'],
    2,
  ],
  [
    'thattekad-bird-sanctuary',
    'Thattekad Bird Sanctuary',
    'Ernakulam',
    ['forests-lakes'],
    'A sanctuary known among birdwatchers.',
    null,
    ['birds', 'sanctuary'],
    2,
  ],
  [
    'thirunelli-temple',
    'Thirunelli Temple',
    'Wayanad',
    ['temples-churches', 'peaceful'],
    'An ancient temple in a forested valley in Wayanad.',
    'An ancient temple surrounded by hills and forest. Visitors should follow temple customs.',
    ['temple', 'valley'],
    2,
  ],
  [
    'sree-padmanabhaswamy-temple',
    'Sree Padmanabhaswamy Temple',
    'Thiruvananthapuram',
    ['temples-churches'],
    'A major temple in the heart of Thiruvananthapuram.',
    'A famous temple with a strict dress code for visitors. Check the current entry rules before you go.',
    ['temple', 'heritage'],
    2,
  ],
  [
    'st-francis-church',
    'St. Francis Church',
    'Ernakulam',
    ['temples-churches', 'photoshoot'],
    'One of the oldest European-built churches in India, in Fort Kochi.',
    null,
    ['church', 'fort kochi', 'heritage'],
    2,
  ],
  [
    'santa-cruz-cathedral-basilica',
    'Santa Cruz Cathedral Basilica',
    'Ernakulam',
    ['temples-churches', 'photoshoot'],
    'A cathedral basilica in Fort Kochi with a colourful interior.',
    null,
    ['church', 'fort kochi'],
    2,
  ],
  [
    'ettumanoor-mahadeva-temple',
    'Ettumanoor Mahadeva Temple',
    'Kottayam',
    ['temples-churches'],
    'A historic Shiva temple in Kottayam known for its murals.',
    null,
    ['temple', 'murals'],
    1,
  ],
  [
    'kumarakom-backwaters',
    'Kumarakom Backwaters',
    'Kottayam',
    ['peaceful', 'forests-lakes'],
    'Backwaters on the shore of Vembanad Lake.',
    'Canals, paddy fields and the wide Vembanad Lake. Quieter on weekdays.',
    ['backwaters', 'vembanad'],
    3,
  ],
  [
    'poovar-estuary',
    'Poovar Estuary',
    'Thiruvananthapuram',
    ['peaceful', 'beaches'],
    'Where a river meets the sea near the southern tip of Kerala.',
    null,
    ['estuary', 'boat'],
    2,
  ],
  [
    'valiyaparamba-backwaters',
    'Valiyaparamba Backwaters',
    'Kasaragod',
    ['peaceful', 'hidden-gems'],
    'Quiet backwaters and islands in northern Kerala.',
    null,
    ['backwaters', 'islands'],
    2,
  ],
  [
    'munroe-island',
    'Munroe Island',
    'Kollam',
    ['peaceful', 'hidden-gems'],
    'A cluster of small islands with narrow canals for canoe trips.',
    'Canoe rides along narrow canals give a close look at village life.',
    ['canals', 'canoe'],
    2,
  ],
  [
    'fort-kochi-chinese-fishing-nets',
    'Chinese Fishing Nets, Fort Kochi',
    'Ernakulam',
    ['photoshoot'],
    'Large shore-operated fishing nets along the Fort Kochi waterfront.',
    null,
    ['waterfront', 'sunset'],
    3,
  ],
  [
    'jatayu-earths-center',
    "Jatayu Earth's Center",
    'Kollam',
    ['photoshoot', 'hill-viewpoints'],
    'A hilltop park with a very large bird sculpture.',
    null,
    ['sculpture', 'hilltop'],
    2,
  ],
  [
    'edakkal-caves',
    'Edakkal Caves',
    'Wayanad',
    ['hidden-gems', 'hill-viewpoints'],
    'Natural rock shelters with ancient petroglyphs.',
    'The climb includes steep steps. Access hours and visitor limits are set by the authorities.',
    ['petroglyphs', 'history'],
    2,
  ],
  // Synthetic demo entries: fictional, clearly labelled.
  [
    'demo-kaattuchola-stream',
    'Kaattuchola Stream (demo)',
    'Idukki',
    ['waterfalls', 'hidden-gems'],
    'A fictional forest stream used to test places without photos or a full description.',
    null,
    ['demo'],
    0,
    true,
  ],
  [
    'demo-sunset-ridge',
    'Sunset Ridge Viewpoint (demo)',
    'Wayanad',
    ['hill-viewpoints'],
    'A fictional viewpoint created from an approved demo submission.',
    'This place does not exist. It shows how an approved user submission appears in the app.',
    ['demo', 'submission'],
    1,
    true,
    'usr-arjun',
  ],
  [
    'demo-quiet-shore-cove',
    'Quiet Shore Cove (demo)',
    'Kasaragod',
    ['beaches', 'peaceful'],
    'A fictional cove used for demo reviews and saving.',
    null,
    ['demo'],
    1,
    true,
  ],
];

const POPULARITY = [
  980, 410, 260, 300, 150, 220, 120, 870, 340, 190, 280, 330, 450, 390, 760, 520, 210, 170, 480,
  140, 310, 260, 180, 130, 240, 200, 290, 690, 640, 380, 160, 600, 230, 110, 270, 580, 470, 350, 12,
  25, 8,
];

const places = RAW.map(
  (
    [
      slug,
      name,
      district,
      categoryIds,
      shortDescription,
      description,
      tags,
      imageCount,
      synthetic = false,
      createdBy = 'usr-hiddenspot-team',
    ],
    i,
  ) => {
    const primary = categoryIds[0];
    const month = String((i % 9) + 1).padStart(2, '0');
    const day = String((i % 27) + 1).padStart(2, '0');
    return {
      id: `pl-${slug}`,
      slug,
      name,
      shortDescription,
      description,
      categoryIds,
      tags,
      address: null,
      district,
      state: 'Kerala',
      country: 'India',
      latitude: verified.places[slug]?.latitude ?? null,
      longitude: verified.places[slug]?.longitude ?? null,
      locationPrecision: verified.places[slug]?.precision ?? null,
      imageUrls: img(slug, imageCount),
      averageRating: null,
      reviewCount: 0,
      popularityCount: POPULARITY[i] ?? 50,
      createdAt: `2026-${month}-${day}T08:00:00.000Z`,
      openingHours: null,
      entryFee: null,
      bestTimeToVisit: BEST_TIME[primary] ?? null,
      safetyNotes: [...new Set(categoryIds.flatMap((c) => SAFETY[c] ?? []))].slice(0, 3),
      moderationStatus: 'approved',
      createdBy,
      isSyntheticDemo: synthetic,
      sources: (verified.places[slug]?.sources ?? []).map((s) => ({
        field: 'coordinates',
        name: s.name,
        url: s.url,
        retrievedOn: verified.retrievedOn,
      })),
    };
  },
);

/* ---------------- Reviews (sample text from demo users) ---------------- */

const BODIES = [
  [
    'Lovely early in the morning',
    'We arrived early and it was calm and quiet. Wear shoes with good grip and carry water.',
  ],
  [
    null,
    'Beautiful place, but it gets busy later in the day. Worth going on a weekday if you can.',
  ],
  [
    'Go slowly and enjoy it',
    'Take your time here. Mist rolled in while we were there, which made it feel magical.',
  ],
  [null, 'Good for a short visit. Parking and facilities looked basic, so plan ahead.'],
  [
    'Great for photos',
    'The light in the late afternoon was lovely. Please keep the place clean for others.',
  ],
  [null, 'Peaceful spot. There was very little mobile signal, so download maps before you go.'],
  [
    'Check conditions first',
    'Paths were slippery after rain. We turned back from one section to stay safe.',
  ],
];
const REVIEWERS = users.filter((u) => u.role === 'explorer').map((u) => u.id);
const COUNT_PATTERN = [3, 2, 1, 0, 2, 3, 1, 2, 0, 1, 2, 3, 1, 0];
const RATING_PATTERN = [5, 4, 5, 3, 4, 5, 4, 2, 5, 4, 3, 5];

const reviews = [];
let reviewNo = 0;
places.forEach((place, pi) => {
  if (place.slug === 'demo-kaattuchola-stream') return; // keeps a no-reviews example
  const count =
    place.slug === 'demo-quiet-shore-cove' ? 1 : COUNT_PATTERN[pi % COUNT_PATTERN.length];
  for (let k = 0; k < count; k += 1) {
    reviewNo += 1;
    const [title, body] = BODIES[(pi + k) % BODIES.length];
    const userId = REVIEWERS[(pi + k * 3) % REVIEWERS.length];
    const rating = RATING_PATTERN[(pi * 2 + k) % RATING_PATTERN.length];
    const month = String(((pi + k) % 9) + 2).padStart(2, '0');
    const day = String(((pi * 3 + k) % 27) + 1).padStart(2, '0');
    reviews.push({
      id: `rv-${String(reviewNo).padStart(4, '0')}`,
      placeId: place.id,
      userId,
      rating,
      title,
      body,
      visitedOn: `2026-${month}`,
      createdAt: `2026-${month}-${day}T10:00:00.000Z`,
      source: 'seed',
    });
  }
});

// Place rating fields mirror the seed reviews exactly. Tests enforce this.
for (const place of places) {
  const own = reviews.filter((r) => r.placeId === place.id);
  place.reviewCount = own.length;
  place.averageRating = own.length
    ? Math.round((own.reduce((s, r) => s + r.rating, 0) / own.length) * 10) / 10
    : null;
}

/* ---------------- Submissions ---------------- */

const draft = (name, district, categoryIds, shortDescription, extra = {}) => ({
  name,
  shortDescription,
  description: null,
  categoryIds,
  district,
  state: 'Kerala',
  country: 'India',
  address: null,
  latitude: null,
  longitude: null,
  imageUrls: [],
  ...extra,
});

const submissions = [
  {
    id: 'sub-0001',
    submittedBy: 'usr-arjun',
    status: 'approved',
    place: draft(
      'Sunset Ridge Viewpoint (demo)',
      'Wayanad',
      ['hill-viewpoints'],
      'A fictional viewpoint created from an approved demo submission.',
    ),
    reviewerNote: null,
    approvedPlaceId: 'pl-demo-sunset-ridge',
    createdAt: '2026-08-02T09:00:00.000Z',
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'sub-0002',
    submittedBy: 'usr-fathima',
    status: 'in_review',
    place: draft(
      'Coconut Grove Lookout (demo)',
      'Kozhikode',
      ['peaceful', 'photoshoot'],
      'A fictional lookout between coconut groves, submitted for review.',
    ),
    reviewerNote: null,
    approvedPlaceId: null,
    createdAt: '2026-10-12T09:00:00.000Z',
    updatedAt: '2026-10-14T09:00:00.000Z',
  },
  {
    id: 'sub-0003',
    submittedBy: 'usr-joseph',
    status: 'changes_requested',
    place: draft(
      'Misty Pine Trail (demo)',
      'Idukki',
      ['forests-lakes'],
      'A fictional pine trail. The reviewer asked for more detail.',
    ),
    reviewerNote: 'Please add a clear photo and describe where visitors can park safely.',
    approvedPlaceId: null,
    createdAt: '2026-09-20T09:00:00.000Z',
    updatedAt: '2026-09-25T09:00:00.000Z',
  },
  {
    id: 'sub-0004',
    submittedBy: 'usr-meera',
    status: 'submitted',
    place: draft(
      'Lotus Pond Shrine (demo)',
      'Thiruvananthapuram',
      ['temples-churches', 'peaceful'],
      'A fictional small shrine beside a lotus pond.',
    ),
    reviewerNote: null,
    approvedPlaceId: null,
    createdAt: '2026-10-21T09:00:00.000Z',
    updatedAt: '2026-10-21T09:00:00.000Z',
  },
  {
    id: 'sub-0005',
    submittedBy: 'usr-anu',
    status: 'draft',
    place: draft(
      'Backwater Bend (demo)',
      'Alappuzha',
      ['peaceful'],
      'A fictional quiet bend in the backwaters, still a draft.',
    ),
    reviewerNote: null,
    approvedPlaceId: null,
    createdAt: '2026-10-23T09:00:00.000Z',
    updatedAt: '2026-10-23T09:00:00.000Z',
  },
  {
    id: 'sub-0006',
    submittedBy: 'usr-rahul',
    status: 'rejected',
    place: draft(
      'Private Estate Falls (demo)',
      'Thrissur',
      ['waterfalls'],
      'A fictional waterfall on private land.',
    ),
    reviewerNote: 'This location is on private property and is not open to the public.',
    approvedPlaceId: null,
    createdAt: '2026-07-05T09:00:00.000Z',
    updatedAt: '2026-07-09T09:00:00.000Z',
  },
];

write('categories.json', categories);
write('demoUsers.json', users);
write('places.json', places);
write('reviews.json', reviews);
write('submissions.json', submissions);
console.log(
  `categories=${categories.length} users=${users.length} places=${places.length} (synthetic=${places.filter((p) => p.isSyntheticDemo).length}) reviews=${reviews.length} submissions=${submissions.length}`,
);
