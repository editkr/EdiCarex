import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    RefreshCw,
    Lock,
    Cpu,
    CheckCircle2,
    XCircle,
    ChevronUp,
    Terminal,
    Settings,
    ShieldAlert,
    Database,
    Zap,
    Waves,
    Code2,
    Eye,
    Server,
    Shield,
    Layout,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstitutionalFooter } from '@/components/InstitutionalFooter';
import { api } from '@/services/api';
import { Toaster, toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

const ROBOT_IMAGES = [
    '/assets/robot-1.png',
    '/assets/robot-2.png',
    '/assets/robot-3.png',
    '/assets/robot-4.png',
    '/assets/robot-5.png',
    '/assets/robot-6.png',
];

const LOG_MESSAGES = [
    "EXECUTING: DB_OPTIMIZATION_V4...",
    "CLEANING: REDIS_CACHE_DUMP...",
    "UPDATING: SECURITY_PROTOCOLS...",
    "RE-ROUTING: API_GATEWAY...",
    "SYNCING: PATIENT_DATA_NODES...",
    "DECRYPTING: SYSTEM_LOGS...",
    "OPTIMIZING: UI_RENDER_CORE...",
    "VERIFYING: SSL_CERTIFICATES...",
    "PATCHING: KERNEL_MODULES...",
    "BOOSTING: FIREWALL_RULES...",
];

export default function MaintenancePage() {
    const { config } = useOrganization();
    const { theme } = useTheme();
    const [isChecking, setIsChecking] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const logoType = config?.branding?.logoType || 'dark';

    // Terminal Log Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            const randomMsg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
            const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLogs(prev => [`[${timestamp}] ${randomMsg}`, ...prev].slice(0, 8));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async (silent = false) => {
        if (!silent) setIsChecking(true);
        try {
            await api.get('/users/me');
            toast.custom((t) => (
                <div className="flex flex-col items-center justify-center w-[500px] bg-[#0c4a6e]/90 backdrop-blur-3xl border border-sky-400/30 rounded-3xl p-8 shadow-[0_0_120px_rgba(56,189,248,0.5)] animate-in zoom-in-95 duration-500">
                    <CheckCircle2 className="w-24 h-24 text-sky-400 mb-6 drop-shadow-[0_0_20px_rgba(56,189,248,1)]" />
                    <h3 className="text-4xl font-black text-white mb-2 leading-none uppercase tracking-tighter">PROTOCOLS ONLINE</h3>
                    <p className="text-sky-100/60 text-center text-lg mb-6 font-mono tracking-tighter">Connection established with the digital nervous system.</p>
                    <div className="w-full h-1.5 bg-sky-950 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-400 animate-pulse-fast" style={{ width: '100%' }} />
                    </div>
                </div>
            ), { duration: 3000 });
            setTimeout(() => {
                const params = new URLSearchParams(window.location.search);
                const returnUrl = params.get('returnUrl');
                window.location.href = returnUrl ? decodeURIComponent(returnUrl) : '/';
            }, 1000);
        } catch (error: any) {
            const status = error.response?.status;
            if (!silent) {
                if (status === 503) {
                    toast.custom((t) => (
                        <div className="flex flex-col items-center justify-center w-[500px] bg-[#000]/95 backdrop-blur-3xl border-2 border-orange-500/50 rounded-3xl p-10 shadow-[0_0_100px_rgba(249,115,22,0.4)] animate-in zoom-in-95 duration-300 relative">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.1),transparent_70%)]" />
                            <ShieldAlert className="w-24 h-24 text-orange-500 mb-6 animate-pulse" />
                            <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">ACCESO_DENEGADO</h2>
                            <div className="h-1 w-24 bg-orange-500 mb-6" />
                            <p className="text-slate-400 text-center font-mono text-sm leading-relaxed mb-8 uppercase tracking-widest">El núcleo está en fase de auto-sanación. Protocolos de mantenimiento activos.</p>
                        </div>
                    ), { duration: 5000 });
                } else if (status === 401) {
                    toast.custom((t) => (
                        <div className="flex flex-col items-center justify-center w-[450px] bg-[#020617]/95 backdrop-blur-3xl border border-blue-500/40 rounded-3xl p-8 shadow-[0_0_80px_rgba(59,130,246,0.4)] animate-in zoom-in-95 duration-300 uppercase tracking-widest font-black">
                            <Lock className="w-16 h-16 text-blue-400 mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                            <h3 className="text-2xl text-white mb-2">IDENTIFICACIÓN</h3>
                            <p className="text-blue-200/50 text-center mb-6 text-xs italic tracking-tighter uppercase italic">Handshake Protocol: [PENDING]</p>
                            <div className="w-full h-1 bg-blue-900/30 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 animate-[loading_1.5s_ease-in-out_infinite]" />
                            </div>
                        </div>
                    ));
                    setTimeout(() => { window.location.href = '/login'; }, 1500);
                } else {
                    toast.error("ERROR CRÍTICO: Núcleo no responde");
                }
            }
        } finally {
            if (!silent) setIsChecking(false);
        }
    };

    return (
        <div className="h-screen bg-[#010101] text-white flex items-center justify-center p-0 relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-white cursor-default">

            {/* GOD-MODE BACKGROUND DEPTH */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#0c4a6e_0%,transparent_40%)] opacity-30" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,#064e3b_0%,transparent_40%)] opacity-30" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />

                {/* Horizontal Pulse Line */}
                <motion.div
                    animate={{ y: [0, 1000], opacity: [0, 1, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-0"
                />
            </div>

            {/* SCANLINE EFFECT */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,160,0.06))] bg-[length:100%_2px,3px_100%] animate-scanline" />

            <div className="w-full h-full min-h-screen relative z-20 flex flex-col lg:flex-row">

                {/* LEFT: ENHANCED ROBOT LANE WITH HUD */}
                <div className="lg:w-2/5 h-48 lg:h-full relative overflow-hidden border-b lg:border-r border-white/10 bg-black/40 backdrop-blur-3xl flex flex-col pt-8">
                    <div className="px-12 mb-8 hidden lg:block">
                        <div className="flex items-center gap-3 text-emerald-400 uppercase tracking-[0.5em] font-black text-[12px] neon-text">
                            <Activity className="h-5 w-5 animate-pulse" />
                            DEPLOYMENT_SQUAD
                        </div>
                        <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500/50 via-white/10 to-transparent" />
                    </div>

                    <div className="flex-1 relative mask-pro overflow-hidden">
                        <motion.div
                            className="flex flex-col gap-12 lg:gap-20 py-10"
                            animate={{ y: [0, -1800] }}
                            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                        >
                            {[...ROBOT_IMAGES, ...ROBOT_IMAGES, ...ROBOT_IMAGES].map((img, idx) => (
                                <div key={idx} className="flex justify-center px-10 group transform transition-all duration-700 hover:scale-105">
                                    <div className="relative w-48 h-48 lg:w-[240px] lg:h-[240px]">
                                        {/* Robot HUD Frame */}
                                        <div className="absolute -inset-4 border border-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500 opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-x-4 group-hover:-translate-y-4" />
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-4 group-hover:translate-y-4" />

                                        <div className="relative w-full h-full rounded-none skew-x-[-2deg] bg-white/[0.02] border border-white/5 p-8 flex items-center justify-center overflow-hidden transition-all group-hover:bg-emerald-500/[0.03] group-hover:border-emerald-500/20">
                                            <div className="absolute inset-0 bg-scanlines opacity-20" />
                                            <img
                                                src={img}
                                                alt="Bot"
                                                className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform duration-1000 group-hover:scale-110"
                                            />
                                            <div className="absolute bottom-4 left-4 font-mono text-[8px] text-emerald-500/40 tracking-[0.3em]">UNIT_{idx % 100}</div>
                                            <div className="absolute top-4 right-4 animate-pulse"><Eye className="h-3 w-3 text-emerald-500/20" /></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* RIGHT: GOD-MODE BRANDING & TERMINAL */}
                <div className="flex-1 flex flex-col justify-center p-6 lg:p-12 lg:pl-16 space-y-6">

                    {/* SYSTEM ALERT BADGE */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                            <ShieldAlert className="w-8 h-8 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-black tracking-[0.4em] text-amber-500/60 uppercase">ALERTA_DE_SISTEMA</h4>
                            <div className="text-2xl font-mono font-black text-white italic tracking-tighter uppercase whitespace-nowrap">Mantenimiento_De_Elite_En_Progreso</div>
                        </div>
                    </motion.div>

                    {/* HERO BRANDING AREA */}
                    <div className="flex flex-col lg:flex-row items-center lg:items-end gap-8">
                        {/* HOLOGRAPHIC LOGO RING */}
                        <div className="relative w-40 h-40 lg:w-52 lg:h-52 shrink-0 perspective-1000 group">
                            <motion.div
                                animate={{ rotateX: [0, 10, 0], rotateY: [0, 15, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="w-full h-full relative"
                            >
                                <div className="absolute inset-0 rounded-full border-[12px] border-white/5 opacity-50" />
                                <div className="absolute inset-4 rounded-full border-2 border-emerald-500/20 p-8 flex items-center justify-center bg-black/40 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                                    {config?.logo ? (
                                        <img
                                            src={config.logo}
                                            alt={config.hospitalName}
                                            className={cn(
                                                "max-w-full max-h-full object-contain filter brightness-125 transition-transform duration-700 group-hover:scale-110",
                                                logoType !== 'light' && "invert brightness-200"
                                            )}
                                        />
                                    ) : (
                                        <Cpu className="w-16 h-16 text-emerald-500/20 animate-spin-slow" />
                                    )}
                                </div>
                                {/* HUD Orbitals */}
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -inset-4 border border-dashed border-emerald-500/20 rounded-full" />
                            </motion.div>
                        </div>

                        {/* HIGH-END NAME TYPOGRAPHY */}
                        <div className="space-y-4 flex flex-col items-center lg:items-start text-center lg:text-left">
                            <div className="relative py-4 lg:py-6">
                                <h1 className="text-5xl lg:text-[80px] font-black leading-none tracking-[-0.08em] flex flex-wrap justify-center lg:justify-start items-baseline gap-x-4 lg:gap-x-6">
                                    <span
                                        className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] glitch-text relative inline-block py-2 px-10 uppercase"
                                        data-text={config?.hospitalName?.split(' ')[0] || "EDICAREX"}
                                    >
                                        {config?.hospitalName?.split(' ')[0] || "EDICAREX"}
                                    </span>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-600 block lg:inline italic text-3xl lg:text-6xl py-2 uppercase leading-none">
                                        {config?.hospitalName?.split(' ').slice(1).join(' ') || "ENTERPRISE"}
                                    </span>
                                </h1>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-[9px] font-mono font-bold text-white/40 rounded tracking-widest uppercase">
                                    <Terminal className="h-3 w-3" />
                                    Node_Identity: <span className="text-emerald-400">#EDI-GOD-77</span>
                                </div>
                                <div className="h-[1px] w-48 bg-gradient-to-r from-emerald-500/40 to-transparent" />
                            </div>
                        </div>
                    </div>

                    {/* CYBER-TERMINAL LOG & MESSAGE */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-full max-w-6xl">
                        {/* TERMINAL BOX */}
                        <div className="bg-black/80 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col group hover:border-emerald-500/30 transition-colors">
                            <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/10">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                                </div>
                                <div className="text-[10px] font-mono text-white/30 tracking-[0.5em] uppercase">TERMINAL_OUTPUT</div>
                            </div>
                            <div className="p-4 lg:p-6 h-40 lg:h-48 font-mono text-[10px] leading-relaxed space-y-1 overflow-hidden pointer-events-none">
                                <AnimatePresence>
                                    {logs.map((log, i) => (
                                        <motion.div
                                            key={log + i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={cn(
                                                "flex gap-4",
                                                i === 0 ? "text-emerald-400 font-bold" : "text-white/40"
                                            )}
                                        >
                                            <span className="shrink-0 text-white/20">{">"}</span>
                                            <span>{log}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* AUTHORITY BOX */}
                        <div className="flex flex-col justify-center space-y-6">
                            <p className="text-xl lg:text-3xl font-light text-slate-400 leading-tight">
                                Arquitectura digital bajo supervisión del <br />
                                <span className="text-emerald-400 font-black tracking-tight border-b-4 border-emerald-500/20 italic">Ing. Edisson Paricahua</span>.
                            </p>

                            <div className="flex items-center gap-10">
                                <div className="space-y-1">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Optimización_Global</div>
                                    <div className="text-white font-black text-2xl flex items-center gap-3">
                                        <RefreshCw className="h-6 w-6 text-emerald-500 animate-spin-slow" />
                                        98.4%
                                    </div>
                                </div>
                                <div className="h-10 w-[1px] bg-white/10" />
                                <div className="space-y-1">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Canal_Soporte</div>
                                    <div className="text-white font-mono text-sm tracking-tighter">
                                        {config?.email || "edicarex@support.com"}
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={() => checkStatus()}
                                disabled={isChecking}
                                className="group relative bg-white text-black hover:bg-emerald-400 hover:text-black transition-all px-10 py-6 rounded-full font-black text-xl uppercase tracking-[0.2em] shadow-[0_30px_60px_rgba(255,255,255,0.15)] overflow-hidden scale-100 hover:scale-105 active:scale-95 transition-transform"
                            >
                                <span className="relative z-10 flex items-center gap-6">
                                    {isChecking ? <RefreshCw className="h-8 w-8 animate-spin" /> : <Zap className="h-8 w-8 fill-current" />}
                                    {isChecking ? "INICIALIZANDO..." : "SOLICITAR ACCESO"}
                                </span>
                                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/10 group-hover:bg-black/20" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <InstitutionalFooter />

            <Toaster position="top-center" richColors />

            <style>{`
                .neon-text { text-shadow: 0 0 15px rgba(16,185,129,0.6); }
                .mask-pro { mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent); }
                .animate-spin-slow { animation: spin 15s linear infinite; }
                .bg-scanlines { background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.1) 50%), linear-gradient(90deg, rgba(255,0,0,0.03), rgba(0,255,0,0.01), rgba(0,0,160,0.03)); background-size: 100% 2px, 3px 100%; }
                
                .glitch-text { position: relative; }
                .glitch-text::before, .glitch-text::after {
                    content: attr(data-text);
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    opacity: 0.8;
                }
                .glitch-text::before { color: #10b981; z-index: -1; animation: glitch-1 3s infinite; }
                .glitch-text::after { color: #3b82f6; z-index: -2; animation: glitch-2 3s infinite; }

                @keyframes glitch-1 {
                    0% { transform: translate(0); }
                    20% { transform: translate(-3px, 1px); }
                    40% { transform: translate(-3px, -1px); }
                    60% { transform: translate(3px, 1px); }
                    80% { transform: translate(3px, -1px); }
                    100% { transform: translate(0); }
                }
                @keyframes glitch-2 {
                    0% { transform: translate(0); }
                    20% { transform: translate(3px, -1px); }
                    40% { transform: translate(3px, 1px); }
                    60% { transform: translate(-3px, -1px); }
                    80% { transform: translate(-3px, 1px); }
                    100% { transform: translate(0); }
                }

                @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-pulse-fast { animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes scanline { 0% { background-position: 0 0; } 100% { background-position: 0 100%; } }
                .animate-scanline { animation: scanline 8s linear infinite; }
            `}</style>
        </div >
    );
}

const Loader2 = ({ className }: { className?: string }) => (
    <div className={cn("inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]", className)} role="status">
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)] text-white">Loading...</span>
    </div>
);
