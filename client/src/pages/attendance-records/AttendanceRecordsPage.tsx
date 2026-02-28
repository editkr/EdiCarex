import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Receipt,
    Plus,
    Search,
    Loader2,
    DollarSign,
    Euro,
    Coins,
    Eye,
    Download,
    CreditCard,
    CheckCircle,
    Clock,
    XCircle,
    Pencil,
    Calendar,
    FileSpreadsheet,
    TrendingUp,
    Wallet,
    Building2,
    ArrowUpRight,
    Users,
    Shield,
} from 'lucide-react'
import { billingAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { format, isWithinInterval, parseISO, startOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import * as XLSX from 'xlsx'

import { UnifiedInvoiceModal } from '@/components/modals/UnifiedInvoiceModal'
import { InvoiceViewerModal } from '@/components/modals/InvoiceViewerModal'
import { formatCurrency, PAYMENT_METHODS, COMPANY_ACCOUNTS } from '@/utils/financialUtils'
import { generateInvoicePDF } from '@/utils/pdfGenerator'
import { usePermissions } from '@/hooks/usePermissions'
import { useOrganization } from '@/contexts/OrganizationContext'

export default function AttendanceRecordsPage() {
    const { config } = useOrganization()
    const [invoices, setInvoices] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)

    const { toast } = useToast()
    const { hasPermission } = usePermissions()

    // Modal State
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [showInvoiceModal, setShowInvoiceModal] = useState(false)
    const [showViewerModal, setShowViewerModal] = useState(false)

    // Filtros Avanzados
    const [filters, setFilters] = useState({
        status: 'all',
        paymentMethod: 'all',
        startDate: '',
        endDate: '',
        details: 'all' // all, bank, cash
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const invoicesRes = await billingAPI.getInvoices()
            setInvoices(invoicesRes.data?.data || [])
        } catch (error: any) {
            console.error('Error loading data:', error)
            toast({
                title: 'Error',
                description: 'Error al cargar datos de facturación',
                variant: 'destructive',
            })
            setInvoices([])
        } finally {
            setLoading(false)
        }
    }

    const handleViewInvoice = (invoice: any) => {
        setSelectedInvoice(invoice)
        setShowViewerModal(true)
    }

    const handleEditInvoice = (invoice: any) => {
        setSelectedInvoice(invoice)
        setShowInvoiceModal(true)
    }

    const handleDownloadInvoice = (invoice: any) => {
        try {
            generateInvoicePDF(invoice, config);
            toast({
                title: "PDF Generado",
                description: "La factura se ha descargado correctamente.",
            })
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({
                title: "Error",
                description: "No se pudo generar el PDF.",
                variant: "destructive"
            })
        }
    }

    const handleExportExcel = () => {
        const dataToExport = filteredInvoices.map(inv => ({
            'Fecha': format(new Date(inv.invoiceDate || inv.createdAt), 'dd/MM/yyyy HH:mm'),
            'Nro Factura': inv.invoiceNumber || inv.id.slice(0, 8),
            'Paciente': inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : 'General',
            'Estado': inv.status === 'PAID' ? 'PAGADO' : 'PENDIENTE',
            'Subtotal': formatCurrency(inv.subtotal, config),
            'Impuesto': formatCurrency(inv.tax, config),
            'Descuento': formatCurrency(inv.discount || 0, config),
            'Total': formatCurrency(inv.total, config),
            'Método Pago': inv.paymentMethod || 'N/A'
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Facturas");
        XLSX.writeFile(wb, `Reporte_Facturacion_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`);
    }

    // Filtrar facturas
    const filteredInvoices = useMemo(() => {
        return invoices.filter((invoice: any) => {
            const invoiceDate = new Date(invoice.invoiceDate || invoice.createdAt);

            const searchMatch = searchTerm === '' ||
                (invoice.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (invoice.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()))

            const statusMatch = filters.status === 'all' || invoice.status === filters.status

            const paymentMatch = filters.paymentMethod === 'all' ||
                (invoice.paymentMethod === filters.paymentMethod);

            const dateMatch = (!filters.startDate || invoiceDate >= new Date(filters.startDate)) &&
                (!filters.endDate || invoiceDate <= new Date(filters.endDate));

            return searchMatch && statusMatch && paymentMatch && dateMatch
        })
    }, [invoices, searchTerm, filters])

    // Estadísticas
    const stats = useMemo(() => {
        const total = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
        const paid = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + Number(inv.total || 0), 0)
        const pending = invoices.filter(inv => inv.status === 'PENDING').reduce((sum, inv) => sum + Number(inv.total || 0), 0)
        const overdue = invoices.filter(inv => inv.status === 'OVERDUE').reduce((sum, inv) => sum + Number(inv.total || 0), 0)

        // Advanced Breakdown
        const cashIncome = invoices
            .filter(inv => inv.status === 'PAID' && inv.paymentMethod === PAYMENT_METHODS.CASH)
            .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

        const bankIncome = invoices
            .filter(inv => inv.status === 'PAID' && inv.paymentMethod?.includes('Transferencia'))
            .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

        return { total, paid, pending, overdue, cashIncome, bankIncome }
    }, [invoices])

    // Chart Data Preparation
    const chartData = useMemo(() => {
        // Create an array of last 6 months
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthStart = startOfMonth(date);
            const monthLabel = format(date, 'MMM', { locale: es });

            const monthlyTotal = invoices.filter(inv => {
                const invDate = new Date(inv.invoiceDate || inv.createdAt);
                return inv.status === 'PAID' &&
                    invDate.getMonth() === date.getMonth() &&
                    invDate.getFullYear() === date.getFullYear();
            }).reduce((sum, inv) => sum + Number(inv.total || 0), 0);

            data.push({ name: monthLabel, total: monthlyTotal });
        }
        return data;
    }, [invoices]);

    const getStatusText = (status: string) => {
        const texts: Record<string, string> = {
            PAID: 'PAGADO',
            PENDING: 'PENDIENTE',
            OVERDUE: 'VENCIDO',
            CANCELLED: 'CANCELADO',
        }
        return texts[status] || status
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PAID':
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'PENDING':
                return <Clock className="h-4 w-4 text-yellow-600" />
            case 'OVERDUE':
                return <XCircle className="h-4 w-4 text-red-600" />
            default:
                return <Clock className="h-4 w-4 text-gray-600" />
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic px-1">Atenciones <span className="text-primary">&</span> SIS</h1>
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest pl-1">
                            Sistema de Registro y Formato Único de Atención (FUA)
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {hasPermission('REPORTS_EXPORT') && (
                        <Button
                            onClick={handleExportExcel}
                            variant="outline"
                            className="bg-card border-border hover:bg-accent text-primary font-bold uppercase text-xs"
                        >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Exportar Registros
                        </Button>
                    )}
                    {hasPermission('BILLING_CREATE') && (
                        <Button
                            onClick={() => {
                                setSelectedInvoice(null)
                                setShowInvoiceModal(true)
                            }}
                            className="bg-primary hover:opacity-90 text-white shadow-lg shadow-primary/20 font-bold uppercase text-xs"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Atención / FUA
                        </Button>
                    )}
                </div>
            </div>

            {/* Health Center Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-border border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase text-blue-500 tracking-wider">Atenciones Totales</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-foreground">{invoices.length}</div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1 flex items-center gap-1">
                            Total de expedientes generados
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-green-500 tracking-wider">Atenciones SIS</CardTitle>
                        <Shield className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {invoices.filter(i => i.paymentMethod?.includes('SIS')).length}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">
                            Seguro Integral de Salud
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border border-l-4 border-l-cyan-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-cyan-500 tracking-wider">Convenios/Otros</CardTitle>
                        <Building2 className="h-4 w-4 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {invoices.filter(i => !i.paymentMethod?.includes('SIS') && i.paymentMethod !== 'CASH').length}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">
                            Entidades y Programas
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-orange-500 tracking-wider">Recaudación (Caja)</CardTitle>
                        <Wallet className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.cashIncome, config)}</div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">
                            Pagos por servicios directos
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Advanced Charts Section */}
                <Card className="lg:col-span-2 bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase text-foreground tracking-widest">Afluencia de Atenciones</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">Volumen de atenciones registradas últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--primary)' }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" name="Atenciones" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Filters Section */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase text-foreground tracking-widest">Búsqueda de Atenciones</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">Filtre por paciente o tipo de seguro</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground font-bold uppercase">Paciente / Nro FUA</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Nombre o Nro FUA..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 bg-background border-border focus:ring-primary h-9"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground font-bold uppercase">Inicio</label>
                                <Input type="date" className="bg-background border-border h-9 text-xs" onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground font-bold uppercase">Fin</label>
                                <Input type="date" className="bg-background border-border h-9 text-xs" onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground font-bold uppercase">Estado Clínica</label>
                            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                                <SelectTrigger className="w-full bg-background border-border h-9">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="PAID">Atendidas</SelectItem>
                                    <SelectItem value="PENDING">En Proceso</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices Table */}
            <Card className="bg-card border-border overflow-hidden shadow-sm">
                <CardHeader className="bg-muted/30">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-sm font-bold uppercase text-foreground tracking-widest">Registros de Atenciones Recientes</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">Historial consolidado de atenciones y financiamiento</CardDescription>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Mostrando {filteredInvoices.length} expedientes
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50 border-b border-border">
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest pl-6">FUA / Nro Registro</TableHead>
                                <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Paciente</TableHead>
                                <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Fecha Atención</TableHead>
                                <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest text-right">Recaudado</TableHead>
                                <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest text-center">Estado Clínica</TableHead>
                                <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Financiamiento (Seguro)</TableHead>
                                <TableHead className="text-right text-muted-foreground uppercase text-[10px] font-bold tracking-widest pr-6">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Search className="h-8 w-8 opacity-20" />
                                            <p className="text-xs font-medium">No se encontraron registros de atención</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInvoices.map((invoice: any) => (
                                    <TableRow key={invoice.id} className="border-border hover:bg-muted/40 transition-colors">
                                        <TableCell className="font-mono text-xs font-bold text-foreground pl-6">
                                            {(invoice.invoiceNumber || invoice.id.slice(0, 8)).toUpperCase()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground">
                                                    {invoice.patient ? `${invoice.patient.firstName} ${invoice.patient.lastName}` : 'Paciente No Registrado'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                    DNI: {invoice.patient?.documentId || 'SIN DATO'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs">
                                                <span className="text-foreground font-medium">{format(new Date(invoice.invoiceDate || invoice.createdAt || new Date()), 'dd MMM yyyy', { locale: es })}</span>
                                                <span className="text-muted-foreground text-[10px]">{format(new Date(invoice.invoiceDate || invoice.createdAt || new Date()), 'HH:mm', { locale: es })}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-primary">
                                            {formatCurrency(invoice.total, config)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {(() => {
                                                const isOverdue = invoice.status === 'PENDING' && invoice.dueDate && new Date(invoice.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
                                                const displayStatus = isOverdue ? 'OVERDUE' : invoice.status;
                                                return (
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${displayStatus === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        displayStatus === 'PENDING' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                            displayStatus === 'OVERDUE' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                                'bg-slate-100 text-slate-500 border-slate-200'
                                                        }`}>
                                                        {getStatusIcon(displayStatus)}
                                                        {displayStatus === 'PAID' ? 'Atendida' : 'Pendiente'}
                                                    </div>
                                                )
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                                                    <Shield className="h-3 w-3 text-primary opacity-70" />
                                                    {invoice.paymentMethod || 'Particular'}
                                                </div>
                                                {invoice.operationNumber && (
                                                    <span className="text-[9px] font-mono text-muted-foreground pl-5 uppercase">Ref: {invoice.operationNumber}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors border border-transparent"
                                                    onClick={() => handleViewInvoice(invoice)}
                                                    title="Ver FUA"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors border border-transparent"
                                                    onClick={() => handleDownloadInvoice(invoice)}
                                                    title="Imprimir FUA"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Unified Invoice Modal */}
            <UnifiedInvoiceModal
                open={showInvoiceModal}
                onOpenChange={setShowInvoiceModal}
                invoice={selectedInvoice}
                onSuccess={loadData}
            />

            {/* Invoice Viewer Modal */}
            <InvoiceViewerModal
                open={showViewerModal}
                onOpenChange={setShowViewerModal}
                invoice={selectedInvoice}
            />
        </div>
    )
}