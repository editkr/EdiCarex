import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { patientsAPI, appointmentsAPI, emergencyAPI, laboratoryAPI, pharmacyAPI, aiAPI, sisAPI } from '@/services/api'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from "lucide-react"
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, ArrowLeft, User, FileText, Calendar, Pill, Edit, Download, Shield, Plus, FlaskConical, AlertTriangle, Key, Loader2, Phone, Mail, MapPin, StickyNote, Paperclip, Activity, Trash2, Clock, Bed, Heart, Thermometer, Wind, FileSignature } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'
import { usePermissions } from '@/hooks/usePermissions'
import PatientModal from '@/components/modals/PatientModal'
import AddDiagnosisModal from '@/components/modals/AddDiagnosisModal'
import AddEncounterModal from '@/components/modals/AddEncounterModal'
import AppointmentModal from '@/components/modals/AppointmentModal'
import EmergencyModal from '@/components/modals/EmergencyModal'
import { AddNoteModal } from '@/components/modals/AddNoteModal'
import { AddDocumentModal } from '@/components/modals/AddDocumentModal'
import LabOrderModal from '@/components/modals/LabOrderModal'
import AddMinsaProgramModal from '@/components/modals/AddMinsaProgramModal'
import { useOrganization } from '@/contexts/OrganizationContext'


const MODEL_DISPLAY_NAMES: Record<string, string> = {
    'llama-3.3-70b-versatile': 'Meta Llama 3.3 70B (Producción)',
    'llama-3.1-8b-instant': 'Meta Llama 3.1 8B (Instantáneo)',
    'openai/gpt-oss-120b': 'OpenAI GPT OSS 120B (Flagship)',
    'groq/compound': 'Groq Compound (Sistema Agente)',
    'groq/compound-mini': 'Groq Compound Mini',
    'qwen/qwen3-32b': 'Qwen 3 32B (Preview)',
};

export default function PatientProfilePage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { hasPermission } = usePermissions()
    const { config } = useOrganization()
    const [activeTab, setActiveTab] = useState('general')
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [addDiagnosisOpen, setAddDiagnosisOpen] = useState(false)
    const [addEncounterOpen, setAddEncounterOpen] = useState(false)
    const [createAppointmentOpen, setCreateAppointmentOpen] = useState(false)
    const [addLabOrderOpen, setAddLabOrderOpen] = useState(false)
    const [addEmergencyOpen, setAddEmergencyOpen] = useState(false)
    const [showPortalModal, setShowPortalModal] = useState(false)
    const [credentials, setCredentials] = useState<{ email: string, password: string } | null>(null)
    const [addMedicationOpen, setAddMedicationOpen] = useState(false)
    const [addMinsaProgramOpen, setAddMinsaProgramOpen] = useState(false)

    // AI States
    const [summarizing, setSummarizing] = useState(false)
    const [aiSummary, setAiSummary] = useState<string | null>(null)
    const [aiModel, setAiModel] = useState<string | null>(null)
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)

    const handleAISummarize = async () => {
        if (!combinedHistory || combinedHistory.length === 0) {
            toast({ title: 'Aviso', description: 'No hay suficiente historial para resumir.' })
            return
        }
        try {
            setSummarizing(true)
            const textToSummarize = combinedHistory.map((h: any) =>
                `Fecha: ${h.date || h.createdAt}. Tipo: ${h.type}. Notas: ${h.notes || h.description}. Tratamiento: ${h.treatment || 'N/A'}`
            ).join('\n---\n')

            const response = await aiAPI.summarize(textToSummarize)
            setAiSummary(response.data.summary)
            setAiModel(response.data.model)
            setIsSummaryModalOpen(true)
        } catch (error) {
            toast({
                title: 'Error de IA',
                description: 'No se pudo generar el resumen clínico.',
                variant: 'destructive'
            })
        } finally {
            setSummarizing(false)
        }
    }
    const [medSearchOpen, setMedSearchOpen] = useState(false)
    const [selectedMedId, setSelectedMedId] = useState<string | null>(null)
    const [addNoteOpen, setAddNoteOpen] = useState(false)
    const [addDocumentOpen, setAddDocumentOpen] = useState(false)
    const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)

    // ... (existing useQuery hooks)

    const handleDeleteDocument = async () => {
        if (!documentToDelete || !id) return
        try {
            await patientsAPI.deleteDocument(id, documentToDelete)
            toast({
                title: 'Documento eliminado',
                description: 'El archivo se ha eliminado correctamente.',
            })
            refetchDocuments()
        } catch (error) {
            console.error('Error deleting document:', error)
            toast({
                title: 'Error',
                description: 'No se pudo eliminar el documento.',
                variant: 'destructive',
            })
        } finally {
            setDocumentToDelete(null)
        }
    }
    const [newMedication, setNewMedication] = useState({ name: '', dosage: '', frequency: '', instructions: '', startDate: new Date().toISOString().split('T')[0] })

    const [validatingSIS, setValidatingSIS] = useState(false)

    const handleValidateSIS = async () => {
        if (!patientData?.data?.documentNumber) {
            toast({ title: 'Error', description: 'El paciente no tiene un DNI registrado.', variant: 'destructive' })
            return
        }
        try {
            setValidatingSIS(true)
            await sisAPI.validate({ documentType: '1', documentNumber: patientData.data.documentNumber })

            toast({
                title: 'Afiliación SIS verificada correctamente',
                description: 'Los datos del SIS han sido actualizados exitosamente.'
            })

            refetch()
        } catch (error: any) {
            toast({
                title: 'Error de validación',
                description: error.response?.data?.message || 'No se pudo validar el SIS.',
                variant: 'destructive',
            })
        } finally {
            setValidatingSIS(false)
        }
    }

    const handleEnablePortal = async (e: any) => {
        e.preventDefault() // prevent dialog from closing automatically
        try {
            const res = await patientsAPI.enablePortal(id!)
            setCredentials(res.data.credentials)
            toast({
                title: "Acceso Habilitado",
                description: "Las credenciales han sido generadas correctamente.",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo habilitar el acceso. Intente nuevamente.",
                variant: 'destructive'
            })
            setShowPortalModal(false)
        }
    }

    // Cargar datos del paciente
    const { data: patientData, isLoading, refetch } = useQuery({
        queryKey: ['patient', id],
        queryFn: () => patientsAPI.getOne(id!),
        enabled: !!id,
    })

    // Cargar citas del paciente (Filtrado por ID)
    const { data: appointmentsData, refetch: refetchAppointments } = useQuery({
        queryKey: ['patient-appointments', id],
        queryFn: () => appointmentsAPI.getAll({ patientId: id }),
        enabled: !!id,
    })

    // Cargar historial de urgencias (API original emergencyAPI)
    const { data: emergencyData, refetch: refetchEmergencies } = useQuery({
        queryKey: ['patient-emergency', id],
        queryFn: () => emergencyAPI.getPatientHistory(id!),
        enabled: !!id,
    })

    // Cargar SIS Validation History
    const { data: sisHistoryData } = useQuery({
        queryKey: ['patient-sis', id],
        queryFn: () => sisAPI.getHistory(id!),
        enabled: !!id,
    })

    // Cargar MINSA Programs
    const { data: minsaProgramsData } = useQuery({
        queryKey: ['patient-minsa', id],
        queryFn: () => patientsAPI.getMinsaPrograms(id!),
        enabled: !!id,
    })

    // Cargar ordenes de laboratorio
    const { data: labData, refetch: refetchLabOrders } = useQuery({
        queryKey: ['patient-lab', id],
        queryFn: () => laboratoryAPI.getOrders({ patientId: id }),
        enabled: !!id,
    })



    // Cargar historial médico
    const { data: historyData, refetch: refetchHistory } = useQuery({
        queryKey: ['patient-history', id],
        queryFn: () => patientsAPI.getMedicalHistory(id!),
        enabled: !!id,
    })

    // Cargar diagnósticos (para mostrar en historial también)
    const { data: diagnosesData, refetch: refetchDiagnoses } = useQuery({
        queryKey: ['patient-diagnoses', id],
        queryFn: () => patientsAPI.getDiagnoses(id!),
        enabled: !!id,
    })

    // Cargar recetas/medicamentos
    const { data: medicationsData, refetch: refetchMedications } = useQuery({
        queryKey: ['patient-medications', id],
        queryFn: () => patientsAPI.getMedications(id!),
        enabled: !!id,
    })

    // Cargar inventario de farmacia
    const { data: inventoryData } = useQuery({
        queryKey: ['pharmacy-inventory'],
        queryFn: () => pharmacyAPI.getMedications(),
    })
    const availableMeds = inventoryData?.data?.data || inventoryData?.data || []

    // Cargar documentos
    const { data: documentsData, refetch: refetchDocuments } = useQuery({
        queryKey: ['patient-documents', id],
        queryFn: () => patientsAPI.getDocuments(id!),
        enabled: !!id,
    })

    const patient = patientData?.data
    // Handle different API response structures (array vs {data: [] })
    const appointments = appointmentsData?.data?.data || appointmentsData?.data || []
    const emergencies = emergencyData?.data || []
    const labOrders = labData?.data?.data || labData?.data || []

    const getLifeStageBadge = (stage: string) => {
        switch (stage?.toUpperCase()) {
            case 'NIÑO': return 'bg-sky-100 text-sky-800 border-sky-200'
            case 'ADOLESCENTE': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            case 'JOVEN': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
            case 'ADULTO': return 'bg-slate-100 text-slate-800 border-slate-200'
            case 'ADULTO_MAYOR': return 'bg-stone-100 text-stone-800 border-stone-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }



    // Merge medical records and diagnoses for a complete history
    const medicalRecords = historyData?.data || []
    const diagnoses = diagnosesData?.data || []

    const combinedHistory = [
        ...medicalRecords.map((r: any) => ({ ...r, type: 'RECORD', date: r.visitDate })),
        ...diagnoses.map((d: any) => ({
            ...d,
            type: 'DIAGNOSIS',
            date: d.diagnosedDate,
            condition: d.diagnosisName, // Map for UI consistency
            diagnosis: d.diagnosisName
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Filter relevant records for the Notes tab
    const clinicalNotes = medicalRecords.filter((r: any) => r.diagnosis === 'Nota Clínica' || r.chiefComplaint)
        .sort((a: any, b: any) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())

    const medications = medicationsData?.data || []
    const documents = documentsData?.data || []
    const sisHistory = sisHistoryData?.data || []
    const minsaPrograms = minsaProgramsData?.data || []

    const calculateAge = (dateOfBirth: string) => {
        if (!dateOfBirth) return 'N/A'
        const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear()
        return age
    }

    const handleEditSuccess = () => {
        refetch()
        setEditModalOpen(false)
        toast({ title: 'Perfil actualizado', description: 'Los datos del paciente han sido actualizados.' })
    }

    const handleDownload = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Expediente Médico - ${patient.firstName} ${patient.lastName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; }
                        h1 { color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
                        h2 { color: #334155; margin-top: 30px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                        th { background-color: #f1f5f9; }
                        .section { margin-bottom: 30px; }
                    </style>
                </head>
                <body>
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px;">
                        <div>
                            ${config?.logo ? `<img src="${config.logo}" alt="Logo" style="height: 50px;" />` : `<h1 style="margin: 0; color: #1e40af;">Centro de Salud Jorge Chávez | IPRESS 00003308</h1>`}
                            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Jr. Ancash S/N, Juliaca, San Román, Puno</p>
                        </div>
                        <div style="text-align: right;">
                            <h2 style="margin: 0; color: #334155; font-size: 18px;">Expediente Médico Electrónico</h2>
                            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Generado: ${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div class="section">
                        <h2>Datos del Paciente</h2>
                        <table>
                            <tr><th>Nombre Completo</th><td>${patient.firstName} ${patient.lastName}</td></tr>
                            <tr><th>Documento</th><td>${patient.documentId || patient.documentNumber || 'N/A'}</td></tr>
                            <tr><th>Fecha de Nacimiento</th><td>${patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'dd/MM/yyyy') : 'N/A'}</td></tr>
                            <tr><th>Edad</th><td>${calculateAge(patient.dateOfBirth)} años</td></tr>
                            <tr><th>Género</th><td>${patient.gender === 'FEMALE' ? 'Femenino' : patient.gender === 'MALE' ? 'Masculino' : 'Otro'}</td></tr>
                            <tr><th>Tipo de Sangre</th><td>${patient.bloodType || 'N/A'}</td></tr>
                            <tr><th>Teléfono</th><td>${patient.phone || 'N/A'}</td></tr>
                            <tr><th>Email</th><td>${patient.email || 'N/A'}</td></tr>
                            <tr><th>Dirección</th><td>${patient.address || 'N/A'}</td></tr>
                            <tr><th>Alergias</th><td>${patient.allergies || 'Ninguna'}</td></tr>
                        </table>
                    </div>
                    <div class="section">
                        <h2>Historial Médico</h2>
                        ${combinedHistory.length > 0 ? `
                            <table>
                                <tr><th>Fecha</th><th>Tipo</th><th>Diagnóstico</th><th>Tratamiento</th></tr>
                                ${combinedHistory.map((record: any) => `
                                    <tr>
                                        <td>${record.date ? format(new Date(record.date), 'dd/MM/yyyy') : 'N/A'}</td>
                                        <td>${record.type === 'DIAGNOSIS' ? 'Diagnóstico' : 'Consulta'}</td>
                                        <td>${record.diagnosis || record.diagnosisName || 'N/A'}</td>
                                        <td>${record.treatment || record.notes || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </table>
                        ` : '<p>No hay registros médicos disponibles</p>'}
                    </div>
                    <div class="section">
                        <h2>Medicamentos Actuales</h2>
                        ${medications.length > 0 ? `
                            <table>
                                <tr><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th></tr>
                                ${medications.map((med: any) => `
                                    <tr>
                                        <td>${med.name || 'N/A'}</td>
                                        <td>${med.dosage || 'N/A'}</td>
                                        <td>${med.frequency || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </table>
                        ` : '<p>No hay medicamentos registrados</p>'}
                    </div>
                    <div style="margin-top: 50px; text-align: center; color: #64748b; font-size: 12px;">
                        <p>Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')} — Centro de Salud Jorge Chávez IPRESS 00003308</p>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!patient) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <p className="text-muted-foreground">Paciente no encontrado</p>
                <Button onClick={() => navigate('/patients')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a Pacientes
                </Button>
            </div>
        )
    }

    const pastAppointments = appointments.filter((apt: any) =>
        new Date(apt.appointmentDate) < new Date() || apt.status === 'COMPLETED'
    )
    const futureAppointments = appointments.filter((apt: any) =>
        new Date(apt.appointmentDate) >= new Date() && apt.status !== 'COMPLETED'
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/patients')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {patient.firstName} {patient.lastName}
                        </h1>
                        <p className="text-muted-foreground">
                            ID de Paciente: {patient.documentNumber || patient.id}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50" onClick={handleValidateSIS} disabled={validatingSIS}>
                        {validatingSIS ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                        Validar SIS
                    </Button>
                    <Button variant="outline" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Registros
                    </Button>
                    {!patient.userId ? (
                        <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50" onClick={() => setShowPortalModal(true)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Habilitar Portal
                        </Button>
                    ) : (
                        <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50" onClick={() => setShowPortalModal(true)}>
                            <Key className="h-4 w-4 mr-2" />
                            Restablecer Acceso
                        </Button>
                    )}
                    <Button onClick={() => setEditModalOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Perfil
                    </Button>
                </div>
            </div>

            {/* Credential Modal */}
            <AlertDialog open={showPortalModal} onOpenChange={setShowPortalModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Habilitar Acceso al Portal</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro? Esto creará una cuenta de usuario para <b>{patient.firstName} {patient.lastName}</b> y generará credenciales de acceso.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {credentials ? (
                        <div className="my-4 p-4 bg-slate-100 rounded-md border border-slate-200">
                            <p className="font-semibold text-sm mb-2 text-slate-700">Credenciales Generadas:</p>
                            <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                                <span className="text-muted-foreground">Usuario:</span>
                                <code className="bg-white px-2 py-0.5 rounded border">{credentials.email}</code>
                                <span className="text-muted-foreground">Pass:</span>
                                <code className="bg-white px-2 py-0.5 rounded border">{credentials.password}</code>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                * Copia estas credenciales y entrégalas al paciente. No se volverán a mostrar.
                            </p>
                        </div>
                    ) : null}
                    <AlertDialogFooter>
                        {!credentials ? (
                            <>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleEnablePortal}>
                                    Generar Acceso
                                </AlertDialogAction>
                            </>
                        ) : (
                            <AlertDialogAction onClick={() => { setShowPortalModal(false); setCredentials(null); refetch(); }}>
                                Cerrar y Actualizar
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Patient Header Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        {patient.photo && patient.photo.length > 10 ? (
                            <>
                                <img
                                    src={patient.photo}
                                    alt="Profile"
                                    className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg relative z-10 bg-white"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = document.getElementById('profile-fallback');
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                                <div id="profile-fallback" style={{ display: 'none' }} className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg absolute">
                                    {patient.firstName?.[0]}{patient.lastName?.[0]}
                                </div>
                            </>
                        ) : (
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg">
                                {patient.firstName?.[0]}{patient.lastName?.[0]}
                            </div>
                        )}

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{patient.phone || 'Sin teléfono'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{patient.email || 'Sin email'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{patient.address || 'Sin dirección'}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Género</p>
                                    <p className="font-medium">{patient.gender || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Etapa de Vida</p>
                                    <Badge variant="outline" className={`mt-1 text-[10px] h-5 px-2 ${getLifeStageBadge(patient.lifeStage)}`}>
                                        {patient.lifeStage?.replace('_', ' ') || 'No Calculada'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Edad</p>
                                    <p className="font-medium">{calculateAge(patient.dateOfBirth)} años</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Tipo de Sangre</p>
                                    <p className="font-medium">{patient.bloodType || 'Desconocido'}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Seguro</p>
                                        <p className="font-medium">{patient.insuranceProvider || 'Ninguno'}</p>
                                        {patient.insuranceNumber && (
                                            <p className="text-xs text-muted-foreground">#{patient.insuranceNumber}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Estado</p>
                                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                        {({
                                            'ACTIVE': 'ACTIVO',
                                            'INACTIVE': 'INACTIVO',
                                            'CRITICAL': 'CRÍTICO'
                                        } as Record<string, string>)[patient.status || 'ACTIVE'] || patient.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                    <TabsTrigger value="general">
                        <User className="h-4 w-4 mr-2" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="sis">
                        <Shield className="h-4 w-4 mr-2" />
                        SIS
                    </TabsTrigger>
                    <TabsTrigger value="minsa">
                        <Activity className="h-4 w-4 mr-2" />
                        MINSA
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <FileText className="h-4 w-4 mr-2" />
                        Historial
                    </TabsTrigger>
                    <TabsTrigger value="appointments">
                        <Calendar className="h-4 w-4 mr-2" />
                        Citas
                    </TabsTrigger>
                    <TabsTrigger value="prescriptions">
                        <Pill className="h-4 w-4 mr-2" />
                        Recetas
                    </TabsTrigger>
                    <TabsTrigger value="emergency">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Urgencias
                    </TabsTrigger>
                </TabsList>

                {/* Tab: General Information */}
                <TabsContent value="general" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información Personal</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nombre</p>
                                        <p className="font-medium">{patient.firstName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Apellido</p>
                                        <p className="font-medium">{patient.lastName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                                        <p className="font-medium">
                                            {patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'MMM dd, yyyy') : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Género</p>
                                        <p className="font-medium">{patient.gender || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tipo de Sangre</p>
                                        <p className="font-medium">{patient.bloodType || 'Desconocido'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tipo de Documento</p>
                                        <p className="font-medium">{patient.documentType?.replace('_', ' ') || 'DNI'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Número de Documento</p>
                                        <p className="font-medium">{patient.documentNumber || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-muted-foreground">Etapa de Vida MINSA</p>
                                        <Badge variant="outline" className={`mt-1 text-[10px] h-5 px-2 ${getLifeStageBadge(patient.lifeStage)}`}>
                                            {patient.lifeStage?.replace('_', ' ') || 'No Calculada'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Información de Contacto</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{patient.email || 'Sin email'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Teléfono</p>
                                    <p className="font-medium">{patient.phone || 'Sin teléfono'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Dirección/Domicilio</p>
                                    <p className="font-medium">{patient.address || 'Sin dirección'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ubigeo</p>
                                        <p className="font-medium">{patient.ubigeo || 'No asignado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Sector / Barrio</p>
                                        <p className="font-medium">{patient.sector || 'No asignado'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Carpeta Familiar / Nro HC</p>
                                    <p className="font-medium">{patient.familyFolderId || 'No asignada'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Contacto de Emergencia</p>
                                    <p className="font-medium">{patient.emergencyContact || 'No provisto'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Información del Seguro</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Seguro Principal</p>
                                    <p className="font-medium flex items-center gap-2">
                                        {patient.insuranceProvider?.replace(/_/g, ' ') || 'Ninguno'}
                                        {patient.insuranceProvider?.startsWith('SIS') && (
                                            patient.sisStatus === 'ACTIVO' || patient.sisStatus === 'ACTIVE' ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">ACTIVO</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{patient.sisStatus || 'INACTIVO'}</Badge>
                                            )
                                        )}
                                    </p>
                                </div>
                                {patient.insuranceProvider?.startsWith('SIS') ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Código SIS / Contrato</p>
                                            <p className="font-medium">{patient.sisCode || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Modalidad</p>
                                            <p className="font-medium">{patient.sisModalidad || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-muted-foreground">IPRESS Asignada</p>
                                            <p className="font-medium">{patient.sisAssignedIpress || 'No asignada / En validación'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-muted-foreground">Última validación SUSALUD</p>
                                            <p className="font-medium text-xs">
                                                {patient.sisValidatedAt ? format(new Date(patient.sisValidatedAt), 'PPP p', { locale: es }) : 'Nunca'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Número de Póliza</p>
                                        <p className="font-medium">{patient.insuranceNumber || 'N/A'}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="col-span-full">
                            <CardHeader>
                                <CardTitle>Datos Socioeconómicos y Determinantes CCEE</CardTitle>
                                <CardDescription>Variables para programas sociales y MINSA</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nivel Educativo</p>
                                        <p className="font-medium">{patient.educationLevel?.replace(/_/g, ' ') || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ocupación</p>
                                        <p className="font-medium">{patient.occupation || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Estado Civil</p>
                                        <p className="font-medium">{patient.maritalStatus?.replace(/_/g, ' ') || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Lengua Materna</p>
                                        <p className="font-medium">{patient.motherTongue?.replace(/_/g, ' ') || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Etnia</p>
                                        <p className="font-medium">{patient.ethnicity?.replace(/_/g, ' ') || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2 md:col-span-3">
                                        <p className="text-sm text-muted-foreground">Enfoque Intercultural</p>
                                        <p className="font-medium">
                                            {patient.isIntercultural ? (
                                                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-none border border-indigo-200">Aplica Beneficio Intercultural</Badge>
                                            ) : 'No aplica'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Alertas Médicas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Alergias</p>
                                        <p className="font-medium">{patient.allergies || 'Ninguna reportada'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Condiciones Crónicas</p>
                                        <p className="font-medium">{patient.chronicConditions || 'Ninguna reportada'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tab: Medical History */}
                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial Médico</CardTitle>
                            <CardDescription>Historial médico completo y registros</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {combinedHistory.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No hay registros de historial médico disponibles aún.
                                    </p>
                                ) : (
                                    <div className="space-y-4 shadow-sm">
                                        {combinedHistory.map((record: any) => (
                                            <div key={record.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {record.type === 'DIAGNOSIS' && (
                                                            <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                                                                Diagnóstico
                                                            </span>
                                                        )}
                                                        <h4 className="font-semibold text-base">{record.condition || record.diagnosis}</h4>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded">
                                                        {format(new Date(record.date || record.createdAt), 'dd MMM yyyy')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{record.notes || record.description}</p>
                                                {record.treatment && (
                                                    <div className="mt-2 text-sm bg-blue-50 p-2 rounded text-blue-800 border-l-4 border-blue-200">
                                                        <span className="font-semibold">Tratamiento: </span> {record.treatment}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {hasPermission('MEDICAL_RECORDS_CREATE') && (
                                    <div className="flex flex-wrap gap-2">
                                        {config?.ai?.enabled && config?.ai?.features?.recordSummarization && (
                                            <Button
                                                onClick={handleAISummarize}
                                                variant="outline"
                                                className={cn(
                                                    "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
                                                    summarizing && "animate-pulse"
                                                )}
                                                disabled={summarizing}
                                            >
                                                {summarizing ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                                    <img
                                                        src="/assets/logoIA.png"
                                                        alt="AI Logo"
                                                        className="h-10 w-10 object-contain"
                                                    />
                                                )}
                                                Resumen Clínico IA
                                            </Button>
                                        )}
                                        <Button onClick={() => setAddEncounterOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Crear Encuentro Clínico
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Appointments */}
                <TabsContent value="appointments" className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold tracking-tight">Gestión de Citas</h3>
                        {hasPermission('APPOINTMENTS_CREATE') && (
                            <Button onClick={() => setCreateAppointmentOpen(true)}>
                                <Calendar className="mr-2 h-4 w-4" />
                                Programar Nueva Cita
                            </Button>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Future Appointments */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Próximas Citas ({futureAppointments.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {futureAppointments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No hay citas próximas</p>
                                    ) : (
                                        futureAppointments.map((apt: any) => (
                                            <div key={apt.id} className="p-3 border rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium">{apt.reason || 'Chequeo General'}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {format(new Date(apt.appointmentDate), 'MMM dd, yyyy HH:mm')}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Personal de Salud: {apt.staff?.user?.firstName || 'Desconocido'}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                        {apt.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Past Appointments */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Citas Pasadas ({pastAppointments.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {pastAppointments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No hay citas pasadas</p>
                                    ) : (
                                        pastAppointments.slice(0, 5).map((apt: any) => (
                                            <div key={apt.id} className="p-3 border rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium">{apt.reason || 'Chequeo General'}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Personal de Salud: {apt.staff?.user?.firstName || 'Desconocido'}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                                        {apt.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tab: Prescriptions */}
                <TabsContent value="prescriptions">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold tracking-tight">Recetas Médicas</h3>
                        {hasPermission('PRESCRIPTIONS_CREATE') && (
                            <Button onClick={() => setAddMedicationOpen(true)}>
                                <Pill className="h-4 w-4 mr-2" />
                                Prescribir Medicamento
                            </Button>
                        )}
                    </div>
                    <Card>
                        <CardContent className="pt-6">
                            {medications.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay recetas disponibles</p>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {medications.map((med: any) => (
                                        <div key={med.id} className="flex flex-col p-4 border rounded-lg justify-between hover:shadow-md transition-shadow">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold">{med.name}</h4>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${med.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                            {med.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                        {(() => {
                                                            const order = patient?.pharmacyOrders?.find((o: any) =>
                                                                (med.medicationId && o.medicationId === med.medicationId) ||
                                                                (!med.medicationId && o.medicationName === med.name)
                                                            );
                                                            if (order) {
                                                                const status = order.status;
                                                                const badgeStyles: any = {
                                                                    'PENDIENTE': 'bg-amber-100 text-amber-700 border-amber-200',
                                                                    'APROBADO': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                                                    'RECHAZADO': 'bg-rose-100 text-rose-700 border-rose-200',
                                                                    'PENDING': 'bg-amber-100 text-amber-700 border-amber-200',
                                                                    'APPROVED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                                                    'REJECTED': 'bg-rose-100 text-rose-700 border-rose-200',
                                                                };
                                                                return (
                                                                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase", badgeStyles[status] || 'bg-slate-100 text-slate-600 border-slate-200')}>
                                                                        {status === 'PENDING' ? 'PENDIENTE' :
                                                                            status === 'APPROVED' ? 'APROBADO' :
                                                                                status === 'REJECTED' ? 'RECHAZADO' : status}
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-1">
                                                    <span className="font-medium">Dosis:</span> {med.dosage}
                                                </p>
                                                <p className="text-sm text-muted-foreground mb-1">
                                                    <span className="font-medium">Frecuencia:</span> {med.frequency}
                                                </p>
                                                {med.instructions && (
                                                    <p className="text-xs text-gray-500 mt-2 p-2 bg-slate-50 rounded italic">
                                                        "{med.instructions}"
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs text-slate-400">
                                                <span>Recetado: {format(new Date(med.startDate), 'dd/MM/yyyy')}</span>
                                                <span>Dr. {med.prescribedBy?.firstName || 'Staff'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Add Medication Dialog */}
                    <AlertDialog open={addMedicationOpen} onOpenChange={setAddMedicationOpen}>
                        <AlertDialogContent className="max-w-md">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Prescribir Medicamento</AlertDialogTitle>
                                <AlertDialogDescription>Complete la información de la receta médica</AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-sm font-medium">Nombre del Medicamento</label>
                                    <Popover open={medSearchOpen} onOpenChange={setMedSearchOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={medSearchOpen}
                                                className={cn(
                                                    "w-full justify-between bg-white border-slate-200 text-left font-normal",
                                                    !newMedication.name && "text-muted-foreground"
                                                )}
                                            >
                                                {newMedication.name
                                                    ? availableMeds.find((med: any) => med.name === newMedication.name)?.name || newMedication.name
                                                    : "Seleccione un medicamento..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0 bg-white border-slate-200" align="start">
                                            <Command>
                                                <CommandInput placeholder="Buscar medicamento..." className="h-9" />
                                                <CommandList>
                                                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                                    <CommandGroup>
                                                        {availableMeds.map((med: any) => (
                                                            <CommandItem
                                                                key={med.id}
                                                                value={med.name}
                                                                onSelect={() => {
                                                                    setNewMedication({ ...newMedication, name: med.name })
                                                                    setSelectedMedId(med.id)
                                                                    setMedSearchOpen(false)
                                                                }}
                                                                className="flex items-center justify-between cursor-pointer hover:bg-slate-50"
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-slate-900">{med.name}</span>
                                                                    <span className="text-xs text-slate-500">{med.manufacturer || med.laboratory || 'Genérico'}</span>
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
                                                                            newMedication.name === med.name ? "opacity-100" : "opacity-0"
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
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Dosis</label>
                                        <Input
                                            placeholder="Ej: 500mg"
                                            value={newMedication.dosage}
                                            onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Frecuencia</label>
                                        <Input
                                            placeholder="Ej: Cada 8 horas"
                                            value={newMedication.frequency}
                                            onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Fecha de Inicio</label>
                                    <Input
                                        type="date"
                                        value={newMedication.startDate}
                                        onChange={(e) => setNewMedication({ ...newMedication, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Instrucciones</label>
                                    <Textarea
                                        placeholder="Instrucciones adicionales..."
                                        value={newMedication.instructions}
                                        onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                                        className="resize-none"
                                    />
                                </div>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={async () => {
                                        try {
                                            await patientsAPI.addMedication(id!, { ...newMedication, medicationId: selectedMedId })
                                            toast({ title: 'Éxito', description: 'Medicamento prescrito correctamente' })
                                            refetchMedications()
                                            setAddMedicationOpen(false)
                                            setNewMedication({ name: '', dosage: '', frequency: '', instructions: '', startDate: new Date().toISOString().split('T')[0] })
                                            setSelectedMedId(null)
                                        } catch (error) {
                                            toast({ title: 'Error', description: 'No se pudo prescribir el medicamento', variant: 'destructive' })
                                        }
                                    }}
                                >
                                    Confirmar Prescripción
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TabsContent>

                <TabsContent value="lab" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Órdenes de Laboratorio</CardTitle>
                                {hasPermission('LAB_CREATE') && (
                                    <Button onClick={() => setAddLabOrderOpen(true)} className="bg-red-600 hover:bg-red-700 text-white shadow-md">
                                        <FlaskConical className="h-4 w-4 mr-2" />
                                        Nueva Orden
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {labOrders.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {labOrders.map((order: any) => (
                                        <Card key={order.id} className="bg-white border-zinc-200 shadow-sm hover:shadow-md transition-all">
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between">
                                                    <Badge variant="outline" className="border-blue-200 text-blue-600">
                                                        {order.testType || 'General'}
                                                    </Badge>
                                                    <Badge className={cn(
                                                        order.status === 'COMPLETED' ? "bg-green-100 text-green-700 hover:bg-green-200" :
                                                            order.status === 'PENDING' ? "bg-amber-100 text-amber-700 hover:bg-amber-200" :
                                                                "bg-zinc-100 text-zinc-700"
                                                    )}>
                                                        {order.status === 'PENDING' ? 'PENDIENTE' : order.status}
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-base mt-2">{order.testName || 'Análisis de Laboratorio'}</CardTitle>
                                                <CardDescription>{format(new Date(order.orderDate || order.createdAt), 'dd MMM yyyy')}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-zinc-500 mb-4 line-clamp-2">
                                                    {order.notes || 'Sin observaciones'}
                                                </p>
                                                <Button variant="outline" className="w-full" asChild>
                                                    <a href={`/laboratory?order=${order.id}`}>Ver Detalles</a>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                                        <FlaskConical className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <p className="font-medium text-slate-900">No hay órdenes registradas</p>
                                    <p className="text-sm text-slate-500 mb-4">Crea una nueva solicitud de análisis para este paciente.</p>
                                    {hasPermission('LAB_CREATE') && (
                                        <Button variant="outline" onClick={() => setAddLabOrderOpen(true)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                            Crear primera orden
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Urgencies */}
                <TabsContent value="emergency">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Registros de Urgencia ({emergencies.length})</CardTitle>
                                <CardDescription>Visitas de urgencia previas</CardDescription>
                            </div>
                            {hasPermission('EMERGENCY_CREATE') && (
                                <Button
                                    onClick={() => setAddEmergencyOpen(true)}
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all hover:scale-105 active:scale-95"
                                >
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Nueva Urgencia
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {emergencies.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay registros de urgencia</p>
                            ) : (
                                <div className="space-y-3">
                                    {emergencies.map((em: any) => (
                                        <div key={em.id} className="p-4 border rounded-lg space-y-3 transition-colors hover:bg-slate-50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{em.diagnosis || em.chiefComplaint}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                        <p className="text-xs text-muted-foreground">{format(new Date(em.admissionDate), 'dd MMM yyyy HH:mm')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${em.triageLevel === 1 ? 'bg-red-500 animate-pulse' :
                                                        em.triageLevel === 2 ? 'bg-orange-500' :
                                                            em.triageLevel === 3 ? 'bg-yellow-500' :
                                                                em.triageLevel === 4 ? 'bg-green-500' :
                                                                    'bg-blue-500'
                                                        }`} />
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 uppercase tracking-wider">
                                                        Nivel {em.triageLevel}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="text-xs text-slate-600">
                                                        Personal de Salud: {em.staffName || 'Sin personal asignado'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Bed className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="text-xs text-slate-600">
                                                        {em.bedNumber ? `Cama ${em.bedNumber}` : 'Sin cama asignada'}
                                                    </span>
                                                </div>
                                            </div>

                                            {em.vitalSigns && (
                                                <div className="flex gap-4 text-[10px] font-medium text-slate-500 bg-slate-50/50 p-2 rounded">
                                                    <div className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3 text-red-400" />
                                                        <span>FC: {em.vitalSigns.hr || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Activity className="h-3 w-3 text-blue-400" />
                                                        <span>PA: {em.vitalSigns.bp || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Thermometer className="h-3 w-3 text-orange-400" />
                                                        <span>T°: {em.vitalSigns.temp || '-'}°C</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Wind className="h-3 w-3 text-cyan-400" />
                                                        <span>SpO2: {em.vitalSigns.spo2 || '-'}%</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: SIS Validation */}
                <TabsContent value="sis">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Validación SIS</CardTitle>
                            <CardDescription>Auditoría de validaciones en la plataforma de MINSA/SIS</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sisHistory.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay registros de validación SIS disponibles.</p>
                            ) : (
                                <div className="space-y-4">
                                    {sisHistory.map((sh: any) => (
                                        <div key={sh.id} className="p-4 border rounded-lg hover:bg-slate-50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Badge variant={sh.resultStatus === 'ACTIVE' ? 'default' : 'secondary'} className="mb-2">
                                                        {sh.resultStatus === 'ACTIVE' ? 'SIS ACTIVO' : sh.resultStatus}
                                                    </Badge>
                                                    <h4 className="font-semibold text-sm">Respuesta: {sh.responseMessage}</h4>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Fecha: {format(new Date(sh.validationDate), 'dd MMM yyyy HH:mm', { locale: es })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">Validado por</p>
                                                    <p className="text-xs text-muted-foreground">{sh.validatedBy || 'Sistema'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: MINSA Programs */}
                <TabsContent value="minsa">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Programas MINSA</CardTitle>
                                <CardDescription>Participación e inscripción en programas de salud</CardDescription>
                            </div>
                            <Button onClick={() => setAddMinsaProgramOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Inscribir Programa
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {minsaPrograms.length === 0 ? (
                                <p className="text-sm text-muted-foreground">El paciente no está adscrito a ningún programa MINSA activo.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {minsaPrograms.map((mp: any) => (
                                        <Card key={mp.id} className="border border-blue-100 bg-blue-50/20">
                                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg text-blue-800">{mp.program?.name || mp.program?.name || mp.programName || 'Programa'}</CardTitle>
                                                <Activity className="h-5 w-5 text-blue-500" />
                                            </CardHeader>
                                            <CardContent className="text-sm">
                                                <p className="line-clamp-2 text-muted-foreground mb-3">{mp.notes}</p>
                                                <div className="flex justify-between text-xs font-semibold text-blue-700">
                                                    <span>Última visita: {format(new Date(mp.visitDate || mp.createdAt), 'dd/MM/yyyy')}</span>
                                                    <span>Próxima: {mp.nextAppointment ? format(new Date(mp.nextAppointment), 'dd/MM/yyyy') : 'N/A'}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Notes */}
                <TabsContent value="notes">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Notas del Personal de Salud</CardTitle>
                                <CardDescription>Notas clínicas y observaciones</CardDescription>
                            </div>
                            {hasPermission('MEDICAL_RECORDS_CREATE') && (
                                <Button onClick={() => setAddNoteOpen(true)} variant="outline" size="sm">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Nueva Nota
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {clinicalNotes.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No hay notas registradas</p>
                                ) : (
                                    clinicalNotes.map((note: any) => (
                                        <div key={note.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-sm">{note.chiefComplaint || 'Nota sin título'}</h4>
                                                <span className="text-xs text-muted-foreground">{format(new Date(note.visitDate), 'dd MMM yyyy HH:mm')}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{note.notes}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                                    Personal de Salud: {note.staff?.user?.firstName || 'Unknown'} {note.staff?.user?.lastName || ''}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>


                <AddNoteModal
                    open={addNoteOpen}
                    onOpenChange={setAddNoteOpen}
                    patientId={id!}
                    onSuccess={() => {
                        refetchHistory()
                    }}
                />

                {/* Tab: Files */}
                <TabsContent value="files">
                    <Card>
                        <CardHeader>
                            <CardTitle>Documentos Adjuntos</CardTitle>
                            <CardDescription>Documentos médicos y archivos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {documents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-slate-50/50">
                                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <p className="font-medium text-slate-900">No hay documentos</p>
                                        <p className="text-sm text-slate-500 mb-4">Sube archivos médicos, recetas o resultados.</p>
                                        {hasPermission('MEDICAL_RECORDS_CREATE') && (
                                            <Button onClick={() => setAddDocumentOpen(true)} variant="outline">
                                                <Paperclip className="h-4 w-4 mr-2" />
                                                Adjuntar Archivo
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium">Archivos Recientes</h3>
                                                <p className="text-sm text-muted-foreground">{documents.length} documentos encontrados</p>
                                            </div>
                                            {hasPermission('MEDICAL_RECORDS_CREATE') && (
                                                <Button onClick={() => setAddDocumentOpen(true)} size="sm">
                                                    <Paperclip className="h-4 w-4 mr-2" />
                                                    Nuevo Documento
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {documents.map((doc: any) => (
                                                <div key={doc.id} className="group relative p-4 border rounded-xl bg-card hover:bg-slate-50/50 transition-all hover:shadow-sm">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.type === 'IMAGING' ? 'bg-purple-100 text-purple-600' :
                                                            doc.type === 'LAB_RESULT' ? 'bg-blue-100 text-blue-600' :
                                                                doc.type === 'PRESCRIPTION' ? 'bg-green-100 text-green-600' :
                                                                    'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {doc.type === 'IMAGING' ? <Activity className="h-5 w-5" /> :
                                                                doc.type === 'LAB_RESULT' ? <FlaskConical className="h-5 w-5" /> :
                                                                    doc.type === 'PRESCRIPTION' ? <Pill className="h-5 w-5" /> :
                                                                        <FileText className="h-5 w-5" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <p className="font-medium text-sm truncate pr-2" title={doc.name}>{doc.name}</p>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                                        {doc.type === 'LAB_RESULT' ? 'Laboratorio' :
                                                                            doc.type === 'IMAGING' ? 'Imagenología' :
                                                                                doc.type === 'PRESCRIPTION' ? 'Receta' : 'Documento'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                                <span className="flex items-center">
                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                    {doc.uploadedAt ? format(new Date(doc.uploadedAt), 'dd MMM yyyy') : 'Fecha no disponible'}
                                                                </span>
                                                                {doc.size && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                            onClick={() => {
                                                                const link = document.createElement('a');
                                                                link.href = doc.url;
                                                                link.download = doc.name;
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                            }}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => setDocumentToDelete(doc.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <AddDocumentModal
                    open={addDocumentOpen}
                    onOpenChange={setAddDocumentOpen}
                    patientId={id!}
                    onSuccess={() => {
                        refetchDocuments()
                    }}
                />

                <LabOrderModal
                    open={addLabOrderOpen}
                    onOpenChange={setAddLabOrderOpen}
                    defaultPatientId={id!}
                    onSuccess={() => {
                        // Refetch labs if hook exists, otherwise we'll wait for manual refresh or rely on query invalidation
                        // Assuming refetchLabs exists or we need to add it.
                        // For now just toast success handled in modal
                    }}
                />

                <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. El documento será eliminado permanentemente del expediente del paciente.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteDocument} className="bg-destructive hover:bg-destructive/90">
                                Eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Tabs>

            <PatientModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                patient={patient}
                onSuccess={handleEditSuccess}
            />

            <AddDiagnosisModal
                open={addDiagnosisOpen}
                onOpenChange={setAddDiagnosisOpen}
                patientId={id!}
                onSuccess={() => {
                    refetch()
                    refetchDiagnoses()
                }}
            />

            <AddEncounterModal
                open={addEncounterOpen}
                onOpenChange={setAddEncounterOpen}
                patientId={id!}
                onSuccess={() => {
                    refetchHistory()
                }}
            />

            <AppointmentModal
                open={createAppointmentOpen}
                onOpenChange={setCreateAppointmentOpen}
                defaultPatientId={id}
                onSuccess={() => {
                    refetchAppointments()
                }}
            />
            <EmergencyModal
                open={addEmergencyOpen}
                onOpenChange={setAddEmergencyOpen}
                defaultPatientId={id}
                onSuccess={() => {
                    refetchEmergencies()
                }}
            />

            <AddMinsaProgramModal
                open={addMinsaProgramOpen}
                onOpenChange={setAddMinsaProgramOpen}
                patientId={id!}
                onSuccess={() => {
                    refetch()
                }}
            />
            {/* AI Summary Modal */}
            <AlertDialog open={isSummaryModalOpen} onOpenChange={setIsSummaryModalOpen}>
                <AlertDialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 text-white">
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
                                <AlertDialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3 uppercase">
                                    Síntesis Clínica Inteligente
                                    <Badge className="bg-emerald-500 text-white border-none text-[10px] animate-pulse">
                                        {(aiModel && MODEL_DISPLAY_NAMES[aiModel]) || 'SENIOR AI'}
                                    </Badge>
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-zinc-400">
                                    Resumen ejecutivo del historial de <span className="text-zinc-100 font-bold">{patient?.firstName} {patient?.lastName}</span>
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>

                    <div className="py-6 overflow-y-auto max-h-[60vh]">
                        <div
                            className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 leading-relaxed text-zinc-300 font-medium whitespace-pre-wrap selection:bg-emerald-500/30"
                            style={{ fontFamily: 'var(--font-sans)' }}
                        >
                            {aiSummary || 'Generando síntesis...'}
                        </div>
                    </div>

                    <AlertDialogFooter className="border-t border-zinc-800 pt-6">
                        <Button
                            onClick={() => {
                                const blob = new Blob([aiSummary || ''], { type: 'text/plain' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `Resumen_IA_${patient?.lastName}.txt`;
                                a.click();
                            }}
                            variant="ghost"
                            className="text-zinc-400 hover:text-white"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar TXT
                        </Button>
                        <AlertDialogAction
                            onClick={() => setIsSummaryModalOpen(false)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 rounded-xl shadow-lg shadow-emerald-900/20 shadow-xl"
                        >
                            Cerrar Resumen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
