import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Syringe, Plus, ArrowLeft, Calendar, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { patientsAPI } from '@/services/api'
import { Loader2 } from 'lucide-react'
import VaccinationModal from '@/components/modals/VaccinationModal'

interface Vaccination {
    id: string
    vaccineName: string
    doseNumber: string
    appliedAt: string
    lotNumber: string
    appliedBy: string
    applier?: {
        user: { firstName: string, lastName: string }
    }
}

export default function PatientVaccinationsPage() {
    const { id } = useParams()
    const [modalOpen, setModalOpen] = useState(false)

    const { data: vaccinations = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['patient-vaccinations', id],
        queryFn: async () => {
            if (!id) return []
            const res = await patientsAPI.getVaccinations(id)
            return res.data as Vaccination[]
        },
        enabled: !!id
    })

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link to={`/patients/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">Control de Vacunación</h1>
                        <p className="text-muted-foreground">Historial de inmunizaciones (ESNI)</p>
                    </div>
                </div>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setModalOpen(true)}>
                    <Plus className="h-4 w-4" /> Registrar Vacuna
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div className="flex items-center justify-center p-10 col-span-full">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-muted-foreground">Cargando historial de vacunas...</span>
                    </div>
                ) : vaccinations.length === 0 ? (
                    <p className="text-muted-foreground col-span-full text-center py-10">No se encontraron registros de vacunación.</p>
                ) : vaccinations.map((vax) => (
                    <Card key={vax.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-blue-600 border-blue-200">{vax.doseNumber}</Badge>
                                <ShieldCheck className="h-5 w-5 text-blue-500" />
                            </div>
                            <CardTitle className="text-lg">{vax.vaccineName}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {format(new Date(vax.appliedAt), "PP", { locale: es })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Lote:</span>
                                <span className="font-mono font-medium">{vax.lotNumber || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Aplicado por:</span>
                                <span>{vax.applier?.user ? `${vax.applier.user.firstName} ${vax.applier.user.lastName}` : vax.appliedBy || 'No especificado'}</span>
                            </div>
                            <Button variant="ghost" className="w-full mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50" size="sm">
                                Ver Carnet
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {id && (
                <VaccinationModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    patientId={id}
                    onSuccess={() => refetch()}
                />
            )}
        </div>
    )
}
