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
exports.UpdateProfileDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var UpdateProfileDto = function () {
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
            function UpdateProfileDto() {
                this.sex = __runInitializers(this, _sex_initializers, void 0);
                this.age = (__runInitializers(this, _sex_extraInitializers), __runInitializers(this, _age_initializers, void 0));
                this.heightCm = (__runInitializers(this, _age_extraInitializers), __runInitializers(this, _heightCm_initializers, void 0));
                __runInitializers(this, _heightCm_extraInitializers);
            }
            return UpdateProfileDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _sex_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'User sex (used for sizing/fit heuristics)',
                    enum: ['male', 'female'],
                    example: 'male',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['male', 'female'])];
            _age_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'User age in years',
                    example: 28,
                    minimum: 5,
                    maximum: 120,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(5), (0, class_validator_1.Max)(120)];
            _heightCm_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'User height in centimeters',
                    example: 175,
                    minimum: 80,
                    maximum: 250,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(80), (0, class_validator_1.Max)(250)];
            __esDecorate(null, null, _sex_decorators, { kind: "field", name: "sex", static: false, private: false, access: { has: function (obj) { return "sex" in obj; }, get: function (obj) { return obj.sex; }, set: function (obj, value) { obj.sex = value; } }, metadata: _metadata }, _sex_initializers, _sex_extraInitializers);
            __esDecorate(null, null, _age_decorators, { kind: "field", name: "age", static: false, private: false, access: { has: function (obj) { return "age" in obj; }, get: function (obj) { return obj.age; }, set: function (obj, value) { obj.age = value; } }, metadata: _metadata }, _age_initializers, _age_extraInitializers);
            __esDecorate(null, null, _heightCm_decorators, { kind: "field", name: "heightCm", static: false, private: false, access: { has: function (obj) { return "heightCm" in obj; }, get: function (obj) { return obj.heightCm; }, set: function (obj, value) { obj.heightCm = value; } }, metadata: _metadata }, _heightCm_initializers, _heightCm_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateProfileDto = UpdateProfileDto;
