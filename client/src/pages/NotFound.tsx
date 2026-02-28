import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />

            <div className="max-w-md w-full text-center space-y-8">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center"
                >
                    <div className="h-24 w-24 rounded-2xl bg-destructive/10 flex items-center justify-center border border-destructive/20 relative">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full"
                        />
                    </div>
                </motion.div>

                <div className="space-y-2">
                    <h1 className="text-6xl font-black text-foreground tracking-tighter">404</h1>
                    <h2 className="text-2xl font-bold text-foreground italic uppercase tracking-tight">Página No Encontrada</h2>
                    <p className="text-muted-foreground font-medium">
                        Lo sentimos, la sección que intentas buscar no existe o ha sido movida dentro del sistema.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button asChild className="bg-primary hover:opacity-90 text-white font-bold uppercase py-6 h-auto">
                        <Link to="/dashboard">
                            <Home className="mr-2 h-5 w-5" />
                            Regresar al Dashboard
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => window.history.back()}
                        className="text-muted-foreground font-bold uppercase hover:bg-accent"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Volver Atrás
                    </Button>
                </div>

                <div className="pt-8 border-t border-border">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                        C.S. JORGE CHÁVEZ · SISTEMA DE GESTIÓN I-3
                    </p>
                </div>
            </div>
        </div>
    )
}
