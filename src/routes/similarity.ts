import { Router } from "express";

import {
  similarityForStoreController,
  storeAreaSummaryController,
} from "../controllers";
import { handler } from "../utils";

const router = Router();

router.get("/store/:storeId", handler(similarityForStoreController));
router.get("/summary", handler(storeAreaSummaryController));

export default router;
