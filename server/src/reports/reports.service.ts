import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ReportsService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiService
    ) { }

    async getDashboardStats() {
        const [todayAppointments, totalPatients, totalStaff, pendingInvoices] = await Promise.all([
            this.prisma.appointment.count({
                where: {
                    appointmentDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                }
            }),
            this.prisma.patient.count({ where: { status: 'ACTIVE' } }),
            this.prisma.healthStaff.count({ where: { deletedAt: null } }),
            this.prisma.invoice.count({ where: { status: 'PENDING', deletedAt: null } })
        ]);

        return {
            todayAppointments,
            totalPatients,
            totalStaff,
            pendingInvoices
        };
    }

    async getAppointmentStats(params: any = {}) {
        const { startDate, endDate } = this.getDateRange(params);

        const appointments = await this.prisma.appointment.findMany({
            where: {
                appointmentDate: {
                    gte: startDate,
                    lte: endDate
                },
                deletedAt: null
            },
            select: {
                appointmentDate: true,
                status: true
            }
        });

        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const stats = months.map((month, index) => {
            const monthlyApps = appointments.filter(a => new Date(a.appointmentDate).getMonth() === index);
            return {
                month,
                total: monthlyApps.length,
                completed: monthlyApps.filter(a => a.status === 'COMPLETED').length,
                cancelled: monthlyApps.filter(a => a.status === 'CANCELLED').length
            };
        });

        // If date range is small (e.g. week), we might want to group by day instead of month, 
        // but for now keeping monthly grouping as per UI chart requirement.
        return stats;
    }

    async getPatientStats(params: any = {}) {
        const { startDate, endDate } = this.getDateRange(params);

        const patients = await this.prisma.patient.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: 'ACTIVE'
            },
            select: { createdAt: true }
        });

        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return months.map((month, index) => ({
            month,
            count: patients.filter(p => new Date(p.createdAt).getMonth() === index).length
        }));
    }

    async getFinancialStats(params: any = {}) {
        const { startDate, endDate } = this.getDateRange(params);

        const invoices = await this.prisma.invoice.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                deletedAt: null
            },
            select: {
                createdAt: true,
                total: true,
                status: true
            }
        });

        // 1. Calculate Real Revenue (Invoices)
        const totalRevenue = invoices
            .filter(i => i.status === 'PAID')
            .reduce((sum, i) => sum + Number(i.total), 0);

        // 2. Fetch Real Expenses (Payroll & Pharmacy Cost)
        const [payrolls, pharmacyMovements] = await Promise.all([
            this.prisma.payroll.findMany({
                where: {
                    paidDate: { gte: startDate, lte: endDate },
                    status: 'PAID'
                }
            }),
            this.prisma.pharmacyMovement.findMany({
                where: {
                    movementType: 'IN',
                    createdAt: { gte: startDate, lte: endDate }
                }
            })
        ]);

        const payrollExpenses = payrolls.reduce((sum, p) => sum + Number(p.netSalary), 0);
        // Sum cost from movements (purchases/restocks)
        const pharmacyPurchaseCost = pharmacyMovements.reduce((sum, m) => sum + (Number(m.quantity) * Number((m as any).unitPrice || 0)), 0);

        const totalExpenses = payrollExpenses + pharmacyPurchaseCost;

        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthlyBreakdown = months.map((month, index) => {
            const monthlyInvoices = invoices.filter(i => new Date(i.createdAt).getMonth() === index);
            const monthlyPayrolls = payrolls.filter(p => p.paidDate && new Date(p.paidDate).getMonth() === index);
            const monthlyPharmacyMovements = pharmacyMovements.filter(m => new Date(m.createdAt).getMonth() === index);

            const revenue = monthlyInvoices
                .filter(i => i.status === 'PAID')
                .reduce((sum, i) => sum + Number(i.total), 0);

            const expenses =
                monthlyPayrolls.reduce((sum, p) => sum + Number(p.netSalary), 0) +
                monthlyPharmacyMovements.reduce((sum, m) => sum + (Number(m.quantity) * Number((m as any).unitPrice || 0)), 0);

            return {
                month,
                revenue,
                expenses
            };
        });

        return {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1) : 0,
            monthlyBreakdown
        };
    }

    async getMedicationStats(params: any = {}) {
        // Medication stock is current state, typically not filtered by date unless we track movements history
        // For now returning current stock status
        const medications = await this.prisma.medication.findMany({
            where: { isActive: true },
            include: {
                stock: true
            }
        });

        return medications.map(m => {
            const totalStock = m.stock.reduce((sum, s) => sum + s.quantity, 0);
            // Updated to use sellingPrice as user expects to see Sales Value, not just Cost
            // Added safety checks for null/undefined values
            const totalValue = m.stock.reduce((sum, s) => sum + (Number(s.quantity || 0) * Number(s.sellingPrice || 0)), 0);

            return {
                name: m.name,
                quantity: totalStock,
                cost: totalValue
            }
        })
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 5);
    }

    async getStaffStats(params: any = {}) {
        const { startDate, endDate } = this.getDateRange(params);

        const staff = await this.prisma.healthStaff.findMany({
            where: { deletedAt: null },
            include: {
                user: {
                    select: { firstName: true, lastName: true }
                },
                appointments: {
                    where: {
                        appointmentDate: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    select: { status: true }
                },
                invoices: {
                    where: {
                        status: 'PAID',
                        invoiceDate: {
                            gte: startDate,
                            lte: endDate
                        },
                        deletedAt: null
                    }
                }
            }
        });

        return staff.map(s => {
            const totalAppointments = s.appointments.length;
            const completedAppointments = s.appointments.filter(a => a.status === 'COMPLETED').length;

            // Calculate satisfaction based on completion rate (real metric)
            const completionRate = totalAppointments > 0 ? completedAppointments / totalAppointments : 0;
            const satisfaction = totalAppointments > 0 ? (completionRate * 5).toFixed(1) : 0;

            // Calculate real revenue from PAID invoices linked to this staff
            const revenue = s.invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

            return {
                name: `${s.user.firstName} ${s.user.lastName}`,
                patients: totalAppointments,
                satisfaction: Number(satisfaction) || 0,
                revenue: revenue
            };
        }).sort((a, b) => b.patients - a.patients).slice(0, 5);
    }

    async getEmergencyStats(params: any = {}) {
        const { startDate, endDate } = this.getDateRange(params);

        const cases = await this.prisma.emergencyCase.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                triageLevel: true,
                status: true,
                createdAt: true,
                dischargedAt: true
            }
        });

        const triageMap = {
            1: 'Resucitación (Crítico)',
            2: 'Emergencia',
            3: 'Urgencia',
            4: 'Urgencia Menor',
            5: 'No Urgente'
        };

        const stats = [1, 2, 3, 4, 5].map(level => {
            const levelCases = cases.filter(c => c.triageLevel === level);
            const completedCases = levelCases; // Consideramos todos para el promedio
            const totalTime = completedCases.reduce((sum, c) => {
                const end = c.dischargedAt ? new Date(c.dischargedAt).getTime() : new Date().getTime();
                const diff = end - new Date(c.createdAt).getTime();
                return sum + diff;
            }, 0);

            const avgTime = completedCases.length > 0
                ? Math.round((totalTime / completedCases.length) / 60000)
                : 0;

            return {
                type: triageMap[level],
                count: levelCases.length,
                avgTime
            };
        });

        return stats.filter(s => s.count > 0);
    }

    async getComparisonStats(params: any = {}) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const lastYear = currentYear - 1;

        const { startDate, endDate } = this.getDateRange(params);
        const lastYearStartDate = new Date(startDate);
        lastYearStartDate.setFullYear(startDate.getFullYear() - 1);
        const lastYearEndDate = new Date(endDate);
        lastYearEndDate.setFullYear(endDate.getFullYear() - 1);

        const currentYearInvoices = await this.prisma.invoice.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: 'PAID',
                deletedAt: null
            },
            select: { createdAt: true, total: true }
        });

        const lastYearInvoices = await this.prisma.invoice.findMany({
            where: {
                createdAt: {
                    gte: lastYearStartDate,
                    lte: lastYearEndDate
                },
                status: 'PAID',
                deletedAt: null
            },
            select: { createdAt: true, total: true }
        });

        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        return months.map((month, index) => {
            const currentTotal = currentYearInvoices
                .filter(i => new Date(i.createdAt).getMonth() === index)
                .reduce((sum, i) => sum + Number(i.total), 0);

            const previousTotal = lastYearInvoices
                .filter(i => new Date(i.createdAt).getMonth() === index)
                .reduce((sum, i) => sum + Number(i.total), 0);

            return {
                month,
                current: currentTotal,
                previous: previousTotal
            };
        });
    }

    async getAiPredictions(params: any = {}) {
        // 1. Get current year data
        const stats = await this.getFinancialStats(params);

        // 2. Get previous year data (2025) for better context
        const lastYearParams = {
            startDate: new Date(new Date().getFullYear() - 1, 0, 1),
            endDate: new Date(new Date().getFullYear() - 1, 11, 31)
        };
        const lastYearStats = await this.getFinancialStats(lastYearParams);

        // 3. Construct historical context for Groq
        const financialContext = {
            currentYear: stats.monthlyBreakdown,
            previousYear: lastYearStats.monthlyBreakdown,
            totals: {
                currentRevenue: stats.totalRevenue,
                previousRevenue: lastYearStats.totalRevenue,
                growth: lastYearStats.totalRevenue > 0
                    ? ((stats.totalRevenue - lastYearStats.totalRevenue) / lastYearStats.totalRevenue) * 100
                    : 0
            }
        };

        try {
            // 4. Call Groq via AI service
            const aiPrediction = await this.aiService.predictGrowth(financialContext);

            if (aiPrediction) {
                return aiPrediction;
            }
        } catch (error) {
            console.error('Groq prediction failed, using enhanced fallback', error);
        }

        // 5. Enhanced Fallback if AI fails (but using real data trends)
        const lastMonthRevenue = stats.monthlyBreakdown.filter(m => m.revenue > 0).pop()?.revenue || 10000;
        return {
            predictions: [
                { month: 'Próximo', predicted: Math.round(lastMonthRevenue * 1.05), confidence: 70 },
                { month: 'Siguiente', predicted: Math.round(lastMonthRevenue * 1.10), confidence: 60 }
            ],
            insight: "⚠️ (MODO FALLBACK) Análisis de tendencia lineal basado en ingresos actuales. El motor Groq no respondió a tiempo.",
            projected_annual_growth: 5.5,
            accuracy_score: 75
        };
    }

    async exportReport(type: string, params: any) {
        const { startDate, endDate } = this.getDateRange(params);

        if (type === 'medications') {
            const meds = await this.prisma.medication.findMany({
                where: { isActive: true },
                include: { stock: true }
            });

            let csv = '\ufeff'; // BOM
            csv += 'ID,Nombre,Categoría,Laboratorio,Stock Actual,Stock Mínimo,Lote,Vencimiento\n';
            meds.forEach(m => {
                const totalStock = m.stock.reduce((sum, s) => sum + s.quantity, 0);
                const mainBatch = m.stock[0] as any || {};
                csv += `"${m.id}","${m.name}","${m.category || 'Medicamento'}","${m.manufacturer || 'Generico'}",${totalStock},${mainBatch.minStockLevel || 10},"${mainBatch.batchNumber || 'N/A'}","${mainBatch.expirationDate ? new Date(mainBatch.expirationDate).toLocaleDateString() : 'N/A'}"\n`;
            });

            return {
                buffer: Buffer.from(csv, 'utf-8'),
                filename: `Reporte_Medicamentos_${new Date().toISOString().split('T')[0]}.csv`
            };
        }

        if (type === 'appointments') {
            const appointments = await this.prisma.appointment.findMany({
                where: {
                    appointmentDate: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    patient: true,
                    staff: { include: { user: true } }
                }
            });

            let csv = '\ufeff'; // BOM
            csv += 'Fecha,Hora,Paciente,Personal,Tipo,Estado,Notas\n';
            appointments.forEach(a => {
                csv += `"${new Date(a.appointmentDate).toLocaleDateString()}","${a.startTime}","${a.patient.firstName} ${a.patient.lastName}","${a.staff.user.firstName} ${a.staff.user.lastName}","${a.type}","${a.status}","${a.notes || ''}"\n`;
            });

            return {
                buffer: Buffer.from(csv, 'utf-8'),
                filename: `Reporte_Citas_${new Date().toISOString().split('T')[0]}.csv`
            };
        }

        if (type === 'financial') {
            const invoices = await this.prisma.invoice.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    patient: true
                }
            });

            let csv = '\ufeff'; // BOM
            csv += 'Factura,Fecha,Paciente,Estado,Total,Método Pago\n';
            invoices.forEach(i => {
                csv += `"${i.invoiceNumber}","${new Date(i.createdAt).toLocaleDateString()}","${i.patient.firstName} ${i.patient.lastName}","${i.status}","${i.total}","${i.paymentMethod || 'N/A'}"\n`;
            });

            return {
                buffer: Buffer.from(csv, 'utf-8'),
                filename: `Reporte_Financiero_${new Date().toISOString().split('T')[0]}.csv`
            };
        }

        if (type === 'patients') {
            const patients = await this.prisma.patient.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: {
                    firstName: true,
                    lastName: true,
                    documentNumber: true,
                    email: true,
                    phone: true,
                    createdAt: true,
                    gender: true
                }
            });

            let csv = '\ufeff'; // BOM
            csv += 'Nombre,Apellido,Documento,Email,Teléfono,Género,Fecha Registro\n';
            patients.forEach(p => {
                csv += `"${p.firstName}","${p.lastName}","${p.documentNumber || ''}","${p.email || ''}","${p.phone}","${p.gender}","${new Date(p.createdAt).toLocaleDateString()}"\n`;
            });

            return {
                buffer: Buffer.from(csv, 'utf-8'),
                filename: `Reporte_Pacientes_${new Date().toISOString().split('T')[0]}.csv`
            };
        }

        if (type === 'staff') {
            const staff = await this.prisma.healthStaff.findMany({
                include: {
                    user: true,
                    _count: {
                        select: { appointments: true }
                    }
                }
            });

            let csv = '\ufeff'; // BOM
            csv += 'Personal,Especialidad,Licencia,Email,Pacientes Atendidos,Tarifa Consulta\n';
            staff.forEach(s => {
                csv += `"${s.user.firstName} ${s.user.lastName}","${s.specialization || ''}","${s.licenseNumber}","${s.user.email}","${s._count.appointments}","${s.consultationFee}"\n`;
            });

            return {
                buffer: Buffer.from(csv, 'utf-8'),
                filename: `Reporte_Personal_${new Date().toISOString().split('T')[0]}.csv`
            };
        }

        if (type === 'emergencies') {
            const cases = await this.prisma.emergencyCase.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    patient: true,
                    staff: { include: { user: true } }
                }
            });

            let csv = '\ufeff'; // BOM
            csv += 'Paciente,Personal,Nivel Triage,Estado,Queja Principal,Entrada,Salida\n';
            cases.forEach(c => {
                const patientName = c.patient ? `${c.patient.firstName} ${c.patient.lastName}` : c.patientName;
                csv += `"${patientName}","${c.staff?.user.firstName || 'N/A'} ${c.staff?.user.lastName || ''}","${c.triageLevel}","${c.status}","${c.chiefComplaint || ''}","${new Date(c.createdAt).toLocaleDateString()} ${new Date(c.createdAt).toLocaleTimeString()}","${c.dischargedAt ? new Date(c.dischargedAt).toLocaleString() : 'En curso'}"\n`;
            });

            return {
                buffer: Buffer.from(csv, 'utf-8'),
                filename: `Reporte_Emergencias_${new Date().toISOString().split('T')[0]}.csv`
            };
        }

        throw new Error(`Report type ${type} not supported for export.`);
    }

    private getDateRange(params: any) {
        const currentYear = new Date().getFullYear();
        let startDate = params.startDate ? new Date(params.startDate) : new Date(`${currentYear}-01-01`);
        let endDate = params.endDate ? new Date(params.endDate) : new Date(`${currentYear}-12-31`);

        // Ensure end of day for endDate
        endDate.setHours(23, 59, 59, 999);

        return { startDate, endDate };
    }
}
