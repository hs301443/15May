"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyCode = exports.sendResetCode = exports.getFcmToken = exports.login = exports.verifyEmail = exports.signup = void 0;
const handleImages_1 = require("../../utils/handleImages");
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const bcrypt_1 = __importDefault(require("bcrypt"));
const response_1 = require("../../utils/response");
const crypto_1 = require("crypto");
const Errors_1 = require("../../Errors");
const auth_1 = require("../../utils/auth");
const sendEmails_1 = require("../../utils/sendEmails");
const BadRequest_1 = require("../../Errors/BadRequest");
const signup = async (req, res) => {
    const data = req.body;
    const [existing] = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.email, data.email), (0, drizzle_orm_1.eq)(schema_1.users.phoneNumber, data.phoneNumber)));
    if (existing) {
        if (existing.email === data.email)
            throw new Errors_1.UniqueConstrainError("Email", "User already signup with this email");
        if (existing.phoneNumber === data.phoneNumber)
            throw new Errors_1.UniqueConstrainError("Phone Number", "User already signup with this phone number");
    }
    const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
    const userId = (0, uuid_1.v4)();
    let imagePath = null;
    if (data.role === "member") {
        imagePath = await (0, handleImages_1.saveBase64Image)(data.imageBase64, userId, req, "users");
    }
    const code = (0, crypto_1.randomInt)(100000, 999999).toString();
    const newUse = {
        id: userId,
        name: data.name,
        phoneNumber: data.phoneNumber,
        role: data.role,
        email: data.email,
        hashedPassword,
        purpose: data.role === "guest" ? data.purpose : null,
        imagePath,
        dateOfBirth: new Date(data.dateOfBirth),
        status: "pending",
        createdAt: new Date(new Date().getTime() + 3 * 60 * 60 * 1000), // Adjusting for timezone
        updatedAt: new Date(new Date().getTime() + 3 * 60 * 60 * 1000), // Adjusting for timezone
    };
    if (!req.user) {
        await db_1.db.insert(schema_1.emailVerifications).values({
            userId: userId,
            code,
        });
        await (0, sendEmails_1.sendEmail)(data.email, "Email Verification", `Your verification code is ${code}`);
    }
    else {
        newUse.status = "approved";
        newUse.isVerified = true;
    }
    await db_1.db.insert(schema_1.users).values(newUse);
    (0, response_1.SuccessResponse)(res, {
        message: "User Signup successfully get verification code from gmail",
        userId: userId,
    }, 201);
};
exports.signup = signup;
const verifyEmail = async (req, res) => {
    const { userId, code } = req.body;
    const user = await db_1.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, userId),
    });
    if (!user)
        throw new Errors_1.NotFound("User not found");
    const record = await db_1.db.query.emailVerifications.findFirst({
        where: (ev, { eq }) => eq(ev.userId, user.id),
    });
    if (!record || record.code !== code)
        throw new BadRequest_1.BadRequest("Invalid verification code");
    await db_1.db.update(schema_1.users).set({ isVerified: true }).where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
    await db_1.db
        .delete(schema_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(schema_1.emailVerifications.userId, user.id));
    res.json({ message: "Email verified successfully" });
};
exports.verifyEmail = verifyEmail;
const login = async (req, res) => {
    const data = req.body;
    const user = await db_1.db.query.users.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.users.email, data.email),
    });
    if (!user) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    const isMatch = await bcrypt_1.default.compare(data.password, user.hashedPassword);
    if (!isMatch) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    if (user.status !== "approved") {
        throw new Errors_1.ForbiddenError("Your account is not approved yet. Please wait for approval.");
    }
    if (!user.isVerified) {
        throw new Errors_1.ForbiddenError("Verify your email first");
    }
    const token = (0, auth_1.generateToken)({
        id: user.id,
        name: user.name,
        role: user.role === "member" ? "approved_member_user" : "approved_guest_user",
    });
    (0, response_1.SuccessResponse)(res, { message: "login Successful", tokne: token }, 200);
};
exports.login = login;
const getFcmToken = async (req, res) => {
    const { token } = req.body;
    const userId = req.user.id;
    await db_1.db.update(schema_1.users).set({ fcmtoken: token }).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
    res.json({ success: true });
};
exports.getFcmToken = getFcmToken;
const sendResetCode = async (req, res) => {
    const { email } = req.body;
    const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
    if (!user)
        throw new Errors_1.NotFound("User not found");
    if (!user.isVerified || user.status !== "approved")
        throw new BadRequest_1.BadRequest("User is not verified or approved");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await db_1.db
        .delete(schema_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(schema_1.emailVerifications.userId, user.id));
    await db_1.db
        .insert(schema_1.emailVerifications)
        .values({ code: code, createdAt: new Date(), userId: user.id });
    await (0, sendEmails_1.sendEmail)(email, "Password Reset Code", `Your reset code is: ${code}\nIt will expire in 2 hours.`);
    (0, response_1.SuccessResponse)(res, { message: "Reset code sent to your email" }, 200);
};
exports.sendResetCode = sendResetCode;
const verifyCode = async (req, res) => {
    const { email, code } = req.body;
    const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
    const [rowcode] = await db_1.db
        .select()
        .from(schema_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(schema_1.emailVerifications.userId, user.id));
    if (!user || rowcode.code !== code) {
        throw new BadRequest_1.BadRequest("Invalid email or reset code");
    }
    (0, response_1.SuccessResponse)(res, { message: "Code verified successfully" }, 200);
};
exports.verifyCode = verifyCode;
const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
    const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
    if (!user)
        throw new Errors_1.NotFound("User not found");
    const [rowcode] = await db_1.db
        .select()
        .from(schema_1.emailVerifications)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.emailVerifications.userId, user.id), (0, drizzle_orm_1.eq)(schema_1.emailVerifications.code, code)));
    if (!rowcode)
        throw new BadRequest_1.BadRequest("Invalid reset code");
    const hashed = await bcrypt_1.default.hash(newPassword, 10);
    await db_1.db
        .update(schema_1.users)
        .set({ hashedPassword: hashed })
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
    await db_1.db
        .delete(schema_1.emailVerifications)
        .where((0, drizzle_orm_1.eq)(schema_1.emailVerifications.userId, user.id));
    (0, response_1.SuccessResponse)(res, { message: "Password reset successfully" }, 200);
};
exports.resetPassword = resetPassword;
