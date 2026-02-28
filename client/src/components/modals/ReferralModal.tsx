import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { emergencyAPI } from "@/services/api"
import { useToast } from "@/components/ui/use-toast"
import {
    Building2,
    Activity,
    ShieldAlert,
    BedDouble,
    Info,
    CheckCircle2,
    MoveRight,
    Stethoscope,
    AlertCircle,
    User,
    Heart,
    Wind,
    Thermometer,
    Droplet
} from 'lucide-react'
import { cn } from "@/lib/utils"

const referralSchema = z.object({
    targetWard: z.string().min(1, 'El área de destino es requerida'),
    targetBedId: z.string().min(1, 'Debe seleccionar una cama para continuar'),
    notes: z.string().min(1, 'Debe ingresar una nota de traslado'),
})

interface ReferralModalProps {
    isOpen: boolean
    onClose: () => void
    caseId: string
    patientName: string
    currentVitals: any
    news2Score: number
    isCritical: boolean
    initialWard: string
    staffName: string
    staffSpecialty: string
    onSuccess: () => void
}

export default function ReferralModal({
    isOpen,
    onClose,
    caseId,
    patientName,
    currentVitals,
    news2Score,
    isCritical,
    initialWard,
    staffName,
    staffSpecialty,
    onSuccess
}: ReferralModalProps) {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [availableBeds, setAvailableBeds] = useState<any[]>([])
    const [isLoadingBeds, setIsLoadingBeds] = useState(false)

    const form = useForm<z.infer<typeof referralSchema>>({
        resolver: zodResolver(referralSchema),
        mode: 'onChange',
        defaultValues: {
            targetWard: initialWard || 'General',
            targetBedId: '',
            notes: '',
        },
    })

    const selectedWard = form.watch('targetWard')

    useEffect(() => {
        if (isOpen) {
            fetchBeds(selectedWard)
        }
    }, [selectedWard, isOpen])

    useEffect(() => {
        if (initialWard) {
            form.setValue('targetWard', initialWard)
        }
    }, [initialWard, form])

    const fetchBeds = async (ward: string) => {
        try {
            setIsLoadingBeds(true)
            const res = await emergencyAPI.getBeds({ ward, status: 'AVAILABLE' })
            setAvailableBeds(res.data)
            // Reset bed selection if ward changes
            form.setValue('targetBedId', '')
        } catch (error) {
            console.error('Error fetching beds:', error)
        } finally {
            setIsLoadingBeds(false)
        }
    }

    async function onSubmit(values: z.infer<typeof referralSchema>) {
        try {
            setIsSubmitting(true)
            await emergencyAPI.transferPatient(caseId, values.targetWard, values.targetBedId, values.notes)
            toast({
                title: 'Referencia Completada',
                description: `El paciente ha sido derivado a ${values.targetWard} exitosamente.`
            })
            onSuccess()
            onClose()
        } catch (error: any) {
            toast({
                title: 'Error en Referencia',
                description: error.response?.data?.message || 'No se pudo completar el traslado',
                variant: 'destructive'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 border-b border-zinc-800">
                    <DialogHeader>
                        <div className="flex justify-between items-center mb-2">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex gap-1 items-center">
                                <Stethoscope className="h-3 w-3" />
                                Formulario de Referencia Interna
                            </Badge>
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                news2Score >= 7 ? "bg-red-500/20 text-red-500" :
                                    news2Score >= 5 ? "bg-orange-500/20 text-orange-500" :
                                        "bg-green-500/20 text-green-500"
                            )}>
                                <ShieldAlert className="h-3 w-3" />
                                NEWS2: {news2Score}
                            </div>
                        </div>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <MoveRight className="text-zinc-500" />
                            Derivación de Paciente
                        </DialogTitle>
                        <div className="mt-2 flex items-center gap-3 p-2 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                {staffName?.split(' ').pop()?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Personal que Refiere</p>
                                <p className="text-xs font-semibold text-zinc-200">{staffName} • <span className="text-primary/70">{staffSpecialty}</span></p>
                            </div>
                        </div>
                        <DialogDescription className="text-zinc-400 mt-3">
                            Complete el proceso de traslado clínico para <span className="text-zinc-100 font-semibold">{patientName}</span>.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* Clinical Summary */}
                    <div className="grid grid-cols-5 gap-2 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                        <div className="flex flex-col items-center justify-center border-r border-zinc-800">
                            <Heart className="h-4 w-4 text-red-500 mb-1" />
                            <span className="text-[10px] text-zinc-500 uppercase">FC</span>
                            <span className="font-bold">{currentVitals?.heartRate || '--'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center border-r border-zinc-800">
                            <Activity className="h-4 w-4 text-blue-500 mb-1" />
                            <span className="text-[10px] text-zinc-500 uppercase">PA</span>
                            <span className="font-bold">{currentVitals?.bloodPressure || '--/--'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center border-r border-zinc-800">
                            <Thermometer className="h-4 w-4 text-orange-500 mb-1" />
                            <span className="text-[10px] text-zinc-500 uppercase">Temp</span>
                            <span className="font-bold">{currentVitals?.temperature || '--'}°</span>
                        </div>
                        <div className="flex flex-col items-center justify-center border-r border-zinc-800">
                            <Wind className="h-4 w-4 text-cyan-500 mb-1" />
                            <span className="text-[10px] text-zinc-500 uppercase">SpO2</span>
                            <span className="font-bold">{currentVitals?.spo2 || '--'}%</span>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <Droplet className="h-4 w-4 text-purple-500 mb-1" />
                            <span className="text-[10px] text-zinc-500 uppercase">FR</span>
                            <span className="font-bold">{currentVitals?.respiratoryRate || '--'}</span>
                        </div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Destination Ward */}
                                <FormField
                                    control={form.control}
                                    name="targetWard"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-zinc-400">Área de Destino</FormLabel>
                                            <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                                                <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800">
                                                    <TabsTrigger
                                                        value="General"
                                                        className="data-[state=active]:bg-zinc-800 data-[state=active]:text-primary"
                                                    >
                                                        <Building2 className="h-4 w-4 mr-2" />
                                                        Piso
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="UCI"
                                                        className="data-[state=active]:bg-zinc-800 data-[state=active]:text-red-500"
                                                    >
                                                        <Activity className="h-4 w-4 mr-2" />
                                                        UCI
                                                    </TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Bed Selection */}
                                <FormField
                                    control={form.control}
                                    name="targetBedId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-zinc-400">Cama Disponible ({selectedWard})</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                                        <SelectValue placeholder={isLoadingBeds ? "Cargando..." : "Seleccionar cama..."} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                                    {isLoadingBeds ? (
                                                        <div className="p-2 space-y-2">
                                                            <Skeleton className="h-8 w-full bg-zinc-800" />
                                                            <Skeleton className="h-8 w-full bg-zinc-800" />
                                                        </div>
                                                    ) : availableBeds.length === 0 ? (
                                                        <div className="p-4 text-center text-xs text-zinc-500">
                                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                            No hay camas disponibles en esta área
                                                        </div>
                                                    ) : (
                                                        availableBeds.map((bed) => (
                                                            <SelectItem key={bed.id} value={bed.id} className="focus:bg-zinc-800">
                                                                <div className="flex items-center gap-2">
                                                                    <BedDouble className="h-4 w-4 text-zinc-500" />
                                                                    <span className="font-bold">{bed.number}</span>
                                                                    <span className="text-[10px] text-zinc-500 uppercase ml-2">{bed.type}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Referral Notes */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-zinc-400">Indicaciones de Traslado / Epicrisis Breve</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ej: Paciente estable para traslado, requiere monitoreo continuo de SpO2..."
                                                className="bg-zinc-900 border-zinc-800 min-h-[100px] resize-none focus:ring-primary"
                                                {...field}
                                            />
                                        </FormControl>
                                        <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
                                            <Info className="h-3 w-3" />
                                            Esta nota quedará registrada de forma permanente en la historia clínica.
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-4 border-t border-zinc-800">
                                <Button type="button" variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !form.formState.isValid}
                                    className={cn(
                                        "px-8 font-bold",
                                        isCritical ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Activity className="mr-2 h-4 w-4 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Confirmar Referencia
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
