import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBedStore, Bed as BedType } from '@/stores/bedStore'
import BedModal from '@/components/modals/BedModal'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    LayoutGrid,
    List,
    Plus,
    Search,
    Activity,
    BedDouble,
    CheckCircle2,
    AlertCircle,
    History,
    Clock,
    Filter
} from 'lucide-react'
import BedMap from './components/BedMap'
import BedList from './components/BedList'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { usePermissions } from '@/hooks/usePermissions'

export default function BedManagementPage() {
    const { hasPermission } = usePermissions()
    const [searchParams] = useSearchParams()
    const initialWard = searchParams.get('ward') || 'ALL'

    const { activityLog, fetchBeds, fetchStats, fetchActivityLog, stats, isLoading } = useBedStore()
    const [isBedModalOpen, setIsBedModalOpen] = useState(false)
    const [bedToEdit, setBedToEdit] = useState<BedType | null>(null)
    const [view, setView] = useState<'map' | 'list'>('map')
    const [filterWard, setFilterWard] = useState(initialWard)
    const [filterStatus, setFilterStatus] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchBeds()
        fetchStats()
        fetchActivityLog()
        // Poll for updates every 30 seconds
        const interval = setInterval(() => {
            fetchBeds()
            fetchStats()
            fetchActivityLog()
        }, 30000)
        return () => clearInterval(interval)
    }, [fetchBeds, fetchStats, fetchActivityLog])

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
            <BedModal
                isOpen={isBedModalOpen}
                onClose={() => {
                    setIsBedModalOpen(false)
                    setBedToEdit(null)
                }}
                bedToEdit={bedToEdit}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gestión de Camas</h1>
                    <p className="text-muted-foreground">Centro de control y asignación hospitalaria en tiempo real</p>
                </div>
                {hasPermission('BEDS_CREATE') && (
                    <Button onClick={() => setIsBedModalOpen(true)} size="lg" className="shadow-md">
                        <Plus className="mr-2 h-5 w-5" /> Nueva Cama
                    </Button>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Camas</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <BedDouble className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">Capacidad instalada</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-100 dark:border-green-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Disponibles</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{stats.available}</div>
                        <p className="text-xs text-muted-foreground mt-1">Listas para ingreso</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background border-orange-100 dark:border-orange-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Ocupación</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{stats.occupancyRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">{stats.occupied} camas ocupadas</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-950/20 dark:to-background border-slate-100 dark:border-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Mantenimiento</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{stats.maintenance + stats.cleaning}</div>
                        <p className="text-xs text-muted-foreground mt-1">Incluye limpieza</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Map/List (Takes 3/4 width) */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar cama, paciente..."
                                    className="pl-10 h-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={filterWard} onValueChange={setFilterWard}>
                                <SelectTrigger className="w-[160px] h-10">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Área" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todas las Áreas</SelectItem>
                                    <SelectItem value="Emergencia">Emergencia</SelectItem>
                                    <SelectItem value="UCI">UCI</SelectItem>
                                    <SelectItem value="General">General</SelectItem>
                                    <SelectItem value="Pediatría">Pediatría</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[160px] h-10">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Estado" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos los Estados</SelectItem>
                                    <SelectItem value="AVAILABLE">Disponible</SelectItem>
                                    <SelectItem value="OCCUPIED">Ocupada</SelectItem>
                                    <SelectItem value="CLEANING">Limpieza</SelectItem>
                                    <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                                    <SelectItem value="RESERVED">Reservada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center bg-muted p-1 rounded-lg">
                            <Button
                                variant={view === 'map' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setView('map')}
                                className="h-8"
                            >
                                <LayoutGrid className="h-4 w-4 mr-2" /> Mapa
                            </Button>
                            <Button
                                variant={view === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setView('list')}
                                className="h-8"
                            >
                                <List className="h-4 w-4 mr-2" /> Lista
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <Card className="min-h-[500px] border-none shadow-none bg-transparent">
                        <CardContent className="p-0">
                            {view === 'map' ? (
                                <BedMap
                                    filterWard={filterWard}
                                    filterStatus={filterStatus}
                                    searchQuery={searchQuery}
                                    onEditBed={(bed) => {
                                        setBedToEdit(bed)
                                        setIsBedModalOpen(true)
                                    }}
                                />
                            ) : (
                                <BedList
                                    filterWard={filterWard}
                                    filterStatus={filterStatus}
                                    searchQuery={searchQuery}
                                    onEditBed={(bed) => {
                                        setBedToEdit(bed)
                                        setIsBedModalOpen(true)
                                    }}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Activity Log */}
                <div className="lg:col-span-1">
                    <Card className="h-full max-h-[calc(100vh-200px)] flex flex-col">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base flex items-center gap-2">
                                <History className="h-4 w-4 text-muted-foreground" />
                                Actividad Reciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0">
                            <ScrollArea className="h-full p-4">
                                <div className="space-y-4">
                                    {activityLog.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No hay actividad reciente</p>
                                        </div>
                                    ) : (
                                        activityLog.map((log) => (
                                            <div key={log.id} className="relative pl-4 border-l-2 border-muted pb-4 last:pb-0">
                                                <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-sm font-semibold">{log.bedNumber}</span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: es })}
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline" className="w-fit text-[10px] px-2 py-0 h-5">
                                                        {log.action}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">{log.details}</p>
                                                    <p className="text-[10px] text-muted-foreground/70">Usuario: {log.user}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
