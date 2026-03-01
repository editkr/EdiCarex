import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { patientsAPI } from '@/services/api'
import { Loader2 } from 'lucide-react'

// Common MINSA programs for an I-4
const MINSA_PROGRAMS = [
    { id: '1', name: 'Prevención y Control de Tuberculosis (TB)' },
    { id: '2', name: 'Salud Materno Neonatal' },
    { id: '3', name: 'Prevención y Control del Cáncer' },
    { id: '4', name: 'Enfermedades Metaxénicas y Zoonosis' },
    { id: '5', name: 'Enfermedades No Transmisibles (Hipertensión/Diabetes)' },
    { id: '6', name: 'Control de Crecimiento y Desarrollo (CRED)' },
    { id: '7', name: 'Planificación Familiar' },
    { id: '8', name: 'Salud Mental' }
]

interface AddMinsaProgramModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    patientId: string
    onSuccess: () => void
}

export default function AddMinsaProgramModal({
    open,
    onOpenChange,
    patientId,
    onSuccess,
}: AddMinsaProgramModalProps) {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedProgram, setSelectedProgram] = useState('')
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [notes, setNotes] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedProgram) {
            toast({
                title: 'Error',
                description: 'Debe seleccionar un programa MINSA.',
                variant: 'destructive',
            })
            return
        }

        try {
            setIsSubmitting(true)

            // Si el backend es flexible, enviamos el ID y nombre asumiendo que el modelo puede manejarlo
            // O podríamos enviar solo data básica según lo esperado por el controlador
            const programName = MINSA_PROGRAMS.find(p => p.id === selectedProgram)?.name || ''

            await patientsAPI.enrollMinsaProgram(patientId, {
                programId: selectedProgram,
                programName: programName,
                visitDate: startDate,
                notes: notes,
            })

            toast({
                title: 'Éxito',
                description: 'Paciente inscrito en el programa correctamente.',
            })

            onSuccess()
            onOpenChange(false)

            // Reset form
            setSelectedProgram('')
            setNotes('')

        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'No se pudo inscribir al paciente en el programa.',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Inscribir a Programa MINSA</DialogTitle>
                    <DialogDescription>
                        Afilie a este paciente a un nuevo programa o estrategia de salud.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Programa MINSA</Label>
                        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un programa" />
                            </SelectTrigger>
                            <SelectContent>
                                {MINSA_PROGRAMS.map(program => (
                                    <SelectItem key={program.id} value={program.id}>
                                        {program.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Fecha de Ingreso</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Notas Iniciales (Opcional)</Label>
                        <Textarea
                            placeholder="Ej. Derivado desde triaje, primer control..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Inscribir Paciente
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
