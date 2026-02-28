import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Activity,
    AlertTriangle,
    Globe,
    ShieldAlert,
    TrendingUp,
    Map as MapIcon,
    FileSearch
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const EpidemiologyPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Epidemiología y Vigilancia</h1>
                    <p className="text-muted-foreground font-medium">
                        Monitoreo de brotes, zoonosis y febriles - Reportes NOTI (C.S. Jorge Chávez)
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-slate-200">
                        <MapIcon className="h-4 w-4 mr-2 text-indigo-600" />
                        Mapa Caliente
                    </Button>
                    <Button
                        className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
                        onClick={() => navigate('/epidemiology/report/new')}
                    >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Notificar Caso (NOTI)
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-t-4 border-t-red-600 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-red-600 flex items-center justify-between">
                            Alertas Rojas
                            <ShieldAlert className="h-4 w-4" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">0</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Sin brotes activos detectados hoy</p>
                    </CardContent>
                </Card>
                <Card className="border-t-4 border-t-amber-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-amber-600">Casos Febriles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">14</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">En observación (últimos 7 días)</p>
                    </CardContent>
                </Card>
                <Card className="border-t-4 border-t-blue-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-blue-600">Zoonosis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">2</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Reportes de mordeduras caninas</p>
                    </CardContent>
                </Card>
                <Card className="border-t-4 border-t-zinc-800 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-zinc-900">Tasa Incidencia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">1.2%</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Dentro del rango esperado (Endemia)</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm border-slate-100 overflow-hidden relative">
                    <CardHeader className="relative z-10 bg-white/50 backdrop-blur-md">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-slate-900 font-bold">
                                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                                    Vigilancia Semanal (VED)
                                </CardTitle>
                                <CardDescription className="font-medium">Tendencia de enfermedades de notificación obligatoria</CardDescription>
                            </div>
                            <Globe className="h-10 w-10 text-slate-100" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="h-72 w-full bg-slate-50 flex items-center justify-center relative border-t border-slate-100">
                            <Activity className="h-12 w-12 text-slate-200 animate-pulse" />
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-white/50 backdrop-blur-sm border-t border-slate-100">
                                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-[0.2em]">Interfase de Vigilancia Epidemiológica SIR-VE</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">Eventos Recientes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: 'Dengue', status: 'Negativo', date: 'Hace 2 horas', color: 'bg-green-100 text-green-700 border-green-200' },
                            { label: 'IRA Grave', status: 'Monitoreo', date: 'Hace 5 horas', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
                            { label: 'TBC', status: 'Notificado', date: 'Ayer', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                        ].map((evt, i) => (
                            <div key={i} className="flex flex-col p-4 border rounded-2xl space-y-3 hover:shadow-md transition-all border-slate-100 bg-white">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className={`${evt.color} font-bold text-[10px] px-2 py-0 border leading-none tracking-tight`}>{evt.status}</Badge>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{evt.date}</span>
                                </div>
                                <p className="font-bold text-slate-900 text-base leading-none tracking-tight">{evt.label}</p>
                                <Button variant="secondary" className="h-8 w-full justify-center text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-50 hover:bg-slate-100 border-none">
                                    <FileSearch className="h-3.5 w-3.5 mr-2 text-indigo-500" /> Ficha NOTI
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EpidemiologyPage;
