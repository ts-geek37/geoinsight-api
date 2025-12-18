import { Router } from "express";

import { handler } from "../utils";
import {
  getStoreController,
  listStoresController,
  getStoreDetails,
} from "../controllers";

const router = Router();

router.get("/", handler(listStoresController));

router.get("/:storeId", handler(getStoreController));

router.get("/:storeId/details", handler(getStoreDetails));

export default router;
