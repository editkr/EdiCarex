import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/financialUtils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    Download,
    Printer,
    Receipt,
    Building2,
    User,
    Calendar,
    CreditCard,
    CheckCircle,
    Clock,
    XCircle,
    Mail,
    MapPin,
    Phone
} from 'lucide-react'
import { useRef } from 'react'
import { generateInvoicePDF } from '@/utils/pdfGenerator'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useOrganization } from '@/contexts/OrganizationContext'

interface InvoiceViewerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    invoice: any
}

export function InvoiceViewerModal({ open, onOpenChange, invoice }: InvoiceViewerModalProps) {
    const { config } = useOrganization()

    if (!invoice) return null

    const handleDownload = () => {
        generateInvoicePDF(invoice, config)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PAID':
                return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30">PAGADO</Badge>
            case 'PENDING':
                return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/30">PENDIENTE</Badge>
            case 'OVERDUE':
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30">VENCIDO</Badge>
            default:
                return <Badge variant="outline">BORRADOR</Badge>
        }
    }

    const patientName = invoice.patient ? `${invoice.patient.firstName} ${invoice.patient.lastName}` : 'Cliente General'
    const patientDoc = invoice.patient?.documentId || 'S/D'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl bg-zinc-950 border-zinc-800 p-0 overflow-hidden shadow-2xl shadow-black/50">
                <div className="flex flex-col h-[85vh]">
                    {/* Header Toolbar */}
                    <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <Receipt className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Visualizador de Factura</h2>
                                <p className="text-[10px] text-zinc-500 font-mono">ID: {invoice.invoiceNumber || invoice.id.slice(0, 8)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="h-8 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={handleDownload}>
                                <Printer className="h-4 w-4 mr-2" />
                                Imprimir / PDF
                            </Button>
                        </div>
                    </div>

                    {/* Invoice Content */}
                    <div className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a]">
                        <div className="max-w-3xl mx-auto space-y-8 bg-black border border-zinc-800 p-8 rounded-sm shadow-xl relative">
                            {/* Watermark */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                                <Receipt className="h-96 w-96 text-white" />
                            </div>

                            {/* Ticket Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-black text-white tracking-tight">FACTURA</h1>
                                    <p className="text-emerald-500 font-bold uppercase tracking-[0.2em] text-sm mt-1">Electrónica</p>

                                    <div className="mt-6 text-zinc-400 text-xs space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-3 w-3" />
                                            <span className="font-bold text-zinc-300">{(config?.hospitalName || 'CLÍNICA EDICAREX').toUpperCase()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3 w-3" />
                                            <span>{config?.address || 'Av. Principal 123, Lima, Perú'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3 w-3" />
                                            <span>{config?.phone || '(01) 555-0000'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-3 w-3" />
                                            <span>{config?.email || 'facturacion@edicarex.com'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center min-w-[200px]">
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">RUC: {config?.billing?.taxId || '20601234567'}</p>
                                        <p className="text-xl font-mono font-bold text-white mb-1">{invoice.invoiceNumber || 'F001-00000000'}</p>
                                        <div className="flex justify-center mt-2">
                                            {getStatusBadge(invoice.status)}
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-1 text-right">
                                        <p className="text-xs text-zinc-500 uppercase font-bold">Fecha de Emisión</p>
                                        <p className="text-sm font-mono text-zinc-300">
                                            {format(new Date(invoice.invoiceDate || invoice.createdAt), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-zinc-800" />

                            {/* Client Info */}
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase font-bold mb-3 tracking-wider">Datos del Cliente</p>
                                    <div className="space-y-1 text-sm bg-zinc-900/30 p-4 rounded-lg border border-zinc-900">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Señor(a):</span>
                                            <span className="font-bold text-zinc-200">{patientName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Documento:</span>
                                            <span className="font-mono text-zinc-300">{patientDoc}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Dirección:</span>
                                            <span className="text-zinc-400 capitalize">{invoice.patient?.address || 'No registrada'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase font-bold mb-3 tracking-wider">Información de Pago</p>
                                    <div className="space-y-1 text-sm bg-zinc-900/30 p-4 rounded-lg border border-zinc-900">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Método:</span>
                                            <span className="font-bold text-zinc-200 uppercase">{invoice.paymentMethod || 'Efectivo'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Moneda:</span>
                                            <span className="text-zinc-300">{config?.billing?.currency === 'USD' ? 'Dólares (USD)' : config?.billing?.currency === 'EUR' ? 'Euros (EUR)' : 'Soles (PEN)'}</span>
                                        </div>
                                        {invoice.operationNumber && (
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">Nro. Operación:</span>
                                                <span className="font-mono text-emerald-400">{invoice.operationNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-zinc-900 text-xs uppercase font-bold text-zinc-500">
                                            <tr>
                                                <th className="px-4 py-3 tracking-wider">Descripción</th>
                                                <th className="px-4 py-3 text-center tracking-wider w-24">Cant.</th>
                                                <th className="px-4 py-3 text-right tracking-wider w-32">P. Unit</th>
                                                <th className="px-4 py-3 text-right tracking-wider w-32">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-900">
                                            {invoice.items?.map((item: any, i: number) => (
                                                <tr key={i} className="hover:bg-zinc-900/20">
                                                    <td className="px-4 py-3 text-zinc-300">
                                                        <span className="block font-medium">{item.description}</span>
                                                        <span className="text-[10px] text-zinc-600 uppercase">{item.type || 'SERVICIO'}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-zinc-400 font-mono">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-zinc-400 font-mono">{formatCurrency(item.unitPrice, config)}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-zinc-200 font-mono">{formatCurrency(item.quantity * item.unitPrice, config)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-sm text-zinc-500">
                                        <span>Subtotal</span>
                                        <span className="font-mono">{formatCurrency(invoice.subtotal, config)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-zinc-500">
                                        <span>{config?.billing?.taxLabel || 'Tax'} ({config?.billing?.taxRate || 18}%)</span>
                                        <span className="font-mono">{formatCurrency(invoice.tax, config)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-zinc-500">
                                        <span>Descuento</span>
                                        <span className="font-mono text-red-400">- {formatCurrency(invoice.discount || 0, config)}</span>
                                    </div>
                                    <Separator className="bg-zinc-800 my-2" />
                                    <div className="flex justify-between text-lg font-black text-white items-center">
                                        <span className="text-xs uppercase tracking-wider text-emerald-500">Total a Pagar</span>
                                        <span>{formatCurrency(invoice.total, config)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-8 text-center text-[10px] text-zinc-600 space-y-2">
                                <p>Representación impresa de la Factura Electrónica.</p>
                                <p>Gracias por su preferencia.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
