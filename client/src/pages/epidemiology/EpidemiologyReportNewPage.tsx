import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ShieldAlert, Send, FileCheck, Phone, MapPin, Activity, Search, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/components/ui/use-toast'
import { epidemiologyAPI, patientsAPI } from '@/services/api'
import { useMutation, useQuery } from '@tanstack/react-query'

const epidemiologySchema = z.object({
    patientId: z.string().min(1, 'Debe seleccionar un paciente'),
    disease: z.string().min(1, 'Debe seleccionar una enfermedad o evento'),
    notificationDate: z.string().min(1, 'Fecha obligatoria'),
    status: z.enum(['SUSPECTED', 'PROBABLE', 'CONFIRMED', 'DISCARDED']),
    symptoms: z.string().optional(),
    observations: z.string().optional(),
})

type EpidemiologyFormData = z.infer<typeof epidemiologySchema>

export default function EpidemiologyReportNewPage() {
    const navigate = useNavigate()
    const { toast } = useToast()

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedPatient, setSelectedPatient] = useState<any>(null)

    const form = useForm<EpidemiologyFormData>({
        resolver: zodResolver(epidemiologySchema),
        defaultValues: {
            patientId: '',
            disease: '',
            notificationDate: new Date().toISOString().split('T')[0],
            status: 'SUSPECTED',
            symptoms: '',
            observations: ''
        }
    })

    const { data: patients, isLoading: isLoadingPatients } = useQuery({
        queryKey: ['patients', searchTerm],
        queryFn: async () => {
            if (!searchTerm || searchTerm.length < 3) return []
            const res = await patientsAPI.getAll({ search: searchTerm })
            return res.data?.data || []
        },
        enabled: searchTerm.length >= 3,
    })

    const handleSelectPatient = (patient: any) => {
        setSelectedPatient(patient)
        form.setValue('patientId', patient.id)
        setSearchTerm('')
    }

    const { mutate: createReport, isPending } = useMutation({
        mutationFn: async (data: EpidemiologyFormData) => {
            const res = await epidemiologyAPI.create({
                ...data,
                notificationDate: new Date(data.notificationDate).toISOString()
            })
            return res.data
        },
        onSuccess: () => {
            toast({
                title: 'Alerta/Reporte Enviado',
                description: 'La notificación epidemiológica ha sido registrada.',
            })
            navigate('/epidemiology')
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al guardar reporte',
                variant: 'destructive',
            })
        }
    })

    const onSubmit = (data: EpidemiologyFormData) => {
        createReport(data)
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex items-center justify-between border-b pb-6 mb-6">
                        <div className="flex items-center gap-3">
                            <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    Ficha de Notificación Individual (NOTI-MINSA)
                                    <Badge className="bg-red-100 text-red-700 border-red-200">INMEDIATA</Badge>
                                </h1>
                                <p className="text-muted-foreground text-sm uppercase font-mono">Formato Oficial DIRESA-PUNO / Vigilancia Epidemiológica</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-lg shadow-red-100" onClick={() => { form.setValue('status', 'CONFIRMED'); toast({ title: 'Atención', description: 'Marcado como caso confirmado de brote.' }) }}>
                                <ShieldAlert className="h-4 w-4" />
                                Reportar Alerta Roja
                            </Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isPending || !selectedPatient}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Transmitir Ahora
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader className="border-b bg-slate-50/50">
                                    <CardTitle className="text-lg">I. Datos de la Enfermedad Vigilada</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold uppercase text-slate-500">Paciente Afectado</h3>
                                        {!selectedPatient ? (
                                            <div className="relative">
                                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    className="w-full pl-10"
                                                    placeholder="Buscar paciente por DNI o nombre..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                                {isLoadingPatients && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}

                                                {patients && patients.length > 0 && (
                                                    <div className="absolute top-12 w-full bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                                                        {patients.map((p: any) => (
                                                            <div
                                                                key={p.id}
                                                                className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                                                                onClick={() => handleSelectPatient(p)}
                                                            >
                                                                <div className="font-medium">{p.firstName} {p.lastName}</div>
                                                                <div className="text-xs text-muted-foreground">DNI: {p.documentNumber}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                                <div>
                                                    <div className="font-semibold">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                                                    <div className="text-xs text-muted-foreground">DNI: {selectedPatient.documentNumber}</div>
                                                </div>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>Cambiar</Button>
                                            </div>
                                        )}
                                        {form.formState.errors.patientId && (
                                            <p className="text-sm font-medium text-destructive">{form.formState.errors.patientId.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <FormField
                                            control={form.control}
                                            name="disease"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Evento / Diagnóstico (CIE-10)</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full h-11 px-4 rounded-xl border bg-slate-50 font-medium">
                                                                <SelectValue placeholder="Seleccione la enfermedad" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Dengue con señales de alarma">Dengue con señales de alarma</SelectItem>
                                                            <SelectItem value="Rabia humana silvestre">Rabia humana silvestre</SelectItem>
                                                            <SelectItem value="Mordedura Canina">Mordedura Canina</SelectItem>
                                                            <SelectItem value="Malaria falciparum">Malaria falciparum</SelectItem>
                                                            <SelectItem value="Neumonía grave">Neumonía grave</SelectItem>
                                                            <SelectItem value="COVID-19">COVID-19 (Confirmado)</SelectItem>
                                                            <SelectItem value="Tuberculosis">Tuberculosis</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <FormField
                                                control={form.control}
                                                name="notificationDate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold uppercase text-slate-500">Fecha Inicio Síntomas</FormLabel>
                                                        <FormControl>
                                                            <Input type="date" className="w-full h-11 px-3 rounded-md border bg-slate-50" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <FormField
                                                control={form.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold uppercase text-slate-500">Condición del Caso</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="w-full h-11 px-3 rounded-md border bg-slate-50">
                                                                    <SelectValue placeholder="Condición" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="SUSPECTED">Sospechoso</SelectItem>
                                                                <SelectItem value="PROBABLE">Probable</SelectItem>
                                                                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                                                                <SelectItem value="DISCARDED">Descartado</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="border-b bg-slate-50/50">
                                    <CardTitle className="text-lg">II. Investigación de Campo</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-1">
                                        <FormField
                                            control={form.control}
                                            name="symptoms"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">Síntomas y Factores de Riesgo</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            className="w-full min-h-[80px] p-3 rounded-md border"
                                                            placeholder="Fiebre, mialgias, hacinamiento, contacto con animales, viajes recientes..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <FormField
                                            control={form.control}
                                            name="observations"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium">Acciones de Control realizadas</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            className="w-full min-h-[80px] p-3 rounded-md border"
                                                            placeholder="Aislamiento domiciliario, bloqueo epidemiológico..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="bg-indigo-900 text-white shadow-lg relative overflow-hidden">
                                <Activity className="absolute -right-6 -bottom-6 h-32 w-32 text-indigo-800 opacity-50" />
                                <CardContent className="p-6 space-y-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <ShieldAlert className="h-8 w-8 text-indigo-300" />
                                        <h3 className="text-lg font-bold">Resumen Alerta</h3>
                                    </div>
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-indigo-400 mt-1" />
                                            <div>
                                                <p className="text-[10px] uppercase opacity-60">Jurisdicción / IPRESS</p>
                                                <p className="text-sm">C.S. Jorge Chávez (I-4)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Phone className="h-4 w-4 text-indigo-400 mt-1" />
                                            <div>
                                                <p className="text-[10px] uppercase opacity-60">Contacto DIRESA PUNO</p>
                                                <p className="text-sm border-b border-indigo-500 inline-block pb-0.5 mt-1 hover:text-indigo-200 cursor-pointer transition-colors">
                                                    Ver Directorio Red San Román
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Control de Calidad</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-2">
                                            <FileCheck className="h-4 w-4 text-green-500" />
                                            CIE-10 Vinculado
                                        </span>
                                        <Badge variant="outline" className="text-green-600 bg-green-50">OK</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                            Geo-referencia
                                        </span>
                                        <Badge variant="outline" className="text-slate-400">PND</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    )
}
