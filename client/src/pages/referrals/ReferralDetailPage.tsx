import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

export default function ReferralDetailPage() {
    const navigate = useNavigate()
    const { id } = useParams()

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Detalle de Referencia #{id}</h1>
            </div>
            <div className="border rounded-lg p-12 text-center text-muted-foreground italic">
                Cargando información técnica de la referencia...
            </div>
        </div>
    )
}
