"use strict";
// Wardrobe item enums for AI classification
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLOR_SYNONYMS = exports.CATEGORY_SYNONYMS = exports.FitTag = exports.SeasonTag = exports.StyleTag = exports.ColorFamily = exports.WardrobeCategory = void 0;
var WardrobeCategory;
(function (WardrobeCategory) {
    WardrobeCategory["TOP"] = "top";
    WardrobeCategory["BOTTOM"] = "bottom";
    WardrobeCategory["OUTERWEAR"] = "outerwear";
    WardrobeCategory["SHOES"] = "shoes";
    WardrobeCategory["BAG"] = "bag";
    WardrobeCategory["HAT"] = "hat";
    WardrobeCategory["ACCESSORY"] = "accessory";
})(WardrobeCategory || (exports.WardrobeCategory = WardrobeCategory = {}));
var ColorFamily;
(function (ColorFamily) {
    ColorFamily["BLACK"] = "black";
    ColorFamily["WHITE"] = "white";
    ColorFamily["GRAY"] = "gray";
    ColorFamily["NAVY"] = "navy";
    ColorFamily["BLUE"] = "blue";
    ColorFamily["GREEN"] = "green";
    ColorFamily["OLIVE"] = "olive";
    ColorFamily["BEIGE"] = "beige";
    ColorFamily["BROWN"] = "brown";
    ColorFamily["RED"] = "red";
    ColorFamily["ORANGE"] = "orange";
    ColorFamily["YELLOW"] = "yellow";
    ColorFamily["PURPLE"] = "purple";
    ColorFamily["PINK"] = "pink";
    ColorFamily["MULTICOLOR"] = "multicolor";
    ColorFamily["UNKNOWN"] = "unknown";
})(ColorFamily || (exports.ColorFamily = ColorFamily = {}));
var StyleTag;
(function (StyleTag) {
    StyleTag["CASUAL"] = "casual";
    StyleTag["SMART_CASUAL"] = "smart_casual";
    StyleTag["STREETWEAR"] = "streetwear";
    StyleTag["FORMAL"] = "formal";
    StyleTag["SPORTY"] = "sporty";
    StyleTag["LUXURY"] = "luxury";
    StyleTag["MINIMAL"] = "minimal";
    StyleTag["BUSINESS"] = "business";
    StyleTag["PARTY"] = "party";
    StyleTag["TRAVEL"] = "travel";
    StyleTag["OUTDOOR"] = "outdoor";
})(StyleTag || (exports.StyleTag = StyleTag = {}));
var SeasonTag;
(function (SeasonTag) {
    SeasonTag["SUMMER"] = "summer";
    SeasonTag["WINTER"] = "winter";
    SeasonTag["SPRING_FALL"] = "spring_fall";
    SeasonTag["ALL_SEASON"] = "all_season";
})(SeasonTag || (exports.SeasonTag = SeasonTag = {}));
var FitTag;
(function (FitTag) {
    FitTag["SLIM"] = "slim";
    FitTag["REGULAR"] = "regular";
    FitTag["RELAXED"] = "relaxed";
    FitTag["OVERSIZED"] = "oversized";
    FitTag["UNKNOWN"] = "unknown";
})(FitTag || (exports.FitTag = FitTag = {}));
// Synonym mappings for normalization
exports.CATEGORY_SYNONYMS = {
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
exports.COLOR_SYNONYMS = {
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
