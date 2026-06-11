// DEV-ONLY fixture seeder. Never run against production.
//
// Reproduces the reported shape of analytics.icta_training_data so local
// development matches prod queries:
//   103,267 rows; 101,430 distinct unique_id (919 ids duplicated across
//   2,756 rows); dates 2026-03-31..2026-04-30; 47 counties; 283 regions in
//   8 region groups; 31 courses in 3 categories; placeholder institution /
//   institution_level / trainer_level; two virtual training_location values.
//
// Deterministic: seeded RNG, same output every run.
// Usage: node db/dev/seed-training-fixture.mjs

import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL ??
  "postgres://icta_dashboard:icta-local-dev-only@127.0.0.1:15424/icta_dashboard";

if (/20\.67\.245\.228|icta\.pathways/.test(DATABASE_URL)) {
  console.error("Refusing to run dev fixture seeder against production.");
  process.exit(1);
}

// mulberry32 — small deterministic PRNG
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260610);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const weightedPick = (items, weights) => {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
};

const FIRST = ["Brian","Mary","John","Faith","Kevin","Grace","Dennis","Mercy","Collins","Esther","Victor","Cynthia","Samuel","Naomi","Peter","Joyce","James","Lucy","Daniel","Ann","Felix","Diana","George","Irene","Moses","Caroline","Eric","Beatrice","Stephen","Janet","Paul","Agnes","Anthony","Lilian","Patrick","Susan","Michael","Catherine","David","Ruth","Joseph","Sarah","Elijah","Winnie","Martin","Edith","Allan","Gladys","Vincent","Rose"];
const LAST = ["Otieno","Wanjiku","Kiprotich","Achieng","Mwangi","Njeri","Ochieng","Wairimu","Kamau","Atieno","Mutua","Chebet","Omondi","Nyambura","Kipchoge","Adhiambo","Karanja","Wangari","Owino","Moraa","Maina","Akinyi","Korir","Wambui","Onyango","Jepkosgei","Gitau","Anyango","Barasa","Nekesa","Wafula","Naliaka","Mwende","Kilonzo","Muthoni","Odhiambo","Cherono","Njoroge","Awuor","Kibet","Wanjala","Auma","Rotich","Nafula","Ndungu","Aoko","Langat","Khalif","Abdullahi","Hassan"];

const CATEGORIES = {
  "AI SKILLS": [
    "AI Fundamentals","Generative AI Basics","Prompt Engineering Essentials","AI for the Workplace",
    "Microsoft Copilot Essentials","Responsible AI & Ethics","AI for Educators","AI for Public Service",
    "Intro to Machine Learning Concepts","AI Tools for Productivity","Conversational AI Basics",
    "AI for Small Business","Data & AI Foundations"
  ],
  "DIGITAL LITERACY": [
    "Digital Skills Foundation","Internet & Email Basics","Online Safety & Privacy","Intro to Computers",
    "Mobile Digital Skills","eCitizen & Government Services","Digital Financial Services",
    "Social Media for Beginners","Digital Communication Basics","Cyber Hygiene Essentials"
  ],
  "PRODUCTIVITY & WORK READINESS": [
    "Microsoft Word Essentials","Excel for Beginners","PowerPoint Essentials","Digital Entrepreneurship",
    "Freelancing & Online Work","CV Writing & Job Search Online","Collaboration Tools (Teams)",
    "Data Entry & Records Basics"
  ]
};
const COURSES = Object.entries(CATEGORIES).flatMap(([cat, list]) => list.map((c) => [c, cat]));
if (COURSES.length !== 31) throw new Error(`expected 31 courses, got ${COURSES.length}`);
// AI Champion program dominates: weight AI courses much higher.
const COURSE_WEIGHTS = COURSES.map(([, cat]) => (cat === "AI SKILLS" ? 12 : cat === "DIGITAL LITERACY" ? 2 : 1.4));

// 2026-03-31 .. 2026-04-30, ramping up over the window.
const DAYS = [];
for (let d = new Date("2026-03-31"); d <= new Date("2026-04-30"); d.setDate(d.getDate() + 1)) {
  DAYS.push(d.toISOString().slice(0, 10));
}
const DAY_WEIGHTS = DAYS.map((_, i) => 2 + i * 0.55 + (i % 7 === 5 || i % 7 === 6 ? -1.2 : 0));

const TOTAL_ROWS = 103267;
const DUP_LEARNERS = 919;
const DUP_ROWS = 2756;
const SINGLE_LEARNERS = TOTAL_ROWS - DUP_ROWS; // 100,511 -> distinct = 101,430

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

const counties = (await client.query(
  "SELECT county_code, county_name, former_province, population_2019 FROM ref.counties ORDER BY county_code"
)).rows;

// 283 regions: ~6 sub-regions per county, one county gets a 7th.
const SUFFIXES = ["CENTRAL", "EAST", "WEST", "NORTH", "SOUTH", "TOWN"];
const regions = [];
for (const c of counties) {
  for (const s of SUFFIXES) regions.push({ region: `${c.county_name.toUpperCase()} ${s}`, county: c });
}
regions.push({ region: "NAIROBI CBD", county: counties.find((c) => c.county_name === "Nairobi") });
if (regions.length !== 283) throw new Error(`expected 283 regions, got ${regions.length}`);

// Population-weighted county draw, Nairobi/urban skew for a virtual program.
const countyWeights = counties.map((c) =>
  c.population_2019 * (["Nairobi", "Kiambu", "Nakuru", "Mombasa", "Kisumu", "Uasin Gishu"].includes(c.county_name) ? 1.8 : 1)
);

function makeRow(uniqueId, name) {
  const county = weightedPick(counties, countyWeights);
  const region = pick(regions.filter((r) => r.county === county)) ?? regions[0];
  const [course, category] = weightedPick(COURSES, COURSE_WEIGHTS);
  const location = rand() < 3003 / TOTAL_ROWS ? "VIRTUAL-ICTA TRAINING" : "VIRTUAL-ICTA AI CHAMPION TRAINING";
  return [
    uniqueId, name, "OTHER", "OTHER", "STUDENT", course, location,
    weightedPick(DAYS, DAY_WEIGHTS), region.region, county.county_name.toUpperCase(),
    county.former_province.toUpperCase(), category
  ];
}

console.log("Creating analytics.icta_training_data ...");
await client.query(`
  DROP TABLE IF EXISTS analytics.icta_training_data;
  CREATE TABLE analytics.icta_training_data (
    unique_id text,
    participant_name text,
    institution text,
    institution_level text,
    trainer_level text,
    course_taken text,
    training_location text,
    date_trained date,
    region text,
    county text,
    region_group text,
    course_category text
  );
`);

const rows = [];
let idSeq = 1;
const nextId = () => `ICTA-${String(idSeq++).padStart(7, "0")}`;
const nextName = () => `${pick(FIRST)} ${pick(LAST)}`;

for (let i = 0; i < SINGLE_LEARNERS; i++) rows.push(makeRow(nextId(), nextName()));
// Duplicated ids: 919 learners spread over 2,756 rows.
let remaining = DUP_ROWS;
for (let i = 0; i < DUP_LEARNERS; i++) {
  const left = DUP_LEARNERS - i - 1;
  const max = Math.min(4, remaining - left * 2);
  const n = Math.max(2, Math.min(max, 2 + Math.floor(rand() * 3)));
  const id = nextId();
  const name = nextName();
  for (let k = 0; k < n; k++) rows.push(makeRow(id, name));
  remaining -= n;
}
if (rows.length !== TOTAL_ROWS) throw new Error(`row count ${rows.length} != ${TOTAL_ROWS}`);

console.log(`Inserting ${rows.length} rows ...`);
const BATCH = 2000;
for (let i = 0; i < rows.length; i += BATCH) {
  const chunk = rows.slice(i, i + BATCH);
  const values = [];
  const params = [];
  chunk.forEach((r, j) => {
    const base = j * 12;
    values.push(`(${Array.from({ length: 12 }, (_, k) => `$${base + k + 1}`).join(",")})`);
    params.push(...r);
  });
  await client.query(
    `INSERT INTO analytics.icta_training_data VALUES ${values.join(",")}`, params
  );
}

await client.query(`
  CREATE INDEX ON analytics.icta_training_data (county);
  CREATE INDEX ON analytics.icta_training_data (date_trained);
  CREATE INDEX ON analytics.icta_training_data (course_taken);
  UPDATE app.dataset_registry
     SET active_source = 'actual', loaded_at = now(), row_count = ${TOTAL_ROWS},
         notes = 'DEV FIXTURE standing in for the prod table. Same shape and summary stats.'
   WHERE dataset_key = 'training_records';
`);

const check = await client.query(`
  SELECT count(*)::int AS rows, count(DISTINCT unique_id)::int AS learners,
         min(date_trained) AS min_d, max(date_trained) AS max_d,
         count(DISTINCT county)::int AS counties, count(DISTINCT region)::int AS regions,
         count(DISTINCT course_taken)::int AS courses
  FROM analytics.icta_training_data
`);
console.table(check.rows);
await client.end();
