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
import { useQuery } from '@tanstack/react-query';
import { referralsAPI } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

const ReferralSystemPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: referrals, isLoading } = useQuery({
        queryKey: ['referrals'],
        queryFn: async () => {
            const response = await referralsAPI.getAll();
            return response.data;
        }
    });

    const filteredReferrals = referrals?.filter((ref: any) =>
        ref.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.patient?.documentNumber?.includes(searchTerm) ||
        ref.destinationCode?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendiente</Badge>
            case 'ACCEPTED': return <Badge variant="outline" className="text-blue-600 border-blue-600">Aceptada</Badge>
            case 'REJECTED': return <Badge variant="outline" className="text-red-600 border-red-600">Rechazada</Badge>
            case 'COMPLETED': return <Badge variant="outline" className="text-green-600 border-green-600">Completada</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    };

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
                        <div className="text-2xl font-bold">
                            {isLoading ? <Skeleton className="h-8 w-16" /> : referrals?.filter((r: any) => r.type === 'REFERRAL').length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Referencias emitidas</p>
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
                        <div className="text-2xl font-bold">
                            {isLoading ? <Skeleton className="h-8 w-16" /> : referrals?.filter((r: any) => r.type === 'COUNTER_REFERRAL').length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Retornos registrados</p>
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
                            <Input
                                placeholder="Buscar por paciente, DNI o establecimiento..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline">
                            <History className="h-4 w-4 mr-2" />
                            Reportes Anuales
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : filteredReferrals.length > 0 ? (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Paciente</TableHead>
                                        <TableHead>Establecimiento Destino</TableHead>
                                        <TableHead>Especialidad</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReferrals.map((referral: any) => (
                                        <TableRow key={referral.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/referral-system/${referral.id}`)}>
                                            <TableCell className="font-medium">
                                                {format(new Date(referral.date), "dd/MM/yyyy", { locale: es })}
                                                <div className="text-xs text-muted-foreground">{format(new Date(referral.date), "HH:mm")}</div>
                                            </TableCell>
                                            <TableCell>
                                                {referral.patient?.firstName} {referral.patient?.lastName}
                                                <div className="text-xs text-muted-foreground">DNI: {referral.patient?.documentNumber}</div>
                                            </TableCell>
                                            <TableCell>{referral.destinationCode}</TableCell>
                                            <TableCell>{referral.specialty}</TableCell>
                                            <TableCell>
                                                {referral.type === 'REFERRAL' ? 'Referencia' : 'Contrarreferencia'}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(referral.status)}</TableCell>
                                            <TableCell className="text-right flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/referral-system/${referral.id}`) }}>
                                                    Ver Detalle
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50/50">
                            <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                                <FileText className="h-6 w-6 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No hay referencias registradas</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
                                Inicie una nueva referencia técnica para pacientes que requieran atención en Hospitales de Nivel II o III.
                            </p>
                            <Button onClick={() => navigate('/referral-system/new')} variant="outline">Crear Primera Referencia</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ReferralSystemPage;
