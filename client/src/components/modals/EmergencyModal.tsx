import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, User, AlertTriangle, Loader2 } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { patientsAPI, emergencyAPI, healthStaffAPI } from '@/services/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Activity, Thermometer, Wind, Heart, Droplet } from 'lucide-react'

const emergencySchema = z.object({
    patientId: z.string().min(1, 'El paciente es requerido'),
    triageLevel: z.string().min(1, 'El nivel de triaje es requerido'),
    chiefComplaint: z.string().min(1, 'El motivo de consulta es requerido'),
    diagnosis: z.string().min(1, 'El diagnóstico inicial es requerido'),
    staffId: z.string().min(1, 'El personal tratante es requerido'),
    bedId: z.string().min(1, 'La cama es requerida'),
    hr: z.string().optional(),
    bp: z.string().optional(),
    temp: z.string().optional(),
    spo2: z.string().optional(),
    rr: z.string().optional(),
    notes: z.string().optional(),
})

interface EmergencyModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultPatientId?: string
    initialData?: any // To support edit mode
    onSuccess: () => void
}

export default function EmergencyModal({
    open,
    onOpenChange,
    defaultPatientId,
    initialData,
    onSuccess,
}: EmergencyModalProps) {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const [searchTerm, setSearchTerm] = useState('')
    const [openSearch, setOpenSearch] = useState(false)

    // Load patients for search if no defaultPatientId
    const { data: patientsData } = useQuery({
        queryKey: ['patients-search', searchTerm],
        queryFn: () => patientsAPI.getAll(),
        enabled: open && !defaultPatientId,
    })

    const { data: staffData } = useQuery({
        queryKey: ['staff-emergency'],
        queryFn: () => healthStaffAPI.getAll(),
        enabled: open,
    })

    const { data: bedsData } = useQuery({
        queryKey: ['beds-available', initialData?.bedId],
        queryFn: async () => {
            const res = await emergencyAPI.getBeds({ status: 'AVAILABLE' })
            let beds = res.data || []
            // If editing, include the current bed of the patient even if it's OCCUPIED
            if (initialData?.bedId) {
                const currentBedRes = await emergencyAPI.getBedById(initialData.bedId)
                if (currentBedRes.data && !beds.find((b: any) => b.id === initialData.bedId)) {
                    beds.push(currentBedRes.data)
                }
            }
            return { data: beds }
        },
        enabled: open,
    })

    const patients = patientsData?.data?.data || []
    const staff = staffData?.data?.data || []
    const beds = (bedsData?.data || []).filter((bed: any) => bed.ward === 'Emergencia')

    // Default form values
    const form = useForm<z.infer<typeof emergencySchema>>({
        resolver: zodResolver(emergencySchema),
        defaultValues: {
            patientId: initialData?.patientId || defaultPatientId || '',
            triageLevel: initialData?.triageLevel?.toString() || '3',
            chiefComplaint: initialData?.chiefComplaint || '',
            diagnosis: initialData?.diagnosis || '',
            staffId: initialData?.staffId || '',
            bedId: initialData?.bedId || '',
            hr: initialData?.vitalSigns?.hr?.toString() || '',
            bp: initialData?.vitalSigns?.bp || '',
            temp: initialData?.vitalSigns?.temp?.toString() || '',
            spo2: initialData?.vitalSigns?.spo2?.toString() || '',
            rr: initialData?.vitalSigns?.rr?.toString() || '',
            notes: initialData?.notes || '',
        },
    })

    // Reset form when modal opens or initialData changes
    useEffect(() => {
        if (open) {
            form.reset({
                patientId: initialData?.patientId || defaultPatientId || '',
                triageLevel: initialData?.triageLevel?.toString() || '3',
                chiefComplaint: initialData?.chiefComplaint || '',
                diagnosis: initialData?.diagnosis || '',
                staffId: initialData?.staffId || '',
                bedId: initialData?.bedId || '',
                hr: initialData?.vitalSigns?.hr?.toString() || '',
                bp: initialData?.vitalSigns?.bp || '',
                temp: initialData?.vitalSigns?.temp?.toString() || '',
                spo2: initialData?.vitalSigns?.spo2?.toString() || '',
                rr: initialData?.vitalSigns?.rr?.toString() || '',
                notes: initialData?.notes || '',
            })
        }
    }, [open, initialData, defaultPatientId, form])

    const onSubmit = async (values: z.infer<typeof emergencySchema>) => {
        try {
            // Create a clean payload according to the CreateEmergencyCaseDto
            const payload = {
                patientId: values.patientId,
                triageLevel: parseInt(values.triageLevel),
                chiefComplaint: values.chiefComplaint,
                diagnosis: values.diagnosis || null,
                staffId: values.staffId || null,
                bedId: values.bedId || null,
                notes: values.notes || null,
                vitalSigns: {
                    hr: values.hr || null,
                    bp: values.bp || null,
                    temp: values.temp || null,
                    spo2: values.spo2 || null,
                    rr: values.rr || null,
                }
            }

            if (initialData?.id) {
                await emergencyAPI.updateCase(initialData.id, payload)
                toast({
                    title: 'Registro actualizado',
                    description: 'Los datos de la emergencia han sido actualizados correctamente.',
                })
            } else {
                await emergencyAPI.createRecord(payload)
                toast({
                    title: 'Registro creado',
                    description: 'La admisión de emergencia ha sido registrada correctamente.',
                })
            }

            onSuccess()
            onOpenChange(false)
            form.reset()
        } catch (error: any) {
            console.error('Error in emergency record operation:', error)
            const errorMsg = error.response?.data?.message || 'No se pudo procesar la solicitud. Intente nuevamente.'
            toast({
                title: 'Error',
                description: errorMsg,
                variant: 'destructive',
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader className="border-b border-zinc-800 pb-4">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        {initialData ? 'Editar Caso de Emergencia' : 'Nueva Admisión de Emergencia'}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {initialData
                            ? 'Actualice los datos clínicos y de asignación del paciente.'
                            : 'Complete los datos para registrar un ingreso crítico al sistema.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        {/* Patient Selection (if not provided) */}
                        {!defaultPatientId && (
                            <FormField
                                control={form.control}
                                name="patientId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Paciente</FormLabel>
                                        <Popover open={openSearch} onOpenChange={setOpenSearch}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-100",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value
                                                            ? `${patients.find((p: any) => p.id === field.value)?.firstName} ${patients.find((p: any) => p.id === field.value)?.lastName}`
                                                            : "Buscar paciente..."}
                                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-900 border-zinc-700">
                                                <Command className="bg-zinc-900">
                                                    <CommandInput placeholder="Nombre o DNI..." className="text-zinc-100" />
                                                    <CommandList>
                                                        <CommandEmpty>No se encontraron pacientes.</CommandEmpty>
                                                        <CommandGroup>
                                                            {patients.map((p: any) => (
                                                                <CommandItem
                                                                    value={`${p.firstName} ${p.lastName} ${p.documentNumber}`}
                                                                    key={p.id}
                                                                    onSelect={() => {
                                                                        form.setValue("patientId", p.id)
                                                                        setOpenSearch(false)
                                                                    }}
                                                                    className="text-zinc-100 hover:bg-zinc-800"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{p.firstName} {p.lastName}</span>
                                                                        <span className="text-xs text-zinc-400">DNI: {p.documentNumber}</span>
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
                                )}
                            />
                        )}

                        {defaultPatientId && (
                            <input type="hidden" {...form.register("patientId")} />
                        )}

                        {/* Triage Level with Visual Cues */}
                        <FormField
                            control={form.control}
                            name="triageLevel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nivel de Triaje (Prioridad)</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                                <SelectValue placeholder="Seleccione prioridad" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                            <SelectItem value="1" className="hover:bg-zinc-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-red-600" />
                                                    <span>Nivel 1 — Resucitación (Crítico)</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="2" className="hover:bg-zinc-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                                                    <span>Nivel 2 — Emergencia</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="3" className="hover:bg-zinc-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                                    <span>Nivel 3 — Urgencia</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="4" className="hover:bg-zinc-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                                    <span>Nivel 4 — Urgencia Menor</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="5" className="hover:bg-zinc-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                    <span>Nivel 5 — No Urgente</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Staff Selection */}
                            <FormField
                                control={form.control}
                                name="staffId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Personal Tratante</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                                    <SelectValue placeholder="Asignar personal" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                                {staff.map((member: any) => (
                                                    <SelectItem key={member.id} value={member.id}>
                                                        {member.user.firstName} {member.user.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Bed Selection */}
                            <FormField
                                control={form.control}
                                name="bedId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cama / Camilla</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                                    <SelectValue placeholder="Asignar cama" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                                {beds.map((bed: any) => (
                                                    <SelectItem key={bed.id} value={bed.id}>
                                                        {bed.number} ({bed.ward})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Vital Signs Section */}
                        <div className="space-y-4">
                            <span className="text-zinc-400 text-xs uppercase tracking-wider font-bold block mb-2">Signos Vitales</span>
                            <div className="grid grid-cols-4 gap-2">
                                <FormField
                                    control={form.control}
                                    name="hr"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative">
                                                    <Heart className="absolute left-2 top-2.5 h-4 w-4 text-red-500/50" />
                                                    <Input placeholder="FC" className="pl-8 bg-zinc-950 border-zinc-800" {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative">
                                                    <Activity className="absolute left-2 top-2.5 h-4 w-4 text-blue-500/50" />
                                                    <Input placeholder="PA" className="pl-8 bg-zinc-950 border-zinc-800" {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="temp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative">
                                                    <Thermometer className="absolute left-2 top-2.5 h-4 w-4 text-orange-500/50" />
                                                    <Input placeholder="T°" className="pl-8 bg-zinc-950 border-zinc-800" {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="spo2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative">
                                                    <Wind className="absolute left-2 top-2.5 h-4 w-4 text-cyan-500/50" />
                                                    <Input placeholder="SpO2" className="pl-8 bg-zinc-950 border-zinc-800" {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="rr"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative">
                                                    <Droplet className="absolute left-2 top-2.5 h-4 w-4 text-purple-500/50" />
                                                    <Input placeholder="RR" className="pl-8 bg-zinc-950 border-zinc-800" {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Chief Complaint */}
                        <FormField
                            control={form.control}
                            name="chiefComplaint"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Motivo de Consulta (Queja Principal)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej. Dolor abdominal agudo, Fiebre alta..."
                                            {...field}
                                            className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Diagnosis */}
                        <FormField
                            control={form.control}
                            name="diagnosis"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Diagnóstico Inicial / Impresión Diagnóstica</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej. Apendicitis aguda, Fractura de fémur..."
                                            {...field}
                                            className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas Adicionales / Historia Clínica Breve</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Observaciones iniciales, alergias reportadas, signos vitales si se conocen..."
                                            className="resize-none h-32 bg-zinc-950 border-zinc-800 text-zinc-100"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="border-t border-zinc-800 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {form.formState.isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                )}
                                {initialData ? 'Guardar Cambios' : 'Registrar Admisión'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
