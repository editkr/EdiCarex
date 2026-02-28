import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Search } from 'lucide-react'

export default function PatientReferralsPage() {
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Mis Referencias</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Solicitudes de Referencia y Contrareferencia
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Aún no tiene órdenes de referencia generadas.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
