import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Syringe, Shield, Baby, User, Calendar, ExternalLink,
    Search, Plus, RefreshCw, Loader2, Save, X, Info,
    ChevronDown, CheckCircle2, AlertCircle, TrendingUp,
    FileText, Download
} from 'lucide-react'
import { vacunacionAPI, patientsAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useOrganization } from '@/contexts/OrganizationContext'

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface VaccinationRecord {
    id: string
    patientName: string
    patientAge?: number
    patientDni?: string
    vaccineName: string
    doseNumber: string
    lotNumber?: string
    laboratory?: string
    appliedAt: string
    appliedBy: string
    category: 'NINO' | 'EMBARAZADA' | 'ADULTO' | 'ADULTO_MAYOR'
    nextDoseDate?: string
    status: string
}

interface VaccinationStats {
    totalMonth: number
    today: number
    byCategory: {
        ninos: number
        embarazadas: number
        adultos: number
        adultosMayores: number
    }
    topVaccines: { name: string; count: number }[]
}

// ─── Componente Principal ────────────────────────────────────────────────────
export default function VacunacionPage() {
    const { config } = useOrganization()
    const { toast } = useToast()
    const [records, setRecords] = useState<VaccinationRecord[]>([])
    const [stats, setStats] = useState<VaccinationStats>({
        totalMonth: 0, today: 0,
        byCategory: { ninos: 0, embarazadas: 0, adultos: 0, adultosMayores: 0 },
        topVaccines: []
    })
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [saving, setSaving] = useState(false)

    // Form state
    const [form, setForm] = useState({
        patientName: '', patientAge: '', patientDni: '',
        vaccineName: '', doseNumber: '1ra Dosis', lotNumber: '',
        laboratory: '', category: 'ADULTO',
        appliedBy: 'Lic. Elena Ccopa Huanca', // Personal real del SEED
        notes: '', nextDoseDate: ''
    })

    const load = useCallback(async () => {
        setIsLoading(true)
        try {
            const [listRes, statsRes] = await Promise.all([
                vacunacionAPI.getAll({ category: categoryFilter }),
                vacunacionAPI.getStats()
            ])
            setRecords(listRes.data || [])
            setStats(statsRes.data || stats)
        } catch {
            toast({ title: 'Error', description: 'No se pudo cargar la información de vacunación', variant: 'destructive' })
        } finally {
            setIsLoading(false)
        }
    }, [categoryFilter, toast])

    useEffect(() => { load() }, [load])

    const handleSubmit = async () => {
        if (!form.patientName || !form.vaccineName) {
            toast({ title: 'Atención', description: 'Complete los campos obligatorios', variant: 'destructive' })
            return
        }
        setSaving(true)
        try {
            await vacunacionAPI.create({
                ...form,
                patientAge: form.patientAge ? parseInt(form.patientAge) : undefined,
                appliedAt: new Date().toISOString()
            })
            toast({ title: '✅ Registro exitoso', description: 'La vacuna ha sido registrada en el sistema ESNI.' })
            setShowForm(false)
            setForm({
                patientName: '', patientAge: '', patientDni: '',
                vaccineName: '', doseNumber: '1ra Dosis', lotNumber: '',
                laboratory: '', category: 'ADULTO',
                appliedBy: 'Lic. Elena Ccopa Huanca',
                notes: '', nextDoseDate: ''
            })
            load()
        } catch {
            toast({ title: 'Error', description: 'No se pudo registrar la vacunación', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const filtered = records.filter(r =>
        r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.vaccineName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Syringe className="w-6 h-6 text-blue-400" />
                        </div>
                        Inmunizaciones (ESNI)
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Estrategia Sanitaria Nacional de Inmunizaciones · {config?.hospitalName || 'C.S. Jorge Chávez'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={load}>
                        <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Refrescar
                    </Button>
                    <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Registrar Vacuna
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-600/10 border-blue-500/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-blue-400 uppercase">Total Mes</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalMonth}</h3>
                        </div>
                        <TrendingUp className="w-5 h-5 text-blue-400 opacity-50" />
                    </div>
                    <div className="mt-2 text-[10px] text-blue-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Cobertura mensual al 85%
                    </div>
                </Card>
                <Card className="p-4 bg-green-600/10 border-green-500/30">
                    <p className="text-xs font-medium text-green-400 uppercase">Niños (ESNI)</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{stats.byCategory.ninos}</h3>
                    <div className="mt-2 text-[10px] text-green-300 flex items-center gap-1">
                        <Baby className="w-3 h-3" /> Esquema regular
                    </div>
                </Card>
                <Card className="p-4 bg-purple-600/10 border-purple-500/30">
                    <p className="text-xs font-medium text-purple-400 uppercase">Embarazadas</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{stats.byCategory.embarazadas}</h3>
                    <div className="mt-2 text-[10px] text-purple-300 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Protección binomio
                    </div>
                </Card>
                <Card className="p-4 bg-orange-600/10 border-orange-500/30">
                    <p className="text-xs font-medium text-orange-400 uppercase">Adultos / AM</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{stats.byCategory.adultos + stats.byCategory.adultosMayores}</h3>
                    <div className="mt-2 text-[10px] text-orange-300 flex items-center gap-1">
                        <User className="w-3 h-3" /> Refuerzos estacionales
                    </div>
                </Card>
            </div>

            <Tabs defaultValue="list" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-card border border-border">
                        <TabsTrigger value="list" className="gap-2">
                            <FileText className="w-4 h-4" /> Historial
                        </TabsTrigger>
                        <TabsTrigger value="campaign" className="gap-2">
                            <Calendar className="w-4 h-4" /> Campañas
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por paciente o vacuna..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="bg-card border border-border rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">Todas las categorías</option>
                            <option value="NINO">Niños (ESNI)</option>
                            <option value="EMBARAZADA">Embarazadas</option>
                            <option value="ADULTO">Adultos</option>
                            <option value="ADULTO_MAYOR">Adultos Mayores</option>
                        </select>
                    </div>
                </div>

                <TabsContent value="list" className="m-0">
                    <Card className="overflow-hidden border-border bg-card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Paciente</th>
                                        <th className="px-6 py-4 font-semibold">Vacuna / Dosis</th>
                                        <th className="px-6 py-4 font-semibold">Lote / Lab</th>
                                        <th className="px-6 py-4 font-semibold">Fecha Aplicación</th>
                                        <th className="px-6 py-4 font-semibold">Categoría</th>
                                        <th className="px-6 py-4 font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                                            </td>
                                        </tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                No se encontraron registros de vacunación
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((r, idx) => (
                                            <motion.tr
                                                key={r.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="hover:bg-accent/30 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-foreground">{r.patientName}</div>
                                                    <div className="text-xs text-muted-foreground">DNI: {r.patientDni || '---'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="bg-blue-500/5 text-blue-400 border-blue-500/20">
                                                            {r.vaccineName}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">{r.doseNumber}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-xs font-mono">{r.lotNumber || '---'}</div>
                                                    <div className="text-xs text-muted-foreground">{r.laboratory || '---'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-xs">{format(new Date(r.appliedAt), "d 'de' MMM, yyyy", { locale: es })}</div>
                                                    <div className="text-[10px] text-muted-foreground">{format(new Date(r.appliedAt), "HH:mm")}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={
                                                        r.category === 'NINO' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            r.category === 'EMBARAZADA' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                                'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                    }>
                                                        {r.category === 'NINO' ? 'Niño' : r.category === 'EMBARAZADA' ? 'Gestante' : 'Adulto'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="campaign">
                    <Card className="p-12 text-center border-dashed border-2 border-border bg-card">
                        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground">Campañas de Vacunación 2026</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mt-2">
                            Aquí aparecerán las campañas nacionales programadas por el MINSA (ej: Campaña contra el Sarampión, Vacuna contra la Polio, Influenza Estacional).
                        </p>
                        <Button variant="outline" className="mt-6">Ver Calendario Nacional</Button>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal de Registro */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
                        onClick={e => e.target === e.currentTarget && setShowForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-card border border-border rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-border bg-blue-600/10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Syringe className="w-6 h-6 text-blue-400" />
                                    <h2 className="text-xl font-bold">Registrar Aplicación de Vacuna</h2>
                                </div>
                                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Nombre del Paciente *</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Ej: Juan Quispe"
                                                className="pl-10"
                                                value={form.patientName}
                                                onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">DNI / Documento</label>
                                        <Input
                                            placeholder="12345678"
                                            value={form.patientDni}
                                            onChange={e => setForm(f => ({ ...f, patientDni: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Edad (Años)</label>
                                        <Input
                                            type="number"
                                            placeholder="Años"
                                            value={form.patientAge}
                                            onChange={e => setForm(f => ({ ...f, patientAge: e.target.value }))}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Categoría ESNI</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {['NINO', 'EMBARAZADA', 'ADULTO', 'ADULTO_MAYOR'].map(cat => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, category: cat as any }))}
                                                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${form.category === cat ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'}`}
                                                >
                                                    {cat === 'NINO' ? '👦 Niño' : cat === 'EMBARAZADA' ? '🤰 Gestante' : cat === 'ADULTO' ? '👨 Adulto' : '👴 AM'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 border-t border-border pt-4">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Información de la Vacuna *</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <Input
                                                    placeholder="Nombre de la Vacuna (Ej: Pentavalente, BCG, Influenza)"
                                                    value={form.vaccineName}
                                                    onChange={e => setForm(f => ({ ...f, vaccineName: e.target.value }))}
                                                />
                                            </div>
                                            <select
                                                className="bg-background border border-border rounded-md px-3 py-2 text-sm"
                                                value={form.doseNumber}
                                                onChange={e => setForm(f => ({ ...f, doseNumber: e.target.value }))}
                                            >
                                                <option>1ra Dosis</option>
                                                <option>2da Dosis</option>
                                                <option>3ra Dosis</option>
                                                <option>Única Dosis</option>
                                                <option>1er Refuerzo</option>
                                                <option>2do Refuerzo</option>
                                            </select>
                                            <Input
                                                placeholder="N° de Lote"
                                                value={form.lotNumber}
                                                onChange={e => setForm(f => ({ ...f, lotNumber: e.target.value }))}
                                            />
                                            <Input
                                                placeholder="Laboratorio"
                                                className="col-span-2"
                                                value={form.laboratory}
                                                onChange={e => setForm(f => ({ ...f, laboratory: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 border-t border-border pt-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block font-mono"><Calendar className="w-3 h-3 inline mr-1" /> Próxima Dosis</label>
                                                <Input
                                                    type="date"
                                                    value={form.nextDoseDate}
                                                    onChange={e => setForm(f => ({ ...f, nextDoseDate: e.target.value }))}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block font-mono"><User className="w-3 h-3 inline mr-1" /> Personal Responsable</label>
                                                <Input
                                                    value={form.appliedBy}
                                                    onChange={e => setForm(f => ({ ...f, appliedBy: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Observaciones</label>
                                        <textarea
                                            className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                                            placeholder="Anotaciones sobre la aplicación o reacciones..."
                                            value={form.notes}
                                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border bg-muted/30 flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancelar</Button>
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={handleSubmit}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Guardar Registro ESNI
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
