import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';

const formatDate = (date: Date | string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (date: Date | string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount: number | string | null) => {
  if (amount === null || amount === undefined) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(amount));
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: 'Brouillon',
    PENDING: 'En attente',
    IN_PROGRESS: 'En cours',
    IN_ATELIER: 'En atelier',
    READY: 'Prête',
    // Legacy alias (normalized to READY in DB)
    READY_FOR_PICKUP: 'Prête',
    PICKED_UP: 'Retirée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
  };
  return labels[status] || status.replace('_', ' ');
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    DRAFT: '#6b7280',
    PENDING: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    IN_ATELIER: '#8b5cf6',
    READY: '#10b981',
    READY_FOR_PICKUP: '#10b981',
    PICKED_UP: '#059669',
    DELIVERED: '#047857',
    CANCELLED: '#ef4444',
  };
  return colors[status] || '#6b7280';
};

const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
    font-size: 11px; 
    color: #1f2937; 
    line-height: 1.5;
    background: white;
  }
  .page { 
    max-width: 210mm; 
    margin: 0 auto; 
    padding: 15mm; 
  }
  @media print { 
    body { padding: 0; background: white; }
    .page { padding: 10mm; max-width: none; }
    .no-print { display: none !important; }
  }
  @page { 
    size: A4; 
    margin: 10mm; 
  }
`;

export const documentsService = {
  async getOrderData(orderId: string, shopId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, shopId },
      include: {
        shop: true,
        client: true,
        prescription: true,
        frame: { include: { brand: true } },
        lens: true,
        createdBy: { select: { firstName: true, lastName: true } },
        atelierJob: { include: { technician: { select: { firstName: true, lastName: true } } } },
      },
    });

    if (!order) throw new AppError(404, 'Order not found');
    return order;
  },

  async getPrescriptionData(prescriptionId: string, shopId: string) {
    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId },
      include: {
        client: { include: { shop: true } },
      },
    });

    if (!prescription) throw new AppError(404, 'Prescription not found');
    if (prescription.client.shop.id !== shopId) throw new AppError(403, 'Access denied');
    return prescription;
  },

  generateOrderPdfHtml(order: any) {
    const shop = order.shop;
    const client = order.client;
    const prescription = order.prescription;
    const frame = order.frame;
    const lens = order.lens;
    const balance = Number(order.totalPrice) - Number(order.deposit || 0);

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Commande ${order.orderNumber} - ${shop.name}</title>
  <style>
    ${baseStyles}
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 25px; 
      padding-bottom: 20px; 
      border-bottom: 3px solid #2563eb; 
    }
    .shop-info { max-width: 60%; }
    .shop-info h1 { 
      font-size: 22px; 
      color: #2563eb; 
      margin-bottom: 8px; 
      font-weight: 700;
    }
    .shop-info p { color: #4b5563; font-size: 10px; line-height: 1.6; }
    .order-meta { text-align: right; }
    .order-meta .order-number { 
      font-size: 14px; 
      font-weight: 700; 
      color: #1f2937;
      margin-bottom: 8px;
    }
    .order-meta .date { font-size: 10px; color: #6b7280; margin-bottom: 8px; }
    .status-badge { 
      display: inline-block; 
      padding: 5px 14px; 
      border-radius: 20px; 
      font-size: 10px; 
      font-weight: 600; 
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section { margin-bottom: 20px; }
    .section-title { 
      font-size: 11px; 
      font-weight: 700; 
      color: #2563eb; 
      margin-bottom: 10px; 
      padding-bottom: 6px; 
      border-bottom: 1px solid #e5e7eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .card { 
      background: #f8fafc; 
      padding: 14px; 
      border-radius: 6px; 
      border: 1px solid #e2e8f0;
    }
    .card h3 { 
      font-size: 10px; 
      font-weight: 600; 
      margin-bottom: 10px; 
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card .name { font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
    .card p { margin-bottom: 4px; font-size: 10px; }
    .card .label { color: #64748b; }
    .rx-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 8px;
      font-size: 10px;
    }
    .rx-table th, .rx-table td { 
      padding: 8px 10px; 
      text-align: center; 
      border: 1px solid #e2e8f0; 
    }
    .rx-table th { 
      background: #2563eb; 
      color: white; 
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
    }
    .rx-table .eye-label { 
      background: #f1f5f9; 
      font-weight: 600; 
      text-align: left;
      color: #334155;
    }
    .rx-table td { font-size: 11px; }
    .pd-row { 
      margin-top: 10px; 
      padding: 10px; 
      background: #f0fdf4; 
      border-radius: 4px;
      font-size: 10px;
    }
    .pd-row strong { color: #166534; }
    .products-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .product-card { 
      background: #fafafa; 
      padding: 12px; 
      border-radius: 6px;
      border-left: 3px solid #2563eb;
    }
    .product-card h4 { 
      font-size: 10px; 
      color: #64748b; 
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .product-card .product-name { font-size: 12px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
    .product-card p { font-size: 10px; margin-bottom: 3px; }
    .pricing-section { 
      background: #f8fafc; 
      padding: 15px; 
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .pricing-table { width: 100%; }
    .pricing-table td { padding: 6px 0; font-size: 11px; }
    .pricing-table .line { border-bottom: 1px solid #e2e8f0; }
    .pricing-table .subtotal { border-top: 1px solid #cbd5e1; font-weight: 600; }
    .pricing-table .total { 
      border-top: 2px solid #1e293b; 
      font-weight: 700; 
      font-size: 13px;
      color: #1e293b;
    }
    .pricing-table .deposit { color: #16a34a; }
    .pricing-table .balance { 
      background: #fef3c7; 
      font-weight: 700;
      font-size: 12px;
    }
    .pricing-table .balance td { padding: 10px 0; }
    .notes-section { 
      margin-top: 15px;
      padding: 12px; 
      background: #fffbeb; 
      border-radius: 6px;
      border-left: 3px solid #f59e0b;
    }
    .notes-section h4 { font-size: 10px; color: #92400e; margin-bottom: 6px; text-transform: uppercase; }
    .notes-section p { font-size: 10px; color: #78350f; }
    .dates-timeline {
      display: flex;
      gap: 20px;
      margin-top: 15px;
      padding: 12px;
      background: #f1f5f9;
      border-radius: 6px;
    }
    .timeline-item { text-align: center; flex: 1; }
    .timeline-item .label { font-size: 9px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .timeline-item .date { font-size: 11px; font-weight: 600; color: #334155; }
    .footer { 
      margin-top: 30px; 
      padding-top: 15px; 
      border-top: 1px solid #e2e8f0; 
      text-align: center; 
      color: #94a3b8; 
      font-size: 9px; 
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="shop-info">
        <h1>${shop.name}</h1>
        ${shop.address ? `<p>${shop.address}</p>` : ''}
        ${shop.phone ? `<p>Tél: ${shop.phone}</p>` : ''}
        ${shop.email ? `<p>${shop.email}</p>` : ''}
      </div>
      <div class="order-meta">
        <div class="order-number">${order.orderNumber}</div>
        <div class="date">Créée le ${formatDate(order.createdAt)}</div>
        <span class="status-badge" style="background: ${getStatusColor(order.status)}">
          ${getStatusLabel(order.status)}
        </span>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Client</h3>
        <div class="name">${client.firstName} ${client.lastName}</div>
        ${client.phone ? `<p><span class="label">Tél:</span> ${client.phone}</p>` : ''}
        ${client.email ? `<p><span class="label">Email:</span> ${client.email}</p>` : ''}
        ${client.address ? `<p><span class="label">Adresse:</span> ${client.address}</p>` : ''}
        ${client.dateOfBirth ? `<p><span class="label">Né(e) le:</span> ${formatDate(client.dateOfBirth)}</p>` : ''}
      </div>
      <div class="card">
        <h3>Informations Commande</h3>
        <p><span class="label">Créée par:</span> ${order.createdBy?.firstName || ''} ${order.createdBy?.lastName || ''}</p>
        ${order.atelierJob?.technician ? `<p><span class="label">Technicien:</span> ${order.atelierJob.technician.firstName} ${order.atelierJob.technician.lastName}</p>` : ''}
        ${order.atelierJob ? `<p><span class="label">Atelier:</span> ${getStatusLabel(order.atelierJob.status)}</p>` : ''}
      </div>
    </div>

    ${prescription ? `
    <div class="section">
      <div class="section-title">Prescription Optique</div>
      <table class="rx-table">
        <thead>
          <tr>
            <th style="width: 100px;">Œil</th>
            <th>Sphère</th>
            <th>Cylindre</th>
            <th>Axe</th>
            <th>Addition</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="eye-label">OD (Droit)</td>
            <td>${prescription.odSph !== null ? (prescription.odSph > 0 ? '+' : '') + prescription.odSph : '-'}</td>
            <td>${prescription.odCyl !== null ? (prescription.odCyl > 0 ? '+' : '') + prescription.odCyl : '-'}</td>
            <td>${prescription.odAxis !== null ? prescription.odAxis + '°' : '-'}</td>
            <td>${prescription.odAdd !== null ? '+' + prescription.odAdd : '-'}</td>
          </tr>
          <tr>
            <td class="eye-label">OS (Gauche)</td>
            <td>${prescription.osSph !== null ? (prescription.osSph > 0 ? '+' : '') + prescription.osSph : '-'}</td>
            <td>${prescription.osCyl !== null ? (prescription.osCyl > 0 ? '+' : '') + prescription.osCyl : '-'}</td>
            <td>${prescription.osAxis !== null ? prescription.osAxis + '°' : '-'}</td>
            <td>${prescription.osAdd !== null ? '+' + prescription.osAdd : '-'}</td>
          </tr>
        </tbody>
      </table>
      ${prescription.pdFar || prescription.pdNear ? `
      <div class="pd-row">
        <strong>Écart Pupillaire (PD):</strong>
        ${prescription.pdFar ? `Vision de loin: ${prescription.pdFar} mm` : ''}
        ${prescription.pdFar && prescription.pdNear ? ' | ' : ''}
        ${prescription.pdNear ? `Vision de près: ${prescription.pdNear} mm` : ''}
      </div>
      ` : ''}
      ${prescription.doctorName ? `<p style="margin-top: 8px; font-size: 10px;"><span class="label">Prescripteur:</span> <strong>${prescription.doctorName}</strong></p>` : ''}
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Équipement</div>
      <div class="products-grid">
        ${frame ? `
        <div class="product-card">
          <h4>Monture</h4>
          <div class="product-name">${frame.reference}</div>
          ${frame.model ? `<p>${frame.model}</p>` : ''}
          ${frame.brand ? `<p><span class="label">Marque:</span> ${frame.brand.name}</p>` : ''}
          ${frame.color ? `<p><span class="label">Couleur:</span> ${frame.color}</p>` : ''}
          ${frame.size ? `<p><span class="label">Taille:</span> ${frame.size}</p>` : ''}
        </div>
        ` : '<div class="product-card"><h4>Monture</h4><p class="label">Non spécifiée</p></div>'}
        ${lens ? `
        <div class="product-card">
          <h4>Verres</h4>
          <div class="product-name">${lens.name}</div>
          <p><span class="label">Type:</span> ${lens.lensType?.replace('_', ' ') || '-'}</p>
          ${lens.index ? `<p><span class="label">Indice:</span> ${lens.index}</p>` : ''}
          ${lens.coating && lens.coating !== 'NONE' ? `<p><span class="label">Traitement:</span> ${lens.coating.replace('_', ' ')}</p>` : ''}
        </div>
        ` : '<div class="product-card"><h4>Verres</h4><p class="label">Non spécifiés</p></div>'}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Tarification</div>
      <div class="pricing-section">
        <table class="pricing-table">
          <tr class="line"><td>Monture</td><td style="text-align: right;">${formatCurrency(order.framePrice)}</td></tr>
          <tr class="line"><td>Verres</td><td style="text-align: right;">${formatCurrency(order.lensPrice)}</td></tr>
          <tr class="line"><td>Prestations</td><td style="text-align: right;">${formatCurrency(order.servicePrice)}</td></tr>
          ${Number(order.discount) > 0 ? `<tr class="line"><td>Remise</td><td style="text-align: right; color: #dc2626;">- ${formatCurrency(order.discount)}</td></tr>` : ''}
          <tr class="total"><td>TOTAL TTC</td><td style="text-align: right;">${formatCurrency(order.totalPrice)}</td></tr>
          ${Number(order.deposit) > 0 ? `
          <tr class="deposit"><td>Acompte versé</td><td style="text-align: right;">- ${formatCurrency(order.deposit)}</td></tr>
          <tr class="balance"><td><strong>RESTE À PAYER</strong></td><td style="text-align: right;"><strong>${formatCurrency(balance)}</strong></td></tr>
          ` : ''}
        </table>
      </div>
    </div>

    <div class="dates-timeline">
      <div class="timeline-item">
        <div class="label">Créée le</div>
        <div class="date">${formatDate(order.createdAt)}</div>
      </div>
      ${order.dueDate ? `
      <div class="timeline-item">
        <div class="label">Date prévue</div>
        <div class="date">${formatDate(order.dueDate)}</div>
      </div>
      ` : ''}
      ${order.readyAt ? `
      <div class="timeline-item">
        <div class="label">Prête le</div>
        <div class="date">${formatDate(order.readyAt)}</div>
      </div>
      ` : ''}
      ${order.pickedUpAt ? `
      <div class="timeline-item">
        <div class="label">Retirée le</div>
        <div class="date">${formatDate(order.pickedUpAt)}</div>
      </div>
      ` : ''}
      ${order.deliveredAt ? `
      <div class="timeline-item">
        <div class="label">Livrée le</div>
        <div class="date">${formatDate(order.deliveredAt)}</div>
      </div>
      ` : ''}
    </div>

    ${order.notes ? `
    <div class="notes-section">
      <h4>Notes</h4>
      <p>${order.notes}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p>Document généré le ${formatDateTime(new Date())}</p>
      <p>${shop.name}${shop.address ? ` • ${shop.address}` : ''}${shop.phone ? ` • ${shop.phone}` : ''}</p>
    </div>
  </div>
</body>
</html>`;
  },

  generatePrescriptionPdfHtml(prescription: any) {
    const client = prescription.client;
    const shop = client.shop;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prescription Optique - ${client.firstName} ${client.lastName}</title>
  <style>
    ${baseStyles}
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 25px; 
      padding-bottom: 20px; 
      border-bottom: 3px solid #2563eb; 
    }
    .shop-info { max-width: 55%; }
    .shop-info h1 { 
      font-size: 22px; 
      color: #2563eb; 
      margin-bottom: 8px; 
      font-weight: 700;
    }
    .shop-info p { color: #4b5563; font-size: 10px; line-height: 1.6; }
    .doc-meta { text-align: right; }
    .doc-meta .doc-type { 
      font-size: 16px; 
      font-weight: 700; 
      color: #1f2937;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .doc-meta .dates { font-size: 10px; color: #6b7280; }
    .doc-meta .dates p { margin-bottom: 4px; }
    .validity-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .validity-valid { background: #dcfce7; color: #166534; }
    .validity-expired { background: #fee2e2; color: #991b1b; }
    .client-card { 
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 20px; 
      border-radius: 8px; 
      margin-bottom: 25px;
      border: 1px solid #e2e8f0;
    }
    .client-card .client-name { 
      font-size: 18px; 
      font-weight: 700; 
      color: #1e293b;
      margin-bottom: 12px;
    }
    .client-card .client-details { 
      display: grid; 
      grid-template-columns: repeat(2, 1fr); 
      gap: 8px;
      font-size: 10px;
    }
    .client-card .detail-item { }
    .client-card .label { color: #64748b; }
    .section { margin-bottom: 20px; }
    .section-title { 
      font-size: 12px; 
      font-weight: 700; 
      color: #2563eb; 
      margin-bottom: 12px; 
      padding-bottom: 8px; 
      border-bottom: 2px solid #e5e7eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .rx-container {
      background: white;
      border: 2px solid #2563eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .rx-table { 
      width: 100%; 
      border-collapse: collapse;
    }
    .rx-table th { 
      background: #2563eb; 
      color: white; 
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      padding: 12px 8px;
      letter-spacing: 0.5px;
    }
    .rx-table td { 
      padding: 14px 8px; 
      text-align: center; 
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
      font-weight: 500;
    }
    .rx-table .eye-label { 
      background: #f8fafc; 
      font-weight: 700; 
      text-align: left;
      color: #1e293b;
      font-size: 11px;
      padding-left: 15px;
    }
    .rx-table .value-positive { color: #059669; }
    .rx-table .value-negative { color: #dc2626; }
    .pd-section { 
      margin-top: 20px; 
      padding: 16px; 
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-radius: 8px;
      border: 1px solid #bbf7d0;
    }
    .pd-section h4 { 
      color: #166534; 
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .pd-values {
      display: flex;
      gap: 30px;
    }
    .pd-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pd-item .pd-label { font-size: 10px; color: #166534; }
    .pd-item .pd-value { 
      font-size: 16px; 
      font-weight: 700; 
      color: #15803d;
      background: white;
      padding: 4px 12px;
      border-radius: 4px;
    }
    .doctor-section {
      margin-top: 20px;
      padding: 14px;
      background: #f8fafc;
      border-radius: 6px;
      border-left: 3px solid #2563eb;
    }
    .doctor-section .label { font-size: 9px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .doctor-section .name { font-size: 12px; font-weight: 600; color: #1e293b; }
    .notes-section { 
      margin-top: 20px;
      padding: 14px; 
      background: #fffbeb; 
      border-radius: 6px;
      border-left: 3px solid #f59e0b;
    }
    .notes-section h4 { 
      font-size: 10px; 
      color: #92400e; 
      margin-bottom: 8px; 
      text-transform: uppercase;
      font-weight: 700;
    }
    .notes-section p { font-size: 10px; color: #78350f; line-height: 1.6; }
    .footer { 
      margin-top: 35px; 
      padding-top: 15px; 
      border-top: 1px solid #e2e8f0; 
      text-align: center; 
      color: #94a3b8; 
      font-size: 9px; 
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="shop-info">
        <h1>${shop.name}</h1>
        ${shop.address ? `<p>${shop.address}</p>` : ''}
        ${shop.phone ? `<p>Tél: ${shop.phone}</p>` : ''}
        ${shop.email ? `<p>${shop.email}</p>` : ''}
      </div>
      <div class="doc-meta">
        <div class="doc-type">Prescription Optique</div>
        <div class="dates">
          <p>Établie le: <strong>${formatDate(prescription.createdAt)}</strong></p>
          ${prescription.expiresAt ? `<p>Valide jusqu'au: <strong>${formatDate(prescription.expiresAt)}</strong></p>` : ''}
        </div>
        ${prescription.expiresAt ? `
          <span class="validity-badge ${new Date(prescription.expiresAt) > new Date() ? 'validity-valid' : 'validity-expired'}">
            ${new Date(prescription.expiresAt) > new Date() ? '✓ Valide' : '✗ Expirée'}
          </span>
        ` : ''}
      </div>
    </div>

    <div class="client-card">
      <div class="client-name">${client.firstName} ${client.lastName}</div>
      <div class="client-details">
        ${client.dateOfBirth ? `<div class="detail-item"><span class="label">Date de naissance:</span> ${formatDate(client.dateOfBirth)}</div>` : ''}
        ${client.phone ? `<div class="detail-item"><span class="label">Téléphone:</span> ${client.phone}</div>` : ''}
        ${client.email ? `<div class="detail-item"><span class="label">Email:</span> ${client.email}</div>` : ''}
        ${client.address ? `<div class="detail-item"><span class="label">Adresse:</span> ${client.address}</div>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Correction Optique</div>
      <div class="rx-container">
        <table class="rx-table">
          <thead>
            <tr>
              <th style="width: 120px;">Œil</th>
              <th>Sphère (SPH)</th>
              <th>Cylindre (CYL)</th>
              <th>Axe</th>
              <th>Addition (ADD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="eye-label">OD (Œil Droit)</td>
              <td class="${prescription.odSph > 0 ? 'value-positive' : prescription.odSph < 0 ? 'value-negative' : ''}">
                ${prescription.odSph !== null ? (prescription.odSph > 0 ? '+' : '') + prescription.odSph : '-'}
              </td>
              <td class="${prescription.odCyl > 0 ? 'value-positive' : prescription.odCyl < 0 ? 'value-negative' : ''}">
                ${prescription.odCyl !== null ? (prescription.odCyl > 0 ? '+' : '') + prescription.odCyl : '-'}
              </td>
              <td>${prescription.odAxis !== null ? prescription.odAxis + '°' : '-'}</td>
              <td>${prescription.odAdd !== null ? '+' + prescription.odAdd : '-'}</td>
            </tr>
            <tr>
              <td class="eye-label">OS (Œil Gauche)</td>
              <td class="${prescription.osSph > 0 ? 'value-positive' : prescription.osSph < 0 ? 'value-negative' : ''}">
                ${prescription.osSph !== null ? (prescription.osSph > 0 ? '+' : '') + prescription.osSph : '-'}
              </td>
              <td class="${prescription.osCyl > 0 ? 'value-positive' : prescription.osCyl < 0 ? 'value-negative' : ''}">
                ${prescription.osCyl !== null ? (prescription.osCyl > 0 ? '+' : '') + prescription.osCyl : '-'}
              </td>
              <td>${prescription.osAxis !== null ? prescription.osAxis + '°' : '-'}</td>
              <td>${prescription.osAdd !== null ? '+' + prescription.osAdd : '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    ${prescription.pdFar || prescription.pdNear ? `
    <div class="pd-section">
      <h4>Écart Pupillaire (PD)</h4>
      <div class="pd-values">
        ${prescription.pdFar ? `
        <div class="pd-item">
          <span class="pd-label">Vision de loin:</span>
          <span class="pd-value">${prescription.pdFar} mm</span>
        </div>
        ` : ''}
        ${prescription.pdNear ? `
        <div class="pd-item">
          <span class="pd-label">Vision de près:</span>
          <span class="pd-value">${prescription.pdNear} mm</span>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${prescription.doctorName ? `
    <div class="doctor-section">
      <div class="label">Prescripteur</div>
      <div class="name">${prescription.doctorName}</div>
    </div>
    ` : ''}

    ${prescription.notes ? `
    <div class="notes-section">
      <h4>Notes / Observations</h4>
      <p>${prescription.notes}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p>Document généré le ${formatDateTime(new Date())}</p>
      <p>${shop.name}${shop.address ? ` • ${shop.address}` : ''}${shop.phone ? ` • ${shop.phone}` : ''}</p>
    </div>
  </div>
</body>
</html>`;
  },

  generatePickupSlipHtml(order: any) {
    const shop = order.shop;
    const client = order.client;
    const balance = Number(order.totalPrice) - Number(order.deposit || 0);

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bon de Retrait - ${order.orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      font-size: 11px; 
      color: #1f2937; 
      background: white;
    }
    .slip { 
      max-width: 80mm; 
      margin: 0 auto; 
      padding: 8mm;
      border: 1px dashed #d1d5db;
    }
    @media print { 
      body { padding: 0; }
      .slip { border: none; padding: 5mm; max-width: none; }
    }
    .header { 
      text-align: center; 
      margin-bottom: 15px; 
      padding-bottom: 12px; 
      border-bottom: 2px solid #1f2937; 
    }
    .header .shop-name { 
      font-size: 16px; 
      font-weight: 700; 
      margin-bottom: 4px;
      color: #1f2937;
    }
    .header .shop-contact { 
      font-size: 9px; 
      color: #6b7280;
      margin-bottom: 8px;
    }
    .header .doc-title { 
      font-size: 14px; 
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 8px;
    }
    .ready-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      background: #dcfce7;
      color: #166534;
      font-size: 10px;
      font-weight: 700;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .section { 
      margin-bottom: 12px; 
      padding-bottom: 12px; 
      border-bottom: 1px dashed #e5e7eb; 
    }
    .section:last-of-type { border-bottom: none; }
    .section-label { 
      font-size: 8px; 
      font-weight: 600; 
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .order-number { 
      font-size: 18px; 
      font-weight: 700;
      color: #1f2937;
      font-family: 'Courier New', monospace;
      letter-spacing: 1px;
    }
    .order-date { font-size: 9px; color: #6b7280; margin-top: 2px; }
    .client-name { 
      font-size: 14px; 
      font-weight: 700;
      color: #1f2937;
    }
    .client-phone { font-size: 10px; color: #4b5563; margin-top: 2px; }
    .items-list { margin-top: 6px; }
    .item { 
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 10px;
    }
    .item-name { color: #374151; }
    .item-detail { color: #6b7280; font-size: 9px; }
    .payment-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 4px 0;
      font-size: 10px;
    }
    .payment-row.subtotal { 
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
      margin-top: 4px;
    }
    .payment-row.total { 
      border-top: 2px solid #1f2937;
      padding-top: 8px;
      margin-top: 8px;
      font-size: 14px;
      font-weight: 700;
    }
    .payment-row.balance {
      background: #fef3c7;
      margin: 8px -8px 0;
      padding: 10px 8px;
      font-size: 13px;
      font-weight: 700;
    }
    .deposit { color: #16a34a; }
    .signature-section { 
      margin-top: 20px; 
      padding-top: 15px; 
      border-top: 1px solid #e5e7eb;
    }
    .signature-label { 
      font-size: 9px; 
      color: #6b7280;
      margin-bottom: 6px;
    }
    .signature-box { 
      border: 1px solid #d1d5db;
      border-radius: 4px;
      height: 50px;
      margin-bottom: 10px;
      background: #fafafa;
    }
    .date-line {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 9px;
      color: #6b7280;
    }
    .date-input {
      flex: 1;
      border-bottom: 1px solid #d1d5db;
      height: 16px;
    }
    .footer { 
      margin-top: 20px; 
      text-align: center; 
      padding-top: 12px;
      border-top: 2px dashed #e5e7eb;
    }
    .footer .thanks { 
      font-size: 11px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }
    .footer .shop-info { 
      font-size: 8px; 
      color: #9ca3af;
    }
    .checklist {
      margin-top: 12px;
      padding: 10px;
      background: #f8fafc;
      border-radius: 4px;
    }
    .checklist-title {
      font-size: 8px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9px;
      color: #475569;
      margin-bottom: 4px;
    }
    .checkbox {
      width: 12px;
      height: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 2px;
    }
  </style>
</head>
<body>
  <div class="slip">
    <div class="header">
      <div class="shop-name">${shop.name}</div>
      ${shop.phone || shop.address ? `
      <div class="shop-contact">
        ${shop.phone ? shop.phone : ''}${shop.phone && shop.address ? ' • ' : ''}${shop.address ? shop.address : ''}
      </div>
      ` : ''}
      <div class="doc-title">Bon de Retrait</div>
      ${order.status === 'READY' || order.status === 'READY_FOR_PICKUP' ? `
      <span class="ready-badge">✓ Prêt à retirer</span>
      ` : ''}
    </div>

    <div class="section">
      <div class="section-label">Commande</div>
      <div class="order-number">${order.orderNumber}</div>
      <div class="order-date">Créée le ${formatDate(order.createdAt)}${order.readyAt ? ` • Prête le ${formatDate(order.readyAt)}` : ''}</div>
    </div>

    <div class="section">
      <div class="section-label">Client</div>
      <div class="client-name">${client.firstName} ${client.lastName}</div>
      ${client.phone ? `<div class="client-phone">Tél: ${client.phone}</div>` : ''}
    </div>

    <div class="section">
      <div class="section-label">Articles</div>
      <div class="items-list">
        ${order.frame ? `
        <div class="item">
          <span class="item-name">Monture</span>
          <span class="item-detail">${order.frame.reference}${order.frame.color ? ` - ${order.frame.color}` : ''}</span>
        </div>
        ` : ''}
        ${order.lens ? `
        <div class="item">
          <span class="item-name">Verres</span>
          <span class="item-detail">${order.lens.name}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-label">Paiement</div>
      <div class="payment-row subtotal">
        <span>Total TTC</span>
        <span>${formatCurrency(order.totalPrice)}</span>
      </div>
      ${Number(order.deposit) > 0 ? `
      <div class="payment-row deposit">
        <span>Acompte versé</span>
        <span>- ${formatCurrency(order.deposit)}</span>
      </div>
      ` : ''}
      <div class="payment-row ${balance > 0 ? 'balance' : 'total'}">
        <span>${balance > 0 ? 'RESTE À PAYER' : 'SOLDÉ'}</span>
        <span>${balance > 0 ? formatCurrency(balance) : '✓'}</span>
      </div>
    </div>

    <div class="checklist">
      <div class="checklist-title">Vérification avant remise</div>
      <div class="checklist-item"><span class="checkbox"></span> Lunettes vérifiées</div>
      <div class="checklist-item"><span class="checkbox"></span> Ajustement effectué</div>
      <div class="checklist-item"><span class="checkbox"></span> Client informé de l'entretien</div>
    </div>

    <div class="signature-section">
      <div class="signature-label">Signature du client (confirmation de retrait)</div>
      <div class="signature-box"></div>
      <div class="date-line">
        <span>Date de retrait:</span>
        <span class="date-input"></span>
      </div>
    </div>

    <div class="footer">
      <div class="thanks">Merci de votre confiance !</div>
      <div class="shop-info">${shop.name}${shop.phone ? ` • ${shop.phone}` : ''}</div>
    </div>
  </div>
</body>
</html>`;
  },

  async getClientData(clientId: string, shopId: string) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, shopId },
      include: {
        shop: true,
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            frame: { select: { reference: true, model: true } },
            lens: { select: { name: true } },
          },
        },
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) throw new AppError(404, 'Client not found');
    return client;
  },

  generateClientSummaryHtml(client: any) {
    const shop = client.shop;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fiche Client - ${client.firstName} ${client.lastName}</title>
  <style>
    ${baseStyles}
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 25px; 
      padding-bottom: 20px; 
      border-bottom: 3px solid #2563eb; 
    }
    .shop-info { max-width: 50%; }
    .shop-info h1 { 
      font-size: 20px; 
      color: #2563eb; 
      margin-bottom: 6px; 
      font-weight: 700;
    }
    .shop-info p { color: #4b5563; font-size: 9px; }
    .doc-meta { text-align: right; }
    .doc-meta .doc-type { 
      font-size: 14px; 
      font-weight: 700; 
      color: #1f2937;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .doc-meta .date { font-size: 9px; color: #6b7280; margin-top: 4px; }
    .client-card { 
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 20px; 
      border-radius: 10px; 
      margin-bottom: 25px;
    }
    .client-card .client-name { 
      font-size: 22px; 
      font-weight: 700;
      margin-bottom: 12px;
    }
    .client-card .client-details { 
      display: grid; 
      grid-template-columns: repeat(2, 1fr); 
      gap: 10px;
      font-size: 10px;
      opacity: 0.9;
    }
    .client-card .detail-item .label { opacity: 0.7; }
    .section { margin-bottom: 20px; }
    .section-title { 
      font-size: 11px; 
      font-weight: 700; 
      color: #2563eb; 
      margin-bottom: 10px; 
      padding-bottom: 6px; 
      border-bottom: 2px solid #e5e7eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title .count {
      background: #dbeafe;
      color: #2563eb;
      font-size: 9px;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .history-table { 
      width: 100%; 
      border-collapse: collapse;
      font-size: 9px;
    }
    .history-table th { 
      background: #f8fafc; 
      padding: 8px;
      text-align: left;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      font-size: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .history-table td { 
      padding: 8px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .history-table tr:last-child td { border-bottom: none; }
    .rx-mini-table { 
      width: 100%; 
      border-collapse: collapse;
      font-size: 8px;
      margin-top: 8px;
    }
    .rx-mini-table th { 
      background: #2563eb; 
      color: white;
      padding: 6px;
      font-size: 7px;
      text-transform: uppercase;
    }
    .rx-mini-table td { 
      padding: 6px;
      text-align: center;
      border: 1px solid #e2e8f0;
      font-size: 9px;
    }
    .rx-mini-table .eye-label { 
      background: #f8fafc;
      font-weight: 600;
      text-align: left;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 8px;
      font-weight: 600;
    }
    .status-ready { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-delivered { background: #dbeafe; color: #1e40af; }
    .empty-state {
      text-align: center;
      padding: 20px;
      color: #94a3b8;
      font-size: 10px;
    }
    .footer { 
      margin-top: 30px; 
      padding-top: 15px; 
      border-top: 1px solid #e2e8f0; 
      text-align: center; 
      color: #94a3b8; 
      font-size: 9px; 
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="shop-info">
        <h1>${shop.name}</h1>
        ${shop.address ? `<p>${shop.address}</p>` : ''}
        ${shop.phone ? `<p>Tél: ${shop.phone}</p>` : ''}
      </div>
      <div class="doc-meta">
        <div class="doc-type">Fiche Client</div>
        <div class="date">Générée le ${formatDate(new Date())}</div>
      </div>
    </div>

    <div class="client-card">
      <div class="client-name">${client.firstName} ${client.lastName}</div>
      <div class="client-details">
        ${client.dateOfBirth ? `<div class="detail-item"><span class="label">Date de naissance:</span> ${formatDate(client.dateOfBirth)}</div>` : ''}
        ${client.phone ? `<div class="detail-item"><span class="label">Téléphone:</span> ${client.phone}</div>` : ''}
        ${client.email ? `<div class="detail-item"><span class="label">Email:</span> ${client.email}</div>` : ''}
        ${client.address ? `<div class="detail-item"><span class="label">Adresse:</span> ${client.address}</div>` : ''}
        <div class="detail-item"><span class="label">Client depuis:</span> ${formatDate(client.createdAt)}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">
        Historique des Prescriptions
        <span class="count">${client.prescriptions?.length || 0}</span>
      </div>
      ${client.prescriptions && client.prescriptions.length > 0 ? `
      ${client.prescriptions.map((rx: any) => `
      <div style="margin-bottom: 15px; padding: 10px; background: #f8fafc; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 10px; font-weight: 600;">${formatDate(rx.createdAt)}</span>
          ${rx.doctorName ? `<span style="font-size: 9px; color: #64748b;">Dr. ${rx.doctorName}</span>` : ''}
        </div>
        <table class="rx-mini-table">
          <thead>
            <tr><th>Œil</th><th>SPH</th><th>CYL</th><th>AXE</th><th>ADD</th></tr>
          </thead>
          <tbody>
            <tr>
              <td class="eye-label">OD</td>
              <td>${rx.odSph !== null ? (rx.odSph > 0 ? '+' : '') + rx.odSph : '-'}</td>
              <td>${rx.odCyl !== null ? (rx.odCyl > 0 ? '+' : '') + rx.odCyl : '-'}</td>
              <td>${rx.odAxis !== null ? rx.odAxis + '°' : '-'}</td>
              <td>${rx.odAdd !== null ? '+' + rx.odAdd : '-'}</td>
            </tr>
            <tr>
              <td class="eye-label">OS</td>
              <td>${rx.osSph !== null ? (rx.osSph > 0 ? '+' : '') + rx.osSph : '-'}</td>
              <td>${rx.osCyl !== null ? (rx.osCyl > 0 ? '+' : '') + rx.osCyl : '-'}</td>
              <td>${rx.osAxis !== null ? rx.osAxis + '°' : '-'}</td>
              <td>${rx.osAdd !== null ? '+' + rx.osAdd : '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      `).join('')}
      ` : '<div class="empty-state">Aucune prescription enregistrée</div>'}
    </div>

    <div class="section">
      <div class="section-title">
        Historique des Commandes
        <span class="count">${client.orders?.length || 0}</span>
      </div>
      ${client.orders && client.orders.length > 0 ? `
      <table class="history-table">
        <thead>
          <tr>
            <th>N° Commande</th>
            <th>Date</th>
            <th>Articles</th>
            <th>Total</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${client.orders.map((order: any) => `
          <tr>
            <td style="font-weight: 600;">${order.orderNumber}</td>
            <td>${formatDate(order.createdAt)}</td>
            <td>
              ${order.frame ? order.frame.reference : ''}
              ${order.frame && order.lens ? ' + ' : ''}
              ${order.lens ? order.lens.name : ''}
            </td>
            <td>${formatCurrency(order.totalPrice)}</td>
            <td>
              <span class="status-badge ${
                order.status === 'DELIVERED' || order.status === 'PICKED_UP' ? 'status-delivered' :
                (order.status === 'READY' || order.status === 'READY_FOR_PICKUP') ? 'status-ready' : 'status-pending'
              }">
                ${getStatusLabel(order.status)}
              </span>
            </td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<div class="empty-state">Aucune commande enregistrée</div>'}
    </div>

    <div class="section">
      <div class="section-title">
        Historique des Rendez-vous
        <span class="count">${client.appointments?.length || 0}</span>
      </div>
      ${client.appointments && client.appointments.length > 0 ? `
      <table class="history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Heure</th>
            <th>Type</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${client.appointments.map((apt: any) => `
          <tr>
            <td>${formatDate(apt.scheduledAt)}</td>
            <td>${new Date(apt.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
            <td>${apt.type?.replace('_', ' ') || '-'}</td>
            <td>
              <span class="status-badge ${
                apt.status === 'COMPLETED' ? 'status-delivered' :
                apt.status === 'CONFIRMED' ? 'status-ready' : 'status-pending'
              }">
                ${apt.status?.replace('_', ' ') || '-'}
              </span>
            </td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<div class="empty-state">Aucun rendez-vous enregistré</div>'}
    </div>

    <div class="footer">
      <p>Document généré le ${formatDateTime(new Date())}</p>
      <p>${shop.name}${shop.address ? ` • ${shop.address}` : ''}${shop.phone ? ` • ${shop.phone}` : ''}</p>
    </div>
  </div>
</body>
</html>`;
  },
};
