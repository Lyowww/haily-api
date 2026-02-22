"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WardrobeRecognitionService = void 0;
exports.recognizeWardrobeItem = recognizeWardrobeItem;
var openai_1 = require("openai");
var enums_1 = require("./enums");
var WardrobeRecognitionService = /** @class */ (function () {
    function WardrobeRecognitionService(openai) {
        this.openai = openai;
    }
    WardrobeRecognitionService.prototype.recognizeWardrobeItem = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var imageUrl, categoryHint, notes, prompt, imageData, fs, path, filename, filepath, imageBuffer, base64Image, response, rawResponse, parsedData, normalized, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        imageUrl = input.imageUrl, categoryHint = input.categoryHint, notes = input.notes;
                        prompt = this.buildRecognitionPrompt(categoryHint, notes);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        imageData = void 0;
                        if (imageUrl.startsWith('http://localhost') || imageUrl.startsWith('http://127.0.0.1')) {
                            fs = require('fs');
                            path = require('path');
                            filename = imageUrl.split('/').pop();
                            filepath = path.join(process.cwd(), 'uploads', filename);
                            console.log('📷 Converting local image to base64:', filepath);
                            imageBuffer = fs.readFileSync(filepath);
                            if (!imageBuffer || imageBuffer.length === 0) {
                                throw new Error("Local upload is empty (0 bytes): ".concat(filepath));
                            }
                            base64Image = imageBuffer.toString('base64');
                            imageData = "data:image/jpeg;base64,".concat(base64Image);
                            console.log('✓ Image converted to base64 (length:', base64Image.length, 'chars)');
                        }
                        else {
                            // Use URL directly for public URLs
                            imageData = imageUrl;
                        }
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: 'gpt-4o', // Latest vision model
                                messages: [
                                    {
                                        role: 'user',
                                        content: [
                                            {
                                                type: 'text',
                                                text: prompt,
                                            },
                                            {
                                                type: 'image_url',
                                                image_url: {
                                                    url: imageData,
                                                },
                                            },
                                        ],
                                    },
                                ],
                                max_tokens: 500,
                                temperature: 0.3, // Lower temperature for more consistent classification
                            })];
                    case 2:
                        response = _c.sent();
                        rawResponse = ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '';
                        parsedData = this.parseAIResponse(rawResponse);
                        normalized = this.normalizeToEnums(parsedData, categoryHint);
                        return [2 /*return*/, __assign(__assign({}, normalized), { notes: notes || '' })];
                    case 3:
                        error_1 = _c.sent();
                        console.error('Error recognizing wardrobe item:', error_1);
                        // Fallback to unknown values
                        return [2 /*return*/, {
                                category: categoryHint ? this.normalizeCategory(categoryHint) : enums_1.WardrobeCategory.ACCESSORY,
                                colorFamily: enums_1.ColorFamily.UNKNOWN,
                                styleTags: [],
                                seasonTags: [enums_1.SeasonTag.ALL_SEASON],
                                fitTag: enums_1.FitTag.UNKNOWN,
                                extraTags: [],
                                confidence: {
                                    category: 0.1,
                                    color: 0.1,
                                    style: 0.1,
                                },
                                notes: "Recognition failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)),
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WardrobeRecognitionService.prototype.buildRecognitionPrompt = function (categoryHint, userNotes) {
        var hintContext = categoryHint
            ? "The user indicated this might be a: ".concat(categoryHint, ". Use this as a hint if the image is ambiguous.")
            : '';
        var notesContext = userNotes
            ? "User notes: ".concat(userNotes)
            : '';
        return "You are a fashion classification AI. Analyze this clothing/accessory image and return ONLY a valid JSON object with the following structure:\n\n{\n  \"category\": \"one of: top, bottom, outerwear, shoes, bag, hat, accessory\",\n  \"color_family\": \"one of: black, white, gray, navy, blue, green, olive, beige, brown, red, orange, yellow, purple, pink, multicolor, unknown\",\n  \"color_hex\": \"optional hex code like #FF5733\",\n  \"style_tags\": [\"array of: casual, smart_casual, streetwear, formal, sporty, luxury, minimal, business, party, travel, outdoor\"],\n  \"season_tags\": [\"array of: summer, winter, spring_fall, all_season\"],\n  \"fit_tag\": \"one of: slim, regular, relaxed, oversized, unknown\",\n  \"extra_tags\": [\"array of descriptive strings like 'v-neck', 'button-down', 'leather', etc.\"],\n  \"confidence\": {\n    \"category\": 0.0-1.0,\n    \"color\": 0.0-1.0,\n    \"style\": 0.0-1.0\n  }\n}\n\nRULES:\n- If multiple items are visible, focus on the PRIMARY/MAIN item and lower confidence scores\n- All enum values must be lowercase with underscores\n- Return ONLY valid JSON, no markdown or explanation\n- If uncertain, use \"unknown\" or \"accessory\" for category\n- For confidence: 1.0 = certain, 0.5 = moderate, 0.2 = guessing\n- Reject explicit/inappropriate images by returning category: \"accessory\", confidence: 0.0\n\n".concat(hintContext, "\n").concat(notesContext);
    };
    WardrobeRecognitionService.prototype.parseAIResponse = function (rawResponse) {
        try {
            // Remove markdown code blocks if present
            var cleaned = rawResponse
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            return JSON.parse(cleaned);
        }
        catch (error) {
            console.error('Failed to parse AI response:', rawResponse);
            throw new Error('Invalid JSON response from AI');
        }
    };
    WardrobeRecognitionService.prototype.normalizeToEnums = function (data, categoryHint) {
        var _this = this;
        var _a, _b, _c, _d;
        // Normalize category
        var category = this.normalizeCategory(data.category, categoryHint);
        var categoryConfidence = ((_a = data.confidence) === null || _a === void 0 ? void 0 : _a.category) || 0.5;
        // If confidence is low and hint is provided, prefer the hint
        if (categoryHint && categoryConfidence < 0.6) {
            var hintCategory = this.normalizeCategory(categoryHint);
            if (hintCategory !== enums_1.WardrobeCategory.ACCESSORY) {
                category = hintCategory;
            }
        }
        // Normalize color
        var colorFamily = this.normalizeColor(data.color_family);
        // Normalize style tags
        var styleTags = Array.isArray(data.style_tags)
            ? data.style_tags
                .map(function (tag) { return _this.normalizeStyleTag(tag); })
                .filter(function (tag) { return tag !== null; })
            : [];
        // Normalize season tags
        var seasonTags = Array.isArray(data.season_tags)
            ? data.season_tags
                .map(function (tag) { return _this.normalizeSeasonTag(tag); })
                .filter(function (tag) { return tag !== null; })
            : [enums_1.SeasonTag.ALL_SEASON];
        // Normalize fit tag
        var fitTag = this.normalizeFitTag(data.fit_tag);
        // Extra tags - keep as strings, just lowercase and trim
        var extraTags = Array.isArray(data.extra_tags)
            ? data.extra_tags.map(function (tag) { return String(tag).toLowerCase().trim(); })
            : [];
        return {
            category: category,
            colorFamily: colorFamily,
            colorHex: data.color_hex || undefined,
            styleTags: styleTags,
            seasonTags: seasonTags,
            fitTag: fitTag,
            extraTags: extraTags,
            confidence: {
                category: Math.max(0, Math.min(1, ((_b = data.confidence) === null || _b === void 0 ? void 0 : _b.category) || 0.5)),
                color: Math.max(0, Math.min(1, ((_c = data.confidence) === null || _c === void 0 ? void 0 : _c.color) || 0.5)),
                style: Math.max(0, Math.min(1, ((_d = data.confidence) === null || _d === void 0 ? void 0 : _d.style) || 0.5)),
            },
        };
    };
    WardrobeRecognitionService.prototype.normalizeCategory = function (value, _hint) {
        if (!value)
            return enums_1.WardrobeCategory.ACCESSORY;
        var normalized = value.toLowerCase().trim();
        // Check if it's already a valid enum
        if (Object.values(enums_1.WardrobeCategory).includes(normalized)) {
            return normalized;
        }
        // Check synonyms
        if (enums_1.CATEGORY_SYNONYMS[normalized]) {
            return enums_1.CATEGORY_SYNONYMS[normalized];
        }
        // Default to accessory
        return enums_1.WardrobeCategory.ACCESSORY;
    };
    WardrobeRecognitionService.prototype.normalizeColor = function (value) {
        if (!value)
            return enums_1.ColorFamily.UNKNOWN;
        var normalized = value.toLowerCase().trim();
        // Check if it's already a valid enum
        if (Object.values(enums_1.ColorFamily).includes(normalized)) {
            return normalized;
        }
        // Check synonyms
        if (enums_1.COLOR_SYNONYMS[normalized]) {
            return enums_1.COLOR_SYNONYMS[normalized];
        }
        // Default to unknown
        return enums_1.ColorFamily.UNKNOWN;
    };
    WardrobeRecognitionService.prototype.normalizeStyleTag = function (value) {
        if (!value)
            return null;
        var normalized = value.toLowerCase().trim().replace(/[-\s]/g, '_');
        // Check if it's a valid enum
        if (Object.values(enums_1.StyleTag).includes(normalized)) {
            return normalized;
        }
        return null;
    };
    WardrobeRecognitionService.prototype.normalizeSeasonTag = function (value) {
        if (!value)
            return null;
        var normalized = value.toLowerCase().trim().replace(/[-\s]/g, '_');
        // Check if it's a valid enum
        if (Object.values(enums_1.SeasonTag).includes(normalized)) {
            return normalized;
        }
        // Handle common variations
        if (normalized.includes('spring') || normalized.includes('fall') || normalized.includes('autumn')) {
            return enums_1.SeasonTag.SPRING_FALL;
        }
        return null;
    };
    WardrobeRecognitionService.prototype.normalizeFitTag = function (value) {
        if (!value)
            return enums_1.FitTag.UNKNOWN;
        var normalized = value.toLowerCase().trim();
        // Check if it's a valid enum
        if (Object.values(enums_1.FitTag).includes(normalized)) {
            return normalized;
        }
        // Handle common variations
        if (normalized.includes('tight') || normalized.includes('fitted')) {
            return enums_1.FitTag.SLIM;
        }
        if (normalized.includes('loose') || normalized.includes('baggy')) {
            return enums_1.FitTag.RELAXED;
        }
        if (normalized.includes('oversized') || normalized.includes('over-sized')) {
            return enums_1.FitTag.OVERSIZED;
        }
        return enums_1.FitTag.UNKNOWN;
    };
    return WardrobeRecognitionService;
}());
exports.WardrobeRecognitionService = WardrobeRecognitionService;
// Standalone function for easy import
function recognizeWardrobeItem(imageUrl, categoryHint, notes) {
    return __awaiter(this, void 0, void 0, function () {
        var openaiApiKey, openai, service;
        return __generator(this, function (_a) {
            openaiApiKey = process.env.OPENAI_API_KEY;
            if (!openaiApiKey) {
                console.error('⚠️ OPENAI_API_KEY not configured - using fallback metadata');
                // Return fallback metadata without calling API
                return [2 /*return*/, {
                        category: categoryHint || 'accessory',
                        colorFamily: 'unknown',
                        styleTags: [],
                        seasonTags: ['all_season'],
                        fitTag: 'unknown',
                        extraTags: [],
                        confidence: { category: 0, color: 0, style: 0 },
                        notes: 'Recognition skipped - API key not configured',
                    }];
            }
            openai = new openai_1.default({ apiKey: openaiApiKey });
            service = new WardrobeRecognitionService(openai);
            return [2 /*return*/, service.recognizeWardrobeItem({ imageUrl: imageUrl, categoryHint: categoryHint, notes: notes })];
        });
    });
}
