import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { billingAPI, patientsAPI } from '@/services/api'
import { Receipt, Search, Plus, Trash2, QrCode, Loader2, DollarSign, Wallet, CreditCard, Building2, Banknote, User } from 'lucide-react'
import QRCode from 'qrcode'
import { cn } from '@/lib/utils'
import { formatCurrency, PAYMENT_METHODS, COMPANY_ACCOUNTS } from '@/utils/financialUtils'
import { useOrganization } from '@/contexts/OrganizationContext'

interface InvoiceGeneratorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

// Catálogo de Servicios Médicos
// TODO: Idealmente esto vendría de una API /settings/catalog
const CATALOG = {
    services: [
        { id: 'S001', name: 'Consulta Médica General', price: 50.00 },
        { id: 'S002', name: 'Consulta Especializada', price: 80.00 },
        { id: 'S003', name: 'Atención de Urgencia', price: 120.00 },
        { id: 'S004', name: 'Teleconsulta', price: 40.00 },
        { id: 'S005', name: 'Certificado Médico', price: 30.00 },
    ],
    procedures: [
        { id: 'P001', name: 'Hemograma Completo', price: 25.00 },
        { id: 'P002', name: 'Radiografía de Tórax', price: 60.00 },
        { id: 'P003', name: 'Ecografía Abdominal', price: 90.00 },
        { id: 'P004', name: 'Curación de Herida Simple', price: 45.00 },
        { id: 'P005', name: 'Nebulización', price: 35.00 },
    ],
    medications: [
        { id: 'M001', name: 'Paracetamol 500mg (Caja)', price: 5.00 },
        { id: 'M002', name: 'Amoxicilina 500mg', price: 15.00 },
        { id: 'M003', name: 'Ibuprofeno 400mg', price: 8.00 },
        { id: 'M004', name: 'Suero Fisiológico', price: 12.00 },
        { id: 'M005', name: 'Kit de Inyectables', price: 10.00 },
    ]
}

export default function InvoiceGeneratorModal({ open, onOpenChange, onSuccess }: InvoiceGeneratorProps) {
    const { toast } = useToast()
    const { config } = useOrganization()
    const [loading, setLoading] = useState(false)
    const [patients, setPatients] = useState<any[]>([])
    const [qrCodeUrl, setQrCodeUrl] = useState('')

    // Form State
    const [selectedPatientId, setSelectedPatientId] = useState('')
    const [discount, setDiscount] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS.CASH)

    // Selection Arrays
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [selectedProcedures, setSelectedProcedures] = useState<string[]>([])
    const [selectedMedications, setSelectedMedications] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            loadPatients()
            // Reset state
            setSelectedServices([])
            setSelectedProcedures([])
            setSelectedMedications([])
            setDiscount(0)
            setSelectedPatientId('')
            setQrCodeUrl('')
            setPaymentMethod(PAYMENT_METHODS.CASH)
        }
    }, [open])

    const loadPatients = async () => {
        try {
            const res = await patientsAPI.getAll()
            setPatients(Array.isArray(res.data) ? res.data : res.data?.data || [])
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "No se pudieron cargar los pacientes", variant: "destructive" })
        }
    }

    const totals = useMemo(() => {
        const servicesTotal = CATALOG.services
            .filter(s => selectedServices.includes(s.id))
            .reduce((sum, s) => sum + s.price, 0)

        const proceduresTotal = CATALOG.procedures
            .filter(p => selectedProcedures.includes(p.id))
            .reduce((sum, p) => sum + p.price, 0)

        const medicationsTotal = CATALOG.medications
            .filter(m => selectedMedications.includes(m.id))
            .reduce((sum, m) => sum + m.price, 0)

        const subtotal = servicesTotal + proceduresTotal + medicationsTotal
        const taxRate = (config?.billing?.taxRate || 18) / 100
        const tax = subtotal * taxRate
        const total = subtotal + tax - discount

        return { subtotal, tax, total }
    }, [selectedServices, selectedProcedures, selectedMedications, discount, config])

    useEffect(() => {
        if (totals.total > 0 && selectedPatientId && (paymentMethod === PAYMENT_METHODS.YAPE || paymentMethod === PAYMENT_METHODS.PLIN)) {
            generateQR()
        } else {
            setQrCodeUrl('')
        }
    }, [totals.total, selectedPatientId, paymentMethod])

    const generateQR = async () => {
        try {
            const qrData = JSON.stringify({
                empresa: config?.hospitalName || 'EdiCarex Clinic SAC',
                ruc: "20601234567",
                fecha: new Date().toISOString().split('T')[0],
                total: totals.total.toFixed(2),
                moneda: config?.billing?.currency || "PEN",
                metodo: paymentMethod
            })
            const url = await QRCode.toDataURL(qrData, { width: 150, margin: 1 })
            setQrCodeUrl(url)
        } catch (err) {
            console.error(err)
        }
    }

    const handleCreateInvoice = async () => {
        if (!selectedPatientId) {
            toast({ title: "Error", description: "Seleccione un paciente", variant: "destructive" })
            return
        }
        if (totals.total <= 0) {
            toast({ title: "Error", description: "Agregue al menos un servicio o ítem para facturar", variant: "destructive" })
            return
        }

        setLoading(true)
        try {
            const items = [
                ...CATALOG.services.filter(s => selectedServices.includes(s.id)).map(s => ({ ...s, type: 'SERVICIO', quantity: 1 })),
                ...CATALOG.procedures.filter(p => selectedProcedures.includes(p.id)).map(p => ({ ...p, type: 'PROCEDIMIENTO', quantity: 1 })),
                ...CATALOG.medications.filter(m => selectedMedications.includes(m.id)).map(m => ({ ...m, type: 'MEDICAMENTO', quantity: 1 }))
            ]

            await billingAPI.createInvoice({
                patientId: selectedPatientId,
                items,
                subtotal: totals.subtotal,
                tax: totals.tax,
                discount,
                total: totals.total,
                currency: config?.billing?.currency || 'PEN',
                status: 'PAID', // Venta POS es cobro inmediato
                paymentMethod,
                invoiceDate: new Date().toISOString(),
                paymentDate: new Date().toISOString()
            })

            toast({ title: "Venta Exitosa", description: "Comprobante generado correctamente." })
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error(error)
            toast({ title: "Error", description: error.response?.data?.message || "Falló la creación de la factura", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const toggle = (id: string, list: string[], setList: Function) => {
        setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id])
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 bg-[#09090b] border border-zinc-800 text-zinc-100 shadow-2xl">
                {/* Header Sólido */}
                <div className="flex items-center justify-between p-5 bg-zinc-900 border-b border-zinc-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-600 h-10 w-10 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/50">
                            <Receipt className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-white tracking-wide">Punto de Venta (POS)</DialogTitle>
                            <DialogDescription className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                                Emisión Rápida de Comprobantes
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Panel Izquierdo: Selección de Items */}
                    <div className="flex-1 p-6 overflow-y-auto bg-[#09090b] scrollbar-thin scrollbar-thumb-zinc-800">
                        {/* Selector de Paciente */}
                        <div className="mb-8">
                            <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2 block">
                                1. Seleccionar Cliente / Paciente
                            </Label>
                            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white h-12 text-sm focus:ring-emerald-600 focus:border-emerald-600">
                                    <SelectValue placeholder="Buscar por Nombre o Documento..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                    {patients.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            <span className="font-bold text-white">{p.firstName} {p.lastName}</span>
                                            <span className="text-zinc-500 ml-2 text-xs">({p.documentId || 'S/D'})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Grid de Ítems */}
                        <div className="space-y-6">
                            <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4 block">
                                2. Productos y Servicios
                            </Label>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                        <h4 className="text-sm font-bold text-zinc-300">Servicios Médicos</h4>
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                                        {CATALOG.services.map(item => (
                                            <div key={item.id}
                                                onClick={() => toggle(item.id, selectedServices, setSelectedServices)}
                                                className={cn(
                                                    "flex justify-between items-center p-3 rounded border cursor-pointer transition-colors",
                                                    selectedServices.includes(item.id)
                                                        ? "bg-emerald-900/20 border-emerald-600/50"
                                                        : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700"
                                                )}
                                            >
                                                <span className={cn("text-sm font-medium", selectedServices.includes(item.id) ? "text-emerald-400" : "text-zinc-300")}>{item.name}</span>
                                                <span className="text-sm font-bold text-white">{formatCurrency(item.price, config)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                        <h4 className="text-sm font-bold text-zinc-300">Procedimientos</h4>
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                                        {CATALOG.procedures.map(item => (
                                            <div key={item.id}
                                                onClick={() => toggle(item.id, selectedProcedures, setSelectedProcedures)}
                                                className={cn(
                                                    "flex justify-between items-center p-3 rounded border cursor-pointer transition-colors",
                                                    selectedProcedures.includes(item.id)
                                                        ? "bg-indigo-900/20 border-indigo-600/50"
                                                        : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700"
                                                )}
                                            >
                                                <span className={cn("text-sm font-medium", selectedProcedures.includes(item.id) ? "text-indigo-400" : "text-zinc-300")}>{item.name}</span>
                                                <span className="text-sm font-bold text-white">{formatCurrency(item.price, config)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                        <h4 className="text-sm font-bold text-zinc-300">Farmacia</h4>
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                                        {CATALOG.medications.map(item => (
                                            <div key={item.id}
                                                onClick={() => toggle(item.id, selectedMedications, setSelectedMedications)}
                                                className={cn(
                                                    "flex justify-between items-center p-3 rounded border cursor-pointer transition-colors",
                                                    selectedMedications.includes(item.id)
                                                        ? "bg-amber-900/20 border-amber-600/50"
                                                        : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700"
                                                )}
                                            >
                                                <span className={cn("text-sm font-medium", selectedMedications.includes(item.id) ? "text-amber-400" : "text-zinc-300")}>{item.name}</span>
                                                <span className="text-sm font-bold text-white">{formatCurrency(item.price, config)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Panel Derecho: Totales y Pago */}
                    <div className="w-[400px] bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 z-10">
                        <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">

                            {/* Resumen Financiero */}
                            <div className="space-y-4">
                                <Label className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Resumen Financiero</Label>
                                <div className="bg-black border border-zinc-800 rounded-lg p-5 space-y-3">
                                    <div className="flex justify-between text-zinc-400 text-sm">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(totals.subtotal, config)}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-400 text-sm">
                                        <span>Impuestos ({config?.billing?.taxRate || 18}%)</span>
                                        <span>{formatCurrency(totals.tax, config)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-zinc-400 text-sm pt-2 border-t border-zinc-800/50">
                                        <span>Descuento</span>
                                        <div className="flex items-end gap-1">
                                            <span className="text-xs mb-1">{config?.billing?.currency === 'USD' ? '$' : config?.billing?.currency === 'EUR' ? '€' : 'S/.'}</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                className="w-20 h-8 bg-zinc-900 border-zinc-700 text-right text-white focus:border-white"
                                                value={discount}
                                                onChange={(e) => setDiscount(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-zinc-800">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-base font-bold text-white uppercase">Total a Pagar</span>
                                            <span className="text-3xl font-black text-emerald-500">{formatCurrency(totals.total, config)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Método de Pago */}
                            <div className="space-y-4">
                                <Label className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Procesar Pago</Label>

                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger className="bg-black border-zinc-800 text-white h-12">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                        {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                                            <SelectItem key={key} value={value}>{value}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Área de Contexto de Pago */}
                                <div className="min-h-[140px] bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-center p-4">
                                    {qrCodeUrl ? (
                                        <div className="bg-white p-3 rounded-lg flex flex-col items-center shadow-lg">
                                            <img src={qrCodeUrl} className="w-32 h-32 mix-blend-multiply" alt="QR" />
                                            <p className="text-black text-xs font-bold mt-2">{paymentMethod}</p>
                                        </div>
                                    ) : paymentMethod.includes('Transferencia') ? (
                                        <div className="w-full space-y-3">
                                            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase mb-2">
                                                <Building2 className="h-4 w-4" /> Cuentas Corporativas
                                            </div>
                                            {COMPANY_ACCOUNTS.filter(acc => paymentMethod.includes(acc.bank)).map(acc => (
                                                <div key={acc.id} className="bg-zinc-900 p-3 rounded border border-zinc-800">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-white font-bold text-xs">{acc.bank}</span>
                                                        <span className="text-zinc-500 text-[10px] uppercase">{acc.currency}</span>
                                                    </div>
                                                    <p className="text-zinc-300 font-mono text-xs">{acc.number}</p>
                                                    <p className="text-zinc-600 font-mono text-[10px]">CCI: {acc.cci}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            {paymentMethod === PAYMENT_METHODS.CASH ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="bg-emerald-500/20 p-4 rounded-full mb-3">
                                                        <Banknote className="h-8 w-8 text-emerald-500" />
                                                    </div>
                                                    <p className="text-zinc-300 font-bold">Cobro en Efectivo</p>
                                                    <p className="text-zinc-500 text-xs mt-1">Reciba el dinero y registre la venta</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <div className="bg-indigo-500/20 p-4 rounded-full mb-3">
                                                        <CreditCard className="h-8 w-8 text-indigo-500" />
                                                    </div>
                                                    <p className="text-zinc-300 font-bold">Cobro con Tarjeta</p>
                                                    <p className="text-zinc-500 text-xs mt-1">Utilice el terminal POS físico</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-6 bg-zinc-900 border-t border-zinc-800">
                            <Button
                                className="w-full h-14 text-base font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
                                onClick={handleCreateInvoice}
                                disabled={loading || totals.total <= 0 || !selectedPatientId}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...
                                    </>
                                ) : (
                                    <>
                                        <Receipt className="mr-2 h-5 w-5" /> Registrar Venta {formatCurrency(totals.total, config)}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
