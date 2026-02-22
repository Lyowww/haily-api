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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateOutfitDto = exports.Season = exports.Occasion = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var Occasion;
(function (Occasion) {
    Occasion["CASUAL"] = "casual";
    Occasion["FORMAL"] = "formal";
    Occasion["BUSINESS"] = "business";
    Occasion["DATE"] = "date";
    Occasion["PARTY"] = "party";
    Occasion["SPORT"] = "sport";
    Occasion["TRAVEL"] = "travel";
})(Occasion || (exports.Occasion = Occasion = {}));
var Season;
(function (Season) {
    Season["SPRING"] = "spring";
    Season["SUMMER"] = "summer";
    Season["AUTUMN"] = "autumn";
    Season["WINTER"] = "winter";
})(Season || (exports.Season = Season = {}));
var GenerateOutfitDto = function () {
    var _a;
    var _userImage_decorators;
    var _userImage_initializers = [];
    var _userImage_extraInitializers = [];
    var _preferredStyle_decorators;
    var _preferredStyle_initializers = [];
    var _preferredStyle_extraInitializers = [];
    var _occasion_decorators;
    var _occasion_initializers = [];
    var _occasion_extraInitializers = [];
    var _season_decorators;
    var _season_initializers = [];
    var _season_extraInitializers = [];
    var _preferredColors_decorators;
    var _preferredColors_initializers = [];
    var _preferredColors_extraInitializers = [];
    var _excludeColors_decorators;
    var _excludeColors_initializers = [];
    var _excludeColors_extraInitializers = [];
    return _a = /** @class */ (function () {
            function GenerateOutfitDto() {
                this.userImage = __runInitializers(this, _userImage_initializers, void 0);
                this.preferredStyle = (__runInitializers(this, _userImage_extraInitializers), __runInitializers(this, _preferredStyle_initializers, void 0));
                this.occasion = (__runInitializers(this, _preferredStyle_extraInitializers), __runInitializers(this, _occasion_initializers, void 0));
                this.season = (__runInitializers(this, _occasion_extraInitializers), __runInitializers(this, _season_initializers, void 0));
                this.preferredColors = (__runInitializers(this, _season_extraInitializers), __runInitializers(this, _preferredColors_initializers, void 0));
                this.excludeColors = (__runInitializers(this, _preferredColors_extraInitializers), __runInitializers(this, _excludeColors_initializers, void 0));
                __runInitializers(this, _excludeColors_extraInitializers);
            }
            return GenerateOutfitDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _userImage_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Base64 encoded image of the user',
                    example: 'data:image/jpeg;base64,...',
                }), (0, class_validator_1.IsString)()];
            _preferredStyle_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Preferred outfit style',
                    example: 'casual',
                }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _occasion_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    enum: Occasion,
                    description: 'The occasion for the outfit',
                    example: Occasion.CASUAL,
                }), (0, class_validator_1.IsEnum)(Occasion), (0, class_validator_1.IsOptional)()];
            _season_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    enum: Season,
                    description: 'Current season for appropriate clothing',
                    example: Season.SUMMER,
                }), (0, class_validator_1.IsEnum)(Season), (0, class_validator_1.IsOptional)()];
            _preferredColors_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Preferred colors for the outfit',
                    example: ['blue', 'white', 'black'],
                    type: [String],
                }), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.IsOptional)()];
            _excludeColors_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Colors to avoid in the outfit',
                    example: ['yellow', 'orange'],
                    type: [String],
                }), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _userImage_decorators, { kind: "field", name: "userImage", static: false, private: false, access: { has: function (obj) { return "userImage" in obj; }, get: function (obj) { return obj.userImage; }, set: function (obj, value) { obj.userImage = value; } }, metadata: _metadata }, _userImage_initializers, _userImage_extraInitializers);
            __esDecorate(null, null, _preferredStyle_decorators, { kind: "field", name: "preferredStyle", static: false, private: false, access: { has: function (obj) { return "preferredStyle" in obj; }, get: function (obj) { return obj.preferredStyle; }, set: function (obj, value) { obj.preferredStyle = value; } }, metadata: _metadata }, _preferredStyle_initializers, _preferredStyle_extraInitializers);
            __esDecorate(null, null, _occasion_decorators, { kind: "field", name: "occasion", static: false, private: false, access: { has: function (obj) { return "occasion" in obj; }, get: function (obj) { return obj.occasion; }, set: function (obj, value) { obj.occasion = value; } }, metadata: _metadata }, _occasion_initializers, _occasion_extraInitializers);
            __esDecorate(null, null, _season_decorators, { kind: "field", name: "season", static: false, private: false, access: { has: function (obj) { return "season" in obj; }, get: function (obj) { return obj.season; }, set: function (obj, value) { obj.season = value; } }, metadata: _metadata }, _season_initializers, _season_extraInitializers);
            __esDecorate(null, null, _preferredColors_decorators, { kind: "field", name: "preferredColors", static: false, private: false, access: { has: function (obj) { return "preferredColors" in obj; }, get: function (obj) { return obj.preferredColors; }, set: function (obj, value) { obj.preferredColors = value; } }, metadata: _metadata }, _preferredColors_initializers, _preferredColors_extraInitializers);
            __esDecorate(null, null, _excludeColors_decorators, { kind: "field", name: "excludeColors", static: false, private: false, access: { has: function (obj) { return "excludeColors" in obj; }, get: function (obj) { return obj.excludeColors; }, set: function (obj, value) { obj.excludeColors = value; } }, metadata: _metadata }, _excludeColors_initializers, _excludeColors_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.GenerateOutfitDto = GenerateOutfitDto;
