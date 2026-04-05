import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create shop
  const shop = await prisma.shop.create({
    data: {
      name: 'VisionDesk Optical',
      address: '123 Main Street, City Center',
      phone: '+1 555-123-4567',
      email: 'contact@visiondesk-optical.com',
    },
  });
  console.log('✅ Shop created');

  // Create superadmin user (platform-level)
  const superadminPassword = await bcrypt.hash('superadmin123', 10);
  await prisma.user.create({
    data: {
      shopId: shop.id,
      email: 'superadmin@visiondesk.com',
      passwordHash: superadminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPERADMIN',
    },
  });
  console.log('✅ Superadmin user created (superadmin@visiondesk.com / superadmin123)');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      shopId: shop.id,
      email: 'admin@visiondesk.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created (admin@visiondesk.com / admin123)');

  // Create technician
  const techPassword = await bcrypt.hash('tech123', 10);
  const technician = await prisma.user.create({
    data: {
      shopId: shop.id,
      email: 'tech@visiondesk.com',
      passwordHash: techPassword,
      firstName: 'John',
      lastName: 'Technician',
      role: 'TECHNICIAN',
    },
  });
  console.log('✅ Technician user created');

  // Create optician
  const opticianPassword = await bcrypt.hash('optician123', 10);
  await prisma.user.create({
    data: {
      shopId: shop.id,
      email: 'optician@visiondesk.com',
      passwordHash: opticianPassword,
      firstName: 'Sarah',
      lastName: 'Optician',
      role: 'OPTICIAN',
    },
  });
  console.log('✅ Optician user created');

  // Create panorama scene
  const scene = await prisma.panoramaScene.create({
    data: {
      shopId: shop.id,
      name: 'Main Shop View',
      imageUrl: '/panorama/shop-panorama.jpg',
      isActive: true,
    },
  });
  console.log('✅ Panorama scene created');

  // Create hotspots
  const hotspots = [
    { moduleKey: 'desk', label: 'Desk', x: 0.15, y: 0.5, w: 0.12, h: 0.15, icon: 'LayoutDashboard', sortOrder: 1 },
    { moduleKey: 'clients', label: 'Clients', x: 0.32, y: 0.45, w: 0.12, h: 0.15, icon: 'Users', sortOrder: 2 },
    { moduleKey: 'atelier', label: 'Atelier', x: 0.5, y: 0.4, w: 0.12, h: 0.15, icon: 'Wrench', sortOrder: 3 },
    { moduleKey: 'frames', label: 'Stock Frames', x: 0.68, y: 0.45, w: 0.12, h: 0.15, icon: 'Glasses', sortOrder: 4 },
    { moduleKey: 'lenses', label: 'Stock Lenses', x: 0.85, y: 0.5, w: 0.12, h: 0.15, icon: 'Circle', sortOrder: 5 },
  ];

  for (const hotspot of hotspots) {
    await prisma.panoramaHotspot.create({
      data: {
        shopId: shop.id,
        sceneId: scene.id,
        ...hotspot,
      },
    });
  }
  console.log('✅ Panorama hotspots created');

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: { shopId: shop.id, name: 'Luxottica', email: 'orders@luxottica.com', phone: '+1 555-111-1111' },
    }),
    prisma.supplier.create({
      data: { shopId: shop.id, name: 'Essilor', email: 'orders@essilor.com', phone: '+1 555-222-2222' },
    }),
    prisma.supplier.create({
      data: { shopId: shop.id, name: 'Zeiss', email: 'orders@zeiss.com', phone: '+1 555-333-3333' },
    }),
  ]);
  console.log('✅ Suppliers created');

  // Create frame brands
  const brands = await Promise.all([
    prisma.frameBrand.create({ data: { shopId: shop.id, name: 'Ray-Ban' } }),
    prisma.frameBrand.create({ data: { shopId: shop.id, name: 'Oakley' } }),
    prisma.frameBrand.create({ data: { shopId: shop.id, name: 'Gucci' } }),
    prisma.frameBrand.create({ data: { shopId: shop.id, name: 'Prada' } }),
  ]);
  console.log('✅ Frame brands created');

  // Create frames
  const frames = await Promise.all([
    prisma.frame.create({
      data: {
        shopId: shop.id,
        brandId: brands[0].id,
        supplierId: suppliers[0].id,
        reference: 'RB3025',
        model: 'Aviator Classic',
        color: 'Gold',
        size: '58-14-135',
        material: 'Metal',
        quantity: 15,
        reorderLevel: 5,
        purchasePrice: 85,
        salePrice: 180,
      },
    }),
    prisma.frame.create({
      data: {
        shopId: shop.id,
        brandId: brands[0].id,
        supplierId: suppliers[0].id,
        reference: 'RB2140',
        model: 'Wayfarer',
        color: 'Black',
        size: '50-22-150',
        material: 'Acetate',
        quantity: 8,
        reorderLevel: 5,
        purchasePrice: 75,
        salePrice: 160,
      },
    }),
    prisma.frame.create({
      data: {
        shopId: shop.id,
        brandId: brands[1].id,
        supplierId: suppliers[0].id,
        reference: 'OO9208',
        model: 'Radar EV Path',
        color: 'Matte Black',
        size: '38-138',
        material: 'O-Matter',
        quantity: 3,
        reorderLevel: 5,
        purchasePrice: 120,
        salePrice: 220,
      },
    }),
    prisma.frame.create({
      data: {
        shopId: shop.id,
        brandId: brands[2].id,
        supplierId: suppliers[0].id,
        reference: 'GG0061S',
        model: 'Square Frame',
        color: 'Havana',
        size: '56-17-140',
        material: 'Acetate',
        quantity: 6,
        reorderLevel: 3,
        purchasePrice: 180,
        salePrice: 380,
      },
    }),
  ]);
  console.log('✅ Frames created');

  // Create lenses
  const lenses = await Promise.all([
    prisma.lens.create({
      data: {
        shopId: shop.id,
        supplierId: suppliers[1].id,
        name: 'Essilor Crizal Sapphire 1.67',
        lensType: 'SINGLE_VISION',
        index: '1.67',
        coating: 'ANTI_REFLECTIVE',
        quantity: 20,
        reorderLevel: 10,
        purchasePrice: 45,
        salePrice: 120,
        barcode: 'LENS-ESS-167-AR',
        minSphere: -8,
        maxSphere: 8,
        minCylinder: -4,
        maxCylinder: 0,
      },
    }),
    prisma.lens.create({
      data: {
        shopId: shop.id,
        supplierId: suppliers[1].id,
        name: 'Essilor Varilux Comfort',
        lensType: 'PROGRESSIVE',
        index: '1.60',
        coating: 'ANTI_REFLECTIVE',
        quantity: 12,
        reorderLevel: 5,
        purchasePrice: 120,
        salePrice: 280,
        barcode: 'LENS-ESS-VAR-160',
        minSphere: -6,
        maxSphere: 6,
        minCylinder: -4,
        maxCylinder: 0,
        maxAdd: 3.5,
      },
    }),
    prisma.lens.create({
      data: {
        shopId: shop.id,
        supplierId: suppliers[2].id,
        name: 'Zeiss DriveSafe',
        lensType: 'PROGRESSIVE',
        index: '1.60',
        coating: 'ANTI_REFLECTIVE',
        quantity: 8,
        reorderLevel: 5,
        purchasePrice: 150,
        salePrice: 350,
        barcode: 'LENS-ZEI-DRV-160',
        minSphere: -8,
        maxSphere: 8,
        minCylinder: -4,
        maxCylinder: 0,
        maxAdd: 3.5,
      },
    }),
    prisma.lens.create({
      data: {
        shopId: shop.id,
        supplierId: suppliers[1].id,
        name: 'Transitions Gen 8',
        lensType: 'SINGLE_VISION',
        index: '1.60',
        coating: 'PHOTOCHROMIC',
        quantity: 4,
        reorderLevel: 5,
        purchasePrice: 80,
        salePrice: 180,
        barcode: 'LENS-TRN-GEN8',
        minSphere: -6,
        maxSphere: 6,
        minCylinder: -2,
        maxCylinder: 0,
      },
    }),
  ]);
  console.log('✅ Lenses created');

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        shopId: shop.id,
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie.dupont@email.com',
        phone: '+1 555-100-0001',
        address: '456 Oak Avenue',
        dateOfBirth: new Date('1985-03-15'),
      },
    }),
    prisma.client.create({
      data: {
        shopId: shop.id,
        firstName: 'Jean',
        lastName: 'Martin',
        email: 'jean.martin@email.com',
        phone: '+1 555-100-0002',
        address: '789 Pine Street',
        dateOfBirth: new Date('1972-08-22'),
      },
    }),
    prisma.client.create({
      data: {
        shopId: shop.id,
        firstName: 'Sophie',
        lastName: 'Bernard',
        email: 'sophie.bernard@email.com',
        phone: '+1 555-100-0003',
        address: '321 Elm Road',
        dateOfBirth: new Date('1990-11-08'),
      },
    }),
  ]);
  console.log('✅ Clients created');

  // Create prescriptions
  const prescriptions = await Promise.all([
    prisma.prescription.create({
      data: {
        clientId: clients[0].id,
        odSph: -2.25,
        odCyl: -0.75,
        odAxis: 180,
        osSph: -2.00,
        osCyl: -0.50,
        osAxis: 175,
        pdFar: 63,
        doctorName: 'Dr. Smith',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.prescription.create({
      data: {
        clientId: clients[1].id,
        odSph: 1.50,
        odCyl: -0.25,
        odAxis: 90,
        odAdd: 2.00,
        osSph: 1.75,
        osCyl: -0.50,
        osAxis: 85,
        osAdd: 2.00,
        pdFar: 65,
        pdNear: 62,
        doctorName: 'Dr. Johnson',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log('✅ Prescriptions created');

  // Create orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        shopId: shop.id,
        clientId: clients[0].id,
        prescriptionId: prescriptions[0].id,
        frameId: frames[0].id,
        lensId: lenses[0].id,
        createdById: admin.id,
        orderNumber: 'ORD-240301-0001',
        status: 'IN_ATELIER',
        framePrice: 180,
        lensPrice: 240,
        servicePrice: 30,
        totalPrice: 450,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.order.create({
      data: {
        shopId: shop.id,
        clientId: clients[1].id,
        prescriptionId: prescriptions[1].id,
        frameId: frames[3].id,
        lensId: lenses[1].id,
        createdById: admin.id,
        orderNumber: 'ORD-240301-0002',
        status: 'READY',
        framePrice: 380,
        lensPrice: 560,
        servicePrice: 30,
        discount: 50,
        deposit: 200,
        totalPrice: 920,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.order.create({
      data: {
        shopId: shop.id,
        clientId: clients[2].id,
        frameId: frames[1].id,
        createdById: admin.id,
        orderNumber: 'ORD-240301-0003',
        status: 'DRAFT',
        framePrice: 160,
        lensPrice: 0,
        servicePrice: 0,
        totalPrice: 160,
      },
    }),
  ]);
  console.log('✅ Orders created');

  // Create atelier jobs
  await prisma.atelierJob.create({
    data: {
      shopId: shop.id,
      orderId: orders[0].id,
      technicianId: technician.id,
      status: 'IN_PROGRESS',
      priority: 5,
      notes: 'Standard single vision lenses',
      startedAt: new Date(),
    },
  });

  await prisma.atelierJob.create({
    data: {
      shopId: shop.id,
      orderId: orders[1].id,
      technicianId: technician.id,
      status: 'READY',
      priority: 3,
      notes: 'Progressive lenses - customer pickup scheduled',
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(),
    },
  });
  console.log('✅ Atelier jobs created');

  // Create appointments
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  await Promise.all([
    prisma.appointment.create({
      data: {
        shopId: shop.id,
        clientId: clients[0].id,
        createdById: admin.id,
        appointmentType: 'EYE_EXAM',
        status: 'CONFIRMED',
        scheduledAt: new Date(tomorrow.setHours(10, 0, 0, 0)),
        durationMinutes: 45,
        notes: 'Annual eye exam - bring previous prescription',
      },
    }),
    prisma.appointment.create({
      data: {
        shopId: shop.id,
        clientId: clients[1].id,
        createdById: admin.id,
        appointmentType: 'PICKUP',
        status: 'SCHEDULED',
        scheduledAt: new Date(tomorrow.setHours(14, 30, 0, 0)),
        durationMinutes: 15,
        notes: 'Order pickup - progressive lenses ready',
      },
    }),
    prisma.appointment.create({
      data: {
        shopId: shop.id,
        clientId: clients[2].id,
        createdById: admin.id,
        appointmentType: 'CONTACT_LENS',
        status: 'SCHEDULED',
        scheduledAt: new Date(nextWeek.setHours(11, 0, 0, 0)),
        durationMinutes: 30,
        notes: 'Contact lens fitting - first time wearer',
      },
    }),
    prisma.appointment.create({
      data: {
        shopId: shop.id,
        clientId: clients[0].id,
        createdById: admin.id,
        appointmentType: 'REPAIR',
        status: 'COMPLETED',
        scheduledAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        durationMinutes: 20,
        notes: 'Frame adjustment completed',
      },
    }),
  ]);
  console.log('✅ Appointments created');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
