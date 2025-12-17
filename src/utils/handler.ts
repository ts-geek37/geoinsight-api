import { Request, Response } from "express";

export const handler = (fn: Function) => {
  return async (req: Request, res: Response) => {
    try {
      const result = await fn(req, res);
      if (!result) {
        return res.status(200).json({
          success: true,
          data: null,
          error: null,
        });
      }

      return res.status(result.status).json(result.body);
    } catch (err: any) {
      console.error("Unhandled Controller Error:", err.message, err.status);

      const message = err.message || "Internal server error";
      const status = err.status || 500;
      return res.status(status).json({
        success: false,
        data: null,
        error: message,
      });
    }
  };
};
