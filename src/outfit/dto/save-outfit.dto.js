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
exports.SaveOutfitDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var WeatherDataDto = function () {
    var _a;
    var _temperature_decorators;
    var _temperature_initializers = [];
    var _temperature_extraInitializers = [];
    var _condition_decorators;
    var _condition_initializers = [];
    var _condition_extraInitializers = [];
    var _locationName_decorators;
    var _locationName_initializers = [];
    var _locationName_extraInitializers = [];
    return _a = /** @class */ (function () {
            function WeatherDataDto() {
                this.temperature = __runInitializers(this, _temperature_initializers, void 0);
                this.condition = (__runInitializers(this, _temperature_extraInitializers), __runInitializers(this, _condition_initializers, void 0));
                this.locationName = (__runInitializers(this, _condition_extraInitializers), __runInitializers(this, _locationName_initializers, void 0));
                __runInitializers(this, _locationName_extraInitializers);
            }
            return WeatherDataDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _temperature_decorators = [(0, swagger_1.ApiProperty)({ example: 2 }), (0, class_validator_1.IsNumber)()];
            _condition_decorators = [(0, swagger_1.ApiProperty)({ example: 'Cold' }), (0, class_validator_1.IsString)()];
            _locationName_decorators = [(0, swagger_1.ApiProperty)({ example: 'Yerevan, Armenia' }), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _temperature_decorators, { kind: "field", name: "temperature", static: false, private: false, access: { has: function (obj) { return "temperature" in obj; }, get: function (obj) { return obj.temperature; }, set: function (obj, value) { obj.temperature = value; } }, metadata: _metadata }, _temperature_initializers, _temperature_extraInitializers);
            __esDecorate(null, null, _condition_decorators, { kind: "field", name: "condition", static: false, private: false, access: { has: function (obj) { return "condition" in obj; }, get: function (obj) { return obj.condition; }, set: function (obj, value) { obj.condition = value; } }, metadata: _metadata }, _condition_initializers, _condition_extraInitializers);
            __esDecorate(null, null, _locationName_decorators, { kind: "field", name: "locationName", static: false, private: false, access: { has: function (obj) { return "locationName" in obj; }, get: function (obj) { return obj.locationName; }, set: function (obj, value) { obj.locationName = value; } }, metadata: _metadata }, _locationName_initializers, _locationName_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var SaveOutfitDto = function () {
    var _a;
    var _imageUrl_decorators;
    var _imageUrl_initializers = [];
    var _imageUrl_extraInitializers = [];
    var _prompt_decorators;
    var _prompt_initializers = [];
    var _prompt_extraInitializers = [];
    var _weather_decorators;
    var _weather_initializers = [];
    var _weather_extraInitializers = [];
    var _wardrobeItemIds_decorators;
    var _wardrobeItemIds_initializers = [];
    var _wardrobeItemIds_extraInitializers = [];
    return _a = /** @class */ (function () {
            function SaveOutfitDto() {
                this.imageUrl = __runInitializers(this, _imageUrl_initializers, void 0);
                this.prompt = (__runInitializers(this, _imageUrl_extraInitializers), __runInitializers(this, _prompt_initializers, void 0));
                this.weather = (__runInitializers(this, _prompt_extraInitializers), __runInitializers(this, _weather_initializers, void 0));
                this.wardrobeItemIds = (__runInitializers(this, _weather_extraInitializers), __runInitializers(this, _wardrobeItemIds_initializers, void 0));
                __runInitializers(this, _wardrobeItemIds_extraInitializers);
            }
            return SaveOutfitDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _imageUrl_decorators = [(0, swagger_1.ApiProperty)({ example: '/uploads/generated/outfit-123.png' }), (0, class_validator_1.IsString)()];
            _prompt_decorators = [(0, swagger_1.ApiProperty)({ example: 'Full body image of a person wearing a blue shirt and jeans...' }), (0, class_validator_1.IsString)()];
            _weather_decorators = [(0, swagger_1.ApiProperty)({ type: WeatherDataDto, required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsObject)(), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(function () { return WeatherDataDto; })];
            _wardrobeItemIds_decorators = [(0, swagger_1.ApiProperty)({ required: false }), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _imageUrl_decorators, { kind: "field", name: "imageUrl", static: false, private: false, access: { has: function (obj) { return "imageUrl" in obj; }, get: function (obj) { return obj.imageUrl; }, set: function (obj, value) { obj.imageUrl = value; } }, metadata: _metadata }, _imageUrl_initializers, _imageUrl_extraInitializers);
            __esDecorate(null, null, _prompt_decorators, { kind: "field", name: "prompt", static: false, private: false, access: { has: function (obj) { return "prompt" in obj; }, get: function (obj) { return obj.prompt; }, set: function (obj, value) { obj.prompt = value; } }, metadata: _metadata }, _prompt_initializers, _prompt_extraInitializers);
            __esDecorate(null, null, _weather_decorators, { kind: "field", name: "weather", static: false, private: false, access: { has: function (obj) { return "weather" in obj; }, get: function (obj) { return obj.weather; }, set: function (obj, value) { obj.weather = value; } }, metadata: _metadata }, _weather_initializers, _weather_extraInitializers);
            __esDecorate(null, null, _wardrobeItemIds_decorators, { kind: "field", name: "wardrobeItemIds", static: false, private: false, access: { has: function (obj) { return "wardrobeItemIds" in obj; }, get: function (obj) { return obj.wardrobeItemIds; }, set: function (obj, value) { obj.wardrobeItemIds = value; } }, metadata: _metadata }, _wardrobeItemIds_initializers, _wardrobeItemIds_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.SaveOutfitDto = SaveOutfitDto;
