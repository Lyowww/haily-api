"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
exports.HelpCenterGateway = void 0;
var websockets_1 = require("@nestjs/websockets");
var HelpCenterGateway = function () {
    var _classDecorators = [(0, websockets_1.WebSocketGateway)({ namespace: '/help-center', cors: { origin: '*' } })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _server_decorators;
    var _server_initializers = [];
    var _server_extraInitializers = [];
    var _send_decorators;
    var HelpCenterGateway = _classThis = /** @class */ (function () {
        function HelpCenterGateway_1(jwtService, helpCenterService) {
            this.jwtService = (__runInitializers(this, _instanceExtraInitializers), jwtService);
            this.helpCenterService = helpCenterService;
            this.server = __runInitializers(this, _server_initializers, void 0);
            __runInitializers(this, _server_extraInitializers);
            this.jwtService = jwtService;
            this.helpCenterService = helpCenterService;
        }
        HelpCenterGateway_1.prototype.handleConnection = function (client) {
            return __awaiter(this, void 0, void 0, function () {
                var token, raw, payload, userId, _a;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            token = ((_b = client.handshake.auth) === null || _b === void 0 ? void 0 : _b.token) ||
                                (typeof ((_c = client.handshake.headers) === null || _c === void 0 ? void 0 : _c.authorization) === 'string'
                                    ? client.handshake.headers.authorization
                                    : null);
                            raw = typeof token === 'string' ? token.replace(/^Bearer\s+/i, '') : null;
                            if (!raw) {
                                client.disconnect(true);
                                return [2 /*return*/];
                            }
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 3, , 4]);
                            payload = this.jwtService.verify(raw);
                            userId = payload === null || payload === void 0 ? void 0 : payload.sub;
                            if (!userId) {
                                client.disconnect(true);
                                return [2 /*return*/];
                            }
                            client.data.userId = userId;
                            client.join(this.roomForUser(userId));
                            return [4 /*yield*/, this.helpCenterService.getOrCreateConversation(userId)];
                        case 2:
                            _d.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            _a = _d.sent();
                            client.disconnect(true);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        HelpCenterGateway_1.prototype.handleDisconnect = function (client) {
            client.removeAllListeners();
        };
        HelpCenterGateway_1.prototype.send = function (client, body) {
            return __awaiter(this, void 0, void 0, function () {
                var userId, text, created, autoReply, support;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            userId = (_a = client.data) === null || _a === void 0 ? void 0 : _a.userId;
                            if (!userId)
                                return [2 /*return*/];
                            text = typeof (body === null || body === void 0 ? void 0 : body.text) === 'string' ? body.text.trim() : '';
                            if (!text)
                                return [2 /*return*/];
                            return [4 /*yield*/, this.helpCenterService.createMessage(userId, 'user', text)];
                        case 1:
                            created = _b.sent();
                            this.server.to(this.roomForUser(userId)).emit('help_center:message', __assign(__assign({}, created.message), { sender: 'user' }));
                            autoReply = 'Thanks for reaching out. A support specialist will reply as soon as possible.';
                            return [4 /*yield*/, this.helpCenterService.createMessage(userId, 'support', autoReply)];
                        case 2:
                            support = _b.sent();
                            this.server.to(this.roomForUser(userId)).emit('help_center:message', __assign(__assign({}, support.message), { sender: 'support' }));
                            return [2 /*return*/];
                    }
                });
            });
        };
        HelpCenterGateway_1.prototype.roomForUser = function (userId) {
            return "help_center:user:".concat(userId);
        };
        return HelpCenterGateway_1;
    }());
    __setFunctionName(_classThis, "HelpCenterGateway");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _server_decorators = [(0, websockets_1.WebSocketServer)()];
        _send_decorators = [(0, websockets_1.SubscribeMessage)('help_center:send')];
        __esDecorate(_classThis, null, _send_decorators, { kind: "method", name: "send", static: false, private: false, access: { has: function (obj) { return "send" in obj; }, get: function (obj) { return obj.send; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _server_decorators, { kind: "field", name: "server", static: false, private: false, access: { has: function (obj) { return "server" in obj; }, get: function (obj) { return obj.server; }, set: function (obj, value) { obj.server = value; } }, metadata: _metadata }, _server_initializers, _server_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        HelpCenterGateway = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return HelpCenterGateway = _classThis;
}();
exports.HelpCenterGateway = HelpCenterGateway;
