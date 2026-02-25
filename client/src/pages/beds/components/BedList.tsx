import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, UserPlus, UserMinus, Settings, Trash2, Activity, CheckCircle2, CalendarClock, Clock, AlertCircle, Stethoscope } from "lucide-react"
import { useBedStore, Bed as BedType } from "@/stores/bedStore"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import BedAssignmentDialog from "./BedAssignmentDialog"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { usePermissions } from "@/hooks/usePermissions"

interface BedListProps {
    filterWard: string
    filterStatus: string
    searchQuery: string
    onEditBed: (bed: BedType) => void
}

export default function BedList({ filterWard, filterStatus, searchQuery, onEditBed }: BedListProps) {
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
            <div className="space-y-4">
                {filteredBeds.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-xl border border-dashed text-muted-foreground">
                        No se encontraron camas con los filtros actuales.
                    </div>
                ) : (
                    filteredBeds.map((bed) => {
                        const styles = getStatusStyles(bed.status)
                        return (
                            <div key={bed.id} className={`flex items-center gap-6 p-4 rounded-xl transition-all duration-300 group ${styles.card}`}>
                                <div className="flex items-center gap-4 w-[180px] shrink-0">
                                    <div className={`p-2.5 rounded-lg bg-zinc-900 shadow-sm border border-border/50`}>
                                        <Activity className={`h-5 w-5 ${styles.icon}`} />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold tracking-tight text-foreground">
                                            {bed.number}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-80">
                                            {bed.ward}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-[150px] shrink-0">
                                    <Badge variant="outline" className={`${styles.badge} px-2.5 py-0.5`}>
                                        {styles.label}
                                    </Badge>
                                    <div className="text-[10px] mt-1 text-muted-foreground font-medium uppercase">{bed.type}</div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    {bed.status === 'OCCUPIED' ? (
                                        <div className="flex items-center gap-4">
                                            <div className="relative shrink-0">
                                                <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg border-2 border-primary/30">
                                                    {bed.patientName ? bed.patientName.charAt(0).toUpperCase() : 'P'}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-zinc-900 border border-border flex items-center justify-center">
                                                    <Stethoscope className="h-3 w-3 text-emerald-500" />
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold text-base text-foreground tracking-tight truncate">
                                                        {bed.patientName || 'Paciente desconocido'}
                                                    </div>
                                                    {bed.specialty && (
                                                        <Badge variant="secondary" className="text-[9px] uppercase font-bold px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20">
                                                            {bed.specialty}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3 text-primary/70" />
                                                        <span className="font-medium">
                                                            {bed.admissionDate ? formatDistanceToNow(new Date(bed.admissionDate), { addSuffix: true, locale: es }) : 'Reciente'}
                                                        </span>
                                                    </div>
                                                    {bed.estimatedDischarge && (
                                                        <div className="text-[10px] text-amber-500/80 flex items-center gap-1.5 bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                                                            <CalendarClock className="h-3 w-3" />
                                                            Alta: {new Date(bed.estimatedDischarge).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', timeZone: 'UTC' })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-muted-foreground/30 italic text-sm">
                                            <div className="h-1 w-12 bg-muted-foreground/10 rounded-full" />
                                            <span>Esperando asignación...</span>
                                        </div>
                                    )}
                                </div>

                                <div className="w-[280px] hidden lg:block shrink-0 px-4 border-l border-border/20">
                                    {bed.diagnosis ? (
                                        <div className="space-y-1.5">
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest flex items-center gap-1.5">
                                                <AlertCircle className="h-3 w-3" /> Diagnóstico
                                            </div>
                                            <div className="text-xs text-foreground/90 line-clamp-2 leading-relaxed font-medium">
                                                {bed.diagnosis}
                                            </div>
                                            {bed.notes && (
                                                <div className="mt-2 pt-2 border-t border-border/10">
                                                    <div className="text-[9px] uppercase font-bold text-muted-foreground/40 tracking-widest">Notas</div>
                                                    <div className="text-[11px] text-muted-foreground/80 line-clamp-1 italic">"{bed.notes}"</div>
                                                </div>
                                            )}
                                        </div>
                                    ) : bed.patientName ? (
                                        <div className="text-[10px] text-muted-foreground/40 italic">Pendiente de diagnóstico</div>
                                    ) : null}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-muted/50 transition-colors">
                                                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            {bed.status === 'AVAILABLE' && hasPermission('BEDS_ASSIGN') && (
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedBedId(bed.id)
                                                    setAssignDialogOpen(true)
                                                }} className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/30 cursor-pointer">
                                                    <UserPlus className="mr-2 h-4 w-4" /> Asignar Paciente
                                                </DropdownMenuItem>
                                            )}
                                            {bed.status === 'OCCUPIED' && hasPermission('BEDS_EDIT') && (
                                                <DropdownMenuItem onClick={() => {
                                                    dischargePatient(bed.id)
                                                    toast({ title: 'Paciente dado de alta', description: 'La cama ahora está en limpieza.' })
                                                }} className="text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-950/30 cursor-pointer">
                                                    <UserMinus className="mr-2 h-4 w-4" /> Dar de Alta
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />

                                            {hasPermission('BEDS_EDIT') && (
                                                <DropdownMenuItem onClick={() => onEditBed(bed)} className="cursor-pointer text-blue-600 dark:text-blue-400">
                                                    <Settings className="mr-2 h-4 w-4" /> Editar Configuración
                                                </DropdownMenuItem>
                                            )}

                                            <DropdownMenuSeparator />
                                            {hasPermission('BEDS_EDIT') && (
                                                <>
                                                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Cambiar Estado Manual</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => setBedStatus(bed.id, 'AVAILABLE')} className="cursor-pointer">
                                                        <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Disponible
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setBedStatus(bed.id, 'CLEANING')} className="cursor-pointer">
                                                        <Activity className="mr-2 h-4 w-4 text-amber-500" /> Limpieza
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setBedStatus(bed.id, 'MAINTENANCE')} className="cursor-pointer">
                                                        <Settings className="mr-2 h-4 w-4 text-slate-500" /> Mantenimiento
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setBedStatus(bed.id, 'RESERVED')} className="cursor-pointer">
                                                        <CalendarClock className="mr-2 h-4 w-4 text-blue-500" /> Reservada
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            <DropdownMenuSeparator />
                                            {hasPermission('BEDS_DELETE') && (
                                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer" onClick={() => deleteBed(bed.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Permanentemente
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <BedAssignmentDialog
                isOpen={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                bedId={selectedBedId}
            />
        </>
    )
}
