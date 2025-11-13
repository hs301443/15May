"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const member_1 = require("../../controllers/users/member");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
router
    .route("/")
    .get((0, catchAsync_1.catchAsync)(member_1.getAllMembers));
router
    .route("/:id")
    .get((0, catchAsync_1.catchAsync)(member_1.getMember));
exports.default = router;
