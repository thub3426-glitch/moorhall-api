import { Request, Response } from 'express';
import cateringService from '../services/catering.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

// Create guest event booking - uses catering request model
export const createGuestEvent = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, eventType, eventDate, guests, eventLocation, notes } = req.body;
  
  const event = await cateringService.createCateringRequest({
    customerName: name,
    phoneNumber: phone,
    eventType,
    eventLocation: eventLocation || '',
    preferredDate: eventDate,
    guestCount: guests,
    notes,
  });
  
  return res.status(201).json(apiResponse.created(event, 'Event booking created successfully'));
});

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const page = req.query.page ? parseInt(req.query.page as string) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  
  const result = await cateringService.getCateringRequests({ status, page, limit });
  
  return res.json(
    apiResponse.success(result.requests, 'Events retrieved successfully', {
      page: page || 1,
      limit: limit || 20,
      total: result.total,
      totalPages: Math.ceil(result.total / (limit || 20)),
    })
  );
});

export const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const event = await cateringService.getCateringRequestById(id);
  return res.json(apiResponse.success(event, 'Event retrieved successfully'));
});

export const updateEventStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const { status } = req.body;
  const event = await cateringService.updateCateringStatus(id, status);
  return res.json(apiResponse.success(event, 'Event status updated successfully'));
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  await cateringService.deleteCateringRequest(id);
  return res.json(apiResponse.success(null, 'Event deleted successfully'));
});

export default {
  createGuestEvent,
  getEvents,
  getEventById,
  updateEventStatus,
  deleteEvent,
};