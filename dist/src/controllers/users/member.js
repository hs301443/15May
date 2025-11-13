"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMember = exports.getAllMembers = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const Errors_1 = require("../../Errors");
const getAllMembers = async (req, res) => {
    const allMembers = await db_1.db.select().from(schema_1.members);
    (0, response_1.SuccessResponse)(res, { members: allMembers }, 200);
};
exports.getAllMembers = getAllMembers;
const getMember = async (req, res) => {
    const id = req.params.id;
    const [member] = await db_1.db.select().from(schema_1.members).where((0, drizzle_orm_1.eq)(schema_1.members.id, id));
    if (!member)
        throw new Errors_1.NotFound("Member not found");
    (0, response_1.SuccessResponse)(res, { member }, 200);
};
exports.getMember = getMember;
