"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dependentRequired_1 = __importDefault(require("./validation/dependentRequired"));
const dependentSchemas_1 = __importDefault(require("./applicator/dependentSchemas"));
const limitContains_1 = __importDefault(require("./validation/limitContains"));
const next = [dependentRequired_1.default, dependentSchemas_1.default, limitContains_1.default];
exports.default = next;
