import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    HeartPulse,
    ClipboardCheck,
    FileText,
    Download,
    Loader2,
    CheckCircle,
    Clock,
    AlertCircle,
    Eye,
    ShieldCheck,
    ExternalLink
} from 'lucide-react'
import { billingAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function PatientSISServicesPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [atenciones, setAtenciones] = useState<any[]>([])
    const [selectedAtencion, setSelectedAtencion] = useState<any>(null)
    const [showDetail, setShowDetail] = useState(false)

    // Get current user
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        if (user.patientId) {
            loadAtenciones()
        }
    }, [])

    const loadAtenciones = async () => {
        try {
            setLoading(true)
            // Usamos el billingAPI temporalmente pero con contexto de atenciones SIS
            const res = await billingAPI.getInvoices({
                patientId: user.patientId,
                limit: 50
            })
            setAtenciones(res.data.data || res.data || [])
        } catch (error) {
            console.error('Error loading atenciones:', error)
            toast({
                title: 'Error',
                description: 'No se pudieron cargar sus atenciones SIS',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
            PAID: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
            PARTIAL: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            OVERDUE: 'bg-red-500/10 text-red-600 border-red-500/20',
            CANCELLED: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
        }
        const labels: Record<string, string> = {
            PENDING: 'Por Validar',
            PAID: 'Confirmada',
            PARTIAL: 'En Proceso',
            OVERDUE: 'Rechazada',
            CANCELLED: 'Anulada',
        }
        return (
            <Badge variant="outline" className={`${styles[status] || 'bg-slate-100'} font-bold`}>
                {labels[status] || status}
            </Badge>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mis Atenciones SIS</h1>
                    <p className="text-muted-foreground font-medium">
                        Historial de servicios de salud bajo convenio SIS (C.S. Jorge Chávez)
                    </p>
                </div>
                <Button className="bg-red-600 hover:bg-red-700 text-white font-bold">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Consultar Cobertura Actual
                </Button>
            </div>

            {/* SIS Banner */}
            <Card className="bg-gradient-to-br from-red-600 to-red-800 text-white border-none shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <ShieldCheck className="h-32 w-32" />
                </div>
                <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/30">
                            <HeartPulse className="h-10 w-10" />
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold mb-1">Estado de Afiliación: Activo</h2>
                            <p className="text-white/80 font-medium italic">
                                Plan SIS Gratuito - IPRESS de Adscripción: C.S. I-4 Jorge Chávez
                            </p>
                        </div>
                        <div className="md:ml-auto flex gap-2">
                            <Button variant="secondary" className="bg-white text-red-700 hover:bg-slate-100 font-bold border-none shadow-lg">
                                Descargar Carnet
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-bold uppercase text-slate-500">Total Consultas</CardTitle>
                        <ClipboardCheck className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{atenciones.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Registradas en el sistema</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-bold uppercase text-slate-500">FUAs Validadas</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">
                            {atenciones.filter(i => i.status === 'PAID').length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Sincronizadas con SIH-SIS</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-bold uppercase text-slate-500">En Observación</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">
                            {atenciones.filter(i => i.status === 'PENDING').length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Pendientes de cierre administrativo</p>
                    </CardContent>
                </Card>
            </div>

            {/* Activities Table */}
            <Card className="shadow-sm border-slate-100">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        Registro de Atenciones y Servicios
                    </CardTitle>
                    <CardDescription>Detalle de prestaciones de salud cubiertas por el SIS</CardDescription>
                </CardHeader>
                <CardContent>
                    {atenciones.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead className="font-bold">Nº FUA / Expediente</TableHead>
                                    <TableHead className="font-bold">Fecha</TableHead>
                                    <TableHead className="font-bold">Prestación / Servicio</TableHead>
                                    <TableHead className="font-bold">Estado SIS</TableHead>
                                    <TableHead className="text-right font-bold">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {atenciones.map((atencion) => (
                                    <TableRow key={atencion.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-mono text-xs font-bold text-indigo-600">
                                            {atencion.invoiceNumber || `FUA-${atencion.id?.slice(0, 8).toUpperCase()}`}
                                        </TableCell>
                                        <TableCell className="text-slate-600 font-medium">
                                            {format(new Date(atencion.invoiceDate || atencion.createdAt), 'dd MMM, yyyy', { locale: es })}
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-900">
                                            {atencion.items?.[0]?.description || 'Consulta Externa / Medicina'}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(atencion.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:text-indigo-600 hover:bg-indigo-50"
                                                    onClick={() => {
                                                        setSelectedAtencion(atencion)
                                                        setShowDetail(true)
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600 hover:bg-red-50">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed">
                            <ClipboardCheck className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-bold text-slate-900">Sin atenciones registradas</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto">No se encontraron historiales de atenciones SIS bajo este número de DNI.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-red-600" />
                            Detalle de Atención SIS
                        </DialogTitle>
                    </DialogHeader>
                    {selectedAtencion && (
                        <div className="space-y-6 pt-4">
                            <div className="p-4 bg-slate-900 text-white rounded-2xl relative overflow-hidden">
                                <ShieldCheck className="absolute -right-4 -top-4 h-24 w-24 opacity-5" />
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Cód. Formulario Único Atenc.</p>
                                        <p className="font-mono text-xl font-bold">
                                            {selectedAtencion.invoiceNumber || `FUA-${selectedAtencion.id?.slice(0, 8).toUpperCase()}`}
                                        </p>
                                    </div>
                                    {getStatusBadge(selectedAtencion.status)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-4 text-sm px-1">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground font-bold text-[10px] uppercase">Fecha de Atención</p>
                                    <p className="font-semibold text-slate-900">
                                        {format(new Date(selectedAtencion.invoiceDate || selectedAtencion.createdAt), 'PPP', { locale: es })}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground font-bold text-[10px] uppercase">Establecimiento</p>
                                    <p className="font-semibold text-slate-900">C.S. Jorge Chávez</p>
                                </div>
                                <div className="col-span-2 space-y-1 border-t pt-4">
                                    <p className="text-muted-foreground font-bold text-[10px] uppercase">Concepto Prestacional</p>
                                    <p className="font-semibold text-slate-900">{selectedAtencion.items?.[0]?.description || 'Consulta Externa Especializada'}</p>
                                </div>
                                <div className="space-y-1 border-t pt-4">
                                    <p className="text-muted-foreground font-bold text-[10px] uppercase">Cobertura SIS</p>
                                    <p className="text-emerald-600 font-black">100% CUBIERTO</p>
                                </div>
                                <div className="space-y-1 border-t pt-4">
                                    <p className="text-muted-foreground font-bold text-[10px] uppercase">Costo Estimado</p>
                                    <p className="font-black text-slate-400">S/ 0.00</p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button variant="outline" className="flex-1 font-bold border-slate-200">
                                    <Download className="h-4 w-4 mr-2" />
                                    PDF FUA
                                </Button>
                                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={() => setShowDetail(false)}>
                                    Entendido
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Disclaimer */}
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-xs font-medium">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500" />
                <p>
                    La información mostrada es referencial y depende de la sincronización de tregas con la Microred Santa Adriana. Para cualquier discrepancia, por favor acérquese a la oficina de Seguros del establecimiento con su DNI.
                </p>
            </div>
        </div>
    )
}
