import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PharmacyService } from '../pharmacy/pharmacy.service';

interface BillingConfig {
    invoicePrefix?: string;
    currency?: string;
}

@Injectable()
export class BillingService {
    constructor(
        private prisma: PrismaService,
        private pharmacyService: PharmacyService
    ) { }

    async getInvoices(query: any) {
        try {
            const { page = 1, limit = 10, status } = query || {};
            const skip = (page - 1) * limit;

            const where: any = {};
            if (status && status !== 'all') {
                where.status = status;
            }
            if (query?.patientId) {
                where.patientId = query.patientId;
            }

            const [data, total] = await Promise.all([
                this.prisma.invoice.findMany({
                    where,
                    skip,
                    take: parseInt(limit.toString()),
                    include: {
                        patient: true,
                        items: true,
                        payments: true
                    },
                    orderBy: { invoiceDate: 'desc' },
                }),
                this.prisma.invoice.count({ where }),
            ]);

            return {
                data,
                total,
                page: parseInt(page.toString()),
                limit: parseInt(limit.toString()),
                totalPages: Math.ceil(total / limit),
            };
        } catch (error) {
            console.error("Error getting invoices:", error);
            return {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0
            };
        }
    }

    async getInvoice(id: string) {
        try {
            return await this.prisma.invoice.findUnique({
                where: { id },
                include: {
                    patient: true,
                    items: true,
                    payments: true,
                },
            });
        } catch (error) {
            console.error("Error getting invoice:", error);
            // Return null if not found or error, simpler for frontend to handle than 500
            return null;
        }
    }

    async createInvoice(data: any) {
        try {
            const {
                patientId,
                items,
                discount,
                tax,
                total,
                subtotal,
                status,
                paymentMethod,
                paymentDate,
                destinationAccountId,
                operationNumber,
                invoiceDate,
                dueDate,
                notes,
                staffId,
                appointmentId
            } = data;


            // Get organization config for prefix
            const config = await this.prisma.organizationConfig.findFirst();
            const billingConfig = config?.billing as unknown as BillingConfig;
            const prefix = billingConfig?.invoicePrefix || 'INV';
            const invoiceNumber = `${prefix}-${Date.now()}`;

            // Use currency from data or fallback to config
            const currency = data.currency || billingConfig?.currency || 'PEN';

            // Calculate subtotal if not provided
            const calculatedSubtotal = subtotal || (total - (tax || 0) + (discount || 0));

            // Use transaction to ensure both header and items are created
            const invoice = await this.prisma.invoice.create({
                data: {
                    invoiceNumber,
                    patientId,
                    subtotal: calculatedSubtotal,
                    tax: tax || 0,
                    discount: discount || 0,
                    total: total,
                    currency,
                    status: status || 'PENDING',
                    paymentMethod: paymentMethod || null,
                    paymentDate: paymentDate ? new Date(paymentDate) : null,
                    destinationAccountId: destinationAccountId || null,
                    operationNumber: operationNumber || null,
                    invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
                    dueDate: dueDate ? new Date(dueDate) : null,
                    notes: notes || null,
                    staffId: staffId || null,
                    appointmentId: appointmentId || null,
                    items: {
                        create: items.map((item: any) => ({
                            description: item.name || item.description,
                            quantity: item.quantity || 1,
                            unitPrice: item.price || item.unitPrice,
                            total: (item.price || item.unitPrice) * (item.quantity || 1)
                        }))
                    }
                },
                include: {
                    items: true,
                    patient: true,
                    payments: true
                }
            });

            // If invoice is marked as PAID, reduce stock automatically
            if (status === 'PAID' && items && items.length > 0) {
                try {
                    await this.pharmacyService.reduceStockFromInvoice(invoice.id, items);
                    console.log(`✅ Stock reducido para factura ${invoice.invoiceNumber}`);
                } catch (error) {
                    console.error('⚠️ Error reduciendo stock:', error);
                    // Don't fail invoice creation if stock reduction fails
                }
            }

            return invoice;
        } catch (error) {
            console.error("Error creating invoice:", error);
            throw error;
        }
    }


    async updateInvoice(id: string, data: any) {
        try {
            const { items, patient, payments, ...invoiceData } = data;

            return await this.prisma.$transaction(async (tx) => {
                // 1. Update invoice header
                const updatedInvoice = await tx.invoice.update({
                    where: { id },
                    data: {
                        ...invoiceData,
                        subtotal: data.total - (data.tax || 0) + (data.discount || 0), // Recalculate if needed
                    }
                });

                // 2. Update items (Replace strategy: Delete all and recreate)
                if (items && Array.isArray(items)) {
                    await tx.invoiceItem.deleteMany({
                        where: { invoiceId: id }
                    });

                    await tx.invoiceItem.createMany({
                        data: items.map((item: any) => ({
                            invoiceId: id,
                            description: item.description,
                            quantity: Number(item.quantity),
                            unitPrice: Number(item.unitPrice),
                            total: Number(item.quantity) * Number(item.unitPrice)
                        }))
                    });
                }

                return updatedInvoice;
            });
        } catch (error) {
            console.error("Error updating invoice:", error);
            throw error;
        }
    }

    async deleteInvoice(id: string) {
        return this.prisma.invoice.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async updateStatus(id: string, data: any) {
        try {
            const { status } = data;

            // Get invoice with items before updating
            const invoice = await this.prisma.invoice.findUnique({
                where: { id },
                include: { items: true }
            });

            // Update status
            const updated = await this.prisma.invoice.update({
                where: { id },
                data: { status },
            });

            // If changing to PAID and wasn't paid before, reduce stock
            if (status === 'PAID' && invoice && invoice.status !== 'PAID' && invoice.items.length > 0) {
                try {
                    await this.pharmacyService.reduceStockFromInvoice(id, invoice.items);
                    console.log(`✅ Stock reducido para factura ${invoice.invoiceNumber}`);
                } catch (error) {
                    console.error('⚠️ Error reduciendo stock:', error);
                    // Don't fail status update if stock reduction fails
                }
            }

            return updated;
        } catch (error) {
            console.error("Error updating invoice status:", error);
            throw error;
        }
    }

    async getStats() {
        const [totalRevenue, paidInvoices, pendingInvoices, overdueInvoices] = await Promise.all([
            this.prisma.invoice.aggregate({
                where: { status: 'PAID' },
                _sum: { total: true },
            }),
            this.prisma.invoice.count({ where: { status: 'PAID' } }),
            this.prisma.invoice.count({ where: { status: 'PENDING' } }),
            this.prisma.invoice.count({ where: { status: 'OVERDUE' } }),
        ]);

        return {
            totalRevenue: totalRevenue._sum.total || 0,
            paidInvoices,
            pendingInvoices,
            overdueInvoices,
        };
    }
}
