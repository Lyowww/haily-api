"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
var common_1 = require("@nestjs/common");
var openai_1 = require("openai");
var fs = require("fs");
var path = require("path");
var https = require("https");
var http = require("http");
var sharp_1 = require("sharp");
var cutout_service_1 = require("../cutout/cutout.service");
var AIService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AIService = _classThis = /** @class */ (function () {
        function AIService_1(configService) {
            this.configService = configService;
            this.cutoutService = new cutout_service_1.CutoutService();
            this.openai = new openai_1.default({
                apiKey: this.configService.openAiApiKey,
            });
        }
        /**
         * Adds padding around image to prevent model cropping
         * @param inputBuffer Image buffer
         * @param padPercent Padding percentage (0.2 = 20% on each side)
         */
        AIService_1.prototype.padImageToSafeFrame = function (inputBuffer_1) {
            return __awaiter(this, arguments, void 0, function (inputBuffer, padPercent) {
                var img, meta, padX, padY, padded, error_1;
                if (padPercent === void 0) { padPercent = 0.2; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            img = (0, sharp_1.default)(inputBuffer);
                            return [4 /*yield*/, img.metadata()];
                        case 1:
                            meta = _a.sent();
                            if (!meta.width || !meta.height) {
                                throw new Error('Invalid image metadata');
                            }
                            padX = Math.round(meta.width * padPercent);
                            padY = Math.round(meta.height * padPercent);
                            return [4 /*yield*/, img
                                    .extend({
                                    top: padY,
                                    bottom: padY,
                                    left: padX,
                                    right: padX,
                                    background: { r: 230, g: 230, b: 230, alpha: 1 },
                                })
                                    .png()
                                    .toBuffer()];
                        case 2:
                            padded = _a.sent();
                            console.log("\u2705 Added ".concat(padPercent * 100, "% padding to prevent cropping"));
                            return [2 /*return*/, padded];
                        case 3:
                            error_1 = _a.sent();
                            console.error('❌ Error padding image:', error_1);
                            // Return original if padding fails
                            return [2 /*return*/, inputBuffer];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Convert URL to local buffer and detect mime type
         */
        AIService_1.prototype.resolveLocalUploadsPath = function (imageUrl) {
            if (!imageUrl || typeof imageUrl !== 'string')
                return null;
            // Direct relative path stored in DB, e.g. "/uploads/abc.png"
            if (imageUrl.startsWith('/uploads/')) {
                return imageUrl;
            }
            // Absolute URL from any host/IP that still points to local uploads.
            // This prevents failures when records contain stale LAN IPs.
            try {
                var parsed = new URL(imageUrl);
                if (parsed.pathname.startsWith('/uploads/')) {
                    return parsed.pathname;
                }
            }
            catch (_a) {
                // Not a valid URL; treat as non-local.
            }
            return null;
        };
        AIService_1.prototype.readImageBuffer = function (imageUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var localUploadsPath, filepath, buffer, mimeType;
                return __generator(this, function (_a) {
                    try {
                        localUploadsPath = this.resolveLocalUploadsPath(imageUrl);
                        if (localUploadsPath) {
                            filepath = path.join(process.cwd(), localUploadsPath.replace(/^\/+/, ''));
                            console.log('📁 Reading local file:', filepath);
                            buffer = fs.readFileSync(filepath);
                            if (!buffer || buffer.length === 0) {
                                throw new Error("Local image file is empty (0 bytes): ".concat(filepath));
                            }
                            mimeType = filepath.endsWith('.png') ? 'image/png' : 'image/jpeg';
                            return [2 /*return*/, { buffer: buffer, mimeType: mimeType }];
                        }
                        else {
                            // Remote URL - download it first
                            return [2 /*return*/, new Promise(function (resolve, reject) {
                                    var protocol = imageUrl.startsWith('https') ? https : http;
                                    var req = protocol.get(imageUrl, function (response) {
                                        var _a;
                                        if (!response.statusCode || response.statusCode >= 400) {
                                            reject(new Error("Failed to download image (".concat((_a = response.statusCode) !== null && _a !== void 0 ? _a : 'unknown', ") from ").concat(imageUrl)));
                                            return;
                                        }
                                        var chunks = [];
                                        response.on('data', function (chunk) { return chunks.push(chunk); });
                                        response.on('end', function () {
                                            var buffer = Buffer.concat(chunks);
                                            var mimeType = response.headers['content-type'] || 'image/jpeg';
                                            resolve({ buffer: buffer, mimeType: mimeType });
                                        });
                                    });
                                    req.setTimeout(15000, function () {
                                        req.destroy(new Error("Timeout downloading image from ".concat(imageUrl)));
                                    });
                                    req.on('error', reject);
                                })];
                        }
                    }
                    catch (error) {
                        console.error('❌ Error reading image buffer:', error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Convert URL to File object for OpenAI API
         */
        AIService_1.prototype.urlToFile = function (imageUrl_1, filename_1) {
            return __awaiter(this, arguments, void 0, function (imageUrl, filename, addPadding) {
                var read, preparedBuffer, _a, _b, _c, meta, blob, file;
                if (addPadding === void 0) { addPadding = false; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.readImageBuffer(imageUrl)];
                        case 1:
                            read = _d.sent();
                            if (!addPadding) return [3 /*break*/, 3];
                            _c = (_b = Buffer).from;
                            return [4 /*yield*/, this.padImageToSafeFrame(read.buffer, 0.2)];
                        case 2:
                            _a = _c.apply(_b, [_d.sent()]);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = read.buffer;
                            _d.label = 4;
                        case 4:
                            preparedBuffer = _a;
                            return [4 /*yield*/, (0, sharp_1.default)(preparedBuffer).metadata()];
                        case 5:
                            meta = _d.sent();
                            if (!meta.width || !meta.height) {
                                throw new Error('Invalid image dimensions');
                            }
                            blob = new Blob([preparedBuffer], { type: read.mimeType });
                            file = new File([blob], filename, { type: read.mimeType });
                            return [2 /*return*/, { file: file, width: meta.width, height: meta.height }];
                    }
                });
            });
        };
        /**
         * Build edit mask:
         * - Lock head/face area (opaque) for 1:1 likeness preservation.
         * - Allow body area (transparent) so pose can be adjusted to standing.
         */
        AIService_1.prototype.buildPoseEditMask = function (width, height) {
            return __awaiter(this, void 0, void 0, function () {
                var region, editable, svgRects, svg, maskBuffer, blob;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            region = function (x, y, w, h) { return ({
                                x: Math.round(width * x),
                                y: Math.round(height * y),
                                w: Math.round(width * w),
                                h: Math.round(height * h),
                            }); };
                            editable = [
                                region(0.06, 0.20, 0.88, 0.76), // full body below head for standing pose adjustment
                            ];
                            svgRects = editable
                                .map(function (r) {
                                return "<rect x=\"".concat(r.x, "\" y=\"").concat(r.y, "\" width=\"").concat(r.w, "\" height=\"").concat(r.h, "\" fill=\"rgba(255,255,255,0)\"/>");
                            })
                                .join('');
                            svg = "<svg width=\"".concat(width, "\" height=\"").concat(height, "\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect width=\"").concat(width, "\" height=\"").concat(height, "\" fill=\"rgba(0,0,0,1)\"/>\n").concat(svgRects, "\n</svg>");
                            return [4 /*yield*/, (0, sharp_1.default)(Buffer.from(svg)).png().toBuffer()];
                        case 1:
                            maskBuffer = _a.sent();
                            blob = new Blob([maskBuffer], { type: 'image/png' });
                            // @ts-ignore - File constructor available in Node 18+
                            return [2 /*return*/, new File([blob], 'edit-mask.png', { type: 'image/png' })];
                    }
                });
            });
        };
        /**
         * Download image from URL and save to local storage
         */
        AIService_1.prototype.downloadAndSaveImage = function (imageUrl, filename) {
            return __awaiter(this, void 0, void 0, function () {
                var uploadsDir, filepath, file;
                return __generator(this, function (_a) {
                    uploadsDir = path.join(process.cwd(), 'uploads', 'generated');
                    // Create directory if it doesn't exist
                    if (!fs.existsSync(uploadsDir)) {
                        fs.mkdirSync(uploadsDir, { recursive: true });
                    }
                    filepath = path.join(uploadsDir, filename);
                    file = fs.createWriteStream(filepath);
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var protocol = imageUrl.startsWith('https') ? https : http;
                            protocol.get(imageUrl, function (response) {
                                response.pipe(file);
                                file.on('finish', function () {
                                    file.close();
                                    // Return the URL path that can be accessed via the API
                                    resolve("/uploads/generated/".concat(filename));
                                });
                            }).on('error', function (err) {
                                fs.unlink(filepath, function () { }); // Delete the file if error
                                reject(err);
                            });
                        })];
                });
            });
        };
        /**
         * Generate outfit image using DALL-E 3
         */
        AIService_1.prototype.generateOutfitImage = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var isTop_1, isBottom_1, isShoes_1, topItem, bottomItem, shoesItem, personPrepared, editMask, imageFiles, topFile, bottomFile, shoesFile, imageIndex, personIndex, topIndex, bottomIndex, shoesIndex, styleContext, prompt_1, response, imageUrl, imageB64, filename, localPath, uploadsDir, filepath, buffer, finalPath, cutout, e_1, fullLocalPath, error_2;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            _e.trys.push([0, 17, , 18]);
                            console.log('🎨 Starting Virtual Try-On with gpt-image-1...');
                            console.log('📦 Received clothing items:', request.clothingItems.map(function (item) { return ({
                                category: item.category,
                                id: item.id,
                                url: item.imageUrl
                            }); }));
                            isTop_1 = function (c) { return ['top', 'tops', 'outerwear', 'jacket', 'jackets', 'coat', 'coats'].includes(c); };
                            isBottom_1 = function (c) { return ['bottom', 'bottoms', 'pants', 'jeans', 'trousers', 'shorts', 'skirt'].includes(c); };
                            isShoes_1 = function (c) { return ['shoes', 'shoe', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers'].includes(c); };
                            topItem = request.clothingItems.find(function (item) { return isTop_1(item.category); });
                            bottomItem = request.clothingItems.find(function (item) { return isBottom_1(item.category); });
                            shoesItem = request.clothingItems.find(function (item) { return isShoes_1(item.category); });
                            // const weatherTemp = request.weather?.temperature ?? 22;
                            // const weatherCondition = request.weather?.condition ?? 'clear';
                            // const userSex = request.user?.sex;
                            // const userAge = request.user?.age;
                            // const userHeightCm = request.user?.heightCm;
                            console.log('User photo URL:', request.userPhotoUrl);
                            console.log('✅ Top item:', topItem ? topItem.imageUrl : '❌ NOT FOUND');
                            console.log('✅ Bottom item:', bottomItem ? bottomItem.imageUrl : '❌ NOT FOUND');
                            console.log('✅ Shoes item:', shoesItem ? shoesItem.imageUrl : '❌ NOT FOUND');
                            if (!topItem && !bottomItem && !shoesItem) {
                                throw new Error('No valid clothing items found. Please ensure items have correct categories: tops, bottoms, shoes');
                            }
                            return [4 /*yield*/, this.urlToFile(request.userPhotoUrl, 'person.png', true)];
                        case 1:
                            personPrepared = _e.sent();
                            return [4 /*yield*/, this.buildPoseEditMask(personPrepared.width, personPrepared.height)];
                        case 2:
                            editMask = _e.sent();
                            imageFiles = [personPrepared.file];
                            if (!topItem) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.urlToFile(topItem.imageUrl, 'top.png', false)];
                        case 3:
                            topFile = _e.sent();
                            imageFiles.push(topFile.file);
                            _e.label = 4;
                        case 4:
                            if (!bottomItem) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.urlToFile(bottomItem.imageUrl, 'bottom.png', false)];
                        case 5:
                            bottomFile = _e.sent();
                            imageFiles.push(bottomFile.file);
                            _e.label = 6;
                        case 6:
                            if (!shoesItem) return [3 /*break*/, 8];
                            return [4 /*yield*/, this.urlToFile(shoesItem.imageUrl, 'shoes.png', false)];
                        case 7:
                            shoesFile = _e.sent();
                            imageFiles.push(shoesFile.file);
                            _e.label = 8;
                        case 8:
                            console.log("\uD83D\uDCF8 Sending ".concat(imageFiles.length, " images to OpenAI (person + ").concat(imageFiles.length - 1, " clothing items)"));
                            imageIndex = 0;
                            personIndex = imageIndex++;
                            topIndex = topItem ? imageIndex++ : -1;
                            bottomIndex = bottomItem ? imageIndex++ : -1;
                            shoesIndex = shoesItem ? imageIndex++ : -1;
                            styleContext = typeof request.stylePrompt === 'string' ? request.stylePrompt.trim() : '';
                            prompt_1 = "MODE: Constrained inpainting.\nThis is NOT generation.\nThis is NOT recreation.\nThis is NOT reinterpretation.\n\nSOURCE OF TRUTH:\nimage[".concat(personIndex, "] (person.png) is the immutable base image.\n\nHARD CONSTRAINT:\nAll pixels outside the transparent clothing mask MUST remain 100% identical to image[").concat(personIndex, "].\nZero modification allowed outside mask.\nDo not redraw.\nDo not regenerate.\nDo not enhance.\nDo not beautify.\nDo not restyle.\n\nIDENTITY FREEZE (NON-NEGOTIABLE):\nThe following must remain pixel-identical to the source image:\n- Face (all facial features)\n- Head shape\n- Hair (shape, volume, color)\n- Skin tone and texture\n- Neck\n- Hands\n- Arms\n- Legs\n- Body proportions\n- Silhouette outline\n\nDo NOT modify:\n- Jawline\n- Cheeks\n- Nose\n- Eyes\n- Lips\n- Body width\n- Shoulder width\n- Waist width\n- Hip width\n- Limb thickness\n- Height proportions\n\nNO GEOMETRY CHANGES:\nDo not change pose geometry.\nDo not re-pose skeleton.\nDo not re-estimate anatomy.\nThe body structure must remain identical to source.\n\nONLY PERMITTED OPERATION:\nReplace pixels inside the clothing mask region with the exact garments from reference images:\n\n").concat(topIndex >= 0 ? "- image[".concat(topIndex, "] (top.png)") : '', "\n").concat(bottomIndex >= 0 ? "- image[".concat(bottomIndex, "] (bottom.png)") : '', "\n").concat(shoesIndex >= 0 ? "- image[".concat(shoesIndex, "] (shoes.png)") : '', "\n\nGARMENT RULES:\n- Use exact garment appearance.\n- Preserve color exactly.\n- Preserve material and texture exactly.\n- Preserve cut and length exactly.\n- Do not redesign or reinterpret.\n- Do not stylize.\n\nPROHIBITED:\n- Do NOT generate a new person.\n- Do NOT adjust lighting on skin.\n- Do NOT smooth skin.\n- Do NOT slim body.\n- Do NOT reshape face.\n- Do NOT re-render head.\n- Do NOT adjust camera framing.\n- Do NOT zoom.\n- Do NOT crop.\n\nOUTPUT:\n- Same person\n- Same proportions\n- Same framing\n- Only clothing replaced inside mask\n- PNG output\n\n").concat(styleContext ? "STYLE CONTEXT (FOLLOW AS A SECONDARY CONSTRAINT):\n".concat(styleContext, "\nOnly apply style choices that are compatible with exact garment fidelity and identity freeze rules.") : '', "\n").trim();
                            console.log('📤 Calling OpenAI images.edit with gpt-image-1...');
                            console.log('📋 Prompt:', prompt_1);
                            return [4 /*yield*/, this.openai.images.edit({
                                    model: 'gpt-image-1',
                                    image: imageFiles, // Array of File objects
                                    mask: editMask,
                                    prompt: prompt_1,
                                    size: '1024x1536', // Portrait for full-body (not square to prevent cropping)
                                    n: 1,
                                })];
                        case 9:
                            response = _e.sent();
                            console.log('OpenAI Response received');
                            imageUrl = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url;
                            imageB64 = (_d = (_c = response.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.b64_json;
                            if (!imageUrl && !imageB64) {
                                console.error('No image URL or base64 in response. Full response:', JSON.stringify(response, null, 2));
                                throw new Error('Failed to generate image - no URL or base64 in OpenAI response');
                            }
                            filename = "outfit-".concat(Date.now(), ".png");
                            localPath = '';
                            if (!imageB64) return [3 /*break*/, 10];
                            // Save base64 image directly to disk
                            console.log('Image received as base64, saving to disk...');
                            uploadsDir = path.join(process.cwd(), 'uploads', 'generated');
                            if (!fs.existsSync(uploadsDir)) {
                                fs.mkdirSync(uploadsDir, { recursive: true });
                            }
                            filepath = path.join(uploadsDir, filename);
                            buffer = Buffer.from(imageB64, 'base64');
                            fs.writeFileSync(filepath, buffer);
                            localPath = "/uploads/generated/".concat(filename);
                            console.log('Base64 image saved locally at:', localPath);
                            return [3 /*break*/, 12];
                        case 10:
                            if (!imageUrl) return [3 /*break*/, 12];
                            // Download from URL
                            console.log('Image generated, downloading from URL...');
                            return [4 /*yield*/, this.downloadAndSaveImage(imageUrl, filename)];
                        case 11:
                            localPath = _e.sent();
                            console.log('Image saved locally at:', localPath);
                            _e.label = 12;
                        case 12:
                            finalPath = localPath;
                            _e.label = 13;
                        case 13:
                            _e.trys.push([13, 15, , 16]);
                            return [4 /*yield*/, this.cutoutService.generateCutoutForImageUrl(localPath)];
                        case 14:
                            cutout = _e.sent();
                            if (cutout === null || cutout === void 0 ? void 0 : cutout.cutoutUrl) {
                                finalPath = cutout.cutoutUrl;
                                console.log('✅ Generated transparent cutout:', finalPath);
                            }
                            return [3 /*break*/, 16];
                        case 15:
                            e_1 = _e.sent();
                            console.warn('Cutout post-process failed, using original generated PNG.');
                            return [3 /*break*/, 16];
                        case 16:
                            fullLocalPath = finalPath.startsWith('http') ? finalPath : "http://localhost:3000".concat(finalPath);
                            console.log('✅ Generated outfit image at:', fullLocalPath);
                            return [2 /*return*/, {
                                    imageUrl: fullLocalPath, // Always return localhost URL
                                    localPath: fullLocalPath, // Same URL for consistency
                                    prompt: prompt_1,
                                }];
                        case 17:
                            error_2 = _e.sent();
                            console.error('Error generating outfit image:', error_2);
                            throw error_2;
                        case 18: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Alternative: Use image editing API to composite outfit onto user photo
         * This provides better identity preservation
         */
        AIService_1.prototype.generateOutfitComposite = function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var clothingDescriptions, weatherContext, finalPrompt, response, imageUrl, error_3;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 2, , 3]);
                            clothingDescriptions = request.clothingItems
                                .map(function (item) { return "".concat(item.category); })
                                .join(', ');
                            weatherContext = request.weather
                                ? "Weather: ".concat(request.weather.condition, ", ").concat(request.weather.temperature, "\u00B0C. ")
                                : '';
                            finalPrompt = "Full body fashion photograph of a person wearing ".concat(clothingDescriptions, ". ").concat(weatherContext, "Professional studio lighting, realistic fabric drape and shadows, plain white background, high fashion editorial style, photorealistic, 4K quality.");
                            return [4 /*yield*/, this.openai.images.generate({
                                    model: 'gpt-image-1.5',
                                    prompt: finalPrompt,
                                    n: 1,
                                    size: '1024x1536', // Portrait format for full body
                                    quality: 'high', // Highest quality for better face preservation
                                })];
                        case 1:
                            response = _c.sent();
                            imageUrl = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url;
                            if (!imageUrl) {
                                throw new Error('Failed to generate image');
                            }
                            return [2 /*return*/, { imageUrl: imageUrl }];
                        case 2:
                            error_3 = _c.sent();
                            console.error('Error generating outfit composite:', error_3);
                            throw error_3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Analyze wardrobe completeness based on weather conditions
         */
        AIService_1.prototype.analyzeWardrobe = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var items, weather, missingItems, recommendations, categoryCounts, hasJackets, hasTops, hasBottoms, hasShoes;
                return __generator(this, function (_a) {
                    items = dto.items, weather = dto.weather;
                    missingItems = [];
                    recommendations = [];
                    categoryCounts = items.reduce(function (acc, item) {
                        var category = item.category.toLowerCase();
                        acc[category] = (acc[category] || 0) + 1;
                        return acc;
                    }, {});
                    hasJackets = (categoryCounts['jackets'] || 0) > 0 || (categoryCounts['jacket'] || 0) > 0;
                    hasTops = (categoryCounts['tops'] || 0) > 0 || (categoryCounts['top'] || 0) > 0;
                    hasBottoms = (categoryCounts['bottoms'] || 0) > 0 || (categoryCounts['bottom'] || 0) > 0;
                    hasShoes = (categoryCounts['shoes'] || 0) > 0 || (categoryCounts['shoe'] || 0) > 0;
                    // Weather-based validation
                    if (weather.temperature < 10) {
                        if (!hasJackets) {
                            missingItems.push('jacket');
                            recommendations.push("It's ".concat(weather.temperature, "\u00B0C outside. You'll need a warm jacket or coat for cold weather."));
                        }
                    }
                    if (weather.temperature < 0) {
                        recommendations.push('Freezing temperatures detected. Consider adding winter accessories like scarves, gloves, and thermal layers.');
                    }
                    if (weather.temperature > 25) {
                        recommendations.push("Hot weather (".concat(weather.temperature, "\u00B0C). Light, breathable fabrics are recommended."));
                    }
                    if (weather.condition.toLowerCase().includes('rain')) {
                        recommendations.push('Rainy conditions detected. A waterproof jacket or raincoat would be ideal.');
                    }
                    if (weather.condition.toLowerCase().includes('snow')) {
                        if (!hasJackets) {
                            missingItems.push('winter jacket');
                        }
                        recommendations.push('Snowy weather requires insulated outerwear and waterproof boots.');
                    }
                    // Basic wardrobe validation
                    if (!hasTops) {
                        missingItems.push('tops');
                        recommendations.push('Add at least one top (shirt, t-shirt, or blouse).');
                    }
                    if (!hasBottoms) {
                        missingItems.push('bottoms');
                        recommendations.push('Add at least one bottom (pants, jeans, or skirt).');
                    }
                    if (!hasShoes) {
                        missingItems.push('shoes');
                        recommendations.push('Add at least one pair of shoes.');
                    }
                    return [2 /*return*/, {
                            isComplete: missingItems.length === 0,
                            missingItems: missingItems,
                            recommendations: recommendations.length > 0
                                ? recommendations
                                : ["Your wardrobe looks great for ".concat(weather.temperature, "\u00B0C weather!")],
                        }];
                });
            });
        };
        return AIService_1;
    }());
    __setFunctionName(_classThis, "AIService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AIService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AIService = _classThis;
}();
exports.AIService = AIService;
