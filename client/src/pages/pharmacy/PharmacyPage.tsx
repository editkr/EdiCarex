import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
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
import { pharmacyAPI, reportsAPI, aiAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import {
    Pill,
    Plus,
    Search,
    AlertTriangle,
    Loader2,
    Edit,
    Trash2,
    Package,
    TrendingDown,
    TrendingUp,
    Calendar,
    Building2,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    FileText,
    Filter,
    ClipboardList,
    AlertCircle,
    Download,
    Sparkles
} from 'lucide-react'
import { format, differenceInDays, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from "@/lib/utils"
import { formatCurrency } from '@/utils/financialUtils'
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
import { usePermissions } from '@/hooks/usePermissions'
import { useOrganization } from '@/contexts/OrganizationContext'

const MODEL_DISPLAY_NAMES: Record<string, string> = {
    'llama-3.3-70b-versatile': 'Meta Llama 3.3 70B (Producción)',
    'llama-3.1-8b-instant': 'Meta Llama 3.1 8B (Instantáneo)',
    'openai/gpt-oss-120b': 'OpenAI GPT OSS 120B (Flagship)',
    'groq/compound': 'Groq Compound (Sistema Agente)',
    'groq/compound-mini': 'Groq Compound Mini',
    'qwen/qwen3-32b': 'Qwen 3 32B (Preview)',
};

export default function PharmacyPage() {
    // Componente de gestión de farmacia con soporte de precios reales
    const navigate = useNavigate()
    const { hasPermission } = usePermissions()
    const { config } = useOrganization()
    const aiConfig = config?.ai as any
    const queryClient = useQueryClient()
    const { toast } = useToast()

    // Query para Medicamentos
    const { data: medsData, isLoading: medsLoading } = useQuery({
        queryKey: ['pharmacy', 'medications'],
        queryFn: () => pharmacyAPI.getMedications()
    })

    // Query para Órdenes
    const { data: ordersData, isLoading: ordersLoading } = useQuery({
        queryKey: ['pharmacy', 'orders'],
        queryFn: () => pharmacyAPI.getOrders()
    })

    // Query para Kardex
    const { data: kardexData, isLoading: kardexLoading } = useQuery({
        queryKey: ['pharmacy', 'kardex'],
        queryFn: () => pharmacyAPI.getKardex()
    })

    const medications = medsData?.data?.data || medsData?.data || []
    const orders = ordersData?.data || []
    const kardex = kardexData?.data || []

    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('inventory')
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editItem, setEditItem] = useState<any | null>(null)
    const [viewFilter, setViewFilter] = useState<'all' | 'critical' | 'expiring'>('all')
    const [newItem, setNewItem] = useState({
        name: '',
        laboratory: '',
        stock: 0,
        minStock: 10,
        expiry: '',
        batch: '',
        type: 'Medicamento',
        price: 0, // [NEW] Selling Price
        costPrice: 0
    })

    // Filtros
    const [filters, setFilters] = useState({
        type: 'all',
        laboratory: 'all',
        status: 'all',
    })

    // AI Prediction State
    const [analyzingId, setAnalyzingId] = useState<string | null>(null)
    const [aiResult, setAiResult] = useState<any | null>(null)
    const [isAiModalOpen, setIsAiModalOpen] = useState(false)

    const handleAIPredict = async (med: any) => {
        try {
            setAnalyzingId(med.id)
            // Simular datos históricos si no hay (para demo Senior)
            const historicalData = [med.currentStock + 5, med.currentStock - 2, med.currentStock + 10, med.currentStock]
            const response = await aiAPI.predictDemand(med.id)
            setAiResult({
                ...response.data,
                medName: med.name,
                currentStock: med.currentStock
            })
            setIsAiModalOpen(true)
        } catch (error) {
            toast({
                title: 'Error de IA',
                description: 'No se pudo conectar con el motor de previsión EdiCarex.',
                variant: 'destructive'
            })
        } finally {
            setAnalyzingId(null)
        }
    }

    // Mutación para eliminar
    const deleteMutation = useMutation({
        mutationFn: (id: string) => pharmacyAPI.deleteMedication(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pharmacy'] })
            toast({ title: 'Éxito', description: 'Medicamento eliminado correctamente' })
            setDeleteId(null)
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al eliminar medicamento',
                variant: 'destructive',
            })
        }
    })

    // Mutación para crear
    const createMutation = useMutation({
        mutationFn: (data: any) => pharmacyAPI.createMedication(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pharmacy'] })
            toast({ title: 'Éxito', description: 'Medicamento creado correctamente' })
            setIsAddDialogOpen(false)
            setNewItem({ name: '', laboratory: '', stock: 0, minStock: 10, expiry: '', batch: '', type: 'Medicamento', price: 0, costPrice: 0 })
        },
        onError: () => {
            toast({ title: 'Error', description: 'No se pudo crear el medicamento', variant: 'destructive' })
        }
    })

    // Mutación para actualizar
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => pharmacyAPI.updateMedication(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pharmacy'] })
            toast({ title: 'Éxito', description: 'Medicamento actualizado correctamente' })
            setIsAddDialogOpen(false)
            setEditItem(null)
        },
        onError: () => {
            toast({ title: 'Error', description: 'No se pudo actualizar el medicamento', variant: 'destructive' })
        }
    })

    // Mutación para órdenes
    const orderMutation = useMutation({
        mutationFn: ({ id, action, reason }: { id: string, action: 'approve' | 'reject', reason?: string }) =>
            action === 'approve' ? pharmacyAPI.approveOrder(id) : pharmacyAPI.rejectOrder(id, reason || 'Stock insuficiente'),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pharmacy'] })
            toast({
                title: variables.action === 'approve' ? 'Orden Aprobada' : 'Orden Rechazada',
                description: `La orden ha sido ${variables.action === 'approve' ? 'procesada' : 'rechazada'} correctamente`
            })
        },
        onError: () => {
            toast({ title: 'Error', description: 'No se pudo procesar la orden', variant: 'destructive' })
        }
    })

    const handleDelete = () => {
        if (deleteId) deleteMutation.mutate(deleteId)
    }

    const handleSaveMedication = () => {
        if (editItem) {
            updateMutation.mutate({
                id: editItem.id,
                data: {
                    name: newItem.name,
                    manufacturer: newItem.laboratory,
                    category: newItem.type,
                    stock: newItem.stock,
                    minStock: newItem.minStock,
                    batch: newItem.batch,
                    expiry: newItem.expiry,
                    price: newItem.price, // [NEW]
                    costPrice: newItem.costPrice
                }
            })
        } else {
            createMutation.mutate({
                name: newItem.name,
                manufacturer: newItem.laboratory,
                description: 'Nuevo medicamento',
                category: newItem.type,
                stock: newItem.stock,
                minStock: newItem.minStock,
                batch: newItem.batch,
                expiry: newItem.expiry,
                price: newItem.price, // [NEW]
                costPrice: newItem.costPrice
            })
        }
    }

    const handleEdit = (med: any) => {
        setEditItem(med)
        setNewItem({
            name: med.name,
            laboratory: med.laboratory || med.manufacturer || '',
            stock: med.currentStock || med.stock || 0,
            minStock: med.minStock || 10,
            expiry: med.expirationDate && isValid(new Date(med.expirationDate))
                ? format(new Date(med.expirationDate), 'yyyy-MM-dd')
                : '',
            batch: med.batch || '',
            type: med.category || med.type || 'Medicamento',
            price: med.price || 0,
            costPrice: med.costPrice || med.unitPrice || 0
        })
        setIsAddDialogOpen(true)
    }

    const handleExportReport = async () => {
        try {
            const response = await reportsAPI.exportReport('medications')
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `Reporte_Farmacia_${format(new Date(), 'yyyyMMdd')}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast({ title: 'Reporte Generado', description: 'El reporte de stock se ha descargado correctamente' })
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo generar el reporte', variant: 'destructive' })
        }
    }

    // Filtrar medicamentos
    const filteredMedications = useMemo(() => {
        let base = medications.filter((med: any) => {
            const searchMatch = searchTerm === '' ||
                med.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                med.laboratory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                med.batch?.toLowerCase().includes(searchTerm.toLowerCase())

            const typeMatch = filters.type === 'all' || med.type === filters.type
            const labMatch = filters.laboratory === 'all' || med.laboratory === filters.laboratory

            return searchMatch && typeMatch && labMatch
        })

        if (viewFilter === 'critical') {
            return base.filter((med: any) => med.currentStock < med.minStock)
        }
        if (viewFilter === 'expiring') {
            return base.filter((med: any) => {
                const days = differenceInDays(new Date(med.expirationDate), new Date())
                return days <= 90 && days > 0
            })
        }
        return base
    }, [medications, searchTerm, filters, viewFilter])

    // Alertas de stock
    const lowStockMeds = filteredMedications.filter((med: any) => med.currentStock < med.minStock)
    const expiringMeds = filteredMedications.filter((med: any) => {
        const daysUntilExpiry = differenceInDays(new Date(med.expirationDate), new Date())
        return daysUntilExpiry <= 90 && daysUntilExpiry > 0
    })

    const getStockStatus = (current: number, min: number) => {
        if (current < min * 0.5) return { color: 'text-red-600', bg: 'bg-red-100', label: 'CRÍTICO' }
        if (current < min) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'BAJO' }
        return { color: 'text-green-600', bg: 'bg-green-100', label: 'NORMAL' }
    }

    const getExpiryStatus = (expirationDate: Date) => {
        const days = differenceInDays(new Date(expirationDate), new Date())
        if (days < 0) return { color: 'text-red-600', bg: 'bg-red-100', label: 'VENCIDO' }
        if (days <= 30) return { color: 'text-red-600', bg: 'bg-red-100', label: `${days}d` }
        if (days <= 90) return { color: 'text-orange-600', bg: 'bg-orange-100', label: `${days}d` }
        return { color: 'text-green-600', bg: 'bg-green-100', label: `${days}d` }
    }

    const getOrderStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            PENDIENTE: 'bg-yellow-100 text-yellow-800',
            APROBADO: 'bg-green-100 text-green-800',
            RECHAZADO: 'bg-red-100 text-red-800',
            DISPENSADO: 'bg-blue-100 text-blue-800',
        }
        return colors[status] || colors.PENDIENTE
    }

    const loading = medsLoading || ordersLoading || kardexLoading

    if (loading && medications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                <p className="text-zinc-500 font-medium animate-pulse">Sincronizando inventario central...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Pill className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Farmacia</h1>
                        <p className="text-muted-foreground">
                            Gestión de inventario y despacho de medicamentos en tiempo real
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={handleExportReport}
                        className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 h-11 px-6 rounded-xl font-bold text-sm transition-all"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Reporte Stock
                    </Button>
                    {hasPermission('PHARMACY_CREATE') && (
                        <Button
                            onClick={() => {
                                setEditItem(null)
                                setNewItem({ name: '', laboratory: '', stock: 0, minStock: 10, expiry: '', batch: '', type: 'Medicamento', price: 0, costPrice: 0 })
                                setIsAddDialogOpen(true)
                            }}
                            className="h-11 rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 font-bold text-sm shadow-lg shadow-emerald-900/20 text-white transition-all transform active:scale-95"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Medicamento
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card
                    className={cn(
                        "border-rose-500/10 bg-zinc-950 shadow-2xl cursor-pointer transition-all hover:scale-[1.02] hover:border-rose-500/30",
                        viewFilter === 'critical' && 'ring-2 ring-rose-500 border-rose-500/50'
                    )}
                    onClick={() => {
                        setActiveTab('inventory')
                        setViewFilter(viewFilter === 'critical' ? 'all' : 'critical')
                    }}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Stock Crítico</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-500">
                            {lowStockMeds.length}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            Requieren reposición inmediata
                            {viewFilter === 'critical' && <Badge className="bg-rose-500/20 text-rose-500 text-[9px] hover:bg-rose-500/20 border-rose-500/30">ACTIVO</Badge>}
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        "border-amber-500/10 bg-zinc-950 shadow-2xl cursor-pointer transition-all hover:scale-[1.02] hover:border-amber-500/30",
                        viewFilter === 'expiring' && 'ring-2 ring-amber-500 border-amber-500/50'
                    )}
                    onClick={() => {
                        setActiveTab('inventory')
                        setViewFilter(viewFilter === 'expiring' ? 'all' : 'expiring')
                    }}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Próximos a Vencer</CardTitle>
                        <Calendar className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">
                            {expiringMeds.length}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            Vencimiento en {'<'} 90 días
                            {viewFilter === 'expiring' && <Badge className="bg-amber-500/20 text-amber-500 text-[9px] hover:bg-amber-500/20 border-amber-500/30">ACTIVO</Badge>}
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        "border-emerald-500/10 bg-zinc-950 shadow-2xl cursor-pointer transition-all hover:scale-[1.02] hover:border-emerald-500/30",
                        viewFilter === 'all' && 'ring-1 ring-emerald-500/20'
                    )}
                    onClick={() => setViewFilter('all')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Inventario</CardTitle>
                        <Package className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            {medications.length}
                        </div>
                        <p className="text-xs text-muted-foreground">Artículos registrados en sistema</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Inventario Activo</h2>
                    <p className="text-zinc-500 text-sm">Monitoreo y gestión de stock en tiempo real</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Buscar medicamento o lote..."
                            className="pl-9 bg-zinc-950 border-zinc-800 focus:ring-emerald-500 text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                        <SelectTrigger className="w-full md:w-40 bg-zinc-950 border-zinc-800 text-zinc-300">
                            <Filter className="h-4 w-4 mr-2 text-zinc-500" />
                            <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-300">
                            <SelectItem value="all">Todas las Cat.</SelectItem>
                            <SelectItem value="Medicamento">Medicamento</SelectItem>
                            <SelectItem value="Suministro">Suministro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-black/40 border-b border-zinc-800 rounded-none h-auto p-0 gap-6 w-full justify-start">
                    <TabsTrigger
                        value="inventory"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:text-emerald-500 pb-2 px-2 font-bold transition-all"
                    >
                        <Package className="h-4 w-4 mr-2" />
                        Inventario
                    </TabsTrigger>
                    <TabsTrigger
                        value="orders"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:text-emerald-500 pb-2 px-2 font-bold transition-all"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Órdenes Internas
                    </TabsTrigger>
                    <TabsTrigger
                        value="kardex"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:text-emerald-500 pb-2 px-2 font-bold transition-all"
                    >
                        <TrendingDown className="h-4 w-4 mr-2" />
                        Kardex
                    </TabsTrigger>
                </TabsList>

                {/* Inventory Tab */}
                <TabsContent value="inventory" className="mt-6 outline-none">
                    <Card className="border-zinc-800 bg-zinc-950 shadow-2xl">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-transparent">
                                    <TableHead className="text-zinc-500 uppercase text-xs font-bold pl-6">Medicamento</TableHead>
                                    <TableHead className="text-zinc-500 uppercase text-xs font-bold">Categoría</TableHead>
                                    <TableHead className="text-zinc-500 uppercase text-xs font-bold">Laboratorio</TableHead>
                                    <TableHead className="text-zinc-500 uppercase text-xs font-bold">Stock Actual</TableHead>
                                    <TableHead className="text-zinc-500 uppercase text-xs font-bold text-right">Precio</TableHead>
                                    <TableHead className="text-zinc-500 uppercase text-xs font-bold text-right">Costo</TableHead>
                                    <TableHead className="text-zinc-500 uppercase text-xs font-bold">Lote</TableHead>
                                    <TableHead className="text-zinc-500 uppercase text-xs font-bold">Vencimiento</TableHead>
                                    <TableHead className="text-right text-zinc-500 uppercase text-xs font-bold pr-6">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMedications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-20 text-zinc-500">
                                            <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                            <p className="text-lg font-medium">No se encontraron medicamentos</p>
                                            <p className="text-sm">Asegúrese de que el nombre o lote coincidan con la búsqueda.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredMedications.map((med: any) => {
                                        const stockStatus = getStockStatus(med.currentStock, med.minStock)

                                        return (
                                            <TableRow key={med.id} className="border-zinc-800 hover:bg-zinc-800/10 transition-colors">
                                                <TableCell className="pl-6">
                                                    <div>
                                                        <p className="font-bold text-zinc-100">{med.name}</p>
                                                        <p className="text-xs text-zinc-500">{med.laboratory}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-[10px] px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-bold uppercase">
                                                        {med.type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-zinc-400 text-sm">{med.laboratory}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl font-bold text-white tracking-tighter">{med.currentStock}</span>
                                                        <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800">
                                                            <div className={cn(
                                                                "h-1.5 w-1.5 rounded-full",
                                                                stockStatus.label === 'CRÍTICO' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' :
                                                                    stockStatus.label === 'BAJO' ? 'bg-amber-500' : 'bg-emerald-500'
                                                            )} />
                                                            <span className={cn(
                                                                "text-[9px] font-black uppercase tracking-tight",
                                                                stockStatus.label === 'CRÍTICO' ? 'text-rose-500' :
                                                                    stockStatus.label === 'BAJO' ? 'text-amber-500' : 'text-emerald-500'
                                                            )}>
                                                                {stockStatus.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-emerald-500">
                                                            {formatCurrency(med.price || 0, config)}
                                                        </span>
                                                        <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-tighter">P. Venta Unit.</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">P. Costo Prom.</span>
                                                        <span className="text-sm font-bold text-zinc-400">
                                                            {formatCurrency(med.costPrice || med.unitPrice || 0, config)}
                                                        </span>
                                                        <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-tighter">Costo Unit.</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-[11px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800/50">{med.batch}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {(() => {
                                                            const date = new Date(med.expirationDate);
                                                            return isValid(date)
                                                                ? format(date, 'MMM dd, yyyy', { locale: es })
                                                                : 'N/A';
                                                        })()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex justify-end items-center gap-1">
                                                        {aiConfig?.enabled && aiConfig?.features?.pharmacyStock && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={cn(
                                                                    "h-12 w-12 text-emerald-500 hover:bg-emerald-500/10 transition-all hover:scale-110",
                                                                    analyzingId === med.id && "animate-pulse"
                                                                )}
                                                                onClick={() => handleAIPredict(med)}
                                                                disabled={!!analyzingId}
                                                                title="Analizar Demanda con IA"
                                                            >
                                                                {analyzingId === med.id ? (
                                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                                ) : (
                                                                    <div className="flex items-center justify-center">
                                                                        <img
                                                                            src="/assets/logoIA.png"
                                                                            alt="AI Logo"
                                                                            className="h-10 w-10 object-contain drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </Button>
                                                        )}
                                                        {hasPermission('PHARMACY_EDIT') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 text-blue-500 hover:bg-blue-500/10"
                                                                onClick={() => handleEdit(med)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {hasPermission('PHARMACY_DELETE') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 text-rose-500 hover:bg-rose-500/10"
                                                                onClick={() => setDeleteId(med.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="mt-6">
                    <Card className="border-zinc-800 bg-zinc-950 shadow-2xl">
                        {orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-700">
                                    <FileText className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white italic tracking-tighter uppercase">Sin Órdenes Pendientes</h3>
                                <p className="max-w-xs mx-auto mt-2 text-zinc-500 text-sm">
                                    Las solicitudes internas de hospitalización aparecerán aquí para su despacho inmediato.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800 hover:bg-transparent">
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold pl-6">Fecha/ID</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Solicitante</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Medicamento</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold text-center">Cant.</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Estado</TableHead>
                                        <TableHead className="text-right text-zinc-500 uppercase text-xs font-bold pr-6">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order: any) => (
                                        <TableRow key={order.id} className="border-zinc-800 hover:bg-zinc-800/10 transition-colors">
                                            <TableCell className="pl-6 font-mono text-xs text-zinc-500">
                                                {order.createdAt && isValid(new Date(order.createdAt))
                                                    ? format(new Date(order.createdAt), 'dd/MM HH:mm')
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-zinc-300 font-medium">{order.requesterName}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-100 font-bold">{order.medicationName}</span>
                                                    <span className="text-[10px] text-zinc-500">Urgente</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-white">{order.quantity}</TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                    getOrderStatusBadge(order.status)
                                                )}>
                                                    {order.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                {order.status === 'PENDIENTE' && hasPermission('PHARMACY_DISPENSE') && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 text-rose-500 hover:bg-rose-500/10 font-bold text-xs"
                                                            onClick={() => orderMutation.mutate({ id: order.id, action: 'reject' })}
                                                            disabled={orderMutation.isPending}
                                                        >
                                                            Rechazar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-900/20"
                                                            onClick={() => orderMutation.mutate({ id: order.id, action: 'approve' })}
                                                            disabled={orderMutation.isPending}
                                                        >
                                                            Despachar
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </TabsContent>

                {/* Kardex Tab */}
                <TabsContent value="kardex" className="mt-6">
                    <Card className="border-zinc-800 bg-zinc-950 shadow-2xl">
                        <div className="flex items-center gap-6 p-8 border-b border-zinc-800">
                            <div className="h-12 w-12 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider italic">Historial de Movimientos (Kardex)</h3>
                                <p className="text-zinc-500 text-sm">Seguimiento detallado de entradas y salidas de inventario central.</p>
                            </div>
                        </div>
                        {kardex.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Clock className="h-12 w-12 text-zinc-800 mb-4" />
                                <p className="text-zinc-500 font-medium">No se registran movimientos en el historial para el periodo seleccionado.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800 hover:bg-transparent">
                                        <TableHead className="text-zinc-500 uppercase text-[10px] font-bold pl-6">Fecha</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-[10px] font-bold">Medicamento</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-[10px] font-bold">Responsable</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-[10px] font-bold">Tipo / Motivo</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-[10px] font-bold text-center">Cant.</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-[10px] font-bold text-right pr-6">Stock Final</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {kardex.map((move: any) => (
                                        <TableRow key={move.id} className="border-zinc-800 hover:bg-zinc-800/10 transition-colors">
                                            <TableCell className="pl-6 font-mono text-xs text-zinc-500">
                                                {move.createdAt && isValid(new Date(move.createdAt))
                                                    ? format(new Date(move.createdAt), 'dd/MM HH:mm')
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-zinc-300 font-medium">{move.medicationName}</TableCell>
                                            <TableCell className="text-zinc-400 text-xs">{move.responsible}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        {(move.type === 'ENTRY' || move.type === 'IN') ? (
                                                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                                                        ) : (
                                                            <TrendingDown className="h-3 w-3 text-rose-500" />
                                                        )}
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase",
                                                            (move.type === 'ENTRY' || move.type === 'IN') ? 'text-emerald-400' : 'text-rose-500'
                                                        )}>
                                                            {(move.type === 'ENTRY' || move.type === 'IN') ? 'Ingreso' : 'Salida'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] text-zinc-500 font-mono uppercase bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-800 w-fit">
                                                        {move.reason} {move.batch && move.batch !== 'N/A' && `| ${move.batch}`}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-xs font-bold",
                                                    (move.type === 'ENTRY' || move.type === 'IN') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'
                                                )}>
                                                    {(move.type === 'ENTRY' || move.type === 'IN') ? '+' : '-'}{move.quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-zinc-100 font-bold">{move.resultingStock ?? '---'}</span>
                                                    <span className="text-[9px] text-zinc-500 uppercase">Unidades</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-rose-500">
                            <AlertTriangle className="h-5 w-5" />
                            ¿Eliminar Registro?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Esta acción es irreversible. Se eliminará permanentemente el medicamento del inventario central.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white border-none rounded-xl font-bold">Eliminar de Farmacia</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AI Prediction Modal */}
            <AlertDialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-24 w-24 flex items-center justify-center p-2">
                                <img
                                    src="/assets/logoIA.png"
                                    alt="AI Logo"
                                    className="h-24 w-24 object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                                    Análisis de Demanda IA
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px]">
                                        {MODEL_DISPLAY_NAMES[aiResult?.model] || 'EDICAREX SENIOR'}
                                    </Badge>
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-zinc-400">
                                    Predicción logística para <span className="text-zinc-100 font-bold">{aiResult?.medName}</span>
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <Card className="bg-black/40 border-zinc-800 p-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-zinc-500 uppercase font-black">Demanda Proyectada</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white italic tracking-tighter">
                                        {aiResult?.predicted_demand}
                                    </span>
                                    <span className="text-sm text-zinc-500">unid. / mes</span>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500"
                                            style={{ width: `${(aiResult?.confidence || 0.8) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-500">
                                        {Math.round((aiResult?.confidence || 0.8) * 100)}% Confianza
                                    </span>
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-zinc-500 uppercase font-black flex items-center gap-2">
                                    <Sparkles className="h-3 w-3 text-emerald-400" />
                                    Recomendación Logística
                                </span>
                                <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/30 p-3 rounded-lg border border-zinc-800">
                                    {aiResult?.recommendation}
                                </p>
                            </div>
                        </div>
                    </div>

                    <AlertDialogFooter className="border-t border-zinc-800 pt-4 mt-2">
                        <AlertDialogAction
                            onClick={() => setIsAiModalOpen(false)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-8"
                        >
                            Entendido
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {/* Add Medication Dialog */}
            <AlertDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3 text-2xl font-black italic tracking-tighter">
                            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                                <Plus className="h-6 w-6 text-white" />
                            </div>
                            NUEVO INGRESO
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 font-medium">
                            Registre los detalles técnicos para el alta en el inventario de farmacia.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-5 py-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Categoría</label>
                                <select
                                    className="flex h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-100 shadow-sm transition-all focus:ring-1 focus:ring-emerald-500 outline-none"
                                    value={newItem.type}
                                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                                >
                                    <option value="Medicamento" className="bg-zinc-900">Medicamento</option>
                                    <option value="Insumo" className="bg-zinc-900">Insumo</option>
                                    <option value="Equipo" className="bg-zinc-900">Equipo</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Laboratorio</label>
                                <Input
                                    value={newItem.laboratory}
                                    onChange={(e) => setNewItem({ ...newItem, laboratory: e.target.value })}
                                    placeholder="Ej: Bayer"
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Denominación del Producto</label>
                            <Input
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                placeholder="Ej: Paracetamol 500mg"
                                className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:ring-emerald-500 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Stock Inicial</label>
                                <Input
                                    type="number"
                                    value={newItem.stock}
                                    onChange={(e) => setNewItem({ ...newItem, stock: parseInt(e.target.value) || 0 })}
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:ring-emerald-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-rose-500">Precio de Costo</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={newItem.costPrice || 0}
                                    onChange={(e) => setNewItem({ ...newItem, costPrice: parseFloat(e.target.value) || 0 })}
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:ring-rose-500 transition-all font-bold text-rose-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Precio de Venta</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={newItem.price}
                                    onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:ring-emerald-500 transition-all font-bold text-emerald-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-xs">Alerta Mínima</label>
                                <Input
                                    type="number"
                                    value={newItem.minStock}
                                    onChange={(e) => setNewItem({ ...newItem, minStock: parseInt(e.target.value) || 0 })}
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">N° de Lote</label>
                                <Input
                                    value={newItem.batch || ''}
                                    onChange={(e) => setNewItem({ ...newItem, batch: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:ring-emerald-500 transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Fecha de Vencimiento</label>
                                <Input
                                    type="date"
                                    value={newItem.expiry}
                                    onChange={(e) => setNewItem({ ...newItem, expiry: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:ring-emerald-500 transition-all px-3"
                                />
                            </div>
                        </div>
                    </div>

                    <AlertDialogFooter className="mt-8 border-t border-zinc-800 pt-6">
                        <AlertDialogCancel
                            onClick={() => {
                                setIsAddDialogOpen(false)
                                setEditItem(null)
                                setNewItem({ name: '', laboratory: '', stock: 0, minStock: 10, expiry: '', batch: '', type: 'Medicamento', price: 0, costPrice: 0 })
                            }}
                            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 rounded-xl h-11 px-8 font-bold transition-all"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleSaveMedication()
                            }}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-900/20 px-10 font-bold transition-all active:scale-95 flex items-center gap-2"
                        >
                            {createMutation.isPending || updateMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                editItem ? 'Actualizar Medicamento' : 'Confirmar Alta'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
