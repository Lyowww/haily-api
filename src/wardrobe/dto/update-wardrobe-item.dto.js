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
exports.UpdateWardrobeItemDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var UpdateWardrobeItemDto = function () {
    var _a;
    var _category_decorators;
    var _category_initializers = [];
    var _category_extraInitializers = [];
    var _colorFamily_decorators;
    var _colorFamily_initializers = [];
    var _colorFamily_extraInitializers = [];
    var _styleTags_decorators;
    var _styleTags_initializers = [];
    var _styleTags_extraInitializers = [];
    var _seasonTags_decorators;
    var _seasonTags_initializers = [];
    var _seasonTags_extraInitializers = [];
    var _fitTag_decorators;
    var _fitTag_initializers = [];
    var _fitTag_extraInitializers = [];
    var _extraTags_decorators;
    var _extraTags_initializers = [];
    var _extraTags_extraInitializers = [];
    var _userNotes_decorators;
    var _userNotes_initializers = [];
    var _userNotes_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateWardrobeItemDto() {
                this.category = __runInitializers(this, _category_initializers, void 0);
                this.colorFamily = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _colorFamily_initializers, void 0));
                this.styleTags = (__runInitializers(this, _colorFamily_extraInitializers), __runInitializers(this, _styleTags_initializers, void 0));
                this.seasonTags = (__runInitializers(this, _styleTags_extraInitializers), __runInitializers(this, _seasonTags_initializers, void 0));
                this.fitTag = (__runInitializers(this, _seasonTags_extraInitializers), __runInitializers(this, _fitTag_initializers, void 0));
                this.extraTags = (__runInitializers(this, _fitTag_extraInitializers), __runInitializers(this, _extraTags_initializers, void 0));
                this.userNotes = (__runInitializers(this, _extraTags_extraInitializers), __runInitializers(this, _userNotes_initializers, void 0));
                __runInitializers(this, _userNotes_extraInitializers);
            }
            return UpdateWardrobeItemDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _category_decorators = [(0, swagger_1.ApiProperty)({ example: 'top', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _colorFamily_decorators = [(0, swagger_1.ApiProperty)({ example: 'blue', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _styleTags_decorators = [(0, swagger_1.ApiProperty)({ example: ['casual', 'smart_casual'], required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)()];
            _seasonTags_decorators = [(0, swagger_1.ApiProperty)({ example: ['summer', 'spring_fall'], required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)()];
            _fitTag_decorators = [(0, swagger_1.ApiProperty)({ example: 'slim', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _extraTags_decorators = [(0, swagger_1.ApiProperty)({ example: ['v-neck', 'cotton'], required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)()];
            _userNotes_decorators = [(0, swagger_1.ApiProperty)({ example: 'Updated notes', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: function (obj) { return "category" in obj; }, get: function (obj) { return obj.category; }, set: function (obj, value) { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
            __esDecorate(null, null, _colorFamily_decorators, { kind: "field", name: "colorFamily", static: false, private: false, access: { has: function (obj) { return "colorFamily" in obj; }, get: function (obj) { return obj.colorFamily; }, set: function (obj, value) { obj.colorFamily = value; } }, metadata: _metadata }, _colorFamily_initializers, _colorFamily_extraInitializers);
            __esDecorate(null, null, _styleTags_decorators, { kind: "field", name: "styleTags", static: false, private: false, access: { has: function (obj) { return "styleTags" in obj; }, get: function (obj) { return obj.styleTags; }, set: function (obj, value) { obj.styleTags = value; } }, metadata: _metadata }, _styleTags_initializers, _styleTags_extraInitializers);
            __esDecorate(null, null, _seasonTags_decorators, { kind: "field", name: "seasonTags", static: false, private: false, access: { has: function (obj) { return "seasonTags" in obj; }, get: function (obj) { return obj.seasonTags; }, set: function (obj, value) { obj.seasonTags = value; } }, metadata: _metadata }, _seasonTags_initializers, _seasonTags_extraInitializers);
            __esDecorate(null, null, _fitTag_decorators, { kind: "field", name: "fitTag", static: false, private: false, access: { has: function (obj) { return "fitTag" in obj; }, get: function (obj) { return obj.fitTag; }, set: function (obj, value) { obj.fitTag = value; } }, metadata: _metadata }, _fitTag_initializers, _fitTag_extraInitializers);
            __esDecorate(null, null, _extraTags_decorators, { kind: "field", name: "extraTags", static: false, private: false, access: { has: function (obj) { return "extraTags" in obj; }, get: function (obj) { return obj.extraTags; }, set: function (obj, value) { obj.extraTags = value; } }, metadata: _metadata }, _extraTags_initializers, _extraTags_extraInitializers);
            __esDecorate(null, null, _userNotes_decorators, { kind: "field", name: "userNotes", static: false, private: false, access: { has: function (obj) { return "userNotes" in obj; }, get: function (obj) { return obj.userNotes; }, set: function (obj, value) { obj.userNotes = value; } }, metadata: _metadata }, _userNotes_initializers, _userNotes_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateWardrobeItemDto = UpdateWardrobeItemDto;
