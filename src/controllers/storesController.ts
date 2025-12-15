import { Request } from "express";

import * as storeService from "../services/storesService";
import { failure, success } from "../utils/response";

export const listStoresController = async () => {
  const stores = await storeService.getStores();
  return success(stores);
};

export const getStoreController = async (req: Request) => {
  const { storeId } = req.params;

  const result = await storeService.getStoreWithSales(storeId);
  if (!result) return failure("Store not found", 404);

  return success(result);
};

// export const searchStoresController = async (req: Request) => {
//   const { query: q } = req.query;

//   if (!q) return failure("Search query required", 400);

//   const results = await storeService.searchStores(q.toString());
//   return success(results);
// };

// export const createStoreController = async (req: Request) => {
//   const store = await storeService.createStore(req.body);
//   return success(store, 201);
// };

// export const updateStoreController = async (req: Request) => {
//   const { storeId } = req.params;

//   const updated = await storeService.updateStore(storeId, req.body);
//   if (!updated) return failure("Store not found", 404);

//   return success(updated);
// };

// export const deleteStoreController = async (req: Request) => {
//   const { storeId } = req.params;

//   const deleted = await storeService.deleteStore(storeId);
//   if (!deleted) return failure("Store not found", 404);

//   return success({ deleted: true });
// };

// export const storesBySegmentController = async (req: Request) => {
//   const { segment } = req.params;

//   const stores = await storeService.getStoresByRFMSegment(segment);
//   return success(stores);
// };
