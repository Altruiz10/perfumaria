// ADR-005: art-directed placeholder imagery (SVG -> WebP via sharp).
// Replace public/images/** with real photography keeping the same file names.
// Requires "Cormorant Garamond" and "Jost" installed as system fonts for label text.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/images");
const SERIF = "Cormorant Garamond Light, Cormorant Garamond, serif";
const SANS = "Jost, sans-serif";

const products = [
  { slug: "noir-absolu", name: "Noir Absolu", conc: "EXTRAIT DE PARFUM", liquid: "#2a1d14", cap: "gold", bg: ["#ece7df", "#d9d1c5"], mood: ["#0d0b0a", "#2b2119"] },
  { slug: "iris-nocturne", name: "Íris Nocturne", conc: "EAU DE PARFUM", liquid: "#cdbfd6", cap: "ivory", bg: ["#efebf0", "#dcd5de"], mood: ["#2a2430", "#6d5f78"] },
  { slug: "ambar-imperial", name: "Âmbar Imperial", conc: "EXTRAIT DE PARFUM", liquid: "#b8742c", cap: "gold", bg: ["#f1e9de", "#e0d2bf"], mood: ["#1f130a", "#6e4520"] },
  { slug: "cedro-branco", name: "Cedro Branco", conc: "EAU DE PARFUM", liquid: "#e3dccd", cap: "black", bg: ["#f0ede7", "#dedad2"], mood: ["#23211d", "#5d574c"] },
  { slug: "neroli-solar", name: "Neroli Solar", conc: "EAU DE PARFUM", liquid: "#e6c16a", cap: "ivory", bg: ["#f4eee2", "#e6dcc6"], mood: ["#3a2a10", "#b0843a"] },
  { slug: "rosa-veludo", name: "Rosa Veludo", conc: "EXTRAIT DE PARFUM", liquid: "#8e2f40", cap: "black", bg: ["#f2eaea", "#e2d4d4"], mood: ["#1c0a0e", "#5e1f2b"] },
  { slug: "salvia-e-sal", name: "Sálvia & Sal", conc: "EAU DE PARFUM", liquid: "#a9bcb8", cap: "black", bg: ["#edf0ef", "#d7dddb"], mood: ["#141c1c", "#4c6361"] },
  { slug: "madeira-sagrada", name: "Madeira Sagrada", conc: "EAU DE PARFUM", liquid: "#7a5a44", cap: "gold", bg: ["#efe9e3", "#ddd2c7"], mood: ["#17110c", "#4f3a2a"] },
];

const CAPS = {
  gold: ["#8a6a34", "#e7cf96", "#a9864a", "#5e4622"],
  black: ["#050505", "#3a3734", "#141312", "#000000"],
  ivory: ["#d9d2c4", "#fbf8f1", "#e6dfd1", "#b9b09f"],
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function defs(id, p) {
  const [c0, c1, c2, c3] = CAPS[p.cap];
  return `
  <linearGradient id="${id}glass" x1="0" x2="1">
    <stop offset="0" stop-color="#ffffff" stop-opacity=".55"/>
    <stop offset=".08" stop-color="#ffffff" stop-opacity=".12"/>
    <stop offset=".5" stop-color="#ffffff" stop-opacity=".04"/>
    <stop offset=".9" stop-color="#000000" stop-opacity=".10"/>
    <stop offset="1" stop-color="#000000" stop-opacity=".28"/>
  </linearGradient>
  <linearGradient id="${id}liquid" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${p.liquid}" stop-opacity=".78"/>
    <stop offset="1" stop-color="${p.liquid}" stop-opacity=".96"/>
  </linearGradient>
  <linearGradient id="${id}cap" x1="0" x2="1">
    <stop offset="0" stop-color="${c0}"/><stop offset=".35" stop-color="${c1}"/>
    <stop offset=".6" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/>
  </linearGradient>
  <linearGradient id="${id}gold" x1="0" x2="1">
    <stop offset="0" stop-color="#7c5e2c"/><stop offset=".4" stop-color="#f0dca8"/>
    <stop offset=".7" stop-color="#b08d50"/><stop offset="1" stop-color="#5c4520"/>
  </linearGradient>
  <filter id="${id}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
  <filter id="${id}soft"><feGaussianBlur stdDeviation="3"/></filter>`;
}

/** Bottle drawn in a 1200x1500 frame, centred at x=600. */
function bottle(id, p, { labelDark = false } = {}) {
  const capText = p.cap === "black" ? "#cbb27a" : "#2a2016";
  return `
  <ellipse cx="600" cy="1238" rx="250" ry="26" fill="#000" opacity=".28" filter="url(#${id}blur)"/>
  <!-- cap -->
  <rect x="512" y="238" width="176" height="238" rx="6" fill="url(#${id}cap)"/>
  <rect x="512" y="238" width="176" height="10" fill="#fff" opacity=".12"/>
  <text x="600" y="372" font-family="${SERIF}" font-size="44" text-anchor="middle" fill="${capText}" opacity=".85" letter-spacing="4">H·M</text>
  <!-- collar + neck -->
  <rect x="540" y="474" width="120" height="34" fill="url(#${id}gold)"/>
  <rect x="566" y="506" width="68" height="60" fill="${p.liquid}" opacity=".55"/>
  <rect x="566" y="506" width="68" height="60" fill="url(#${id}glass)"/>
  <!-- body -->
  <rect x="400" y="560" width="400" height="680" rx="34" fill="${labelDark ? "#3a342e" : "#ffffff"}" opacity="${labelDark ? ".55" : ".3"}"/>
  <rect x="418" y="610" width="364" height="570" rx="20" fill="url(#${id}liquid)"/>
  <rect x="400" y="560" width="400" height="680" rx="34" fill="url(#${id}glass)"/>
  <rect x="400" y="1178" width="400" height="62" rx="0" fill="#ffffff" opacity="${labelDark ? ".08" : ".2"}"/>
  <path d="M430 600 C 436 800, 436 1000, 430 1180" stroke="#fff" stroke-width="10" opacity=".45" fill="none" filter="url(#${id}soft)"/>
  <path d="M772 610 C 768 800, 768 1000, 772 1170" stroke="#fff" stroke-width="3" opacity=".25" fill="none"/>
  <rect x="400.5" y="560.5" width="399" height="679" rx="34" fill="none" stroke="#fff" stroke-opacity="${labelDark ? ".22" : ".5"}"/>
  <!-- label -->
  <rect x="468" y="790" width="264" height="220" fill="${labelDark ? "#161412" : "#f6f1e8"}"/>
  <rect x="478" y="800" width="244" height="200" fill="none" stroke="url(#${id}gold)" stroke-width="1.5"/>
  <text x="600" y="846" font-family="${SANS}" font-size="13" letter-spacing="5" text-anchor="middle" fill="${labelDark ? "#d8c08a" : "#6f5a3a"}">HOMEM &amp; MULHER</text>
  <line x1="570" x2="630" y1="866" y2="866" stroke="url(#${id}gold)" stroke-width="1.2"/>
  <text x="600" y="918" font-family="${SERIF}" font-size="${p.name.length > 13 ? 30 : 36}" text-anchor="middle" fill="${labelDark ? "#f3ede2" : "#1a1714"}">${esc(p.name)}</text>
  <text x="600" y="962" font-family="${SANS}" font-size="11" letter-spacing="4" text-anchor="middle" fill="${labelDark ? "#b9a57c" : "#7c6a52"}">${p.conc}</text>
  <text x="600" y="984" font-family="${SANS}" font-size="11" letter-spacing="3" text-anchor="middle" fill="${labelDark ? "#b9a57c" : "#7c6a52"}">100 ML</text>`;
}

const grain = (id) => `
  <filter id="${id}grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
  `;
const grainRect = (id, w, h, opacity = 0.07) =>
  `<rect width="${w}" height="${h}" filter="url(#${id}grain)" opacity="${opacity}" style="mix-blend-mode:overlay"/>`;

function productStill(p) {
  const id = "a";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <defs>${defs(id, p)}
    <radialGradient id="bg" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></radialGradient>
    ${grain(id)}
  </defs>
  <rect width="1200" height="1500" fill="url(#bg)"/>
  <rect y="1300" width="1200" height="200" fill="#000" opacity=".035"/>
  <g transform="translate(600 1300) scale(1.14) translate(-600 -1240)">${bottle(id, p)}</g>
  ${grainRect(id, 1200, 1500, 0.05)}
</svg>`;
}

function productMood(p) {
  const id = "b";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <defs>${defs(id, p)}
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.mood[1]}"/><stop offset="1" stop-color="${p.mood[0]}"/></linearGradient>
    <radialGradient id="beam" cx=".2" cy="0" r="1"><stop offset="0" stop-color="#fff3d6" stop-opacity=".55"/><stop offset=".45" stop-color="#fff3d6" stop-opacity="0"/></radialGradient>
    ${grain(id)}
  </defs>
  <rect width="1200" height="1500" fill="url(#bg)"/>
  <rect width="1200" height="1500" fill="url(#beam)"/>
  <circle cx="930" cy="330" r="120" fill="#fff" opacity=".05"/>
  <circle cx="220" cy="1140" r="70" fill="#fff" opacity=".05"/>
  <path d="M0 1260 C 300 1200, 900 1320, 1200 1240 L1200 1500 L0 1500 Z" fill="#000" opacity=".35"/>
  <g transform="translate(600 760) rotate(-6) scale(.86) translate(-600 -760)">${bottle(id, p, { labelDark: true })}</g>
  ${grainRect(id, 1200, 1500, 0.1)}
</svg>`;
}

function productDetail(p) {
  const id = "c";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <defs>${defs(id, p)}
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></linearGradient>
    ${grain(id)}
  </defs>
  <rect width="1200" height="1500" fill="url(#bg)"/>
  <g transform="translate(600 700) scale(2.1) translate(-600 -720)">${bottle(id, p)}</g>
  ${grainRect(id, 1200, 1500, 0.05)}
</svg>`;
}

function hero({ w, h, bx, by, scale }) {
  const id = "h";
  const p = products[0];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>${defs(id, p)}
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#070605"/><stop offset=".6" stop-color="#14100c"/><stop offset="1" stop-color="#241a11"/></linearGradient>
    <radialGradient id="glow" cx="${bx / w}" cy="${(by - 260 * scale) / h}" r=".55"><stop offset="0" stop-color="#e2b872" stop-opacity=".42"/><stop offset=".5" stop-color="#8a5f2a" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="silk" x1="0" x2="1"><stop offset="0" stop-color="#c9a468" stop-opacity="0"/><stop offset=".5" stop-color="#e6c893" stop-opacity=".5"/><stop offset="1" stop-color="#c9a468" stop-opacity="0"/></linearGradient>
    <linearGradient id="plinth" x1="0" x2="1"><stop offset="0" stop-color="#0c0b0a"/><stop offset=".5" stop-color="#2b2723"/><stop offset="1" stop-color="#090807"/></linearGradient>
    ${grain(id)}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <path d="M${-w * 0.1} ${h * 0.78} C ${w * 0.3} ${h * 0.58}, ${w * 0.6} ${h * 0.98}, ${w * 1.1} ${h * 0.7}" stroke="url(#silk)" stroke-width="${2 * scale}" fill="none"/>
  <path d="M${-w * 0.1} ${h * 0.83} C ${w * 0.35} ${h * 0.64}, ${w * 0.62} ${h * 1.02}, ${w * 1.1} ${h * 0.76}" stroke="url(#silk)" stroke-width="${1 * scale}" fill="none" opacity=".6"/>
  <g transform="translate(${bx} ${by}) scale(${scale}) translate(-600 -1240)">
    <rect x="300" y="1240" width="600" height="190" fill="url(#plinth)"/>
    <rect x="300" y="1240" width="600" height="3" fill="#d8b77a" opacity=".45"/>
    ${bottle(id, p, { labelDark: true })}
  </g>
  ${grainRect(id, w, h, 0.12)}
</svg>`;
}

function atelier() {
  const id = "m";
  const drops = [
    { x: 320, h: 420, c: "#b8742c", cap: "gold" },
    { x: 600, h: 560, c: "#2a1d14", cap: "black" },
    { x: 880, h: 360, c: "#cdbfd6", cap: "ivory" },
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1612"/><stop offset="1" stop-color="#0a0908"/></linearGradient>
    <radialGradient id="lamp" cx=".5" cy=".15" r=".7"><stop offset="0" stop-color="#f3d59c" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="gl" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".15" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
    ${grain(id)}
  </defs>
  <rect width="1200" height="1500" fill="url(#bg)"/>
  <rect width="1200" height="1500" fill="url(#lamp)"/>
  <rect y="1150" width="1200" height="350" fill="#050404" opacity=".7"/>
  <rect y="1150" width="1200" height="2" fill="#c9a468" opacity=".35"/>
  ${drops
    .map(
      (d) => `
    <rect x="${d.x - 70}" y="${1150 - d.h}" width="140" height="${d.h}" rx="10" fill="${d.c}" opacity=".85"/>
    <rect x="${d.x - 70}" y="${1150 - d.h}" width="140" height="${d.h}" rx="10" fill="url(#gl)"/>
    <rect x="${d.x - 16}" y="${1150 - d.h - 60}" width="32" height="60" fill="#fff" opacity=".15"/>
    <rect x="${d.x - 40}" y="${1150 - d.h - 140}" width="80" height="84" fill="${CAPS[d.cap][1]}" opacity=".9"/>
    <ellipse cx="${d.x}" cy="1160" rx="110" ry="10" fill="#000" opacity=".6"/>`,
    )
    .join("")}
  <text x="600" y="1330" font-family="${SERIF}" font-size="40" text-anchor="middle" fill="#d8c08a" opacity=".7" letter-spacing="10">ATELIER</text>
  ${grainRect(id, 1200, 1500, 0.12)}
</svg>`;
}

const FAMILY_ART = {
  woody: { a: "#3b2a1e", b: "#8a6a4d", shape: "stripes" },
  amber: { a: "#2a1608", b: "#d08a3a", shape: "orb" },
  floral: { a: "#4a3a45", b: "#d9bfd0", shape: "petals" },
  citrus: { a: "#5a4210", b: "#f0cd6e", shape: "slice" },
  aromatic: { a: "#1f2b29", b: "#9fb6ae", shape: "leaves" },
  leather: { a: "#0b0a09", b: "#4a3a2e", shape: "grain" },
};

function familyTile(key) {
  const { a, b, shape } = FAMILY_ART[key];
  const id = "f";
  let art = "";
  if (shape === "stripes")
    art = Array.from({ length: 18 }, (_, i) => `<path d="M${i * 55} 0 C ${i * 55 + 40} 400, ${i * 55 - 30} 800, ${i * 55 + 20} 1100" stroke="${b}" stroke-width="${2 + (i % 3)}" opacity=".35" fill="none"/>`).join("");
  if (shape === "orb") art = `<circle cx="450" cy="520" r="260" fill="url(#orb)"/>`;
  if (shape === "petals")
    art = Array.from({ length: 8 }, (_, i) => `<ellipse cx="450" cy="380" rx="70" ry="210" fill="${b}" opacity=".22" transform="rotate(${i * 22.5} 450 560)"/>`).join("");
  if (shape === "slice")
    art = `<circle cx="450" cy="550" r="280" fill="${b}" opacity=".35"/><circle cx="450" cy="550" r="250" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="3"/>${Array.from({ length: 10 }, (_, i) => `<line x1="450" y1="550" x2="${450 + 250 * Math.cos((i * Math.PI) / 5)}" y2="${550 + 250 * Math.sin((i * Math.PI) / 5)}" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>`).join("")}`;
  if (shape === "leaves")
    art = Array.from({ length: 7 }, (_, i) => `<path d="M${150 + i * 100} 1000 Q ${120 + i * 100} 600 ${200 + i * 90} ${260 + (i % 2) * 80}" stroke="${b}" stroke-width="3" fill="none" opacity=".5"/><ellipse cx="${200 + i * 90}" cy="${300 + (i % 2) * 80}" rx="24" ry="60" fill="${b}" opacity=".3" transform="rotate(${-20 + i * 6} ${200 + i * 90} ${300 + (i % 2) * 80})"/>`).join("");
  if (shape === "grain") art = `<rect width="900" height="1100" filter="url(#${id}grain)" opacity=".5"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" viewBox="0 0 900 1100">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="#0d0c0b"/></linearGradient>
    <radialGradient id="orb"><stop offset="0" stop-color="${b}" stop-opacity=".9"/><stop offset=".6" stop-color="${b}" stop-opacity=".25"/><stop offset="1" stop-color="${b}" stop-opacity="0"/></radialGradient>
    ${grain(id)}
  </defs>
  <rect width="900" height="1100" fill="url(#bg)"/>
  ${art}
  ${grainRect(id, 900, 1100, 0.1)}
</svg>`;
}

function og() {
  const id = "o";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b0a09"/><stop offset="1" stop-color="#2a1f15"/></linearGradient>${grain(id)}</defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="300" font-family="${SERIF}" font-size="84" text-anchor="middle" fill="#f3ede2" letter-spacing="6">HOMEM &amp; MULHER</text>
  <line x1="540" x2="660" y1="340" y2="340" stroke="#c9a468" stroke-width="1.5"/>
  <text x="600" y="390" font-family="${SANS}" font-size="20" text-anchor="middle" fill="#c9a468" letter-spacing="10">PERFUMARIA ARTESANAL</text>
  ${grainRect(id, 1200, 630, 0.1)}
</svg>`;
}

async function write(file, svg, { width, quality = 80 } = {}) {
  const out = path.join(OUT, file);
  await mkdir(path.dirname(out), { recursive: true });
  let img = sharp(Buffer.from(svg), { density: 72 });
  if (width) img = img.resize({ width });
  if (file.endsWith(".png")) await img.png({ compressionLevel: 9 }).toFile(out);
  else await img.webp({ quality, effort: 5 }).toFile(out);
  console.log("✓", file);
}

for (const p of products) {
  await write(`products/${p.slug}-1.webp`, productStill(p));
  await write(`products/${p.slug}-2.webp`, productMood(p));
  await write(`products/${p.slug}-3.webp`, productDetail(p));
}
await write("hero-desktop.webp", hero({ w: 2400, h: 1350, bx: 1680, by: 1150, scale: 0.78 }), { quality: 78 });
await write("hero-mobile.webp", hero({ w: 1080, h: 1620, bx: 560, by: 780, scale: 0.6 }), { quality: 78 });
await write("atelier.webp", atelier());
for (const key of Object.keys(FAMILY_ART)) await write(`families/${key}.webp`, familyTile(key));
await write("og.png", og());
