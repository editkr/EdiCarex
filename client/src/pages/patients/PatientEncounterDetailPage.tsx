import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Save, Trash2, Search, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { encountersAPI, patientsAPI } from '@/services/api'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface CIE10Record {
    code: string
    name: string
    type: string // PRIMARY, SECONDARY, PRESUMPTIVE, DEFINITIVE
}

// Simulador básico de CIE-10
const MOCK_CIE10 = [
    { code: 'G43', name: 'Migraña' },
    { code: 'J01.9', name: 'Sinusitis aguda, no especificada' },
    { code: 'I10', name: 'Hipertensión esencial (primaria)' },
    { code: 'E11', name: 'Diabetes mellitus tipo 2' },
    { code: 'J20.9', name: 'Bronquitis aguda, no especificada' },
    { code: 'A09.9', name: 'Gastroenteritis y colitis de origen no especificado' }
]

export default function PatientEncounterDetailPage() {
    const { id: patientId, encounterId } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()

    const [isSaving, setIsSaving] = useState(false)
    const [notes, setNotes] = useState('')
    const [diagnoses, setDiagnoses] = useState<CIE10Record[]>([])

    // CIE-10 Search State
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<typeof MOCK_CIE10>([])
    const [selectedDiagType, setSelectedDiagType] = useState('DEFINITIVE')

    const { data: encounter, isLoading: loadingEncounter, refetch } = useQuery({
        queryKey: ['encounter', encounterId],
        queryFn: async () => {
            if (!encounterId) return null
            const res = await encountersAPI.getOne(encounterId)
            const data = res.data
            setNotes(data.notes || '')
            setDiagnoses(data.diagnoses ? (typeof data.diagnoses === 'string' ? JSON.parse(data.diagnoses) : data.diagnoses) : [])
            return data
        },
        enabled: !!encounterId
    })

    const handleSearchCIE10 = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchTerm(value)
        if (value.length > 2) {
            const results = MOCK_CIE10.filter(d =>
                d.code.toLowerCase().includes(value.toLowerCase()) ||
                d.name.toLowerCase().includes(value.toLowerCase())
            )
            setSearchResults(results)
        } else {
            setSearchResults([])
        }
    }

    const handleAddDiagnosis = (diag: typeof MOCK_CIE10[0]) => {
        if (diagnoses.find(d => d.code === diag.code)) {
            toast({ title: 'Aviso', description: 'El diagnóstico ya fue agregado', variant: 'destructive' })
            return
        }
        setDiagnoses([...diagnoses, { code: diag.code, name: diag.name, type: selectedDiagType }])
        setSearchTerm('')
        setSearchResults([])
    }

    const handleRemoveDiagnosis = (code: string) => {
        setDiagnoses(diagnoses.filter(d => d.code !== code))
    }

    const handleSaveEvolucion = async () => {
        try {
            setIsSaving(true)
            await encountersAPI.update(encounterId!, {
                notes,
                diagnoses
            })

            toast({
                title: 'Evolución guardada',
                description: 'Los datos del encuentro fueron actualizados correctamente.'
            })
            refetch()
        } catch (error) {
            console.error('Error saving encounter data', error)
            toast({
                title: 'Error',
                description: 'No se pudo guardar la evolución.',
                variant: 'destructive',
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleCloseEncounter = async () => {
        if (!confirm('¿Está seguro de cerrar este encuentro? Ya no podrá ser editado.')) return

        try {
            setIsSaving(true)
            await encountersAPI.update(encounterId!, {
                notes,
                diagnoses,
                status: 'CLOSED',
                closedAt: new Date().toISOString()
            })

            toast({
                title: 'Encuentro cerrado',
                description: 'El encuentro ha sido finalizado.'
            })
            navigate(`/patients/${patientId}/encounters`)
        } catch (error) {
            console.error('Error closing encounter', error)
            toast({
                title: 'Error',
                description: 'No se pudo cerrar el encuentro.',
                variant: 'destructive',
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (loadingEncounter) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!encounter) {
        return <div className="p-6">No se encontró el encuentro clínico.</div>
    }

    const isClosed = encounter.status === 'CLOSED'

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link to={`/patients/${patientId}/encounters`}><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            Encuentro: {encounter.type}
                            <Badge variant={isClosed ? 'secondary' : 'default'} className="ml-2">
                                {isClosed ? 'Cerrado' : 'En Curso'}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground">
                            {format(new Date(encounter.createdAt), "PPP 'a las' p", { locale: es })}
                        </p>
                    </div>
                </div>
                {!isClosed && (
                    <Button variant="destructive" onClick={handleCloseEncounter} disabled={isSaving}>
                        Finalizar Atención
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Detalles de Admisión</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <span className="font-semibold text-muted-foreground block mb-1">Motivo:</span>
                                <span>{encounter.reason || 'No especificado'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-muted-foreground block mb-1">Atendido por:</span>
                                <span>{encounter.staff?.user ? `${encounter.staff.user.firstName} ${encounter.staff.user.lastName}` : 'Personal de turno'}</span>
                            </div>
                            {isClosed && encounter.closedAt && (
                                <div>
                                    <span className="font-semibold text-muted-foreground block mb-1">Cerrado el:</span>
                                    <span>{format(new Date(encounter.closedAt), "PPP 'a las' p", { locale: es })}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <FileText className="h-5 w-5" /> Impresiones Diagnósticas (CIE-10)
                                </CardTitle>
                                <CardDescription>Agregue los diagnósticos encontrados durante la atención.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {!isClosed && (
                                <div className="space-y-4 p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900">
                                    <div className="flex gap-4">
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por código o nombre (ej. Migraña)"
                                                className="pl-9"
                                                value={searchTerm}
                                                onChange={handleSearchCIE10}
                                            />
                                            {searchResults.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-popover border text-popover-foreground shadow-md rounded-md max-h-60 overflow-auto">
                                                    {searchResults.map(res => (
                                                        <div
                                                            key={res.code}
                                                            className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                                                            onClick={() => handleAddDiagnosis(res)}
                                                        >
                                                            <span><span className="font-mono font-medium">{res.code}</span> - {res.name}</span>
                                                            <Plus className="h-4 w-4 text-primary" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Select value={selectedDiagType} onValueChange={setSelectedDiagType}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DEFINITIVE">Definitivo</SelectItem>
                                                <SelectItem value="PRESUMPTIVE">Presuntivo</SelectItem>
                                                <SelectItem value="REPETITIVE">Repetitivo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Código</TableHead>
                                            <TableHead>Diagnóstico</TableHead>
                                            <TableHead className="w-[120px]">Tipo</TableHead>
                                            {!isClosed && <TableHead className="w-[80px]"></TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {diagnoses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={isClosed ? 3 : 4} className="text-center text-muted-foreground py-6">
                                                    No se han registrado diagnósticos.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            diagnoses.map((diag, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-mono font-medium">{diag.code}</TableCell>
                                                    <TableCell>{diag.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{diag.type === 'DEFINITIVE' ? 'Def.' : diag.type === 'PRESUMPTIVE' ? 'Pres.' : 'Rep.'}</Badge>
                                                    </TableCell>
                                                    {!isClosed && (
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleRemoveDiagnosis(diag.code)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Notas Clínicas (Evolución)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Escriba la evolución, anamnesis, tratamiento indicado, etc..."
                                className="min-h-[250px] resize-y"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={isClosed}
                            />
                        </CardContent>
                        {!isClosed && (
                            <CardFooter className="flex justify-end border-t pt-6">
                                <Button onClick={handleSaveEvolucion} disabled={isSaving} className="gap-2">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Guardar Evolución
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
