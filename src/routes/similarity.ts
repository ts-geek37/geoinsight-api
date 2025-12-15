import { Router } from "express";

import { similarityForStoreController } from "../controllers";
import { handle } from "../utils";

const router = Router();

router.get("/store/:storeId", handle(similarityForStoreController));

export default router;
