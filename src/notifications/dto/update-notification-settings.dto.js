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
exports.UpdateNotificationSettingsDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var UpdateNotificationSettingsDto = function () {
    var _a;
    var _enabled_decorators;
    var _enabled_initializers = [];
    var _enabled_extraInitializers = [];
    var _expoPushToken_decorators;
    var _expoPushToken_initializers = [];
    var _expoPushToken_extraInitializers = [];
    var _latitude_decorators;
    var _latitude_initializers = [];
    var _latitude_extraInitializers = [];
    var _longitude_decorators;
    var _longitude_initializers = [];
    var _longitude_extraInitializers = [];
    var _timezone_decorators;
    var _timezone_initializers = [];
    var _timezone_extraInitializers = [];
    var _notifyAtLocalTime_decorators;
    var _notifyAtLocalTime_initializers = [];
    var _notifyAtLocalTime_extraInitializers = [];
    var _coldThresholdC_decorators;
    var _coldThresholdC_initializers = [];
    var _coldThresholdC_extraInitializers = [];
    var _hotThresholdC_decorators;
    var _hotThresholdC_initializers = [];
    var _hotThresholdC_extraInitializers = [];
    var _tempChangeThresholdC_decorators;
    var _tempChangeThresholdC_initializers = [];
    var _tempChangeThresholdC_extraInitializers = [];
    var _notifyOnWeatherChange_decorators;
    var _notifyOnWeatherChange_initializers = [];
    var _notifyOnWeatherChange_extraInitializers = [];
    var _minHoursBetweenNotifs_decorators;
    var _minHoursBetweenNotifs_initializers = [];
    var _minHoursBetweenNotifs_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateNotificationSettingsDto() {
                this.enabled = __runInitializers(this, _enabled_initializers, void 0);
                this.expoPushToken = (__runInitializers(this, _enabled_extraInitializers), __runInitializers(this, _expoPushToken_initializers, void 0));
                this.latitude = (__runInitializers(this, _expoPushToken_extraInitializers), __runInitializers(this, _latitude_initializers, void 0));
                this.longitude = (__runInitializers(this, _latitude_extraInitializers), __runInitializers(this, _longitude_initializers, void 0));
                this.timezone = (__runInitializers(this, _longitude_extraInitializers), __runInitializers(this, _timezone_initializers, void 0));
                this.notifyAtLocalTime = (__runInitializers(this, _timezone_extraInitializers), __runInitializers(this, _notifyAtLocalTime_initializers, void 0));
                this.coldThresholdC = (__runInitializers(this, _notifyAtLocalTime_extraInitializers), __runInitializers(this, _coldThresholdC_initializers, void 0));
                this.hotThresholdC = (__runInitializers(this, _coldThresholdC_extraInitializers), __runInitializers(this, _hotThresholdC_initializers, void 0));
                this.tempChangeThresholdC = (__runInitializers(this, _hotThresholdC_extraInitializers), __runInitializers(this, _tempChangeThresholdC_initializers, void 0));
                this.notifyOnWeatherChange = (__runInitializers(this, _tempChangeThresholdC_extraInitializers), __runInitializers(this, _notifyOnWeatherChange_initializers, void 0));
                this.minHoursBetweenNotifs = (__runInitializers(this, _notifyOnWeatherChange_extraInitializers), __runInitializers(this, _minHoursBetweenNotifs_initializers, void 0));
                __runInitializers(this, _minHoursBetweenNotifs_extraInitializers);
            }
            return UpdateNotificationSettingsDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _enabled_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: true }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _expoPushToken_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _latitude_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 40.1811 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)()];
            _longitude_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 44.5136 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)()];
            _timezone_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Asia/Yerevan' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _notifyAtLocalTime_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '08:00', description: 'Local time (HH:mm) when daily weather-outfit check runs' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Matches)(/^\d{2}:\d{2}$/)];
            _coldThresholdC_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 10 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(-40), (0, class_validator_1.Max)(40)];
            _hotThresholdC_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 25 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(-10), (0, class_validator_1.Max)(60)];
            _tempChangeThresholdC_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 5, description: 'Trigger notification if current temp differs from outfit temp by >= this value' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(20)];
            _notifyOnWeatherChange_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: true }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _minHoursBetweenNotifs_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 6 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(72)];
            __esDecorate(null, null, _enabled_decorators, { kind: "field", name: "enabled", static: false, private: false, access: { has: function (obj) { return "enabled" in obj; }, get: function (obj) { return obj.enabled; }, set: function (obj, value) { obj.enabled = value; } }, metadata: _metadata }, _enabled_initializers, _enabled_extraInitializers);
            __esDecorate(null, null, _expoPushToken_decorators, { kind: "field", name: "expoPushToken", static: false, private: false, access: { has: function (obj) { return "expoPushToken" in obj; }, get: function (obj) { return obj.expoPushToken; }, set: function (obj, value) { obj.expoPushToken = value; } }, metadata: _metadata }, _expoPushToken_initializers, _expoPushToken_extraInitializers);
            __esDecorate(null, null, _latitude_decorators, { kind: "field", name: "latitude", static: false, private: false, access: { has: function (obj) { return "latitude" in obj; }, get: function (obj) { return obj.latitude; }, set: function (obj, value) { obj.latitude = value; } }, metadata: _metadata }, _latitude_initializers, _latitude_extraInitializers);
            __esDecorate(null, null, _longitude_decorators, { kind: "field", name: "longitude", static: false, private: false, access: { has: function (obj) { return "longitude" in obj; }, get: function (obj) { return obj.longitude; }, set: function (obj, value) { obj.longitude = value; } }, metadata: _metadata }, _longitude_initializers, _longitude_extraInitializers);
            __esDecorate(null, null, _timezone_decorators, { kind: "field", name: "timezone", static: false, private: false, access: { has: function (obj) { return "timezone" in obj; }, get: function (obj) { return obj.timezone; }, set: function (obj, value) { obj.timezone = value; } }, metadata: _metadata }, _timezone_initializers, _timezone_extraInitializers);
            __esDecorate(null, null, _notifyAtLocalTime_decorators, { kind: "field", name: "notifyAtLocalTime", static: false, private: false, access: { has: function (obj) { return "notifyAtLocalTime" in obj; }, get: function (obj) { return obj.notifyAtLocalTime; }, set: function (obj, value) { obj.notifyAtLocalTime = value; } }, metadata: _metadata }, _notifyAtLocalTime_initializers, _notifyAtLocalTime_extraInitializers);
            __esDecorate(null, null, _coldThresholdC_decorators, { kind: "field", name: "coldThresholdC", static: false, private: false, access: { has: function (obj) { return "coldThresholdC" in obj; }, get: function (obj) { return obj.coldThresholdC; }, set: function (obj, value) { obj.coldThresholdC = value; } }, metadata: _metadata }, _coldThresholdC_initializers, _coldThresholdC_extraInitializers);
            __esDecorate(null, null, _hotThresholdC_decorators, { kind: "field", name: "hotThresholdC", static: false, private: false, access: { has: function (obj) { return "hotThresholdC" in obj; }, get: function (obj) { return obj.hotThresholdC; }, set: function (obj, value) { obj.hotThresholdC = value; } }, metadata: _metadata }, _hotThresholdC_initializers, _hotThresholdC_extraInitializers);
            __esDecorate(null, null, _tempChangeThresholdC_decorators, { kind: "field", name: "tempChangeThresholdC", static: false, private: false, access: { has: function (obj) { return "tempChangeThresholdC" in obj; }, get: function (obj) { return obj.tempChangeThresholdC; }, set: function (obj, value) { obj.tempChangeThresholdC = value; } }, metadata: _metadata }, _tempChangeThresholdC_initializers, _tempChangeThresholdC_extraInitializers);
            __esDecorate(null, null, _notifyOnWeatherChange_decorators, { kind: "field", name: "notifyOnWeatherChange", static: false, private: false, access: { has: function (obj) { return "notifyOnWeatherChange" in obj; }, get: function (obj) { return obj.notifyOnWeatherChange; }, set: function (obj, value) { obj.notifyOnWeatherChange = value; } }, metadata: _metadata }, _notifyOnWeatherChange_initializers, _notifyOnWeatherChange_extraInitializers);
            __esDecorate(null, null, _minHoursBetweenNotifs_decorators, { kind: "field", name: "minHoursBetweenNotifs", static: false, private: false, access: { has: function (obj) { return "minHoursBetweenNotifs" in obj; }, get: function (obj) { return obj.minHoursBetweenNotifs; }, set: function (obj, value) { obj.minHoursBetweenNotifs = value; } }, metadata: _metadata }, _minHoursBetweenNotifs_initializers, _minHoursBetweenNotifs_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateNotificationSettingsDto = UpdateNotificationSettingsDto;
