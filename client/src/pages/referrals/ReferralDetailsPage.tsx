import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Printer, Share2, Building2, User, Clock, CheckCircle2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

export default function ReferralDetailsPage() {
    const navigate = useNavigate()
    const { id } = useParams()

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Referencia REF-{id}</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Hospital Carlos Monge Medrano
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Compartir
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                        <Printer className="h-4 w-4" />
                        Imprimir Formato
                    </Button>
                    <Button className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Marcar como Aceptada
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Información del Paciente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Paciente</p>
                                    <p className="font-semibold">Juan Pérez Rodriguez</p>
                                    <p className="text-xs text-muted-foreground mt-1">DNI: 4567XXXX • 45 años</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-blue-100">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Seguro</p>
                                    <p className="font-semibold text-blue-600">SIS Gratuito</p>
                                    <p className="text-xs text-muted-foreground mt-1">FUA: 001-2024-XXXX</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-sm font-semibold mb-3">Diagnósticos (CIE-10)</h3>
                            <div className="space-y-2">
                                <div className="p-3 bg-muted rounded-lg flex justify-between items-center text-sm">
                                    <span>K35.8 - Apendicitis aguda, otra y la no especificada</span>
                                    <Badge variant="outline">Presuntivo</Badge>
                                </div>
                                <div className="p-3 bg-muted rounded-lg flex justify-between items-center text-sm">
                                    <span>R10.4 - Otros dolores abdominales y los no especificados</span>
                                    <Badge variant="outline">Definitivo</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Resumen Clínico</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Paciente ingresa con dolor abdominal agudo en fosa iliaca derecha de 12 horas de evolución. Signos de irritación peritoneal positivos. Se requiere manejo quirúrgico en hospital de mayor complejidad.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Estado del Proceso</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Badge className="bg-amber-500 hover:bg-amber-600">PENDIENTE DE ACEPTACIÓN</Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Hace 15 min
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-medium uppercase text-muted-foreground">Establecimiento Origén</div>
                                <div className="text-sm font-semibold text-primary">C.S. Jorge Chávez</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-medium uppercase text-muted-foreground">Médico Referente</div>
                                <div className="text-sm font-semibold">Dr. Edisson Paricahua</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Timeline de la Referencia</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l pl-4 space-y-6">
                                <div className="relative">
                                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                                    <p className="text-xs font-bold">GENERADA</p>
                                    <p className="text-[10px] text-muted-foreground">28 Feb 2024 - 10:30 AM</p>
                                </div>
                                <div className="relative opacity-50">
                                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-slate-300 border-2 border-white shadow-sm" />
                                    <p className="text-xs font-bold">COORDINADA</p>
                                    <p className="text-[10px] text-muted-foreground text-italic">Esperando contacto...</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
