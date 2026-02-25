import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from './financialUtils';

// Define the interface for the Invoice object to ensure type safety
interface InvoiceItem {
    description?: string;
    name?: string;
    quantity: number;
    unitPrice?: number;
    price?: number;
}

interface Invoice {
    id: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    createdAt?: string;
    dueDate?: string;
    patient?: {
        firstName: string;
        lastName: string;
        documentId?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    items?: InvoiceItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod?: string;
    operationNumber?: string;
    status: string;
    notes?: string;
}


import { getLogoBase64 } from './logoUtils';

// ... (interfaces remain the same)

export const generateInvoicePDF = async (invoice: Invoice, config?: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- COLORS ---
    const primaryColor = '#0f172a'; // Slate 900
    const accentColor = '#dc2626'; // Red 600
    const grayColor = '#64748b';   // Slate 500
    const lightGray = '#f1f5f9';   // Slate 100

    // --- HEADER ---
    // Try to load dynamic logo
    const logoBase64 = await getLogoBase64(config?.logo);

    if (logoBase64) {
        try {
            // Add logo (approx 20x20mm)
            doc.addImage(logoBase64, 'PNG', 15, 15, 20, 20);
        } catch (e) {
            console.error('Error adding logo to PDF:', e);
            // Fallback to placeholder if image fails
            drawLogoPlaceholder(doc, accentColor, config);
        }
    } else {
        // Fallback to placeholder
        drawLogoPlaceholder(doc, accentColor, config);
    }

    // Company Name (Adjusted X position if logo is present)
    const textStartX = 40; // Shifted right to accommodate logo


    // Company Name
    doc.setTextColor(primaryColor);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text((config?.hospitalName || 'EDICAREX CLINIC').toUpperCase(), textStartX, 21);

    // Company Subtitle
    doc.setTextColor(grayColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Servicios Médicos Especializados', textStartX, 26);
    doc.text(config?.address || 'Av. Principal 123, Lima, Perú', textStartX, 31);
    doc.text(`RUC: ${config?.billing?.taxId || '20601234567'} | Tel: ${config?.phone || '(01) 234-5678'}`, textStartX, 36);

    // Invoice Status Badge (Top Right)
    const statusText = invoice.status === 'PAID' ? 'PAGADO' : invoice.status === 'PENDING' ? 'PENDIENTE' : 'VENCIDO';
    const statusColor = invoice.status === 'PAID' ? '#16a34a' : invoice.status === 'PENDING' ? '#d97706' : '#dc2626';

    doc.setDrawColor(statusColor);
    doc.setFillColor(statusColor);
    doc.roundedRect(pageWidth - 50, 15, 35, 8, 1, 1, 'D');
    doc.setTextColor(statusColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, pageWidth - 45, 20.5);

    // --- INVOICE INFO (Right Side) ---
    doc.setTextColor(primaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA ELECTRÓNICA', pageWidth - 15, 35, { align: 'right' });

    doc.setTextColor(accentColor);
    doc.setFontSize(11);
    doc.text(`#${invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase()}`, pageWidth - 15, 41, { align: 'right' });

    doc.setTextColor(grayColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const displayDate = new Date(invoice.invoiceDate || invoice.createdAt || new Date());
    doc.text(`Fecha de Emisión: ${format(displayDate, 'dd/MM/yyyy')}`, pageWidth - 15, 47, { align: 'right' });
    if (invoice.dueDate) {
        doc.text(`Vencimiento: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy')}`, pageWidth - 15, 52, { align: 'right' });
    }

    // --- DIVIDER ---
    doc.setDrawColor('#e2e8f0');
    doc.line(15, 60, pageWidth - 15, 60);

    // --- CLIENT INFO ---
    doc.setFontSize(10);
    doc.setTextColor(grayColor);
    doc.text('Facturar a:', 15, 70);

    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    const clientName = invoice.patient ? `${invoice.patient.firstName} ${invoice.patient.lastName}` : 'Cliente General';
    doc.text(clientName, 15, 76);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor);
    doc.text(`DNI/RUC: ${invoice.patient?.documentId || '-'}`, 15, 81);
    if (invoice.patient?.address) doc.text(invoice.patient.address, 15, 86);
    if (invoice.patient?.email) doc.text(invoice.patient.email, 15, 91);

    // --- TABLE ---
    const tableColumn = ["Descripción", "Cant.", "Precio Unit.", "Total"];
    const tableRows: any[] = [];

    invoice.items?.forEach(item => {
        const itemData = [
            item.description || item.name || 'Item sin descripción',
            item.quantity,
            formatCurrency(item.unitPrice || item.price || 0, config),
            formatCurrency((item.quantity * (item.unitPrice || item.price || 0)), config)
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        startY: 100,
        head: [tableColumn],
        body: tableRows,
        theme: 'plain',
        headStyles: {
            fillColor: lightGray,
            textColor: grayColor,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: 4
        },
        bodyStyles: {
            textColor: primaryColor,
            cellPadding: 4,
            fontSize: 9
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
        },
        styles: {
            lineWidth: 0,
            lineColor: '#e2e8f0'
        },
        // Draw bottom border for each row
        didParseCell: function (data) {
            if (data.section === 'body' && data.row.index === data.table.body.length - 1) {
                // Last row style if needed
            }
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // --- TOTALS SECTION (Right Side) ---
    const rightMargin = pageWidth - 15;
    const labelX = rightMargin - 40;
    const valueX = rightMargin;

    let currentY = finalY;

    // Helper for totals
    const drawTotalRow = (label: string, value: string, isBold: boolean = false, isGaint: boolean = false) => {
        doc.setFontSize(isGaint ? 11 : 9);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(isGaint ? primaryColor : grayColor);
        doc.text(label, labelX, currentY, { align: 'right' });
        doc.setTextColor(isGaint ? accentColor : primaryColor);
        doc.text(value, valueX, currentY, { align: 'right' });
        currentY += isGaint ? 8 : 6;
    };

    drawTotalRow('Subtotal:', formatCurrency(invoice.subtotal, config));
    const taxRate = config?.billing?.taxRate || 18;
    drawTotalRow(`Impuesto (${taxRate}%):`, formatCurrency(invoice.tax, config));
    if (invoice.discount > 0) {
        drawTotalRow('Descuento:', `- ${formatCurrency(invoice.discount, config)}`);
    }

    // Total Line
    doc.setDrawColor('#e2e8f0');
    doc.line(labelX - 20, currentY - 2, rightMargin, currentY - 2);
    currentY += 4;

    drawTotalRow('TOTAL:', formatCurrency(invoice.total, config), true, true);

    // --- PAYMENT INFO (Bottom Left) ---
    let footerY = finalY + 10;
    if (footerY < pageHeight - 60) footerY = pageHeight - 60; // Push to bottom if space permits

    if (invoice.paymentMethod) {
        doc.setFillColor(lightGray);
        doc.roundedRect(15, footerY, 90, 30, 2, 2, 'F');

        doc.setFontSize(8);
        doc.setTextColor(grayColor);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN DE PAGO', 20, footerY + 8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(primaryColor);
        doc.text(`Método: ${invoice.paymentMethod}`, 20, footerY + 15);
        if (invoice.operationNumber) {
            doc.text(`Nro. Operación: ${invoice.operationNumber}`, 20, footerY + 20);
        }
        if (invoice.notes) {
            doc.setFontSize(7);
            doc.setTextColor(grayColor);
            doc.text(`Notas: ${invoice.notes}`, 20, footerY + 26, { maxWidth: 80 });
        }
    }

    // --- FOOTER ---
    doc.setFontSize(8);
    doc.setTextColor('#94a3b8');
    doc.text('Gracias por su preferencia.', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text('Este documento no tiene valor fiscal hasta ser canjeado por el comprobante oficial.', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Open Data URI in new window (most reliable for client-side)
    // doc.output('dataurlnewwindow');

    // OR Save directly
    doc.save(`Factura-${invoice.invoiceNumber || invoice.id.slice(0, 8)}.pdf`);
};

const drawLogoPlaceholder = (doc: any, color: string, config: any) => {
    doc.setFillColor(color);
    doc.roundedRect(15, 15, 12, 12, 2, 2, 'F');
    doc.setTextColor('#ffffff');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(config?.hospitalName?.charAt(0) || 'M', 18.5, 22.5);
};
