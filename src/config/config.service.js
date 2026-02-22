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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
var common_1 = require("@nestjs/common");
// import { ConfigService as NestConfigService } from '@nestjs/config';
var env_schema_1 = require("./env.schema");
var ConfigService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ConfigService = _classThis = /** @class */ (function () {
        function ConfigService_1(
        // private nestConfigService: NestConfigService
        ) {
            // Validate environment variables on startup
            var result = env_schema_1.envSchema.safeParse(process.env);
            if (!result.success) {
                var errors = result.error.errors.map(function (err) { return ({
                    path: err.path.join('.'),
                    message: err.message,
                }); });
                console.error('❌ Environment validation failed:');
                errors.forEach(function (err) {
                    console.error("  - ".concat(err.path, ": ").concat(err.message));
                });
                throw new Error('Invalid environment configuration');
            }
            this.env = result.data;
        }
        ConfigService_1.prototype.get = function (key) {
            return this.env[key];
        };
        Object.defineProperty(ConfigService_1.prototype, "nodeEnv", {
            get: function () {
                return this.env.NODE_ENV;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "port", {
            get: function () {
                return this.env.PORT;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "corsOrigins", {
            get: function () {
                var raw = this.env.CORS_ORIGINS;
                if (!raw) {
                    return this.isDevelopment ? ['http://localhost:8081', 'http://localhost:19006'] : [];
                }
                return raw
                    .split(',')
                    .map(function (item) { return item.trim(); })
                    .filter(function (item) { return item.length > 0; });
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "databaseUrl", {
            get: function () {
                return this.env.DATABASE_URL;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "isSqlite", {
            get: function () {
                var url = this.env.DATABASE_URL;
                return (url.startsWith('./') ||
                    url.startsWith('../') ||
                    url.startsWith('/') ||
                    url.endsWith('.sqlite') ||
                    url.endsWith('.db') ||
                    url.startsWith('sqlite://'));
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "isPostgresql", {
            get: function () {
                return this.env.DATABASE_URL.startsWith('postgresql://');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "isMysql", {
            get: function () {
                return this.env.DATABASE_URL.startsWith('mysql://');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "redisUrl", {
            get: function () {
                return this.env.REDIS_URL;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "s3Endpoint", {
            get: function () {
                return this.env.S3_ENDPOINT;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "s3Bucket", {
            get: function () {
                return this.env.S3_BUCKET;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "s3AccessKey", {
            get: function () {
                return this.env.S3_ACCESS_KEY;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "s3SecretKey", {
            get: function () {
                return this.env.S3_SECRET_KEY;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "openAiApiKey", {
            get: function () {
                return this.env.OPENAI_API_KEY;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "jwtSecret", {
            get: function () {
                return this.env.JWT_SECRET;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "isDevelopment", {
            get: function () {
                return this.env.NODE_ENV === 'development';
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "isProduction", {
            get: function () {
                return this.env.NODE_ENV === 'production';
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "isTest", {
            get: function () {
                return this.env.NODE_ENV === 'test';
            },
            enumerable: false,
            configurable: true
        });
        return ConfigService_1;
    }());
    __setFunctionName(_classThis, "ConfigService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ConfigService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ConfigService = _classThis;
}();
exports.ConfigService = ConfigService;
