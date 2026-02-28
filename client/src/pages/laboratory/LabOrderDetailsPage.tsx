import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FlaskConical, Beaker, Clock, FileText, User, Tag, Calendar } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

export default function LabOrderDetailsPage() {
    const navigate = useNavigate()
    const { id } = useParams()

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Orden Lab #ORD-{id}
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Pendiente</Badge>
                        </h1>
                        <p className="text-muted-foreground">Solicitud de exámenes de laboratorio</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Imprimir Ticket
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 text-white">
                        <Beaker className="h-4 w-4" />
                        Procesar Muestras
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Pruebas Solicitadas</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {[
                                    { name: 'Hemograma Completo', category: 'Hematología', code: '85025' },
                                    { name: 'Glucosa en Ayunas', category: 'Bioquímica', code: '82947' },
                                    { name: 'Examen Completo de Orina', category: 'Uroanálisis', code: '81001' }
                                ].map((test, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded bg-indigo-50 flex items-center justify-center">
                                                <FlaskConical className="h-5 w-5 text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{test.name}</p>
                                                <p className="text-xs text-muted-foreground">{test.category}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="font-mono text-[10px]">{test.code}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Indicaciones Clínicas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-slate-50 p-4 rounded-lg text-sm italic text-slate-600">
                                "Paciente con sospecha de proceso infeccioso agudo y descarte de diabetes mellitus. Realizar toma de muestra en ayunas."
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Resumen de Orden</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" /> Paciente
                                </label>
                                <p className="text-sm font-semibold">Maria Elena Quispe</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Fecha Solicitud
                                </label>
                                <p className="text-sm font-semibold">28 Feb, 2024 - 08:30 AM</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                    <Tag className="h-3 w-3" /> Prioridad
                                </label>
                                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">URGENTE</Badge>
                            </div>
                            <div className="pt-2 border-t text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Tiempo de espera estimado: 4h
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
