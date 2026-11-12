import type { Localized } from "@/domain/locale";
import type { Product } from "@/domain/product";

/**
 * Seed catalogue. Replace via ProductRepository (CMS/ERP) — see ARCHITECTURE §Portas.
 * Prices in integer cents (R1).
 */

const L = (pt: string, en: string, es: string): Localized => ({ pt, en, es });
const N = (pt: string[], en: string[], es: string[]): Localized<string[]> => ({ pt, en, es });
const imgs = (slug: string) => [1, 2, 3].map((i) => `/images/products/${slug}-${i}.webp`);

export const products: Product[] = [
  {
    slug: "noir-absolu",
    name: "Noir Absolu",
    family: "leather",
    gender: "masculine",
    concentration: "extrait",
    tagline: L("A noite tem assinatura.", "The night has a signature.", "La noche tiene firma."),
    story: L(
      "Nasceu de um bar escondido em São Paulo, às duas da manhã: couro de poltrona antiga, fumaça de charuto e o silêncio de quem não precisa provar nada. Noir Absolu é presença sem pressa.",
      "Born in a hidden São Paulo bar at two in the morning: old leather armchairs, cigar smoke and the silence of someone with nothing to prove. Noir Absolu is presence without haste.",
      "Nació en un bar escondido de São Paulo a las dos de la madrugada: cuero de sillón antiguo, humo de puro y el silencio de quien no necesita demostrar nada. Noir Absolu es presencia sin prisa.",
    ),
    description: L(
      "Couro curtido, tabaco e oud envoltos em pimenta preta. Intenso, magnético, inesquecível.",
      "Tanned leather, tobacco and oud wrapped in black pepper. Intense, magnetic, unforgettable.",
      "Cuero curtido, tabaco y oud envueltos en pimienta negra. Intenso, magnético, inolvidable.",
    ),
    notes: {
      top: N(["Pimenta preta", "Cardamomo"], ["Black pepper", "Cardamom"], ["Pimienta negra", "Cardamomo"]),
      heart: N(["Couro", "Íris"], ["Leather", "Iris"], ["Cuero", "Iris"]),
      base: N(["Oud", "Tabaco", "Âmbar"], ["Oud", "Tobacco", "Amber"], ["Oud", "Tabaco", "Ámbar"]),
    },
    variants: [
      { sizeMl: 50, priceCents: 54900, sku: "NOI-EX-50" },
      { sizeMl: 100, priceCents: 84900, sku: "NOI-EX-100" },
    ],
    images: imgs("noir-absolu"),
    accent: "#1c1a18",
    featured: true,
    createdAt: "2026-08-01",
  },
  {
    slug: "iris-nocturne",
    name: "Íris Nocturne",
    family: "floral",
    gender: "feminine",
    concentration: "edp",
    tagline: L("Elegância que sussurra.", "Elegance that whispers.", "Elegancia que susurra."),
    story: L(
      "Uma íris empoeirada de pó de arroz, como a lembrança de uma luva de seda esquecida sobre o piano. Delicada à primeira vista, inesquecível na segunda.",
      "A powdery iris, like the memory of a silk glove left on a piano. Delicate at first glance, unforgettable at the second.",
      "Un iris empolvado, como el recuerdo de un guante de seda olvidado sobre el piano. Delicado a primera vista, inolvidable a la segunda.",
    ),
    description: L(
      "Íris, pera e rosa sobre almíscar e sândalo. Pó, luz e pele.",
      "Iris, pear and rose over musk and sandalwood. Powder, light and skin.",
      "Iris, pera y rosa sobre almizcle y sándalo. Polvo, luz y piel.",
    ),
    notes: {
      top: N(["Pera", "Bergamota"], ["Pear", "Bergamot"], ["Pera", "Bergamota"]),
      heart: N(["Íris", "Rosa"], ["Iris", "Rose"], ["Iris", "Rosa"]),
      base: N(["Almíscar", "Sândalo"], ["Musk", "Sandalwood"], ["Almizcle", "Sándalo"]),
    },
    variants: [
      { sizeMl: 50, priceCents: 42900, sku: "IRI-EDP-50" },
      { sizeMl: 100, priceCents: 64900, sku: "IRI-EDP-100" },
    ],
    images: imgs("iris-nocturne"),
    accent: "#b9a9c4",
    featured: true,
    createdAt: "2026-07-15",
  },
  {
    slug: "ambar-imperial",
    name: "Âmbar Imperial",
    family: "amber",
    gender: "shared",
    concentration: "extrait",
    tagline: L("Calor que permanece.", "Warmth that stays.", "Calidez que permanece."),
    story: L(
      "Açafrão, rosa e âmbar dourado, como um salão iluminado a velas. Cada aplicação é um gesto de opulência silenciosa — e de rastro longo.",
      "Saffron, rose and golden amber, like a candlelit salon. Every application is a gesture of quiet opulence — with a long trail.",
      "Azafrán, rosa y ámbar dorado, como un salón iluminado con velas. Cada aplicación es un gesto de opulencia silenciosa — y de estela larga.",
    ),
    description: L(
      "Açafrão e mandarina abrem para rosa e canela, repousando em âmbar, baunilha bourbon e benjoim.",
      "Saffron and mandarin open onto rose and cinnamon, resting on amber, bourbon vanilla and benzoin.",
      "Azafrán y mandarina se abren a rosa y canela, reposando en ámbar, vainilla bourbon y benjuí.",
    ),
    notes: {
      top: N(["Açafrão", "Mandarina"], ["Saffron", "Mandarin"], ["Azafrán", "Mandarina"]),
      heart: N(["Rosa turca", "Canela"], ["Turkish rose", "Cinnamon"], ["Rosa turca", "Canela"]),
      base: N(["Âmbar", "Baunilha bourbon", "Benjoim"], ["Amber", "Bourbon vanilla", "Benzoin"], ["Ámbar", "Vainilla bourbon", "Benjuí"]),
    },
    variants: [
      { sizeMl: 50, priceCents: 52900, sku: "AMB-EX-50" },
      { sizeMl: 100, priceCents: 79900, sku: "AMB-EX-100" },
    ],
    images: imgs("ambar-imperial"),
    accent: "#a8733a",
    featured: true,
    createdAt: "2026-06-20",
  },
  {
    slug: "cedro-branco",
    name: "Cedro Branco",
    family: "woody",
    gender: "masculine",
    concentration: "edp",
    tagline: L("Serenidade com caráter.", "Serenity with character.", "Serenidad con carácter."),
    story: L(
      "Uma manhã de inverno na serra: madeira recém-cortada, ar gelado e a calma de quem sabe exatamente para onde vai.",
      "A winter morning in the mountains: freshly cut wood, cold air and the calm of someone who knows exactly where they are going.",
      "Una mañana de invierno en la sierra: madera recién cortada, aire helado y la calma de quien sabe exactamente adónde va.",
    ),
    description: L(
      "Pimenta rosa e toranja sobre cedro e lavanda, com fundo de vetiver e almíscar.",
      "Pink pepper and grapefruit over cedar and lavender, with a base of vetiver and musk.",
      "Pimienta rosa y pomelo sobre cedro y lavanda, con fondo de vetiver y almizcle.",
    ),
    notes: {
      top: N(["Pimenta rosa", "Toranja"], ["Pink pepper", "Grapefruit"], ["Pimienta rosa", "Pomelo"]),
      heart: N(["Cedro", "Lavanda"], ["Cedar", "Lavender"], ["Cedro", "Lavanda"]),
      base: N(["Vetiver", "Almíscar"], ["Vetiver", "Musk"], ["Vetiver", "Almizcle"]),
    },
    variants: [
      { sizeMl: 50, priceCents: 38900, sku: "CED-EDP-50" },
      { sizeMl: 100, priceCents: 58900, sku: "CED-EDP-100" },
    ],
    images: imgs("cedro-branco"),
    accent: "#c9bfae",
    featured: true,
    createdAt: "2026-05-10",
  },
  {
    slug: "neroli-solar",
    name: "Neroli Solar",
    family: "citrus",
    gender: "shared",
    concentration: "edp",
    tagline: L("Luz dourada sobre a pele.", "Golden light on skin.", "Luz dorada sobre la piel."),
    story: L(
      "O fim de tarde em uma varanda mediterrânea, laranjeiras em flor e o sal ainda na pele. Frescor que não se despede cedo.",
      "Late afternoon on a Mediterranean terrace, orange trees in bloom and salt still on the skin. Freshness that does not leave early.",
      "El atardecer en una terraza mediterránea, naranjos en flor y la sal aún en la piel. Frescor que no se despide pronto.",
    ),
    description: L(
      "Neroli, bergamota e yuzu com flor de laranjeira, sobre almíscar branco e cedro.",
      "Neroli, bergamot and yuzu with orange blossom, over white musk and cedar.",
      "Neroli, bergamota y yuzu con flor de azahar, sobre almizcle blanco y cedro.",
    ),
    notes: {
      top: N(["Neroli", "Bergamota", "Yuzu"], ["Neroli", "Bergamot", "Yuzu"], ["Neroli", "Bergamota", "Yuzu"]),
      heart: N(["Flor de laranjeira", "Petitgrain"], ["Orange blossom", "Petitgrain"], ["Flor de azahar", "Petitgrain"]),
      base: N(["Almíscar branco", "Cedro"], ["White musk", "Cedar"], ["Almizcle blanco", "Cedro"]),
    },
    variants: [
      { sizeMl: 50, priceCents: 36900, sku: "NER-EDP-50" },
      { sizeMl: 100, priceCents: 55900, sku: "NER-EDP-100" },
    ],
    images: imgs("neroli-solar"),
    accent: "#d9b56a",
    featured: false,
    createdAt: "2026-08-20",
  },
  {
    slug: "rosa-veludo",
    name: "Rosa Veludo",
    family: "floral",
    gender: "feminine",
    concentration: "extrait",
    tagline: L("Uma rosa que não pede licença.", "A rose that asks no permission.", "Una rosa que no pide permiso."),
    story: L(
      "Rosa damascena, lichia e um fundo escuro de patchouli: a rosa como ela deveria ser — sensual, moderna, com espinhos.",
      "Damask rose, lychee and a dark patchouli base: the rose as it should be — sensual, modern, thorns included.",
      "Rosa damascena, lichi y un fondo oscuro de pachulí: la rosa como debería ser — sensual, moderna, con espinas.",
    ),
    description: L(
      "Lichia e framboesa abrem para rosa damascena e peônia, sobre patchouli e baunilha.",
      "Lychee and raspberry open onto damask rose and peony, over patchouli and vanilla.",
      "Lichi y frambuesa se abren a rosa damascena y peonía, sobre pachulí y vainilla.",
    ),
    notes: {
      top: N(["Lichia", "Framboesa"], ["Lychee", "Raspberry"], ["Lichi", "Frambuesa"]),
      heart: N(["Rosa damascena", "Peônia"], ["Damask rose", "Peony"], ["Rosa damascena", "Peonía"]),
      base: N(["Patchouli", "Baunilha"], ["Patchouli", "Vanilla"], ["Pachulí", "Vainilla"]),
    },
    variants: [
      { sizeMl: 50, priceCents: 49900, sku: "ROS-EX-50" },
      { sizeMl: 100, priceCents: 76900, sku: "ROS-EX-100" },
    ],
    images: imgs("rosa-veludo"),
    accent: "#7d2e3b",
    featured: true,
    createdAt: "2026-07-01",
  },
  {
    slug: "salvia-e-sal",
    name: "Sálvia & Sal",
    family: "aromatic",
    gender: "shared",
    concentration: "edp",
    tagline: L("O mar em linha reta.", "The sea in a straight line.", "El mar en línea recta."),
    story: L(
      "Um passeio pela costa em dia de vento: sálvia selvagem nas pedras, maresia e o horizonte limpo. Clareza em forma de perfume.",
      "A coastal walk on a windy day: wild sage on the rocks, sea spray and a clean horizon. Clarity in the form of a perfume.",
      "Un paseo por la costa en un día de viento: salvia silvestre entre las rocas, brisa marina y el horizonte limpio. Claridad en forma de perfume.",
    ),
    description: L(
      "Sal marinho e sálvia com lavanda e alecrim, sobre musgo de carvalho e ambergris.",
      "Sea salt and sage with lavender and rosemary, over oakmoss and ambergris.",
      "Sal marina y salvia con lavanda y romero, sobre musgo de roble y ámbar gris.",
    ),
    notes: {
      top: N(["Sal marinho", "Sálvia"], ["Sea salt", "Sage"], ["Sal marina", "Salvia"]),
      heart: N(["Lavanda", "Alecrim"], ["Lavender", "Rosemary"], ["Lavanda", "Romero"]),
      base: N(["Musgo de carvalho", "Ambergris"], ["Oakmoss", "Ambergris"], ["Musgo de roble", "Ámbar gris"]),
    },
    variants: [
      { sizeMl: 50, priceCents: 34900, sku: "SAL-EDP-50" },
      { sizeMl: 100, priceCents: 52900, sku: "SAL-EDP-100" },
    ],
    images: imgs("salvia-e-sal"),
    accent: "#8fa3a0",
    featured: false,
    createdAt: "2026-04-15",
  },
  {
    slug: "madeira-sagrada",
    name: "Madeira Sagrada",
    family: "woody",
    gender: "shared",
    concentration: "edp",
    tagline: L("Um ritual sobre a pele.", "A ritual on the skin.", "Un ritual sobre la piel."),
    story: L(
      "Palo santo aceso em silêncio, sândalo cremoso e resinas antigas. Um perfume para os momentos em que você decide desacelerar.",
      "Palo santo burning in silence, creamy sandalwood and ancient resins. A perfume for the moments you choose to slow down.",
      "Palo santo encendido en silencio, sándalo cremoso y resinas antiguas. Un perfume para los momentos en que decides ir más despacio.",
    ),
    description: L(
      "Cardamomo e elemi sobre sândalo e palo santo, com fundo de vetiver e musgo.",
      "Cardamom and elemi over sandalwood and palo santo, with a base of vetiver and moss.",
      "Cardamomo y elemí sobre sándalo y palo santo, con fondo de vetiver y musgo.",
    ),
    notes: {
      top: N(["Cardamomo", "Elemi"], ["Cardamom", "Elemi"], ["Cardamomo", "Elemí"]),
      heart: N(["Sândalo", "Palo santo"], ["Sandalwood", "Palo santo"], ["Sándalo", "Palo santo"]),
      base: N(["Vetiver", "Musgo"], ["Vetiver", "Moss"], ["Vetiver", "Musgo"]),
    },
    variants: [
      { sizeMl: 50, priceCents: 39900, sku: "MAD-EDP-50" },
      { sizeMl: 100, priceCents: 59900, sku: "MAD-EDP-100" },
    ],
    images: imgs("madeira-sagrada"),
    accent: "#6b5140",
    featured: false,
    createdAt: "2026-03-01",
  },
];
