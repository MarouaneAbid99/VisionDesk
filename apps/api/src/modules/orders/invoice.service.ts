import { PaymentStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';

function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'UNPAID':
      return 'Non payé';
    case 'PARTIAL':
      return 'Partiel';
    case 'PAID':
      return 'Payé';
    default:
      return status;
  }
}

export const invoiceService = {
  async generateInvoiceData(orderId: string, shopId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, shopId },
      include: {
        client: true,
        frame: { include: { brand: true } },
        lens: true,
        prescription: true,
        shop: true,
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    const deposit = Number(order.deposit) || 0;
    const totalPrice = Number(order.totalPrice) || 0;
    const remaining = totalPrice - deposit;

    const hasPrescriptionRef = Boolean(order.prescriptionId);
    const presc = order.prescription;
    const prescriptionPresence: 'not_linked' | 'linked' | 'missing' = !hasPrescriptionRef
      ? 'not_linked'
      : presc
        ? 'linked'
        : 'missing';

    const lineItems: Array<{
      type: string;
      description: string;
      details: string | null;
      price: number;
    }> = [];
    if (order.frame) {
      lineItems.push({
        type: 'frame',
        description: `Monture ${order.frame.brand?.name || ''} ${order.frame.reference}`.trim(),
        details: order.frame.color ? `Couleur: ${order.frame.color}` : null,
        price: Number(order.framePrice),
      });
    }
    if (order.lens) {
      lineItems.push({
        type: 'lens',
        description: `Verres ${order.lens.name}`,
        details: order.lens.coating ? `Traitement: ${order.lens.coating}` : null,
        price: Number(order.lensPrice),
      });
    }
    lineItems.push({
      type: 'service',
      description: 'Service de montage',
      details: null,
      price: Number(order.servicePrice) || 0,
    });

    return {
      paymentStatus: order.paymentStatus,
      paymentStatusLabel: paymentStatusLabel(order.paymentStatus),
      invoice: {
        number: `FAC-${order.orderNumber.replace('ORD-', '')}`,
        date: new Date().toISOString(),
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
      },
      shop: {
        name: order.shop.name,
        address: order.shop.address,
        phone: order.shop.phone,
        email: order.shop.email,
      },
      client: order.client ? {
        name: `${order.client.firstName} ${order.client.lastName}`.trim(),
        email: order.client.email,
        phone: order.client.phone,
        address: order.client.address,
      } : null,
      items: lineItems,
      pricing: {
        subtotal: Number(order.framePrice) + Number(order.lensPrice) + Number(order.servicePrice),
        discount: Number(order.discount) || 0,
        total: totalPrice,
        deposit: deposit,
        remaining: remaining,
        isPaid: remaining <= 0,
      },
      prescriptionPresence,
      prescription: presc
        ? {
            odSph: presc.odSph,
            odCyl: presc.odCyl,
            odAxis: presc.odAxis,
            odAdd: presc.odAdd,
            osSph: presc.osSph,
            osCyl: presc.osCyl,
            osAxis: presc.osAxis,
            osAdd: presc.osAdd,
            pdFar: presc.pdFar,
            pdNear: presc.pdNear,
            doctorName: presc.doctorName,
          }
        : null,
      createdBy: order.createdBy ? 
        `${order.createdBy.firstName} ${order.createdBy.lastName}`.trim() : null,
    };
  },
};
