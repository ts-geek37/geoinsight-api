import { Request } from "express";

import { getStoreAreaSummary } from "../services";
import { findSimilarAreasForStore } from "../services/similarity";
import {
  buildSimilarityResponseDTO,
  failure,
  success
} from "../utils";

export const similarityForStoreController = async (req: Request) => {
  const storeId = req.params.storeId;

  const limit = req.query.limit
    ? Number.parseInt(req.query.limit as string, 10)
    : undefined;

  const raw = await findSimilarAreasForStore(storeId, limit);
  if (!raw) return failure("Store not found", 404);

  const dto = buildSimilarityResponseDTO(raw);

  return success(dto);
};

export const storeAreaSummaryController = async (req: Request) => {
  try {
    const result = await getStoreAreaSummary();
    return success(result);
  } catch (e: any) {
    return failure(e.message || "Failed to generate store area summary");
  }
};
