import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import {
    Loader2,
    FileDown,
    Eye,
    ShieldAlert,
    User,
    Calendar,
    Filter,
    Activity,
    Search,
    History,
    ShieldCheck,
    Database,
    Lock,
    ArrowUpRight,
    TrendingUp,
    PieChart as PieChartIcon,
    Terminal,
    RotateCcw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AuditLog {
    id: string;
    action: string;
    resource: string;
    resourceId?: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: { name: string };
    };
}

const RESOURCE_LABELS: Record<string, string> = {
    'patients': 'PACIENTES',
    'appointments': 'CITAS',
    'laboratory': 'LABORATORIO',
    'auth': 'SEGURIDAD',
    'pharmacy-orders': 'FARMACIA',
    'emergency': 'EMERGENCIAS',
    'doctors': 'PERSONAL DE SALUD',
    'users': 'USUARIOS'
};

const FIELD_LABELS: Record<string, string> = {
    'notes': 'Notas/Observaciones',
    'status': 'Estado',
    'testId': 'ID de Prueba',
    'staffId': 'ID de Personal',
    'doctorId': 'ID de Personal',
    'priority': 'Prioridad',
    'orderDate': 'Fecha de Orden',
    'patientId': 'ID de Paciente',
    'reason': 'Motivo',
    'type': 'Tipo',
    'appointmentDate': 'Fecha de Cita',
    'startTime': 'Hora de Inicio',
    'email': 'Correo Electrónico',
    'firstName': 'Nombre',
    'lastName': 'Apellido',
    'roleId': 'ID de Rol',
    'method': 'Método HTTP',
    'query': 'Parámetros de Consulta',
    'body': 'Datos Enviados'
};

const VALUE_LABELS: Record<string, string> = {
    'PENDING': 'Pendiente',
    'COMPLETED': 'Completado',
    'CANCELLED': 'Cancelado',
    'SCHEDULED': 'Programado',
    'CONFIRMED': 'Confirmado',
    'IN_PROGRESS': 'En Progreso',
    'NO_SHOW': 'No Asistió',
    'CHECKUP': 'Chequeo',
    'FOLLOW_UP': 'Seguimiento',
    'EMERGENCY': 'Emergencia',
    'CONSULTATION': 'Consulta',
    'SURGERY': 'Cirugía',
    'NORMAL': 'Normal',
    'URGENT': 'Urgente',
    'STAT': 'Inmediato',
    'APPROVED': 'Aprobado',
    'REJECTED': 'Rechazado',
    'DISPENSED': 'Dispensado'
};

export default function AuditLogsPage() {
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState<string>('TODAS');
    const [resourceFilter, setResourceFilter] = useState<string>('TODAS');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showRawData, setShowRawData] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data, isLoading } = useQuery({
        queryKey: ['audit-logs', page, actionFilter, resourceFilter, debouncedSearch],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '50'); // Aumentamos para el reporte PDF
            if (actionFilter && actionFilter !== 'TODAS') params.append('action', actionFilter);
            if (resourceFilter && resourceFilter !== 'TODAS') params.append('resource', resourceFilter);
            if (debouncedSearch) params.append('query', debouncedSearch);

            const response = await api.get(`/audit?${params.toString()}`);
            return response.data;
        },
    });

    const { data: stats } = useQuery({
        queryKey: ['audit-stats'],
        queryFn: async () => {
            const response = await api.get('/audit/stats');
            return response.data;
        },
        refetchInterval: 30000
    });

    const exportToPDF = () => {
        if (!data?.data) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const dateStr = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });

        // Header Corporativo
        doc.setFillColor(79, 70, 229); // Color Primario MediSync
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('MediSync', 15, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistema de Gestión Médica Integral', 15, 28);

        doc.setFontSize(14);
        doc.text('REPORTE OFICIAL DE AUDITORÍA', pageWidth - 15, 20, { align: 'right' });
        doc.setFontSize(10);
        doc.text(`Generado: ${dateStr}`, pageWidth - 15, 28, { align: 'right' });

        // Resumen de Estadísticas
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN DE ACTIVIDAD', 15, 52);

        doc.setDrawColor(200, 200, 200);
        doc.line(15, 54, pageWidth - 15, 54);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total de Logs (Hoy): ${stats?.logsToday || 0}`, 20, 62);
        doc.text(`Usuarios Activos: ${stats?.activeUsersToday || 0}`, 80, 62);
        doc.text(`Filtros Aplicados: ${actionFilter} / ${resourceFilter}`, 140, 62);

        // Tabla de Auditoría
        const tableData = data.data.map((log: AuditLog) => [
            format(new Date(log.createdAt), "dd/MM/yyyy HH:mm"),
            `${log.user.firstName} ${log.user.lastName}\n(${log.user.role.name})`,
            log.action,
            RESOURCE_LABELS[log.resource.toLowerCase()] || log.resource.toUpperCase(),
            log.ipAddress || 'Interna'
        ]);

        autoTable(doc, {
            startY: 70,
            head: [['FECHA', 'OPERADOR', 'ACCIÓN', 'RECURSO', 'IP ORIGEN']],
            body: tableData,
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            margin: { left: 15, right: 15 },
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY || 70;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Este documento es un registro oficial generado por el sistema de seguridad de MediSync.', 15, finalY + 10);
        doc.text('Confidencial - Solo para uso administrativo.', 15, finalY + 15);

        doc.save(`MediSync_Audit_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    };

    const getActionBadge = (action: string) => {
        if (action.includes('DELETE')) return <Badge variant="destructive" className="flex items-center gap-1.5"><ShieldAlert className="h-3 w-3" /> ELIMINAR</Badge>;
        if (action.includes('CREATE')) return <Badge variant="success" className="flex items-center gap-1.5"><Database className="h-3 w-3" /> CREAR</Badge>;
        if (action.includes('UPDATE')) return <Badge variant="warning" className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> ACTUALIZAR</Badge>;
        if (action.includes('LOGIN')) return <Badge variant="info" className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> ACCESO</Badge>;
        if (action.includes('APPROVE')) return <Badge variant="success" className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> APROBAR</Badge>;
        return <Badge variant="secondary" className="flex items-center gap-1.5"><Eye className="h-3 w-3" /> VER</Badge>;
    };

    const getResourceBadge = (resource: string) => {
        const label = RESOURCE_LABELS[resource.toLowerCase()] || resource.toUpperCase();
        return (
            <Badge variant="outline" className="text-[10px] font-bold tracking-tighter bg-muted/20 border-2">
                {label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6 p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Section - Volviendo al diseño sólido original */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Registro de Auditoría
                        </h1>
                        <p className="text-muted-foreground mt-0.5 flex items-center gap-2">
                            Monitoreo de seguridad y trazabilidad profesional.
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={exportToPDF} className="shadow-sm border-2">
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar Reporte (PDF)
                </Button>
            </div>

            {/* Stats Section - Diseños sólidos sin transparencias extrañas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-t-4 border-t-indigo-500 shadow-sm bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Actividad Hoy</CardTitle>
                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.logsToday ?? '0'}</div>
                        <div className="h-[40px] mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.historicalTrends || []}>
                                    <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f122" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-emerald-500 shadow-sm bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Usuarios Activos</CardTitle>
                        <User className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.activeUsersToday ?? '0'}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Sesiones concurrentes
                        </p>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-t-4 border-t-primary shadow-sm bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Distribución por Recurso</CardTitle>
                        <Database className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={(stats?.byResource || []).map((r: any) => ({
                                    ...r,
                                    name: RESOURCE_LABELS[r.name.toLowerCase()] || r.name.toUpperCase()
                                }))}
                                margin={{ bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }}
                                    interval={0}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderRadius: '8px',
                                        border: '2px solid hsl(var(--border))',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Main Registry - Diseño original sólido */}
            <Card className="border-t-4 border-t-primary shadow-lg overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar en historial (Usuario, Acción, IP...)"
                                className="pl-10 bg-background border-2"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger className="w-[160px] border-2 font-semibold">
                                    <SelectValue placeholder="Acción" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODAS">Todas las Acciones</SelectItem>
                                    <SelectItem value="LOGIN">Inicio de Sesión</SelectItem>
                                    <SelectItem value="CREATE_PATIENT">Crear Paciente</SelectItem>
                                    <SelectItem value="CREATE_APPOINTMENT">Crear Cita</SelectItem>
                                    <SelectItem value="UPDATE_APPOINTMENT_STATUS">Estado Cita</SelectItem>
                                    <SelectItem value="CREATE_LAB_ORDER">Orden Laboratorio</SelectItem>
                                    <SelectItem value="CREATE_EMERGENCY_CASE">Ingreso Emergencia</SelectItem>
                                    <SelectItem value="APPROVE_PHARMACY_ORDER">Aprobar Receta</SelectItem>
                                    <SelectItem value="CREATE_DOCTOR">Registrar Personal</SelectItem>
                                    <SelectItem value="CREATE_USER">Crear Usuario</SelectItem>
                                    <SelectItem value="ADD_CLINICAL_NOTE">Nota Clínica</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={resourceFilter} onValueChange={setResourceFilter}>
                                <SelectTrigger className="w-[160px] border-2 font-semibold">
                                    <SelectValue placeholder="Recurso" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODAS">Todos los Recursos</SelectItem>
                                    <SelectItem value="patients">Pacientes</SelectItem>
                                    <SelectItem value="appointments">Citas</SelectItem>
                                    <SelectItem value="laboratory">Laboratorio</SelectItem>
                                    <SelectItem value="pharmacy-orders">Farmacia</SelectItem>
                                    <SelectItem value="emergency">Emergencias</SelectItem>
                                    <SelectItem value="doctors">Personal de Salud</SelectItem>
                                    <SelectItem value="users">Usuarios</SelectItem>
                                    <SelectItem value="auth">Seguridad</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                className="border-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                                title="Limpiar Filtros"
                                onClick={() => {
                                    setActionFilter('TODAS');
                                    setResourceFilter('TODAS');
                                    setSearchTerm('');
                                    setDebouncedSearch('');
                                    setPage(1);
                                }}
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="w-[180px] font-bold pl-6">TIMESTAMP</TableHead>
                                <TableHead className="font-bold">OPERADOR</TableHead>
                                <TableHead className="font-bold">ACCIÓN</TableHead>
                                <TableHead className="font-bold">RECURSO</TableHead>
                                <TableHead className="font-bold">IP ORIGEN</TableHead>
                                <TableHead className="text-right pr-6 font-bold">DETALLE</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                <p className="text-sm font-medium">Cargando registros reales...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data?.data?.map((log: AuditLog, index: number) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="hover:bg-muted/30 transition-colors border-b last:border-0"
                                        >
                                            <TableCell className="pl-6 font-mono text-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground">{format(new Date(log.createdAt), "dd/MM/yyyy")}</span>
                                                    <span className="text-muted-foreground">{format(new Date(log.createdAt), "HH:mm:ss")}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20">
                                                        {log.user.firstName.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold">{log.user.firstName} {log.user.lastName}</span>
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{log.user.role.name}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getActionBadge(log.action)}</TableCell>
                                            <TableCell>{getResourceBadge(log.resource)}</TableCell>
                                            <TableCell className="text-xs font-mono text-muted-foreground">
                                                {log.ipAddress || 'Interna'}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setSelectedLog(log)}
                                                    className="h-8 group"
                                                >
                                                    <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                                                    Detalle
                                                </Button>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>

                    <div className="p-4 border-t flex items-center justify-between bg-muted/20">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Mostrando {data?.data?.length || 0} de {data?.meta?.total || 0} registros
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="border-2 font-bold px-4"
                            >
                                ANTERIOR
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                disabled={!data?.meta || page >= data.meta.lastPage}
                                onClick={() => setPage(p => p + 1)}
                                className="font-bold px-4 shadow-md bg-primary"
                            >
                                SIGUIENTE
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detail Modal - Diseño Sólido */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-4xl bg-card border-2 shadow-2xl p-0 overflow-hidden">
                    <div className="bg-primary p-6 border-b text-primary-foreground">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <Terminal className="h-6 w-6" />
                                <DialogTitle className="text-2xl font-bold tracking-tight">
                                    INSPECCIÓN DE REGISTRO
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-primary-foreground/80 font-medium">
                                Análisis técnico detallado del identificador: {selectedLog?.id}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6">
                        {selectedLog && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-3 border-2 rounded-lg bg-muted/30">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase mb-1 block">Operador</label>
                                        <div className="text-sm font-bold">{selectedLog.user.firstName} {selectedLog.user.lastName}</div>
                                    </div>
                                    <div className="p-3 border-2 rounded-lg bg-muted/30">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase mb-1 block">Acción Principal</label>
                                        <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                                    </div>
                                    <div className="p-3 border-2 rounded-lg bg-muted/30">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase mb-1 block">ID Recurso</label>
                                        <div className="text-xs font-mono font-bold truncate">{selectedLog.resourceId || 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                                            {showRawData ? 'Carga de Datos (Vista Técnica JSON)' : 'Detalle de la Operación (Vista Administrativa)'}
                                        </label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-[10px] font-bold uppercase tracking-tighter"
                                            onClick={() => setShowRawData(!showRawData)}
                                        >
                                            {showRawData ? 'Ver Vista Amigable' : 'Ver Código Raw'}
                                        </Button>
                                    </div>

                                    <div className="rounded-lg border-2 shadow-inner overflow-hidden">
                                        {showRawData ? (
                                            <div className="bg-slate-900 p-4">
                                                <pre className="text-[11px] font-mono text-emerald-400 overflow-auto max-h-[300px]">
                                                    {JSON.stringify(selectedLog.changes, null, 2)}
                                                </pre>
                                            </div>
                                        ) : (
                                            <div className="bg-background">
                                                <Table>
                                                    <TableBody>
                                                        {Object.entries(selectedLog.changes?.body || selectedLog.changes || {}).map(([key, value]) => (
                                                            <TableRow key={key} className="hover:bg-transparent border-b last:border-0">
                                                                <TableCell className="py-2 font-bold text-xs bg-muted/20 w-1/3 border-r">
                                                                    {FIELD_LABELS[key] || key}
                                                                </TableCell>
                                                                <TableCell className="py-2 text-xs font-medium text-foreground">
                                                                    {(() => {
                                                                        if (value === null || value === undefined) return <span className="text-muted-foreground">Vacío</span>;
                                                                        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                                                                            return format(new Date(value), "dd/MM/yyyy HH:mm:ss");
                                                                        }
                                                                        const stringValue = String(value);
                                                                        return VALUE_LABELS[stringValue] || stringValue;
                                                                    })()}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {selectedLog.changes?.method && (
                                                            <TableRow className="hover:bg-transparent border-b last:border-0 border-t-2">
                                                                <TableCell className="py-2 font-bold text-[10px] text-muted-foreground bg-muted/10 w-1/3 border-r italic">
                                                                    Protocolo Sistema
                                                                </TableCell>
                                                                <TableCell className="py-2 text-[10px] font-mono text-muted-foreground">
                                                                    {selectedLog.changes.method} {JSON.stringify(selectedLog.changes.query)}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row justify-between gap-4 text-[10px] font-bold text-muted-foreground uppercase border-t pt-4">
                                    <div><span className="text-foreground">Cliente:</span> {selectedLog.userAgent?.slice(0, 100) || 'Agente Desconocido'}...</div>
                                    <div><span className="text-foreground">IP:</span> {selectedLog.ipAddress || 'Interna'}</div>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
