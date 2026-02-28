import { Button } from '@/components/ui/button'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function EpidemiologyReportNewPage() {
    const navigate = useNavigate()

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Nueva Notificación Epidemiológica</h1>
                </div>
                <Button variant="destructive" className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Enviar Notificación NOTI-MINSA
                </Button>
            </div>
            <div className="border border-dashed rounded-lg p-24 text-center text-muted-foreground text-red-500 font-bold">
                Formulario de Vigilancia Epidemiológica (Alerta Placeholder)
            </div>
        </div>
    )
}
