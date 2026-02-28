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

const HISReportingPage: React.FC = () => {
    const navigate = useNavigate();
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
                    <Button variant="outline">
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
                            Registros Mensuales
                            <Database className="h-4 w-4" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">1,450</div>
                        <p className="text-[10px] opacity-70 mt-1">Lista para exportación de Febrero</p>
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
                        <CardTitle className="text-sm font-medium text-red-600">Errores de Trama</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">2</div>
                        <p className="text-[10px] text-muted-foreground mt-1">DNI inválidos detectados</p>
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
                        <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                                <div>
                                    <p className="font-semibold text-slate-900">Trama HIS Mensual</p>
                                    <p className="text-xs text-muted-foreground">Formato .txt / .csv para SIH-MINSA</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="group-hover:text-emerald-600">
                                <Download className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
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
                        <CardTitle>Historial de Envíos</CardTitle>
                        <CardDescription>Validación y confirmación de recepción en Red San Román</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 text-sm pb-4 border-b last:border-0 border-slate-100">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">Envío Trama HIS - Enero 2024</p>
                                        <p className="text-xs text-muted-foreground">Enviado por Admin el 05/02/2024</p>
                                    </div>
                                    <Button variant="link" size="sm" className="text-indigo-600">Ver Ticket</Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default HISReportingPage;
