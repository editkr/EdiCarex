import { useState, useEffect } from 'react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { encountersAPI, healthStaffAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { useNavigate } from 'react-router-dom'

const encounterSchema = z.object({
    type: z.string().min(1, 'El tipo de encuentro es requerido'),
    staffId: z.string().min(1, 'Debe seleccionar el personal encargado'),
    reason: z.string().min(5, 'El motivo debe ser más detallado (mín. 5 caracteres)'),
})

type EncounterFormData = z.infer<typeof encounterSchema>

interface AddEncounterModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    patientId: string
    onSuccess?: () => void
}

export default function AddEncounterModal({ open, onOpenChange, patientId, onSuccess }: AddEncounterModalProps) {
    const [loading, setLoading] = useState(false)
    const [staffList, setStaffList] = useState<any[]>([])
    const { toast } = useToast()
    const navigate = useNavigate()

    const form = useForm<EncounterFormData>({
        resolver: zodResolver(encounterSchema),
        defaultValues: {
            type: '',
            staffId: '',
            reason: '',
        },
    })

    useEffect(() => {
        if (open) {
            healthStaffAPI.getAll().then(res => {
                setStaffList(res.data?.data || res.data || [])
            }).catch(console.error)
            form.reset()
        }
    }, [open, form])

    const onSubmit = async (data: EncounterFormData) => {
        try {
            setLoading(true)
            const payload = {
                ...data,
                patientId,
                status: 'OPEN'
            }

            const response = await encountersAPI.create(payload)

            toast({
                title: 'Encuentro creado',
                description: 'Redirigiendo al detalle...',
            })
            onOpenChange(false)
            form.reset()
            onSuccess?.()

            // Navigate to detail view
            if (response.data?.id) {
                navigate(`/patients/${patientId}/encounters/${response.data.id}`)
            } else {
                navigate(`/patients/${patientId}/encounters`)
            }
        } catch (error: any) {
            console.error('Error saving encounter:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al crear el encuentro clínico',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Agregar Registro Médico</DialogTitle>
                    <DialogDescription>
                        Cree un nuevo encuentro clínico para este paciente. Serás redirigido a la pantalla de atención.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de encuentro *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Consulta Externa">Consulta Externa</SelectItem>
                                            <SelectItem value="Consulta">Consulta Simple</SelectItem>
                                            <SelectItem value="Triaje">Triaje</SelectItem>
                                            <SelectItem value="Urgencia">Urgencia</SelectItem>
                                            <SelectItem value="Control">Control</SelectItem>
                                            <SelectItem value="Emergencia">Emergencia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="staffId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Médico / Personal *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar profesional" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {staffList.map(staff => (
                                                <SelectItem key={staff.id} value={staff.id}>
                                                    {staff.user?.firstName} {staff.user?.lastName} ({staff.profession || 'Personal'})
                                                </SelectItem>
                                            ))}
                                            {staffList.length === 0 && (
                                                <SelectItem value="none" disabled>No se encontró personal disponible</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Motivo de consulta *</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describa el motivo principal de la consulta..." className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Crear Encuentro
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
