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
    ArrowUpRight
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

export default function BillingPage() {
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
                    <div className="h-12 w-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Facturación <span className="text-emerald-500">Pro</span></h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                            Gestión Financiera Corporativa
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {hasPermission('REPORTS_EXPORT') && (
                        <Button
                            onClick={handleExportExcel}
                            variant="outline"
                            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-green-500 font-bold uppercase text-xs"
                        >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Exportar Excel
                        </Button>
                    )}
                    {hasPermission('BILLING_CREATE') && (
                        <Button
                            onClick={() => {
                                setSelectedInvoice(null)
                                setShowInvoiceModal(true)
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 font-bold uppercase text-xs border border-emerald-500"
                        >
                            <Receipt className="h-4 w-4 mr-2" />
                            Nueva Factura
                        </Button>
                    )}
                </div>
            </div>

            {/* Senior Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase text-emerald-500 tracking-wider">Ingreso Neto (Mes)</CardTitle>
                        {config?.billing?.currency === 'EUR' ? (
                            <Euro className="h-4 w-4 text-emerald-500" />
                        ) : config?.billing?.currency === 'PEN' ? (
                            <Coins className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-white">{formatCurrency(stats.paid, config)}</div>
                        <p className="text-[10px] text-zinc-500 font-medium uppercase mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +12.5% vs mes anterior
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Flujo de Caja (Efectivo)</CardTitle>
                        <Wallet className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{formatCurrency(stats.cashIncome, config)}</div>
                        <p className="text-[10px] text-zinc-500 font-medium uppercase mt-1">
                            Disponible en Caja Chica
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Bancos (Transferencias)</CardTitle>
                        <Building2 className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{formatCurrency(stats.bankIncome, config)}</div>
                        <p className="text-[10px] text-zinc-500 font-medium uppercase mt-1">
                            BCP, BBVA, Interbank
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-red-900/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-red-500 tracking-wider">Pendiente de Pago</CardTitle>
                        <Clock className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-400">{formatCurrency(stats.pending + stats.overdue, config)}</div>
                        <p className="text-[10px] text-zinc-500 font-medium uppercase mt-1">
                            {stats.overdue > 0 ? `${formatCurrency(stats.overdue, config)} Vencido` : 'Facturación vigente'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Advanced Charts Section */}
                <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase text-white tracking-widest">Tendencia de Facturación</CardTitle>
                        <CardDescription className="text-xs text-zinc-500">Comportamiento de ingresos últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value, config)} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#10b981' }}
                                    formatter={(value: number) => [formatCurrency(value, config), 'Ingresos']}
                                />
                                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Filters Section */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase text-white tracking-widest">Filtros Avanzados</CardTitle>
                        <CardDescription className="text-xs text-zinc-500">Segmentación de reportes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-bold uppercase">Búsqueda</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                                <Input
                                    placeholder="Paciente, # Factura..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 bg-zinc-950 border-zinc-800 focus:ring-emerald-500 h-9 text-white"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <label className="text-xs text-zinc-500 font-bold uppercase">Desde</label>
                                <Input type="date" className="bg-zinc-950 border-zinc-800 h-9 text-xs text-white" onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-zinc-500 font-bold uppercase">Hasta</label>
                                <Input type="date" className="bg-zinc-950 border-zinc-800 h-9 text-xs text-white" onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-bold uppercase">Estado Pago</label>
                            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                                <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 h-9 text-zinc-300">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="PAID">Pagados</SelectItem>
                                    <SelectItem value="PENDING">Pendientes</SelectItem>
                                    <SelectItem value="OVERDUE">Vencidos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-bold uppercase">Método Pago</label>
                            <Select value={filters.paymentMethod} onValueChange={(v) => setFilters({ ...filters, paymentMethod: v })}>
                                <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 h-9 text-zinc-300">
                                    <SelectValue placeholder="Método" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                    <SelectItem value="all">Todos</SelectItem>
                                    {Object.values(PAYMENT_METHODS).map(method => (
                                        <SelectItem key={method} value={method}>{method}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices Table */}
            <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-sm font-bold uppercase text-white tracking-widest">Movimientos Registrados</CardTitle>
                            <CardDescription className="text-xs text-zinc-500">Últimas transacciones del sistema</CardDescription>
                        </div>
                        <div className="text-xs text-zinc-500">
                            Mostrando {filteredInvoices.length} registros
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-950 border-b border-zinc-800">
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                <TableHead className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest pl-6">Factura</TableHead>
                                <TableHead className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest">Paciente</TableHead>
                                <TableHead className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest">Fecha & Venc.</TableHead>
                                <TableHead className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest text-right">Monto</TableHead>
                                <TableHead className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest text-center">Estado</TableHead>
                                <TableHead className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest">Detalle Pago</TableHead>
                                <TableHead className="text-right text-zinc-500 uppercase text-[10px] font-bold tracking-widest pr-6">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40 text-center text-zinc-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Search className="h-8 w-8 opacity-20" />
                                            <p className="text-xs font-medium">No se encontraron registros</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInvoices.map((invoice: any) => (
                                    <TableRow key={invoice.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                        <TableCell className="font-mono text-xs font-bold text-white pl-6">
                                            {invoice.invoiceNumber || invoice.id.slice(0, 8)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-zinc-200">
                                                    {invoice.patient ? `${invoice.patient.firstName} ${invoice.patient.lastName}` : 'Cliente General'}
                                                </span>
                                                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                                                    {invoice.patient?.documentId || 'S/D'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs">
                                                <span className="text-zinc-400">{format(new Date(invoice.invoiceDate || invoice.createdAt || new Date()), 'dd MMM yyyy', { locale: es })}</span>
                                                {invoice.dueDate && (
                                                    <span className="text-zinc-600 text-[10px]">Vence: {format(new Date(invoice.dueDate), 'dd/MM', { locale: es })}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-emerald-400">
                                            {formatCurrency(invoice.total, config)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {(() => {
                                                const isOverdue = invoice.status === 'PENDING' && invoice.dueDate && new Date(invoice.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
                                                const displayStatus = isOverdue ? 'OVERDUE' : invoice.status;
                                                return (
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${displayStatus === 'PAID' ? 'bg-emerald-900/20 text-emerald-500 border-emerald-900/50' :
                                                        displayStatus === 'PENDING' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-900/50' :
                                                            displayStatus === 'OVERDUE' ? 'bg-red-900/20 text-red-500 border-red-900/50' :
                                                                'bg-zinc-800 text-zinc-500 border-zinc-700'
                                                        }`}>
                                                        {getStatusIcon(displayStatus)}
                                                        {getStatusText(displayStatus)}
                                                    </div>
                                                )
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                    <CreditCard className="h-3 w-3 opacity-50" />
                                                    {invoice.paymentMethod || 'Pendiente'}
                                                </div>
                                                {invoice.operationNumber && (
                                                    <span className="text-[9px] font-mono text-zinc-600 pl-5">Ref: {invoice.operationNumber}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors border border-transparent hover:border-zinc-700"
                                                    onClick={() => handleViewInvoice(invoice)}
                                                    title="Visualizar"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {hasPermission('BILLING_EDIT') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors border border-transparent hover:border-zinc-700"
                                                        onClick={() => handleEditInvoice(invoice)}
                                                        title="Editar"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors border border-transparent hover:border-zinc-700"
                                                    onClick={() => handleDownloadInvoice(invoice)}
                                                    title="Descargar PDF"
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