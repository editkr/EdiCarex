import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, Search, Building2, UserPlus, FileText, ClipboardList, Loader2 } from 'lucide-react'
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
import { referralsAPI, patientsAPI } from '@/services/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useOrganization } from '@/contexts/OrganizationContext'

const referralSchema = z.object({
    patientId: z.string().min(1, 'Debe seleccionar un paciente'),
    destinationCode: z.string().min(1, 'Debe seleccionar un destino'),
    specialty: z.string().min(1, 'Debe seleccionar una especialidad'),
    priority: z.enum(['P1', 'P2', 'P3']),
    clinicalSummary: z.string().min(10, 'El resumen clínico debe ser más detallado'),
    reason: z.string().min(10, 'El motivo debe ser más detallado'),
})

type ReferralFormData = z.infer<typeof referralSchema>

export default function ReferralNewPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { user } = useAuthStore()
    const { config } = useOrganization()

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedPatient, setSelectedPatient] = useState<any>(null)

    const { data: patients, isLoading: isLoadingPatients } = useQuery({
        queryKey: ['patients', searchTerm],
        queryFn: async () => {
            if (!searchTerm || searchTerm.length < 3) return []
            const res = await patientsAPI.getAll({ search: searchTerm })
            return res.data?.data || []
        },
        enabled: searchTerm.length >= 3,
    })

    const form = useForm<ReferralFormData>({
        resolver: zodResolver(referralSchema),
        defaultValues: {
            patientId: '',
            destinationCode: 'Hospital Carlos Monge Medrano',
            specialty: '',
            priority: 'P2',
            clinicalSummary: '',
            reason: '',
        }
    })

    const handleSelectPatient = (patient: any) => {
        setSelectedPatient(patient)
        form.setValue('patientId', patient.id)
        setSearchTerm('')
    }

    const { mutate: createReferral, isPending } = useMutation({
        mutationFn: async (data: ReferralFormData) => {
            const payload = {
                patientId: data.patientId,
                destinationCode: data.destinationCode,
                specialty: data.specialty,
                priority: data.priority,
                reason: data.reason,
                clinicalSummary: data.clinicalSummary,
                type: 'REFERRAL',
                status: 'PENDING',
                date: new Date().toISOString()
            }
            const res = await referralsAPI.create(payload)
            return res.data
        },
        onSuccess: () => {
            toast({
                title: 'Referencia Creada',
                description: 'La solicitud de referencia ha sido enviada.',
            })
            navigate('/referral-system')
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al crear referencia',
                variant: 'destructive',
            })
        }
    })

    const onSubmit = (data: ReferralFormData) => {
        createReferral(data)
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Solicitud de Referencia (Hoja 002)</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Origen: {config?.name || 'C.S. Jorge Chávez'}
                        </p>
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card className="shadow-lg border-primary/5">
                        <CardHeader className="bg-primary/5 border-b py-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-4 md:col-span-2">
                                    <h3 className="text-sm font-bold uppercase text-primary tracking-wider">Paciente</h3>
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
                                        <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                            <div>
                                                <div className="font-semibold">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                                                <div className="text-xs text-muted-foreground">DNI: {selectedPatient.documentNumber}</div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>Cambiar</Button>
                                        </div>
                                    )}
                                    {form.formState.errors.patientId && (
                                        <p className="text-sm font-medium text-destructive">{form.formState.errors.patientId.message}</p>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase text-primary tracking-wider">UPSS Destino</h3>
                                    <FormField
                                        control={form.control}
                                        name="specialty"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue placeholder="Seleccione..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Ginecología y Obstetricia">Ginecología y Obstetricia</SelectItem>
                                                        <SelectItem value="Cirugía General">Cirugía General</SelectItem>
                                                        <SelectItem value="Pediatría">Pediatría</SelectItem>
                                                        <SelectItem value="Medicina Interna">Medicina Interna</SelectItem>
                                                        <SelectItem value="Traumatología">Traumatología</SelectItem>
                                                        <SelectItem value="Psiquiatría">Psiquiatría</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase text-primary tracking-wider">Prioridad</h3>
                                    <FormField
                                        control={form.control}
                                        name="priority"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex gap-2">
                                                    <Badge
                                                        className={`cursor-pointer px-4 py-1 flex-1 text-center justify-center ${field.value === 'P1' ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} transition-colors`}
                                                        onClick={() => field.onChange('P1')}
                                                    >P1 (Emergencia)</Badge>
                                                    <Badge
                                                        className={`cursor-pointer px-4 py-1 flex-1 text-center justify-center ${field.value === 'P2' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} transition-colors`}
                                                        onClick={() => field.onChange('P2')}
                                                    >P2 (Urgencia)</Badge>
                                                    <Badge
                                                        className={`cursor-pointer px-4 py-1 flex-1 text-center justify-center ${field.value === 'P3' ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} transition-colors`}
                                                        onClick={() => field.onChange('P3')}
                                                    >P3 (Consulta)</Badge>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <h3 className="font-bold">Resumen Clínico</h3>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="clinicalSummary"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-muted-foreground">Antecedentes, Examen Físico y Hallazgos</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        className="w-full min-h-[160px] p-4 rounded-xl border bg-slate-50/50 resize-y"
                                                        placeholder="Signos vitales, hallazgos significativos, antecedentes relevantes..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <ClipboardList className="h-5 w-5 text-primary" />
                                        <h3 className="font-bold">Motivo de Transferencia</h3>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="reason"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-muted-foreground">Justificación Técnica</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        className="w-full min-h-[160px] p-4 rounded-xl border bg-slate-50/50 resize-y"
                                                        placeholder="Falta de especialista, necesidad de exámenes auxiliares, etc..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mt-4">
                                        <h4 className="text-xs font-bold text-blue-700 flex items-center gap-2 mb-2">
                                            <UserPlus className="h-4 w-4" />
                                            MÉDICO QUE REFIERE
                                        </h4>
                                        <p className="text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
                                        <p className="text-xs text-blue-600/80">{user?.role?.description || user?.role?.name}</p>
                                    </div>
                                </section>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t mt-8">
                                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
                                <Button type="submit" disabled={isPending || !selectedPatient}>
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Enviar Solicitud
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    )
}
