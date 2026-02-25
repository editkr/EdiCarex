import { useOrganization } from '@/contexts/OrganizationContext';
import { cn } from '@/lib/utils';
import { MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface InstitutionalFooterProps {
    className?: string;
    variant?: 'dark' | 'light' | 'glass';
}

export function InstitutionalFooter({ className, variant = 'glass' }: InstitutionalFooterProps) {
    const { config } = useOrganization();

    if (!config) return null;

    const { address, phone, email, openingHours } = config;

    // Dynamic Hours Logic
    const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayKey = daysMap[new Date().getDay()];
    const todayConfig = openingHours?.[currentDayKey];

    const isCurrentlyOpen = () => {
        if (!todayConfig?.enabled || !todayConfig?.open || !todayConfig?.close) return false;

        const now = new Date();
        const [openH, openM] = todayConfig.open.split(':').map(Number);
        const [closeH, closeM] = todayConfig.close.split(':').map(Number);

        const openDate = new Date(now);
        openDate.setHours(openH, openM, 0);

        const closeDate = new Date(now);
        closeDate.setHours(closeH, closeM, 0);

        return now >= openDate && now <= closeDate;
    };

    const openStatus = isCurrentlyOpen();
    const scheduleLabel = todayConfig?.enabled
        ? `${todayConfig.open} - ${todayConfig.close}`
        : 'Cerrado Hoy';

    // CENTERED FLOATING TELEMETRY (BORDERLESS DESIGN)
    return (
        <div className={cn(
            "fixed bottom-8 left-0 right-0 flex justify-center items-center pointer-events-none z-50 px-4",
            className
        )}>
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "circOut" }}
                className="flex flex-col md:flex-row items-center gap-8 md:gap-12 pointer-events-auto"
            >
                {/* LOCATION SEGMENT */}
                {address && (
                    <div className="flex flex-col items-center md:items-start group">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-[1px] w-2 bg-emerald-500/30 group-hover:w-4 group-hover:bg-emerald-400 transition-all duration-500" />
                            <span className="text-[7px] font-black text-emerald-500/40 uppercase tracking-[0.4em] font-mono">Sede_Física</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <MapPin className="h-3 w-3 text-white/10 group-hover:text-emerald-400/80 transition-colors duration-500" />
                            <span className={cn(
                                "text-[10px] font-mono uppercase tracking-[0.2em] font-semibold transition-all duration-500 text-shadow-sm",
                                variant === 'light' ? "text-slate-500 group-hover:text-slate-900" : "text-white/40 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            )}>
                                {address}
                            </span>
                        </div>
                    </div>
                )}

                {/* COMMS SEGMENT */}
                {phone && (
                    <div className="flex flex-col items-center md:items-start group">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-[1px] w-2 bg-emerald-500/30 group-hover:w-4 group-hover:bg-emerald-400 transition-all duration-500" />
                            <span className="text-[7px] font-black text-emerald-500/40 uppercase tracking-[0.4em] font-mono">Contacto_Directo</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <Phone className="h-3 w-3 text-white/10 group-hover:text-emerald-400/80 transition-colors duration-500" />
                            <span className={cn(
                                "text-[10px] font-mono tracking-[0.25em] font-semibold transition-all duration-500 text-shadow-sm",
                                variant === 'light' ? "text-slate-500 group-hover:text-slate-900" : "text-white/40 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            )}>
                                {phone}
                            </span>
                        </div>
                    </div>
                )}

                {/* SUPPORT SEGMENT */}
                {email && (
                    <div className="flex flex-col items-center md:items-start group border-l border-white/5 pl-8 md:border-none md:pl-0">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-[1px] w-2 bg-emerald-500/30 group-hover:w-4 group-hover:bg-emerald-400 transition-all duration-500" />
                            <span className="text-[7px] font-black text-emerald-500/40 uppercase tracking-[0.4em] font-mono">Soporte_Técnico</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <Mail className="h-3 w-3 text-white/10 group-hover:text-emerald-400/80 transition-colors duration-500" />
                            <span className={cn(
                                "text-[10px] font-mono lowercase tracking-[0.15em] font-semibold transition-all duration-500 text-shadow-sm",
                                variant === 'light' ? "text-slate-500 group-hover:text-slate-900" : "text-white/40 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            )}>
                                {email}
                            </span>
                        </div>
                    </div>
                )}

                {/* STATUS INDICATOR (REAL-TIME STATUS) */}
                <div className="hidden lg:flex items-center gap-6 border-l border-white/10 pl-8 ml-4">
                    <div className="flex flex-col items-end group">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[6px] font-black text-white/10 uppercase tracking-[0.6em] group-hover:text-white/30 transition-colors">Sistema_Operativo</span>
                            <div className={cn(
                                "h-1 w-1 rounded-full animate-pulse",
                                openStatus ? "bg-emerald-500 shadow-[0_0_5px_#10b981]" : "bg-red-500 shadow-[0_0_5px_#ef4444]"
                            )} />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ x: [-48, 48] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className={cn(
                                        "h-full w-6 shadow-lg",
                                        openStatus ? "bg-emerald-500/40 shadow-emerald-500/20" : "bg-red-500/40 shadow-red-500/20"
                                    )}
                                />
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest font-mono",
                                openStatus ? "text-emerald-500/60" : "text-red-500/60"
                            )}>
                                {openStatus ? 'Abierto' : 'Cerrado'}
                            </span>
                        </div>
                        {todayConfig?.enabled && (
                            <span className="text-[7px] font-mono text-white/20 mt-1 tracking-widest uppercase">
                                Hoy: {scheduleLabel}
                            </span>
                        )}
                    </div>
                    <ShieldCheck className={cn(
                        "h-4 w-4 transition-colors duration-1000",
                        openStatus ? "text-emerald-500/20" : "text-red-500/20"
                    )} />
                </div>
            </motion.div>
        </div>
    );
}
