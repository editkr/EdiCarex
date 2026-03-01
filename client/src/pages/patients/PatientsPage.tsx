import { useState, useRef } from 'react'
import { read, utils } from 'xlsx'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { patientsAPI } from '@/services/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Plus,
    Search,
    Loader2,
    Edit,
    Trash2,
    FileDown,
    FileSpreadsheet,
    Upload,
    Printer,
    Filter,
    Eye,
    User,
    AlertTriangle,
} from 'lucide-react'
import PatientModal from '@/components/modals/PatientModal'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import EmergencyModal from '@/components/modals/EmergencyModal'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/stores/authStore'

export default function PatientsPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { hasPermission } = usePermissions()
    const user = useAuthStore(state => state.user)

    // Estados
    const [searchTerm, setSearchTerm] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<any>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)
    const [emergencyPatientId, setEmergencyPatientId] = useState<string | null>(null)

    // Filtros
    const [filters, setFilters] = useState({
        gender: 'all',
        status: 'all',
        priority: 'all',
        ageMin: '',
        ageMax: '',
        insurance: 'all',
    })

    // Cargar pacientes
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['patients'],
        queryFn: () => patientsAPI.getAll(),
    })

    const patients = data?.data?.data || []

    // Helper functions
    const calculateAge = (dateOfBirth: string) => {
        if (!dateOfBirth) return 'N/A'
        const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear()
        return age
    }

    const getPatientPriority = (patient: any) => {
        // If backend doesn't send priority, simulate it based on age or status for UI demo
        if (patient.priority) return patient.priority
        if (patient.status === 'CRITICAL') return 'HIGH'

        const age = calculateAge(patient.dateOfBirth)
        if (typeof age === 'number' && age > 70) return 'HIGH'
        return 'MEDIUM'
    }

    // Filtrar pacientes
    const filteredPatients = patients.filter((patient: any) => {
        // Búsqueda por texto
        const searchMatch = searchTerm === '' ||
            `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.phone?.includes(searchTerm) ||
            patient.documentNumber?.includes(searchTerm)

        // Filtros
        const genderMatch = filters.gender === 'all' || patient.gender === filters.gender
        const statusMatch = filters.status === 'all' || patient.status === filters.status

        // Filtro de prioridad
        const priorityMatch = filters.priority === 'all' || getPatientPriority(patient) === filters.priority

        // Filtro de seguro
        let insuranceMatch = true
        if (filters.insurance !== 'all') {
            if (filters.insurance === 'none') {
                // Sin seguro: campo vacío, null o undefined
                insuranceMatch = !patient.insuranceProvider || patient.insuranceProvider === ''
            } else if (filters.insurance === 'private') {
                // Aseguradoras privadas conocidas en Perú
                const privateInsurers = ['pacifico', 'rimac', 'positiva', 'mapfre', 'sanitas', 'oncosalud', 'vida', 'internacional']
                insuranceMatch = patient.insuranceProvider &&
                    privateInsurers.some(ins =>
                        patient.insuranceProvider.toLowerCase().includes(ins)
                    )
            } else if (filters.insurance === 'public') {
                // Aseguradoras públicas conocidas en Perú
                const publicInsurers = ['essalud', 'sis', 'seguro integral', 'salud', 'minsa']
                insuranceMatch = patient.insuranceProvider &&
                    publicInsurers.some(ins =>
                        patient.insuranceProvider.toLowerCase().includes(ins)
                    )
            }
        }

        // Edad
        let ageMatch = true
        if (patient.dateOfBirth) {
            const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
            if (filters.ageMin && age < parseInt(filters.ageMin)) ageMatch = false
            if (filters.ageMax && age > parseInt(filters.ageMax)) ageMatch = false
        }

        return searchMatch && genderMatch && statusMatch && priorityMatch && insuranceMatch && ageMatch
    })

    // Handlers
    const handleEdit = (patient: any) => {
        setSelectedPatient(patient)
        setModalOpen(true)
    }

    const handleAdd = () => {
        setSelectedPatient(null)
        setModalOpen(true)
    }



    const handleSuccess = () => {
        refetch()
        setModalOpen(false)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await patientsAPI.delete(deleteId)
            toast({
                title: 'Éxito',
                description: 'Paciente eliminado correctamente',
            })
            refetch()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al eliminar paciente',
                variant: 'destructive',
            })
        } finally {
            setDeleteId(null)
        }
    }

    const handleViewProfile = (patientId: string) => {
        navigate(`/patients/${patientId}`)
    }

    // Exportar funciones
    const handleExportPDF = () => {
        try {
            const doc = new jsPDF() as any

            // Header
            doc.setFontSize(14)
            doc.setTextColor(30)
            const orgTitle = (user as any)?.organization ? `${(user as any).organization.name} | IPRESS ${(user as any).organization.code}` : 'Centro de Salud Jorge Chávez | IPRESS 00003308'
            doc.text(`REPORTE DE PACIENTES — ${orgTitle}`, 14, 20)

            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.text(`Generado el: ${format(new Date(), 'PPP', { locale: es })}`, 14, 30)
            doc.text(`Total de registros: ${filteredPatients.length}`, 14, 36)

            // Table data
            const tableData = filteredPatients.map((patient: any) => [
                patient.documentNumber || 'N/A',
                `${patient.firstName} ${patient.lastName}`,
                calculateAge(patient.dateOfBirth) + ' años',
                patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : 'O',
                patient.phone || 'N/A',
                patient.sisCode || 'No afiliado',
                patient.status === 'ACTIVE' ? 'Activo' : patient.status === 'CRITICAL' ? 'Crítico' : 'Inactivo'
            ])

            // Generate table
            autoTable(doc, {
                head: [['DNI', 'Paciente', 'Edad', 'Sexo', 'Teléfono', 'Cód. SIS', 'Estado']],
                body: tableData,
                startY: 55,
                theme: 'grid',
                headStyles: {
                    fillColor: [59, 130, 246], // Blue
                    textColor: 255,
                    fontStyle: 'bold'
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                }
            })

            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.setTextColor(100)
                doc.text(
                    `Página ${i} de ${pageCount}`,
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                )
            }

            // Save PDF
            doc.save(`pacientes_${format(new Date(), 'yyyyMMdd')}.pdf`)

            toast({
                title: 'Éxito',
                description: 'PDF generado correctamente',
            })
        } catch (error) {
            console.error('Error generating PDF:', error)
            toast({
                title: 'Error',
                description: 'No se pudo generar el PDF',
                variant: 'destructive'
            })
        }
    }

    const handleExportExcel = () => {
        try {
            toast({
                title: 'Exportando...',
                description: 'Generando archivo CSV...',
            })

            // Generate CSV
            const headers = ['ID', 'Nombre', 'Apellido', 'DNI', 'Email', 'Teléfono', 'Género', 'Tipo Sangre', 'Estado']
            const rows = filteredPatients.map((p: any) => [
                p.id,
                p.firstName,
                p.lastName,
                p.documentNumber || '',
                p.email || '',
                p.phone || '',
                p.gender,
                p.bloodType || '',
                p.status
            ])

            const csvContent = [
                headers.join(','),
                ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.setAttribute('href', url)
            link.setAttribute('download', `pacientes_${format(new Date(), 'yyyyMMdd')}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast({
                title: 'Éxito',
                description: 'Archivo descargado correctamente',
            })
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'No se pudo exportar el archivo',
                variant: 'destructive'
            })
        }
    }

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImport = () => {
        fileInputRef.current?.click()
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = utils.sheet_to_json(worksheet)

                // Mapeo básico de columnas a propiedades del DTO
                const mapRowToPatient = (row: any) => ({
                    firstName: row['firstName'] || row['Nombre'] || row['First Name'] || 'Unknown',
                    lastName: row['lastName'] || row['Apellido'] || row['Last Name'] || 'Unknown',
                    documentNumber: row['documentNumber'] ? String(row['documentNumber']) : (row['DNI'] ? String(row['DNI']) : undefined),
                    email: row['email'] || row['Email'] || undefined,
                    phone: row['phone'] ? String(row['phone']) : (row['Telefono'] ? String(row['Telefono']) : ''),
                    gender: row['gender'] || row['Genero'] || 'OTHER',
                    dateOfBirth: row['dateOfBirth'] ? new Date(row['dateOfBirth']).toISOString() : (row['Fecha Nacimiento'] ? new Date(row['Fecha Nacimiento']).toISOString() : new Date().toISOString()),
                    address: row['address'] || row['Direccion'] || undefined,
                    insuranceProvider: row['insuranceProvider'] || row['Seguro'] || undefined,
                })

                const patientsToImport = jsonData.map(mapRowToPatient)

                if (patientsToImport.length === 0) {
                    toast({
                        title: 'Error',
                        description: 'El archivo está vacío o no tiene el formato correcto.',
                        variant: 'destructive'
                    })
                    return
                }

                await patientsAPI.import(patientsToImport)

                toast({
                    title: 'Éxito',
                    description: `${patientsToImport.length} pacientes importados correctamente.`,
                })
                refetch()
            } catch (error: any) {
                console.error('Error importing file:', error)
                toast({
                    title: 'Error',
                    description: 'Error al procesar el archivo. Verifique el formato.',
                    variant: 'destructive'
                })
            } finally {
                // Reset input
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }
        }
        reader.readAsArrayBuffer(file)
    }

    const handlePrint = () => {
        window.print()
    }

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
            CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        }
        return colors[status] || colors.ACTIVE
    }

    const getPriorityBadge = (priority: string) => {
        const colors: Record<string, string> = {
            HIGH: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        }
        return colors[priority] || colors.MEDIUM
    }

    const getLifeStageBadge = (stage: string) => {
        switch (stage?.toUpperCase()) {
            case 'NIÑO': return 'bg-sky-100 text-sky-800 border-sky-200'
            case 'ADOLESCENTE': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            case 'JOVEN': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
            case 'ADULTO': return 'bg-slate-100 text-slate-800 border-slate-200'
            case 'ADULTO_MAYOR': return 'bg-stone-100 text-stone-800 border-stone-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
                    <p className="text-muted-foreground">
                        Padrón Nominal y asegurados SIS • {filteredPatients.length} total
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleImport}>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar
                    </Button>
                    {hasPermission('PATIENTS_CREATE') && (
                        <Button onClick={handleAdd}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Paciente
                        </Button>
                    )}
                </div>
            </div>

            {/* Barra de acciones */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Búsqueda */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, correo, teléfono o ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                            <Filter className="h-4 w-4 mr-2" />
                            Filtros
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportPDF}>
                            <FileDown className="h-4 w-4 mr-2" />
                            PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportExcel}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir
                        </Button>
                    </div>
                </div>

                {/* Filtros avanzados */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t">
                        <Select value={filters.gender} onValueChange={(v) => setFilters({ ...filters, gender: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Género" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Géneros</SelectItem>
                                <SelectItem value="MALE">Masculino</SelectItem>
                                <SelectItem value="FEMALE">Femenino</SelectItem>
                                <SelectItem value="OTHER">Otro</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Estados</SelectItem>
                                <SelectItem value="ACTIVE">Activo</SelectItem>
                                <SelectItem value="INACTIVE">Inactivo</SelectItem>
                                <SelectItem value="CRITICAL">Crítico</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Prioridad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las Prioridades</SelectItem>
                                <SelectItem value="HIGH">Alta</SelectItem>
                                <SelectItem value="MEDIUM">Media</SelectItem>
                                <SelectItem value="LOW">Baja</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            type="number"
                            placeholder="Edad Mín"
                            value={filters.ageMin}
                            onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
                        />

                        <Input
                            type="number"
                            placeholder="Edad Máx"
                            value={filters.ageMax}
                            onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
                        />

                        <Select value={filters.insurance} onValueChange={(v) => setFilters({ ...filters, insurance: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seguro" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Seguros</SelectItem>
                                <SelectItem value="private">Con Seguro Privado</SelectItem>
                                <SelectItem value="public">Con Seguro Público</SelectItem>
                                <SelectItem value="none">Sin Seguro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </Card>

            {/* Tabla de pacientes */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Foto</TableHead>
                            <TableHead>Nombre Completo</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Datos Vitales</TableHead>
                            <TableHead>Seguro / Financiamiento</TableHead>
                            <TableHead>Prioridad</TableHead>
                            <TableHead>Última Visita</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPatients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                                    No se encontraron pacientes
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPatients.map((patient: any) => (
                                <TableRow key={patient.id} className="hover:bg-accent/50">
                                    <TableCell>
                                        <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 relative">
                                            {patient.photo && patient.photo.length > 10 ? (
                                                <img
                                                    src={patient.photo}
                                                    alt={`${patient.firstName}`}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`${patient.photo && patient.photo.length > 10 ? 'hidden' : ''} h-full w-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold absolute top-0 left-0`}>
                                                {patient.firstName?.[0]}{patient.lastName?.[0]}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{patient.firstName} {patient.lastName}</span>
                                            <span className="text-xs text-muted-foreground">{patient.phone || 'Sin teléfono'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-semibold">{patient.documentType || 'DNI'}</span>
                                            <span>{patient.documentNumber || 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="text-sm">{calculateAge(patient.dateOfBirth)} años ({patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : 'O'})</span>
                                            {patient.lifeStage && (
                                                <Badge variant="outline" className={`text-[10px] h-4 px-1.5 py-0 ${getLifeStageBadge(patient.lifeStage)}`}>
                                                    {patient.lifeStage.replace('_', ' ')}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="text-sm truncate w-[140px] font-medium" title={patient.insuranceProvider || 'Ninguno'}>
                                                {patient.insuranceProvider?.replace(/_/g, ' ') || 'Ninguno'}
                                            </span>
                                            {patient.insuranceProvider?.startsWith('SIS') ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] text-muted-foreground">{patient.sisCode || 'Sin código'}</span>
                                                    {patient.sisStatus === 'ACTIVO' || patient.sisStatus === 'ACTIVE' ? (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 bg-green-50 text-green-700 border-green-200">
                                                            ACTIVO
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 bg-red-50 text-red-700 border-red-200">
                                                            {patient.sisStatus || 'INACTIVO'}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground truncate w-[120px]">{patient.insuranceNumber || 'Sin Póliza'}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(getPatientPriority(patient))}`}>
                                            {getPatientPriority(patient) === 'HIGH' ? 'ALTA' :
                                                getPatientPriority(patient) === 'LOW' ? 'BAJA' : 'MEDIA'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {patient.createdAt ? format(new Date(patient.createdAt), 'MMM dd, yyyy', { locale: es }) : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(patient.status || 'ACTIVE')}`}>
                                            {({
                                                'ACTIVE': 'ACTIVO',
                                                'INACTIVE': 'INACTIVO',
                                                'CRITICAL': 'CRÍTICO'
                                            } as Record<string, string>)[patient.status || 'ACTIVE'] || patient.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewProfile(patient.id)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {hasPermission('PATIENTS_EDIT') && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(patient)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {hasPermission('PATIENTS_EDIT') && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEmergencyPatientId(patient.id)
                                                        setEmergencyModalOpen(true)
                                                    }}
                                                    className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                >
                                                    <AlertTriangle className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {hasPermission('PATIENTS_DELETE') && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteId(patient.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Modal de paciente */}
            <PatientModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                patient={selectedPatient}
                onSuccess={handleSuccess}
            />

            {/* Dialog de confirmación de eliminación */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el registro del paciente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <EmergencyModal
                open={emergencyModalOpen}
                onOpenChange={setEmergencyModalOpen}
                defaultPatientId={emergencyPatientId || undefined}
                onSuccess={() => {
                    refetch()
                    toast({
                        title: "Paciente enviado a Emergencia",
                        description: "Se ha creado el registro de emergencia exitosamente.",
                    })
                }}
            />

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
            />
        </div >
    )
}
