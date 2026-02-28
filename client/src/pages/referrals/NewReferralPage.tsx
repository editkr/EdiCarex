import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, Search, Building2, UserPlus, FileText, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NewReferralPage() {
    const navigate = useNavigate()

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Solicitud de Referencia (Hoja 002)</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Origen: C.S. Jorge Chávez
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
                    <Button className="bg-primary text-primary-foreground flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Enviar Solicitud
                    </Button>
                </div>
            </div>

            <Card className="shadow-lg border-primary/5">
                <CardHeader className="bg-primary/5 border-b py-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase text-primary tracking-wider">Búsqueda de Paciente</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <input className="w-full h-10 pl-10 pr-4 rounded-lg border bg-white shadow-sm" placeholder="Ingrese DNI..." />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase text-primary tracking-wider">UPSS Destino</h3>
                            <select className="w-full h-10 px-4 rounded-lg border bg-white shadow-sm">
                                <option>Ginecología y Obstetricia</option>
                                <option>Cirugía General</option>
                                <option>Pediatría</option>
                                <option>Medicina Interna</option>
                            </select>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase text-primary tracking-wider">Prioridad</h3>
                            <div className="flex gap-2">
                                <Badge className="bg-red-500 hover:bg-red-600 cursor-pointer px-4 py-1">P1</Badge>
                                <Badge variant="outline" className="cursor-pointer px-4 py-1">P2</Badge>
                                <Badge variant="outline" className="cursor-pointer px-4 py-1">P3</Badge>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <h3 className="font-bold">Resumen Clínico</h3>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Antecedentes de relevancia</label>
                                <textarea className="w-full min-h-[80px] p-4 rounded-xl border bg-slate-50/50" placeholder="Alergias, intervenciones previas, enfermedades crónicas..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Examen Físico (Hallazgos)</label>
                                <textarea className="w-full min-h-[80px] p-4 rounded-xl border bg-slate-50/50" placeholder="Signos vitales, hallazgos significativos..." />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <ClipboardList className="h-5 w-5 text-primary" />
                                <h3 className="font-bold">Motivo de Transferencia</h3>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Justificación Técnica</label>
                                <textarea className="w-full min-h-[80px] p-4 rounded-xl border bg-slate-50/50" placeholder="Falta de especialista, necesidad de exámenes auxiliares, etc..." />
                            </div>
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <h4 className="text-xs font-bold text-blue-700 flex items-center gap-2 mb-2">
                                    <UserPlus className="h-4 w-4" />
                                    MÉDICO QUE REFIERE
                                </h4>
                                <p className="text-sm font-semibold">Dr. Edisson Paricahua</p>
                                <p className="text-xs text-blue-600/80">CMP: 89452 • Especialidad: Medicina General</p>
                            </div>
                        </section>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
