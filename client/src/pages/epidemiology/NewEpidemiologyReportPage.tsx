import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ShieldAlert, Send, FileCheck, Phone, MapPin, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NewEpidemiologyReportPage() {
    const navigate = useNavigate()

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Ficha de Notificación Individual (NOTI-MINSA)
                            <Badge className="bg-red-100 text-red-700 border-red-200">INMEDIATA</Badge>
                        </h1>
                        <p className="text-muted-foreground text-sm uppercase font-mono">Formato Oficial DIRESA-PUNO / Vigilancia Epidemiológica</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-lg shadow-red-100">
                        <ShieldAlert className="h-4 w-4" />
                        Reportar Alerta Roja
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-lg">I. Datos de la Enfermedad Vigilada</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500">Evento / Diagnóstico</label>
                                <select className="w-full h-11 px-4 rounded-xl border bg-slate-50 font-medium">
                                    <option>Dengue con señales de alarma</option>
                                    <option>Rabia humana silvestre</option>
                                    <option>Malaria falciparum</option>
                                    <option>Neumonía grave</option>
                                    <option>COVID-19 (Confirmado)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500">Fecha Inicio Síntomas</label>
                                    <input type="date" className="w-full h-10 px-3 rounded-md border" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500">Tipo de Notificación</label>
                                    <div className="flex gap-3 pt-2">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="radio" name="type" /> Individual
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="radio" name="type" /> Brote
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-lg">II. Investigación de Campo</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Factores de Riesgo identificados</label>
                                <textarea className="w-full min-h-[80px] p-3 rounded-md border" placeholder="Hacinamiento, contacto con animales, viajes recientes..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Acciones de Control realizadas</label>
                                <textarea className="w-full min-h-[80px] p-3 rounded-md border" placeholder="Aislamiento domiciliario, bloqueo epidemiológico..." />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-indigo-900 text-white">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <Activity className="h-8 w-8 text-indigo-300" />
                                <h3 className="text-lg font-bold">Resumen Alerta</h3>
                            </div>
                            <div className="space-y-3 pt-2">
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-indigo-400 mt-1" />
                                    <div>
                                        <p className="text-[10px] uppercase opacity-60">Jurisdicción</p>
                                        <p className="text-sm">Jorge Chávez, Juliaca</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 text-indigo-400 mt-1" />
                                    <div>
                                        <p className="text-[10px] uppercase opacity-60">Contacto DIRESA</p>
                                        <p className="text-sm">051-XXXXXXXX</p>
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full bg-white text-indigo-900 hover:bg-indigo-50 mt-4 border-none font-bold">
                                <Send className="h-4 w-4 mr-2" />
                                Transmitir Ahora
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Control de Calidad</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-2">
                                    <FileCheck className="h-4 w-4 text-green-500" />
                                    CIE-10 Vinculado
                                </span>
                                <Badge variant="outline" className="text-green-600">OK</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    Geo-referencia
                                </span>
                                <Badge variant="outline" className="text-slate-400">PND</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
