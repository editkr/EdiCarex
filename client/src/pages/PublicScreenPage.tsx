import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Clock,
    Calendar,
    UserCheck,
    Users,
    Activity,
    AlertTriangle,
    CheckCircle2,
    ScanLine,
    MoveRight
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { attendanceAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { motion, AnimatePresence } from 'framer-motion'
import { useOrganization } from '@/contexts/OrganizationContext'
import { InstitutionalFooter } from '@/components/InstitutionalFooter'

const BACKGROUNDS = [
    '/assets/bg-public-1.png',
    '/assets/bg-public-2.png',
    '/assets/bg-public-3.png',
    '/assets/bg-public-4.png'
]

export default function PublicScreenPage() {
    const { config } = useOrganization()
    const [currentTime, setCurrentTime] = useState(new Date())
    const [bgIndex, setBgIndex] = useState(0)
    const [stats, setStats] = useState({
        present: 0,
        total: 0,
        onTime: 0,
        late: 0
    })
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [employeeId, setEmployeeId] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [scanMessage, setScanMessage] = useState('')

    // Background carousel timer
    useEffect(() => {
        const bgTimer = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length)
        }, 8000)
        return () => clearInterval(bgTimer)
    }, [])

    // Real-time clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Real stats fetching
    const fetchStats = async () => {
        try {
            const res = await attendanceAPI.getKioskStats()
            setStats(res.data)
        } catch (error) {
            console.error('Error fetching kiosk stats:', error)
        }
    }

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 60000)
        return () => clearInterval(interval)
    }, [])

    const handleAttendance = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!employeeId.trim()) return

        setIsLoading(true)
        setScanStatus('idle')

        try {
            const res = await attendanceAPI.kioskClock(employeeId)
            const { action, employeeName, time } = res.data

            setScanStatus('success')
            const actionText = action === 'CLOCK_IN' ? 'Entrada registrada' : 'Salida registrada'
            setScanMessage(`¡Hola, ${employeeName}! ${actionText}: ${format(new Date(time), 'HH:mm')}`)
            setEmployeeId('')

            fetchStats()

            setTimeout(() => {
                setIsModalOpen(false)
                setScanStatus('idle')
                setScanMessage('')
            }, 5000)

        } catch (error: any) {
            setScanStatus('error')
            setScanMessage(error.response?.data?.message || 'Código no reconocido o error de conexión.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a1628] text-white overflow-hidden font-sans relative">
            {/* Fondo con carrusel de imágenes y overlays suavizados */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={bgIndex}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 2.5, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        <img
                            src={BACKGROUNDS[bgIndex]}
                            alt="Hospital background"
                            className="w-full h-full object-cover"
                            style={{ filter: 'brightness(0.7) contrast(1.1)' }}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Overlays premium adaptados para que la imagen sea visible */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(20,184,166,0.15)_0%,transparent_60%)]" />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col md:flex-row p-8 md:p-12 gap-12 items-center justify-between min-h-screen">

                {/* LEFT CONTENT: BRANDING & HERO */}
                <div className="flex-1 flex flex-col justify-center space-y-12 animate-in fade-in slide-in-from-left duration-1000">
                    <div className="space-y-8">
                        <div className="flex items-center gap-6">
                            <img
                                src={config?.logo || "/assets/logo-edicarex.png"}
                                alt={config?.hospitalName || "EdiCarex"}
                                className="h-32 w-32 object-contain drop-shadow-[0_0_30px_rgba(20,184,166,0.5)]"
                            />
                            <div>
                                <h2 className="text-sm font-semibold text-teal-400/90 tracking-[0.3em] uppercase mb-1">
                                    Centro Médico
                                </h2>
                                <h1 className="text-5xl font-black tracking-tight text-white uppercase truncate max-w-[500px]" title={config?.hospitalName || "EdiCarex"}>
                                    {config?.hospitalName || "EdiCarex"}
                                </h1>
                            </div>
                        </div>

                        <div className="max-w-xl space-y-6">
                            <h3 className="text-4xl md:text-5xl font-bold leading-tight text-white">
                                Excelencia en Salud<br />
                                <span className="text-teal-400">Compromiso con la Vida</span>
                            </h3>
                            <p className="text-lg text-gray-400 font-light border-l-4 border-teal-500 pl-6 py-3">
                                "La medicina es el arte de conservar la salud y curar la enfermedad con conocimiento y compasión."
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5 max-w-md">
                        <div className="bg-teal-950/95 backdrop-blur-sm rounded-xl p-6 border-2 border-teal-500 hover:border-teal-400 transition-all duration-300 group shadow-lg shadow-teal-500/20">
                            <Users className="h-7 w-7 text-teal-400 mb-3 group-hover:scale-110 transition-transform" />
                            <div className="text-3xl font-bold text-white">50+</div>
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-1">
                                Especialistas
                            </div>
                        </div>
                        <div className="bg-teal-950/95 backdrop-blur-sm rounded-xl p-6 border-2 border-teal-500 hover:border-teal-400 transition-all duration-300 group shadow-lg shadow-teal-500/20">
                            <CheckCircle2 className="h-7 w-7 text-teal-400 mb-3 group-hover:scale-110 transition-transform" />
                            <div className="text-3xl font-bold text-white">Cert.</div>
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-1">
                                Acreditado Minsa
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT CONTENT: CLOCK & ACTIONS */}
                <div className="flex-1 flex flex-col justify-center items-end h-full w-full max-w-lg">

                    {/* CLOCK CARD */}
                    <div className="bg-teal-950/98 backdrop-blur-xl border-2 border-teal-500 p-10 rounded-3xl w-full shadow-2xl shadow-teal-500/30 mb-8 animate-in slide-in-from-bottom duration-1000 delay-200">
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex flex-col">
                                <span className="text-teal-400 font-semibold text-lg flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    {format(currentTime, 'EEEE, d MMMM', { locale: es })}
                                </span>
                                <span className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                    Fecha Actual
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-teal-950/90 border-2 border-teal-500 px-3 py-1.5 rounded-full">
                                <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                                <span className="text-xs font-semibold text-teal-400 tracking-wide">
                                    En Línea
                                </span>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="text-8xl font-bold text-white tracking-tight tabular-nums leading-none">
                                {format(currentTime, 'HH:mm')}
                            </div>
                            <div className="absolute -bottom-3 right-2 text-2xl text-teal-400 font-semibold tracking-tight tabular-nums">
                                {format(currentTime, 'ss')} seg
                            </div>
                        </div>
                    </div>

                    {/* STATS & ACTION CARD */}
                    <div className="bg-teal-950/98 backdrop-blur-xl border-2 border-teal-500 p-8 rounded-3xl w-full shadow-2xl shadow-teal-500/30 animate-in slide-in-from-bottom duration-1000 delay-400">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                <div className="h-1 w-6 bg-teal-400 rounded-full" />
                                Estadísticas de Hoy
                            </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-teal-950/95 rounded-xl p-5 border-2 border-teal-500 shadow-lg shadow-teal-500/20 flex flex-col items-center justify-center hover:border-teal-400 hover:shadow-teal-500/30 transition-all group">
                                <UserCheck className="h-6 w-6 text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
                                <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                                    Asistencias
                                </div>
                                <div className="text-3xl font-bold text-white mt-1 tabular-nums">
                                    {stats.present}
                                </div>
                            </div>
                            <div className="bg-teal-950/95 rounded-xl p-5 border-2 border-teal-500 shadow-lg shadow-teal-500/20 flex flex-col items-center justify-center hover:border-teal-400 hover:shadow-teal-500/30 transition-all group">
                                <Users className="h-6 w-6 text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
                                <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                                    Total Staff
                                </div>
                                <div className="text-3xl font-bold text-white mt-1 tabular-nums">
                                    {stats.total}
                                </div>
                            </div>
                            <div className="bg-teal-950/95 rounded-xl p-5 border-2 border-teal-500 shadow-lg shadow-teal-500/20 flex flex-col items-center justify-center hover:border-teal-400 hover:shadow-teal-500/30 transition-all group">
                                <CheckCircle2 className="h-6 w-6 text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
                                <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                                    A Tiempo
                                </div>
                                <div className="text-3xl font-bold text-white mt-1 tabular-nums">
                                    {stats.onTime}
                                </div>
                            </div>
                            <div className="bg-teal-950/95 rounded-xl p-5 border-2 border-teal-500 shadow-lg shadow-teal-500/20 flex flex-col items-center justify-center hover:border-teal-400 hover:shadow-teal-500/30 transition-all group">
                                <AlertTriangle className="h-6 w-6 text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
                                <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                                    Tardanzas
                                </div>
                                <div className="text-3xl font-bold text-white mt-1 tabular-nums">
                                    {stats.late}
                                </div>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="w-full h-16 text-lg font-bold rounded-xl gap-3 uppercase tracking-wide bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-teal-500/30 transition-all"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
                                <ScanLine className="h-5 w-5" />
                            </div>
                            Marcar Asistencia
                        </Button>
                    </div>

                </div>
            </div>

            {/* ATTENDANCE MODAL */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 to-slate-950 border-teal-500/30 text-white rounded-2xl shadow-2xl overflow-hidden p-0">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600" />

                    <div className="p-10 space-y-8">
                        <DialogHeader>
                            <DialogTitle className="text-3xl text-center font-bold flex flex-col items-center gap-5">
                                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 flex items-center justify-center ring-2 ring-teal-500/50 shadow-lg shadow-teal-500/20">
                                    <Clock className="h-10 w-10 text-teal-400 animate-pulse" />
                                </div>
                                <span className="tracking-tight">Acceso Personal</span>
                            </DialogTitle>
                            <DialogDescription className="text-center text-gray-400 text-base font-normal">
                                Ingrese su <span className="text-white font-semibold">Documento de Identidad (DNI)</span> para validar su sesión.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleAttendance} className="space-y-6">
                            <div className="relative">
                                <Input
                                    autoFocus
                                    type="text"
                                    placeholder="00000000"
                                    className="text-center text-4xl font-bold tabular-nums tracking-widest h-20 w-full bg-white/5 border-teal-500/30 rounded-xl text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all placeholder:text-white/10"
                                    value={employeeId}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                                        setEmployeeId(val)
                                        if (scanStatus !== 'idle') setScanStatus('idle')
                                    }}
                                    maxLength={10}
                                    disabled={scanStatus === 'success'}
                                />
                            </div>

                            {scanStatus === 'success' && (
                                <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-6 flex flex-col items-center gap-3 animate-in zoom-in duration-500">
                                    <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                        <CheckCircle2 className="h-7 w-7 text-white" />
                                    </div>
                                    <p className="text-emerald-400 font-semibold text-base text-center leading-tight">
                                        {scanMessage}
                                    </p>
                                </div>
                            )}

                            {scanStatus === 'error' && (
                                <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-6 flex flex-col items-center gap-3 animate-in zoom-in duration-500">
                                    <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                                        <AlertTriangle className="h-7 w-7 text-white" />
                                    </div>
                                    <p className="text-red-400 font-semibold text-center">{scanMessage}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full h-14 text-lg font-bold bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/30 rounded-xl transition-all uppercase tracking-wide disabled:opacity-30"
                                disabled={isLoading || employeeId.length < 5 || scanStatus === 'success'}
                            >
                                {isLoading ? (
                                    <Activity className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        Validar Acceso <MoveRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="text-center pt-4">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                                {config?.hospitalName || "EdiCarex"} Secure Entry • v3.0
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <InstitutionalFooter />
        </div>
    )
}