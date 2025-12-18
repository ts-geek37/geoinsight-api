import { Router } from "express";

import similarityRoutes from "./similarity";
import storeRoutes from "./stores";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ status: "ok", service: "GeoInsight API" });
});

router.use("/stores", storeRoutes);
router.use("/similarity", similarityRoutes); 
export default router;
