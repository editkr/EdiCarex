import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogHeader,
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
import { billingAPI, patientsAPI } from '@/services/api'
import { Loader2, Plus, Trash2, CreditCard, Building2, Wallet, Banknote, FileText } from 'lucide-react'
import { PAYMENT_METHODS, COMPANY_ACCOUNTS, formatCurrency } from '@/utils/financialUtils'
import { useOrganization } from '@/contexts/OrganizationContext'

// Schema for invoice items
const invoiceItemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.coerce.number().min(0, 'Price cannot be negative'),
})

const invoiceSchema = z.object({
    patientId: z.string().min(1, 'Patient is required'),
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    invoiceDate: z.string().min(1, 'Date is required'),
    dueDate: z.string().optional(),
    status: z.string().default('PENDING'),
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
    tax: z.coerce.number().min(0).default(0),
    discount: z.coerce.number().min(0).default(0),
    notes: z.string().optional(),
    // New Advanced Payment Fields
    paymentMethod: z.string().optional(),
    destinationAccountId: z.string().optional(),
    operationNumber: z.string().optional(),
    paymentDate: z.string().optional(),
}).refine((data) => {
    if (data.status === 'PAID') {
        return !!data.paymentMethod && !!data.paymentDate;
    }
    return true;
}, {
    message: "Payment method and date are required for PAID invoices",
    path: ["paymentMethod"]
});

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    invoice?: any
    onSuccess: () => void
    readOnly?: boolean
}

export default function InvoiceModal({
    open,
    onOpenChange,
    invoice,
    onSuccess,
    readOnly = false,
}: InvoiceModalProps) {
    const { config } = useOrganization()
    const { toast } = useToast()
    const [patients, setPatients] = useState<any[]>([])
    const [loadingPatients, setLoadingPatients] = useState(false)

    const form = useForm<InvoiceFormData>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            patientId: '',
            invoiceNumber: '',
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            status: 'PENDING',
            items: [{ description: '', quantity: 1, unitPrice: 0 }],
            tax: 0,
            discount: 0,
            notes: '',
            paymentMethod: '',
            destinationAccountId: '',
            operationNumber: '',
            paymentDate: new Date().toISOString().split('T')[0],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    })

    const watchStatus = form.watch('status');
    const watchPaymentMethod = form.watch('paymentMethod');

    // Filter accounts based on selected payment method
    const filteredAccounts = COMPANY_ACCOUNTS.filter(acc => {
        if (!watchPaymentMethod) return true;
        if (acc.type === 'Efectivo' && watchPaymentMethod === PAYMENT_METHODS.CASH) return true;
        if (watchPaymentMethod.includes(acc.bank)) return true;
        return false;
    });

    useEffect(() => {
        if (open) {
            loadPatients()
            if (invoice) {
                // If editing, map existing data
                form.reset({
                    patientId: invoice.patientId,
                    invoiceNumber: invoice.invoiceNumber,
                    invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : '',
                    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
                    status: invoice.status,
                    items: invoice.items && invoice.items.length > 0 ? invoice.items.map((i: any) => ({
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: Number(i.unitPrice),
                    })) : [{ description: '', quantity: 1, unitPrice: 0 }],
                    tax: Number(invoice.tax || 0),
                    discount: Number(invoice.discount || 0),
                    notes: invoice.notes || '',
                    paymentMethod: invoice.paymentMethod || '',
                    destinationAccountId: invoice.destinationAccountId || '',
                    operationNumber: invoice.operationNumber || '',
                    paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate).toISOString().split('T')[0] : '',
                })
            } else {
                // Generate a temporary invoice number using organization prefix
                const prefix = config?.billing?.invoicePrefix || 'INV'
                const tempInvoiceNum = `${prefix}-${Date.now().toString().slice(-6)}`
                form.reset({
                    patientId: '',
                    invoiceNumber: tempInvoiceNum,
                    invoiceDate: new Date().toISOString().split('T')[0],
                    dueDate: '',
                    status: 'PENDING',
                    items: [{ description: '', quantity: 1, unitPrice: 0 }],
                    tax: 0,
                    discount: 0,
                    notes: '',
                    paymentMethod: '',
                    destinationAccountId: '',
                    operationNumber: '',
                    paymentDate: new Date().toISOString().split('T')[0],
                })
            }
        }
    }, [open, invoice, form])

    const loadPatients = async () => {
        try {
            setLoadingPatients(true)
            const response = await patientsAPI.getAll()
            setPatients(response.data.data || [])
        } catch (error) {
            console.error('Failed to load patients', error)
        } finally {
            setLoadingPatients(false)
        }
    }

    const calculateSubtotal = (items: any[]) => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
    }

    const watchItems = form.watch('items')
    const watchTax = form.watch('tax')
    const watchDiscount = form.watch('discount')
    const subtotal = calculateSubtotal(watchItems)
    const total = subtotal + watchTax - watchDiscount

    const onSubmit = async (data: InvoiceFormData) => {
        try {
            const formattedData = {
                ...data,
                invoiceDate: new Date(data.invoiceDate).toISOString(),
                dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
                paymentDate: data.paymentDate ? new Date(data.paymentDate).toISOString() : null,
                subtotal: subtotal,
                total: total,
            }

            if (invoice) {
                await billingAPI.updateInvoice(invoice.id, formattedData)
                toast({
                    title: 'Success',
                    description: 'Invoice updated successfully',
                })
            } else {
                await billingAPI.createInvoice(formattedData)
                toast({
                    title: 'Success',
                    description: 'Invoice created successfully',
                })
            }
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-zinc-950 border border-zinc-800 text-white overflow-hidden">
                {/* Professional Header */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-950/50 to-zinc-900 border-b border-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-white uppercase tracking-wide">
                                {readOnly ? 'Detalles de Factura' : (invoice ? 'Editar Factura' : 'Nueva Factura')}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400 text-xs uppercase tracking-widest font-semibold">
                                {readOnly
                                    ? 'Visualización de detalles de la factura'
                                    : (invoice ? 'Actualizar información de facturación' : 'Crear factura personalizada para un paciente')}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-950">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">

                            {/* 🔷 INFORMACIÓN GENERAL */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Información General</h3>
                                </div>
                                <fieldset disabled={readOnly} className="grid grid-cols-1 md:grid-cols-3 gap-4 disabled:opacity-90">
                                    <FormField
                                        control={form.control}
                                        name="patientId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-400 font-bold uppercase text-xs tracking-wider">Paciente</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white h-10 rounded-xl disabled:opacity-100 disabled:cursor-default focus:ring-blue-600 focus:border-blue-600">
                                                            <SelectValue placeholder="Seleccione paciente" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                        {patients.map((p) => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                {p.firstName} {p.lastName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="invoiceNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-400 font-bold uppercase text-xs tracking-wider">Factura #</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="INV-001" {...field} className="bg-zinc-900 border-zinc-800 text-white rounded-xl disabled:opacity-100 disabled:cursor-default focus:ring-blue-600 focus:border-blue-600" disabled={readOnly} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-400 font-bold uppercase text-xs tracking-wider">Estado</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white h-10 rounded-xl disabled:opacity-100 disabled:cursor-default focus:ring-blue-600 focus:border-blue-600">
                                                            <SelectValue placeholder="Estado" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                        <SelectItem value="PENDING">Pendiente</SelectItem>
                                                        <SelectItem value="PAID">Pagado</SelectItem>
                                                        <SelectItem value="OVERDUE">Vencido</SelectItem>
                                                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </fieldset>
                            </div>

                            {/* Advanced Payment Section - Only if PAID or PENDING (for edition) */}
                            {(watchStatus === 'PAID' || watchStatus === 'PENDING') && (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2">
                                        <Wallet className="h-4 w-4" />
                                        Detalles de Pago
                                    </h3>
                                    <fieldset disabled={readOnly} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="paymentMethod"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-zinc-400 text-xs">Método de Pago</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-9 focus:ring-emerald-600 focus:border-emerald-600">
                                                                <SelectValue placeholder="Seleccione método" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                            {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                                                                <SelectItem key={key} value={value}>{value}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="paymentDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-zinc-400 text-xs">Fecha de Pago</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} className="bg-zinc-950 border-zinc-800 text-white h-9 focus:ring-emerald-600 focus:border-emerald-600" disabled={readOnly} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {watchPaymentMethod && watchPaymentMethod !== 'Efectivo' && (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="destinationAccountId"
                                                    render={({ field }) => (
                                                        <FormItem className="md:col-span-2">
                                                            <FormLabel className="text-zinc-400 text-xs">Cuenta de Destino (Empresa)</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
                                                                <FormControl>
                                                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-9 focus:ring-emerald-600 focus:border-emerald-600">
                                                                        <SelectValue placeholder="Seleccione cuenta de destino" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                                    {filteredAccounts.map(acc => (
                                                                        <SelectItem key={acc.id} value={acc.id}>
                                                                            <span className="flex items-center gap-2">
                                                                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                                                                {acc.alias} ({acc.bank} - {acc.currency})
                                                                            </span>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="operationNumber"
                                                    render={({ field }) => (
                                                        <FormItem className="md:col-span-2">
                                                            <FormLabel className="text-zinc-400 text-xs">Nro. de Operación / Constancia</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Ej. 12345678" {...field} className="bg-zinc-950 border-zinc-800 text-white h-9 focus:ring-emerald-600 focus:border-emerald-600" disabled={readOnly} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        )}
                                    </fieldset>
                                </div>
                            )}

                            <fieldset disabled={readOnly} className="grid grid-cols-1 md:grid-cols-2 gap-4 disabled:opacity-90">
                                <FormField
                                    control={form.control}
                                    name="invoiceDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-zinc-400 font-bold uppercase text-xs tracking-wider">Fecha Emisión</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="bg-zinc-900 border-zinc-800 text-white rounded-xl disabled:opacity-100 disabled:cursor-default focus:ring-emerald-600 focus:border-emerald-600" disabled={readOnly} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dueDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-zinc-400 font-bold uppercase text-xs tracking-wider">Vencimiento (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="bg-zinc-900 border-zinc-800 text-white rounded-xl disabled:opacity-100 disabled:cursor-default focus:ring-emerald-600 focus:border-emerald-600" disabled={readOnly} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </fieldset>

                            {/* Items Section */}
                            <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900">
                                <h3 className="font-bold mb-3 text-white uppercase text-sm tracking-widest">Items de Factura</h3>
                                <div className="space-y-3">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-end">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.description`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel className={`text-zinc-400 text-xs uppercase ${index !== 0 ? "sr-only" : ""}`}>Descripción</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Servicio o Ítem" {...field} className="bg-zinc-950 border-zinc-800 text-white rounded-lg h-9 disabled:opacity-100 disabled:cursor-default focus:ring-emerald-600 focus:border-emerald-600" disabled={readOnly} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem className="w-24">
                                                        <FormLabel className={`text-zinc-400 text-xs uppercase ${index !== 0 ? "sr-only" : ""}`}>Cant.</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" min="1" {...field} className="bg-zinc-950 border-zinc-800 text-white rounded-lg h-9 disabled:opacity-100 disabled:cursor-default focus:ring-emerald-600 focus:border-emerald-600" disabled={readOnly} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.unitPrice`}
                                                render={({ field }) => (
                                                    <FormItem className="w-32">
                                                        <FormLabel className={`text-zinc-400 text-xs uppercase ${index !== 0 ? "sr-only" : ""}`}>Precio</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" min="0" step="0.01" {...field} className="bg-zinc-950 border-zinc-800 text-white rounded-lg h-9 disabled:opacity-100 disabled:cursor-default focus:ring-emerald-600 focus:border-emerald-600" disabled={readOnly} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            {!readOnly && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-400 hover:bg-zinc-800 h-9 w-9 rounded-lg"
                                                    onClick={() => remove(index)}
                                                    disabled={fields.length === 1}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {!readOnly && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-4 border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider"
                                        onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                                    >
                                        <Plus className="h-3 w-3 mr-2" />
                                        Agregar Item
                                    </Button>
                                )}
                            </div>

                            {/* Totals Section */}
                            <div className="flex flex-col items-end gap-2">
                                <div className="w-full md:w-1/3 space-y-2 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                    <div className="flex justify-between items-center text-sm text-zinc-300">
                                        <span>Subtotal:</span>
                                        <span className="font-medium text-white">{formatCurrency(subtotal, config)}</span>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="tax"
                                        render={({ field }) => (
                                            <FormItem className="flex justify-between items-center gap-4 space-y-0">
                                                <FormLabel className="whitespace-nowrap text-zinc-300 font-normal">Impuesto</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" step="0.01" className="text-right w-24 h-8 bg-zinc-950 border-zinc-800 text-white disabled:opacity-100 disabled:cursor-default focus:ring-emerald-600 focus:border-emerald-600" {...field} disabled={readOnly} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="discount"
                                        render={({ field }) => (
                                            <FormItem className="flex justify-between items-center gap-4 space-y-0">
                                                <FormLabel className="whitespace-nowrap text-zinc-300 font-normal">Descuento</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" step="0.01" className="text-right w-24 h-8 bg-zinc-950 border-zinc-800 text-white disabled:opacity-100 disabled:cursor-default focus:ring-emerald-600 focus:border-emerald-600" {...field} disabled={readOnly} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-between items-center text-lg font-bold border-t border-zinc-800 pt-2 mt-2">
                                        <span className="text-white">Total:</span>
                                        <span className="text-emerald-400">{formatCurrency(total, config)}</span>
                                    </div>
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-zinc-400 font-bold uppercase text-xs tracking-wider">Notas</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Instrucciones de pago o notas adicionales..." {...field} className="bg-zinc-900 border-zinc-800 text-white rounded-xl disabled:opacity-100 disabled:cursor-default focus:ring-emerald-600 focus:border-emerald-600" disabled={readOnly} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800 rounded-xl"
                                >
                                    {readOnly ? 'Cerrar' : 'Cancelar'}
                                </Button>
                                {!readOnly && (
                                    <Button type="submit" disabled={form.formState.isSubmitting || loadingPatients} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                                        {form.formState.isSubmitting && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {invoice ? 'Guardar Cambios' : 'Crear Factura'}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
