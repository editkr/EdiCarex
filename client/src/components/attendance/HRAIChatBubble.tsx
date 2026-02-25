import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Sparkles, Loader2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { aiAPI } from '@/services/api'
import { cn } from '@/lib/utils'
import { useOrganization } from '@/contexts/OrganizationContext'

const MODEL_DISPLAY_NAMES: Record<string, string> = {
    'llama-3.3-70b-versatile': 'Meta Llama 3.3 70B (Producción)',
    'llama-3.1-8b-instant': 'Meta Llama 3.1 8B (Instantáneo)',
    'openai/gpt-oss-120b': 'OpenAI GPT OSS 120B (Flagship)',
    'groq/compound': 'Groq Compound (Sistema Agente)',
    'groq/compound-mini': 'Groq Compound Mini',
    'qwen/qwen3-32b': 'Qwen 3 32B (Preview)',
};

export default function HRAIChatBubble() {
    const { config } = useOrganization()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<any[]>([
        {
            role: 'assistant',
            content: 'Bienvenido al **Soporte de RRHH EdiCarex**. Puedo asistirle en la gestión de **Turnos, Marcaciones, Listado de Personal y Nómina**. ¿En qué área de capital humano desea profundizar hoy?',
            timestamp: new Date(),
        },
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            })
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const adminName = user.firstName ? `${user.firstName} ${user.lastName}` : 'Administrador'

        const userMsg = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            const response = await aiAPI.chat({
                message: input,
                context: `HR & Attendance Assistant. User: ${adminName}. Role: ${user.role || 'HR Admin'}`
            })

            const aiMsg = {
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date(),
                source: response.data.source,
                model: response.data.model
            }

            setMessages(prev => [...prev, aiMsg])
        } catch (error) {
            console.error('AI HR Chat Error:', error)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Lo siento, ha ocurrido un error técnico en el módulo de RRHH. ¿Podría intentar de nuevo?',
                timestamp: new Date(),
            }])
        } finally {
            setIsLoading(false)
        }
    }

    if (!config?.ai?.enabled || !config?.ai?.features?.hrAssistant) return null

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 w-[420px] h-[600px] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-cyan-500/30 dark:border-cyan-400/20 rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col"
                    >
                        {/* Header: Unified EdiCarex Pro Style */}
                        <div className="bg-gradient-to-br from-cyan-600 via-sky-700 to-indigo-800 p-5 text-white flex items-center justify-between relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner group transition-all duration-500 hover:bg-white/20 p-0">
                                    <img src="/assets/logoIA.png" alt="EdiCarex AI" className="h-24 w-24 object-contain group-hover:scale-110 transition-transform" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight tracking-tight">Inteligencia EdiCarex</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_8px_#67e8f9]" />
                                        <span className="text-[10px] font-bold text-cyan-50 uppercase tracking-[0.1em]">Executive Sync Active</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:bg-white/10 rounded-full h-10 w-10 transition-colors relative z-10"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        {/* Chat Area */}
                        <ScrollArea className="flex-1 p-5 bg-zinc-50/30 dark:bg-zinc-950/10">
                            <div className="space-y-5 pr-3" ref={scrollRef}>
                                {messages.map((m, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        key={idx}
                                        className={cn(
                                            "flex flex-col max-w-[92%] gap-2",
                                            m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-4 rounded-3xl text-[13px] leading-relaxed shadow-sm",
                                            m.role === 'user'
                                                ? "bg-cyan-600 text-white rounded-br-none shadow-cyan-900/10"
                                                : "bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-bl-none text-zinc-800 dark:text-zinc-200"
                                        )}>
                                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-0.5">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {m.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 px-2">
                                            <span className="text-[10px] text-zinc-400 font-medium tracking-wide">
                                                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {m.role === 'assistant' && (
                                                <>
                                                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                                    <div className="flex items-center gap-1.5 grayscale opacity-70">
                                                        <Sparkles className="h-2.5 w-2.5 text-cyan-500" />
                                                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                                                            {MODEL_DISPLAY_NAMES[m.model] || m.model || 'Executive AI'}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-4 rounded-3xl rounded-bl-none shadow-sm flex items-center gap-3">
                                            <div className="flex gap-1">
                                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Analizando...</span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-5 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-sky-600 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500" />
                                <Input
                                    placeholder="Consultar recursos humanos..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    className="relative pr-14 h-14 bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-2xl text-[14px] placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                />
                                <Button
                                    size="icon"
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    className="absolute right-2 top-2 h-10 w-10 bg-cyan-600 hover:bg-cyan-700 rounded-xl shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="flex items-center justify-between mt-3 px-1">
                                <div className="flex items-center gap-1.5">
                                    <Shield className="h-3 w-3 text-cyan-600/50" />
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.15em]">HR Operations</span>
                                </div>
                                <span className="text-[9px] text-zinc-400 font-medium italic">EdiCarex HR Core</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
            >
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-1 -right-1 h-4 w-4 bg-cyan-500 rounded-full border-2 border-white dark:border-zinc-950 z-10"
                    />
                )}
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "h-20 w-20 rounded-[1.5rem] shadow-[0_15px_40px_rgba(8,145,178,0.4)] transition-all duration-500 overflow-hidden p-0",
                        isOpen
                            ? "bg-zinc-950 border-zinc-800 text-white rotate-90"
                            : "bg-gradient-to-br from-cyan-500 to-sky-700 text-white hover:shadow-[0_20px_50px_rgba(8,145,178,0.6)]"
                    )}
                >
                    {isOpen ? (
                        <X className="h-7 w-7" />
                    ) : (
                        <div className="relative flex items-center justify-center w-full h-full">
                            <img src="/assets/logoIA.png" alt="AI" className="h-20 w-20 object-contain relative z-10" />
                            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
                        </div>
                    )}
                </Button>
            </motion.div>
        </div>
    )
}
