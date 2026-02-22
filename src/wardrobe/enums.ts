// Wardrobe item enums for AI classification

export enum WardrobeCategory {
  TOP = 'top',
  BOTTOM = 'bottom',
  OUTERWEAR = 'outerwear',
  SHOES = 'shoes',
  BAG = 'bag',
  HAT = 'hat',
  ACCESSORY = 'accessory',
}

export enum ColorFamily {
  BLACK = 'black',
  WHITE = 'white',
  GRAY = 'gray',
  NAVY = 'navy',
  BLUE = 'blue',
  GREEN = 'green',
  OLIVE = 'olive',
  BEIGE = 'beige',
  BROWN = 'brown',
  RED = 'red',
  ORANGE = 'orange',
  YELLOW = 'yellow',
  PURPLE = 'purple',
  PINK = 'pink',
  MULTICOLOR = 'multicolor',
  UNKNOWN = 'unknown',
}

export enum StyleTag {
  CASUAL = 'casual',
  SMART_CASUAL = 'smart_casual',
  STREETWEAR = 'streetwear',
  FORMAL = 'formal',
  SPORTY = 'sporty',
  LUXURY = 'luxury',
  MINIMAL = 'minimal',
  BUSINESS = 'business',
  PARTY = 'party',
  TRAVEL = 'travel',
  OUTDOOR = 'outdoor',
}

export enum SeasonTag {
  SUMMER = 'summer',
  WINTER = 'winter',
  SPRING_FALL = 'spring_fall',
  ALL_SEASON = 'all_season',
}

export enum FitTag {
  SLIM = 'slim',
  REGULAR = 'regular',
  RELAXED = 'relaxed',
  OVERSIZED = 'oversized',
  UNKNOWN = 'unknown',
}

// Synonym mappings for normalization
export const CATEGORY_SYNONYMS: Record<string, WardrobeCategory> = {
  // Plurals / common UI labels
  tops: WardrobeCategory.TOP,
  bottoms: WardrobeCategory.BOTTOM,
  jackets: WardrobeCategory.OUTERWEAR,
  coats: WardrobeCategory.OUTERWEAR,
  shoes: WardrobeCategory.SHOES,

  // Tops
  shirt: WardrobeCategory.TOP,
  tshirt: WardrobeCategory.TOP,
  't-shirt': WardrobeCategory.TOP,
  blouse: WardrobeCategory.TOP,
  sweater: WardrobeCategory.TOP,
  hoodie: WardrobeCategory.TOP,
  tank: WardrobeCategory.TOP,
  polo: WardrobeCategory.TOP,
  dress: WardrobeCategory.TOP, // Can be debated, but treating as top for simplicity
  
  // Bottoms
  pants: WardrobeCategory.BOTTOM,
  jeans: WardrobeCategory.BOTTOM,
  trousers: WardrobeCategory.BOTTOM,
  shorts: WardrobeCategory.BOTTOM,
  skirt: WardrobeCategory.BOTTOM,
  leggings: WardrobeCategory.BOTTOM,
  
  // Outerwear
  jacket: WardrobeCategory.OUTERWEAR,
  coat: WardrobeCategory.OUTERWEAR,
  blazer: WardrobeCategory.OUTERWEAR,
  cardigan: WardrobeCategory.OUTERWEAR,
  vest: WardrobeCategory.OUTERWEAR,
  
  // Shoes
  sneakers: WardrobeCategory.SHOES,
  boots: WardrobeCategory.SHOES,
  sandals: WardrobeCategory.SHOES,
  heels: WardrobeCategory.SHOES,
  flats: WardrobeCategory.SHOES,
  loafers: WardrobeCategory.SHOES,
  
  // Accessories
  scarf: WardrobeCategory.ACCESSORY,
  belt: WardrobeCategory.ACCESSORY,
  jewelry: WardrobeCategory.ACCESSORY,
  watch: WardrobeCategory.ACCESSORY,
  sunglasses: WardrobeCategory.ACCESSORY,
  gloves: WardrobeCategory.ACCESSORY,
};

export const COLOR_SYNONYMS: Record<string, ColorFamily> = {
  // Black variations
  charcoal: ColorFamily.BLACK,
  jet: ColorFamily.BLACK,
  ebony: ColorFamily.BLACK,
  
  // White variations
  cream: ColorFamily.WHITE,
  ivory: ColorFamily.WHITE,
  pearl: ColorFamily.WHITE,
  
  // Gray variations
  grey: ColorFamily.GRAY,
  silver: ColorFamily.GRAY,
  slate: ColorFamily.GRAY,
  
  // Navy variations
  'dark blue': ColorFamily.NAVY,
  'midnight blue': ColorFamily.NAVY,
  
  // Blue variations
  azure: ColorFamily.BLUE,
  cerulean: ColorFamily.BLUE,
  cobalt: ColorFamily.BLUE,
  cyan: ColorFamily.BLUE,
  turquoise: ColorFamily.BLUE,
  
  // Green variations
  emerald: ColorFamily.GREEN,
  jade: ColorFamily.GREEN,
  lime: ColorFamily.GREEN,
  mint: ColorFamily.GREEN,
  
  // Olive variations
  khaki: ColorFamily.OLIVE,
  army: ColorFamily.OLIVE,
  
  // Beige variations
  tan: ColorFamily.BEIGE,
  sand: ColorFamily.BEIGE,
  nude: ColorFamily.BEIGE,
  camel: ColorFamily.BEIGE,
  
  // Brown variations
  chocolate: ColorFamily.BROWN,
  coffee: ColorFamily.BROWN,
  mocha: ColorFamily.BROWN,
  
  // Red variations
  crimson: ColorFamily.RED,
  scarlet: ColorFamily.RED,
  burgundy: ColorFamily.RED,
  maroon: ColorFamily.RED,
  
  // Orange variations
  coral: ColorFamily.ORANGE,
  peach: ColorFamily.ORANGE,
  rust: ColorFamily.ORANGE,
  
  // Yellow variations
  gold: ColorFamily.YELLOW,
  mustard: ColorFamily.YELLOW,
  lemon: ColorFamily.YELLOW,
  
  // Purple variations
  violet: ColorFamily.PURPLE,
  lavender: ColorFamily.PURPLE,
  plum: ColorFamily.PURPLE,
  
  // Pink variations
  rose: ColorFamily.PINK,
  blush: ColorFamily.PINK,
  magenta: ColorFamily.PINK,
  
  // Multi/pattern
  patterned: ColorFamily.MULTICOLOR,
  striped: ColorFamily.MULTICOLOR,
  plaid: ColorFamily.MULTICOLOR,
  floral: ColorFamily.MULTICOLOR,
};





