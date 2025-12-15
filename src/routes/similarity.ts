import { Router } from "express";

import {
  similarityForStoreController,
  storeAreaSummaryController,
} from "../controllers";
import { handle } from "../utils";

const router = Router();

router.get("/store/:storeId", handle(similarityForStoreController));
router.get("/summary", handle(storeAreaSummaryController));

export default router;
