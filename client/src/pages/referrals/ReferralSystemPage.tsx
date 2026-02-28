import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Building2,
    FileText,
    History,
    Plus,
    Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

const ReferralSystemPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Referencias y Contrarreferencias</h1>
                    <p className="text-muted-foreground font-medium">
                        Gestión técnica de derivaciones entre el C.S. Jorge Chávez y la Red de Salud San Román
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate('/referral-system/new')}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Referencia
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ArrowUpRight className="h-4 w-4 text-blue-500" />
                            Referencias Enviadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground mt-1">+3 desde la semana pasada</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ArrowDownLeft className="h-4 w-4 text-green-500" />
                            Contrarreferencias Recibidas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-muted-foreground mt-1">4 pendientes de revisión</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-zinc-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-zinc-500" />
                            Establecimientos Destino
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5</div>
                        <p className="text-xs text-muted-foreground mt-1">Hospital Carlos Monge Medrano predominante</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Derivaciones</CardTitle>
                    <CardDescription>Seguimiento de pacientes referidos a mayor nivel de complejidad</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar por paciente, DNI o establecimiento..." className="pl-9" />
                        </div>
                        <Button variant="outline">
                            <History className="h-4 w-4 mr-2" />
                            Reportes Anuales
                        </Button>
                    </div>

                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50/50">
                        <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                            <FileText className="h-6 w-6 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No hay referencias activas</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
                            Inicie una nueva referencia técnica para pacientes que requieran atención en Hospitales de Nivel II o III.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReferralSystemPage;
