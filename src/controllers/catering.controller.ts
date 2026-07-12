import { Request, Response } from 'express';
import cateringService from '../services/catering.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const createGuestCateringRequest = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, eventType, eventLocation, preferredDate, guests, notes } = req.body;
  
  const request = await cateringService.createCateringRequest({
    customerName: name,
    phoneNumber: phone,
    eventType,
    eventLocation,
    preferredDate,
    guestCount: guests,
    notes,
  });
  
  return res.status(201).json(apiResponse.created(request, 'Catering request created successfully'));
});

export const getCateringRequests = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const page = req.query.page ? parseInt(req.query.page as string) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  
  const result = await cateringService.getCateringRequests({ status, page, limit });
  
  return res.json(
    apiResponse.success(result.requests, 'Catering requests retrieved successfully', {
      page: page || 1,
      limit: limit || 20,
      total: result.total,
      totalPages: Math.ceil(result.total / (limit || 20)),
    })
  );
});

export const getCateringRequestById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const request = await cateringService.getCateringRequestById(id);
  return res.json(apiResponse.success(request, 'Catering request retrieved successfully'));
});

export const updateCateringStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const { status } = req.body;
  const request = await cateringService.updateCateringStatus(id, status);
  return res.json(apiResponse.success(request, 'Catering request status updated successfully'));
});

export const deleteCateringRequest = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  await cateringService.deleteCateringRequest(id);
  return res.json(apiResponse.success(null, 'Catering request deleted successfully'));
});

export default {
  createGuestCateringRequest,
  getCateringRequests,
  getCateringRequestById,
  updateCateringStatus,
  deleteCateringRequest,
};