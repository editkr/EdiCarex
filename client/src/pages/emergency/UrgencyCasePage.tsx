import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    ArrowLeft,
    Heart,
    Activity,
    Thermometer,
    Wind,
    Droplet,
    Pill,
    FileText,
    Upload,
    Loader2,
    AlertCircle,
    Building2,
    Trash2,
    Download,
    Edit2,
    File,
    Info,
    ShieldAlert,
    Clock,
    History,
    ChevronRight,
    FlaskConical,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import ReferralModal from '@/components/modals/ReferralModal'
import EmergencyModal from '@/components/modals/EmergencyModal'
import LabOrderModal from '@/components/modals/LabOrderModal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { emergencyAPI, patientsAPI, pharmacyAPI } from '@/services/api'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"

export default function UrgencyCasePage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { hasPermission } = usePermissions()
    const [activeTab, setActiveTab] = useState('vitals')
    const [loading, setLoading] = useState(false)

    const [caseData, setCaseData] = useState<any>(null)
    const [vitalSigns, setVitalSigns] = useState<any[]>([])

    // Estados de datos adicionales
    const [medications, setMedications] = useState<any[]>([])
    const [isLabOrderOpen, setIsLabOrderOpen] = useState(false)
    const [procedures, setProcedures] = useState<any[]>([])
    const [attachments, setAttachments] = useState<any[]>([])
    const [medicalHistory, setMedicalHistory] = useState<any[]>([])
    const [availableMeds, setAvailableMeds] = useState<any[]>([])
    const [inventoryLoading, setInventoryLoading] = useState(false)

    // Modal states
    const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false)
    const [isMedsModalOpen, setIsMedsModalOpen] = useState(false)
    const [isProcsModalOpen, setIsProcsModalOpen] = useState(false)
    const [isDocsModalOpen, setIsDocsModalOpen] = useState(false)
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [referralInitialWard, setReferralInitialWard] = useState<string>('General')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Doc edit state
    const [editingDoc, setEditingDoc] = useState<any>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    // Form Schemas
    const vitalsSchema = z.object({
        hr: z.string().min(1, 'Requerido'),
        bp: z.string().min(1, 'Requerido'),
        temp: z.string().min(1, 'Requerido'),
        spo2: z.string().min(1, 'Requerido'),
        rr: z.string().optional(),
    })

    const medsSchema = z.object({
        name: z.string().min(1, 'Requerido'),
        dosage: z.string().min(1, 'Requerido'),
        route: z.string().min(1, 'Requerido'),
        notes: z.string().optional(),
    })

    const procsSchema = z.object({
        name: z.string().min(1, 'Requerido'),
        description: z.string().optional(),
        result: z.string().optional(),
    })

    const docsSchema = z.object({
        title: z.string().min(1, 'Requerido'),
    })

    const vitalsForm = useForm<z.infer<typeof vitalsSchema>>({
        resolver: zodResolver(vitalsSchema),
        defaultValues: { hr: '', bp: '', temp: '', spo2: '', rr: '18' }
    })

    const medsForm = useForm<z.infer<typeof medsSchema>>({
        resolver: zodResolver(medsSchema),
        defaultValues: { name: '', dosage: '', route: 'IV', notes: '' }
    })

    // Inventory selection state
    const [medSearchOpen, setMedSearchOpen] = useState(false)
    const [selectedMedId, setSelectedMedId] = useState<string | null>(null)

    const procsForm = useForm<z.infer<typeof procsSchema>>({
        resolver: zodResolver(procsSchema),
        defaultValues: { name: '', description: '', result: '' }
    })

    const docsForm = useForm<z.infer<typeof docsSchema>>({
        resolver: zodResolver(docsSchema),
        defaultValues: { title: '' }
    })

    const fetchCaseData = async () => {
        if (!id) return;
        try {
            setLoading(true)
            const res = await emergencyAPI.getCase(id)
            const data = res.data

            // Traducir estados de medicamentos
            const statusMap: any = {
                'PENDING': 'PENDIENTE',
                'APPROVED': 'APROBADO',
                'REJECTED': 'RECHAZADO',
                'DISPENSED': 'DESPACHADO'
            }

            // Traducir género
            const genderMap: Record<string, string> = {
                'MALE': 'Masculino',
                'FEMALE': 'Femenino',
                'OTHER': 'Otro',
                'Unknown': 'Desconocido'
            }

            setCaseData({
                id: data.id,
                patient: {
                    name: data.patient?.firstName ? `${data.patient.firstName} ${data.patient.lastName}` : data.patientName,
                    age: data.patient?.dateOfBirth ?
                        new Date().getFullYear() - new Date(data.patient.dateOfBirth).getFullYear() :
                        data.patientAge,
                    gender: genderMap[data.patient?.gender] || 'Desconocido',
                    bloodType: data.patient?.bloodType || 'NR',
                },
                admission: {
                    date: new Date(data.admissionDate),
                    bedNumber: data.bedNumber || 'Sin asignar',
                    priority: data.triageLevel,
                    diagnosis: data.diagnosis || 'Pendiente de diagnóstico',
                    chiefComplaint: data.chiefComplaint,
                    vitalSigns: data.vitalSigns || null, // [NEW] Keep track of admission vitals
                },
                staff: {
                    name: data.healthStaff?.user ? `${data.healthStaff.user.firstName} ${data.healthStaff.user.lastName}` : data.doctorName || 'Sin asignar',
                    specialty: data.healthStaff?.specialty?.name || data.healthStaff?.specialization || 'Medicina de Emergencias',
                },
                patientId: data.patientId,
                staffId: data.healthStaffId || data.doctorId,
                bedId: data.bedId,
                notes: data.notes,
                raw: data // For the modal to have everything it needs
            })

            // Fetch medical history for the patient
            if (data.patientId) {
                const historyRes = await patientsAPI.getMedicalHistory(data.patientId)
                setMedicalHistory(historyRes.data)
            }

            let history: any[] = []

            if (data.vitalSignsHistory && data.vitalSignsHistory.length > 0) {
                history = data.vitalSignsHistory.map((vs: any) => ({
                    time: new Date(vs.createdAt),
                    heartRate: Math.round(vs.hr || 0),
                    bloodPressure: vs.bp || '--/--',
                    temperature: vs.temp ? Number(vs.temp).toFixed(1) : 0,
                    spo2: Math.round(vs.spo2 || 0),
                    respiratoryRate: vs.rr || 18,
                }))
            } else if (data.vitalSigns && typeof data.vitalSigns === 'object') {
                // [SENIOR FALLBACK] Use admission vitals if history is empty
                history = [{
                    time: new Date(data.admissionDate || data.createdAt),
                    heartRate: Math.round(data.vitalSigns.hr || 0),
                    bloodPressure: data.vitalSigns.bp || '--/--',
                    temperature: data.vitalSigns.temp ? Number(data.vitalSigns.temp).toFixed(1) : 0,
                    spo2: Math.round(data.vitalSigns.spo2 || 0),
                    respiratoryRate: data.vitalSigns.rr || 18,
                }]
            }

            setVitalSigns(history)

            // Auto-fill form with last vitals as reference
            if (history.length > 0) {
                const last = history[0];
                vitalsForm.reset({
                    hr: last.heartRate.toString(),
                    bp: last.bloodPressure,
                    temp: last.temperature.toString(),
                    spo2: last.spo2.toString(),
                    rr: last.respiratoryRate.toString()
                })
            }

            if (data.medications) setMedications(data.medications)
            if (data.procedures) setProcedures(data.procedures)
            if (data.attachments) setAttachments(data.attachments)

        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'No se pudo cargar el caso',
                variant: 'destructive'
            })
            navigate('/urgencies')
        } finally {
            setLoading(false)
        }
    }

    const fetchInventory = async () => {
        try {
            setInventoryLoading(true)
            const res = await pharmacyAPI.getMedications()
            // The API returns { data: { data: [...] } } or { data: [...] }
            const meds = res.data?.data?.data || res.data?.data || res.data || []
            setAvailableMeds(meds)
        } catch (error) {
            console.error('Error fetching inventory:', error)
        } finally {
            setInventoryLoading(false)
        }
    }

    useEffect(() => {
        fetchCaseData()
        fetchInventory()
    }, [id, navigate, toast])

    const handleAddVitals = async (values: z.infer<typeof vitalsSchema>) => {
        if (!id) return
        try {
            setIsSubmitting(true)
            await emergencyAPI.addVitalSign(id, values)
            toast({ title: 'Éxito', description: 'Signos vitales registrados correctamente' })
            setIsVitalsModalOpen(false)
            vitalsForm.reset()
            fetchCaseData()
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo registrar', variant: 'destructive' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddMed = async (values: z.infer<typeof medsSchema>) => {
        if (!id) return
        try {
            setIsSubmitting(true)
            // Add medicationId to payload if selected from list
            const payload = {
                ...values,
                medicationId: selectedMedId
            }
            await emergencyAPI.addMedication(id, payload)
            toast({ title: 'Éxito', description: 'Medicamento registrado' })
            setIsMedsModalOpen(false)
            medsForm.reset()
            setSelectedMedId(null)
            fetchCaseData()
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo registrar', variant: 'destructive' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddProc = async (values: z.infer<typeof procsSchema>) => {
        if (!id) return
        try {
            setIsSubmitting(true)
            await emergencyAPI.addProcedure(id, values)
            toast({ title: 'Éxito', description: 'Procedimiento registrado' })
            setIsProcsModalOpen(false)
            procsForm.reset()
            fetchCaseData()
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo registrar', variant: 'destructive' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleTransfer = (targetWard: string) => {
        setReferralInitialWard(targetWard)
        setIsReferralModalOpen(true)
    }

    const handleAddDoc = async (values: z.infer<typeof docsSchema>) => {
        if (!id) return
        try {
            setIsSubmitting(true)

            if (editingDoc) {
                // Rename mode
                await emergencyAPI.updateAttachment(editingDoc.id, { title: values.title })
                toast({ title: 'Éxito', description: 'Documento renombrado' })
            } else {
                // Upload mode
                if (!selectedFile) {
                    toast({ title: 'Error', description: 'Seleccione un archivo', variant: 'destructive' })
                    return
                }

                // 1. Upload file binary
                const uploadRes = await emergencyAPI.uploadFile(selectedFile)
                const { url, type } = uploadRes.data

                // 2. Save metadata
                await emergencyAPI.addAttachment(id, {
                    title: values.title,
                    url: url,
                    type: type.includes('image') ? 'IMAGE' : type.includes('pdf') ? 'PDF' : 'DOCUMENT'
                })

                toast({ title: 'Éxito', description: 'Archivo subido correctamente' })
            }

            setIsDocsModalOpen(false)
            setEditingDoc(null)
            setSelectedFile(null)
            docsForm.reset()
            fetchCaseData()
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo procesar el archivo', variant: 'destructive' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteDoc = async (docId: string) => {
        if (!confirm('¿Confirma que desea eliminar este documento?')) return
        try {
            await emergencyAPI.deleteAttachment(docId)
            toast({ title: 'Éxito', description: 'Documento eliminado' })
            fetchCaseData()
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' })
        }
    }

    const handleDownload = (url: string) => {
        // Assume context is http://localhost:3000
        const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`
        window.open(fullUrl, '_blank')
    }

    const calculateNEWS2 = (vitals: any) => {
        if (!vitals) return { score: 0, risks: [] };
        let score = 0;
        const risks: string[] = [];

        // 1. Respiration Rate
        const rr = parseInt(vitals.respiratoryRate);
        if (rr <= 8 || rr >= 25) { score += 3; risks.push("FR crítica"); }
        else if (rr >= 21 && rr <= 24) { score += 2; risks.push("Taquipnea moderada"); }
        else if (rr >= 9 && rr <= 11) { score += 1; risks.push("FR baja"); }

        // 2. SpO2
        const spo2 = parseInt(vitals.spo2);
        if (spo2 <= 91) { score += 3; risks.push("Desaturación grave"); }
        else if (spo2 >= 92 && spo2 <= 93) { score += 2; risks.push("Desaturación moderada"); }
        else if (spo2 >= 94 && spo2 <= 95) { score += 1; risks.push("Desaturación leve"); }

        // 3. Systolic BP (Extract from "120/80")
        const sys = parseInt(vitals.bloodPressure?.split('/')[0] || "0");
        if (sys <= 90 || sys >= 220) { score += 3; risks.push("PA sistólica crítica"); }
        else if (sys >= 91 && sys <= 100) { score += 2; risks.push("Hipotensión moderada"); }
        else if (sys >= 101 && sys <= 110) { score += 1; risks.push("Hipotensión leve"); }

        // 4. Heart Rate
        const hr = parseInt(vitals.heartRate);
        if (hr <= 40 || hr >= 131) { score += 3; risks.push("FC crítica"); }
        else if (hr >= 111 && hr <= 130) { score += 2; risks.push("Taquicardia moderada"); }
        else if ((hr >= 41 && hr <= 50) || (hr >= 91 && hr <= 110)) { score += 1; risks.push("FC fuera de rango"); }

        // 5. Temperature
        const temp = parseFloat(vitals.temperature);
        if (temp <= 35.0) { score += 3; risks.push("Hipotermia grave"); }
        else if (temp >= 39.1) { score += 2; risks.push("Fiebre alta"); }
        else if (temp <= 36.0 || (temp >= 38.1 && temp <= 39.0)) { score += 1; risks.push("Temp fuera de rango"); }

        return { score, risks };
    }

    if (loading || !caseData) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const getPriorityLabel = (priority: number) => {
        const labels: Record<number, string> = {
            1: 'CRÍTICO',
            2: 'EMERGENCIA',
            3: 'URGENCIA',
            4: 'URGENCIA MENOR',
            5: 'NO URGENTE',
        }
        return labels[priority] || 'DESCONOCIDO'
    }

    const getPriorityColor = (priority: number) => {
        const colors: Record<number, string> = {
            1: 'bg-red-500',
            2: 'bg-orange-500',
            3: 'bg-yellow-500',
            4: 'bg-blue-500',
            5: 'bg-green-500',
        }
        return colors[priority] || 'bg-gray-500'
    }

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/urgencies')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Detalle de Urgencia</h1>
                        <p className="text-muted-foreground">
                            {caseData.patient.name} • Cama {caseData.admission.bedNumber}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {hasPermission('EMERGENCY_EDIT') && (
                        <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar Caso
                        </Button>
                    )}
                    {hasPermission('EMERGENCY_EDIT') && (
                        <Button variant="outline" onClick={() => handleTransfer('General')}>
                            <Building2 className="h-4 w-4 mr-2" />
                            Trasladar a Piso
                        </Button>
                    )}
                </div>
            </div>

            {/* Tarjeta de Información del Paciente */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Paciente</p>
                                <p className="font-medium text-lg">{caseData.patient.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {caseData.patient.age} años • {caseData.patient.gender}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Grupo Sanguíneo</p>
                                <p className="font-medium">{caseData.patient.bloodType}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Hora de Ingreso</p>
                                <p className="font-medium">{format(caseData.admission.date, "d 'de' MMMM, yyyy, HH:mm", { locale: es })}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Número de Cama</p>
                                <p className="font-medium">{caseData.admission.bedNumber}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Prioridad</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`h-6 w-6 rounded-full ${getPriorityColor(caseData.admission.priority)} flex items-center justify-center text-white text-xs font-bold`}>
                                        {caseData.admission.priority}
                                    </div>
                                    <span className={cn(
                                        "text-xs px-2 py-1 rounded-full font-medium",
                                        caseData.admission.priority === 1 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                                    )}>
                                        {getPriorityLabel(caseData.admission.priority)}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Diagnóstico</p>
                                <p className="font-medium">{caseData.admission.diagnosis}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Personal Tratante</p>
                                <p className="font-medium">{caseData.staff?.name || caseData.staffName || 'Sin asignar'}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70 mt-1">Especialidad</p>
                                <p className="text-sm font-medium text-zinc-300">{caseData.staff?.specialty || 'Especialista'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Motivo de Consulta */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Motivo de Consulta
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">{caseData.admission.chiefComplaint}</p>
                </CardContent>
            </Card>

            {/* Pestañas */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="vitals">
                        <Heart className="h-4 w-4 mr-2" />
                        Signos Vitales
                    </TabsTrigger>
                    <TabsTrigger value="medications">
                        <Pill className="h-4 w-4 mr-2" />
                        Medicamentos
                    </TabsTrigger>
                    <TabsTrigger value="procedures">
                        <Activity className="h-4 w-4 mr-2" />
                        Procedimientos
                    </TabsTrigger>
                    <TabsTrigger value="laboratory">
                        <FlaskConical className="h-4 w-4 mr-2" />
                        Laboratorio
                    </TabsTrigger>
                    <TabsTrigger value="attachments">
                        <FileText className="h-4 w-4 mr-2" />
                        Documentos
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <History className="h-4 w-4 mr-2" />
                        Historial Clínico
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="laboratory">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Órdenes de Laboratorio</CardTitle>
                                    <CardDescription>Gestión de análisis clínicos para urgencias</CardDescription>
                                </div>
                                {hasPermission('LAB_CREATE') && (
                                    <Button onClick={() => setIsLabOrderOpen(true)} className="bg-red-600 hover:bg-red-700 text-white">
                                        <FlaskConical className="h-4 w-4 mr-2" />
                                        Nueva Orden
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50/50">
                                <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                                    <FlaskConical className="h-6 w-6 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">Historial de Laboratorio</h3>
                                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
                                    Las órdenes creadas aparecerán aquí. (Integración con API de laboratorio en proceso)
                                </p>
                                {hasPermission('LAB_CREATE') && (
                                    <Button variant="outline" onClick={() => setIsLabOrderOpen(true)}>
                                        Crear Orden
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="vitals" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Signos Vitales</CardTitle>
                                    <CardDescription>Monitoreo de constantes vitales en tiempo real</CardDescription>
                                </div>
                                {hasPermission('EMERGENCY_EDIT') && (
                                    <Button size="sm" onClick={() => setIsVitalsModalOpen(true)} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
                                        <Activity className="h-4 w-4 mr-2" />
                                        Nueva Toma
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Hora</TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-2">
                                                <Heart className="h-4 w-4" />
                                                Frec. Cardíaca
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4" />
                                                Presión Arterial
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-2">
                                                <Thermometer className="h-4 w-4" />
                                                Temperatura
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-2">
                                                <Wind className="h-4 w-4" />
                                                Saturación (SpO2)
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-2">
                                                <Droplet className="h-4 w-4" />
                                                Frec. Resp.
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vitalSigns.length > 0 ? vitalSigns.map((vital, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">
                                                {format(vital.time, 'HH:mm:ss')}
                                            </TableCell>
                                            <TableCell>
                                                <span className={vital.heartRate > 100 ? 'text-red-600 font-semibold' : ''}>
                                                    {vital.heartRate} bpm
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={vital.bloodPressure.startsWith('14') || vital.bloodPressure.startsWith('15') ? 'text-orange-600 font-semibold' : ''}>
                                                    {vital.bloodPressure} mmHg
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={vital.temperature > 38 ? 'text-red-600 font-semibold' : ''}>
                                                    {vital.temperature}°C
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={vital.spo2 < 95 ? 'text-orange-600 font-semibold' : ''}>
                                                    {vital.spo2}%
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={vital.respiratoryRate > 20 || vital.respiratoryRate < 10 ? 'text-red-500 font-bold' : ''}>
                                                    {vital.respiratoryRate} /min
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                                No hay registros recientes
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="medications" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Medicamentos Administrados</CardTitle>
                                    <CardDescription>Registro completo de medicación</CardDescription>
                                </div>
                                {hasPermission('EMERGENCY_EDIT') && (
                                    <Button size="sm" onClick={() => setIsMedsModalOpen(true)} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
                                        <Pill className="h-4 w-4 mr-2" />
                                        Registrar Medicación
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Hora</TableHead>
                                        <TableHead>Medicamento</TableHead>
                                        <TableHead>Dosis</TableHead>
                                        <TableHead>V vía</TableHead>
                                        <TableHead>Estado Farmacia</TableHead>
                                        <TableHead>Administrado por</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {medications.length > 0 ? medications.map((med, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">
                                                {format(new Date(med.administeredAt), 'HH:mm:ss')}
                                            </TableCell>
                                            <TableCell className="font-semibold text-zinc-100">{med.name}</TableCell>
                                            <TableCell>{med.dosage}</TableCell>
                                            <TableCell>
                                                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs font-medium">
                                                    {med.route}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const order = caseData?.raw?.pharmacyOrders?.find((o: any) =>
                                                        (med.medicationId && o.medicationId === med.medicationId) ||
                                                        (!med.medicationId && o.medicationName === med.name)
                                                    );

                                                    if (!order) return <span className="text-[10px] text-zinc-500 italic">No solicitado</span>;

                                                    const status = order.status;
                                                    const badgeStyles: any = {
                                                        'PENDIENTE': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                                                        'APROBADO': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                                                        'RECHAZADO': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                                                        'PENDING': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                                                        'APPROVED': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                                                        'REJECTED': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                                                    };

                                                    return (
                                                        <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", badgeStyles[status] || 'bg-zinc-500/10 text-zinc-500')}>
                                                            {status === 'PENDING' ? 'PENDIENTE' :
                                                                status === 'APPROVED' ? 'APROBADO' :
                                                                    status === 'REJECTED' ? 'RECHAZADO' : status}
                                                        </Badge>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell>{med.administeredBy || 'Sistema'}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                                                No hay medicamentos registrados para este caso
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="procedures" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Procedimientos</CardTitle>
                                    <CardDescription>Estudios y acciones terapéuticas realizadas</CardDescription>
                                </div>
                                {hasPermission('EMERGENCY_EDIT') && (
                                    <Button size="sm" onClick={() => setIsProcsModalOpen(true)} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
                                        <Activity className="h-4 w-4 mr-2" />
                                        Nuevo Procedimiento
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Hora</TableHead>
                                        <TableHead>Procedimiento</TableHead>
                                        <TableHead>Descripción / Resultado</TableHead>
                                        <TableHead>Realizado por</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {procedures.length > 0 ? procedures.map((proc, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">
                                                {format(new Date(proc.performedAt), 'HH:mm:ss')}
                                            </TableCell>
                                            <TableCell className="font-semibold text-zinc-100">{proc.name}</TableCell>
                                            <TableCell>{proc.description || proc.result || 'Sin detalles'}</TableCell>
                                            <TableCell>{proc.performedBy || 'Sistema'}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                                                No hay procedimientos registrados para este caso
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attachments" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Documentos Adjuntos</CardTitle>
                                    <CardDescription>Informes, imágenes y otros archivos del paciente</CardDescription>
                                </div>
                                {hasPermission('EMERGENCY_EDIT') && (
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setEditingDoc(null)
                                            docsForm.reset()
                                            setIsDocsModalOpen(true)
                                        }}
                                        className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Subir Archivo
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Archivo</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attachments.length > 0 ? attachments.map((doc, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <File className="h-4 w-4 text-zinc-500" />
                                                    <span className="text-zinc-100">{doc.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold">
                                                    {doc.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {format(new Date(doc.createdAt), 'dd/MM/yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                                                        onClick={() => handleDownload(doc.url)}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    {hasPermission('EMERGENCY_EDIT') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                                                            onClick={() => {
                                                                setEditingDoc(doc)
                                                                docsForm.setValue('title', doc.title)
                                                                setIsDocsModalOpen(true)
                                                            }}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission('EMERGENCY_EDIT') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500/50 hover:text-red-500 hover:bg-red-500/10"
                                                            onClick={() => handleDeleteDoc(doc.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                                                No hay documentos vinculados a este caso de emergencia
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle>Historial Clínico Completo</CardTitle>
                                <CardDescription>Registro cronológico de todas las atenciones y derivaciones</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {medicalHistory.length > 0 ? (
                                    <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
                                        {medicalHistory.map((record, idx) => (
                                            <div key={idx} className="relative flex items-start gap-4 group">
                                                <div className="absolute left-0 mt-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 border border-zinc-800 shadow-md transition-all group-hover:border-primary/50 group-hover:shadow-primary/10">
                                                    <FileText className="h-5 w-5 text-zinc-500 group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="ml-14 flex-1 pb-8 border-b border-zinc-900 last:border-0 last:pb-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                        <div>
                                                            <h4 className="font-bold text-zinc-100 flex items-center gap-2">
                                                                {record.treatment?.includes('TRASLADO') ? (
                                                                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Derivación Interna</Badge>
                                                                ) : (
                                                                    <Badge variant="outline">Atención Médica</Badge>
                                                                )}
                                                                {record.diagnosis}
                                                            </h4>
                                                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1 font-medium bg-zinc-900/50 w-fit px-2 py-0.5 rounded border border-zinc-800">
                                                                <Clock className="h-3 w-3" />
                                                                {format(new Date(record.visitDate), "PPP 'a las' HH:mm", { locale: es })}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 pr-2">
                                                            <div className="text-right">
                                                                <p className="text-xs font-bold text-zinc-300">{record.healthStaff?.user ? `${record.healthStaff.user.firstName} ${record.healthStaff.user.lastName}` : (record.doctor?.user ? `${record.doctor.user.firstName} ${record.doctor.user.lastName}` : 'Personal EdiCarex')}</p>
                                                                <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">{record.healthStaff?.specialty || record.doctor?.specialty || 'Especialista'}</p>
                                                            </div>
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs">
                                                                {(record.healthStaff?.user?.firstName || record.doctor?.user?.firstName || 'P').charAt(0)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                                        <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
                                                            <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Motivo / Diagnóstico</span>
                                                            <p className="text-xs text-zinc-300 leading-relaxed italic">"{record.chiefComplaint}"</p>
                                                        </div>
                                                        <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
                                                            <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Indicaciones / Evolución</span>
                                                            <p className="text-xs text-zinc-200 leading-relaxed font-medium">{record.notes}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto opacity-40">
                                            <History className="h-8 w-8 text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="text-zinc-400 font-medium">Sin antecedentes registrados</p>
                                            <p className="text-xs text-zinc-600 mt-1">Este paciente no tiene historial clínico previo en el sistema.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Referencia de Hospitalización Profesional (NEWS2) */}
            {(() => {
                const latestVitals = vitalSigns[0] || null;
                const { score, risks } = calculateNEWS2(latestVitals);
                const isCritical = score >= 5 || caseData.admission.priority <= 2;

                return (
                    <Card className={cn(
                        "border-2 transition-all duration-300",
                        score >= 7 || caseData.admission.priority === 1 ? "border-red-600 bg-red-950/20" :
                            score >= 5 ? "border-orange-500 bg-orange-950/20" :
                                "border-zinc-800 bg-zinc-900/50"
                    )}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <ShieldAlert className={cn(
                                            "h-6 w-6",
                                            score >= 5 ? "text-red-500 animate-pulse" : "text-zinc-400"
                                        )} />
                                        Protocolo de Derivación NEWS2
                                    </CardTitle>
                                    <CardDescription>Evaluación de riesgo clínico basada en constantes vitales actuales</CardDescription>
                                </div>
                                <div className={cn(
                                    "px-4 py-2 rounded-xl border-2 flex flex-col items-center",
                                    score >= 7 ? "border-red-500 bg-red-500/10 text-red-500" :
                                        score >= 5 ? "border-orange-500 bg-orange-500/10 text-orange-500" :
                                            "border-green-500 bg-green-500/10 text-green-500"
                                )}>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent flex flex-col items-center group">
                                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 group-hover:text-primary transition-colors">Puntaje NEWS2</span>
                                                <span className="text-3xl font-black">{score}</span>
                                                <Info className="h-3 w-3 mt-1 text-zinc-600 group-hover:text-primary animate-pulse" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 bg-zinc-950 border-zinc-800 text-zinc-100 p-4">
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-bold text-sm flex items-center gap-2">
                                                        <ShieldAlert className="h-4 w-4 text-primary" />
                                                        ¿Qué significa este puntaje?
                                                    </h4>
                                                    <p className="text-xs text-zinc-400 mt-1">
                                                        NEWS2 es el estándar mundial para detectar pacientes en riesgo. Suma puntos según la alteración de signos vitales.
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                                        <span className="font-bold w-12 text-green-500">0-4</span>
                                                        <span className="text-zinc-500 font-medium">Estable (Bajo riesgo)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                                                        <span className="font-bold w-12 text-orange-500">5-6</span>
                                                        <span className="text-zinc-500 font-medium">Urgencia (Riesgo medio)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <div className="h-2 w-2 rounded-full bg-red-500" />
                                                        <span className="font-bold w-12 text-red-500">7+</span>
                                                        <span className="text-zinc-500 font-medium">Emergencia (Riesgo alto)</span>
                                                    </div>
                                                </div>
                                                <div className="pt-2 border-t border-zinc-800">
                                                    <p className="text-[10px] italic text-zinc-500">
                                                        * Este sistema automatiza la seguridad y reduce el error humano en la clínica.
                                                    </p>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center font-bold",
                                            caseData.admission.priority <= 2 ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-400"
                                        )}>
                                            {caseData.admission.priority}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Prioridad de Triaje</p>
                                            <p className="text-xs text-muted-foreground">{getPriorityLabel(caseData.admission.priority)}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-800">
                                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                            <Info className="h-4 w-4 text-primary" />
                                            Análisis de Estabilidad
                                        </h4>
                                        <div className="space-y-2">
                                            {risks.length > 0 ? risks.map((r, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-red-400">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {r}
                                                </div>
                                            )) : (
                                                <div className="text-xs text-green-400 flex items-center gap-2">
                                                    <Activity className="h-3 w-3" />
                                                    Parámetros dentro de rangos basales
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-tighter text-zinc-500">Destino Recomendado</Label>
                                        <div className={cn(
                                            "p-4 rounded-lg border-2",
                                            isCritical ? "border-red-500/30 bg-red-500/5 text-red-500" : "border-zinc-800 bg-zinc-900 text-zinc-300"
                                        )}>
                                            <p className="font-bold text-lg flex items-center gap-2">
                                                <Building2 className="h-5 w-5" />
                                                {isCritical ? "Unidad de Cuidados Intensivos (UCI)" : "Hospitalización General"}
                                            </p>
                                            <p className="text-xs mt-1 opacity-80 italic">
                                                * Basado en algoritmos de soporte vital avanzado y puntaje de alerta temprana.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-6">
                                        <Button
                                            className={cn(
                                                "flex-1 h-12 text-sm font-bold",
                                                isCritical ? "bg-red-600 hover:bg-red-700 text-white" : "bg-orange-600 hover:bg-orange-700 text-white"
                                            )}
                                            onClick={() => handleTransfer(isCritical ? 'UCI' : 'General')}
                                        >
                                            {isCritical ? <Activity className="mr-2 h-4 w-4" /> : <Building2 className="mr-2 h-4 w-4" />}
                                            Ejecutar Traslado Sugerido
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-12 px-6 border-zinc-700 hover:bg-zinc-800"
                                            onClick={() => handleTransfer(isCritical ? 'General' : 'UCI')}
                                        >
                                            Omitir Lógica
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })()}

            {/* MODALES DE ACCIÓN */}

            {/* Modal Vitals */}
            <Dialog open={isVitalsModalOpen} onOpenChange={setIsVitalsModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Nueva Toma de Signos Vitales</DialogTitle>
                        <DialogDescription className="text-zinc-400 font-medium">Ingrese los valores actuales del paciente.</DialogDescription>
                    </DialogHeader>
                    <Form {...vitalsForm}>
                        <form onSubmit={vitalsForm.handleSubmit(handleAddVitals)} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={vitalsForm.control} name="hr" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>F. Cardíaca (bpm)</FormLabel>
                                        <FormControl><Input placeholder="80" {...field} className="bg-zinc-900 border-zinc-700" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={vitalsForm.control} name="bp" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>P. Arterial (mmHg)</FormLabel>
                                        <FormControl><Input placeholder="120/80" {...field} className="bg-zinc-900 border-zinc-700" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={vitalsForm.control} name="temp" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Temp (°C)</FormLabel>
                                        <FormControl><Input placeholder="36.5" {...field} className="bg-zinc-900 border-zinc-700" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={vitalsForm.control} name="spo2" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SpO2 (%)</FormLabel>
                                        <FormControl><Input placeholder="98" {...field} className="bg-zinc-900 border-zinc-700" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={vitalsForm.control} name="rr" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>F. Resp. (/min)</FormLabel>
                                        <FormControl><Input placeholder="18" {...field} className="bg-zinc-900 border-zinc-700" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <Button type="submit" className="w-full bg-zinc-100 text-zinc-950" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Guardar Signos Vitales
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Modal Medicación */}
            <Dialog open={isMedsModalOpen} onOpenChange={setIsMedsModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle>Registrar Administación de Medicamento</DialogTitle>
                        <DialogDescription className="text-zinc-400">Complete los detalles de la dosis y vía de administración.</DialogDescription>
                    </DialogHeader>
                    <Form {...medsForm}>
                        <form onSubmit={medsForm.handleSubmit(handleAddMed)} className="space-y-4 py-4">
                            <FormField control={medsForm.control} name="name" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Medicamento</FormLabel>
                                    <Popover open={medSearchOpen} onOpenChange={setMedSearchOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={medSearchOpen}
                                                    className={cn(
                                                        "w-full justify-between bg-zinc-900 border-zinc-700 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value
                                                        ? availableMeds.find((med: any) => med.name === field.value)?.name || field.value
                                                        : "Seleccione un medicamento..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0 bg-zinc-900 border-zinc-800" align="start">
                                            <Command className="bg-zinc-900">
                                                <CommandInput placeholder="Buscar medicamento..." className="h-9" />
                                                <CommandList>
                                                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                                    <CommandGroup>
                                                        {availableMeds.map((med: any) => (
                                                            <CommandItem
                                                                key={med.id}
                                                                value={med.name}
                                                                onSelect={() => {
                                                                    medsForm.setValue("name", med.name)
                                                                    setSelectedMedId(med.id)
                                                                    setMedSearchOpen(false)
                                                                }}
                                                                className="flex items-center justify-between cursor-pointer hover:bg-zinc-800"
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-zinc-100">{med.name}</span>
                                                                    <span className="text-xs text-zinc-500">{med.manufacturer || med.laboratory || 'Genérico'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className={cn(
                                                                        "text-[10px] px-1 py-0",
                                                                        med.currentStock > med.minStock ? "border-emerald-500/50 text-emerald-500" :
                                                                            med.currentStock > 0 ? "border-orange-500/50 text-orange-500" :
                                                                                "border-red-500/50 text-red-500"
                                                                    )}>
                                                                        {med.currentStock} und
                                                                    </Badge>
                                                                    <Check
                                                                        className={cn(
                                                                            "h-4 w-4",
                                                                            field.value === med.name ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={medsForm.control} name="dosage" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dosis</FormLabel>
                                        <FormControl><Input placeholder="500mg" {...field} className="bg-zinc-900 border-zinc-700" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={medsForm.control} name="route" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vía</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-zinc-900 border-zinc-700">
                                                    <SelectValue placeholder="Seleccione vía" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                                <SelectItem value="ORAL">Oral</SelectItem>
                                                <SelectItem value="IV">Intravenosa (IV)</SelectItem>
                                                <SelectItem value="IM">Intramuscular (IM)</SelectItem>
                                                <SelectItem value="SC">Subcutánea</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <Button type="submit" className="w-full bg-zinc-100 text-zinc-950" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Registrar Medicación
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Modal Procedimiento */}
            <Dialog open={isProcsModalOpen} onOpenChange={setIsProcsModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle>Registrar Procedimiento</DialogTitle>
                        <DialogDescription className="text-zinc-400">Registre los detalles de intervenciones o estudios realizados.</DialogDescription>
                    </DialogHeader>
                    <Form {...procsForm}>
                        <form onSubmit={procsForm.handleSubmit(handleAddProc)} className="space-y-4 py-4">
                            <FormField control={procsForm.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Procedimiento</FormLabel>
                                    <FormControl><Input placeholder="Ej. Sutura de herida, EKG" {...field} className="bg-zinc-900 border-zinc-700" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={procsForm.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción / Notas</FormLabel>
                                    <FormControl><Textarea {...field} className="bg-zinc-900 border-zinc-700" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" className="w-full bg-zinc-100 text-zinc-950" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Registrar Procedimiento
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Modal Documentos */}
            <Dialog open={isDocsModalOpen} onOpenChange={(open) => {
                setIsDocsModalOpen(open)
                if (!open) {
                    setEditingDoc(null)
                    setSelectedFile(null)
                    docsForm.reset()
                }
            }}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle>
                            {editingDoc ? 'Renombrar Documento' : 'Subir Nuevo Documento'}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">Adjunte archivos clínicos, imágenes o informes al caso.</DialogDescription>
                    </DialogHeader>
                    <Form {...docsForm}>
                        <form onSubmit={docsForm.handleSubmit(handleAddDoc)} className="space-y-4 py-4">
                            <FormField control={docsForm.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título del Documento</FormLabel>
                                    <FormControl><Input placeholder="Ej. Radiografía de Tórax" {...field} className="bg-zinc-900 border-zinc-700" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {!editingDoc && (
                                <div className="space-y-2">
                                    <Label>Seleccionar Archivo</Label>
                                    <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-dashed border-zinc-700 rounded-lg">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                        >
                                            {selectedFile ? 'Cambiar Archivo' : 'Elegir de Mi PC'}
                                        </Button>
                                        <span className="text-xs text-zinc-400 truncate max-w-[200px]">
                                            {selectedFile ? selectedFile.name : 'Ningún archivo seleccionado'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-zinc-100 text-zinc-950" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {editingDoc ? 'Guardar Cambios' : 'Subir Documento'}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            {caseData && (
                <ReferralModal
                    isOpen={isReferralModalOpen}
                    onClose={() => setIsReferralModalOpen(false)}
                    caseId={id!}
                    patientName={caseData.patient.name}
                    currentVitals={vitalSigns[0]}
                    news2Score={calculateNEWS2(vitalSigns[0]).score}
                    isCritical={calculateNEWS2(vitalSigns[0]).score >= 5 || caseData.admission.priority <= 2}
                    staffName={caseData.staff?.name || caseData.staffName}
                    staffSpecialty={caseData.staff?.specialty || caseData.staffSpecialty}
                    initialWard={referralInitialWard}
                    onSuccess={() => navigate(`/beds?ward=${referralInitialWard}`)}
                />
            )}

            {isEditModalOpen && (
                <EmergencyModal
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    initialData={caseData.raw}
                    onSuccess={fetchCaseData}
                />
            )}

            <LabOrderModal
                open={isLabOrderOpen}
                onOpenChange={setIsLabOrderOpen}
                defaultPatientId={caseData?.patient?.id}
                defaultStaffId={caseData?.staff?.id || caseData?.staffId}
                onSuccess={fetchCaseData}
            />
        </div>
    )
}
