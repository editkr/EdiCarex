import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import {
    Search,
    User,
    Calendar,
    Stethoscope,
    FileText,
    Pill,
    DollarSign,
    Loader2,
} from 'lucide-react'
import { patientsAPI, doctorsAPI, appointmentsAPI } from '@/services/api'
import { useOrganization } from '@/contexts/OrganizationContext'

interface SearchResult {
    type: 'patient' | 'doctor' | 'appointment' | 'invoice' | 'medication'
    id: string
    title: string
    subtitle: string
    path: string
}

export default function GlobalSearch() {
    const navigate = useNavigate()
    const { config } = useOrganization()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<SearchResult[]>([])
    const debounceRef = useRef<NodeJS.Timeout>()

    // Keyboard shortcut (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setOpen(true)
            }
            if (e.key === 'Escape') {
                setOpen(false)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([])
            return
        }

        // Debounce search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(() => {
            performSearch(query)
        }, 300)

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [query])

    const performSearch = async (searchQuery: string) => {
        setLoading(true)
        const searchResults: SearchResult[] = []

        try {
            // Search patients
            const patientsRes = await patientsAPI.getAll({ search: searchQuery, limit: 5 })
            const patients = patientsRes.data.data || patientsRes.data || []
            patients.forEach((p: any) => {
                searchResults.push({
                    type: 'patient',
                    id: p.id,
                    title: `${p.firstName} ${p.lastName}`,
                    subtitle: p.email || p.phone || 'Paciente',
                    path: `/patients/${p.id}`,
                })
            })

            // Search doctors
            const doctorsRes = await doctorsAPI.getAll({ search: searchQuery, limit: 5 })
            const doctors = doctorsRes.data.data || doctorsRes.data || []
            doctors.forEach((d: any) => {
                searchResults.push({
                    type: 'doctor',
                    id: d.id,
                    title: `Dr. ${d.user?.firstName} ${d.user?.lastName}`,
                    subtitle: d.specialty?.name || 'Médico',
                    path: `/doctors/${d.id}`,
                })
            })

            // Search appointments by patient name
            const appointmentsRes = await appointmentsAPI.getAll({ search: searchQuery, limit: 5 })
            const appointments = appointmentsRes.data.data || appointmentsRes.data || []
            appointments.slice(0, 3).forEach((a: any) => {
                searchResults.push({
                    type: 'appointment',
                    id: a.id,
                    title: `Cita: ${a.patient?.firstName} ${a.patient?.lastName}`,
                    subtitle: `${a.appointmentDate} - ${a.startTime}`,
                    path: `/appointments/${a.id}`,
                })
            })
        } catch (error) {
            console.error('Search error:', error)
        }

        setResults(searchResults)
        setLoading(false)
    }

    const handleSelect = (result: SearchResult) => {
        navigate(result.path)
        setOpen(false)
        setQuery('')
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'patient':
                return <User className="h-4 w-4" />
            case 'doctor':
                return <Stethoscope className="h-4 w-4" />
            case 'appointment':
                return <Calendar className="h-4 w-4" />
            case 'invoice':
                return <DollarSign className="h-4 w-4" />
            case 'medication':
                return <Pill className="h-4 w-4" />
            default:
                return <FileText className="h-4 w-4" />
        }
    }

    const groupedResults = {
        patients: results.filter((r) => r.type === 'patient'),
        doctors: results.filter((r) => r.type === 'doctor'),
        appointments: results.filter((r) => r.type === 'appointment'),
    }

    return (
        <>
            {/* Trigger Button */}
            <Button
                variant="outline"
                className="relative w-full max-w-md justify-between bg-muted/30 hover:bg-background border-muted-foreground/20 hover:border-primary/50 text-muted-foreground hover:text-foreground shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden"
                onClick={() => setOpen(true)}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all" />
                    <span className="font-normal tracking-wide">Buscar en {config?.hospitalName || 'EdiCarex'}...</span>
                </div>

                <div className="flex items-center gap-1">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-background border border-border px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs">Ctrl</span>K
                    </kbd>
                </div>
            </Button>

            {/* Search Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 max-w-2xl">
                    <Command className="rounded-lg border-0">
                        <div className="flex items-center border-b px-3">
                            <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
                            <input
                                placeholder="Buscar pacientes, doctores, citas..."
                                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        <CommandList className="max-h-[400px] overflow-y-auto">
                            {query.length >= 2 && results.length === 0 && !loading && (
                                <CommandEmpty>No se encontraron resultados</CommandEmpty>
                            )}

                            {query.length < 2 && (
                                <div className="p-4 text-sm text-center text-gray-500">
                                    Escribe al menos 2 caracteres para buscar
                                </div>
                            )}

                            {groupedResults.patients.length > 0 && (
                                <CommandGroup heading="Pacientes">
                                    {groupedResults.patients.map((result) => (
                                        <CommandItem
                                            key={result.id}
                                            onSelect={() => handleSelect(result)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    {getIcon(result.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{result.title}</p>
                                                    <p className="text-sm text-gray-500">{result.subtitle}</p>
                                                </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {groupedResults.doctors.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading="Doctores">
                                        {groupedResults.doctors.map((result) => (
                                            <CommandItem
                                                key={result.id}
                                                onSelect={() => handleSelect(result)}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                        {getIcon(result.type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium">{result.title}</p>
                                                        <p className="text-sm text-gray-500">{result.subtitle}</p>
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}

                            {groupedResults.appointments.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading="Citas">
                                        {groupedResults.appointments.map((result) => (
                                            <CommandItem
                                                key={result.id}
                                                onSelect={() => handleSelect(result)}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                        {getIcon(result.type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium">{result.title}</p>
                                                        <p className="text-sm text-gray-500">{result.subtitle}</p>
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </DialogContent>
            </Dialog>
        </>
    )
}
