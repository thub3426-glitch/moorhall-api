import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, page, limit } = req.query;
  const result = await paymentService.getPayments({
    orderId: orderId ? parseInt(orderId as string) : undefined,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });
  
  return res.json(apiResponse.success(result.payments, 'Payments retrieved successfully', {
    total: result.total,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
  }));
});

export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const payment = await paymentService.getPaymentById(id);
  return res.json(apiResponse.success(payment, 'Payment retrieved successfully'));
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const { status, note } = req.body;
  const adminId = req.user?.id;
  
  if (!adminId) {
    return res.status(401).json(apiResponse.unauthorized('Not authenticated'));
  }
  
  const payment = await paymentService.verifyPayment(id, status, adminId, note);
  return res.json(apiResponse.success(payment, `Payment ${status.toLowerCase()} successfully`));
});

export default { getPayments, getPaymentById, verifyPayment };