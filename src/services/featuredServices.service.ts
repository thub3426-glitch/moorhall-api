import { Prisma } from '@prisma/client';
import db from '../config/db';

const featuredServicesService = {
  /**
   * Get all active featured services
   */
  async getFeaturedServices() {
    const services = await db.serviceItem.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return services;
  },

  /**
   * Get all services (including inactive) - admin use
   */
  async getAllServices() {
    const services = await db.serviceItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return services;
  },

  /**
   * Get service by ID
   */
  async getServiceById(id: number) {
    const service = await db.serviceItem.findUnique({
      where: { id },
    });
    if (!service) {
      throw new Error(`Service with ID ${id} not found`);
    }
    return service;
  },

  /**
   * Create new service
   */
  async createService(data: Prisma.ServiceItemCreateInput) {
    const service = await db.serviceItem.create({
      data,
    });
    return service;
  },

  /**
   * Update service
   */
  async updateService(id: number, data: Prisma.ServiceItemUpdateInput) {
    const service = await db.serviceItem.update({
      where: { id },
      data,
    });
    return service;
  },

  /**
   * Delete service
   */
  async deleteService(id: number) {
    const service = await db.serviceItem.delete({
      where: { id },
    });
    return service;
  },

  /**
   * Toggle service active status
   */
  async toggleServiceStatus(id: number) {
    const service = await db.serviceItem.findUnique({
      where: { id },
    });
    if (!service) {
      throw new Error(`Service with ID ${id} not found`);
    }

    return db.serviceItem.update({
      where: { id },
      data: { isActive: !service.isActive },
    });
  },
};

export default featuredServicesService;
