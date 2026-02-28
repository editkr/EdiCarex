import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BarChart3,
    Download,
    FileSpreadsheet,
    FileText,
    RefreshCcw,
    Send,
    Database,
    Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { hisAPI } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

const HISReportingPage: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: stats, isLoading: isLoadingStats } = useQuery({
        queryKey: ['his-stats'],
        queryFn: async () => {
            const response = await hisAPI.getStats();
            return response.data;
        }
    });

    const { data: hisRecords, isLoading: isLoadingRecords } = useQuery({
        queryKey: ['his-records'],
        queryFn: async () => {
            const response = await hisAPI.getAll();
            return response.data;
        }
    });

    const { mutate: exportHis, isPending: isExporting } = useMutation({
        mutationFn: async () => {
            const response = await hisAPI.exportCsv();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `his_export_${format(new Date(), 'yyyyMMdd')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        },
        onSuccess: () => {
            toast({ title: 'Éxito', description: 'Trama HIS exportada correctamente.' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Ocurrió un error al exportar la trama HIS.', variant: 'destructive' });
        }
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reportes HIS MINSA</h1>
                    <p className="text-muted-foreground font-medium">
                        Sistema de Información de Salud - Exportación de actividades y metas (IPRESS 00003308)
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Sincronizar Datos
                    </Button>
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => navigate('/his-reporting/new')}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Registro HIS
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Send className="h-4 w-4 mr-2" />
                        Enviar a MINSA
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium uppercase opacity-80 flex items-center justify-between text-white">
                            Registros Totales
                            <Database className="h-4 w-4" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {isLoadingStats ? <Skeleton className="h-9 w-16 bg-indigo-400" /> : stats?.totalRecords || 0}
                        </div>
                        <p className="text-[10px] opacity-70 mt-1">Lista para exportación</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-medium">Atenciones Sis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">85%</div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-medium text-amber-600">Pacientes Atendidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">
                            {isLoadingStats ? <Skeleton className="h-8 w-12" /> : stats?.uniquePatients || 0}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Pacientes únicos con HIS</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-medium text-emerald-600">Último Envío</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">15 Feb 2024</div>
                        <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">Exitoso</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-indigo-500" />
                            Formatos de Exportación
                        </CardTitle>
                        <CardDescription>Genere archivos compatibles con los sistemas nacionales</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => exportHis()}>
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                                <div>
                                    <p className="font-semibold text-slate-900">Trama HIS Mensual</p>
                                    <p className="text-xs text-muted-foreground">Formato .txt / .csv para SIH-MINSA</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="group-hover:text-emerald-600" disabled={isExporting}>
                                {isExporting ? <span className="animate-spin">⏳</span> : <Download className="h-5 w-5" />}
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => toast({ title: 'Generando PDF', description: 'El reporte está siendo generado...' })}>
                            <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="font-semibold text-slate-900">Reporte Operacional</p>
                                    <p className="text-xs text-muted-foreground">PDF con estadísticas para Microred</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="group-hover:text-blue-600">
                                <Download className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Envíos y Registros HIS</CardTitle>
                        <CardDescription>Últimos registros grabados en el sistema HIS local</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {isLoadingRecords ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : hisRecords?.data?.length > 0 ? (
                                hisRecords.data.map((record: any) => (
                                    <div key={record.id} className="flex items-center gap-4 text-sm pb-4 border-b last:border-0 border-slate-100">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">Registro HIS - Paciente DNI: {record.patient?.documentNumber}</p>
                                            <p className="text-xs text-muted-foreground">Diagnóstico Principal: {record.diagnoses[0]?.code}</p>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(record.attentionDate), "dd MMM HH:mm", { locale: es })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No hay registros HIS grabados.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default HISReportingPage;
