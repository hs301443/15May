"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBanner = exports.getBanner = exports.deleteBanner = exports.getAllBanners = exports.createBanner = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const Errors_1 = require("../../Errors");
const handleImages_1 = require("../../utils/handleImages");
const deleteImage_1 = require("../../utils/deleteImage");
const uuid_1 = require("uuid");
const createBanner = async (req, res) => {
    const { image } = req.body;
    const bannerId = (0, uuid_1.v4)();
    await db_1.db.insert(schema_1.banners).values({
        id: bannerId,
        imagePath: await (0, handleImages_1.saveBase64Image)(image, bannerId, req, "banners"),
        createdAt: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
    });
    (0, response_1.SuccessResponse)(res, { message: "Banner created", bannerId }, 201);
};
exports.createBanner = createBanner;
const getAllBanners = async (req, res) => {
    const allBanners = await db_1.db.select().from(schema_1.banners);
    (0, response_1.SuccessResponse)(res, { banners: allBanners }, 200);
};
exports.getAllBanners = getAllBanners;
const deleteBanner = async (req, res) => {
    const id = req.params.id;
    const [banner] = await db_1.db.select().from(schema_1.banners).where((0, drizzle_orm_1.eq)(schema_1.banners.id, id));
    if (!banner)
        throw new Errors_1.NotFound("Banner not found");
    await (0, deleteImage_1.deletePhotoFromServer)(new URL(banner.imagePath).pathname);
    await db_1.db.delete(schema_1.banners).where((0, drizzle_orm_1.eq)(schema_1.banners.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Banner deleted" }, 200);
};
exports.deleteBanner = deleteBanner;
const getBanner = async (req, res) => {
    const id = req.params.id;
    const [banner] = await db_1.db.select().from(schema_1.banners).where((0, drizzle_orm_1.eq)(schema_1.banners.id, id));
    if (!banner)
        throw new Errors_1.NotFound("Banner not found");
    (0, response_1.SuccessResponse)(res, { banner }, 200);
};
exports.getBanner = getBanner;
const updateBanner = async (req, res) => {
    const { image } = req.body;
    const id = req.params.id;
    const [banner] = await db_1.db.select().from(schema_1.banners).where((0, drizzle_orm_1.eq)(schema_1.banners.id, id));
    if (!banner)
        throw new Errors_1.NotFound("Banner not found");
    const imagePath = banner.imagePath;
    const newImagePath = await (0, handleImages_1.saveBase64Image)(image, id, req, "banners");
    await (0, deleteImage_1.deletePhotoFromServer)(new URL(imagePath).pathname);
    await db_1.db.update(schema_1.banners).set({ imagePath: newImagePath }).where((0, drizzle_orm_1.eq)(schema_1.banners.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Banner updated" }, 200);
};
exports.updateBanner = updateBanner;
