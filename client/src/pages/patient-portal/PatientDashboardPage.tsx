import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Calendar,
    FileText,
    DollarSign,
    Activity,
    Clock,
    User,
    ChevronRight,
    Plus,
    Loader2,
} from 'lucide-react'
import { appointmentsAPI, patientsAPI, billingAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function PatientDashboardPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        nextAppointment: null as any,
        recentAppointments: [] as any[],
        pendingLabResults: 0,
        pendingInvoices: { count: 0, total: 0 },
        patientInfo: null as any,
    })

    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true)

            if (!user.patientId) {
                console.warn('User has no patient ID linked');
                setLoading(false);
                return;
            }

            // Fetch appointments for THIS patient
            const appointmentsRes = await appointmentsAPI.getAll({
                patientId: user.patientId,
                limit: 10
            })
            const appointments = appointmentsRes.data.data || []

            // Find next upcoming appointment
            const now = new Date()
            const upcoming = appointments
                .filter((a: any) => new Date(a.appointmentDate) >= now && a.status !== 'CANCELLED')
                .sort((a: any, b: any) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())

            // Fetch pending invoices for THIS patient
            // Note: API needs to support patientId filter for invoices too
            const invoicesRes = await billingAPI.getInvoices({
                patientId: user.patientId,
                status: 'PENDING',
                limit: 100
            })
            const pendingInvoices = invoicesRes.data.data || []
            const totalPending = pendingInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total || 0), 0)

            setData({
                nextAppointment: upcoming[0] || null,
                recentAppointments: appointments.slice(0, 5),
                pendingLabResults: 0, // Placeholder until Lab API supports filtering
                pendingInvoices: {
                    count: pendingInvoices.length,
                    total: totalPending,
                },
                patientInfo: user,
            })
        } catch (error) {
            console.error('Error loading dashboard:', error)
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los datos',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Bienvenido, {user.firstName || 'Paciente'}
                        </h1>
                        <p className="text-muted-foreground">
                            Portal del Paciente - EdiCarex Hospital
                        </p>
                    </div>
                    <Button onClick={() => navigate('/patient-portal/appointments/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agendar Cita
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Próxima Cita</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data.nextAppointment
                                    ? format(new Date(data.nextAppointment.appointmentDate), 'dd MMM', { locale: es })
                                    : 'Sin citas'}
                            </div>
                            <p className="text-xs text-muted-foreground">Programada</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Resultados Lab</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.pendingLabResults}</div>
                            <p className="text-xs text-muted-foreground">Pendientes</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${data.pendingInvoices.total.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Por pagar</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mi Perfil</CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Actualizado</div>
                            <p className="text-xs text-muted-foreground">Completo</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Next Appointment Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Próxima Cita
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.nextAppointment ? (
                                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold">
                                                    {format(new Date(data.nextAppointment.appointmentDate), 'dd')}
                                                </div>
                                                <div className="text-xs uppercase">
                                                    {format(new Date(data.nextAppointment.appointmentDate), 'MMM', { locale: es })}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg text-foreground">
                                                Personal de Salud: {data.nextAppointment.staff?.user?.firstName} {data.nextAppointment.staff?.user?.lastName}
                                            </p>
                                            <p className="text-muted-foreground">{data.nextAppointment.reason}</p>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                {data.nextAppointment.startTime}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            Ver Detalles
                                        </Button>
                                        <Button variant="destructive" size="sm">
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            ) : !user.patientId ? (
                                <div className="text-center py-12 bg-orange-500/5 border border-orange-500/20 rounded-2xl p-8">
                                    <div className="bg-orange-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Activity className="h-8 w-8 text-orange-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Perfil no vinculado</h3>
                                    <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                                        Tu cuenta de usuario aún no ha sido vinculada a un registro de paciente en nuestro sistema. Por favor, contacta con administración para completar tu registro.
                                    </p>
                                    <Button variant="outline" className="border-orange-500/20 hover:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                        Contactar Soporte
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No tienes citas programadas</p>
                                    <Button className="mt-4" onClick={() => navigate('/patient-portal/appointments/new')}>
                                        Agendar tu primera cita
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Accesos Rápidos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-between" asChild>
                                <Link to="/patient-portal/appointments">
                                    Mis Citas <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-between" asChild>
                                <Link to="/patient-portal/history">
                                    Historial Médico <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-between" asChild>
                                <Link to="/patient-portal/lab-results">
                                    Resultados Lab <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-between" asChild>
                                <Link to="/patient-portal/billing">
                                    Facturación <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-between" asChild>
                                <Link to="/patient-portal/profile">
                                    Mi Perfil <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Appointments */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Citas Recientes</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/patient-portal/appointments">Ver todas</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {data.recentAppointments.length > 0 ? (
                            <div className="space-y-3">
                                {data.recentAppointments.map((apt: any) => (
                                    <div key={apt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                                <Activity className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{apt.reason}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(apt.appointmentDate), 'PPP', { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            apt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-muted text-muted-foreground'
                                            }`}>
                                            {apt.status === 'COMPLETED' ? 'Completada' :
                                                apt.status === 'SCHEDULED' ? 'Programada' :
                                                    apt.status === 'CANCELLED' ? 'Cancelada' : apt.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-4">No hay citas recientes</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
