import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Send, FileText, ClipboardCheck, AlertCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

export default function UrgencyReferralPage() {
    const navigate = useNavigate()
    const { id } = useParams()

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nueva Referencia desde Urgencia</h1>
                    <p className="text-muted-foreground">Generación de hoja de referencia para el caso #{id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 shadow-lg border-primary/10">
                    <CardHeader className="bg-primary/5 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Datos de Referencia (Hoja 002)
                        </CardTitle>
                        <CardDescription>Complete la información clínica para el traslado</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Establecimiento Destino</label>
                                <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                    <option>Hospital III Juliaca (EsSalud)</option>
                                    <option>Hospital Carlos Monge Medrano (MINSA)</option>
                                    <option>Hospital Regional Manuel Nuñez Butrón</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Prioridad de Referencia</label>
                                <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-red-600 font-bold">
                                    <option>EMERGENCIA (I)</option>
                                    <option>URGENCIA (II)</option>
                                    <option>ELECTIVA (III)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Resumen del Cuadro Clínico</label>
                            <textarea
                                className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background"
                                placeholder="Describa el estado actual, diagnóstico presuntivo y motivo de transferencia..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tratamiento y Procedimientos realizados</label>
                            <textarea
                                className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background"
                                placeholder="Oxígeno, vía EV, medicamentos administrados..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline">Guardar como Borrador</Button>
                            <Button className="bg-primary text-primary-foreground flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                Generar e Imprimir Hoja
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-amber-200 bg-amber-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                                <AlertCircle className="h-4 w-4" />
                                Estado del Paciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                El paciente requiere acompañamiento de personal médico durante el traslado debido a inestabilidad hemodinámica.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Checklist de Referencia</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <ClipboardCheck className="h-4 w-4 text-green-500" />
                                <span>Epicrisis de Urgencia</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm opacity-50">
                                <div className="h-4 w-4 border rounded" />
                                <span>Coordinación con destino</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm opacity-50">
                                <div className="h-4 w-4 border rounded" />
                                <span>Ambulancia disponible</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
