import { Request } from "express";

import * as storeService from "../services/storesService";
import { failure, success } from "../utils";

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

export const getStoreDetails = async (req: Request) => {
  const { storeId } = req.params;

  const result = await storeService.getStoreDetailsService(storeId);
  if (!result) {
    return failure("Store not found", 404);
  }

  return success(result);
};
