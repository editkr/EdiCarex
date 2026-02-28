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
        'Management': ['DASHBOARD', 'PATIENTS_VIEW', 'STAFF_VIEW', 'APPOINTMENTS_VIEW', 'EMERGENCY_VIEW', 'BEDS_VIEW', 'PHARMACY_VIEW', 'LAB_VIEW', 'BILLING_VIEW', 'REPORTS_VIEW', 'REPORTS_EXPORT', 'ANALYTICS_VIEW', 'ANALYTICS_ADVANCED', 'AI_USE', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
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

    // ============================================
    // ORGANIZACIÓN – Centro de Salud Jorge Chávez
    // ============================================
    const existingOrg = await prisma.organizationConfig.findFirst();
    if (!existingOrg) {
        await prisma.organizationConfig.create({
            data: {
                hospitalName: 'Centro de Salud Jorge Chávez',
                email: 'esjorgechavez@gmail.com',
                phone: '951 515 888',
                address: 'Jr. Áncash S/N – Juliaca, San Román, Puno',
                openingHours: {
                    monday: { open: '07:00', close: '19:00', enabled: true },
                    tuesday: { open: '07:00', close: '19:00', enabled: true },
                    wednesday: { open: '07:00', close: '19:00', enabled: true },
                    thursday: { open: '07:00', close: '19:00', enabled: true },
                    friday: { open: '07:00', close: '19:00', enabled: true },
                    saturday: { open: '07:00', close: '13:00', enabled: true },
                    sunday: { open: '00:00', close: '00:00', enabled: false },
                },
                billing: {
                    taxRate: 18,
                    currency: 'PEN',
                    invoicePrefix: 'F',
                    ipress: '00003308',
                    ruc: '20527421711',
                    category: 'I-3',
                    redSalud: 'Red San Román',
                    microred: 'Santa Adriana',
                    unidadEjecutora: '917 – Salud San Román',
                },
                ai: {
                    enabled: true,
                    model: 'llama-3.3-70b-versatile',
                    features: { triage: true, diagnosis: true, teleconsulta: true },
                },
                maintenanceMode: false,
            } as any,
        });
        console.log('✅ OrganizationConfig – Centro de Salud Jorge Chávez creado');
    }

    // ============================================
    // ESPECIALIDADES REALES (Categoría I-3)
    // ============================================
    const specialties = [
        { name: 'Medicina General', description: 'Consulta médica de primer nivel' },
        { name: 'Obstetricia', description: 'Control prenatal y atención materna' },
        { name: 'Odontología', description: 'Salud bucal y preventiva' },
        { name: 'Nutrición', description: 'Evaluación nutricional y dietética' },
        { name: 'Psicología', description: 'Salud mental y bienestar emocional' },
        { name: 'Salud Mental', description: 'Atención integral en salud mental' },
        { name: 'Enfermería', description: 'Cuidados de enfermería y procedimientos' },
        { name: 'Emergencias', description: 'Atención de urgencias y triaje I-3' },
    ];

    for (const specialty of specialties) {
        await prisma.specialty.upsert({
            where: { name: specialty.name },
            update: {},
            create: specialty,
        });
    }

    console.log('✅ Specialties created');

    // ============================================
    // PACIENTES – Nombres peruanos/andinos reales
    // ============================================
    const patients = [
        {
            firstName: 'Carmen Rosa',
            lastName: 'Quispe Mamani',
            dateOfBirth: new Date('1988-03-12'),
            gender: 'FEMALE',
            bloodType: 'O+',
            phone: '951234001',
            email: 'carmen.quispe@gmail.com',
            address: 'Jr. Moquegua 342',
            city: 'Juliaca',
            state: 'Puno',
            zipCode: '21101',
        },
        {
            firstName: 'Juan Carlos',
            lastName: 'Mamani Flores',
            dateOfBirth: new Date('1975-11-08'),
            gender: 'MALE',
            bloodType: 'A+',
            phone: '951234002',
            email: 'juan.mamani@gmail.com',
            address: 'Av. Circunvalación 891',
            city: 'Juliaca',
            state: 'Puno',
            zipCode: '21101',
        },
        {
            firstName: 'María Elena',
            lastName: 'Huanca Ticona',
            dateOfBirth: new Date('1995-07-20'),
            gender: 'FEMALE',
            bloodType: 'B+',
            phone: '951234003',
            email: 'maria.huanca@gmail.com',
            address: 'Jr. Arequipa 156',
            city: 'Juliaca',
            state: 'Puno',
            zipCode: '21101',
        },
        {
            firstName: 'Pedro Lucio',
            lastName: 'Condori Apaza',
            dateOfBirth: new Date('1960-02-14'),
            gender: 'MALE',
            bloodType: 'AB+',
            phone: '951234004',
            email: 'pedro.condori@gmail.com',
            address: 'Av. Piérola 450',
            city: 'Juliaca',
            state: 'Puno',
            zipCode: '21101',
        },
        {
            firstName: 'Lucía Dina',
            lastName: 'Ramos Coaquira',
            dateOfBirth: new Date('2000-09-03'),
            gender: 'FEMALE',
            bloodType: 'O-',
            phone: '951234005',
            email: 'lucia.ramos@gmail.com',
            address: 'Jr. Tacna 78',
            city: 'Juliaca',
            state: 'Puno',
            zipCode: '21101',
        },
        {
            firstName: 'Wilber',
            lastName: 'Ccopa Puma',
            dateOfBirth: new Date('1983-05-17'),
            gender: 'MALE',
            bloodType: 'A-',
            phone: '951234006',
            email: 'wilber.ccopa@gmail.com',
            address: 'Av. Ferroviaria 210',
            city: 'Juliaca',
            state: 'Puno',
            zipCode: '21101',
        },
    ];

    for (const patient of patients) {
        // Verificar si ya existe
        const existingPatient = await prisma.patient.findFirst({ where: { email: patient.email } });
        if (existingPatient) continue;

        const createdPatient = await prisma.patient.create({ data: patient });

        // Crear usuario del Portal del Paciente para el primer paciente
        if (patient.email === 'carmen.quispe@gmail.com') {
            const existingUser = await prisma.user.findUnique({ where: { email: patient.email } });
            if (!existingUser) {
                const hashedPatientPw = await bcrypt.hash('password123', 10);
                await prisma.user.create({
                    data: {
                        email: patient.email,
                        password: hashedPatientPw,
                        firstName: patient.firstName,
                        lastName: patient.lastName,
                        phone: patient.phone,
                        roleId: patientRole.id,
                        patient: { connect: { id: createdPatient.id } },
                        isActive: true,
                    }
                });
                console.log('✅ Usuario portal paciente: carmen.quispe@gmail.com / password123');
            }
        }
    }

    console.log('✅ Sample patients created');

    // ============================================
    // HR – Personal real del Centro de Salud Jorge Chávez
    // ============================================
    const employees = [
        {
            name: 'Lic. Elías Sucapuca Luque',
            area: 'Dirección',
            role: 'Management',
            department: 'Administrative',
            email: 'e.sucapuca@csjchavez.gob.pe',
            salary: 6200,
            contract: 'Tiempo Completo',
            status: 'ACTIVE',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elias',
            hireDate: new Date('2018-05-10'),
            shifts: [
                { dayOfWeek: 'Lunes', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
                { dayOfWeek: 'Martes', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
                { dayOfWeek: 'Miércoles', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
                { dayOfWeek: 'Jueves', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
                { dayOfWeek: 'Viernes', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
            ]
        },
        {
            name: 'Dr. Raúl Huanca Quispe',
            area: 'Medicina General',
            role: 'Doctor',
            department: 'Medical',
            email: 'r.huanca@csjchavez.gob.pe',
            salary: 5800,
            contract: 'Tiempo Completo',
            status: 'ACTIVE',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raul',
            hireDate: new Date('2019-03-01'),
            shifts: [
                { dayOfWeek: 'Lunes', shiftType: 'MORNING', startTime: '07:00', endTime: '13:00' },
                { dayOfWeek: 'Miércoles', shiftType: 'MORNING', startTime: '07:00', endTime: '13:00' },
                { dayOfWeek: 'Viernes', shiftType: 'MORNING', startTime: '07:00', endTime: '13:00' },
            ]
        },
        {
            name: 'Dra. Flor María Condori Mamani',
            area: 'Medicina General',
            role: 'Doctor',
            department: 'Medical',
            email: 'f.condori@csjchavez.gob.pe',
            salary: 5800,
            contract: 'Tiempo Completo',
            status: 'ACTIVE',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Flor',
            hireDate: new Date('2021-07-15'),
            shifts: [
                { dayOfWeek: 'Martes', shiftType: 'MORNING', startTime: '07:00', endTime: '13:00' },
                { dayOfWeek: 'Jueves', shiftType: 'MORNING', startTime: '07:00', endTime: '13:00' },
                { dayOfWeek: 'Sábado', shiftType: 'MORNING', startTime: '07:00', endTime: '13:00' },
            ]
        },
        {
            name: 'Lic. Margarita Ccopa Apaza',
            area: 'Obstetricia',
            role: 'Doctor',
            department: 'Medical',
            email: 'm.ccopa@csjchavez.gob.pe',
            salary: 4900,
            contract: 'Tiempo Completo',
            status: 'ACTIVE',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Margarita',
            hireDate: new Date('2020-02-01'),
            shifts: [
                { dayOfWeek: 'Lunes', shiftType: 'MORNING', startTime: '07:00', endTime: '13:00' },
                { dayOfWeek: 'Martes', shiftType: 'MORNING', startTime: '07:00', endTime: '13:00' },
                { dayOfWeek: 'Jueves', shiftType: 'MORNING', startTime: '07:00', endTime: '13:00' },
            ]
        },
        {
            name: 'Enf. Sandra Ramos Tito',
            area: 'Enfermería',
            role: 'Nurse',
            department: 'Medical',
            email: 's.ramos@csjchavez.gob.pe',
            salary: 3800,
            contract: 'Tiempo Completo',
            status: 'ACTIVE',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sandra',
            hireDate: new Date('2020-08-15'),
            shifts: [
                { dayOfWeek: 'Lunes', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
                { dayOfWeek: 'Miércoles', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
                { dayOfWeek: 'Viernes', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
            ]
        },
        {
            name: 'Enf. Carlos Puma Flores',
            area: 'Emergencias',
            role: 'Nurse',
            department: 'Emergency',
            email: 'c.puma@csjchavez.gob.pe',
            salary: 3800,
            contract: 'Tiempo Completo',
            status: 'ACTIVE',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
            hireDate: new Date('2022-01-10'),
            shifts: [
                { dayOfWeek: 'Martes', shiftType: 'AFTERNOON', startTime: '13:00', endTime: '19:00' },
                { dayOfWeek: 'Jueves', shiftType: 'AFTERNOON', startTime: '13:00', endTime: '19:00' },
                { dayOfWeek: 'Sábado', shiftType: 'MORNING', startTime: '07:00', endTime: '13:00' },
            ]
        },
        {
            name: 'Tec. Rosa Ticona Coaquira',
            area: 'Laboratorio',
            role: 'Lab',
            department: 'Laboratory',
            email: 'r.ticona@csjchavez.gob.pe',
            salary: 3200,
            contract: 'Tiempo Completo',
            status: 'ACTIVE',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rosa',
            hireDate: new Date('2021-05-20'),
            shifts: [
                { dayOfWeek: 'Lunes', shiftType: 'MORNING', startTime: '07:00', endTime: '13:00' },
                { dayOfWeek: 'Miércoles', shiftType: 'MORNING', startTime: '07:00', endTime: '13:00' },
                { dayOfWeek: 'Viernes', shiftType: 'MORNING', startTime: '07:00', endTime: '13:00' },
            ]
        },
        {
            name: 'Tec. Benita Mamani Pari',
            area: 'Farmacia',
            role: 'Pharmacy',
            department: 'Pharmacy',
            email: 'b.mamani@csjchavez.gob.pe',
            salary: 3100,
            contract: 'Tiempo Completo',
            status: 'ACTIVE',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Benita',
            hireDate: new Date('2022-03-01'),
            shifts: [
                { dayOfWeek: 'Lunes', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
                { dayOfWeek: 'Martes', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
                { dayOfWeek: 'Jueves', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
            ]
        },
        {
            name: 'Srta. Yolanda Quispe Torres',
            area: 'Admisión',
            role: 'Receptionist',
            department: 'Administrative',
            email: 'y.quispe@csjchavez.gob.pe',
            salary: 2800,
            contract: 'Tiempo Completo',
            status: 'ACTIVE',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yolanda',
            hireDate: new Date('2023-01-05'),
            shifts: [
                { dayOfWeek: 'Lunes', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
                { dayOfWeek: 'Martes', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
                { dayOfWeek: 'Miércoles', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
                { dayOfWeek: 'Jueves', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
                { dayOfWeek: 'Viernes', shiftType: 'MORNING', startTime: '07:00', endTime: '15:00' },
            ]
        },
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
    // EMERGENCIA – Camillas de Observación (sin hospitalización I-3)
    // ============================================
    // El Centro de Salud Jorge Chávez es ambulatorio. Solo tiene
    // camillas de observación en el área de urgencias (NO camas hospitalarias).
    const observacionBeds = [
        { number: 'OBS-01', ward: 'Observación', type: 'Camilla de Observación' },
        { number: 'OBS-02', ward: 'Observación', type: 'Camilla de Observación' },
        { number: 'OBS-03', ward: 'Observación', type: 'Camilla de Observación' },
        { number: 'OBS-04', ward: 'Observación', type: 'Camilla de Observación' },
        { number: 'OBS-05', ward: 'Urgencias', type: 'Camilla de Urgencias' },
    ];

    const allBedIds: string[] = [];
    for (const obs of observacionBeds) {
        const bed = await prisma.bed.upsert({
            where: { number: obs.number },
            update: {},
            create: {
                number: obs.number,
                ward: obs.ward,
                type: obs.type,
                status: 'AVAILABLE',
            }
        });
        allBedIds.push(bed.id);
    }

    // Casos de emergencia reales de un centro I-3
    const erDiagnoses = [
        'Fiebre Alta (39°C)',
        'Dolor Abdominal Agudo',
        'Crisis Asmática Leve',
        'Traumatismo Leve por Caída',
        'Cefalea Intensa',
        'Deshidratación Moderada',
    ];

    // Doctores de emergencia del centro
    const erDoctors = ['Dr. Raúl Huanca Quispe', 'Dra. Flor María Condori Mamani'];

    // Crear 3 casos de emergencia activos
    const patientNames = [
        { name: 'Augusto Coila Mamani', age: 45 },
        { name: 'Dolores Pari Ticona', age: 38 },
        { name: 'Emilio Quisca Flores', age: 62 },
    ];

    for (let i = 0; i < patientNames.length; i++) {
        const diagnosis = erDiagnoses[i % erDiagnoses.length];
        const triage = Math.floor(Math.random() * 3) + 2; // 2-4 (I-3 no atiende prioridad 1)

        const kase = await prisma.emergencyCase.create({
            data: {
                patientName: patientNames[i].name,
                patientAge: patientNames[i].age,
                triageLevel: triage,
                chiefComplaint: diagnosis,
                diagnosis: diagnosis,
                vitalSigns: {
                    hr: 80 + Math.round(Math.random() * 20),
                    bp: '120/80',
                    temp: parseFloat((37 + Math.random()).toFixed(1)),
                    spo2: parseFloat((95 + Math.random() * 4).toFixed(1))
                },
                status: 'IN_PROGRESS',
                bedNumber: observacionBeds[i]?.number || 'OBS-01',
                doctorName: erDoctors[i % erDoctors.length],
                admissionDate: new Date()
            }
        });

        // Marcar camilla como ocupada
        if (allBedIds[i]) {
            await prisma.bed.update({
                where: { id: allBedIds[i] },
                data: { status: 'OCCUPIED', notes: `Caso ER: ${kase.id}` }
            });
        }
    }

    console.log('✅ Camillas de Observación y Casos de Emergencia creados');

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
