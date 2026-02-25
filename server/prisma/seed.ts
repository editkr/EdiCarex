import { PrismaClient } from '@prisma/client';
// @ts-ignore
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    const ROLE_DEFAULTS: Record<string, string[]> = {
        'Admin': ['ALL'],
        'Doctor': ['DASHBOARD', 'PATIENTS_VIEW', 'PATIENTS_EDIT', 'MEDICAL_RECORDS_VIEW', 'MEDICAL_RECORDS_CREATE', 'MEDICAL_RECORDS_EDIT', 'PRESCRIPTIONS_CREATE', 'PRESCRIPTIONS_VIEW', 'APPOINTMENTS_VIEW', 'APPOINTMENTS_EDIT', 'EMERGENCY_VIEW', 'EMERGENCY_EDIT', 'EMERGENCY_DISCHARGE', 'BEDS_VIEW', 'BEDS_ASSIGN', 'LAB_VIEW', 'LAB_CREATE', 'LAB_RESULTS', 'PHARMACY_VIEW', 'REPORTS_VIEW', 'AI_USE', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Nurse': ['DASHBOARD', 'PATIENTS_VIEW', 'PATIENTS_EDIT', 'MEDICAL_RECORDS_VIEW', 'MEDICAL_RECORDS_EDIT', 'PRESCRIPTIONS_VIEW', 'APPOINTMENTS_VIEW', 'EMERGENCY_VIEW', 'EMERGENCY_EDIT', 'EMERGENCY_DISCHARGE', 'BEDS_VIEW', 'BEDS_EDIT', 'BEDS_ASSIGN', 'PHARMACY_VIEW', 'PHARMACY_DISPENSE', 'LAB_VIEW', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Receptionist': ['DASHBOARD', 'PATIENTS_VIEW', 'PATIENTS_CREATE', 'PATIENTS_EDIT', 'APPOINTMENTS_VIEW', 'APPOINTMENTS_CREATE', 'APPOINTMENTS_EDIT', 'WAITING_VIEW', 'WAITING_MANAGE', 'BILLING_VIEW', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Lab': ['DASHBOARD', 'PATIENTS_VIEW', 'LAB_VIEW', 'LAB_CREATE', 'LAB_EDIT', 'LAB_RESULTS', 'REPORTS_VIEW', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Pharmacy': ['DASHBOARD', 'PATIENTS_VIEW', 'PHARMACY_VIEW', 'PHARMACY_EDIT', 'PHARMACY_DISPENSE', 'PRESCRIPTIONS_VIEW', 'BILLING_VIEW', 'REPORTS_VIEW', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'HR': ['DASHBOARD', 'HR_VIEW', 'HR_CREATE', 'HR_EDIT', 'HR_DELETE', 'ATTENDANCE_VIEW', 'ATTENDANCE_EDIT', 'REPORTS_VIEW', 'ANALYTICS_VIEW', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Billing': ['DASHBOARD', 'PATIENTS_VIEW', 'BILLING_VIEW', 'BILLING_CREATE', 'BILLING_EDIT', 'REPORTS_VIEW', 'ANALYTICS_VIEW', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Management': ['DASHBOARD', 'PATIENTS_VIEW', 'DOCTORS_VIEW', 'APPOINTMENTS_VIEW', 'EMERGENCY_VIEW', 'BEDS_VIEW', 'PHARMACY_VIEW', 'LAB_VIEW', 'BILLING_VIEW', 'REPORTS_VIEW', 'REPORTS_EXPORT', 'ANALYTICS_VIEW', 'ANALYTICS_ADVANCED', 'AI_USE', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Audit': ['DASHBOARD', 'ADMIN_VIEW', 'AUDIT_VIEW', 'BACKUPS_VIEW', 'BACKUPS_CREATE', 'SETTINGS_VIEW', 'SETTINGS_EDIT', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
    };

    // Create Roles
    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            description: 'System administrator with full access',
            isSystem: true,
        },
    });

    const doctorRole = await prisma.role.upsert({
        where: { name: 'Doctor' },
        update: {},
        create: {
            name: 'Doctor',
            description: 'Medical doctor',
            isSystem: true,
        },
    });

    const nurseRole = await prisma.role.upsert({
        where: { name: 'Nurse' },
        update: {},
        create: {
            name: 'Nurse',
            description: 'Nursing staff',
            isSystem: true,
        },
    });



    const patientRole = await prisma.role.upsert({
        where: { name: 'Patient' },
        update: {},
        create: {
            name: 'Patient',
            description: 'Patient with portal access',
            isSystem: true,
        },
    });

    // NEW ROLES
    const receptionistRole = await prisma.role.upsert({
        where: { name: 'Receptionist' },
        update: {},
        create: {
            name: 'Receptionist',
            description: 'Front desk and admission',
            isSystem: true,
        },
    });

    const labRole = await prisma.role.upsert({
        where: { name: 'Lab' },
        update: {},
        create: {
            name: 'Lab',
            description: 'Laboratory staff',
            isSystem: true,
        },
    });

    const pharmacyRole = await prisma.role.upsert({
        where: { name: 'Pharmacy' },
        update: {},
        create: {
            name: 'Pharmacy',
            description: 'Pharmacy staff',
            isSystem: true,
        },
    });

    const billingRole = await prisma.role.upsert({
        where: { name: 'Billing' },
        update: {},
        create: {
            name: 'Billing',
            description: 'Billing and finance',
            isSystem: true,
        },
    });

    const hrRole = await prisma.role.upsert({
        where: { name: 'HR' },
        update: {},
        create: {
            name: 'HR',
            description: 'Human Resources',
            isSystem: true,
        },
    });

    const managementRole = await prisma.role.upsert({
        where: { name: 'Management' },
        update: {},
        create: {
            name: 'Management',
            description: 'Hospital management / Director',
            isSystem: true,
        },
    });

    const auditRole = await prisma.role.upsert({
        where: { name: 'Audit' },
        update: {},
        create: {
            name: 'Audit',
            description: 'Auditor / IT Support',
            isSystem: true,
        },
    });

    console.log('✅ Roles created');

    const roleMap: Record<string, string> = {
        'Admin': adminRole.id,
        'Doctor': doctorRole.id,
        'Nurse': nurseRole.id,
        'Receptionist': receptionistRole.id,
        'Lab': labRole.id,
        'Pharmacy': pharmacyRole.id,
        'Billing': billingRole.id,
        'HR': hrRole.id,
        'Management': managementRole.id,
        'Audit': auditRole.id,
    };

    // Create Admin User
    const hashedPassword = await bcrypt.hash('password123', 10);

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@medisync.com' },
        update: {},
        create: {
            email: 'admin@edicarex.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            phone: '+1234567890',
            roleId: adminRole.id,
            isActive: true,
            preferences: {
                permissions: ['ALL']
            }
        },
    });

    console.log('✅ Admin user created');

    // Create Specialties
    const specialties = [
        { name: 'Cardiología', description: 'Corazón y sistema cardiovascular' },
        { name: 'Neurología', description: 'Cerebro y sistema nervioso' },
        { name: 'Pediatría', description: 'Niños e infantes' },
        { name: 'Ortopedia', description: 'Huesos y articulaciones' },
        { name: 'Medicina General', description: 'Atención médica general' },
        { name: 'Cirugía', description: 'Procedimientos quirúrgicos' },
        { name: 'Dermatología', description: 'Piel y dermatología' },
        { name: 'Emergencias', description: 'Atención de urgencias' },
    ];

    for (const specialty of specialties) {
        await prisma.specialty.upsert({
            where: { name: specialty.name },
            update: {},
            create: specialty,
        });
    }

    console.log('✅ Specialties created');

    // Create Sample Patients
    const patients = [
        {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: new Date('1990-05-15'),
            gender: 'MALE',
            bloodType: 'A+',
            phone: '+1234567891',
            email: 'john.doe@example.com',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
        },
        {
            firstName: 'Jane',
            lastName: 'Smith',
            dateOfBirth: new Date('1985-08-22'),
            gender: 'FEMALE',
            bloodType: 'O+',
            phone: '+1234567892',
            email: 'jane.smith@example.com',
            address: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90001',
        },
    ];

    for (const patient of patients) {
        const createdPatient = await prisma.patient.create({ data: patient });

        // Create User for John Doe to test Patient Portal
        if (patient.email === 'john.doe@example.com') {
            const hashedPatientPw = await bcrypt.hash('password123', 10);
            await prisma.user.create({
                data: {
                    email: patient.email,
                    password: hashedPatientPw,
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    phone: patient.phone,
                    roleId: patientRole.id,
                    patient: {
                        connect: { id: createdPatient.id }
                    },
                    isActive: true,
                }
            });
            console.log('✅ Created Patient User: john.doe@example.com / password123');
        }
    }

    console.log('✅ Sample patients created');

    // ============================================
    // HR SEEDING
    // ============================================
    const employees = [
        {
            name: 'Dr. John Smith',
            area: 'Cardiología',
            role: 'Doctor',
            department: 'Medical',
            email: 'john.smith@edicarex.com',
            salary: 8500,
            contract: 'Tiempo Completo',
            status: 'ACTIVE',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
            hireDate: new Date('2020-01-15'),
            shifts: [
                { dayOfWeek: 'Lunes', shiftType: 'MORNING', startTime: '08:00', endTime: '16:00' },
                { dayOfWeek: 'Martes', shiftType: 'MORNING', startTime: '08:00', endTime: '16:00' },
            ]
        },
        {
            name: 'Dra. Sarah Johnson',
            area: 'Pediatría',
            role: 'Doctor',
            department: 'Medical',
            email: 'sarah.johnson@edicarex.com',
            salary: 7800,
            contract: 'Tiempo Completo',
            status: 'ACTIVE',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
            hireDate: new Date('2021-03-10'),
            shifts: [
                { dayOfWeek: 'Lunes', shiftType: 'AFTERNOON', startTime: '14:00', endTime: '22:00' },
                { dayOfWeek: 'Miércoles', shiftType: 'MORNING', startTime: '08:00', endTime: '16:00' },
            ]
        },
        {
            name: 'Enf. Mike Williams',
            area: 'Emergencia',
            role: 'Nurse',
            department: 'Emergency',
            email: 'mike.williams@edicarex.com',
            salary: 4500,
            contract: 'Tiempo Completo',
            status: 'ACTIVE',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
            hireDate: new Date('2022-06-01'),
            shifts: [
                { dayOfWeek: 'Lunes', shiftType: 'NIGHT', startTime: '22:00', endTime: '06:00' },
            ]
        },
        {
            name: 'Emma Brown',
            area: 'Administración',
            role: 'Admin',
            department: 'Administrative',
            email: 'emma.brown@edicarex.com',
            salary: 3200,
            contract: 'Medio Tiempo',
            status: 'ACTIVE',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
            hireDate: new Date('2023-01-20'),
            shifts: []
        }
    ];

    for (const emp of employees) {
        const { shifts, ...empData } = emp;
        const employee = await prisma.employee.upsert({
            where: { email: emp.email },
            update: {},
            create: empData
        });

        // ... rest of payroll/shift creation (will duplicate if employee already existed? yes, but maybe tolerable for seed or check)
        // Check if payroll exists for this period
        const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const existingPayroll = await prisma.payroll.findFirst({
            where: {
                employeeId: employee.id,
                periodStart: periodStart
            }
        });

        if (!existingPayroll) {
            // Create Payroll
            // Schema: baseSalary, bonuses, deductions, netSalary
            const pension = Number(emp.salary) * 0.13;
            const health = Number(emp.salary) * 0.10;
            const deductions = pension + health + Math.floor(Math.random() * 100);
            const bonuses = Math.floor(Math.random() * 500);

            await prisma.payroll.create({
                data: {
                    employeeId: employee.id,
                    periodStart: periodStart,
                    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
                    baseSalary: emp.salary,
                    bonuses: bonuses,
                    deductions: deductions,
                    netSalary: Number(emp.salary) + bonuses - deductions,
                    status: 'DRAFT'
                }
            });
        }

        // Shifts - for simplicity, delete existing scheduled shifts for this employee and recreate?
        // Or just skip.

        // Create User for Employee if not exists
        const existingUser = await prisma.user.findUnique({ where: { email: emp.email } });
        if (!existingUser) {
            const hashedEmpPw = await bcrypt.hash('password123', 10);
            const roleId = roleMap[emp.role] || adminRole.id; // Fallback to admin if role not found (unsafe but ok for seed)

            // Split name
            const names = emp.name.split(' ');
            const lastName = names.pop() || '';
            const firstName = names.join(' ').replace('Dr. ', '').replace('Dra. ', '').replace('Enf. ', '');

            await prisma.user.create({
                data: {
                    email: emp.email,
                    password: hashedEmpPw,
                    firstName: firstName,
                    lastName: lastName,
                    roleId: roleId,
                    isActive: true,
                    phone: '+1234556677',
                    preferences: {
                        permissions: ROLE_DEFAULTS[emp.role] || [],
                        department: emp.department,
                        hireDate: emp.hireDate,
                    }
                }
            });
            console.log(`✅ Created User for Employee: ${emp.email} / password123`);
        }
    }
    console.log('✅ HR Data (Employees, Payroll) checked/seeded');

    // ============================================
    // EMERGENCY SEEDING
    // ============================================
    const bedWards = [
        { ward: 'UCI', count: 5 },
        { ward: 'Emergencia', count: 10 },
        { ward: 'General', count: 10 }
    ];

    let bedCounter = 1;
    const allBedIds: string[] = [];

    for (const group of bedWards) {
        for (let i = 1; i <= group.count; i++) {
            const bedNum = `${group.ward === 'UCI' ? 'UCI' : group.ward === 'Emergencia' ? 'ER' : 'GEN'}-${i.toString().padStart(2, '0')}`;

            const bed = await prisma.bed.upsert({
                where: { number: bedNum },
                update: {},
                create: {
                    number: bedNum,
                    ward: group.ward,
                    type: group.ward === 'UCI' ? 'Cama Hospitalaria' : 'Camilla',
                    status: Math.random() > 0.7 ? 'OCCUPIED' : 'AVAILABLE',
                }
            });
            if (bed.status === 'OCCUPIED') {
                allBedIds.push(bed.id);
            }
        }
    }

    // Create Emergency Cases for Occupied Beds
    const erDiagnoses = ['Dolor Torácico', 'Cefalea Intensa', 'Esguince Tobillo', 'Dificultad Respiratoria', 'Fiebre Alta'];

    for (const bedId of allBedIds) {
        const diagnosis = erDiagnoses[Math.floor(Math.random() * erDiagnoses.length)];
        const triage = Math.floor(Math.random() * 3) + 1; // 1-3 priority

        const kase = await prisma.emergencyCase.create({
            data: {
                patientName: `Paciente ${Math.floor(Math.random() * 1000)}`,
                patientAge: Math.floor(Math.random() * 60) + 18,
                triageLevel: triage,
                chiefComplaint: diagnosis,
                diagnosis: diagnosis,
                vitalSigns: { hr: 80 + Math.random() * 20, bp: '120/80', temp: 37 + Math.random(), spo2: 95 + Math.random() * 4 },
                status: 'ADMITTED',
                bedNumber: 'Unknown', // Ideally link to bed
                doctorName: 'Dr. Smith',
                admissionDate: new Date()
            }
        });

        // Update bed with patient info (conceptual link)
        await prisma.bed.update({
            where: { id: bedId },
            data: { notes: `Occupied by Case ${kase.id}` }
        });
    }

    console.log('✅ Emergency Data (Beds, Cases) seeded');

    // ============================================
    // APPOINTMENTS & BILLING SEEDING
    // ============================================

    // Get IDs
    const allDoctors = await prisma.doctor.findMany();
    const allPatients = await prisma.patient.findMany();

    // Create Medications
    const medicationsData = [
        { name: 'Paracetamol 500mg', quantity: 1000, cost: 0.05, price: 0.5 },
        { name: 'Amoxicilina 500mg', quantity: 500, cost: 0.10, price: 1.2 },
        { name: 'Ibuprofeno 400mg', quantity: 800, cost: 0.08, price: 0.8 },
        { name: 'Omeprazol 20mg', quantity: 600, cost: 0.15, price: 1.5 },
        { name: 'Loratadina 10mg', quantity: 400, cost: 0.05, price: 1.0 },
    ];

    for (const med of medicationsData) {
        // Create generic medication record
        const pharmacyMed = await prisma.medication.create({
            data: {
                name: med.name,
                description: 'Generic description',
                // code column does not exist in schema
                manufacturer: 'Generic Pharma',
                dosageForm: 'TABLET',
                stock: {
                    create: {
                        quantity: med.quantity,
                        minStockLevel: 100,
                        maxStockLevel: 2000,
                        unitPrice: med.cost,
                        sellingPrice: med.price,
                        batchNumber: `BAT-${Math.floor(Math.random() * 1000)}`,
                        expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                        location: 'Shelf A'
                    }
                }
            }
        });
    }
    console.log('✅ Medications seeded');


    // Create Appointments & Invoices
    const appointmentStatuses = ['COMPLETED', 'PENDING', 'CANCELLED', 'SCHEDULED'];

    if (allDoctors.length > 0 && allPatients.length > 0) {
        // Generate 100 random appointments over the last 6 months
        for (let i = 0; i < 100; i++) {
            const randomDoctor = allDoctors[Math.floor(Math.random() * allDoctors.length)];
            const randomPatient = allPatients[Math.floor(Math.random() * allPatients.length)];

            // Random date in last 6 months or next 1 month
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 180) + 10);

            // Random time 8am - 5pm
            const hour = Math.floor(Math.random() * 9) + 8;
            date.setHours(hour, 0, 0, 0);

            const status = date < new Date() ? 'COMPLETED' : 'SCHEDULED';

            const app = await prisma.appointment.create({
                data: {
                    doctorId: randomDoctor.id,
                    patientId: randomPatient.id,
                    appointmentDate: date,
                    startTime: `${hour}:00`,
                    endTime: `${hour + 1}:00`,
                    status: status,
                    reason: 'Consulta General',
                    type: 'CONSULTATION',
                    priority: Math.random() > 0.8 ? 'HIGH' : 'NORMAL'
                }
            });

            // Create Invoice for Completed appointments
            if (status === 'COMPLETED') {
                const amount = 50 + Math.floor(Math.random() * 100);
                await prisma.invoice.create({
                    data: {
                        invoiceNumber: `INV-${2024000 + i}`,
                        patientId: randomPatient.id,
                        status: Math.random() > 0.2 ? 'PAID' : 'PENDING',
                        total: amount,
                        subtotal: amount * 0.82,
                        tax: amount * 0.18,
                        invoiceDate: date,
                        dueDate: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
                        items: {
                            create: {
                                description: 'Consulta Médica',
                                quantity: 1,
                                unitPrice: amount,
                                total: amount
                            }
                        },
                        payments: {
                            create: {
                                amount: amount,
                                paymentMethod: 'CASH'
                            }
                        }
                    }
                });
            }
        }
    }
    console.log('✅ Appointments & Invoices seeded');

    console.log('🎉 Database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
