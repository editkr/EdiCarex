import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Video,
    VideoOff,
    Mic,
    MessageSquare,
    Settings,
    Calendar,
    User,
    MonitorPlay
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TelemedicinePage: React.FC = () => {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Telemedicina</h1>
                    <p className="text-muted-foreground font-medium">
                        Plataforma de teleconsultas para atención remota y especialistas
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Ver Agenda Virtual
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Video className="h-4 w-4 mr-2" />
                        Iniciar Teleconsulta
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Virtual Camera View Placeholder */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-zinc-950 border-zinc-800 aspect-video flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="h-20 w-20 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 animate-pulse">
                            <VideoOff className="h-10 w-10 text-indigo-400" />
                        </div>
                        <p className="text-zinc-500 mt-4 font-medium italic">La cámara está apagada</p>

                        {/* Call Controls */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                            <Button size="icon" variant="secondary" className="rounded-full h-12 w-12 bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800">
                                <VideoOff className="h-5 w-5" />
                            </Button>
                            <Button size="icon" variant="secondary" className="rounded-full h-12 w-12 bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800">
                                <Mic className="h-5 w-5" />
                            </Button>
                            <Button size="icon" className="rounded-full h-14 w-14 bg-red-600 text-white hover:bg-red-700 border-none shadow-lg">
                                <PhoneIcon className="h-6 w-6 rotate-[135deg]" />
                            </Button>
                            <Button size="icon" variant="secondary" className="rounded-full h-12 w-12 bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800">
                                <MessageSquare className="h-5 w-5" />
                            </Button>
                            <Button size="icon" variant="secondary" className="rounded-full h-12 w-12 bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800">
                                <Settings className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="absolute top-4 right-4 h-32 w-48 bg-zinc-900 rounded-lg border border-zinc-800 shadow-2xl overflow-hidden">
                            <div className="h-full w-full flex items-center justify-center bg-zinc-950 flex-col">
                                <User className="h-8 w-8 text-zinc-700" />
                                <span className="text-[10px] text-zinc-600 font-bold mt-1 uppercase tracking-widest">Tú</span>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-indigo-50/50 border-indigo-100 border shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                                        <MonitorPlay className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-indigo-900 leading-none mb-1">Calidad de Conexión</p>
                                        <p className="text-xs text-indigo-600 font-medium tracking-tight">Estable • 45ms latencia</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                        <User className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 leading-none mb-1">Paciente en espera</p>
                                        <p className="text-xs text-slate-500 font-medium tracking-tight">Juan Perez (ID: 45621)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Próximas Teleconsultas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-3 border rounded-xl hover:bg-slate-50 transition-colors border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 uppercase font-bold tracking-tighter">
                                            VIRTUAL
                                        </Badge>
                                        <span className="text-xs font-mono font-bold text-indigo-600">15:30</span>
                                    </div>
                                    <p className="font-bold text-sm text-slate-900">Maria Rodriguez</p>
                                    <p className="text-xs text-slate-500 font-medium opacity-80">Seguimiento Post-operatorio</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-950 text-white border-zinc-800 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <MonitorPlay className="h-24 w-24" />
                        </div>
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-lg text-white">Herramientas IA</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                                La IA está analizando la conversación en tiempo real para generar el resumen médico estructurado.
                            </p>
                            <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 italic text-[11px] text-zinc-500 font-medium">
                                Esperando inicio de teleconsulta para procesar transcripción...
                            </div>
                            <Button variant="ghost" className="w-full text-zinc-400 hover:text-white hover:bg-zinc-900 text-[10px] font-bold uppercase tracking-widest">
                                Abrir Transcripción
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// Icon Helper
const PhoneIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

export default TelemedicinePage;
