import { Router } from "express";

import { handle } from "../utils";
import { getStoreController, listStoresController } from "../controllers";

const router = Router();

router.get("/", handle(listStoresController));

router.get("/:storeId", handle(getStoreController));

export default router;
