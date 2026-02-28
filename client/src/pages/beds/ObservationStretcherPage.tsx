import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Clock, Thermometer, Activity, User, ClipboardList, Timer, AlertCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function ObservationStretcherPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [progress, setProgress] = useState(65) // 65% of 12h

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Sala de Observación - Camilla #{id}
                            <Badge className="bg-blue-500 text-white">OCUPADA</Badge>
                        </h1>
                        <p className="text-muted-foreground text-sm">Monitoreo activo del paciente</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        Finalizar Observación
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                        Registrar Evolución
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2">
                                <Timer className="h-5 w-5 text-orange-500" />
                                Tiempo en Observación
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-4xl font-mono font-bold">07:45:12</span>
                                    <span className="text-sm text-muted-foreground">Límite: 12:00:00</span>
                                </div>
                                <Progress value={progress} className="h-3" />
                                <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>Quedan 4 horas y 15 minutos para decisión médica (Alta o Referencia)</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-red-500" />
                                    Presión Arterial
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">120/80 <span className="text-xs font-normal text-muted-foreground">mmHg</span></p>
                                <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1 italic">Estable</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Thermometer className="h-4 w-4 text-orange-500" />
                                    Temperatura
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">38.2 <span className="text-xs font-normal text-muted-foreground">°C</span></p>
                                <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1 italic">Febrícula</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Kardex de Notas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border-l-2 border-primary pl-4 py-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold font-mono">12:30 PM</span>
                                    <Badge variant="outline" className="text-[10px]">ENFERMERÍA</Badge>
                                </div>
                                <p className="text-sm">Se administra paracetamol 1g EV por cuadro febril. Paciente tranquilo.</p>
                            </div>
                            <div className="border-l-2 border-primary pl-4 py-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold font-mono">10:15 AM</span>
                                    <Badge variant="outline" className="text-[10px]">MÉDICO</Badge>
                                </div>
                                <p className="text-sm">Ingreso a observación por deshidratación leve. Solicitar electrolitos.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Datos del Paciente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                    RC
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Raúl Condori</p>
                                    <p className="text-xs text-muted-foreground">HC: 456721 • 32 años</p>
                                </div>
                            </div>
                            <div className="space-y-2 border-t pt-4">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Dx Ingreso:</span>
                                    <span className="font-medium text-right">Gastroenteritis aguda</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">SIS:</span>
                                    <Badge className="h-4 text-[9px] bg-blue-100 text-blue-700">ACTIVO</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Plan de Cuidados</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-xs">
                                <div className="h-3 w-3 rounded-full bg-green-500" />
                                Hidratación venosa activa
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className="h-3 w-3 rounded-full bg-slate-200" />
                                Balance hídrico c/4h
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className="h-3 w-3 rounded-full bg-slate-200" />
                                Control de funciones vitales
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
