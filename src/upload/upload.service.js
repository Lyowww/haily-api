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
exports.UploadService = void 0;
var common_1 = require("@nestjs/common");
// import { ConfigService } from '../config';
var fs = require("fs");
var path = require("path");
var uuid_1 = require("uuid");
var UploadService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var UploadService = _classThis = /** @class */ (function () {
        function UploadService_1(
        // private configService: ConfigService
        ) {
            this.maxFileSize = 10 * 1024 * 1024; // 10MB
            this.allowedMimeTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp',
                'image/gif',
            ];
            // Create uploads directory if it doesn't exist
            this.uploadDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(this.uploadDir)) {
                fs.mkdirSync(this.uploadDir, { recursive: true });
            }
        }
        UploadService_1.prototype.uploadFile = function (file) {
            return __awaiter(this, void 0, void 0, function () {
                var fileExtension, uniqueFilename, filePath, writtenSize, url;
                return __generator(this, function (_a) {
                    if (!file) {
                        throw new common_1.BadRequestException('No file provided');
                    }
                    // Multer memoryStorage should always provide a buffer. If it is empty, the client
                    // likely sent a broken multipart request (e.g. missing boundary / empty body).
                    if (!file.buffer || file.buffer.length === 0 || file.size === 0) {
                        throw new common_1.BadRequestException('Uploaded file is empty (0 bytes). Please re-upload and ensure the client sends the file bytes correctly.');
                    }
                    // Validate file size
                    if (file.size > this.maxFileSize) {
                        throw new common_1.BadRequestException("File size exceeds maximum allowed size of ".concat(this.maxFileSize / 1024 / 1024, "MB"));
                    }
                    // Validate mime type
                    if (!this.allowedMimeTypes.includes(file.mimetype)) {
                        throw new common_1.BadRequestException("Invalid file type. Allowed types: ".concat(this.allowedMimeTypes.join(', ')));
                    }
                    fileExtension = path.extname(file.originalname);
                    uniqueFilename = "".concat((0, uuid_1.v4)()).concat(fileExtension);
                    filePath = path.join(this.uploadDir, uniqueFilename);
                    // Save file
                    fs.writeFileSync(filePath, file.buffer);
                    writtenSize = fs.statSync(filePath).size;
                    if (writtenSize === 0) {
                        throw new common_1.BadRequestException('Uploaded file was saved as 0 bytes. This usually means the client sent an empty file payload.');
                    }
                    url = "/uploads/".concat(uniqueFilename);
                    return [2 /*return*/, {
                            filename: uniqueFilename,
                            originalName: file.originalname,
                            mimeType: file.mimetype,
                            size: writtenSize,
                            url: url,
                            path: filePath,
                        }];
                });
            });
        };
        UploadService_1.prototype.deleteFile = function (filename) {
            return __awaiter(this, void 0, void 0, function () {
                var filePath;
                return __generator(this, function (_a) {
                    filePath = path.join(this.uploadDir, filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    return [2 /*return*/];
                });
            });
        };
        UploadService_1.prototype.getMaxFileSize = function () {
            return this.maxFileSize;
        };
        UploadService_1.prototype.getAllowedMimeTypes = function () {
            return this.allowedMimeTypes;
        };
        return UploadService_1;
    }());
    __setFunctionName(_classThis, "UploadService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UploadService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UploadService = _classThis;
}();
exports.UploadService = UploadService;
