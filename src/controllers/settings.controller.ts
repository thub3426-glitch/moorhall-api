import { Request, Response } from 'express';
import * as settingsService from '../services/settings.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingsService.getSettings();
  return res.json(apiResponse.success(settings, 'Settings retrieved successfully'));
});

export const updateSetting = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const setting = await settingsService.updateSetting(id, req.body);
  return res.json(apiResponse.success(setting, 'Setting updated successfully'));
});

export const getSettingByKey = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const setting = await settingsService.getSettingByKey(key as string);
  if (!setting) {
    return res.status(404).json(apiResponse.notFound('Setting not found'));
  }
  return res.json(apiResponse.success(setting, 'Setting retrieved successfully'));
});

export default { getSettings, updateSetting, getSettingByKey };