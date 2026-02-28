import { Button } from '@/components/ui/button'
import { ArrowLeft, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function HISReportingNewPage() {
    const navigate = useNavigate()

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Nuevo Registro HIS</h1>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Guardar Registro Diario
                </Button>
            </div>
            <div className="border border-dashed rounded-lg p-24 text-center text-muted-foreground">
                Formulario de Codificación HIS-MINSA (Placeholder)
            </div>
        </div>
    )
}
