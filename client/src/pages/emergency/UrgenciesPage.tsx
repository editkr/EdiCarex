import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
    AlertTriangle,
    Bed,
    Users,
    Activity,
    Loader2,
    Plus,
    Eye,
    Clock,
    Heart,
    Thermometer,
    Droplet,
    Wind,
    LogOut,
    Search,
    Filter,
    Pencil,
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { emergencyAPI, aiAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import EmergencyModal from '@/components/modals/EmergencyModal'
import { usePermissions } from '@/hooks/usePermissions'
import { useOrganization } from '@/contexts/OrganizationContext'

export default function UrgenciesPage() {
    const navigate = useNavigate()
    const { hasPermission } = usePermissions()
    const { config } = useOrganization()
    const aiConfig = config?.ai as any
    const [dashboard, setDashboard] = useState<any>(null)
    const [criticalPatients, setCriticalPatients] = useState<any[]>([])
    const [wardStats, setWardStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('er-room')
    const [dischargingId, setDischargingId] = useState<string | null>(null)
    const [confirmPatient, setConfirmPatient] = useState<any | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const { toast } = useToast()

    // Triage IA State
    const [triageOpen, setTriageOpen] = useState(false)
    const [symptoms, setSymptoms] = useState('')
    const [triageResult, setTriageResult] = useState<any>(null)
    const [analyzingTriage, setAnalyzingTriage] = useState(false)
    const [admissionOpen, setAdmissionOpen] = useState(false)
    const [editingCase, setEditingCase] = useState<any | null>(null)

    const loadDashboardData = async () => {
        try {
            setLoading(true)
            const [dashboardRes, patientsRes, wardsRes] = await Promise.all([
                emergencyAPI.getDashboard(),
                emergencyAPI.getCriticalPatients(),
                emergencyAPI.getWardStats()
            ])
            setDashboard(dashboardRes.data)
            setCriticalPatients(patientsRes.data)
            setWardStats(wardsRes.data)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al cargar datos',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDischarge = async (id: string) => {
        try {
            setDischargingId(id)
            await emergencyAPI.dischargeCase(id)

            toast({
                title: 'Paciente Dado de Alta',
                description: 'El caso ha sido cerrado y la cama liberada.',
            })

            loadDashboardData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'No se pudo procesar el alta.',
                variant: 'destructive',
            })
        } finally {
            setDischargingId(null)
        }
    }

    const filteredPatients = (criticalPatients || []).filter(patient => {
        const matchesSearch = (patient.patientName || patient.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (patient.bedNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (patient.diagnosis || patient.chiefComplaint || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPriority = priorityFilter === 'all' ||
            (patient.triageLevel || patient.priority).toString() === priorityFilter;

        return matchesSearch && matchesPriority;
    });

    useEffect(() => {
        loadDashboardData()
    }, [])

    const analyzeTriage = async () => {
        if (!symptoms.trim()) {
            toast({
                title: 'Error',
                description: 'Por favor ingrese los síntomas',
                variant: 'destructive',
            })
            return
        }

        setAnalyzingTriage(true)

        try {
            const response = await aiAPI.triage({
                symptoms,
                age: 35, // Default age for quick evaluation
                vitalSigns: {}
            })
            const data = response.data

            const colors: Record<number, { bg: string; text: string; label: string }> = {
                1: { bg: 'bg-red-100', text: 'text-red-800', label: 'EMERGENCIA (ROJO)' },
                2: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'MUY URGENTE (NARANJA)' },
                3: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'URGENTE (AMARILLO)' },
                4: { bg: 'bg-green-100', text: 'text-green-800', label: 'ESTÁNDAR (VERDE)' },
                5: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'NO URGENTE (AZUL)' },
            }

            setTriageResult({
                ...data,
                color: colors[data.priority] || colors[3]
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Falló el análisis de IA',
                variant: 'destructive',
            })
        } finally {
            setAnalyzingTriage(false)
        }
    }

    const getPriorityColor = (priority: number) => {
        const colors: Record<number, string> = {
            1: 'bg-red-500',
            2: 'bg-orange-500',
            3: 'bg-yellow-500',
            4: 'bg-green-500', // Corrected: Level 4 is Green
            5: 'bg-blue-500',  // Corrected: Level 5 is Blue
        }
        return colors[priority] || 'bg-gray-500'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Servicio de Urgencias</h1>
                        <p className="text-muted-foreground">
                            Gestión de urgencias en tiempo real y evaluación con IA
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setTriageOpen(true)}
                        className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 h-12 px-6"
                        disabled={!aiConfig?.enabled || !aiConfig?.features?.triage}
                    >
                        <div className="mr-4 flex items-center justify-center">
                            <img
                                src="/assets/logoIA.png"
                                alt="AI Logo"
                                className="h-10 w-10 object-contain"
                            />
                        </div>
                        {aiConfig?.enabled && aiConfig?.features?.triage ? 'Evaluación IA' : 'IA Desactivada'}
                    </Button>
                    {hasPermission('EMERGENCY_CREATE') && (
                        <Button
                            onClick={() => setAdmissionOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Admisión
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-red-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pacientes Críticos</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {dashboard?.criticalPatients || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Camas</CardTitle>
                        <Bed className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboard?.beds?.total || 0}</div>
                        <p className="text-xs text-muted-foreground">Capacidad departamento de emergencia</p>
                    </CardContent>
                </Card>

                <Card className="border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Camas Disponibles</CardTitle>
                        <Activity className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {dashboard?.beds?.available || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Listas para nuevos pacientes</p>
                    </CardContent>
                </Card>

                <Card className="border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
                        <Users className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {dashboard?.beds?.total > 0
                                ? Math.round((dashboard.beds.occupied / dashboard.beds.total) * 100)
                                : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Utilización actual de camas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Triaje Modal */}
            {triageOpen && (
                <Card className="border-2 border-primary">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-4">
                                    <div className="flex items-center justify-center p-2">
                                        <img
                                            src="/assets/logoIA.png"
                                            alt="AI Logo"
                                            className="h-20 w-20 object-contain drop-shadow-[0_0_20px_rgba(20,184,166,0.6)]"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-black italic tracking-tighter uppercase">Sistema de Evaluación con IA</span>
                                    </div>
                                </CardTitle>
                                <CardDescription>
                                    Ingrese los síntomas del paciente para evaluación automática de prioridad
                                </CardDescription>
                            </div>
                            <Button variant="ghost" onClick={() => {
                                setTriageOpen(false)
                                setTriageResult(null)
                                setSymptoms('')
                            }}>
                                Cerrar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Síntomas del Paciente</label>
                            <Textarea
                                placeholder="Describa los síntomas en detalle (ej. dolor de pecho, dificultad para respirar, fiebre...)"
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                rows={4}
                                disabled={analyzingTriage}
                            />
                        </div>

                        <Button onClick={analyzeTriage} disabled={analyzingTriage} className="w-full h-14 text-lg font-bold uppercase tracking-tight">
                            {analyzingTriage ? (
                                <>
                                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                                    Analizando...
                                </>
                            ) : (
                                <>
                                    <div className="mr-4 flex items-center justify-center">
                                        <img
                                            src="/assets/logoIA.png"
                                            alt="AI Logo"
                                            className="h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                                        />
                                    </div>
                                    Analizar con IA
                                </>
                            )}
                        </Button>

                        {triageResult && (
                            <div className="mt-6 space-y-4">
                                <div className="p-6 border-2 rounded-lg bg-accent/50">
                                    <h3 className="font-semibold text-lg mb-4">Resultados de Evaluación</h3>

                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Nivel de Prioridad</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className={`h-8 w-8 rounded-full ${getPriorityColor(triageResult.priority)} flex items-center justify-center text-white font-bold`}>
                                                    {triageResult.priority}
                                                </div>
                                                <span className={`text-sm font-semibold px-2 py-1 rounded ${triageResult.color.bg} ${triageResult.color.text}`}>
                                                    {triageResult.color.label}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm text-muted-foreground">Tiempo Est. de Espera</p>
                                            <p className="text-2xl font-bold mt-1">{triageResult.waitTime} min</p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-muted-foreground">Código de Color</p>
                                            <div className={`mt-1 h-8 w-full rounded ${getPriorityColor(triageResult.priority)}`}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold mb-2">Recomendaciones IA:</p>
                                        <ul className="space-y-1">
                                            {triageResult.recommendations.map((rec: string, idx: number) => (
                                                <li key={idx} className="text-sm flex items-start gap-2">
                                                    <span className="text-primary">•</span>
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="er-room">
                        <Bed className="h-4 w-4 mr-2" />
                        Sala de Emergencias
                    </TabsTrigger>
                </TabsList>

                {/* Emergency Room Tab */}
                <TabsContent value="er-room" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <CardTitle>Casos de Emergencia Activos</CardTitle>
                                    <CardDescription>Monitoreo y gestión de pacientes en tiempo real</CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                                        <Input
                                            placeholder="Buscar paciente o cama..."
                                            className="pl-9 bg-zinc-900 border-zinc-800 focus:ring-red-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                        <SelectTrigger className="w-full md:w-40 bg-zinc-900 border-zinc-800">
                                            <Filter className="h-4 w-4 mr-2 text-zinc-500" />
                                            <SelectValue placeholder="Prioridad" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                            <SelectItem value="all">Todas las Prioridades</SelectItem>
                                            <SelectItem value="1">1 - Crítico</SelectItem>
                                            <SelectItem value="2">2 - Urgente</SelectItem>
                                            <SelectItem value="3">3 - Semi-Urgente</SelectItem>
                                            <SelectItem value="4">4 - No Urgente</SelectItem>
                                            <SelectItem value="5">5 - Baja Prioridad</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800 hover:bg-transparent">
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Prioridad</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Cama</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Paciente</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Diagnóstico</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Doctor</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Signos Vitales</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Ingreso</TableHead>
                                        <TableHead className="text-right text-zinc-500 uppercase text-xs font-bold">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPatients.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-zinc-500">
                                                No se encontraron pacientes con los filtros seleccionados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPatients.map((patient) => (
                                            <TableRow key={patient.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-6 w-6 rounded-full ${getPriorityColor(patient.triageLevel || patient.priority)} flex items-center justify-center text-white text-xs font-bold`}>
                                                            {patient.triageLevel || patient.priority}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{patient.bedNumber}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{patient.patientName || patient.name}</p>
                                                        <p className="text-sm text-muted-foreground">{patient.patientAge || patient.age} años</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{patient.diagnosis || patient.chiefComplaint}</TableCell>
                                                <TableCell>{patient.doctorName || patient.doctor}</TableCell>
                                                <TableCell>
                                                    {patient.vitalSigns && (
                                                        <div className="flex gap-3 text-xs">
                                                            <div className="flex items-center gap-1 text-red-500/90" title="Frecuencia Cardíaca">
                                                                <Heart className="h-3 w-3" />
                                                                <span className="font-bold">{patient.vitalSigns.hr ? Math.round(patient.vitalSigns.hr) : '-'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-blue-500/90" title="Presión Arterial">
                                                                <Activity className="h-3 w-3" />
                                                                <span className="font-bold">{patient.vitalSigns.bp || '-'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-orange-500/90" title="Temperatura">
                                                                <Thermometer className="h-3 w-3" />
                                                                <span className="font-bold">{patient.vitalSigns.temp ? parseFloat(patient.vitalSigns.temp).toFixed(1) : '-'}°</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-cyan-500/90" title="Saturación SpO2">
                                                                <Wind className="h-3 w-3" />
                                                                <span className="font-bold">{patient.vitalSigns.spo2 ? Math.round(patient.vitalSigns.spo2) : '-'}%</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-purple-500/90" title="Frecuencia Respiratoria">
                                                                <Droplet className="h-3 w-3" />
                                                                <span className="font-bold">{patient.vitalSigns.rr ?? '-'}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(patient.admissionDate || patient.admittedAt), 'HH:mm')}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        {hasPermission('EMERGENCY_EDIT') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setEditingCase(patient)
                                                                    setAdmissionOpen(true)
                                                                }}
                                                                title="Editar Caso"
                                                            >
                                                                <Pencil className="h-4 w-4 text-blue-500" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/urgencies/${patient.id}`)}
                                                            title="Ver Detalles"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {hasPermission('EMERGENCY_EDIT') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={dischargingId === patient.id}
                                                                className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                                                                onClick={() => setConfirmPatient(patient)}
                                                                title="Dar de Alta"
                                                            >
                                                                {dischargingId === patient.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <LogOut className="h-4 w-4" />
                                                                )}
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
            </Tabs>
            <EmergencyModal
                open={admissionOpen}
                onOpenChange={(open) => {
                    setAdmissionOpen(open)
                    if (!open) setEditingCase(null)
                }}
                initialData={editingCase}
                onSuccess={() => {
                    loadDashboardData()
                    toast({
                        title: "Admisión Exitosa",
                        description: "El paciente ha sido ingresado al sistema de emergencias.",
                    })
                }}
            />

            {/* Diálogo de Confirmación de Alta */}
            <AlertDialog open={!!confirmPatient} onOpenChange={(open) => !open && setConfirmPatient(null)}>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-zinc-100 italic font-bold">¿Confirmar Alta de Paciente?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Estás a punto de dar de alta a <span className="text-white font-semibold">{confirmPatient?.patientName || confirmPatient?.name}</span>.
                            Esta acción cerrará el caso de emergencia y liberará la cama <span className="text-white font-semibold">{confirmPatient?.bedNumber}</span> permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (confirmPatient) handleDischarge(confirmPatient.id)
                                setConfirmPatient(null)
                            }}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
                        >
                            Confirmar Alta
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
