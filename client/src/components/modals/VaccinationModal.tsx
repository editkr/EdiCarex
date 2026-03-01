import { useState } from 'react'
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
import { patientsAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/stores/authStore'

const vaccinationSchema = z.object({
    vaccineName: z.string().min(1, 'El nombre de la vacuna es requerido'),
    doseNumber: z.string().min(1, 'La dosis es requerida'),
    category: z.string().min(1, 'La categoría ESNI es requerida'),
    lotNumber: z.string().min(1, 'El número de lote es obligatorio'),
    expirationDate: z.string().min(1, 'La fecha de vencimiento es obligatoria').refine((date) => {
        const selected = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return selected >= today
    }, {
        message: 'El lote de la vacuna está vencido'
    }),
    coldChainTemp: z.preprocess((val) => Number(val), z.number().optional()),
    coldChainVerifiedBy: z.string().optional(),
    vialNumber: z.string().optional(),
    site: z.string().optional(),
    route: z.string().min(1, 'La ruta de administración es requerida'),
    nextDoseDate: z.string().optional(),
    notes: z.string().optional(),
})

type VaccinationFormData = z.infer<typeof vaccinationSchema>

interface VaccinationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    patientId: string
    onSuccess?: () => void
}

export default function VaccinationModal({ open, onOpenChange, patientId, onSuccess }: VaccinationModalProps) {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()
    const user = useAuthStore(state => state.user)

    const form = useForm<VaccinationFormData>({
        resolver: zodResolver(vaccinationSchema),
        defaultValues: {
            vaccineName: '',
            doseNumber: '',
            category: '',
            lotNumber: '',
            expirationDate: '',
            coldChainVerifiedBy: '',
            vialNumber: '',
            site: '',
            route: 'IM',
            nextDoseDate: '',
            notes: '',
        },
    })

    const onSubmit = async (data: VaccinationFormData) => {
        try {
            setLoading(true)

            const payload = {
                ...data,
                appliedBy: user ? `${user.firstName} ${user.lastName}` : 'Personal de Salud',
            }

            // Convert empty fields to undefined
            if (payload.nextDoseDate === '') delete payload.nextDoseDate

            // Format dates
            if (payload.expirationDate) {
                payload.expirationDate = new Date(payload.expirationDate).toISOString()
            }
            if (payload.nextDoseDate) {
                payload.nextDoseDate = new Date(payload.nextDoseDate).toISOString()
            }

            await patientsAPI.addVaccination(patientId, payload)

            toast({
                title: 'Éxito',
                description: 'Vacuna registrada correctamente.',
            })
            onOpenChange(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            console.error('Error saving vaccination:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al registrar la vacuna',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Registrar Vacuna (ESNI)</DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles de la vacuna aplicada al paciente.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="vaccineName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de la Vacuna *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. VPH, Influenza, BCG" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="doseNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Dosis *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar dosis" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="1ra">1ra Dosis</SelectItem>
                                                <SelectItem value="2da">2da Dosis</SelectItem>
                                                <SelectItem value="3ra">3ra Dosis</SelectItem>
                                                <SelectItem value="Refuerzo">Refuerzo</SelectItem>
                                                <SelectItem value="Unica">Dosis Única</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría ESNI *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar categoría" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="NINO">Niño</SelectItem>
                                                <SelectItem value="EMBARAZADA">Embarazada</SelectItem>
                                                <SelectItem value="ADULTO">Adulto</SelectItem>
                                                <SelectItem value="ADULTO_MAYOR">Adulto Mayor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lotNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Lote *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Lote de la vacuna" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="expirationDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vencimiento del lote *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-500" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="coldChainTemp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Temp Cadena de Frío (°C)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" placeholder="+2 a +8" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="vialNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vial</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar estado de vial" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Abierto">Abierto</SelectItem>
                                                <SelectItem value="Cerrado">Cerrado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="coldChainVerifiedBy"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Verificado por (Cadena de frío)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nombre del verificador" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="site"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sitio de aplicación</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. Deltoides derecho" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="route"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ruta de administración *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar ruta" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="IM">Intramuscular (IM)</SelectItem>
                                                <SelectItem value="SC">Subcutánea (SC)</SelectItem>
                                                <SelectItem value="ID">Intradérmica (ID)</SelectItem>
                                                <SelectItem value="VO">Vía Oral (VO)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nextDoseDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha próxima dosis (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas u observaciones</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Observaciones adicionales" className="resize-none" {...field} />
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
                                Guardar Vacuna
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
