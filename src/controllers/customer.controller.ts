import { Request, Response } from 'express';
import customerService from '../services/customer.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const result = await customerService.getCustomers(page, limit, search);
  return res.json(apiResponse.success(result.customers, 'Customers retrieved successfully', result.pagination));
});

export const getCustomerByPhone = asyncHandler(async (req: Request, res: Response) => {
  const phone = req.params.phone as string;
  const customer = await customerService.getCustomerByPhone(phone);
  return res.json(apiResponse.success(customer, 'Customer retrieved successfully'));
});

export default { getCustomers, getCustomerByPhone };
