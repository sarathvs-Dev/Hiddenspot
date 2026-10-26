// Fetches town-centre coordinates for demo reference locations from Wikipedia and
// cross-checks them against OpenStreetMap. Writes ../data/referenceLocations.json.
// Usage: node scripts/fetch-reference-locations.mjs (needs network). Not run during builds.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const UA = { 'User-Agent': 'HiddenSpotDemo/0.1 (seed data verification; one-off)' };
const PRESETS = [
  { id: 'kochi', label: 'Kochi', district: 'Ernakulam', wiki: 'Kochi' },
  {
    id: 'thiruvananthapuram',
    label: 'Thiruvananthapuram',
    district: 'Thiruvananthapuram',
    wiki: 'Thiruvananthapuram',
  },
  { id: 'kozhikode', label: 'Kozhikode', district: 'Kozhikode', wiki: 'Kozhikode' },
  { id: 'thrissur', label: 'Thrissur', district: 'Thrissur', wiki: 'Thrissur' },
  { id: 'kalpetta', label: 'Kalpetta', district: 'Wayanad', wiki: 'Kalpetta' },
  { id: 'munnar', label: 'Munnar', district: 'Idukki', wiki: 'Munnar' },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const toRad = (d) => (d * Math.PI) / 180;
const km = (a, b) =>
  2 *
  6371 *
  Math.asin(
    Math.sqrt(
      Math.sin(toRad(b.lat - a.lat) / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lon - a.lon) / 2) ** 2,
    ),
  );

const out = [];
for (const p of PRESETS) {
  const w = await (
    await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=coordinates|info&inprop=url&titles=${encodeURIComponent(p.wiki)}`,
      { headers: UA },
    )
  ).json();
  const page = Object.values(w.query.pages)[0];
  const wc = page.coordinates?.[0];
  const [osm] = await (
    await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(`${p.label}, ${p.district}, Kerala`)}`,
      { headers: UA },
    )
  ).json();
  await sleep(1100);
  if (!wc || !osm) throw new Error(`${p.id}: missing a source`);
  const distance = km({ lat: wc.lat, lon: wc.lon }, { lat: Number(osm.lat), lon: Number(osm.lon) });
  if (distance > 10) throw new Error(`${p.id}: sources ${distance.toFixed(1)} km apart`);
  out.push({
    id: p.id,
    label: p.label,
    district: p.district,
    latitude: Number(wc.lat.toFixed(3)),
    longitude: Number(wc.lon.toFixed(3)),
    agreementKm: Math.round(distance * 10) / 10,
    sources: [
      { name: 'Wikipedia', url: page.fullurl },
      { name: 'OpenStreetMap', url: `https://www.openstreetmap.org/${osm.osm_type}/${osm.osm_id}` },
    ],
    retrievedOn: new Date().toISOString().slice(0, 10),
  });
  console.log(
    `${p.id.padEnd(20)} ${wc.lat.toFixed(3)},${wc.lon.toFixed(3)} agreement ${distance.toFixed(1)} km`,
  );
}
writeFileSync(
  join(here, '..', 'data', 'referenceLocations.json'),
  JSON.stringify(out, null, 2) + '\n',
);
