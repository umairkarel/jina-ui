"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileToBase64 = exports.serializer = exports.utils = void 0;
const utils = __importStar(require("./utils"));
exports.utils = utils;
const serializer = __importStar(require("./serializer"));
exports.serializer = serializer;
const jinaClient_1 = require("./jinaClient");
const utils_1 = require("./utils");
Object.defineProperty(exports, "fileToBase64", { enumerable: true, get: function () { return utils_1.fileToBase64; } });
exports.default = jinaClient_1.JinaClient;
//# sourceMappingURL=index.js.map