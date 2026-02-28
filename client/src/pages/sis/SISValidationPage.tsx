import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Search,
    ShieldCheck,
    UserCheck,
    FileWarning,
    ExternalLink,
    CheckCircle2,
    Clock,
    HeartPulse,
    Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { sisAPI } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const SISValidationPage: React.FC = () => {
    const { toast } = useToast();
    const [dni, setDni] = useState('');
    const [validationResult, setValidationResult] = useState<any>(null);

    const { mutate: validateSIS, isPending } = useMutation({
        mutationFn: async (documentNumber: string) => {
            const res = await sisAPI.validate({ documentNumber, documentType: 'DNI' });
            return res.data;
        },
        onSuccess: (data) => {
            setValidationResult(data);
            toast({
                title: 'Validación Completada',
                description: data.isActive ? 'El paciente tiene SIS Activo' : 'El paciente NO tiene SIS activo',
                variant: data.isActive ? 'default' : 'destructive',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error de Validación',
                description: error.response?.data?.message || 'No se pudo conectar con el servicio SIS',
                variant: 'destructive',
            });
            setValidationResult(null);
        }
    });

    const handleValidate = () => {
        if (!dni || dni.length < 8) {
            toast({
                title: 'DNI Inválido',
                description: 'Ingrese un DNI válido de 8 dígitos',
                variant: 'destructive',
            });
            return;
        }
        validateSIS(dni);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-red-600 hover:bg-red-700 font-bold tracking-tighter shadow-sm border-none">SIS OFICIAL</Badge>
                        <span className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">SIAHO / SIH-SIS INTERFACE</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Validación de Derechos SIS</h1>
                    <p className="text-muted-foreground font-medium">
                        Acreditación en tiempo real del Seguro Integral de Salud (C.S. Jorge Chávez)
                    </p>
                </div>
                <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 font-bold shadow-sm" onClick={() => window.open('http://app1.sis.gob.pe/SisConsultaEnLinea/Consulta/frmConsultaEnLinea.aspx', '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Portal Acreditación
                </Button>
            </div>

            <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-2xl border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <ShieldCheck className="h-32 w-32" />
                </div>
                <CardContent className="pt-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 px-2">
                        <div className="h-20 w-20 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md shadow-inner">
                            <ShieldCheck className="h-12 w-12 text-white" />
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <h2 className="text-2xl font-bold tracking-tight">Verificador de Cobertura</h2>
                            <p className="text-sm opacity-90 font-medium leading-relaxed max-w-lg">
                                Valide la vigencia prestacional, centro de adscripción y plan de beneficios del afiliado.
                            </p>
                        </div>
                        <div className="flex w-full md:w-auto gap-3 bg-white/15 p-2 rounded-2xl border border-white/20 backdrop-blur-sm">
                            <Input
                                placeholder="Ingrese DNI..."
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                className="bg-white text-slate-900 placeholder:text-slate-400 w-full md:w-56 h-12 border-none font-bold text-lg rounded-xl focus-visible:ring-white/50"
                                maxLength={8}
                                onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                            />
                            <Button
                                className="bg-white text-red-700 hover:bg-slate-100 font-black px-8 h-12 rounded-xl shadow-lg border-none"
                                onClick={handleValidate}
                                disabled={isPending}
                            >
                                {isPending ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Search className="h-5 w-5 mr-3" />}
                                VALIDAR
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {validationResult && (
                <Card className={`border-t-4 ${validationResult.isActive ? 'border-t-emerald-500' : 'border-t-red-500'} shadow-lg animate-in fade-in slide-in-from-bottom-4`}>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="flex items-center gap-2">
                            {validationResult.isActive ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <FileWarning className="h-6 w-6 text-red-500" />}
                            Resultado de Validación
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-xs uppercase text-muted-foreground font-bold mb-1">Estado</p>
                                <Badge className={validationResult.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                                    {validationResult.isActive ? 'ACTIVO' : 'INACTIVO / NO AFILIADO'}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-muted-foreground font-bold mb-1">Paciente</p>
                                <p className="font-semibold">{validationResult.fullName || 'No Registrado'}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-muted-foreground font-bold mb-1">Plan de Beneficios</p>
                                <p className="font-semibold">{validationResult.plan || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-muted-foreground font-bold mb-1">Centro de Adscripción</p>
                                <p className="font-semibold">{validationResult.establishment || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm border-slate-100 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-3 text-slate-900 font-bold text-lg">
                            <UserCheck className="h-5 w-5 text-emerald-600" />
                            Acreditaciones Recientes
                        </CardTitle>
                        <CardDescription className="font-medium">Sesión actual de admisión y triaje</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {[
                                { name: 'Luis García Soto', dni: '74561230', plan: 'SIS Gratuito', status: 'Activo', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { name: 'Ana Luz Quispe', dni: '45892103', plan: 'SIS Para Todos', status: 'Activo', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { name: 'Julio Tapia Vera', dni: '08963214', plan: '-', status: 'No Afiliado', icon: FileWarning, color: 'text-red-500', bg: 'bg-red-50' },
                            ].map((v, i) => (
                                <div key={i} className="flex items-center justify-between p-5 hover:bg-slate-50/80 transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 bg-white ${v.color}`}>
                                            <v.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-base tracking-tight leading-none mb-1">{v.name}</p>
                                            <p className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                                                DNI: <span className="text-slate-600">{v.dni}</span> • PLAN: <span className="text-slate-600">{v.plan}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className={`${v.bg} ${v.color} font-black text-[10px] tracking-widest px-3 py-1 border-none`}>{v.status}</Badge>
                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-[10px] font-black text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">DETALLES</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="shadow-sm border-slate-100 overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-50">
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-500" />
                                Pendientes FUA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="text-center py-4 bg-amber-50 rounded-2xl border border-amber-100 shadow-inner">
                                <div className="text-4xl font-black text-amber-600 tracking-tighter">08</div>
                                <p className="text-[11px] text-amber-700 font-bold uppercase tracking-tight mt-1">Formularios por Firmar</p>
                                <Button variant="link" className="mt-4 text-indigo-600 font-black text-[10px] tracking-widest uppercase hover:no-underline">Gestionar Lote</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <HeartPulse className="h-32 w-32" />
                        </div>
                        <CardHeader className="pb-3 relative z-10">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
                                <HeartPulse className="h-5 w-5 text-red-500" />
                                Cobertura I-4
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed opacity-80">
                                Las validaciones incluyen: Consulta externa, Telemedicina y medicamentos según petitorio I-4.
                            </p>
                            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                <div className="flex justify-between items-center text-[10px] font-black mb-2 uppercase tracking-widest">
                                    <span className="text-slate-400">Ejecución Presupuestal</span>
                                    <span className="text-emerald-400 font-mono">72%</span>
                                </div>
                                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden shadow-inner">
                                    <div className="bg-emerald-500 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: '72%' }}></div>
                                </div>
                                <p className="text-[9px] text-slate-500 mt-2 font-bold italic text-center opacity-60">Actualizado hace 5 min</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SISValidationPage;
