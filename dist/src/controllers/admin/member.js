"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMember = exports.updateMember = exports.getMember = exports.getAllMembers = exports.createMember = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const Errors_1 = require("../../Errors");
const handleImages_1 = require("../../utils/handleImages");
const deleteImage_1 = require("../../utils/deleteImage");
const uuid_1 = require("uuid");
const createMember = async (req, res) => {
    const { name, photo, nameSymbol, photoSymbol, number } = req.body;
    const memberId = (0, uuid_1.v4)();
    await db_1.db.insert(schema_1.members).values({
        id: memberId,
        name,
        photo: await (0, handleImages_1.saveBase64Image)(photo, memberId, req, "members"),
        nameSymbol,
        photoSymbol: await (0, handleImages_1.saveBase64Image)(photoSymbol, memberId + "_symbol", req, "members/symbols"),
        number,
        createdAt: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
    });
    (0, response_1.SuccessResponse)(res, { message: "Member created", memberId }, 201);
};
exports.createMember = createMember;
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
const updateMember = async (req, res) => {
    const id = req.params.id;
    const { name, photo, nameSymbol, photoSymbol, number } = req.body;
    const [existingMember] = await db_1.db.select().from(schema_1.members).where((0, drizzle_orm_1.eq)(schema_1.members.id, id));
    if (!existingMember)
        throw new Errors_1.NotFound("Member not found");
    let photoPath = existingMember.photo;
    let photoSymbolPath = existingMember.photoSymbol;
    if (photo && photo.startsWith("data:")) {
        await (0, deleteImage_1.deletePhotoFromServer)(new URL(photoPath).pathname);
        photoPath = await (0, handleImages_1.saveBase64Image)(photo, id, req, "members");
    }
    if (photoSymbol && photoSymbol.startsWith("data:")) {
        await (0, deleteImage_1.deletePhotoFromServer)(new URL(photoSymbolPath).pathname);
        photoSymbolPath = await (0, handleImages_1.saveBase64Image)(photoSymbol, id + "_symbol", req, "members/symbols");
    }
    await db_1.db.update(schema_1.members).set({
        name,
        photo: photoPath,
        nameSymbol,
        photoSymbol: photoSymbolPath,
        number,
    }).where((0, drizzle_orm_1.eq)(schema_1.members.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Member updated" }, 200);
};
exports.updateMember = updateMember;
const deleteMember = async (req, res) => {
    const id = req.params.id;
    const [member] = await db_1.db.select().from(schema_1.members).where((0, drizzle_orm_1.eq)(schema_1.members.id, id));
    if (!member)
        throw new Errors_1.NotFound("Member not found");
    await (0, deleteImage_1.deletePhotoFromServer)(new URL(member.photo).pathname);
    await (0, deleteImage_1.deletePhotoFromServer)(new URL(member.photoSymbol).pathname);
    await db_1.db.delete(schema_1.members).where((0, drizzle_orm_1.eq)(schema_1.members.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Member deleted" }, 200);
};
exports.deleteMember = deleteMember;
