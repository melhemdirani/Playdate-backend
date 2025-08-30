import { createMatchRequestSchema } from "../matchRequest/matchRequestSchema";
import { createMatchRequestHandler } from "../matchRequest/matchRequestController";

import { Router } from "express";
import { auth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validate";
import {
  createMatchSchema,
  updateMatchSchema,
  reportMatchResultSchema,
  getMatchesQuerySchema,
  updateMatchOutcomeSchema,
  submitPlayerRatingsSchema,
  reportNoShowSchema,
  rescheduleMatchSchema,
  cancelMatchSchema,
  leaveMatchSchema,
  submitNoShowReasonSchema,
  getRecommendedMatchesQuerySchema,
} from "./matchSchema";
import {
  createMatchHandler,
  deleteMatchHandler,
  getMatchByIdHandler,
  getMatchesHandler,
  updateMatchHandler,
  joinMatchHandler,
  reportMatchResultHandler,
  updateMatchOutcomeHandler,
  submitPlayerRatingsHandler,
  reportNoShowHandler,
  rescheduleMatchController,
  cancelMatchHandler,
  leaveMatchHandler,
  getRecommendedMatchesHandler,
  submitNoShowReasonHandler,
} from "./matchController";

const router = Router();

router
  .route("/recommended")
  .get(
    auth,
    validateRequest(getRecommendedMatchesQuerySchema, "query"),
    getRecommendedMatchesHandler
  );
router.post(
  "/request-match",
  auth,
  validateRequest(createMatchRequestSchema, "body"),
  createMatchRequestHandler
);
router
  .route("/")
  .post(auth, validateRequest(createMatchSchema, "body"), createMatchHandler)
  .get(
    // auth,
    validateRequest(getMatchesQuerySchema, "query"),
    getMatchesHandler
  );

router
  .route("/:id")
  .get(auth, getMatchByIdHandler)
  .patch(auth, validateRequest(updateMatchSchema, "body"), updateMatchHandler)
  .delete(auth, deleteMatchHandler);

router.route("/:id/join").post(auth, joinMatchHandler);
router
  .route("/:id/result")
  .post(
    auth,
    validateRequest(reportMatchResultSchema, "body"),
    reportMatchResultHandler
  );
router
  .route("/:id/outcome")
  .post(
    auth,
    validateRequest(updateMatchOutcomeSchema, "body"),
    updateMatchOutcomeHandler
  );

router
  .route("/:id/ratings")
  .post(
    auth,
    validateRequest(submitPlayerRatingsSchema, "body"),
    submitPlayerRatingsHandler
  );

router
  .route("/:id/report-no-show")
  .post(auth, validateRequest(reportNoShowSchema, "body"), reportNoShowHandler);

router
  .route("/:matchId/no-show-reason/:noShowReportId")
  .post(
    auth,
    validateRequest(submitNoShowReasonSchema, "body"),
    submitNoShowReasonHandler
  );

router
  .route("/:id/reschedule")
  .post(
    auth,
    validateRequest(rescheduleMatchSchema, "body"),
    rescheduleMatchController
  );

router
  .route("/:id/cancel")
  .post(auth, validateRequest(cancelMatchSchema, "body"), cancelMatchHandler);
router
  .route("/:id/leave")
  .post(auth, validateRequest(leaveMatchSchema, "body"), leaveMatchHandler);

export default router;
