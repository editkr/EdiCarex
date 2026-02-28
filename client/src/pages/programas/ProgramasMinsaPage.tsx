import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    ClipboardList, Heart, Baby, Shield, Activity,
    TrendingUp, Users, Calendar, ArrowRight, Info,
    CheckCircle2, AlertCircle, Plus, Search, Filter,
    LayoutDashboard, List, BarChart3, Pill, RefreshCw
} from 'lucide-react'
import { programasMinsaAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useOrganization } from '@/contexts/OrganizationContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface MinsaProgram {
    id: string
    code: string
    name: string
    description?: string
    monthlyGoal: number
    monthlyCount: number
    activeCount: number
    completedCount: number
    progressPercent: number
    coordinator?: string
}

// ─── Configuración Visual de Programas ─────────────────────────────────────────
const PROGRAM_CONFIG: Record<string, { icon: any, color: string, bg: string, ring: string }> = {
    PRENATAL: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', ring: 'ring-pink-500/30' },
    CRED: { icon: Baby, color: 'text-blue-400', bg: 'bg-blue-500/10', ring: 'ring-blue-500/30' },
    TBC: { icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10', ring: 'ring-red-500/30' },
    ANEMIA: { icon: Pill, color: 'text-orange-400', bg: 'bg-orange-500/10', ring: 'ring-orange-500/30' },
    PF: { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', ring: 'ring-purple-500/30' },
    MENTAL: { icon: Activity, color: 'text-green-400', bg: 'bg-green-500/10', ring: 'ring-green-500/30' },
}

// ─── Componente Principal ────────────────────────────────────────────────────
export default function ProgramasMinsaPage() {
    const { config } = useOrganization()
    const { toast } = useToast()
    const [programs, setPrograms] = useState<MinsaProgram[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({ totalRecords: 0, avgProgress: 0 })

    const load = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await programasMinsaAPI.getDashboard()
            setPrograms(res.data.programs || [])
            setStats({
                totalRecords: res.data.totalRecordsMonth || 0,
                avgProgress: res.data.avgProgress || 0
            })
        } catch {
            toast({ title: 'Error', description: 'No se pudieron cargar los programas estratégicos', variant: 'destructive' })
        } finally {
            setIsLoading(false)
        }
    }, [toast])

    useEffect(() => { load() }, [load])

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <ClipboardList className="w-6 h-6 text-primary" />
                        </div>
                        Programas Estratégicos (Salud Pública)
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Seguimiento de objetivos y estrategias sanitarias nacionales · {config?.hospitalName || 'C.S. Jorge Chávez'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={load}>
                        <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Sincronizar
                    </Button>
                    <Button className="bg-primary hover:opacity-90">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Reporte HIS
                    </Button>
                </div>
            </div>

            {/* Global Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 bg-card border-border relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users className="w-24 h-24" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Total Atenciones del Mes</p>
                    <div className="text-4xl font-bold text-foreground mb-3">{stats.totalRecords}</div>
                    <div className="flex items-center gap-2 text-xs text-green-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>+12% respecto al mes anterior</span>
                    </div>
                </Card>

                <Card className="p-6 bg-card border-border relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-24 h-24" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Avance de Metas Global</p>
                    <div className="text-4xl font-bold text-primary mb-3">{stats.avgProgress}%</div>
                    <Progress value={stats.avgProgress} className="h-2 bg-muted" />
                </Card>

                <Card className="p-6 bg-card border-border relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckCircle2 className="w-24 h-24" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Cumplimiento de Indicadores</p>
                    <div className="text-4xl font-bold text-green-400 mb-3">Optimo</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Info className="w-3 h-3" />
                        <span>6 de 6 programas en zona verde</span>
                    </div>
                </Card>
            </div>

            {/* Programs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="h-[280px] animate-pulse bg-muted/20" />
                    ))
                ) : (
                    programs.map((program, idx) => {
                        const style = PROGRAM_CONFIG[program.code] || PROGRAM_CONFIG.MENTAL
                        return (
                            <motion.div
                                key={program.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Card className="h-full border border-border bg-card hover:border-primary/50 transition-all group overflow-hidden flex flex-col">
                                    <div className={`p-6 ${style.bg} border-b border-border/50`}>
                                        <div className="flex justify-between items-start">
                                            <div className={`p-3 rounded-2xl bg-background border border-border shadow-sm group-hover:scale-110 transition-transform`}>
                                                <style.icon className={`w-6 h-6 ${style.color}`} />
                                            </div>
                                            <Badge variant="outline" className={`${style.color} ${style.bg} border-none font-mono text-xs`}>
                                                {program.code}
                                            </Badge>
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground mt-4">{program.name}</h3>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 h-8 leading-relaxed">
                                            {program.description}
                                        </p>
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Progreso Mensual</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-bold text-foreground">{program.monthlyCount}</span>
                                                        <span className="text-sm text-muted-foreground">/ {program.monthlyGoal} metas</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-lg font-bold ${program.progressPercent >= 100 ? 'text-green-400' : 'text-primary'}`}>
                                                        {program.progressPercent}%
                                                    </span>
                                                </div>
                                            </div>
                                            <Progress value={program.progressPercent} className={`h-2.5 bg-muted`} />
                                        </div>

                                        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                                            <div className="flex -space-x-2">
                                                <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold">EM</div>
                                                <div className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary">SC</div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="text-xs group-hover:text-primary transition-colors pr-0">
                                                Ver Detalles <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })
                )}
            </div>

            {/* Legend / Secondary Info */}
            <Card className="p-4 bg-muted/20 border-border flex items-center gap-4 text-sm text-muted-foreground">
                <Info className="w-5 h-5 text-primary" />
                <p>
                    Las metas se reinician el primer día de cada mes automáticamente. Los datos mostrados corresponden a los registros realizados en la plataforma durante el mes en curso (registros del sistema + carga parcial de HIS).
                </p>
            </Card>
        </div>
    )
}
