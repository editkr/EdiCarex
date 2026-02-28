import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PharmacyService {
    constructor(private prisma: PrismaService) { }

    async getMedications(query: any) {
        // Flattened view for frontend table
        const meds = await this.prisma.medication.findMany({
            where: { isActive: true },
            include: {
                stock: {
                    orderBy: { expirationDate: 'asc' } // Get nearest expiry first
                }
            }
        });

        // Transform to match frontend expectation
        return {
            data: meds.map(med => {
                const totalStock = med.stock.reduce((sum, item) => sum + item.quantity, 0);
                // Use the first stock batch for display details (batch, expiry)
                const mainBatch = med.stock[0] || ({} as any);

                return {
                    id: med.id,
                    name: med.name,
                    type: med.category || 'Medicamento',
                    laboratory: med.manufacturer || 'Generico',
                    currentStock: totalStock,
                    minStock: mainBatch.minStockLevel || 10,
                    price: Number(mainBatch.sellingPrice || 0), // [NEW] Return real price
                    costPrice: Number(mainBatch.unitPrice || 0), // [NEW] Return cost price
                    batch: mainBatch.batchNumber || 'N/A',
                    expirationDate: mainBatch.expirationDate || new Date(),
                    description: med.description
                };
            })
        };
    }

    async getOrders() {
        // Safe check if model is loaded (Prisma client issues)
        try {
            const orders = await (this.prisma as any).pharmacyOrder.findMany({
                include: {
                    medication: true,
                    staff: { include: { user: true } }, // To get staff name
                    patient: true
                },
                orderBy: { requestedAt: 'desc' }
            });

            return orders.map((order: any) => ({
                id: order.id,
                medicationName: order.medication?.name || 'Medicamento',
                quantity: order.quantity,
                requesterName: order.staff?.user ? `${order.staff.user.lastName}` : 'Personal Externo',
                patientName: order.patient ? `${order.patient.firstName} ${order.patient.lastName}` : 'Paciente Externo',
                status: order.status, // PENDIENTE, APROBADO, RECHAZADO
                requestedAt: order.requestedAt,
                createdAt: order.createdAt,
                approvedAt: order.approvedAt,
                approvedBy: order.approvedBy,
                rejectedAt: order.rejectedAt,
                rejectedBy: order.rejectedBy,
                rejectionReason: order.rejectionReason
            }));
        } catch (e) {
            console.error('Error fetching pharmacy orders (model might not exist yet):', e);
            return [];
        }
    }

    async getKardex() {
        try {
            const movements = await this.prisma.pharmacyMovement.findMany({
                include: {
                    medication: true
                },
                orderBy: { createdAt: 'desc' }
            });

            return movements.map((mov: any) => ({
                id: mov.id,
                createdAt: mov.createdAt,
                date: mov.createdAt,
                medicationName: mov.medication.name,
                type: mov.movementType,
                quantity: mov.quantity,
                batch: mov.referenceNumber || 'N/A',
                resultingStock: mov.resultingStock,
                responsible: mov.performedBy || 'Sistema',
                reason: mov.reason || 'Sin motivo',
                notes: mov.notes
            }));
        } catch (e) {
            console.error('Error fetching kardex (possibly model issue):', e);
            return [];
        }
    }

    async getMedication(id: string) {
        return this.prisma.medication.findUnique({
            where: { id },
            include: {
                stock: true,
            },
        });
    }

    async createMedication(data: any) {
        const { stock, minStock, batch, expiry, ...medData } = data;

        return this.prisma.$transaction(async (tx) => {
            // 1. Create the Medication
            const med = await tx.medication.create({
                data: {
                    name: medData.name,
                    manufacturer: medData.manufacturer,
                    description: medData.description,
                    category: medData.category || 'Medicamento',
                    isActive: true
                }
            });

            // 2. Create Initial Stock
            if (stock > 0 || minStock) {
                await (tx as any).pharmacyStock.create({
                    data: {
                        medicationId: med.id,
                        quantity: Number(stock) || 0,
                        minStockLevel: Number(minStock) || 10,
                        batchNumber: batch || `INIT-${Date.now()}`,
                        expirationDate: (expiry && expiry !== '') ? new Date(expiry) : undefined,
                        unitPrice: Number(data.costPrice) || 0,
                        sellingPrice: Number(data.price) || 0 // [NEW] Save dynamic price
                    }
                });

                // [NEW] Log initial stock to Kardex
                const initialStockValue = Number(stock) || 0;
                if (initialStockValue > 0) {
                    await (tx as any).pharmacyMovement.create({
                        data: {
                            medicationId: med.id,
                            quantity: initialStockValue,
                            movementType: 'IN',
                            reason: 'INGRESO_INICIAL',
                            referenceNumber: batch || `INIT-${Date.now()}`,
                            resultingStock: initialStockValue,
                            performedBy: 'ADMIN',
                            unitPrice: Number(data.costPrice) || 0, // [NEW] Save cost to Movement
                            notes: `Ingreso inicial de stock: ${medData.name}`
                        }
                    });
                }
            }

            return med;
        });
    }

    async updateMedication(id: string, data: any) {
        const { stock, minStock, batch, expiry, name, manufacturer, category } = data;

        try {
            return await this.prisma.$transaction(async (tx) => {
                // 1. Update Medication details
                const med = await tx.medication.update({
                    where: { id },
                    data: {
                        name,
                        manufacturer,
                        category: category || 'Medicamento'
                    }
                });

                // 2. Update Stock details
                if (stock !== undefined) {
                    const existingStock = await (tx as any).pharmacyStock.findFirst({
                        where: { medicationId: id }
                    });

                    const newStockValue = Number(stock) || 0;

                    if (existingStock) {
                        const diff = newStockValue - existingStock.quantity;
                        if (diff !== 0) {
                            // Calculate final total stock for Kardex
                            const allStock = await (tx as any).pharmacyStock.findMany({
                                where: { medicationId: id }
                            });
                            const currentTotal = allStock.reduce((sum: number, s: any) => sum + Number(s.quantity), 0);
                            const totalStockAfter = currentTotal + diff;

                            await (tx as any).pharmacyMovement.create({
                                data: {
                                    medicationId: id,
                                    quantity: Math.abs(diff),
                                    movementType: diff > 0 ? 'IN' : 'OUT',
                                    reason: 'AJUSTE_INVENTARIO',
                                    referenceNumber: batch || existingStock.batchNumber,
                                    resultingStock: totalStockAfter,
                                    performedBy: 'ADMIN',
                                    unitPrice: diff > 0 ? (data.costPrice !== undefined ? Number(data.costPrice) : existingStock.unitPrice) : 0, // [NEW] Save cost to Movement
                                    notes: `Ajuste manual de stock de ${existingStock.quantity} a ${newStockValue}`
                                }
                            });
                        }

                        await (tx as any).pharmacyStock.update({
                            where: { id: existingStock.id },
                            data: {
                                quantity: newStockValue,
                                minStockLevel: Number(minStock) || existingStock.minStockLevel,
                                batchNumber: batch || existingStock.batchNumber,
                                expirationDate: (expiry && expiry !== '') ? new Date(expiry) : existingStock.expirationDate,
                                sellingPrice: data.price !== undefined ? Number(data.price) : existingStock.sellingPrice, // [FIXED]
                                unitPrice: data.costPrice !== undefined ? Number(data.costPrice) : existingStock.unitPrice // [FIXED]
                            }
                        });
                    } else {
                        // Create stock if it didn't exist
                        await (tx as any).pharmacyStock.create({
                            data: {
                                medicationId: id,
                                quantity: newStockValue,
                                minStockLevel: Number(minStock) || 10,
                                batchNumber: batch || `UPDATE-${Date.now()}`,
                                expirationDate: (expiry && expiry !== '') ? new Date(expiry) : undefined,
                                unitPrice: Number(data.costPrice) || 0,
                                sellingPrice: Number(data.price) || 0
                            }
                        });

                        if (newStockValue > 0) {
                            await (tx as any).pharmacyMovement.create({
                                data: {
                                    medicationId: id,
                                    quantity: newStockValue,
                                    movementType: 'IN',
                                    reason: 'INGRESO_POSTERIOR',
                                    referenceNumber: batch || `UPDATE-${Date.now()}`,
                                    resultingStock: newStockValue,
                                    performedBy: 'ADMIN',
                                    unitPrice: Number(data.costPrice) || 0, // [NEW] Save cost to Movement
                                    notes: `Primer registro de stock para medicamento existente`
                                }
                            });
                        }
                    }
                }

                return med;
            });
        } catch (error) {
            console.error('CRITICAL ERROR in updateMedication:', error);
            throw error;
        }
    }

    async deleteMedication(id: string) {
        return this.prisma.medication.update({
            where: { id },
            data: { isActive: false, deletedAt: new Date() },
        });
    }

    async getStock(query: any) {
        return this.prisma.pharmacyStock.findMany({
            include: {
                medication: true,
            },
        });
    }

    async updateStock(id: string, data: any) {
        return this.prisma.pharmacyStock.update({
            where: { id },
            data,
        });
    }

    async getLowStock() {
        return this.prisma.pharmacyStock.findMany({
            where: {
                quantity: { lt: 10 } // Simplified logic
            },
            include: { medication: true }
        });
    }

    async updateOrder(id: string, data: any) {
        return (this.prisma as any).pharmacyOrder.update({
            where: { id },
            data
        });
    }

    async approveOrder(id: string, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Get the order details
            const order = await (tx as any).pharmacyOrder.findUnique({
                where: { id },
                include: { medication: true }
            });

            if (!order) throw new Error('Pedido no encontrado');
            if (order.status === 'APROBADO') return order; // Already approved

            // 2. Find available stock for this medication
            // We use FIFO (expirationDate asc) to deduct from the nearest expiry batch
            const stock = await tx.pharmacyStock.findFirst({
                where: {
                    medicationId: order.medicationId,
                    quantity: { gt: 0 }
                },
                orderBy: { expirationDate: 'asc' }
            });

            if (!stock) throw new Error('No hay stock disponible para este medicamento');
            if (stock.quantity < order.quantity) {
                // [SENIOR] Partial deduction logic could be implemented here, 
                // but for now we follow the simple rule of sufficient stock in the batch.
                throw new Error(`Stock insuficiente en el lote disponible (${stock.quantity} < ${order.quantity})`);
            }

            // 3. Deduct stock
            await tx.pharmacyStock.update({
                where: { id: stock.id },
                data: { quantity: { decrement: order.quantity } }
            });

            // 3b. Calculate final total stock for Kardex
            const allStock = await (tx as any).pharmacyStock.findMany({
                where: { medicationId: order.medicationId }
            });
            const totalStockAfter = allStock.reduce((sum: number, s: any) => sum + Number(s.quantity), 0);

            // 4. Record movement in Kardex (Movement History)
            await (tx as any).pharmacyMovement.create({
                data: {
                    medicationId: order.medicationId,
                    quantity: Number(order.quantity),
                    movementType: 'OUT',
                    referenceNumber: order.orderNumber,
                    reason: 'DESPACHO_PEDIDO',
                    resultingStock: totalStockAfter, // [NEW] Precise tracking
                    notes: `Despacho automático de pedido ${order.orderNumber}`,
                    performedBy: 'Farmacia'
                }
            });

            // 5. Update order status
            return (tx as any).pharmacyOrder.update({
                where: { id },
                data: {
                    status: 'APROBADO',
                    approvedAt: new Date(),
                    approvedBy: 'Farmacéutico'
                }
            });
        });
    }

    async rejectOrder(id: string, reason: string) {
        return (this.prisma as any).pharmacyOrder.update({
            where: { id },
            data: {
                status: 'RECHAZADO',
                rejectedAt: new Date(),
                rejectedBy: 'Farmacéutico',
                rejectionReason: reason
            }
        });
    }

    /**
     * Reduce stock from medications in a paid invoice
     * Called by BillingService when invoice status changes to PAID
     */
    async reduceStockFromInvoice(invoiceId: string, items: any[]) {
        return this.prisma.$transaction(async (tx) => {
            for (const item of items) {
                // Check if this item is a medication by name matching
                const medication = await tx.medication.findFirst({
                    where: {
                        name: { contains: item.description },
                        isActive: true
                    }
                });

                if (!medication) continue; // Skip non-medication items

                // Find available stock (FIFO - nearest expiry first)
                const stock = await tx.pharmacyStock.findFirst({
                    where: {
                        medicationId: medication.id,
                        quantity: { gt: 0 }
                    },
                    orderBy: { expirationDate: 'asc' }
                });

                if (!stock || stock.quantity < item.quantity) {
                    console.warn(`⚠️ Stock insuficiente para ${medication.name} en factura ${invoiceId}`);
                    continue; // Don't fail the entire transaction, just skip
                }

                // Reduce stock
                await tx.pharmacyStock.update({
                    where: { id: stock.id },
                    data: { quantity: { decrement: item.quantity } }
                });

                // Calculate total stock after reduction
                const allStock = await (tx as any).pharmacyStock.findMany({
                    where: { medicationId: medication.id }
                });
                const totalStockAfter = allStock.reduce((sum: number, s: any) => sum + Number(s.quantity), 0);

                // Log to Kardex
                await (tx as any).pharmacyMovement.create({
                    data: {
                        medicationId: medication.id,
                        quantity: Number(item.quantity),
                        movementType: 'OUT',
                        referenceNumber: invoiceId,
                        reason: 'VENTA_FACTURA',
                        resultingStock: totalStockAfter,
                        notes: `Venta por factura ${invoiceId}: ${item.description}`,
                        performedBy: 'Sistema Facturación'
                    }
                });
            }

            return { success: true, message: 'Stock reducido correctamente' };
        });
    }
}
