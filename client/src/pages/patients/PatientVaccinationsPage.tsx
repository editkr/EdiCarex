import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Syringe, Plus, ArrowLeft, Calendar, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Vaccination {
    id: string
    name: string
    dose: string
    date: Date
    lot: string
    appliedBy: string
}

export default function PatientVaccinationsPage() {
    const { id } = useParams()
    const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simulación de fetch
        setTimeout(() => {
            setVaccinations([
                { id: '1', name: 'Influenza', dose: 'Anual', date: new Date(), lot: 'LOT-2024-X', appliedBy: 'Lic. Ana Pérez' },
                { id: '2', name: 'Hepatitis B', dose: '1era Dosis', date: new Date(Date.now() - 15724800000), lot: 'HB-9922', appliedBy: 'Lic. Ana Pérez' }
            ])
            setLoading(false)
        }, 800)
    }, [id])

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
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" /> Registrar Vacuna
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <p>Cargando historial...</p>
                ) : vaccinations.map((vax) => (
                    <Card key={vax.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-blue-600 border-blue-200">{vax.dose}</Badge>
                                <ShieldCheck className="h-5 w-5 text-blue-500" />
                            </div>
                            <CardTitle className="text-lg">{vax.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {format(vax.date, "PP", { locale: es })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Lote:</span>
                                <span className="font-mono font-medium">{vax.lot}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Aplicado por:</span>
                                <span>{vax.appliedBy}</span>
                            </div>
                            <Button variant="ghost" className="w-full mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50" size="sm">
                                Ver Carnet
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
