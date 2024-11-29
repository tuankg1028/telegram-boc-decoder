"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JettonWallet = void 0;
var core_1 = require("@ton/core");
var JettonWallet = /** @class */ (function () {
    function JettonWallet(address) {
        this.address = address;
    }
    JettonWallet.createFromAddress = function (address) {
        return new JettonWallet(address);
    };
    /**
     * Sends message of jetton transfer to jetton wallet. More about jetton transfers here https://docs.ton.org/develop/dapps/asset-processing/jettons
     */
    JettonWallet.prototype.sendTransfer = function (provider, via, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var builder, commentPayload;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        builder = (0, core_1.beginCell)()
                            .storeUint(JettonWallet.OPCODES.TRANSFER, 32) // opcode for transfer. 0xf8a7ea5 is used
                            .storeUint((_a = opts.queryId) !== null && _a !== void 0 ? _a : 0, 64)
                            .storeCoins(opts.jettonAmount) // jetton amount to transfer. Be aware of decimals. Almost all jettons has 9, but USDT has 6. More about decimals https://docs.ton.org/develop/dapps/asset-processing/metadata#jetton-metadata-attributes
                            .storeAddress(opts.toAddress) // jetton destination address. Use wallet address, not jetton address itself
                            .storeAddress(via.address) // excesses address. Extra tons, sent with message, will be transferred here.
                            .storeUint(0, 1) // custom payload. Empty in standard jettons
                            .storeCoins(opts.fwdAmount);
                        // if comment needed, it stored as Cell ref
                        if ("comment" in opts) {
                            commentPayload = (0, core_1.beginCell)()
                                .storeUint(0, 32)
                                .storeStringTail(opts.comment)
                                .endCell();
                            builder.storeBit(1);
                            builder.storeRef(commentPayload);
                        }
                        else {
                            // if not, store forward payload
                            if (opts.forwardPayload instanceof core_1.Slice) {
                                builder.storeBit(0);
                                builder.storeSlice(opts.forwardPayload);
                            }
                            else if (opts.forwardPayload instanceof core_1.Cell) {
                                builder.storeBit(1);
                                builder.storeRef(opts.forwardPayload);
                            }
                            else {
                                builder.storeBit(0);
                            }
                        }
                        // provider often obtained via client.open(contract) method
                        return [4 /*yield*/, provider.internal(via, {
                                value: opts.value, // value to pay gas
                                sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
                                body: builder.endCell(),
                            })];
                    case 1:
                        // provider often obtained via client.open(contract) method
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    JettonWallet.prototype.getWalletData = function (provider) {
        return __awaiter(this, void 0, void 0, function () {
            var stack;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, provider.get("get_wallet_data", [])];
                    case 1:
                        stack = (_a.sent()).stack;
                        return [2 /*return*/, {
                                balance: stack.readBigNumber(),
                                ownerAddress: stack.readAddress(),
                                jettonMasterAddress: stack.readAddress(),
                                jettonWalletCode: stack.readCell(),
                            }];
                }
            });
        });
    };
    JettonWallet.OPCODES = {
        TRANSFER: 0xf8a7ea5,
    };
    return JettonWallet;
}());
exports.JettonWallet = JettonWallet;
