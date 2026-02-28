import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Search, Layers, HelpCircle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'
import { hisAPI, patientsAPI } from '@/services/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'

const diagnosisSchema = z.object({
    code: z.string().min(1, 'Obligatorio'),
    type: z.enum(['PRESUMPTIVE', 'DEFINITIVE', 'REPETITIVE']),
    labValue: z.string().optional()
})

const hisRecordSchema = z.object({
    attentionDate: z.string().min(1, 'La fecha es obligatoria'),
    patientId: z.string().min(1, 'Debe seleccionar un paciente'),
    diagnoses: z.array(diagnosisSchema).min(1, 'Debe agregar al menos un diagnóstico')
})

type HISFormData = z.infer<typeof hisRecordSchema>

export default function HISReportingNewPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { user } = useAuthStore()

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedPatient, setSelectedPatient] = useState<any>(null)

    const form = useForm<HISFormData>({
        resolver: zodResolver(hisRecordSchema),
        defaultValues: {
            attentionDate: new Date().toISOString().split('T')[0],
            patientId: '',
            diagnoses: [{ code: '', type: 'DEFINITIVE', labValue: '' }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "diagnoses"
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

    const { mutate: createHisRecord, isPending } = useMutation({
        mutationFn: async (data: HISFormData) => {
            const res = await hisAPI.create({
                patientId: data.patientId,
                attentionDate: new Date(data.attentionDate).toISOString(),
                diagnoses: data.diagnoses
            })
            return res.data
        },
        onSuccess: () => {
            toast({
                title: 'Registro HIS Guardado',
                description: 'El registro HIS ha sido guardado exitosamente.',
            })
            navigate('/his-reporting')
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al guardar registro',
                variant: 'destructive',
            })
        }
    })

    const handleSelectPatient = (patient: any) => {
        setSelectedPatient(patient)
        form.setValue('patientId', patient.id)
        setSearchTerm('')
    }

    const onSubmit = (data: HISFormData) => {
        createHisRecord(data)
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    Nuevo Registro HIS
                                    <Badge variant="secondary" className="bg-slate-100 uppercase text-[10px]">Diario</Badge>
                                </h1>
                                <p className="text-muted-foreground text-sm">Registro de actividad para el sistema HIS-MINSA</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" />
                                Guía Codificación
                            </Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2" disabled={isPending || !selectedPatient}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Cerrar y Enviar Registro
                            </Button>
                        </div>
                    </div>

                    <Card className="border-t-4 border-t-emerald-500 shadow-xl mb-6">
                        <CardHeader className="bg-emerald-50/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <FormField
                                        control={form.control}
                                        name="attentionDate"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Fecha Atención</label>
                                                <FormControl>
                                                    <Input type="date" className="h-9 w-40" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Profesional</label>
                                        <p className="text-sm font-semibold pt-1">{user?.firstName} {user?.lastName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">Diagnósticos</span>
                                    <span className="text-2xl font-bold text-emerald-600">{fields.length}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="bg-slate-50 p-3 border-y flex items-center justify-between">
                                <div className="relative flex-1 max-w-md">
                                    {!selectedPatient ? (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por DNI o Nombre del Paciente..."
                                                className="pl-9 bg-white"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            {isLoadingPatients && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                                            {patients && patients.length > 0 && (
                                                <div className="absolute top-11 w-full bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                                                    {patients.map((p: any) => (
                                                        <div
                                                            key={p.id}
                                                            className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                                                            onClick={() => handleSelectPatient(p)}
                                                        >
                                                            <div className="font-medium">{p.firstName} {p.lastName}</div>
                                                            <div className="text-xs text-muted-foreground">DNI: {p.documentNumber} - FUA: {p.sisCode || 'N/A'}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-2 border rounded-md bg-white">
                                            <div>
                                                <span className="font-semibold text-sm">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                                                <span className="text-xs text-muted-foreground ml-2">(DNI: {selectedPatient.documentNumber})</span>
                                            </div>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>Cambiar Paciente</Button>
                                        </div>
                                    )}
                                </div>
                                <Button type="button" variant="secondary" size="sm" className="bg-white border" onClick={() => append({ code: '', type: 'DEFINITIVE', labValue: '' })}>
                                    + Agregar Diagnóstico
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-100/50 text-[10px] uppercase font-bold text-muted-foreground border-b">
                                            <th className="p-3 text-left w-12 text-center">N°</th>
                                            <th className="p-3 text-left">Código CIE-10</th>
                                            <th className="p-3 text-left">Tipo (P/D/R)</th>
                                            <th className="p-3 text-left w-32">Lab/Res</th>
                                            <th className="p-3 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.length === 0 ? (
                                            <tr className="border-b bg-white italic text-muted-foreground">
                                                <td colSpan={5} className="p-12 text-center">
                                                    <div className="flex flex-col items-center gap-2 opacity-50">
                                                        <Layers className="h-8 w-8" />
                                                        <p>Agregue diagnósticos para este reporte HIS.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            fields.map((item, index) => (
                                                <tr key={item.id} className="border-b bg-white">
                                                    <td className="p-3 text-center">{index + 1}</td>
                                                    <td className="p-3">
                                                        <FormField
                                                            control={form.control}
                                                            name={`diagnoses.${index}.code`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input {...field} placeholder="Ej. J00" className="h-8" />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <FormField
                                                            control={form.control}
                                                            name={`diagnoses.${index}.type`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <select
                                                                            {...field}
                                                                            className="h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            <option value="PRESUMPTIVE">Presuntivo (P)</option>
                                                                            <option value="DEFINITIVE">Definitivo (D)</option>
                                                                            <option value="REPETITIVE">Repetitivo (R)</option>
                                                                        </select>
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <FormField
                                                            control={form.control}
                                                            name={`diagnoses.${index}.labValue`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input {...field} placeholder="Valor" className="h-8" />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <Button type="button" variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => remove(index)}>
                                                            Quitar
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-indigo-50 border-indigo-100">
                    <CardHeader className="py-4">
                        <CardTitle className="text-xs uppercase text-indigo-700">Consolidado Diario</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span>Nuevos:</span>
                            <span className="font-bold">0</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span>Continuadores:</span>
                            <span className="font-bold">0</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100">
                    <CardHeader className="py-4">
                        <CardTitle className="text-xs uppercase text-amber-700">Pendientes FUA</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <p className="text-2xl font-bold text-amber-600">12</p>
                        <p className="text-[10px] text-amber-800 leading-tight">Servicios sin código prestacional asociado</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
