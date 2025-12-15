 import { Request } from "express";
import { failure, success } from "../utils/response";
import { findSimilarAreasForStore } from "../services/similarity";

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
