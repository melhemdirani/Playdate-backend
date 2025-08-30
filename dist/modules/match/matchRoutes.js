"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matchRequestSchema_1 = require("../matchRequest/matchRequestSchema");
const matchRequestController_1 = require("../matchRequest/matchRequestController");
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const matchSchema_1 = require("./matchSchema");
const matchController_1 = require("./matchController");
const router = (0, express_1.Router)();
router
    .route("/recommended")
    .get(auth_1.auth, (0, validate_1.validateRequest)(matchSchema_1.getRecommendedMatchesQuerySchema, "query"), matchController_1.getRecommendedMatchesHandler);
router.post("/request-match", auth_1.auth, (0, validate_1.validateRequest)(matchRequestSchema_1.createMatchRequestSchema, "body"), matchRequestController_1.createMatchRequestHandler);
router
    .route("/")
    .post(auth_1.auth, (0, validate_1.validateRequest)(matchSchema_1.createMatchSchema, "body"), matchController_1.createMatchHandler)
    .get(
// auth,
(0, validate_1.validateRequest)(matchSchema_1.getMatchesQuerySchema, "query"), matchController_1.getMatchesHandler);
router
    .route("/:id")
    .get(auth_1.auth, matchController_1.getMatchByIdHandler)
    .patch(auth_1.auth, (0, validate_1.validateRequest)(matchSchema_1.updateMatchSchema, "body"), matchController_1.updateMatchHandler)
    .delete(auth_1.auth, matchController_1.deleteMatchHandler);
router.route("/:id/join").post(auth_1.auth, matchController_1.joinMatchHandler);
router
    .route("/:id/result")
    .post(auth_1.auth, (0, validate_1.validateRequest)(matchSchema_1.reportMatchResultSchema, "body"), matchController_1.reportMatchResultHandler);
router
    .route("/:id/outcome")
    .post(auth_1.auth, (0, validate_1.validateRequest)(matchSchema_1.updateMatchOutcomeSchema, "body"), matchController_1.updateMatchOutcomeHandler);
router
    .route("/:id/ratings")
    .post(auth_1.auth, (0, validate_1.validateRequest)(matchSchema_1.submitPlayerRatingsSchema, "body"), matchController_1.submitPlayerRatingsHandler);
router
    .route("/:id/report-no-show")
    .post(auth_1.auth, (0, validate_1.validateRequest)(matchSchema_1.reportNoShowSchema, "body"), matchController_1.reportNoShowHandler);
router
    .route("/:matchId/no-show-reason/:noShowReportId")
    .post(auth_1.auth, (0, validate_1.validateRequest)(matchSchema_1.submitNoShowReasonSchema, "body"), matchController_1.submitNoShowReasonHandler);
router
    .route("/:id/reschedule")
    .post(auth_1.auth, (0, validate_1.validateRequest)(matchSchema_1.rescheduleMatchSchema, "body"), matchController_1.rescheduleMatchController);
router
    .route("/:id/cancel")
    .post(auth_1.auth, (0, validate_1.validateRequest)(matchSchema_1.cancelMatchSchema, "body"), matchController_1.cancelMatchHandler);
router
    .route("/:id/leave")
    .post(auth_1.auth, (0, validate_1.validateRequest)(matchSchema_1.leaveMatchSchema, "body"), matchController_1.leaveMatchHandler);
exports.default = router;
