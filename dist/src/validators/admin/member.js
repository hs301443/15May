"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMemberSchema = exports.CreateMemberSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.CreateMemberSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1),
        photo: zod_1.default.string().min(1),
        nameSymbol: zod_1.default.string().min(1),
        photoSymbol: zod_1.default.string().min(1),
        number: zod_1.default.string().min(1),
    }),
});
exports.UpdateMemberSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1).optional(),
        photo: zod_1.default.string().min(1).optional(),
        nameSymbol: zod_1.default.string().min(1).optional(),
        photoSymbol: zod_1.default.string().min(1).optional(),
        number: zod_1.default.string().min(1).optional(),
    }),
});
