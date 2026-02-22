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
exports.AIController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var ClothingItemDto = function () {
    var _a;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _category_decorators;
    var _category_initializers = [];
    var _category_extraInitializers = [];
    var _imageUrl_decorators;
    var _imageUrl_initializers = [];
    var _imageUrl_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ClothingItemDto() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.category = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _category_initializers, void 0));
                this.imageUrl = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _imageUrl_initializers, void 0));
                __runInitializers(this, _imageUrl_extraInitializers);
            }
            return ClothingItemDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _category_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            _imageUrl_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: function (obj) { return "category" in obj; }, get: function (obj) { return obj.category; }, set: function (obj, value) { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
            __esDecorate(null, null, _imageUrl_decorators, { kind: "field", name: "imageUrl", static: false, private: false, access: { has: function (obj) { return "imageUrl" in obj; }, get: function (obj) { return obj.imageUrl; }, set: function (obj, value) { obj.imageUrl = value; } }, metadata: _metadata }, _imageUrl_initializers, _imageUrl_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var WeatherDto = function () {
    var _a;
    var _temperature_decorators;
    var _temperature_initializers = [];
    var _temperature_extraInitializers = [];
    var _condition_decorators;
    var _condition_initializers = [];
    var _condition_extraInitializers = [];
    return _a = /** @class */ (function () {
            function WeatherDto() {
                this.temperature = __runInitializers(this, _temperature_initializers, void 0);
                this.condition = (__runInitializers(this, _temperature_extraInitializers), __runInitializers(this, _condition_initializers, void 0));
                __runInitializers(this, _condition_extraInitializers);
            }
            return WeatherDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _temperature_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsNumber)()];
            _condition_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _temperature_decorators, { kind: "field", name: "temperature", static: false, private: false, access: { has: function (obj) { return "temperature" in obj; }, get: function (obj) { return obj.temperature; }, set: function (obj, value) { obj.temperature = value; } }, metadata: _metadata }, _temperature_initializers, _temperature_extraInitializers);
            __esDecorate(null, null, _condition_decorators, { kind: "field", name: "condition", static: false, private: false, access: { has: function (obj) { return "condition" in obj; }, get: function (obj) { return obj.condition; }, set: function (obj, value) { obj.condition = value; } }, metadata: _metadata }, _condition_initializers, _condition_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var UserProfileDto = function () {
    var _a;
    var _sex_decorators;
    var _sex_initializers = [];
    var _sex_extraInitializers = [];
    var _age_decorators;
    var _age_initializers = [];
    var _age_extraInitializers = [];
    var _heightCm_decorators;
    var _heightCm_initializers = [];
    var _heightCm_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UserProfileDto() {
                this.sex = __runInitializers(this, _sex_initializers, void 0);
                this.age = (__runInitializers(this, _sex_extraInitializers), __runInitializers(this, _age_initializers, void 0));
                this.heightCm = (__runInitializers(this, _age_extraInitializers), __runInitializers(this, _heightCm_initializers, void 0));
                __runInitializers(this, _heightCm_extraInitializers);
            }
            return UserProfileDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _sex_decorators = [(0, swagger_1.ApiProperty)({ required: false, enum: ['male', 'female'] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['male', 'female'])];
            _age_decorators = [(0, swagger_1.ApiProperty)({ required: false, example: 28 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)()];
            _heightCm_decorators = [(0, swagger_1.ApiProperty)({ required: false, example: 178 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)()];
            __esDecorate(null, null, _sex_decorators, { kind: "field", name: "sex", static: false, private: false, access: { has: function (obj) { return "sex" in obj; }, get: function (obj) { return obj.sex; }, set: function (obj, value) { obj.sex = value; } }, metadata: _metadata }, _sex_initializers, _sex_extraInitializers);
            __esDecorate(null, null, _age_decorators, { kind: "field", name: "age", static: false, private: false, access: { has: function (obj) { return "age" in obj; }, get: function (obj) { return obj.age; }, set: function (obj, value) { obj.age = value; } }, metadata: _metadata }, _age_initializers, _age_extraInitializers);
            __esDecorate(null, null, _heightCm_decorators, { kind: "field", name: "heightCm", static: false, private: false, access: { has: function (obj) { return "heightCm" in obj; }, get: function (obj) { return obj.heightCm; }, set: function (obj, value) { obj.heightCm = value; } }, metadata: _metadata }, _heightCm_initializers, _heightCm_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var GenerateOutfitDto = function () {
    var _a;
    var _userPhotoUrl_decorators;
    var _userPhotoUrl_initializers = [];
    var _userPhotoUrl_extraInitializers = [];
    var _user_decorators;
    var _user_initializers = [];
    var _user_extraInitializers = [];
    var _clothingItems_decorators;
    var _clothingItems_initializers = [];
    var _clothingItems_extraInitializers = [];
    var _weather_decorators;
    var _weather_initializers = [];
    var _weather_extraInitializers = [];
    var _stylePrompt_decorators;
    var _stylePrompt_initializers = [];
    var _stylePrompt_extraInitializers = [];
    return _a = /** @class */ (function () {
            function GenerateOutfitDto() {
                this.userPhotoUrl = __runInitializers(this, _userPhotoUrl_initializers, void 0);
                this.user = (__runInitializers(this, _userPhotoUrl_extraInitializers), __runInitializers(this, _user_initializers, void 0));
                this.clothingItems = (__runInitializers(this, _user_extraInitializers), __runInitializers(this, _clothingItems_initializers, void 0));
                this.weather = (__runInitializers(this, _clothingItems_extraInitializers), __runInitializers(this, _weather_initializers, void 0));
                this.stylePrompt = (__runInitializers(this, _weather_extraInitializers), __runInitializers(this, _stylePrompt_initializers, void 0));
                __runInitializers(this, _stylePrompt_extraInitializers);
            }
            return GenerateOutfitDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _userPhotoUrl_decorators = [(0, swagger_1.ApiProperty)({ example: '/uploads/user-photo.jpg' }), (0, class_validator_1.IsString)()];
            _user_decorators = [(0, swagger_1.ApiProperty)({ type: UserProfileDto, required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(function () { return UserProfileDto; })];
            _clothingItems_decorators = [(0, swagger_1.ApiProperty)({ type: [ClothingItemDto] }), (0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(function () { return ClothingItemDto; })];
            _weather_decorators = [(0, swagger_1.ApiProperty)({ type: WeatherDto, required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(function () { return WeatherDto; })];
            _stylePrompt_decorators = [(0, swagger_1.ApiProperty)({ required: false, example: 'Event: Wedding Guest. User request: elegant and minimalist.' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _userPhotoUrl_decorators, { kind: "field", name: "userPhotoUrl", static: false, private: false, access: { has: function (obj) { return "userPhotoUrl" in obj; }, get: function (obj) { return obj.userPhotoUrl; }, set: function (obj, value) { obj.userPhotoUrl = value; } }, metadata: _metadata }, _userPhotoUrl_initializers, _userPhotoUrl_extraInitializers);
            __esDecorate(null, null, _user_decorators, { kind: "field", name: "user", static: false, private: false, access: { has: function (obj) { return "user" in obj; }, get: function (obj) { return obj.user; }, set: function (obj, value) { obj.user = value; } }, metadata: _metadata }, _user_initializers, _user_extraInitializers);
            __esDecorate(null, null, _clothingItems_decorators, { kind: "field", name: "clothingItems", static: false, private: false, access: { has: function (obj) { return "clothingItems" in obj; }, get: function (obj) { return obj.clothingItems; }, set: function (obj, value) { obj.clothingItems = value; } }, metadata: _metadata }, _clothingItems_initializers, _clothingItems_extraInitializers);
            __esDecorate(null, null, _weather_decorators, { kind: "field", name: "weather", static: false, private: false, access: { has: function (obj) { return "weather" in obj; }, get: function (obj) { return obj.weather; }, set: function (obj, value) { obj.weather = value; } }, metadata: _metadata }, _weather_initializers, _weather_extraInitializers);
            __esDecorate(null, null, _stylePrompt_decorators, { kind: "field", name: "stylePrompt", static: false, private: false, access: { has: function (obj) { return "stylePrompt" in obj; }, get: function (obj) { return obj.stylePrompt; }, set: function (obj, value) { obj.stylePrompt = value; } }, metadata: _metadata }, _stylePrompt_initializers, _stylePrompt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var AIController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('AI'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('ai'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _generateOutfit_decorators;
    var _analyzeWardrobe_decorators;
    var AIController = _classThis = /** @class */ (function () {
        function AIController_1(aiService) {
            this.aiService = (__runInitializers(this, _instanceExtraInitializers), aiService);
        }
        AIController_1.prototype.generateOutfit = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.aiService.generateOutfitImage(dto)];
                });
            });
        };
        AIController_1.prototype.analyzeWardrobe = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.aiService.analyzeWardrobe(dto)];
                });
            });
        };
        return AIController_1;
    }());
    __setFunctionName(_classThis, "AIController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _generateOutfit_decorators = [(0, common_1.Post)('generate-outfit'), (0, swagger_1.ApiOperation)({ summary: 'Generate AI outfit image' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Outfit image generated successfully',
                schema: {
                    example: {
                        imageUrl: 'https://example.com/generated-outfit.png',
                        prompt: 'The prompt used for generation',
                    },
                },
            })];
        _analyzeWardrobe_decorators = [(0, common_1.Post)('analyze-wardrobe'), (0, swagger_1.ApiOperation)({ summary: 'Analyze wardrobe completeness based on weather' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Wardrobe analysis completed',
                schema: {
                    example: {
                        isComplete: false,
                        missingItems: ['jacket'],
                        recommendations: ["It's 2°C outside. You'll need a warm jacket for cold weather."],
                    },
                },
            })];
        __esDecorate(_classThis, null, _generateOutfit_decorators, { kind: "method", name: "generateOutfit", static: false, private: false, access: { has: function (obj) { return "generateOutfit" in obj; }, get: function (obj) { return obj.generateOutfit; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _analyzeWardrobe_decorators, { kind: "method", name: "analyzeWardrobe", static: false, private: false, access: { has: function (obj) { return "analyzeWardrobe" in obj; }, get: function (obj) { return obj.analyzeWardrobe; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AIController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AIController = _classThis;
}();
exports.AIController = AIController;
