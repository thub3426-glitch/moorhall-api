import { Request, Response } from 'express';
import reservationService from '../services/reservation.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const createGuestReservation = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, date, time, guests, notes } = req.body;
  
  const reservation = await reservationService.createReservation({
    customerName: name,
    phoneNumber: phone,
    reservationDate: date,
    reservationTime: time,
    guestCount: guests,
    notes,
  });
  
  return res.status(201).json(apiResponse.created(reservation, 'Reservation created successfully'));
});

export const getReservations = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const page = req.query.page ? parseInt(req.query.page as string) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

  const result = await reservationService.getReservations({ status, page, limit });

  return res.json(
    apiResponse.success(result.reservations, 'Reservations retrieved successfully', {
      page: page || 1,
      limit: limit || 20,
      total: result.total,
      totalPages: Math.ceil(result.total / (limit || 20)),
    })
  );
});

export const getReservationById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const reservation = await reservationService.getReservationById(id);
  return res.json(apiResponse.success(reservation, 'Reservation retrieved successfully'));
});

export const updateReservationStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const { status } = req.body;
  const reservation = await reservationService.updateReservationStatus(id, status);
  return res.json(apiResponse.success(reservation, 'Reservation status updated successfully'));
});

export const createReservation = asyncHandler(async (req: Request, res: Response) => {
  const reservation = await reservationService.createReservation(req.body);
  return res.status(201).json(apiResponse.created(reservation, 'Reservation created successfully'));
});

export const deleteReservation = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  await reservationService.deleteReservation(id);
  return res.json(apiResponse.success(null, 'Reservation deleted successfully'));
});

export default {
  createGuestReservation,
  getReservations,
  getReservationById,
  updateReservationStatus,
  createReservation,
  deleteReservation,
};