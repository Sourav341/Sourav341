import fs from "node:fs";
import path from "node:path";

const USERNAME = process.env.GH_USERNAME;
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const OUTPUT_PATH = process.env.OUTPUT_PATH || "dist/github-jet.svg";

const COLS = 34;
const ROWS = 7;
const CELL = 11;
const STEP = 14;
const GRID_X = 20;
const GRID_Y = 15;
const WIDTH = 513;
const HEIGHT = 170;
const JET_X_START = 35;
const JET_X_END = 478;
const LOOP_DUR = 20;
const MAX_TARGETS = 12;
const FLASH_COLOR = "#39d353";
const BULLET_COLOR = "#7ee787";
const BLAST_COLOR = "#56d364";
const PAD_Y = 128;

const COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

if (!USERNAME) throw new Error("GH_USERNAME is required");
if (!TOKEN) throw new Error("GH_TOKEN or GITHUB_TOKEN is required");

const query = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
            color
          }
        }
      }
    }
  }
}`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `bearer ${TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "github-jet-heatmap"
  },
  body: JSON.stringify({ query, variables: { login: USERNAME } })
});

if (!response.ok) {
  throw new Error(`GitHub GraphQL HTTP ${response.status}`);
}

const payload = await response.json();

if (payload.errors?.length) {
  throw new Error(payload.errors.map((e) => e.message).join("; "));
}

const weeks = payload.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
if (!weeks?.length) throw new Error(`No contribution calendar found for ${USERNAME}`);

const recentWeeks = weeks.slice(-COLS);
const cells = [];
const active = [];

for (let x = 0; x < COLS; x++) {
  const week = recentWeeks[x];
  const days = week?.contributionDays ?? [];

  for (let y = 0; y < ROWS; y++) {
    const day = days[y];
    const count = day?.contributionCount ?? 0;
    const color = day?.color || COLORS[Math.min(4, Math.floor(count / 4))];

    const cell = {
      x: GRID_X + x * STEP,
      y: GRID_Y + y * STEP,
      count,
      color
    };

    cells.push(cell);
    if (count > 0) active.push(cell);
  }
}

active.sort((a, b) => b.count - a.count);
const targets = active.slice(0, MAX_TARGETS);

const fmt = (n) => Number(n).toFixed(2);

const cellSvg = cells.map((c) =>
  `<rect x="${fmt(c.x)}" y="${fmt(c.y)}" width="${CELL}" height="${CELL}" rx="2" ry="2" fill="${c.color}"/>`
).join("\n");

const targetSvg = targets.map((t, i) => {
  const start = 0.02 + (i / Math.max(1, targets.length)) * 0.92;
  const end = Math.min(0.995, start + 0.018);
  const peak = Math.min(0.999, end + 0.012);
  const cx = t.x + CELL / 2;
  const cy = t.y + CELL / 2;
  return `
  <circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="0" fill="none" stroke="${BLAST_COLOR}" stroke-width="1.6" opacity="0">
    <animate attributeName="r" dur="${LOOP_DUR}s" repeatCount="indefinite"
      keyTimes="0;${fmt(start)};${fmt(peak)};1" values="0;1;9;9"/>
    <animate attributeName="opacity" dur="${LOOP_DUR}s" repeatCount="indefinite"
      keyTimes="0;${fmt(start)};${fmt(peak)};1" values="0;1;1;0"/>
  </circle>
  <circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="2.2" fill="${FLASH_COLOR}" opacity="0">
    <animate attributeName="opacity" dur="${LOOP_DUR}s" repeatCount="indefinite"
      keyTimes="0;${fmt(start)};${fmt(end)};1" values="0;0;1;0"/>
  </circle>`;
}).join("\n");

const jet = `
<g id="jet">
  <g transform="translate(0,0)">
    <polygon points="0,-16 8,6 4,3 -4,3 -8,6" fill="#58a6ff" stroke="#1f6feb" stroke-width="1"/>
    <polygon points="-8,6 -14,12 -4,7" fill="#388bfd"/>
    <polygon points="8,6 14,12 4,7" fill="#388bfd"/>
    <circle cx="0" cy="-6" r="2.2" fill="#c9e6ff"/>
    <polygon points="-3,7 3,7 0,15" fill="#f0883e">
      <animate attributeName="opacity" values="0.5;1;0.6;1" dur="0.18s" repeatCount="indefinite"/>
    </polygon>
  </g>
  <animateTransform attributeName="transform" attributeType="XML" type="translate"
    dur="${LOOP_DUR}s" repeatCount="indefinite"
    keyTimes="0;0.5;1"
    values="${JET_X_START}.00,${PAD_Y}.00;${JET_X_END}.00,${PAD_Y}.00;${JET_X_START}.00,${PAD_Y}.00"/>
</g>`;

const svg = `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#0d1117"/>
<g id="grid">
${cellSvg}
</g>
<g id="targets">
${targetSvg}
</g>
${jet}
</svg>
`;

const output = path.resolve(OUTPUT_PATH);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, svg, "utf8");

console.log(`Generated ${output}`);
console.log(`User: ${USERNAME}`);
console.log(`Weeks: ${recentWeeks.length}, cells: ${cells.length}, targets: ${targets.length}`);
