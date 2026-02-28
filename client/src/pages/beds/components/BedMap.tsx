import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bed, MoreVertical, UserPlus, UserMinus, Settings, Trash2, Activity, Clock, AlertCircle, CheckCircle2, CalendarClock, Stethoscope } from 'lucide-react'
import { useBedStore, Bed as BedType } from '@/stores/bedStore'
import { Link } from 'react-router-dom'
import { useToast } from '@/components/ui/use-toast'
import BedAssignmentDialog from './BedAssignmentDialog'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { usePermissions } from '@/hooks/usePermissions'

interface BedMapProps {
    filterWard: string
    filterStatus: string
    searchQuery: string
    onEditBed: (bed: BedType) => void
}

export default function BedMap({ filterWard, filterStatus, searchQuery, onEditBed }: BedMapProps) {
    const { beds, deleteBed, dischargePatient, setBedStatus } = useBedStore()
    const { hasPermission } = usePermissions()
    const { toast } = useToast()
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [selectedBedId, setSelectedBedId] = useState<string | null>(null)

    const filteredBeds = beds.filter(bed => {
        if (filterWard !== 'ALL' && bed.ward !== filterWard) return false
        if (filterStatus !== 'ALL' && bed.status !== filterStatus) return false
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const matchesBed = bed.number.toLowerCase().includes(query)
            const matchesPatient = bed.patientName?.toLowerCase().includes(query)
            if (!matchesBed && !matchesPatient) return false
        }
        return true
    })

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return {
                    card: 'bg-white dark:bg-zinc-950 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20',
                    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-medium',
                    icon: 'text-emerald-500',
                    label: 'Disponible'
                }
            case 'OCCUPIED':
                return {
                    card: 'bg-white dark:bg-zinc-950 border-l-4 border-l-rose-500 shadow-sm hover:shadow-rose-100 dark:hover:shadow-rose-900/20',
                    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-none font-medium',
                    icon: 'text-rose-500',
                    label: 'Ocupada'
                }
            case 'CLEANING':
                return {
                    card: 'bg-white dark:bg-zinc-950 border-l-4 border-l-amber-500 shadow-sm hover:shadow-amber-100 dark:hover:shadow-amber-900/20',
                    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none font-medium',
                    icon: 'text-amber-500',
                    label: 'Limpieza'
                }
            case 'MAINTENANCE':
                return {
                    card: 'bg-white dark:bg-zinc-950 border-l-4 border-l-slate-500 shadow-sm hover:shadow-slate-100 dark:hover:shadow-slate-900/20',
                    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-none font-medium',
                    icon: 'text-slate-500',
                    label: 'Mantenimiento'
                }
            case 'RESERVED':
                return {
                    card: 'bg-white dark:bg-zinc-950 border-l-4 border-l-blue-500 shadow-sm hover:shadow-blue-100 dark:hover:shadow-blue-900/20',
                    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none font-medium',
                    icon: 'text-blue-500',
                    label: 'Reservada'
                }
            default:
                return {
                    card: 'bg-card border-border',
                    badge: 'bg-secondary text-secondary-foreground',
                    icon: 'text-muted-foreground',
                    label: status
                }
        }
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBeds.map((bed) => {
                    const styles = getStatusStyles(bed.status)
                    return (
                        <Card key={bed.id} className={`transition-all duration-300 group ${styles.card}`}>
                            <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-lg bg-zinc-900 shadow-sm border border-border/50`}>
                                            <Bed className={`h-5 w-5 ${styles.icon}`} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold tracking-tight">
                                                {bed.number}
                                            </CardTitle>
                                            <CardDescription className="text-xs font-semibold uppercase tracking-wider opacity-80 mt-0.5">
                                                {bed.ward}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>Acciones de Cama</DropdownMenuLabel>
                                        {bed.status === 'AVAILABLE' && hasPermission('BEDS_ASSIGN') && (
                                            <DropdownMenuItem onClick={() => {
                                                setSelectedBedId(bed.id)
                                                setAssignDialogOpen(true)
                                            }} className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/30">
                                                <UserPlus className="mr-2 h-4 w-4" /> Asignar Paciente
                                            </DropdownMenuItem>
                                        )}
                                        {bed.status === 'OCCUPIED' && (
                                            <DropdownMenuItem asChild className="text-primary focus:text-primary focus:bg-primary/5 cursor-pointer">
                                                <Link to={`/observation-room/${bed.id}`} className="flex items-center w-full">
                                                    <Clock className="mr-2 h-4 w-4" /> Ver Monitoreo (12h)
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        {bed.status === 'OCCUPIED' && hasPermission('BEDS_EDIT') && (
                                            <DropdownMenuItem onClick={() => {
                                                dischargePatient(bed.id)
                                                toast({ title: 'Paciente dado de alta', description: 'La cama ahora está en limpieza.' })
                                            }} className="text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-950/30 font-medium cursor-pointer">
                                                <UserMinus className="mr-2 h-4 w-4" /> Dar de Alta
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />

                                        {hasPermission('BEDS_EDIT') && (
                                            <DropdownMenuItem onClick={() => onEditBed(bed)}>
                                                <Settings className="mr-2 h-4 w-4" /> Editar Detalles
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuSeparator />
                                        {hasPermission('BEDS_EDIT') && (
                                            <>
                                                <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar Estado</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setBedStatus(bed.id, 'AVAILABLE')}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Disponible
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setBedStatus(bed.id, 'CLEANING')}>
                                                    <Activity className="mr-2 h-4 w-4 text-amber-500" /> Limpieza
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setBedStatus(bed.id, 'MAINTENANCE')}>
                                                    <Settings className="mr-2 h-4 w-4 text-slate-500" /> Mantenimiento
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setBedStatus(bed.id, 'RESERVED')}>
                                                    <CalendarClock className="mr-2 h-4 w-4 text-blue-500" /> Reservada
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <DropdownMenuSeparator />
                                        {hasPermission('BEDS_DELETE') && (
                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => deleteBed(bed.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar Cama
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Badge variant="outline" className={`${styles.badge} px-2.5 py-0.5`}>
                                            {styles.label}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded">{bed.type}</span>
                                    </div>

                                    {bed.status === 'OCCUPIED' && (
                                        <div className="p-3 bg-zinc-900/50 rounded-lg border border-border/50 text-sm space-y-3 mt-2">
                                            <div className="flex items-start gap-3">
                                                <div className="relative shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm border border-primary/30">
                                                        {bed.patientName ? bed.patientName.charAt(0).toUpperCase() : 'P'}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-zinc-950 border border-border flex items-center justify-center">
                                                        <Stethoscope className="h-2.5 w-2.5 text-emerald-500" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-bold text-foreground truncate">{bed.patientName || 'Paciente desconocido'}</p>
                                                        {bed.specialty && (
                                                            <Badge className="text-[8px] h-4 px-1 bg-blue-500/10 text-blue-400 border-blue-500/20">
                                                                {bed.specialty}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                                        <Clock className="h-3 w-3" />
                                                        {bed.admissionDate ? formatDistanceToNow(new Date(bed.admissionDate), { addSuffix: true, locale: es }) : 'Reciente'}
                                                    </div>
                                                </div>
                                            </div>

                                            {(bed.diagnosis || bed.estimatedDischarge || bed.notes) && (
                                                <div className="pt-2 border-t border-border/40 space-y-2">
                                                    {bed.diagnosis && (
                                                        <div className="flex items-start gap-2 text-[11px] text-muted-foreground leading-tight">
                                                            <AlertCircle className="h-3 w-3 mt-0.5 text-primary/60" />
                                                            <span className="line-clamp-2">{bed.diagnosis}</span>
                                                        </div>
                                                    )}
                                                    {bed.notes && (
                                                        <div className="text-[10px] text-muted-foreground/70 italic px-5">
                                                            "{bed.notes}"
                                                        </div>
                                                    )}
                                                    {bed.estimatedDischarge && (
                                                        <div className="flex items-center gap-2 text-[10px] text-amber-500/80 font-medium bg-amber-500/5 py-1 px-2 rounded border border-amber-500/10">
                                                            <CalendarClock className="h-3 w-3" />
                                                            Alta: {new Date(bed.estimatedDischarge).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', timeZone: 'UTC' })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {bed.status === 'RESERVED' && (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 text-sm">
                                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
                                                <CalendarClock className="h-3 w-3" />
                                                Reservada
                                            </div>
                                            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1 pl-5">
                                                {bed.notes || 'Sin notas'}
                                            </p>
                                        </div>
                                    )}

                                    {bed.status === 'CLEANING' && (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30 text-sm flex items-center gap-3">
                                            <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                                            <span className="text-amber-700 dark:text-amber-400 font-medium text-xs">En proceso de desinfección</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <BedAssignmentDialog
                isOpen={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                bedId={selectedBedId}
            />
        </>
    )
}
