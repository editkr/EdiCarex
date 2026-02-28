import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Printer, Share2, Building2, User, Clock, CheckCircle2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { referralsAPI } from '@/services/api'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'

export default function ReferralDetailPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const { data: referral, isLoading } = useQuery({
        queryKey: ['referral', id],
        queryFn: async () => {
            const res = await referralsAPI.getOne(id as string)
            return res.data
        },
        enabled: !!id
    })

    const { mutate: updateStatus, isPending: isUpdating } = useMutation({
        mutationFn: async (status: string) => {
            const res = await referralsAPI.update(id as string, { status })
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['referral', id] })
            toast({ title: 'Estado actualizado', description: 'El estado de la referencia ha sido actualizado.' })
        },
        onError: () => {
            toast({ title: 'Error', description: 'No se pudo actualizar el estado.', variant: 'destructive' })
        }
    })

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                <Skeleton className="h-10 w-1/3" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-[400px] lg:col-span-2" />
                    <Skeleton className="h-[400px]" />
                </div>
            </div>
        )
    }

    if (!referral) {
        return <div className="p-6 text-center text-red-500">Referencia no encontrada</div>
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendiente de Aceptación</Badge>
            case 'ACCEPTED': return <Badge variant="outline" className="text-blue-600 border-blue-600">Aceptada</Badge>
            case 'REJECTED': return <Badge variant="outline" className="text-red-600 border-red-600">Rechazada</Badge>
            case 'COMPLETED': return <Badge variant="outline" className="text-green-600 border-green-600">Completada</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Referencia REF-{id?.slice(-6).toUpperCase()}</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {referral.destinationCode || 'Hospital Carlos Monge Medrano'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                        Imprimir Formato
                    </Button>
                    {referral.status === 'PENDING' && (
                        <Button
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => updateStatus('ACCEPTED')}
                            disabled={isUpdating}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Marcar como Aceptada
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Información de la Solicitud</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Paciente</p>
                                    <p className="font-semibold">{referral.patient?.firstName} {referral.patient?.lastName}</p>
                                    <p className="text-xs text-muted-foreground mt-1">DNI: {referral.patient?.documentNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-blue-100">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Prioridad</p>
                                    <p className={`font-semibold ${referral.priority === 'P1' ? 'text-red-600' : referral.priority === 'P2' ? 'text-amber-600' : 'text-green-600'}`}>
                                        {referral.priority}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Especialidad: {referral.specialty}</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Resumen Clínico</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {referral.clinicalSummary}
                                </p>
                            </div>
                        </div>

                        <div className="border-t pt-6 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Motivo de Transferencia</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border">
                                    {referral.reason}
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
                                {getStatusBadge(referral.status)}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(referral.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-medium uppercase text-muted-foreground">Establecimiento Origén</div>
                                <div className="text-sm font-semibold text-primary">C.S. Jorge Chávez</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-medium uppercase text-muted-foreground">Establecimiento Destino</div>
                                <div className="text-sm font-semibold text-primary">{referral.destinationCode || 'Hospital General'}</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-medium uppercase text-muted-foreground">Médico Responsable</div>
                                <div className="text-sm font-semibold">Dr(a). Personal Médico</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Timeline de la Referencia</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l pl-4 space-y-6 ml-2">
                                <div className="relative">
                                    <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                                    <p className="text-xs font-bold">GENERADA</p>
                                    <p className="text-[10px] text-muted-foreground">{format(new Date(referral.createdAt), 'dd MMM yyyy - HH:mm', { locale: es })}</p>
                                </div>
                                {['ACCEPTED', 'COMPLETED', 'REJECTED'].includes(referral.status) && (
                                    <div className="relative">
                                        <div className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full ${referral.status === 'REJECTED' ? 'bg-red-500' : 'bg-blue-500'} border-2 border-white shadow-sm`} />
                                        <p className="text-xs font-bold">{referral.status === 'REJECTED' ? 'RECHAZADA' : 'ACEPTADA'}</p>
                                        <p className="text-[10px] text-muted-foreground">{format(new Date(referral.updatedAt), 'dd MMM yyyy - HH:mm', { locale: es })}</p>
                                    </div>
                                )}
                                {referral.status === 'COMPLETED' && (
                                    <div className="relative">
                                        <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                                        <p className="text-xs font-bold">CONTRAREFERENCIA RECIBIDA</p>
                                    </div>
                                )}
                                {referral.status === 'PENDING' && (
                                    <div className="relative opacity-50">
                                        <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-slate-300 border-2 border-white shadow-sm" />
                                        <p className="text-xs font-bold">PROCESANDO</p>
                                        <p className="text-[10px] text-muted-foreground italic">Esperando respuesta...</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
