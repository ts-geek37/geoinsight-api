import { Request } from "express";

import { getStoreAreaSummary } from "../services";
import { findSimilarAreasForStore } from "../services/similarity";
import { failure, success } from "../utils";

export const similarityForStoreController = async (req: Request) => {
  const storeId = req.params.storeId;
  const limit = req.query.limit
    ? parseInt(req.query.limit as string, 10)
    : undefined;

  try {
    const result = await findSimilarAreasForStore(storeId, limit);
    return success(result);
  } catch (e: any) {
    return failure(e.message || "Failed to compute similarity");
  }
};

export const storeAreaSummaryController = async (req: Request) => {
  try {
    const result = await getStoreAreaSummary();
    return success(result);
  } catch (e: any) {
    return failure(e.message || "Failed to generate store area summary");
  }
};
