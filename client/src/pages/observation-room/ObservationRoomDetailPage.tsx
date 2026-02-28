import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    BedDouble,
    Clock,
    Activity,
    Thermometer,
    HeartPulse,
    Droplet,
    Pill,
    Syringe,
    FileText,
    LogOut,
    CheckCircle2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { emergencyAPI, observationRoomAPI } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const ObservationRoomDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: bed, isLoading } = useQuery({
        queryKey: ['observation-bed', id],
        queryFn: async () => {
            if (!id) throw new Error('No bed ID specified');
            const res = await observationRoomAPI.getOne(id);
            return res.data;
        }
    });

    const getPriorityColor = (priority: string | null) => {
        switch (priority) {
            case 'ROJO': return 'bg-red-500 border-red-600 text-white';
            case 'AMARILLO': return 'bg-amber-400 border-amber-500 text-slate-900';
            case 'VERDE': return 'bg-emerald-500 border-emerald-600 text-white';
            default: return 'bg-slate-200 border-slate-300 text-slate-700';
        }
    };

    if (isLoading || !bed) {
        return <div className="p-6"><Skeleton className="h-[600px] w-full rounded-xl" /></div>;
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shadow-sm bg-white border">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Badge className="bg-slate-900 hover:bg-slate-900 font-bold tracking-widest px-3 py-1 shadow-sm uppercase text-[10px]">
                                Cama {bed.number.toString().padStart(2, '0')}
                            </Badge>
                            <Badge className={`${getPriorityColor(bed.priority)} font-bold tracking-widest px-3 py-1 shadow-sm uppercase text-[10px]`}>
                                Prioridad {bed.priority}
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 tracking-tight">
                            {bed.patient?.fullName || 'Cama Disponible'}
                        </h1>
                        <p className="text-muted-foreground text-sm font-bold tracking-widest uppercase">
                            DNI: {bed.patient?.documentNumber} • {bed.patient?.age} años • Admisión: {format(new Date(bed.admissionTime), "dd MMM HH:mm", { locale: es })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold tracking-widest text-[10px] uppercase shadow-sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Hoja de Monitoreo
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg font-bold tracking-widest text-[10px] uppercase px-6">
                        <LogOut className="h-4 w-4 mr-2" />
                        Dar de Alta
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm border-slate-200 overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                                <Activity className="h-5 w-5 text-indigo-500" />
                                Signos Vitales y Monitoreo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b">
                                            <th className="py-3 px-4 text-left">Hora</th>
                                            <th className="py-3 px-4 text-center">PA (mmHg)</th>
                                            <th className="py-3 px-4 text-center">FC (lpm)</th>
                                            <th className="py-3 px-4 text-center">FR (rpm)</th>
                                            <th className="py-3 px-4 text-center">T° (°C)</th>
                                            <th className="py-3 px-4 text-center">SatO2 (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {bed.vitals?.map((v: any, i: any) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-bold">
                                                    {format(new Date(v.time), "HH:mm")}
                                                </td>
                                                <td className="py-3 px-4 text-center text-slate-900">{v.bp}</td>
                                                <td className="py-3 px-4 text-center text-slate-900">{v.hr}</td>
                                                <td className="py-3 px-4 text-center text-slate-900">{v.rr}</td>
                                                <td className="py-3 px-4 text-center text-slate-900">{v.temp}</td>
                                                <td className="py-3 px-4 text-center text-slate-900">{v.spo2}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-slate-50 border-t flex gap-2">
                                <Button variant="secondary" className="bg-white border text-xs font-bold shadow-sm">
                                    + Registrar Constantes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                                <Pill className="h-5 w-5 text-emerald-500" />
                                Tratamiento / Terapéutica
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {bed.treatments?.map((t: any, i: any) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                                                <Syringe className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 tracking-tight">{t.medication}</p>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    Indicado: {format(new Date(t.time), "dd/MM HH:mm")}
                                                </p>
                                            </div>
                                        </div>
                                        {t.status === 'ADMINISTERED' ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 font-bold tracking-widest text-[10px] uppercase">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Administrado
                                            </Badge>
                                        ) : (
                                            <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 font-bold bg-emerald-50">
                                                Aplicar
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-slate-50 border-t">
                                <Button variant="secondary" className="bg-white border text-xs font-bold shadow-sm w-full md:w-auto">
                                    + Indicar Tratamiento
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="shadow-sm border-slate-200 overflow-hidden bg-slate-900 text-white">
                        <CardHeader className="pb-3 border-b border-slate-800">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Clock className="h-5 w-5 text-amber-500" />
                                Tiempo de Permanencia
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="text-center py-6 bg-slate-800/50 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 rounded-t-2xl"></div>
                                <div className="text-5xl font-black text-amber-400 tracking-tighter tabular-nums drop-shadow-md">
                                    02:15<span className="text-xl ml-1 text-slate-400">h</span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-3">Desde Admisión</p>
                            </div>

                            <div className="mt-6 space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Diagnóstico Inicial</p>
                                    <p className="font-semibold text-sm leading-tight text-slate-300">
                                        {bed.diagnosis}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-3 border-b bg-slate-50">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 uppercase tracking-widest">
                                Notas de Evolución
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <Textarea
                                placeholder="Escribir nota médica o de enfermería (SOAP)..."
                                className="min-h-[120px] resize-none border-slate-200 focus-visible:ring-indigo-500"
                            />
                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md font-bold text-xs uppercase tracking-widest">
                                Guardar Nota
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ObservationRoomDetailPage;
