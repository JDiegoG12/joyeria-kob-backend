import { Request, Response } from 'express';
import { GoldPriceFacade } from '../facade/gold-price.facade';
import { UpdateGoldPriceDTO } from '../../../shared/dtos/gold-price.dto';

const goldPriceFacade = new GoldPriceFacade();

export const updateGoldPriceController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const updateData: UpdateGoldPriceDTO = req.body;
  const result = await goldPriceFacade.updateGoldPrice(updateData);

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

export const getGoldPriceHistoryController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const result = await goldPriceFacade.getGoldPriceHistory();

  if (!result.success) {
    return res.status(result.statusCode || 500).json({
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
