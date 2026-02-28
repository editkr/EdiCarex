import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    Activity,
    Pill,
    AlertTriangle,
    HeartPulse,
    Stethoscope,
    FileText,
    Loader2,
    ChevronRight,
    Calendar,
} from 'lucide-react'
import { patientsAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function PatientMedicalHistoryPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('timeline')
    const [data, setData] = useState<any>({
        timeline: [],
        diagnoses: [],
        medications: [],
        allergies: [],
        vitals: [],
    })

    // Get current user for real patient ID
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const patientId = user.patientId

    useEffect(() => {
        if (patientId) {
            loadMedicalHistory()
        }
    }, [patientId])

    const loadMedicalHistory = async () => {
        try {
            setLoading(true)
            const res = await patientsAPI.getTimeline(patientId)
            setData(res.data)
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo cargar el historial médico',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'APPOINTMENT': return <Calendar className="h-5 w-5 text-blue-500" />
            case 'DIAGNOSIS': return <Stethoscope className="h-5 w-5 text-red-500" />
            case 'MEDICATION': return <Pill className="h-5 w-5 text-green-500" />
            case 'LAB_ORDER': return <FileText className="h-5 w-5 text-purple-500" />
            case 'VITAL_SIGN': return <HeartPulse className="h-5 w-5 text-pink-500" />
            default: return <Activity className="h-5 w-5 text-gray-500" />
        }
    }

    const getSeverityBadge = (severity: string) => {
        const styles: Record<string, string> = {
            MILD: 'bg-yellow-100 text-yellow-700',
            MODERATE: 'bg-orange-100 text-orange-700',
            SEVERE: 'bg-red-100 text-red-700',
        }
        return (
            <span className={`text-xs px-2 py-1 rounded-full ${styles[severity] || 'bg-gray-100'}`}>
                {severity}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Historial Médico</h1>
                    <p className="text-gray-500">Tu historial clínico completo</p>
                </div>
                <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Descargar PDF
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-5 w-full max-w-2xl">
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="diagnoses">Diagnósticos</TabsTrigger>
                    <TabsTrigger value="medications">Medicamentos</TabsTrigger>
                    <TabsTrigger value="allergies">Alergias</TabsTrigger>
                    <TabsTrigger value="vitals">Signos Vitales</TabsTrigger>
                </TabsList>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Línea de Tiempo</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!data?.timeline?.length ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No hay historial médico registrado.
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                                    <div className="space-y-6">
                                        {data.timeline.map((event: any, index: number) => (
                                            <div key={index} className="relative flex items-start gap-4 ml-4">
                                                <div className="absolute -left-4 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
                                                    {getEventIcon(event.type)}
                                                </div>
                                                <div className="ml-8 flex-1 bg-gray-50 p-4 rounded-lg">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold">{event.type}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {format(new Date(event.date), 'PPP', { locale: es })}
                                                            </p>
                                                        </div>
                                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Diagnoses Tab */}
                <TabsContent value="diagnoses" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Diagnósticos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!data?.diagnoses?.length ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No hay diagnósticos registrados</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Código</TableHead>
                                            <TableHead>Diagnóstico</TableHead>
                                            <TableHead>Personal de Salud</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.diagnoses.map((diag: any) => (
                                            <TableRow key={diag.id}>
                                                <TableCell>
                                                    {format(new Date(diag.diagnosedDate), 'PP', { locale: es })}
                                                </TableCell>
                                                <TableCell className="font-mono">{diag.diagnosisCode}</TableCell>
                                                <TableCell>{diag.diagnosisName}</TableCell>
                                                <TableCell>{diag.diagnosedBy}</TableCell>
                                                <TableCell>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${diag.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                        diag.status === 'RESOLVED' ? 'bg-gray-100 text-gray-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {diag.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Medications Tab */}
                <TabsContent value="medications" className="mt-4">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Pill className="h-5 w-5 text-green-500" />
                                    Medicamentos Actuales
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!data?.medications?.length ? (
                                    <p className="text-center text-gray-500 py-4">No hay medicamentos activos</p>
                                ) : (
                                    <div className="space-y-3">
                                        {data.medications.filter((m: any) => m.isActive).map((med: any) => (
                                            <div key={med.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                <div>
                                                    <p className="font-semibold">{med.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {med.dosage} - {med.frequency}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    Desde {format(new Date(med.startDate), 'PP', { locale: es })}
                                                </span>
                                            </div>
                                        ))}
                                        {data.medications.filter((m: any) => m.isActive).length === 0 && (
                                            <p className="text-center text-gray-500 py-4">No hay medicamentos activos</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Allergies Tab */}
                <TabsContent value="allergies" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Alergias
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!data?.allergies?.length ? (
                                <div className="text-center py-8 text-gray-500">
                                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No se han registrado alergias</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {data.allergies.map((allergy: any) => (
                                        <div key={allergy.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                                            <div>
                                                <p className="font-semibold">{allergy.allergen}</p>
                                                <p className="text-sm text-gray-600">Reacción: {allergy.reaction}</p>
                                            </div>
                                            {getSeverityBadge(allergy.severity)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Vital Signs Tab */}
                <TabsContent value="vitals" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HeartPulse className="h-5 w-5 text-pink-500" />
                                Signos Vitales
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!data?.vitalSigns?.length ? (
                                <div className="text-center py-8 text-gray-500">
                                    <HeartPulse className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No hay registros de signos vitales</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Peso</TableHead>
                                            <TableHead>Altura</TableHead>
                                            <TableHead>Presión</TableHead>
                                            <TableHead>Pulso</TableHead>
                                            <TableHead>Temp.</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.vitalSigns.map((vital: any) => (
                                            <TableRow key={vital.id}>
                                                <TableCell>
                                                    {format(new Date(vital.recordedAt), 'PP', { locale: es })}
                                                </TableCell>
                                                <TableCell>{vital.weight} kg</TableCell>
                                                <TableCell>{vital.height} cm</TableCell>
                                                <TableCell>
                                                    {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}
                                                </TableCell>
                                                <TableCell>{vital.heartRate} bpm</TableCell>
                                                <TableCell>{vital.temperature}°C</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
