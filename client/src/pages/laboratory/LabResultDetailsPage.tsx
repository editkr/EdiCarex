import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, Download, Share2, Printer } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'

export default function LabResultDetailsPage() {
    const { id } = useParams()

    // Datos simulados de un resultado crítico
    const result = {
        test: 'Hemoglobina Glicosilada (HbA1c)',
        value: '14.2',
        unit: '%',
        reference: '4.0 - 5.6',
        status: 'CRITICAL',
        date: new Date(),
        patient: 'Juan Pérez',
        notes: 'Paciente con antecedentes de diabetes tipo 2. Se recomienda contacto inmediato.'
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" asChild className="gap-2">
                    <Link to="/laboratory"><ArrowLeft className="h-4 w-4" /> Volver</Link>
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2"><Printer className="h-4 w-4" /> Imprimir</Button>
                    <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> PDF</Button>
                </div>
            </div>

            {result.status === 'CRITICAL' && (
                <Alert variant="destructive" className="border-2 animate-pulse">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-lg font-bold">¡VALOR CRÍTICO DETECTADO!</AlertTitle>
                    <AlertDescription>
                        Este resultado requiere atención médica inmediata. El protocolo de alerta ha sido activado.
                    </AlertDescription>
                </Alert>
            )}

            <Card className="shadow-lg border-t-4 border-t-red-500">
                <CardHeader className="bg-muted/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-bold">{result.test}</CardTitle>
                            <p className="text-muted-foreground pt-1">ID Informe: {id}</p>
                        </div>
                        <Badge variant="destructive" className="text-lg px-4 py-1">CRÍTICO</Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Resultado</p>
                            <p className="text-4xl font-black text-red-600">{result.value} <span className="text-lg">{result.unit}</span></p>
                        </div>
                        <div className="space-y-1 border-x px-4">
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Rango Referencia</p>
                            <p className="text-xl font-medium">{result.reference} {result.unit}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Estado</p>
                            <p className="text-xl font-bold text-red-600">ANORMAL ALTO</p>
                        </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-100 dark:border-red-900">
                        <h4 className="font-semibold text-red-900 dark:text-red-400 flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4" /> Observaciones del Laboratorio
                        </h4>
                        <p className="text-red-800 dark:text-red-300 text-sm leading-relaxed">
                            {result.notes}
                        </p>
                    </div>

                    <div className="pt-4 border-t grid md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">Paciente</p>
                            <p className="font-semibold">{result.patient}</p>
                        </div>
                        <div className="md:text-right">
                            <p className="text-xs text-muted-foreground uppercase">Fecha / Hora Validación</p>
                            <p className="font-semibold text-sm">Validado el 28 Feb 2026 - 10:45 AM</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
                <Button className="bg-red-600 hover:bg-red-700 gap-2">
                    <Share2 className="h-4 w-4" /> Notificar al Médico
                </Button>
            </div>
        </div>
    )
}
