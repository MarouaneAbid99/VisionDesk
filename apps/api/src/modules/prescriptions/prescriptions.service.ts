import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreatePrescriptionInput, UpdatePrescriptionInput } from './prescriptions.schema.js';

export const prescriptionsService = {
  async findByClient(clientId: string, shopId: string) {
    const client = await prisma.client.findFirst({ where: { id: clientId, shopId } });
    if (!client) {
      throw new AppError(404, 'Client not found');
    }

    return prisma.prescription.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string, shopId: string) {
    const prescription = await prisma.prescription.findFirst({
      where: { id },
      include: { client: true },
    });

    if (!prescription || prescription.client.shopId !== shopId) {
      throw new AppError(404, 'Prescription not found');
    }

    return prescription;
  },

  async create(shopId: string, input: CreatePrescriptionInput) {
    const client = await prisma.client.findFirst({ where: { id: input.clientId, shopId } });
    if (!client) {
      throw new AppError(404, 'Client not found');
    }

    return prisma.prescription.create({
      data: {
        clientId: input.clientId,
        odSph: input.odSph,
        odCyl: input.odCyl,
        odAxis: input.odAxis,
        odAdd: input.odAdd,
        osSph: input.osSph,
        osCyl: input.osCyl,
        osAxis: input.osAxis,
        osAdd: input.osAdd,
        pdFar: input.pdFar,
        pdNear: input.pdNear,
        doctorName: input.doctorName,
        notes: input.notes,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
  },

  async update(id: string, shopId: string, input: UpdatePrescriptionInput) {
    const prescription = await prisma.prescription.findFirst({
      where: { id },
      include: { client: true },
    });

    if (!prescription || prescription.client.shopId !== shopId) {
      throw new AppError(404, 'Prescription not found');
    }

    return prisma.prescription.update({
      where: { id },
      data: {
        ...input,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      },
    });
  },

  async delete(id: string, shopId: string) {
    const prescription = await prisma.prescription.findFirst({
      where: { id },
      include: { client: true },
    });

    if (!prescription || prescription.client.shopId !== shopId) {
      throw new AppError(404, 'Prescription not found');
    }

    await prisma.prescription.delete({ where: { id } });
    return { success: true };
  },
};
