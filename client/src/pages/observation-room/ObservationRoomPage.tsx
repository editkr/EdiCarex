import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    BedDouble,
    Clock,
    Activity,
    AlertTriangle,
    CheckCircle2,
    ArrowRightLeft,
    LogOut,
    Stethoscope
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { emergencyAPI, observationRoomAPI } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ObservationRoomPage: React.FC = () => {
    // Para simplificar, obtenemos las camas del endpoint de emergencia (observation-room)
    const { data: bedsData, isLoading } = useQuery({
        queryKey: ['observation-beds'],
        queryFn: async () => {
            const res = await observationRoomAPI.getAll();
            return { data: res.data };
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

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'OCCUPIED': return 'border-l-4 border-slate-900 shadow-md bg-white';
            case 'AVAILABLE': return 'border-dashed border-2 bg-slate-50/50 hover:bg-slate-50 opacity-70';
            case 'MAINTENANCE': return 'border-2 border-red-200 bg-red-50/50 opacity-60';
            default: return 'bg-white';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-indigo-600 hover:bg-indigo-700 font-bold tracking-tighter shadow-sm border-none uppercase">Urgencias</Badge>
                        <span className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">Sala de Observación</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Módulo de Observación</h1>
                    <p className="text-muted-foreground font-medium">
                        Monitoreo en tiempo real de camas y tiempos de estancia (C.S. Jorge Chávez)
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Admitir Paciente
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-t-4 border-t-red-600 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-red-600 flex items-center justify-between">
                            Prioridad I (Rojo)
                            <AlertTriangle className="h-4 w-4" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">1</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Reevaluación constante</p>
                    </CardContent>
                </Card>
                <Card className="border-t-4 border-t-amber-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-amber-600 flex items-center justify-between">
                            Prioridad II (Amarillo)
                            <Activity className="h-4 w-4" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">1</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Observación activa</p>
                    </CardContent>
                </Card>
                <Card className="border-t-4 border-t-emerald-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-emerald-600 flex items-center justify-between">
                            Disponibilidad
                            <CheckCircle2 className="h-4 w-4" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">2 / 6</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Camas libres</p>
                    </CardContent>
                </Card>
                <Card className="border-t-4 border-t-slate-800 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-slate-900">Tiempo Promedio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">2.5h</div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Estancia en observación</p>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4 flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-indigo-500" />
                Disposición de Camas (6 Grid)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
                ) : (
                    bedsData?.data.map((bed: any) => (
                        <Card key={bed.id} className={`relative overflow-hidden transition-all ${getStatusStyle(bed.status)}`}>
                            {bed.status === 'OCCUPIED' && bed.priority && (
                                <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-bl-lg ${getPriorityColor(bed.priority)}`}>
                                    {bed.priority}
                                </div>
                            )}
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-lg ${bed.status === 'AVAILABLE' ? 'bg-slate-200 text-slate-400' : 'bg-indigo-100 text-indigo-700'}`}>
                                            {bed.number}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 leading-none">CAMA {bed.number.toString().padStart(2, '0')}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {bed.status === 'OCCUPIED' ? 'Ocupada' : bed.status === 'AVAILABLE' ? 'Disponible' : 'Mantenimiento'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {bed.status === 'OCCUPIED' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 truncate">{bed.patient}</p>
                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{bed.diagnosis}</p>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Clock className="h-4 w-4" />
                                                <span className="text-xs font-bold">
                                                    {formatDistanceToNow(new Date(bed.admissionTime), { locale: es, addSuffix: false })}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-slate-200 hover:bg-slate-100 hover:text-indigo-600">
                                                    <Stethoscope className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-red-200 text-red-600 hover:bg-red-50">
                                                    <LogOut className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : bed.status === 'AVAILABLE' ? (
                                    <div className="h-24 flex flex-col items-center justify-center text-slate-400 gap-2">
                                        <BedDouble className="h-8 w-8 opacity-50" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Lista para Admisión</p>
                                    </div>
                                ) : (
                                    <div className="h-24 flex flex-col items-center justify-center text-red-400 gap-2">
                                        <AlertTriangle className="h-8 w-8 opacity-50" />
                                        <p className="text-xs font-bold uppercase tracking-widest">En Desinfección</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default ObservationRoomPage;
