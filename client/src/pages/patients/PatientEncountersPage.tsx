import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Plus, ArrowLeft, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { useQuery } from '@tanstack/react-query'
import { patientsAPI } from '@/services/api'
import { Loader2 } from 'lucide-react'

interface Encounter {
    id: string
    type: string
    status: string
    createdAt: string
    reason: string
    staff?: {
        user: { firstName: string, lastName: string }
    }
}

export default function PatientEncountersPage() {
    const { id } = useParams()
    const { data: encounters = [], isLoading: loading } = useQuery({
        queryKey: ['patient-encounters', id],
        queryFn: async () => {
            if (!id) return []
            const res = await patientsAPI.getEncounters(id)
            return res.data as Encounter[]
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
                        <h1 className="text-3xl font-bold tracking-tight">Historial de Encuentros</h1>
                        <p className="text-muted-foreground">Consultas, triajes y evolución clínica del paciente</p>
                    </div>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Nuevo Encuentro
                </Button>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : encounters.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                        No se encontraron encuentros clínicos para este paciente.
                    </div>
                ) : encounters.map((encounter) => (
                    <Card key={encounter.id} className="hover:bg-accent/5 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    {encounter.type}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-4">
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(encounter.createdAt), "PPP", { locale: es })}</span>
                                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {encounter.staff?.user ? `${encounter.staff.user.firstName} ${encounter.staff.user.lastName}` : 'No especificado'}</span>
                                </CardDescription>
                            </div>
                            <Badge variant={encounter.status === 'OPEN' ? 'default' : 'secondary'}>
                                {encounter.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium">Motivo: {encounter.reason || 'Sin especificar'}</p>
                            <div className="mt-4 flex gap-2">
                                <Button variant="outline" size="sm">Ver Detalles</Button>
                                {encounter.status === 'OPEN' && <Button size="sm">Registrar Evolución</Button>}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
