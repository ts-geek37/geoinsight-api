import { Router } from "express";

import { handler } from "../utils";
import { getStoreController, listStoresController } from "../controllers";

const router = Router();

router.get("/", handler(listStoresController));

router.get("/:storeId", handler(getStoreController));

export default router;
