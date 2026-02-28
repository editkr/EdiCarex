import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertTriangle, AlertCircle, CheckCircle2, Clock, Plus,
    Activity, Heart, Thermometer, Wind, User, Search,
    RefreshCw, ChevronRight, X, Save, Loader2, Eye,
    Gauge, Droplets, Scale, Ruler
} from 'lucide-react'
import { triajeAPI, patientsAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useOrganization } from '@/contexts/OrganizationContext'

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface TriageRecord {
    id: string
    patientName: string
    patientAge?: number
    patientDni?: string
    heartRate?: number
    respiratoryRate?: number
    temperature?: number
    oxygenSaturation?: number
    bloodPressure?: string
    weight?: number
    height?: number
    glucometry?: number
    priority: 'ROJO' | 'NARANJA' | 'VERDE'
    chiefComplaint: string
    notes?: string
    status: 'WAITING' | 'IN_ATTENTION' | 'COMPLETED' | 'TRANSFERRED'
    triageBy?: string
    triageAt: string
    attendedAt?: string
}

interface TriageStats {
    total: number; waiting: number; rojo: number
    naranja: number; verde: number; atendidos: number
}

// ─── Configuración de prioridades ────────────────────────────────────────────
const PRIORITY_CONFIG = {
    ROJO: {
        label: 'Urgencia', color: 'bg-red-500', border: 'border-red-500',
        text: 'text-red-400', bg: 'bg-red-500/10', icon: AlertTriangle
    },
    NARANJA: {
        label: 'Prioritario', color: 'bg-orange-500', border: 'border-orange-500',
        text: 'text-orange-400', bg: 'bg-orange-500/10', icon: AlertCircle
    },
    VERDE: {
        label: 'No urgente', color: 'bg-green-500', border: 'border-green-500',
        text: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle2
    },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    WAITING: { label: 'En espera', color: 'text-yellow-400' },
    IN_ATTENTION: { label: 'En atención', color: 'text-blue-400' },
    COMPLETED: { label: 'Completado', color: 'text-green-400' },
    TRANSFERRED: { label: 'Transferido', color: 'text-purple-400' },
}

// ─── Componente Principal ────────────────────────────────────────────────────
export default function TriajePage() {
    const { config } = useOrganization()
    const { toast } = useToast()
    const [records, setRecords] = useState<TriageRecord[]>([])
    const [stats, setStats] = useState<TriageStats>({ total: 0, waiting: 0, rojo: 0, naranja: 0, verde: 0, atendidos: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterPriority, setFilterPriority] = useState<string>('all')
    const [saving, setSaving] = useState(false)
    const [patients, setPatients] = useState<any[]>([])

    // Form state
    const [form, setForm] = useState({
        patientName: '', patientAge: '', patientDni: '',
        heartRate: '', respiratoryRate: '', temperature: '',
        oxygenSaturation: '', bloodPressure: '', weight: '', height: '', glucometry: '',
        priority: 'VERDE' as 'ROJO' | 'NARANJA' | 'VERDE',
        chiefComplaint: '', notes: '',
        triageBy: 'Enf. María Mamani Quispe',
    })

    // IMC calculado
    const imc = form.weight && form.height
        ? (parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)
        : null

    // Auto-sugerir prioridad
    useEffect(() => {
        const hr = parseFloat(form.heartRate)
        const spo2 = parseFloat(form.oxygenSaturation)
        const temp = parseFloat(form.temperature)
        if ((hr > 120 || hr < 50) || spo2 < 90 || temp > 39.5) {
            setForm(f => ({ ...f, priority: 'ROJO' }))
        } else if ((hr > 100) || spo2 < 94 || temp > 38) {
            setForm(f => ({ ...f, priority: 'NARANJA' }))
        }
    }, [form.heartRate, form.oxygenSaturation, form.temperature])

    const load = useCallback(async () => {
        setIsLoading(true)
        try {
            const today = new Date().toISOString().split('T')[0]
            const [triageRes, statsRes, patientsRes] = await Promise.all([
                triajeAPI.getAll(today),
                triajeAPI.getStats(),
                patientsAPI.getAll({ limit: 50 }).catch(() => ({ data: { data: [] } })),
            ])
            setRecords(triageRes.data || [])
            setStats(statsRes.data || { total: 0, waiting: 0, rojo: 0, naranja: 0, verde: 0, atendidos: 0 })
            const pList = patientsRes.data?.data || patientsRes.data || []
            setPatients(Array.isArray(pList) ? pList : [])
        } catch {
            toast({ title: 'Error', description: 'No se pudo cargar el triaje', variant: 'destructive' })
        } finally {
            setIsLoading(false)
        }
    }, [toast])

    useEffect(() => { load() }, [load])

    const handleSubmit = async () => {
        if (!form.patientName || !form.chiefComplaint) {
            toast({ title: 'Error', description: 'Nombre del paciente y motivo son requeridos', variant: 'destructive' })
            return
        }
        setSaving(true)
        try {
            const payload = {
                ...form,
                patientAge: form.patientAge ? parseInt(form.patientAge) : undefined,
                heartRate: form.heartRate ? parseInt(form.heartRate) : undefined,
                respiratoryRate: form.respiratoryRate ? parseInt(form.respiratoryRate) : undefined,
                temperature: form.temperature ? parseFloat(form.temperature) : undefined,
                oxygenSaturation: form.oxygenSaturation ? parseFloat(form.oxygenSaturation) : undefined,
                weight: form.weight ? parseFloat(form.weight) : undefined,
                height: form.height ? parseFloat(form.height) : undefined,
                glucometry: form.glucometry ? parseFloat(form.glucometry) : undefined,
            }
            await triajeAPI.create(payload)
            toast({ title: '✅ Triaje registrado', description: `${form.patientName} — ${PRIORITY_CONFIG[form.priority].label}` })
            setShowForm(false)
            setForm({
                patientName: '', patientAge: '', patientDni: '',
                heartRate: '', respiratoryRate: '', temperature: '',
                oxygenSaturation: '', bloodPressure: '', weight: '', height: '', glucometry: '',
                priority: 'VERDE', chiefComplaint: '', notes: '',
                triageBy: 'Enf. María Mamani Quispe',
            })
            load()
        } catch {
            toast({ title: 'Error', description: 'No se pudo guardar el triaje', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await triajeAPI.updateStatus(id, status)
            toast({ title: 'Estado actualizado' })
            load()
        } catch {
            toast({ title: 'Error', variant: 'destructive' })
        }
    }

    const filtered = records
        .filter(r => filterPriority === 'all' || r.priority === filterPriority)
        .filter(r =>
            r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase())
        )

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-orange-400" />
                        </div>
                        Triaje
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {config?.hospitalName || 'C.S. Jorge Chávez'} · {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                    <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Triaje
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                    { label: 'Total Hoy', value: stats.total, color: 'text-foreground', icon: User },
                    { label: 'En Espera', value: stats.waiting, color: 'text-yellow-400', icon: Clock },
                    { label: '🔴 Urgencia', value: stats.rojo, color: 'text-red-400', icon: AlertTriangle },
                    { label: '🟠 Prioritario', value: stats.naranja, color: 'text-orange-400', icon: AlertCircle },
                    { label: '🟢 No Urgente', value: stats.verde, color: 'text-green-400', icon: CheckCircle2 },
                    { label: 'Atendidos', value: stats.atendidos, color: 'text-blue-400', icon: Eye },
                ].map(kpi => (
                    <Card key={kpi.label} className="p-4 bg-card border-border">
                        <div className="flex items-center gap-2 mb-1">
                            <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                            <span className="text-xs text-muted-foreground">{kpi.label}</span>
                        </div>
                        <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                    </Card>
                ))}
            </div>

            {/* Filtros y búsqueda */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar paciente o motivo..." className="pl-9"
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                {['all', 'ROJO', 'NARANJA', 'VERDE'].map(p => (
                    <button
                        key={p}
                        onClick={() => setFilterPriority(p)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterPriority === p
                            ? p === 'ROJO' ? 'bg-red-500 text-white'
                                : p === 'NARANJA' ? 'bg-orange-500 text-white'
                                    : p === 'VERDE' ? 'bg-green-500 text-white'
                                        : 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                        {p === 'all' ? 'Todos' : PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG].label}
                    </button>
                ))}
            </div>

            {/* Cola de Triaje */}
            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <Card className="p-12 text-center bg-card border-border">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay pacientes en triaje actualmente</p>
                    <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Registrar primer paciente
                    </Button>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map((record, index) => {
                        const P = PRIORITY_CONFIG[record.priority]
                        const S = STATUS_CONFIG[record.status] || STATUS_CONFIG.WAITING
                        return (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className={`p-4 bg-card border-l-4 ${P.border} hover:bg-accent/30 transition-colors`}>
                                    <div className="flex items-center gap-4">
                                        {/* Prioridad */}
                                        <div className={`w-10 h-10 rounded-xl ${P.bg} flex items-center justify-center flex-shrink-0`}>
                                            <P.icon className={`w-5 h-5 ${P.text}`} />
                                        </div>

                                        {/* Info principal */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-foreground">{record.patientName}</span>
                                                {record.patientAge && <span className="text-sm text-muted-foreground">{record.patientAge} años</span>}
                                                {record.patientDni && <span className="text-xs text-muted-foreground">DNI: {record.patientDni}</span>}
                                                <Badge variant="outline" className={`text-xs ${P.text}`}>{P.label}</Badge>
                                                <span className={`text-xs ${S.color}`}>— {S.label}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 truncate">{record.chiefComplaint}</p>
                                        </div>

                                        {/* Signos vitales */}
                                        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
                                            {record.heartRate && (
                                                <span className="flex items-center gap-1">
                                                    <Heart className="w-3 h-3 text-red-400" />
                                                    {record.heartRate} lpm
                                                </span>
                                            )}
                                            {record.oxygenSaturation && (
                                                <span className="flex items-center gap-1">
                                                    <Droplets className="w-3 h-3 text-blue-400" />
                                                    {record.oxygenSaturation}%
                                                </span>
                                            )}
                                            {record.temperature && (
                                                <span className="flex items-center gap-1">
                                                    <Thermometer className="w-3 h-3 text-orange-400" />
                                                    {record.temperature}°C
                                                </span>
                                            )}
                                        </div>

                                        {/* Hora y acciones */}
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(record.triageAt), 'HH:mm', { locale: es })}
                                            </p>
                                            {record.status === 'WAITING' && (
                                                <button
                                                    onClick={() => handleStatusChange(record.id, 'IN_ATTENTION')}
                                                    className="mt-1 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                                >
                                                    <ChevronRight className="w-3 h-3" /> Atender
                                                </button>
                                            )}
                                            {record.status === 'IN_ATTENTION' && (
                                                <button
                                                    onClick={() => handleStatusChange(record.id, 'COMPLETED')}
                                                    className="mt-1 text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" /> Completar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Modal: Formulario de Triaje */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto"
                        onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-card border border-border rounded-2xl w-full max-w-2xl my-4 overflow-hidden"
                        >
                            {/* Header modal */}
                            <div className="flex items-center justify-between p-5 border-b border-border bg-orange-500/10">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-orange-400" />
                                    <h2 className="text-lg font-bold text-foreground">Nuevo Registro de Triaje</h2>
                                </div>
                                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
                                {/* Datos del paciente */}
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Datos del Paciente
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-3">
                                            <label className="text-xs text-muted-foreground mb-1 block">Nombre completo *</label>
                                            <Input value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} placeholder="Ej: Juan Quispe Mamani" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Edad</label>
                                            <Input type="number" value={form.patientAge} onChange={e => setForm(f => ({ ...f, patientAge: e.target.value }))} placeholder="Años" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-muted-foreground mb-1 block">DNI</label>
                                            <Input value={form.patientDni} onChange={e => setForm(f => ({ ...f, patientDni: e.target.value }))} placeholder="12345678" maxLength={8} />
                                        </div>
                                    </div>
                                </div>

                                {/* Signos Vitales */}
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> Signos Vitales
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { key: 'heartRate', label: 'FC (lpm)', icon: Heart, color: 'text-red-400', placeholder: '72' },
                                            { key: 'respiratoryRate', label: 'FR (resp/min)', icon: Wind, color: 'text-blue-400', placeholder: '16' },
                                            { key: 'temperature', label: 'Temp (°C)', icon: Thermometer, color: 'text-orange-400', placeholder: '36.5' },
                                            { key: 'oxygenSaturation', label: 'SpO2 (%)', icon: Droplets, color: 'text-cyan-400', placeholder: '98' },
                                        ].map(field => (
                                            <div key={field.key}>
                                                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                    <field.icon className={`w-3 h-3 ${field.color}`} /> {field.label}
                                                </label>
                                                <Input
                                                    type="number" step="0.1" placeholder={field.placeholder}
                                                    value={(form as any)[field.key]}
                                                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                                                />
                                            </div>
                                        ))}
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                <Gauge className="w-3 h-3 text-purple-400" /> PA (mmHg)
                                            </label>
                                            <Input placeholder="120/80" value={form.bloodPressure} onChange={e => setForm(f => ({ ...f, bloodPressure: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                <Scale className="w-3 h-3 text-green-400" /> Peso (kg)
                                            </label>
                                            <Input type="number" step="0.1" placeholder="65" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                <Ruler className="w-3 h-3 text-blue-400" /> Talla (cm)
                                            </label>
                                            <Input type="number" placeholder="165" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                <Droplets className="w-3 h-3 text-yellow-400" /> Glicemia (mg/dL)
                                            </label>
                                            <Input type="number" placeholder="90" value={form.glucometry} onChange={e => setForm(f => ({ ...f, glucometry: e.target.value }))} />
                                        </div>
                                    </div>
                                    {imc && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            IMC calculado: <span className="text-foreground font-medium">{imc} kg/m²</span>
                                            {parseFloat(imc) < 18.5 ? ' — Bajo peso'
                                                : parseFloat(imc) < 25 ? ' — Normal'
                                                    : parseFloat(imc) < 30 ? ' — Sobrepeso'
                                                        : ' — Obesidad'}
                                        </p>
                                    )}
                                </div>

                                {/* Clasificación */}
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Clasificación de Prioridad</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['ROJO', 'NARANJA', 'VERDE'] as const).map(p => {
                                            const P = PRIORITY_CONFIG[p]
                                            return (
                                                <button
                                                    key={p}
                                                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                                                    className={`p-3 rounded-xl border-2 transition-all text-left ${form.priority === p ? `${P.border} ${P.bg}` : 'border-border bg-muted/30'}`}
                                                >
                                                    <P.icon className={`w-5 h-5 ${P.text} mb-1`} />
                                                    <div className={`font-medium text-sm ${P.text}`}>{P.label}</div>
                                                    <div className="text-xs text-muted-foreground">{p}</div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        💡 La prioridad se sugiere automáticamente según los signos vitales
                                    </p>
                                </div>

                                {/* Motivo de consulta */}
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Motivo de consulta *</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                        rows={2}
                                        placeholder="Describe el motivo principal de consulta..."
                                        value={form.chiefComplaint}
                                        onChange={e => setForm(f => ({ ...f, chiefComplaint: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Observaciones adicionales</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                        rows={2}
                                        placeholder="Notas adicionales..."
                                        value={form.notes}
                                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Triaje realizado por</label>
                                    <Input value={form.triageBy} onChange={e => setForm(f => ({ ...f, triageBy: e.target.value }))} />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex gap-3 p-5 border-t border-border">
                                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
                                <Button onClick={handleSubmit} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Registrar Triaje
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
