import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Search, FileBarChart, Layers, HelpCircle, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NewHISReportPage() {
    const navigate = useNavigate()

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Nuevo Registro HIS
                            <Badge variant="secondary" className="bg-slate-100 uppercase text-[10px]">Diario</Badge>
                        </h1>
                        <p className="text-muted-foreground text-sm">Registro de actividad para el sistema HIS-MINSA</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Guía Codificación
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Cerrar y Enviar Registro
                    </Button>
                </div>
            </div>

            <Card className="border-t-4 border-t-emerald-500 shadow-xl">
                <CardHeader className="bg-emerald-50/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Fecha Atención</label>
                                <Input type="date" className="h-9 w-40" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Profesional</label>
                                <p className="text-sm font-semibold pt-1">Dr. Edisson Paricahua</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Items registrados</span>
                            <span className="text-2xl font-bold text-emerald-600">0 / --</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="bg-slate-50 p-3 border-y flex items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar por DNI o Nombre del Paciente..." className="pl-9 bg-white" />
                        </div>
                        <Button variant="secondary" size="sm" className="bg-white border">
                            + Fila Rápida
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-100/50 text-[10px] uppercase font-bold text-muted-foreground border-b">
                                    <th className="p-3 text-left w-12 text-center">N°</th>
                                    <th className="p-3 text-left">FUA / DNI</th>
                                    <th className="p-3 text-left">Nombres y Apellidos</th>
                                    <th className="p-3 text-left">Edad/Sexo</th>
                                    <th className="p-3 text-left">DX (CIE-10)</th>
                                    <th className="p-3 text-left w-20 text-center">Lab/Res</th>
                                    <th className="p-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b bg-white italic text-muted-foreground">
                                    <td colSpan={7} className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                            <Layers className="h-8 w-8" />
                                            <p>No hay pacientes registrados en este lote HIS hoy.</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-indigo-50 border-indigo-100">
                    <CardHeader className="py-4">
                        <CardTitle className="text-xs uppercase text-indigo-700">Consolidado Diario</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span>Nuevos:</span>
                            <span className="font-bold">0</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span>Continuadores:</span>
                            <span className="font-bold">0</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100">
                    <CardHeader className="py-4">
                        <CardTitle className="text-xs uppercase text-amber-700">Pendientes FUA</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <p className="text-2xl font-bold text-amber-600">12</p>
                        <p className="text-[10px] text-amber-800 leading-tight">Servicios sin código prestacional asociado</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
