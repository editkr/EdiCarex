import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Syringe, Calendar } from 'lucide-react'

export default function PatientVaccinationsPortalPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Mi Carnet de Vacunas</h1>
                <Badge variant="outline" className="text-primary border-primary">Documento Oficial</Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Syringe className="h-5 w-5 text-primary" />
                        Historial de Inmunizaciones
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No se encontraron registros de vacunas recientemente.</p>
                        <p className="text-sm">Si cree que esto es un error, contacte con el personal de salud.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
