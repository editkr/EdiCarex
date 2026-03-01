import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, addDays, startOfDay, isSameDay, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { appointmentsAPI, consultorioConfigAPI } from '@/services/api'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useNavigate } from 'react-router-dom'
import {
    Card,
    CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    User,
    HelpCircle,
    Users,
    CheckCircle2,
    AlertCircle,
    PanelRightClose,
    PanelRightOpen,
    Printer,
    RefreshCcw,
} from 'lucide-react'
import AppointmentModal from '@/components/modals/AppointmentModal'
import { cn } from '@/lib/utils'

// Generar slots de tiempo cada 20 minutos (estándar MINSA)
const TIME_SLOTS_20 = Array.from({ length: 30 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 20
    const hour = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}).filter(t => parseInt(t.split(':')[0]) < 18)

export default function DailySchedulePage() {
    const { config: orgConfig } = useOrganization()
    const navigate = useNavigate()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ time: string, serviceId: string, serviceLabel: string, upss: string } | null>(null)
    const [showWaitingPanel, setShowWaitingPanel] = useState(true)
    const [currentTime, setCurrentTime] = useState(new Date())

    // Actualizar hora actual para el indicador visual
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    // 1. Cargar Configuración de Consultorios
    const { data: configsRes, isLoading: isLoadingConfigs } = useQuery({
        queryKey: ['consultorio-configs'],
        queryFn: () => consultorioConfigAPI.getAll(),
        staleTime: 300000,
    })

    const services = useMemo(() => configsRes?.data || [], [configsRes])

    // 2. Cargar Estadísticas y Citas del día
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const { data: statsRes, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
        queryKey: ['appointments', 'daily-stats', dateStr],
        queryFn: () => appointmentsAPI.getDailyStats(dateStr),
        refetchInterval: 60000,
    })

    const { data: appointmentsRes, isLoading: isLoadingApps, refetch: refetchApps } = useQuery({
        queryKey: ['appointments', 'daily-list', dateStr],
        queryFn: () => appointmentsAPI.getAll({ date: dateStr }),
        refetchInterval: 60000,
    })

    const dailyStats = statsRes?.data
    const appointments = appointmentsRes?.data?.data || []

    const handleSlotClick = (time: string, service: any) => {
        setSelectedSlot({
            time,
            serviceId: service.serviceName,
            serviceLabel: service.label,
            upss: service.upss
        })
        setIsModalOpen(true)
    }

    const nextDay = () => setSelectedDate(prev => addDays(prev, 1))
    const prevDay = () => setSelectedDate(prev => addDays(prev, -1))
    const goToToday = () => setSelectedDate(new Date())

    const handlePrint = () => {
        window.print()
    }

    const handleMarkAsAttended = async (id: string) => {
        try {
            await appointmentsAPI.updateStatus(id, 'COMPLETED')
            refetchStats()
            refetchApps()
        } catch (error) {
            console.error('Error al marcar como atendido', error)
        }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-background print:h-auto" id="schedule-grid-container">
            {/* Header de Impresión (Solo visible al imprimir) */}
            <div className="hidden print:block w-full border-b-2 border-black pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-black uppercase text-black">{orgConfig?.hospitalName || 'Centro de Salud Jorge Chávez'}</h1>
                        <p className="text-xs font-bold text-black uppercase">IPRESS: {orgConfig?.billing?.ipress || '00003308'}</p>
                        <p className="text-[10px] text-black italic">Dirección: Jr. Ancash S/N, Juliaca - Puno</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black uppercase text-black">Agenda Diaria de Citas</p>
                        <p className="text-xs font-bold text-black">{format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}</p>
                    </div>
                </div>
            </div>

            <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", showWaitingPanel ? "border-r" : "")}>
                {/* Header Superior */}
                <div className="p-4 md:p-6 border-b bg-card space-y-4 sticky top-0 z-30 no-print">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
                                    Agenda Diaria
                                </h1>
                                <Badge variant="secondary" className="font-bold bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                    MINSA I-4
                                </Badge>
                            </div>
                            <p className="text-muted-foreground text-xs font-semibold mt-0.5">
                                IPRESS: {orgConfig?.billing?.ipress || '00003308'} — {orgConfig?.hospitalName || 'C.S. Jorge Chávez'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border">
                            <Button variant="ghost" size="icon" onClick={prevDay} className="h-8 w-8 rounded-lg hover:bg-background">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="px-3 flex items-center gap-2 font-black text-xs uppercase text-foreground min-w-[180px] justify-center">
                                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: es })}
                            </div>
                            <Button variant="ghost" size="icon" onClick={nextDay} className="h-8 w-8 rounded-lg hover:bg-background">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            {!isToday(selectedDate) && (
                                <Button variant="secondary" size="sm" onClick={goToToday} className="h-7 px-2 text-[10px] font-bold uppercase transition-all">
                                    Hoy
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrint} className="h-9 gap-2 font-bold text-xs uppercase border-primary/20 hover:bg-primary/5 hidden md:flex">
                                <Printer className="h-4 w-4" /> Imprimir
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => { refetchStats(); refetchApps(); }} className="h-9 w-9 border-primary/20 hover:bg-primary/5">
                                <RefreshCcw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setShowWaitingPanel(!showWaitingPanel)} className="h-9 w-9">
                                {showWaitingPanel ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Dashboard de Métricas Rápidas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-primary/5 border-primary/10 shadow-none hover:bg-primary/10 transition-colors">
                            <CardContent className="p-3 flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg"><Users className="h-4 w-4 text-primary" /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Citas Hoy</p>
                                    <p className="text-xl font-black text-primary leading-none mt-0.5">{dailyStats?.metrics?.totalScheduled || 0}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-none hover:bg-emerald-500/10 transition-colors">
                            <CardContent className="p-3 flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg"><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Atendidos</p>
                                    <p className="text-xl font-black text-emerald-500 leading-none mt-0.5">
                                        {appointments.filter((a: any) => a.status === 'COMPLETED').length}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-amber-500/5 border-amber-500/10 shadow-none hover:bg-amber-500/10 transition-colors">
                            <CardContent className="p-3 flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg"><Clock className="h-4 w-4 text-amber-500" /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">En Espera</p>
                                    <p className="text-xl font-black text-amber-500 leading-none mt-0.5">{dailyStats?.metrics?.totalWaiting || 0}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-500/5 border-blue-500/10 shadow-none hover:bg-blue-500/10 transition-colors">
                            <CardContent className="p-3 flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg"><AlertCircle className="h-4 w-4 text-blue-500" /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ocupación</p>
                                    <p className="text-xl font-black text-blue-500 leading-none mt-0.5">{dailyStats?.metrics?.overallOccupancy || 0}%</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Grid de Agenda Principal */}
                <div className="flex-1 overflow-auto relative bg-muted/10">
                    {(isLoadingConfigs || isLoadingApps) && appointments.length === 0 ? (
                        <div className="p-8 space-y-4">
                            <Skeleton className="h-20 w-full rounded-2xl" />
                            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                                {Array.from({ length: 24 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
                            </div>
                        </div>
                    ) : (
                        <div className="min-w-fit inline-block align-middle">
                            {/* Cabecera de Servicios (Sticky) */}
                            <div className="flex sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                                <div className="w-24 shrink-0 p-4 font-black text-[10px] text-muted-foreground flex items-center justify-center uppercase tracking-widest border-r bg-muted/20">
                                    HORA
                                </div>
                                {services.map((service: any) => {
                                    const svcStat = dailyStats?.services?.find((s: any) => s.serviceName === service.serviceName);
                                    return (
                                        <div key={service.id} className="w-72 shrink-0 p-4 border-r">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className={cn("h-3 w-3 rounded-full shrink-0 shadow-sm", service.color || "bg-primary")} />
                                                    <span className="font-black text-xs uppercase tracking-tight truncate shrink-0">{service.label}</span>
                                                </div>
                                                <Badge
                                                    className={cn(
                                                        "text-[9px] font-black tabular-nums px-1.5 py-0.5 rounded-md border-none",
                                                        svcStat?.isFull ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    {svcStat?.isFull ? 'LLENO' : `${svcStat?.occupied || 0}/${service.maxDailySlots}`}
                                                </Badge>
                                            </div>
                                            <Progress
                                                value={svcStat?.occupancyPercentage || 0}
                                                className={cn(
                                                    "h-1.5 mt-2.5",
                                                    (svcStat?.occupancyPercentage || 0) > 80 ? "[&>div]:bg-destructive" : ""
                                                )}
                                            />
                                            <div className="flex justify-between items-center mt-1.5">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase truncate opacity-70">
                                                    {service.upss}
                                                </span>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-70">
                                                    Slot: {service.slotDurationMinutes}m
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Cuerpo de la Agenda */}
                            <div className="flex">
                                {/* Columna de Horas (Sticky Left) */}
                                <div className="w-24 shrink-0 sticky left-0 z-10 bg-card border-r divide-y">
                                    {TIME_SLOTS_20.map((time, index) => (
                                        <div key={time} className={cn(
                                            "h-28 flex flex-col items-center justify-center border-b transition-colors",
                                            index % 3 === 0 ? "bg-muted/5" : ""
                                        )}>
                                            <div className="flex flex-col items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-muted-foreground/40" />
                                                <span className="text-[11px] font-black text-foreground/80 tabular-nums">
                                                    {time}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Cuadrícula de Citas */}
                                <div className="flex divide-x bg-background">
                                    {services.map((service: any) => (
                                        <div key={service.id} className="w-72 shrink-0 divide-y relative">
                                            {TIME_SLOTS_20.map((time, index) => {
                                                const appAtSlot = appointments.find((app: any) => {
                                                    const appTime = format(new Date(app.appointmentDate), 'HH:mm')
                                                    return appTime === time && (
                                                        app.upss === service.upss ||
                                                        (service.serviceName === 'MEDICINA_GENERAL' && app.type === 'CONSULTA_MEDICINA_GENERAL')
                                                    )
                                                })

                                                const svcStat = dailyStats?.services?.find((s: any) => s.serviceName === service.serviceName);
                                                const isLleno = svcStat?.isFull;

                                                const isPast = isToday(selectedDate) && (() => {
                                                    const [h, m] = time.split(':').map(Number);
                                                    const slotDate = new Date(selectedDate);
                                                    slotDate.setHours(h, m, 0, 0);
                                                    return slotDate < currentTime;
                                                })();

                                                const isPendingPast = appAtSlot && isPast && appAtSlot.status === 'SCHEDULED';

                                                return (
                                                    <div
                                                        key={`${service.id}-${time}`}
                                                        className={cn(
                                                            "h-28 p-2 transition-all duration-200 group relative",
                                                            index % 3 === 0 ? "bg-muted/5" : "",
                                                            !appAtSlot && !isLleno && "hover:bg-muted/30 cursor-pointer",
                                                            !appAtSlot && isLleno && "bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,var(--muted-foreground)_10px,var(--muted-foreground)_11px)] opacity-[0.03] cursor-not-allowed"
                                                        )}
                                                        title={isLleno ? "Cupo completo para hoy" : ""}
                                                        onClick={() => !appAtSlot && !isLleno && handleSlotClick(time, service)}
                                                    >
                                                        {appAtSlot ? (
                                                            <div
                                                                className={cn(
                                                                    "h-full w-full rounded-2xl border-l-[6px] p-3 shadow-md transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer flex flex-col justify-between relative",
                                                                    appAtSlot.status === 'COMPLETED'
                                                                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-300"
                                                                        : appAtSlot.status === 'CANCELLED'
                                                                            ? "bg-muted border-muted-foreground/30 opacity-50"
                                                                            : "bg-primary/10 border-primary text-primary-900 dark:text-primary-300 shadow-primary/10",
                                                                    isPendingPast && "animate-pulse border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                                                )}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    navigate(`/appointments/${appAtSlot.id}`)
                                                                }}
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div className="min-w-0">
                                                                        <p className="font-black text-[12px] leading-none truncate uppercase tracking-tight">
                                                                            {appAtSlot.patient?.firstName} {appAtSlot.patient?.lastName}
                                                                        </p>
                                                                        <p className="text-[10px] font-bold opacity-60 mt-1 tabular-nums">
                                                                            DNI: {appAtSlot.patient?.documentNumber}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <Badge className="text-[8px] h-3.5 px-1 font-black shrink-0 uppercase border-none" variant={appAtSlot.status === 'COMPLETED' ? 'success' : 'default'}>
                                                                            {appAtSlot.status === 'COMPLETED' ? 'OK' : 'PEND'}
                                                                        </Badge>
                                                                        {appAtSlot.patientCondition === 'NUEVO' && (
                                                                            <Badge className="text-[8px] h-3.5 px-1 font-black shrink-0 uppercase bg-orange-500 hover:bg-orange-600 text-white border-none">
                                                                                NUEVO
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <div className="flex items-center gap-1.5 bg-background/50 backdrop-blur-sm p-1 px-2 rounded-lg border border-black/5 dark:border-white/5">
                                                                        <User className="w-3 h-3 opacity-60" />
                                                                        <span className="text-[10px] font-black truncate uppercase tracking-tighter">
                                                                            {appAtSlot.staff?.user?.lastName || 'Por asignar'}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center justify-between px-0.5">
                                                                        <span className={cn(
                                                                            "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
                                                                            appAtSlot.financiador === '02' ? "bg-emerald-500/20 text-emerald-600" : "bg-amber-500/20 text-amber-600"
                                                                        )}>
                                                                            {appAtSlot.financiador === '02' ? 'SIS' : 'PAGANTE'}
                                                                        </span>
                                                                        <span className="text-[9px] font-bold opacity-50 truncate italic max-w-[100px]">
                                                                            {appAtSlot.reason || 'Consulta'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            !isLleno && (
                                                                <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                                    <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                                                                        <Plus className="h-5 w-5" />
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )
                                            })}

                                            {/* Indicador de Hora Actual */}
                                            {isToday(selectedDate) && (
                                                <div
                                                    className="absolute left-0 right-0 h-[3px] bg-destructive z-10 pointer-events-none flex items-center shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                                    style={{
                                                        top: (() => {
                                                            const h = currentTime.getHours()
                                                            const m = currentTime.getMinutes()
                                                            if (h < 8 || h >= 18) return -100
                                                            const minutesFromStart = (h - 8) * 60 + m
                                                            return `${(minutesFromStart / 20) * 112}px` // 112px is h-28
                                                        })()
                                                    }}
                                                >
                                                    <div className="w-3.5 h-3.5 rounded-full bg-destructive -ml-[7px] border-2 border-background shadow-lg" />
                                                    <div className="flex-1 h-[1px] bg-destructive/30" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Panel Lateral: Lista de Espera */}
            {showWaitingPanel && (
                <div className="w-96 bg-card flex flex-col sticky top-0 h-[calc(100vh-4rem)] shadow-2xl z-40">
                    <div className="p-6 border-b flex items-center justify-between bg-muted/30 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-black text-xs uppercase tracking-widest text-foreground">Cola de Espera</h2>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">Prioridad por llegada</p>
                            </div>
                        </div>
                        <Badge className="font-black px-3 py-1 bg-primary text-primary-foreground rounded-lg" variant="default">
                            {dailyStats?.metrics?.totalWaiting || 0}
                        </Badge>
                    </div>

                    <div className="flex-1 overflow-auto p-6 space-y-6">
                        {dailyStats?.services?.map((svc: any) => (
                            svc.waitingCount > 0 && (
                                <div key={svc.serviceName} className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("h-2 w-2 rounded-full", svc.occupied > svc.maxOccupancy ? "bg-destructive" : "bg-emerald-500")} />
                                            <h3 className="text-[11px] font-black text-foreground uppercase tracking-tight">{svc.label}</h3>
                                        </div>
                                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">{svc.waitingCount}</span>
                                    </div>
                                    <div className="space-y-2.5">
                                        {svc.waitingList.map((wait: any) => (
                                            <Card key={wait.id} className="border-none bg-muted/40 hover:bg-muted transition-all duration-200 cursor-pointer group hover:shadow-md border border-transparent hover:border-border">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[12px] font-black leading-tight text-foreground truncate group-hover:text-primary transition-colors uppercase">
                                                                {wait.patientName}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-background/50 px-2 py-0.5 rounded-md border">
                                                                    <Clock className="w-3 h-3 text-primary/70" />
                                                                    {wait.time}
                                                                </div>
                                                                <Badge variant="outline" className="text-[9px] h-5 font-bold uppercase py-0 leading-none">
                                                                    {wait.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Espera Est.</p>
                                                            <p className="text-lg font-black tabular-nums leading-none mt-1">
                                                                {wait.estimatedWaitMinutes}<span className="text-xs ml-0.5 font-bold opacity-40">m</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-4">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 h-8 text-[10px] font-black uppercase tracking-wider hover:bg-primary hover:text-primary-foreground border-primary/20 transition-all rounded-lg"
                                                            onClick={() => navigate(`/appointments/${wait.id}`)}
                                                        >
                                                            Ver Detalle
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-none"
                                                            title="Marcar como atendido"
                                                            onClick={() => handleMarkAsAttended(wait.id)}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}

                        {(dailyStats?.metrics?.totalWaiting === 0 || !dailyStats) && (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
                                <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-500/40" />
                                </div>
                                <p className="text-[11px] font-black uppercase text-foreground/40">Excelente: Sin pacientes en cola de espera</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Cita */}
            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    refetchStats()
                    refetchApps()
                }}
                defaultValues={{
                    appointmentDate: selectedDate,
                    time: selectedSlot?.time || '',
                    serviceLabel: selectedSlot?.serviceLabel || '',
                    upss: selectedSlot?.upss || ''
                }}
            />

            <style>{`
                @media print {
                    @page { size: landscape; margin: 1cm; }
                    body * { visibility: hidden; }
                    #schedule-grid-container, #schedule-grid-container * { visibility: visible; }
                    #schedule-grid-container { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        height: auto;
                        overflow: visible !important;
                    }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .h-[calc(100vh-4rem)] { height: auto !important; }
                    .overflow-auto { overflow: visible !important; }
                    .sticky { position: relative !important; }
                    .bg-background\\/95 { background: white !important; }
                    .border-b { border-bottom: 2px solid #e2e8f0 !important; }
                    .border-r { border-right: 2px solid #e2e8f0 !important; }
                    .shadow-none { box-shadow: none !important; }
                    button { display: none !important; }
                }
            `}</style>
        </div>
    )
}
