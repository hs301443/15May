"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const member_1 = require("../../controllers/admin/member");
const catchAsync_1 = require("../../utils/catchAsync");
const validation_1 = require("../../middlewares/validation");
const member_2 = require("../../validators/admin/member");
const router = (0, express_1.Router)();
router
    .route("/")
    .get((0, catchAsync_1.catchAsync)(member_1.getAllMembers))
    .post((0, validation_1.validate)(member_2.CreateMemberSchema), (0, catchAsync_1.catchAsync)(member_1.createMember));
router
    .route("/:id")
    .get((0, catchAsync_1.catchAsync)(member_1.getMember))
    .put((0, validation_1.validate)(member_2.UpdateMemberSchema), (0, catchAsync_1.catchAsync)(member_1.updateMember))
    .delete((0, catchAsync_1.catchAsync)(member_1.deleteMember));
exports.default = router;
