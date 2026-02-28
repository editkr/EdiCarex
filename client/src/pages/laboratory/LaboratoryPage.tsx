import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    FlaskConical,
    Plus,
    Search,
    Loader2,
    Upload,
    FileText,
    Eye,
    Clock,
    TrendingUp,
    BarChart3,
    Calendar,
    CheckCircle,
    AlertCircle,
    XCircle,
    Filter,
    ArrowUpRight,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { patientsAPI, healthStaffAPI, laboratoryAPI } from '@/services/api'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useToast } from '@/components/ui/use-toast'
import ResultEntryForm from './components/ResultEntryForm'
import LabOrderModal from '@/components/modals/LabOrderModal'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from "@/lib/utils"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { usePermissions } from '@/hooks/usePermissions'

const statusMap: Record<string, string> = {
    'PENDIENTE': 'PENDIENTE',
    'EN_PROCESO': 'EN PROCESO',
    'COMPLETADO': 'COMPLETADO',
    'CANCELADO': 'CANCELADO',
    'PENDING': 'PENDIENTE',
    'IN_PROGRESS': 'EN PROCESO',
    'COMPLETED': 'COMPLETADO',
    'CANCELLED': 'CANCELADO'
}

export default function LaboratoryPage() {
    const { hasPermission } = usePermissions()
    const [orders, setOrders] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('orders')
    const { config } = useOrganization()
    const [uploadingResult, setUploadingResult] = useState<string | null>(null)
    const { toast } = useToast()

    // States for Dialogs and Data
    const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
    const [isEditOrderOpen, setIsEditOrderOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [isResultEntryOpen, setIsResultEntryOpen] = useState(false)
    const [viewingReport, setViewingReport] = useState<any>(null)

    const [patients, setPatients] = useState<any[]>([])
    const [staff, setStaff] = useState<any[]>([])
    const [tests, setTests] = useState<any[]>([])

    const [formData, setFormData] = useState({
        patientId: '',
        staffId: '',
        testType: '',
        priority: 'NORMAL',
        notes: ''
    })



    // Filtros
    const [filters, setFilters] = useState({
        status: 'all',
        examType: 'all',
    })

    useEffect(() => {
        loadData()
        loadDropdownData()
        loadStats()
    }, [])

    const loadDropdownData = async () => {
        try {
            const [pRes, dRes, tRes] = await Promise.all([
                patientsAPI.getAll(),
                healthStaffAPI.getAll(),
                laboratoryAPI.getTests()
            ])

            const patientsList = Array.isArray(pRes.data) ? pRes.data : (pRes.data?.data || [])
            const staffList = Array.isArray(dRes.data) ? dRes.data : (dRes.data?.data || [])
            const testsList = Array.isArray(tRes.data) ? tRes.data : (tRes.data?.data || [])

            setPatients(patientsList)
            setStaff(staffList)
            setTests(testsList)
        } catch (error) {
            console.error("Error loading dropdowns", error)
        }
    }

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        mostRequested: [],
        avgDeliveryTime: '0.0',
        dailyVolume: [],
        monthlyVolume: [],
        deliveryStats: {
            stat: '0.0',
            normal: '0.0',
            trend: '0'
        }
    })

    const loadStats = async () => {
        try {
            const res = await laboratoryAPI.getStats()
            if (res.data) {
                setStats(res.data)
            }
        } catch (error) {
            console.error("Error loading stats", error)
        }
    }

    const loadData = async () => {
        try {
            setLoading(true)
            const ordersRes = await laboratoryAPI.getOrders({
                status: filters.status,
                search: searchTerm
            })
            const ordersData = ordersRes.data?.data || (Array.isArray(ordersRes.data) ? ordersRes.data : [])
            setOrders(ordersData)
            // Refresh stats whenever data changes significantly
            loadStats()
        } catch (error: any) {
            console.error(error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al cargar órdenes de laboratorio',
                variant: 'destructive',
            })
            setOrders([])
        } finally {
            setLoading(false)
        }
    }



    const openEditDialog = (order: any) => {
        setSelectedOrder(order)
        setFormData({
            patientId: order.patientId,
            staffId: order.staffId,
            testType: order.testId || '',
            priority: order.priority,
            notes: order.notes || ''
        })
        setIsEditOrderOpen(true)
    }

    const handleUpdateOrder = async () => {
        if (!selectedOrder) return

        try {
            await laboratoryAPI.updateOrder(selectedOrder.id, {
                priority: formData.priority,
                notes: formData.notes
            })
            toast({ title: "Éxito", description: "Orden actualizada" })
            setIsEditOrderOpen(false)
            setSelectedOrder(null)
            loadData()
        } catch (error) {
            toast({ title: "Error", description: "Error al actualizar", variant: "destructive" })
        }
    }

    const handleDeleteOrder = async () => {
        if (!deleteId) return
        try {
            await laboratoryAPI.deleteOrder(deleteId)
            toast({ title: "Éxito", description: "Orden eliminada" })
            setDeleteId(null)
            loadData()
        } catch (error) {
            toast({ title: "Error", description: "Error al eliminar", variant: "destructive" })
        }
    }

    const handleUploadResult = async (orderId: string, file: File) => {
        setUploadingResult(orderId)
        try {
            // In a real senior app, we would upload the file to S3/Cloudinary first
            // Here we simulate and then call status update
            await laboratoryAPI.updateStatus(orderId, 'COMPLETADO', {
                resultFile: `https://edicarex-storage.com/results/${file.name}`,
                results: [{ name: 'Resultado General', value: 'Ver Archivo', unit: '-', range: '-', status: 'NORMAL' }]
            })

            toast({
                title: 'Resultado Subido',
                description: 'El resultado de laboratorio ha sido registrado correctamente',
            })
            setUploadingResult(null)
            loadData()
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo subir el resultado', variant: 'destructive' })
            setUploadingResult(null)
        }
    }

    const handleFileSelect = (orderId: string) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.pdf,.png,.jpg'
        input.onchange = (e: any) => {
            const file = e.target.files[0]
            if (file) {
                handleUploadResult(orderId, file)
            }
        }
        input.click()
    }

    // Filtrar órdenes (Now also handled by backend, but kept for reactive UI)
    const filteredOrders = useMemo(() => {
        return orders.filter((order: any) => {
            const searchMatch = searchTerm === '' ||
                order.patient?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.patient?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.testName?.toLowerCase().includes(searchTerm.toLowerCase())

            const statusMatch = filters.status === 'all' || order.status === filters.status
            return searchMatch && statusMatch
        })
    }, [orders, searchTerm, filters])

    const [viewResultOrder, setViewResultOrder] = useState<any>(null)

    const statusMap: any = {
        'PENDING': 'PENDIENTE',
        'IN_PROGRESS': 'EN_PROCESO',
        'COMPLETED': 'COMPLETADO',
        'PENDIENTE': 'PENDIENTE',
        'EN_PROCESO': 'EN_PROCESO',
        'COMPLETADO': 'COMPLETADO'
    }

    const getStatusBadge = (status: string) => {
        const s = statusMap[status] || status;
        const colors: Record<string, string> = {
            PENDIENTE: 'bg-yellow-100 text-yellow-800',
            EN_PROCESO: 'bg-blue-100 text-blue-800',
            COMPLETADO: 'bg-green-100 text-green-800',
            CANCELADO: 'bg-red-100 text-red-800',
        }
        return colors[s] || colors.PENDIENTE
    }

    const getStatusIcon = (status: string) => {
        const s = statusMap[status] || status;
        switch (s) {
            case 'COMPLETADO':
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'EN_PROCESO':
                return <Clock className="h-4 w-4 text-blue-600" />
            case 'PENDIENTE':
                return <AlertCircle className="h-4 w-4 text-yellow-600" />
            default:
                return <XCircle className="h-4 w-4 text-red-600" />
        }
    }

    const COLORS = ['#dc2626', '#f59e0b', '#3b82f6', '#10b981', '#6366f1'] // Red, Amber, Blue, Emerald, Indigo

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header — same layout as Emergencias */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <FlaskConical className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Laboratorio</h1>
                        <p className="text-muted-foreground">
                            Control de resultados y análisis clínicos en tiempo real
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => loadData()}
                        className="bg-zinc-900 border-zinc-800"
                    >
                        <Loader2 className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                        Actualizar
                    </Button>
                    {hasPermission('LAB_CREATE') && (
                        <Button
                            onClick={() => setIsNewOrderOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Orden
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards — same card style as Emergencias */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
                        <FlaskConical className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {stats.total}
                        </div>
                        <p className="text-xs text-muted-foreground">Órdenes registradas</p>
                    </CardContent>
                </Card>

                <Card className="border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {stats.pending}
                        </div>
                        <p className="text-xs text-muted-foreground">Esperando toma de muestra</p>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
                        <Clock className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {stats.inProgress}
                        </div>
                        <p className="text-xs text-muted-foreground">Análisis en ejecución</p>
                    </CardContent>
                </Card>

                <Card className="border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.completed}
                        </div>
                        <p className="text-xs text-muted-foreground">Resultados validados</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter bar — inline, same feel as Emergencias table header */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder="Buscar por paciente, examen o personal..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-zinc-900 border-zinc-800 focus:ring-red-500"
                            />
                        </div>
                        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                            <SelectTrigger className="w-full md:w-48 bg-zinc-900 border-zinc-800">
                                <Filter className="h-4 w-4 mr-2 text-zinc-500" />
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                <SelectItem value="all">Todos los Estados</SelectItem>
                                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                                <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                                <SelectItem value="COMPLETADO">Completado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs — default shadcn, just like Emergencias */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="orders">
                        <FileText className="h-4 w-4 mr-2" />
                        Órdenes de Análisis
                    </TabsTrigger>
                    <TabsTrigger value="statistics">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Panel Analítico
                    </TabsTrigger>
                </TabsList>

                {/* ─── ORDERS TAB ─── */}
                <TabsContent value="orders" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle>Órdenes de Análisis Activas</CardTitle>
                                <CardDescription>Monitoreo y gestión de exámenes en tiempo real</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800 hover:bg-transparent">
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Examen</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Paciente / Médico</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Fecha</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Estado / Prioridad</TableHead>
                                        <TableHead className="text-right text-zinc-500 uppercase text-xs font-bold">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                                No se encontraron órdenes con los filtros seleccionados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredOrders.map((order: any) => (
                                            <TableRow key={order.id}>
                                                {/* Examen */}
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{order.testName || order.testType}</p>
                                                        <p className="text-sm text-muted-foreground">{order.testType}</p>
                                                    </div>
                                                </TableCell>

                                                {/* Paciente / Médico */}
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">
                                                            {order.patient
                                                                ? `${order.patient.firstName} ${order.patient.lastName}`
                                                                : 'Anónimo'}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Personal de Salud: {order.staff?.user?.lastName || 'Asignado'}
                                                        </p>
                                                    </div>
                                                </TableCell>

                                                {/* Cronología */}
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(order.requestedDate || order.createdAt), 'dd MMM, yyyy', { locale: es })}
                                                    </div>
                                                    {order.status === 'COMPLETADO' && (
                                                        <p className="text-xs text-green-600 mt-0.5">
                                                            Entregado: {format(new Date(order.updatedAt), 'dd MMM')}
                                                        </p>
                                                    )}
                                                </TableCell>

                                                {/* Estado / Prioridad */}
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(order.status)}
                                                        <span className={cn(
                                                            "text-xs font-semibold",
                                                            (statusMap[order.status] || order.status) === 'PENDIENTE' ? 'text-yellow-600' :
                                                                (statusMap[order.status] || order.status) === 'EN_PROCESO' ? 'text-blue-600' :
                                                                    (statusMap[order.status] || order.status) === 'COMPLETADO' ? 'text-green-600' : 'text-red-600'
                                                        )}>
                                                            {statusMap[order.status] || order.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <span className={cn(
                                                        "inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold",
                                                        order.priority === 'URGENTE' || order.priority === 'STAT'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    )}>
                                                        {order.priority === 'STAT' ? 'URGENTE' : order.priority}
                                                    </span>
                                                </TableCell>

                                                {/* Acciones */}
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        {order.status === 'COMPLETADO' ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title="Ver Informe Médico"
                                                                onClick={() => setViewingReport(order)}
                                                            >
                                                                <FileText className="h-4 w-4 text-green-600" />
                                                            </Button>
                                                        ) : hasPermission('LAB_RESULTS') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title="Ingresar Resultados"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setSelectedOrder(order)
                                                                    setIsResultEntryOpen(true)
                                                                }}
                                                                disabled={uploadingResult === order.id}
                                                            >
                                                                {uploadingResult === order.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Plus className="h-4 w-4 text-blue-500" />
                                                                )}
                                                            </Button>
                                                        )}

                                                        {hasPermission('LAB_EDIT') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title="Editar Orden"
                                                                onClick={() => openEditDialog(order)}
                                                            >
                                                                <Clock className="h-4 w-4 text-blue-500" />
                                                            </Button>
                                                        )}

                                                        {hasPermission('LAB_DELETE') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                                                                title="Eliminar Orden"
                                                                onClick={() => setDeleteId(order.id)}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── STATISTICS TAB ─── */}
                <TabsContent value="statistics" className="mt-4 space-y-6">

                    {/* Top row: KPI + two charts side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* Delivery Time KPI */}
                        <Card className="border-purple-500/20 bg-zinc-950 shadow-lg shadow-purple-900/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                                <Clock className="h-16 w-16 text-purple-600" />
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-purple-400/80">Tiempo de Entrega</CardTitle>
                                <TrendingUp className="h-4 w-4 text-purple-500 animate-pulse" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-4xl font-black text-white tracking-tighter">
                                        {stats.avgDeliveryTime}
                                    </div>
                                    <span className="text-sm font-bold text-purple-400 uppercase">días</span>

                                    <div className="ml-auto flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Rendimiento</span>
                                        <div className="flex items-center gap-1 text-green-500 font-bold text-sm">
                                            <ArrowUpRight className="h-3 w-3" />
                                            {stats.deliveryStats?.trend || '85'}%
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[11px] text-zinc-500 mt-1 font-medium italic">Promedio global desde solicitud</p>

                                <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-zinc-900">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Prioridad STAT</span>
                                        </div>
                                        <div className="text-lg font-bold text-zinc-100 flex items-baseline gap-1">
                                            {stats.deliveryStats?.stat || '0.4'}
                                            <span className="text-[10px] font-normal text-zinc-500">d</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Normal</span>
                                        </div>
                                        <div className="text-lg font-bold text-zinc-100 flex items-baseline gap-1">
                                            {stats.deliveryStats?.normal || '2.1'}
                                            <span className="text-[10px] font-normal text-zinc-500">d</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pie chart — Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Distribución de Análisis</CardTitle>
                                <CardDescription>Exámenes más solicitados</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={stats.mostRequested}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={4}
                                            dataKey="count"
                                        >
                                            {stats.mostRequested.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', fontSize: '12px', background: '#18181b', border: '1px solid #3f3f46' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Bar chart — Daily volume */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Carga Diaria</CardTitle>
                                <CardDescription>Órdenes (últimos 7 días)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={stats.dailyVolume}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                        <XAxis dataKey="date" fontSize={11} stroke="#71717a" />
                                        <YAxis fontSize={11} stroke="#71717a" />
                                        <Tooltip contentStyle={{ borderRadius: '8px', background: '#18181b', border: '1px solid #3f3f46' }} />
                                        <Bar dataKey="count" fill="#dc2626" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Monthly trend — full width */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Volumen Mensual de Operaciones</CardTitle>
                                    <CardDescription>Tendencias históricas de los últimos 6 meses</CardDescription>
                                </div>
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                                    Sistema Operativo
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={stats.monthlyVolume}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                    <XAxis dataKey="month" fontSize={11} stroke="#71717a" />
                                    <YAxis fontSize={11} stroke="#71717a" />
                                    <Tooltip contentStyle={{ borderRadius: '8px', background: '#18181b', border: '1px solid #3f3f46' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ r: 5, fill: '#10b981', strokeWidth: 0 }}
                                        activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 3, fill: '#fff' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ─── NEW ORDER DIALOG ─── */}
            {/* ─── NEW ORDER DIALOG ─── */}
            <LabOrderModal
                open={isNewOrderOpen}
                onOpenChange={setIsNewOrderOpen}
                onSuccess={() => {
                    loadData()
                    loadStats() // Also refresh stats
                }}
            />
            {/* ─── VIEW RESULT DIALOG ─── */}
            <Dialog open={!!viewResultOrder} onOpenChange={(open) => !open && setViewResultOrder(null)}>
                <DialogContent className="sm:max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-purple-400">
                            <FlaskConical className="h-5 w-5" />
                            Resultado de Laboratorio
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Detalles técnicos y validación del examen clínico
                        </DialogDescription>
                    </DialogHeader>

                    {viewResultOrder && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-6 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
                                <div>
                                    <Label className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Paciente</Label>
                                    <p className="text-lg font-semibold text-zinc-100">
                                        {viewResultOrder.patient?.firstName} {viewResultOrder.patient?.lastName}
                                    </p>
                                    <p className="text-xs text-zinc-500">DNI: {viewResultOrder.patient?.documentNumber || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <Label className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider">Orden #</Label>
                                    <p className="text-lg font-mono font-bold text-red-500">{viewResultOrder.orderNumber}</p>
                                    <p className="text-xs text-zinc-500">{format(new Date(viewResultOrder.createdAt), 'dd MMMM, yyyy', { locale: es })}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold border-b border-zinc-800 pb-2 text-zinc-300">Detalle del Análisis</h4>
                                <div className="rounded-md border border-zinc-800">
                                    <Table>
                                        <TableHeader className="bg-zinc-900/50">
                                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                                <TableHead className="text-zinc-500 text-[11px] uppercase font-bold">Examen</TableHead>
                                                <TableHead className="text-zinc-500 text-[11px] uppercase font-bold">Resultado</TableHead>
                                                <TableHead className="text-zinc-500 text-[11px] uppercase font-bold">Referencia</TableHead>
                                                <TableHead className="text-zinc-500 text-[11px] uppercase font-bold">Estado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewResultOrder.results && viewResultOrder.results.length > 0 ? (
                                                viewResultOrder.results.map((res: any) => (
                                                    <TableRow key={res.id} className="border-zinc-900 hover:bg-zinc-900/30">
                                                        <TableCell className="font-medium text-zinc-300">{res.testName}</TableCell>
                                                        <TableCell className="text-purple-400 font-bold">{res.result} {res.unit}</TableCell>
                                                        <TableCell className="text-zinc-500 text-xs">{res.referenceRange || '-'}</TableCell>
                                                        <TableCell>
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                                res.status === 'NORMAL' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                            )}>
                                                                {res.status}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-zinc-500 italic">
                                                        Sin resultados detallados registrados.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {viewResultOrder.notes && (
                                <div className="p-3 bg-zinc-900/30 rounded-md border border-zinc-800/50">
                                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Observaciones:</Label>
                                    <p className="text-sm text-zinc-400 mt-1 italic">"{viewResultOrder.notes}"</p>
                                </div>
                            )}

                            {viewResultOrder.resultFile && (
                                <div className="flex justify-center pt-2">
                                    <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 h-10" variant="outline" asChild>
                                        <a href={viewResultOrder.resultFile} target="_blank" rel="noreferrer" className="flex items-center justify-center">
                                            <FileText className="h-4 w-4 mr-2 text-red-500" />
                                            Descargar Informe Firmado (PDF)
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="border-t border-zinc-900 pt-4">
                        <Button variant="outline" onClick={() => setViewResultOrder(null)} className="w-full border-zinc-800 bg-zinc-900">
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── EDIT ORDER DIALOG ─── */}
            <Dialog open={isEditOrderOpen} onOpenChange={setIsEditOrderOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Modificar Orden</DialogTitle>
                        <DialogDescription>Actualice la prioridad u observaciones de la orden seleccionada.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label>Nivel de Urgencia</Label>
                            <Select onValueChange={(v) => setFormData({ ...formData, priority: v })} value={formData.priority}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                    <SelectValue placeholder="Prioridad" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                    <SelectItem value="NORMAL">NORMAL</SelectItem>
                                    <SelectItem value="URGENTE">URGENTE</SelectItem>
                                    <SelectItem value="STAT">STAT (Inmediato)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Observaciones</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Notas clínicas relevantes..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => setIsEditOrderOpen(false)}
                            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300">
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateOrder}
                            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20">
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── DELETE CONFIRMATION ─── */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-zinc-100 italic font-bold">¿Eliminar esta orden?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Esta acción es irreversible y eliminará todos los registros asociados a esta solicitud de análisis.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteOrder}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
                        >
                            Confirmar Eliminación
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ─── RESULT ENTRY DIALOG (PRO) ─── */}
            <Dialog open={isResultEntryOpen} onOpenChange={setIsResultEntryOpen}>
                <DialogContent className="sm:max-w-2xl bg-zinc-950 border-zinc-900 text-zinc-100">
                    <DialogHeader className="border-b border-zinc-900 pb-4">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-blue-400">
                            <Plus className="h-5 w-5" />
                            Ingreso Profesional de Resultados
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            Registre los valores clínicos y adjunte el reporte físico para finalizar la orden.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <ResultEntryForm
                            order={selectedOrder}
                            onComplete={() => {
                                setIsResultEntryOpen(false)
                                loadData()
                            }}
                            onCancel={() => setIsResultEntryOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* ─── PROFESSIONAL MEDICAL REPORT PREVIEW ─── */}
            <Dialog open={!!viewingReport} onOpenChange={(open) => !open && setViewingReport(null)}>
                <DialogContent className="sm:max-w-3xl bg-white text-zinc-900 p-0 overflow-hidden border-none">
                    {viewingReport && (
                        <div className="flex flex-col h-[85vh]">
                            <div className="flex-1 overflow-y-auto p-12 bg-white" id="printable-report">
                                {/* Report Header */}
                                <div className="border-b-2 border-red-600 pb-6 mb-8 flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        {config?.logo ? (
                                            <img
                                                src={config.logo}
                                                alt="Logo"
                                                className="h-16 w-auto object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    document.getElementById('fallback-logo')!.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            id="fallback-logo"
                                            className="h-16 w-16 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-2xl"
                                            style={{ display: config?.logo ? 'none' : 'flex' }}
                                        >
                                            {config?.hospitalName?.charAt(0) || 'M'}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{(config?.hospitalName || 'EDICAREX CLINIC').toUpperCase()}</h2>
                                            <p className="text-sm font-bold text-red-600">CENTRO DE ANÁLISIS CLÍNICOS</p>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-zinc-500">
                                        <p>RUC: 20601234567</p>
                                        <p>{config?.address || 'Av. Salud 123, Miraflores'}</p>
                                        <p>Tel: {config?.phone || '(01) 444-5555'}</p>
                                    </div>
                                </div>

                                {/* Patient Info */}
                                <div className="grid grid-cols-2 gap-8 mb-8 bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PACIENTE</p>
                                        <p className="font-black text-lg text-zinc-900 uppercase">
                                            {viewingReport.patient?.firstName} {viewingReport.patient?.lastName}
                                        </p>
                                        <p className="text-sm text-zinc-600">DNI: {viewingReport.patient?.documentId || 'No registrado'}</p>
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">FECHA DE REPORTE</p>
                                        <p className="font-bold text-zinc-900">{format(new Date(viewingReport.updatedAt), 'dd MMMM, yyyy', { locale: es })}</p>
                                        <p className="text-sm text-zinc-600 italic">Orden ID: {viewingReport.id.slice(-8).toUpperCase()}</p>
                                    </div>
                                </div>

                                {/* Result Table */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-black text-zinc-900 mb-4 border-l-4 border-red-600 pl-4 uppercase">
                                        EXAMEN: {viewingReport.testName}
                                    </h3>
                                    <Table>
                                        <TableHeader className="bg-zinc-100">
                                            <TableRow>
                                                <TableHead className="text-zinc-900 font-bold uppercase text-[10px]">ANÁLISIS / PARÁMETRO</TableHead>
                                                <TableHead className="text-zinc-900 font-bold uppercase text-[10px]">RESULTADO</TableHead>
                                                <TableHead className="text-zinc-900 font-bold uppercase text-[10px]">UNIDAD</TableHead>
                                                <TableHead className="text-zinc-900 font-bold uppercase text-[10px]">VALORES DE REFERENCIA</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewingReport.results && viewingReport.results.length > 0 ? (
                                                viewingReport.results.map((res: any, idx: number) => (
                                                    <TableRow key={idx} className="border-b border-zinc-100">
                                                        <TableCell className="font-bold text-zinc-800">{res.testName}</TableCell>
                                                        <TableCell className={cn(
                                                            "font-black text-lg",
                                                            res.status !== 'NORMAL' ? "text-red-600" : "text-zinc-900"
                                                        )}>
                                                            {res.result}
                                                            {res.status !== 'NORMAL' && <span className="ml-2 text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">!</span>}
                                                        </TableCell>
                                                        <TableCell className="text-zinc-600 font-medium">{res.unit || '-'}</TableCell>
                                                        <TableCell className="text-zinc-500 font-mono text-xs">{res.referenceRange || '-'}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-12 italic text-zinc-400">
                                                        No hay parámetros detallados para este examen.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Notes */}
                                {viewingReport.notes && (
                                    <div className="mb-12 p-4 bg-zinc-50 border-l-4 border-zinc-200 rounded-r-lg italic text-zinc-600 text-sm">
                                        <span className="font-bold block not-italic text-zinc-400 text-[10px] uppercase mb-1">OBSERVACIONES:</span>
                                        "{viewingReport.notes}"
                                    </div>
                                )}

                                {/* Footer / Signature */}
                                <div className="mt-auto pt-12 flex justify-between items-end border-t border-zinc-100 italic text-zinc-400 text-[10px]">
                                    <div>
                                        <p>Documento generado electrónicamente por {(config?.hospitalName || 'EdiCarex')} Enterprise</p>
                                        <p>La interpretación de este resultado es exclusiva responsabilidad del médico tratante.</p>
                                    </div>
                                    <div className="text-center w-64 border-t border-dashed border-zinc-300 pt-2">
                                        <p className="font-bold text-zinc-900 not-italic">VALIDACIÓN BACTERIOLÓGICA</p>
                                        <p>Firma y Sello del Bioquímico</p>
                                    </div>
                                </div>
                            </div>

                            {/* Report Actions */}
                            <div className="bg-zinc-100 p-6 flex justify-between items-center border-t border-zinc-200">
                                <Button variant="ghost" onClick={() => setViewingReport(null)} className="text-zinc-600">
                                    Cerrar Vista Previa
                                </Button>
                                <div className="flex gap-3">
                                    {viewingReport.resultFile && (
                                        <Button variant="outline" className="border-zinc-300 text-zinc-700 bg-white" asChild>
                                            <a href={viewingReport.resultFile} target="_blank" rel="noreferrer">
                                                <Upload className="h-4 w-4 mr-2" /> Descargar Archivo Físico
                                            </a>
                                        </Button>
                                    )}
                                    <Button className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 shadow-lg shadow-red-600/20"
                                        onClick={() => window.print()}>
                                        <FileText className="h-4 w-4 mr-2" /> Imprimir Informe
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}