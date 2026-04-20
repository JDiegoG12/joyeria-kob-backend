import { Request, Response } from 'express';
import { SystemFacade } from '../facade/system.facade';

const systemFacade = new SystemFacade();

export const getCurrentGoldPriceController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const result = await systemFacade.getCurrentGoldPrice();

  if (!result.success) {
    return res.status(result.statusCode).json({
      success: false,
      error: result.error,
      message: result.message,
    });
  }

  return res.status(200).json({
    success: true,
    data: result.data,
    message: result.message,
  });
};
