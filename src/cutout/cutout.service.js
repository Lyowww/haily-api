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
exports.CutoutService = void 0;
var common_1 = require("@nestjs/common");
var background_removal_node_1 = require("@imgly/background-removal-node");
var fs = require("fs/promises");
var path = require("path");
var sharp_1 = require("sharp");
var uuid_1 = require("uuid");
var CutoutService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CutoutService = _classThis = /** @class */ (function () {
        function CutoutService_1() {
            this.logger = new common_1.Logger(CutoutService.name);
        }
        /**
         * Generate a transparent PNG cutout for an uploaded image and store it under /uploads/cutouts.
         * Accepts either a relative "/uploads/..." URL or a full URL that contains "/uploads/...".
         */
        CutoutService_1.prototype.generateCutoutForImageUrl = function (imageUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var uploadsPathname, inputAbsPath, inputBuffer, blob, pngBuffer, _a, _b, cutoutsDirAbs, filename, outputAbsPath, err_1;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            uploadsPathname = this.extractUploadsPathname(imageUrl);
                            if (!uploadsPathname)
                                return [2 /*return*/, null];
                            inputAbsPath = path.join(process.cwd(), uploadsPathname.replace(/^\//, ''));
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 7, , 8]);
                            return [4 /*yield*/, fs.readFile(inputAbsPath)];
                        case 2:
                            inputBuffer = _c.sent();
                            return [4 /*yield*/, (0, background_removal_node_1.removeBackground)(inputBuffer)];
                        case 3:
                            blob = _c.sent();
                            _b = (_a = Buffer).from;
                            return [4 /*yield*/, blob.arrayBuffer()];
                        case 4:
                            pngBuffer = _b.apply(_a, [_c.sent()]);
                            cutoutsDirAbs = path.join(process.cwd(), 'uploads', 'cutouts');
                            return [4 /*yield*/, fs.mkdir(cutoutsDirAbs, { recursive: true })];
                        case 5:
                            _c.sent();
                            filename = "".concat((0, uuid_1.v4)(), ".png");
                            outputAbsPath = path.join(cutoutsDirAbs, filename);
                            // Normalize sizing so overlays render fast on mobile.
                            return [4 /*yield*/, (0, sharp_1.default)(pngBuffer)
                                    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
                                    .png({ compressionLevel: 9 })
                                    .toFile(outputAbsPath)];
                        case 6:
                            // Normalize sizing so overlays render fast on mobile.
                            _c.sent();
                            return [2 /*return*/, { cutoutUrl: "/uploads/cutouts/".concat(filename) }];
                        case 7:
                            err_1 = _c.sent();
                            this.logger.warn("Cutout generation failed for ".concat(uploadsPathname, ": ").concat((err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || err_1));
                            return [2 /*return*/, null];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        CutoutService_1.prototype.extractUploadsPathname = function (input) {
            if (!input)
                return null;
            // Already a relative /uploads/... URL.
            if (input.startsWith('/uploads/'))
                return input;
            // Full URL: take pathname.
            try {
                var url = new URL(input);
                if (url.pathname.startsWith('/uploads/'))
                    return url.pathname;
            }
            catch (_a) {
                // ignore
            }
            // Fallback: search for "/uploads/" substring.
            var idx = input.indexOf('/uploads/');
            if (idx >= 0)
                return input.slice(idx);
            return null;
        };
        return CutoutService_1;
    }());
    __setFunctionName(_classThis, "CutoutService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CutoutService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CutoutService = _classThis;
}();
exports.CutoutService = CutoutService;
