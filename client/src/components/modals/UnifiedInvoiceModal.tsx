import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { pharmacyAPI, billingAPI, patientsAPI, servicesCatalogAPI } from '@/services/api'
import {
    Loader2,
    Plus,
    Trash2,
    Receipt,
    FileText,
    CreditCard,
    Building2,
    Wallet,
    Banknote,
    Edit3,
    Check,
    X,
    User,
    ShoppingCart,
    DollarSign
} from 'lucide-react'
import { PAYMENT_METHODS, COMPANY_ACCOUNTS, formatCurrency } from '@/utils/financialUtils'
import QRCode from 'qrcode'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { useOrganization } from '@/contexts/OrganizationContext'

// Catalog data - same as POS
const CATALOG = {
    services: [
        { id: 'srv-1', name: 'Consulta Médica General', price: 50, type: 'SERVICIO' as const },
        { id: 'srv-2', name: 'Consulta Especializada', price: 80, type: 'SERVICIO' as const },
        { id: 'srv-3', name: 'Atención de Urgencia', price: 120, type: 'SERVICIO' as const },
        { id: 'srv-4', name: 'Teleconsulta', price: 40, type: 'SERVICIO' as const },
        { id: 'srv-5', name: 'Certificado Médico', price: 30, type: 'SERVICIO' as const },
    ],
    procedures: [
        { id: 'proc-1', name: 'Hemograma Completo', price: 25, type: 'PROCEDIMIENTO' as const },
        { id: 'proc-2', name: 'Radiografía de Tórax', price: 60, type: 'PROCEDIMIENTO' as const },
        { id: 'proc-3', name: 'Ecografía Abdominal', price: 90, type: 'PROCEDIMIENTO' as const },
        { id: 'proc-4', name: 'Curación de Herida Simple', price: 45, type: 'PROCEDIMIENTO' as const },
        { id: 'proc-5', name: 'Nebulización', price: 35, type: 'PROCEDIMIENTO' as const },
    ],
    medications: [
        { id: 'med-1', name: 'Paracetamol 500mg (Caja)', price: 5, type: 'MEDICAMENTO' as const },
        { id: 'med-2', name: 'Amoxicilina 500mg', price: 15, type: 'MEDICAMENTO' as const },
        { id: 'med-3', name: 'Ibuprofeno 400mg', price: 8, type: 'MEDICAMENTO' as const },
        { id: 'med-4', name: 'Suero Fisiológico', price: 12, type: 'MEDICAMENTO' as const },
        { id: 'med-5', name: 'Kit de Inyectables', price: 10, type: 'MEDICAMENTO' as const },
    ],
}

interface CatalogItem {
    id: string
    name: string
    price: number
    type: 'SERVICIO' | 'PROCEDIMIENTO' | 'MEDICAMENTO'
    stock?: number
    laboratory?: string
}

interface ManualItem {
    id: string
    description: string
    quantity: number
    unitPrice: number
}

const formSchema = z.object({
    patientId: z.string().min(1, 'Paciente requerido'),
    status: z.enum(['PENDING', 'PAID']),
    paymentMethod: z.string().optional(),
    destinationAccountId: z.string().optional(),
    operationNumber: z.string().optional(),
    discount: z.coerce.number().min(0).default(0),
    notes: z.string().optional(),
    invoiceDate: z.string().optional(),
    dueDate: z.string().optional(),
    doctorId: z.string().optional().nullable(),
    appointmentId: z.string().optional().nullable(),
})

type FormData = z.infer<typeof formSchema>

interface UnifiedInvoiceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    invoice?: any
    onSuccess: () => void
    initialData?: {
        patientId?: string
        serviceDescription?: string
        servicePrice?: number
        doctorName?: string
        doctorId?: string
        appointmentId?: string
    }
}

export function UnifiedInvoiceModal({ open, onOpenChange, invoice, onSuccess, initialData }: UnifiedInvoiceModalProps) {
    const { toast } = useToast()
    const { config } = useOrganization()
    const queryClient = useQueryClient()
    const { data: medsData, isLoading: isLoadingMeds } = useQuery({
        queryKey: ['pharmacy', 'medications'],
        queryFn: () => pharmacyAPI.getMedications()
    })

    const { data: servicesData, isLoading: isLoadingServices } = useQuery({
        queryKey: ['services-catalog'],
        queryFn: () => servicesCatalogAPI.getAll()
    })

    const realMedications = useMemo(() => {
        if (!medsData?.data) return CATALOG.medications;
        const apiMeds = Array.isArray(medsData.data) ? medsData.data : medsData.data.data || [];

        return apiMeds.map((med: any) => ({
            id: med.id,
            name: med.name,
            // Prioritize real price from DB, fallback to 10 for legacy/simulated feel
            price: Number(med.price) > 0 ? Number(med.price) : 10,
            type: 'MEDICAMENTO',
            stock: med.currentStock || med.stock || 0,
            laboratory: med.laboratory || med.manufacturer
        }));
    }, [medsData]);

    const realServices = useMemo(() => {
        if (!servicesData?.data) return { consultas: [], examenes: [], procedimientos: [] };
        const apiServices = Array.isArray(servicesData.data) ? servicesData.data : servicesData.data.data || [];

        const categorized = apiServices.reduce((acc: any, service: any) => {
            const item = {
                id: service.id,
                name: service.name,
                price: service.price,
                type: service.category,
                description: service.description
            };

            if (service.category === 'CONSULTA') acc.consultas.push(item);
            else if (service.category === 'EXAMEN') acc.examenes.push(item);
            else if (service.category === 'PROCEDIMIENTO') acc.procedimientos.push(item);

            return acc;
        }, { consultas: [], examenes: [], procedimientos: [] });

        return categorized;
    }, [servicesData]);

    const activeCatalog = useMemo(() => ({
        services: realServices.consultas,
        procedures: [...realServices.examenes, ...realServices.procedimientos],
        medications: realMedications.length > 0 ? realMedications : CATALOG.medications
    }), [realMedications]);
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Catalog selections
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [selectedProcedures, setSelectedProcedures] = useState<string[]>([])
    const [selectedMedications, setSelectedMedications] = useState<string[]>([])

    // Manual items
    const [manualItems, setManualItems] = useState<ManualItem[]>([])
    const [editingManualId, setEditingManualId] = useState<string | null>(null)
    const [manualItemForm, setManualItemForm] = useState({ description: '', quantity: 1, unitPrice: 0 })

    // QR Code for digital payments
    const [qrCodeUrl, setQrCodeUrl] = useState('')

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            patientId: '',
            status: 'PENDING',
            paymentMethod: PAYMENT_METHODS.CASH,
            destinationAccountId: '',
            operationNumber: '',
            discount: 0,
            notes: '',
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            doctorId: null,
            appointmentId: null,
        },
    })

    const watchStatus = form.watch('status')
    const watchPaymentMethod = form.watch('paymentMethod')

    // Load patients and handle edit mode
    useEffect(() => {
        if (open) {
            loadPatients()

            if (invoice) {
                // Restore Form Fields
                form.reset({
                    patientId: invoice.patient?.id || invoice.patientId || '',
                    status: invoice.status,
                    paymentMethod: invoice.paymentMethod || PAYMENT_METHODS.CASH,
                    destinationAccountId: invoice.destinationAccountId || '',
                    operationNumber: invoice.operationNumber || '',
                    discount: invoice.discount || 0,
                    notes: invoice.notes || '',
                    invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
                    doctorId: invoice.doctorId || null,
                    appointmentId: invoice.appointmentId || null,
                })

                // Restore Catalog Selections
                const newSelectedServices: string[] = []
                const newSelectedProcedures: string[] = []
                const newSelectedMedications: string[] = []
                const newManualItems: ManualItem[] = []

                if (Array.isArray(invoice.items)) {
                    invoice.items.forEach((item: any) => {
                        // Try to find in catalogs by name
                        const itemName = item.name || item.description
                        const srv = CATALOG.services.find(s => s.name === itemName)
                        const proc = CATALOG.procedures.find(p => p.name === itemName)
                        const med = CATALOG.medications.find(m => m.name === itemName)

                        if (srv) {
                            newSelectedServices.push(srv.id)
                        } else if (proc) {
                            newSelectedProcedures.push(proc.id)
                        } else if (med) {
                            newSelectedMedications.push(med.id)
                        } else {
                            // It's a manual item
                            newManualItems.push({
                                id: item._id || item.id || `manual-${Math.random()}`,
                                description: itemName,
                                quantity: Number(item.quantity) || 1,
                                unitPrice: Number(item.price || item.unitPrice) || 0
                            })
                        }
                    })
                }

                setSelectedServices(newSelectedServices)
                setSelectedProcedures(newSelectedProcedures)
                setSelectedMedications(newSelectedMedications)
                setManualItems(newManualItems)
            } else if (initialData) {
                // Initialize from Appointment Data
                setSelectedServices([])
                setSelectedProcedures([])
                setSelectedMedications([])

                const newManualItems: ManualItem[] = []
                if (initialData.serviceDescription) {
                    newManualItems.push({
                        id: `manual-${Math.random()}`,
                        description: initialData.serviceDescription,
                        quantity: 1,
                        unitPrice: initialData.servicePrice || 0
                    })
                }
                setManualItems(newManualItems)

                form.reset({
                    patientId: initialData.patientId || '',
                    status: 'PENDING',
                    paymentMethod: PAYMENT_METHODS.CASH,
                    destinationAccountId: '',
                    operationNumber: '',
                    discount: 0,
                    notes: initialData.doctorName ? `Atención: ${initialData.doctorName}` : '',
                    invoiceDate: new Date().toISOString().split('T')[0],
                    dueDate: '',
                    doctorId: initialData.doctorId || null,
                    appointmentId: initialData.appointmentId || null,
                })
            } else {
                // Reset for new invoice
                setSelectedServices([])
                setSelectedProcedures([])
                setSelectedMedications([])
                setManualItems([])
                setQrCodeUrl('')
                form.reset({
                    patientId: '',
                    status: 'PENDING',
                    paymentMethod: PAYMENT_METHODS.CASH,
                    destinationAccountId: '',
                    operationNumber: '',
                    discount: 0,
                    notes: '',
                    invoiceDate: new Date().toISOString().split('T')[0],
                    dueDate: '',
                    doctorId: null,
                    appointmentId: null,
                })
            }
        }
    }, [open, invoice, initialData])

    const loadPatients = async () => {
        try {
            const res = await patientsAPI.getAll()
            setPatients(Array.isArray(res.data) ? res.data : res.data?.data || [])
        } catch (error) {
            console.error(error)
            toast({ title: 'Error', description: 'No se pudieron cargar los pacientes', variant: 'destructive' })
        }
    }

    // Calculate totals
    const totals = useMemo(() => {
        const servicesTotal = activeCatalog.services
            .filter((s: CatalogItem) => selectedServices.includes(s.id))
            .reduce((sum: number, s: CatalogItem) => sum + s.price, 0)

        const proceduresTotal = activeCatalog.procedures
            .filter((p: CatalogItem) => selectedProcedures.includes(p.id))
            .reduce((sum: number, p: CatalogItem) => sum + p.price, 0)

        const medicationsTotal = activeCatalog.medications
            .filter((m: CatalogItem) => selectedMedications.includes(m.id))
            .reduce((sum: number, m: CatalogItem) => sum + m.price, 0)

        const manualTotal = manualItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

        const subtotal = servicesTotal + proceduresTotal + medicationsTotal + manualTotal
        const taxRate = (config?.billing?.taxRate || 18) / 100
        const tax = subtotal * taxRate
        const discount = form.watch('discount') || 0
        const total = subtotal + tax - discount

        return { subtotal, tax, total }
    }, [activeCatalog.services, activeCatalog.procedures, activeCatalog.medications, selectedServices, selectedProcedures, selectedMedications, manualItems, form.watch('discount'), config])

    // Toggle catalog item
    const toggleItem = (id: string, list: string[], setList: (items: string[]) => void) => {
        setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id])
    }

    // Add manual item
    const addManualItem = () => {
        if (!manualItemForm.description.trim()) {
            toast({ title: 'Error', description: 'Ingrese una descripción', variant: 'destructive' })
            return
        }
        const newItem: ManualItem = {
            id: `manual-${Date.now()}`,
            description: manualItemForm.description,
            quantity: manualItemForm.quantity,
            unitPrice: manualItemForm.unitPrice,
        }
        setManualItems([...manualItems, newItem])
        setManualItemForm({ description: '', quantity: 1, unitPrice: 0 })
    }

    // Edit manual item
    const updateManualItem = (id: string) => {
        setManualItems(manualItems.map(item =>
            item.id === id ? { ...item, ...manualItemForm } : item
        ))
        setEditingManualId(null)
        setManualItemForm({ description: '', quantity: 1, unitPrice: 0 })
    }

    // Remove manual item
    const removeManualItem = (id: string) => {
        setManualItems(manualItems.filter(item => item.id !== id))
    }

    // Generate QR for digital payments
    useEffect(() => {
        if (totals.total > 0 && watchStatus === 'PAID' && (watchPaymentMethod === PAYMENT_METHODS.YAPE || watchPaymentMethod === PAYMENT_METHODS.PLIN)) {
            generateQR()
        } else {
            setQrCodeUrl('')
        }
    }, [totals.total, watchStatus, watchPaymentMethod])

    const generateQR = async () => {
        try {
            const qrData = JSON.stringify({
                empresa: config?.hospitalName || 'EdiCarex Clinic SAC',
                ruc: config?.billing?.taxId || '20601234567',
                fecha: new Date().toISOString().split('T')[0],
                total: totals.total.toFixed(2),
                moneda: config?.billing?.currency || 'PEN',
                metodo: watchPaymentMethod,
            })
            const url = await QRCode.toDataURL(qrData, { width: 150, margin: 1 })
            setQrCodeUrl(url)
        } catch (err) {
            console.error(err)
        }
    }

    // Submit invoice
    const onSubmit = async (data: FormData) => {
        if (totals.total <= 0) {
            toast({ title: 'Error', description: 'Agregue al menos un ítem a la factura', variant: 'destructive' })
            return
        }

        setLoading(true)
        try {
            // Combine catalog and manual items with correct field names for backend
            const allItems = [
                ...activeCatalog.services.filter((s: CatalogItem) => selectedServices.includes(s.id)).map((s: CatalogItem) => ({
                    description: s.name,
                    unitPrice: s.price,
                    quantity: 1,
                    type: 'SERVICIO'
                })),
                ...activeCatalog.procedures.filter((p: CatalogItem) => selectedProcedures.includes(p.id)).map((p: CatalogItem) => ({
                    description: p.name,
                    unitPrice: p.price,
                    quantity: 1,
                    type: p.type || 'PROCEDIMIENTO' // Can be EXAMEN or PROCEDIMIENTO
                })),
                ...activeCatalog.medications.filter((m: CatalogItem) => selectedMedications.includes(m.id)).map((m: CatalogItem) => ({
                    description: m.name,
                    unitPrice: m.price,
                    quantity: 1,
                    type: 'MEDICAMENTO'
                })),
                ...manualItems.map(item => ({
                    description: item.description,
                    unitPrice: item.unitPrice,
                    quantity: item.quantity,
                    type: 'PERSONALIZADO'
                }))
            ]

            const invoiceData = {
                patientId: data.patientId,
                items: allItems,
                subtotal: totals.subtotal,
                tax: totals.tax,
                discount: data.discount,
                total: totals.total,
                status: data.status,
                paymentMethod: data.status === 'PAID' ? data.paymentMethod : null,
                paymentDate: data.status === 'PAID' ? (invoice?.paymentDate || new Date().toISOString()) : null,
                destinationAccountId: data.destinationAccountId || null,
                operationNumber: data.operationNumber || null,
                invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toISOString() : new Date().toISOString(),
                dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
                notes: data.notes || null,
                doctorId: data.doctorId || null,
                appointmentId: data.appointmentId || null,
                currency: config?.billing?.currency || 'PEN',
            }

            if (invoice) {
                await billingAPI.updateInvoice(invoice.id, invoiceData)
                toast({
                    title: 'Éxito',
                    description: data.status === 'PAID'
                        ? '✅ Factura pagada. Stock actualizado automáticamente.'
                        : 'Factura actualizada correctamente'
                })
            } else {
                await billingAPI.createInvoice(invoiceData)
                toast({
                    title: 'Éxito',
                    description: data.status === 'PAID'
                        ? '✅ Factura pagada. Stock reducido automáticamente.'
                        : 'Factura creada correctamente'
                })
            }

            // Invalidate pharmacy queries if invoice was paid (stock might have changed)
            if (data.status === 'PAID') {
                queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medications'] })
                queryClient.invalidateQueries({ queryKey: ['pharmacy'] })
            }

            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error(error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'No se pudo crear la factura',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1500px] h-[85vh] overflow-hidden p-0 bg-zinc-950 border border-zinc-800 text-white flex flex-col shadow-2xl shadow-emerald-900/20">
                {/* Professional Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Receipt className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-black text-white uppercase tracking-wide">
                                {invoice ? 'Editar Factura' : 'Nueva Factura'}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                                Sistema Unificado de Facturación
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg border border-zinc-700">
                            <User className="h-4 w-4 text-zinc-400" />
                            <span className="text-xs font-medium text-zinc-300">
                                {form.watch('patientId') ? patients.find(p => p.id === form.watch('patientId'))?.firstName : 'Seleccionar Cliente'}
                            </span>
                        </div>
                        <div className="h-6 w-px bg-zinc-800"></div>
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                            <span className="text-emerald-400 text-xs font-bold pulse">EN PROCESO</span>
                        </div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 min-h-0 flex flex-col">
                        <div className="flex flex-1 overflow-hidden">
                            {/* LEFT COLUMN: Configuration (20%) */}
                            <div className="w-[280px] bg-zinc-900/30 border-r border-zinc-800 flex flex-col shrink-0">
                                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <Edit3 className="h-3 w-3" /> Configuración
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                                    <FormField
                                        control={form.control}
                                        name="patientId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-400 font-bold uppercase text-[10px]">Paciente</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 bg-zinc-950 border-zinc-800 text-white rounded-md text-xs">
                                                            <SelectValue placeholder="Seleccionar..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                        {patients.map((p) => (
                                                            <SelectItem key={p.id} value={p.id} className="text-xs">
                                                                {p.firstName} {p.lastName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-3">
                                        <FormField
                                            control={form.control}
                                            name="invoiceDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-zinc-400 font-bold uppercase text-[10px]">Emisión</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} className="bg-zinc-950 border-zinc-800 text-white h-9 text-xs" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="dueDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-zinc-400 font-bold uppercase text-[10px]">Vencimiento</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} className="bg-zinc-950 border-zinc-800 text-white h-9 text-xs" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-400 font-bold uppercase text-[10px]">Estado</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 bg-zinc-950 border-zinc-800 text-white rounded-md text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                        <SelectItem value="PENDING" className="text-xs">⏳ Pendiente</SelectItem>
                                                        <SelectItem value="PAID" className="text-xs">✅ Pagado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-400 font-bold uppercase text-[10px]">Notas Internas</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} placeholder="..." className="bg-zinc-950 border-zinc-800 text-white min-h-[100px] text-xs resize-none" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* MIDDLE COLUMN: Catalog (45%) */}
                            <div className="flex-1 flex flex-col min-w-0 bg-black">
                                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <ShoppingCart className="h-3 w-3" /> Catálogo de Servicios
                                    </h3>
                                    <div className="flex gap-2">
                                        <div className="h-2 w-2 rounded-full bg-cyan-500"></div><span className="text-[10px] text-zinc-500 font-bold">MED</span>
                                        <div className="h-2 w-2 rounded-full bg-purple-500"></div><span className="text-[10px] text-zinc-500 font-bold">PROC</span>
                                        <div className="h-2 w-2 rounded-full bg-amber-500"></div><span className="text-[10px] text-zinc-500 font-bold">FARM</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                                    {/* Services */}
                                    <div>
                                        <h4 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-3 opacity-80">Servicios Médicos</h4>
                                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                                            {activeCatalog.services.map((item: CatalogItem) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => toggleItem(item.id, selectedServices, setSelectedServices)}
                                                    className={cn(
                                                        "group relative p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                                                        selectedServices.includes(item.id)
                                                            ? "bg-cyan-950/30 border-cyan-500/50 shadow-lg shadow-cyan-900/20"
                                                            : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={cn("text-xs font-bold line-clamp-2", selectedServices.includes(item.id) ? "text-cyan-200" : "text-zinc-300")}>{item.name}</span>
                                                        {selectedServices.includes(item.id) && <Check className="h-3 w-3 text-cyan-400 shrink-0" />}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={cn("text-sm font-black font-mono", selectedServices.includes(item.id) ? "text-cyan-400" : "text-zinc-500")}>{formatCurrency(item.price, config)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Procedures */}
                                    <div>
                                        <h4 className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-3 opacity-80">Exámenes y Procedimientos</h4>
                                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                                            {activeCatalog.procedures.map((item: CatalogItem) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => toggleItem(item.id, selectedProcedures, setSelectedProcedures)}
                                                    className={cn(
                                                        "group relative p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                                                        selectedProcedures.includes(item.id)
                                                            ? "bg-purple-950/30 border-purple-500/50 shadow-lg shadow-purple-900/20"
                                                            : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={cn("text-xs font-bold line-clamp-2", selectedProcedures.includes(item.id) ? "text-purple-200" : "text-zinc-300")}>{item.name}</span>
                                                        {selectedProcedures.includes(item.id) && <Check className="h-3 w-3 text-purple-400 shrink-0" />}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={cn("text-sm font-black font-mono", selectedProcedures.includes(item.id) ? "text-purple-400" : "text-zinc-500")}>{formatCurrency(item.price, config)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pharmacy */}
                                    <div>
                                        <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3 opacity-80">Farmacia</h4>
                                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                                            {activeCatalog.medications.map((item: CatalogItem) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => (item.stock ?? 0) > 0 && toggleItem(item.id, selectedMedications, setSelectedMedications)}
                                                    className={cn(
                                                        "group relative p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                                                        selectedMedications.includes(item.id)
                                                            ? "bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-900/20"
                                                            : (item.stock ?? 0) === 0 ? "opacity-50 cursor-not-allowed bg-zinc-900/20 border-zinc-800" : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={cn("text-xs font-bold line-clamp-2", selectedMedications.includes(item.id) ? "text-amber-200" : "text-zinc-300")}>{item.name}</span>
                                                        {selectedMedications.includes(item.id) && <Check className="h-3 w-3 text-amber-400 shrink-0" />}
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", (item.stock ?? 0) > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                                                            {(item.stock ?? 0) > 0 ? `Stock: ${item.stock}` : 'Agotado'}
                                                        </span>
                                                        <span className={cn("text-sm font-black font-mono", selectedMedications.includes(item.id) ? "text-amber-400" : "text-zinc-500")}>{formatCurrency(item.price, config)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Manual Item Add Form */}
                                    <div className="pt-6 border-t border-zinc-800">
                                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3 opacity-80">Item Personalizado</h4>
                                        <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 flex gap-2">
                                            <Input
                                                placeholder="Descripción..."
                                                value={manualItemForm.description}
                                                onChange={(e) => setManualItemForm({ ...manualItemForm, description: e.target.value })}
                                                className="bg-black border-zinc-700 h-9 text-xs"
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Cant"
                                                value={manualItemForm.quantity}
                                                onChange={(e) => setManualItemForm({ ...manualItemForm, quantity: Number(e.target.value) })}
                                                className="w-16 bg-black border-zinc-700 h-9 text-xs"
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Precio"
                                                value={manualItemForm.unitPrice}
                                                onChange={(e) => setManualItemForm({ ...manualItemForm, unitPrice: Number(e.target.value) })}
                                                className="w-20 bg-black border-zinc-700 h-9 text-xs"
                                            />
                                            {editingManualId ? (
                                                <div className="flex gap-1">
                                                    <Button type="button" onClick={() => updateManualItem(editingManualId)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 h-9 w-9 p-0">
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button type="button" onClick={() => { setEditingManualId(null); setManualItemForm({ description: '', quantity: 1, unitPrice: 0 }) }} size="sm" className="bg-zinc-700 hover:bg-zinc-600 h-9 w-9 p-0">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button type="button" onClick={addManualItem} size="sm" className="bg-blue-600 hover:bg-blue-500 h-9 w-9 p-0">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Cart & Summary (35%) */}
                            <div className="w-[380px] bg-zinc-900/30 border-l border-zinc-800 flex flex-col shrink-0 relative shadow-2xl">
                                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <Receipt className="h-3 w-3" /> Resumen de Orden
                                    </h3>
                                    <div className="text-xs font-mono text-zinc-500">
                                        {selectedServices.length + selectedProcedures.length + selectedMedications.length + manualItems.length} items
                                    </div>
                                </div>

                                {/* Cart Items List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-black/20">
                                    {/* Mapped Services */}
                                    {activeCatalog.services.filter((s: CatalogItem) => selectedServices.includes(s.id)).map((item: CatalogItem) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg group hover:border-cyan-500/30 transition-colors">
                                            <div>
                                                <p className="text-xs font-bold text-zinc-300">{item.name}</p>
                                                <span className="text-[10px] text-cyan-500 font-bold uppercase">Servicio</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-mono text-white">{formatCurrency(item.price, config)}</span>
                                                <button type="button" onClick={() => toggleItem(item.id, selectedServices, setSelectedServices)} className="text-zinc-600 hover:text-red-500 transition-colors">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Mapped Procedures */}
                                    {activeCatalog.procedures.filter((p: CatalogItem) => selectedProcedures.includes(p.id)).map((item: CatalogItem) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg group hover:border-purple-500/30 transition-colors">
                                            <div>
                                                <p className="text-xs font-bold text-zinc-300">{item.name}</p>
                                                <span className="text-[10px] text-purple-500 font-bold uppercase">Procedimiento</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-mono text-white">{formatCurrency(item.price, config)}</span>
                                                <button type="button" onClick={() => toggleItem(item.id, selectedProcedures, setSelectedProcedures)} className="text-zinc-600 hover:text-red-500 transition-colors">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Mapped Medications */}
                                    {activeCatalog.medications.filter((m: CatalogItem) => selectedMedications.includes(m.id)).map((item: CatalogItem) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg group hover:border-amber-500/30 transition-colors">
                                            <div>
                                                <p className="text-xs font-bold text-zinc-300">{item.name}</p>
                                                <span className="text-[10px] text-amber-500 font-bold uppercase">Farmacia</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-mono text-white">{formatCurrency(item.price, config)}</span>
                                                <button type="button" onClick={() => toggleItem(item.id, selectedMedications, setSelectedMedications)} className="text-zinc-600 hover:text-red-500 transition-colors">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Manual Items */}
                                    {manualItems.map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-3 bg-zinc-900/50 border border-blue-900/30 rounded-lg group hover:border-blue-500/30 transition-colors">
                                            <div>
                                                <p className="text-xs font-bold text-zinc-300">{item.description}</p>
                                                <span className="text-[10px] text-blue-500 font-bold uppercase">Personalizado ({item.quantity})</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-mono text-white">{formatCurrency(item.quantity * item.unitPrice, config)}</span>
                                                <div className="flex gap-1">
                                                    <button type="button" onClick={() => { setEditingManualId(item.id); setManualItemForm({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice }) }} className="text-zinc-600 hover:text-blue-500 transition-colors">
                                                        <Edit3 className="h-3 w-3" />
                                                    </button>
                                                    <button type="button" onClick={() => removeManualItem(item.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {(selectedServices.length + selectedProcedures.length + selectedMedications.length + manualItems.length) === 0 && (
                                        <div className="h-40 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800/50 rounded-xl m-2">
                                            <ShoppingCart className="h-6 w-6 mb-2 opacity-50" />
                                            <p className="text-xs font-medium">Carrito vacío</p>
                                        </div>
                                    )}
                                </div>

                                {/* Financial Summary Footer */}
                                <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-xs text-zinc-400">
                                            <span>Subtotal</span>
                                            <span className="font-mono">{formatCurrency(totals.subtotal, config)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-zinc-400">
                                            <span>{config?.billing?.taxLabel || 'IGV'} ({config?.billing?.taxRate || 18}%)</span>
                                            <span className="font-mono">{formatCurrency(totals.tax, config)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-zinc-400">
                                            <span>Descuento</span>
                                            <FormField
                                                control={form.control}
                                                name="discount"
                                                render={({ field }) => (
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                        className="w-20 h-7 bg-zinc-950 border-zinc-700 text-right text-[10px] text-white"
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-baseline mb-4 p-3 bg-black rounded-lg border border-zinc-800">
                                        <span className="text-sm font-black text-white uppercase">Total</span>
                                        <span className="text-2xl font-black text-emerald-500 font-mono">{formatCurrency(totals.total, config)}</span>
                                    </div>

                                    {/* Payment Method Selector (Only visible if PAID) */}
                                    {watchStatus === 'PAID' && (
                                        <div className="mb-4 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-lg">
                                                <FormField
                                                    control={form.control}
                                                    name="paymentMethod"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-[10px] font-bold text-emerald-500 uppercase">Método de Pago</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-8 bg-zinc-950 border-emerald-900/30 text-white text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                                    {Object.values(PAYMENT_METHODS).map((method) => (
                                                                        <SelectItem key={method} value={method} className="text-xs">
                                                                            {method === PAYMENT_METHODS.CASH ? '💵 ' :
                                                                                method.includes('Tarjeta') ? '💳 ' :
                                                                                    method.includes('Transferencia') ? '🏦 ' :
                                                                                        method === PAYMENT_METHODS.YAPE || method === PAYMENT_METHODS.PLIN ? '📱 ' : '📋 '}
                                                                            {method}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Payment Context Display (Logos/QR) */}
                                            <div className="bg-black/50 rounded-lg border border-zinc-800 p-3 mt-2">
                                                {qrCodeUrl ? (
                                                    <div className="flex flex-col items-center animate-in fade-in zoom-in py-2">
                                                        <div className="bg-white p-2 rounded-lg mb-2 shadow-lg">
                                                            <img src={qrCodeUrl} className="w-24 h-24 mix-blend-multiply" alt="QR" />
                                                        </div>
                                                        <p className="text-emerald-400 text-[10px] font-bold uppercase text-center tracking-wider">{watchPaymentMethod}</p>
                                                    </div>
                                                ) : watchPaymentMethod?.includes('Transferencia') ? (
                                                    <div className="space-y-2">
                                                        {COMPANY_ACCOUNTS.filter(acc => watchPaymentMethod.includes(acc.bank)).map(acc => (
                                                            <div key={acc.id} className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-white font-bold text-xs">{acc.bank}</span>
                                                                    <span className="text-zinc-500 text-[9px] uppercase font-bold">{acc.currency}</span>
                                                                </div>
                                                                <p className="text-zinc-300 font-mono text-xs mb-0.5 tracking-tight">{acc.number}</p>
                                                                <p className="text-zinc-600 font-mono text-[9px]">CCI: {acc.cci}</p>
                                                            </div>
                                                        ))}
                                                        {COMPANY_ACCOUNTS.filter(acc => watchPaymentMethod.includes(acc.bank)).length === 0 && (
                                                            <div className="text-center py-4 text-zinc-500 text-xs">
                                                                Seleccione un banco para ver los detalles
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4 opacity-70">
                                                        {watchPaymentMethod === PAYMENT_METHODS.CASH ? (
                                                            <div className="flex flex-col items-center">
                                                                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                                                                    <Banknote className="h-5 w-5 text-emerald-500" />
                                                                </div>
                                                                <p className="text-emerald-500 text-xs font-bold uppercase">Cobro en Efectivo</p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center">
                                                                <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center mb-2">
                                                                    <CreditCard className="h-5 w-5 text-indigo-500" />
                                                                </div>
                                                                <p className="text-indigo-500 text-xs font-bold uppercase">Usar Terminal POS</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="operationNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input {...field} placeholder="N° Operación / Referencia (Opcional)" className="h-8 bg-zinc-950 border-zinc-800 text-white text-xs" />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={loading || totals.total <= 0}
                                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider text-xs shadow-lg shadow-emerald-900/20"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4 mr-2" />}
                                        {invoice ? 'Guardar Cambios' : 'Emitir Factura'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}