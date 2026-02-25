import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from './financialUtils';

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Data') => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};


import { getLogoBase64 } from './logoUtils';

export const exportHRAttendanceToPDF = async (attendance: any[], config?: any) => {
    const doc = new jsPDF() as any;

    try {
        const logoBase64 = await getLogoBase64(config?.logo);
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 14, 10, 15, 15);
        }
    } catch (e) {
        console.error('Error adding logo', e);
    }

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text(`REPORTE DE ASISTENCIA - ${(config?.hospitalName || 'EDICAREX').toUpperCase()}`, 32, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${format(new Date(), 'PPP', { locale: es })}`, 32, 30);

    const tableData = attendance.map(a => [
        a.employee?.name || '---',
        format(new Date(a.checkIn), 'dd/MM/yyyy'),
        format(new Date(a.checkIn), 'HH:mm:ss'),
        a.checkOut ? format(new Date(a.checkOut), 'HH:mm:ss') : '---',
        (a.hoursWorked || 0).toFixed(2),
        a.status
    ]);

    doc.autoTable({
        head: [['Empleado', 'Fecha', 'Entrada', 'Salida', 'Hrs', 'Estado']],
        body: tableData,
        startY: 40,
        theme: 'grid',
        headStyles: { fillStyle: [59, 130, 246] }, // Blue primary
        styles: { fontSize: 8 }
    });

    doc.save(`Asistencia_EdiCarex_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportPayrollToPDF = async (payroll: any[], config?: any) => {
    const doc = new jsPDF() as any;

    try {
        const logoBase64 = await getLogoBase64(config?.logo);
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 14, 10, 15, 15);
        }
    } catch (e) {
        console.error('Error adding logo', e);
    }

    doc.setFontSize(22);
    doc.text(`REPORTE DE NÓMINA - ${(config?.hospitalName || 'EDICAREX').toUpperCase()}`, 32, 22);

    const tableData = payroll.map(p => [
        p.employee?.name || '---',
        formatCurrency(p.baseSalary, config),
        formatCurrency(p.deductions, config),
        formatCurrency(p.bonuses, config),
        formatCurrency(p.netSalary, config),
        p.status === 'PAID' ? 'PAGADO' : 'PENDIENTE'
    ]);

    doc.autoTable({
        head: [['Empleado', 'Básico', 'Dctos', 'Bonos', 'Neto', 'Estado']],
        body: tableData,
        startY: 40,
        theme: 'striped',
        headStyles: { fillStyle: [16, 185, 129] } // Green
    });

    doc.save(`Nomina_EdiCarex_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
