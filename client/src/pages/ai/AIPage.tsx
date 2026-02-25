import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Send,
    Loader2,
    TrendingUp,
    Activity,
    MessageSquare,
    AlertTriangle,
    Sparkles,
    FileSignature,
    ClipboardCheck,
    ClipboardList,
    FileText,
    Pill,
    Download,
    ArrowLeft,
    Database,
    Zap,
    Target,
    Clock,
    ChevronRight,
    ChevronDown,
    Users,
    Search,
    History as HistoryIcon,
    CloudRain,
    Copy,
    Check,
    Brain,
    Mic,
    ShieldCheck,
    FileSearch,
    BadgeAlert,
    Plus,
    User,
    Stethoscope,
    Pencil,
    Trash2
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { aiAPI, analyticsAPI, adminAPI, patientsAPI, auditAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useAuthStore } from '@/stores/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

const MODEL_DISPLAY_NAMES: Record<string, string> = {
    'llama-3.3-70b-versatile': 'Meta Llama 3.3 70B (Producción)',
    'llama-3.1-8b-instant': 'Meta Llama 3.1 8B (Instantáneo)',
    'openai/gpt-oss-120b': 'OpenAI GPT OSS 120B (Flagship)',
    'groq/compound': 'Groq Compound (Sistema Agente)',
    'groq/compound-mini': 'Groq Compound Mini',
    'qwen/qwen3-32b': 'Qwen 3 32B (Preview)',
};

const RESOURCES_CONFIG: Record<string, { label: string, icon: any, color: string, bg: string }> = {
    'TRIAGE': { label: 'Triaje Manchester', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    'DOCUMENT GENERATION': { label: 'Generador Clínico', icon: FileSignature, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    'DOCUMENT_GENERATION': { label: 'Generador Clínico', icon: FileSignature, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    'STRATEGIC ANALYTICS': { label: 'Análisis Estratégico', icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    'STRATEGIC_ANALYTICS': { label: 'Análisis Estratégico', icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    'CHAT_ASSISTANT': { label: 'Asistente Médico', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    'CHAT': { label: 'Asistente Médico', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    'SUMMARIZATION': { label: 'Resumen Clínico', icon: ClipboardList, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    'PHARMACY PREDICTION': { label: 'Predicción Farmacia', icon: Pill, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    'AI_SETTINGS': { label: 'Motor IA (System)', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    'ANALYTICS': { label: 'Análisis Estratégico', icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    'Chat': { label: 'Asistente Médico', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    'Triage': { label: 'Triaje Manchester', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    'Document Generation': { label: 'Generador Clínico', icon: FileSignature, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    'Summarization': { label: 'Resumen Clínico', icon: ClipboardList, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    'Strategic Analytics': { label: 'Análisis Estratégico', icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
};

const parseLogChanges = (changes: any) => {
    if (!changes) return {};
    if (typeof changes === 'object') return changes;
    try {
        return JSON.parse(changes);
    } catch (e) {
        return {};
    }
};

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    source?: string
    model?: string
}

export default function AIPage() {
    const [loading, setLoading] = useState(false)
    const { config } = useOrganization()
    const aiConfig = config?.ai as any

    // Dynamic initial tab based on enabled features
    const getInitialTab = () => {
        if (aiConfig?.features?.triage !== false) return 'triaje'
        if (aiConfig?.features?.documentGenerator !== false) return 'generator'
        if (aiConfig?.features?.staffAssistant !== false) return 'chat'
        if (aiConfig?.features?.predictiveAnalytics !== false) return 'analytics'
        return 'triaje'
    }

    const [activeTab, setActiveTab] = useState(getInitialTab())
    const { toast } = useToast()

    // Triage State
    const [symptoms, setSymptoms] = useState('')
    const [triageResult, setTriageResult] = useState<{
        priority: any;
        category: string;
        recommendations: string[];
        confidence: number;
        analysis: string;
        model?: string;
    } | null>(null)
    const [analyzingTriage, setAnalyzingTriage] = useState(false)

    // Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const { user } = useAuthStore()
    const [chatInput, setChatInput] = useState('')
    const [sendingMessage, setSendingMessage] = useState(false)

    // Document Generator State
    const [docType, setDocType] = useState('Receta Médica')
    const [generatingDoc, setGeneratingDoc] = useState(false)
    const [generatedDoc, setGeneratedDoc] = useState<string | null>(null)
    const [docNotes, setDocNotes] = useState('')
    const [patients, setPatients] = useState<any[]>([])
    const [selectedPatient, setSelectedPatient] = useState<any>(null)
    const [copied, setCopied] = useState(false)
    const [aiStats, setAiStats] = useState({
        totalQueries: 0,
        avgLatency: 0,
        confidenceScore: 0,
        activeNodes: 0,
        isSecurityActive: false,
        realLoad: 0,
        realTokens: 0
    })
    const [aiActivity, setAiActivity] = useState<any[]>([])
    const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [activityToDelete, setActivityToDelete] = useState<string | null>(null)

    const handleCopyToClipboard = async () => {
        if (!generatedDoc) return;
        try {
            await navigator.clipboard.writeText(generatedDoc);
            setCopied(true);
            toast({ title: "Copiado", description: "Documento copiado al portapapeles." });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Error al copiar: ", err);
        }
    };

    const handleExportPDF = () => {
        if (!generatedDoc) return;

        const doc = new jsPDF();
        const hospitalName = (config?.hospitalName || "EDICAREX CLINIC").toUpperCase();
        const patientName = selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "PACIENTE ANÓNIMO";
        const dateStr = new Date().toLocaleDateString();
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Helper para limpiar markdown
        const cleanText = (text: string) => {
            return text
                .replace(/[#*`]/g, '') // Eliminar #, *, `
                .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Limpiar links
                .trim();
        };

        const primaryColor = [79, 70, 229]; // Indigo 600
        const textColor = [31, 41, 55]; // Zinc 800
        const accentColor = [16, 185, 129]; // Emerald 500

        // --- STYLED HEADER ---
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text(hospitalName, 20, 22);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("CENTRO DE INTELIGENCIA CLÍNICA AVANZADA", 20, 28);

        // Document Type Badge in Header
        doc.setFillColor(255, 255, 255, 0.2);
        doc.roundedRect(150, 10, 45, 15, 2, 2, 'F');
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(docType.toUpperCase(), 172.5, 20, { align: 'center' });

        // --- PATIENT INFO BOX ---
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, 45, 180, 25, 2, 2, 'F');

        const drawInfoField = (label: string, value: string, x: number, y: number) => {
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(148, 163, 184);
            doc.text(label.toUpperCase(), x, y);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(value, x, y + 5);
        };

        drawInfoField("Paciente", patientName, 25, 53);
        drawInfoField("ID/DNI", selectedPatient?.documentId || "NO REGISTRADO", 90, 53);
        drawInfoField("Fecha Emisión", `${dateStr} - ${timeStr}`, 150, 53);

        // --- CONTENT AREA ---
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setLineWidth(0.1);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 38, 195, 38);

        // --- CONTENT BODY ---
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("REPORTE CLÍNICO DETALLADO", 15, 85);

        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setLineWidth(1);
        doc.line(15, 87, 30, 87);

        doc.setFont("times", "italic");
        doc.setFontSize(11);
        doc.setTextColor(55, 65, 81);
        const processedContent = cleanText(generatedDoc);
        const splitText = doc.splitTextToSize(processedContent, 170);
        doc.text(splitText, 20, 98, { lineHeightFactor: 1.5 });

        // --- FOOTER & SIGNATURE ---
        const pageHeight = doc.internal.pageSize.height;

        // Footer Bar
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, pageHeight - 15, 210, 15, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`${hospitalName} | VALIDADO POR SISTEMA CUÁNTICO IA`, 105, pageHeight - 7, { align: 'center' });

        // Signature
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(20, pageHeight - 40, 80, pageHeight - 40);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text("FIRMA MÉDICA DIGITAL", 20, pageHeight - 35);
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.text("IA AUDITED: OK", 20, pageHeight - 31);

        doc.save(`${docType}_${patientName.replace(/\s+/g, '_')}.pdf`);
        toast({ title: "PDF Generado", description: "El documento ha sido exportado exitosamente con formato clínico." });
    };

    const handleGenerateDoc = async () => {
        try {
            setGeneratingDoc(true)
            const response = await aiAPI.generateText({
                template_type: docType,
                patient_data: selectedPatient ? {
                    name: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
                    age: selectedPatient.age || 35,
                    diagnosis: selectedPatient.medicalHistory?.[0]?.diagnosis || 'Evaluación General',
                    documentId: selectedPatient.documentId
                } : { name: 'Paciente Manuel', age: 45, diagnosis: 'Hipertensión tipo 1' },
                additional_notes: docNotes
            })
            setGeneratedDoc(response.data.generated_text)
            toast({ title: 'Documento Generado', description: `La IA ha redactado el documento para ${selectedPatient ? selectedPatient.firstName : 'el paciente'}.` })
        } catch (error) {
            toast({
                title: 'Error de IA',
                description: 'No se pudo generar el documento.',
                variant: 'destructive'
            })
        } finally {
            setGeneratingDoc(false)
        }
    }

    // Predictions Data
    const [predictions, setPredictions] = useState<{
        saturation: any[];
        demand: any[];
        categories: any[];
        insight?: any;
        model?: string;
    }>({
        saturation: [],
        demand: [],
        categories: [],
    })

    useEffect(() => {
        loadPredictions()
    }, [])

    const loadPredictions = async () => {
        try {
            setLoading(true)

            const fetchSafe = async (fn: any, fallback: any = { data: [] }) => {
                try {
                    return await fn();
                } catch (e) {
                    console.warn(`[AI System] Partial data load:`, e);
                    return fallback;
                }
            };

            const [
                saturationRes,
                capacityRes,
                categoriesRes,
                patientsRes,
                auditRes,
                healthRes
            ] = await Promise.all([
                fetchSafe(() => analyticsAPI.getSaturation()),
                fetchSafe(() => analyticsAPI.getCapacity()),
                fetchSafe(() => adminAPI.getServicesByCategory()),
                fetchSafe(() => patientsAPI.getAll({ limit: 10 }), { data: { data: [] } }),
                fetchSafe(() => auditAPI.getAll({ limit: 12, resource: 'AI', _t: Date.now() }), { data: { data: [], meta: { total: 0 } } }),
                fetchSafe(() => adminAPI.getSystemHealth())
            ])
            const totalInDB = auditRes.data.meta?.total || auditRes.data.total || 0;

            // Transform API data for charts
            const saturationData = Array.isArray(saturationRes.data) ? saturationRes.data : []

            // Set patients for selector
            setPatients(patientsRes.data.data || [])
            setAiActivity(auditRes.data.data || [])

            // Real metrics from system health and audit
            const healthData = Array.isArray(healthRes.data) ? healthRes.data : []
            const aiEngine = healthData.find((s: any) => s.id === 'ai-engine')
            const activeNodesCount = healthData.filter((s: any) => s.status === 'OPERATIONAL').length

            const demandData = Array.isArray(capacityRes.data) ? capacityRes.data.map((item: any) => {
                const booked = Number(item.booked || 0);
                const walkins = Number(item.walkins || 0);
                return {
                    day: item.day,
                    actual: booked,
                    predicted: booked + walkins,
                    confidence: item.confidence || 0
                };
            }) : []

            const categoriesData = Array.isArray(categoriesRes.data) ? categoriesRes.data.map((cat: any) => ({
                category: cat.category || cat.name || 'General',
                count: cat._count || cat.count || 0,
                trend: (cat._count || cat.count || 0) > 20 ? 'ascendente' : 'estable',
                confidence: cat.confidence || 0
            })) : []

            let aiStrategicInsight = null;
            if (aiConfig?.enabled && aiConfig?.features?.predictiveAnalytics) {
                try {
                    const aiRes = await aiAPI.predictGrowth({
                        history: demandData,
                        categories: categoriesData,
                        saturation: saturationData
                    });
                    aiStrategicInsight = aiRes.data;
                } catch (e) {
                    console.warn("[AI Debug] Analytics insight failed: ", e);
                }
            }

            // Parse real AI metadata from health engine message
            let realLoadValue = 0;
            let realTokensValue = 0;
            let isSecurityActiveValue = false;

            if (aiEngine?.message) {
                try {
                    const meta = JSON.parse(aiEngine.message);
                    realLoadValue = meta.load || 0;
                    realTokensValue = meta.tokens || 0;
                    isSecurityActiveValue = !!meta.isSecure;
                } catch (e) {
                    isSecurityActiveValue = aiEngine.message === 'GUARDRAILS_ACTIVE';
                }
            }

            setAiStats({
                totalQueries: totalInDB as number,
                avgLatency: (aiEngine?.latency || 0) as number,
                confidenceScore: aiStrategicInsight?.accuracy_score ? Math.round(aiStrategicInsight.accuracy_score * 100) : 0,
                activeNodes: activeNodesCount || 1,
                isSecurityActive: isSecurityActiveValue,
                realLoad: realLoadValue,
                realTokens: realTokensValue
            })

            setPredictions({
                saturation: saturationData,
                demand: demandData,
                categories: categoriesData,
                insight: aiStrategicInsight,
                model: aiStrategicInsight?.model
            })
        } catch (error: any) {
            console.error('[AI Debug] Critical load error:', error)
            toast({
                title: 'Error de Sincronización',
                description: 'No se pudieron actualizar algunas métricas en tiempo real',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleTriageAnalysis = async () => {
        if (!symptoms.trim()) {
            toast({
                title: 'Error',
                description: 'Por favor ingrese los síntomas',
                variant: 'destructive',
            })
            return
        }

        setAnalyzingTriage(true)

        try {
            // Call real AI API
            const response = await aiAPI.triage({
                symptoms: symptoms,
                age: 35, // Default age, could be added as input field
                vitalSigns: {}
            })

            const result = response.data

            // Map priority number to priority object
            const priorities = [
                { level: 1, label: 'EMERGENCIA (ROJO)', color: 'bg-red-600', waitTime: 0, description: 'Atención inmediata requerida' },
                { level: 2, label: 'MUY URGENTE (NARANJA)', color: 'bg-orange-500', waitTime: 10, description: 'Atención necesaria en 10 minutos' },
                { level: 3, label: 'URGENTE (AMARILLO)', color: 'bg-yellow-500', waitTime: 60, description: 'Atención necesaria en 60 minutos' },
                { level: 4, label: 'ESTÁNDAR (VERDE)', color: 'bg-green-600', waitTime: 120, description: 'Atención necesaria en 120 minutos' },
                { level: 5, label: 'NO URGENTE (AZUL)', color: 'bg-blue-600', waitTime: 240, description: 'Puede esperar hasta 4 horas' },
            ]

            const priorityLevel = result.priority || 4
            const priority = priorities[priorityLevel - 1] || priorities[3]

            // Determine category based on symptoms
            let category = 'Medicina General'
            const symptomLower = symptoms.toLowerCase()
            if (symptomLower.includes('pecho') || symptomLower.includes('corazón')) {
                category = 'Cardiología - Emergencia'
            } else if (symptomLower.includes('sangrado') || symptomLower.includes('herida')) {
                category = 'Emergencia'
            } else if (symptomLower.includes('niño') || symptomLower.includes('bebé')) {
                category = 'Pediatría'
            }

            setTriageResult({
                priority,
                category,
                recommendations: result.recommendations || ['Evaluación médica recomendada', 'Monitorear síntomas'],
                confidence: result.confidence ? Math.round(result.confidence * 100) : 85,
                analysis: `Basado en los síntomas proporcionados, la IA ha categorizado este caso como prioridad ${priority.label}. El paciente debe ser atendido ${priority.waitTime === 0 ? 'inmediatamente' : `dentro de ${priority.waitTime} minutos`}.`,
                model: result.model
            })

            toast({
                title: 'Análisis Completo',
                description: `Prioridad: ${priority.label}`,
            })
        } catch (error: any) {
            console.error('Triage error:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al analizar síntomas',
                variant: 'destructive',
            })
        } finally {
            setAnalyzingTriage(false)
            loadPredictions() // Refresh audit history
        }
    }

    const handleLoadActivity = (activity: any) => {
        if (activity.resource !== 'AI' && activity.action !== 'AI') return;

        const changes = activity.changes || {};

        // Tab redirection and state loading
        if (activity.action === 'Triage') {
            setActiveTab('triaje');
            setSymptoms(changes.body?.symptoms || '');
            if (changes.response) {
                setTriageResult({
                    priority: changes.response.priority_obj || { level: changes.response.priority, label: 'Prioridad Recuperada' },
                    category: changes.response.category || 'Recuperado',
                    recommendations: changes.response.recommendations || [],
                    confidence: Math.round((changes.response.confidence || 0) * 100),
                    analysis: changes.response.analysis || 'Análisis recuperado del historial.',
                    model: changes.response.model
                });
            }
        } else if (activity.action === 'Document Generation') {
            setActiveTab('generator');
            setDocType(changes.body?.template_type || 'Receta Médica');
            setDocNotes(changes.body?.additional_notes || '');
            setGeneratedDoc(changes.response?.generated_text || null);
        } else {
            // Default to chat if it's Chat or other AI actions
            setActiveTab('chat');
            const messages: ChatMessage[] = [];

            // Load prompt (from request body)
            const prompt = changes.body?.message || changes.body?.symptoms || changes.body?.text || 'Consulta previa';
            messages.push({
                role: 'user',
                content: prompt,
                timestamp: new Date(activity.createdAt)
            });

            // Load response (from response data)
            if (changes.response?.response || changes.response?.analysis || changes.response?.summary || changes.response?.generated_text) {
                messages.push({
                    role: 'assistant',
                    content: changes.response?.response || changes.response?.analysis || changes.response?.summary || changes.response?.generated_text,
                    timestamp: new Date(activity.createdAt),
                    model: changes.response?.model || changes.model,
                    source: changes.response?.source || 'history'
                });
            }

            setChatMessages(messages);
        }

        toast({
            title: "Historial Cargado",
            description: `Se ha recuperado la consulta del ${new Date(activity.createdAt).toLocaleDateString()}`,
        });
    }

    const handleRenameActivity = async (id: string) => {
        if (!editingName.trim()) return
        try {
            const activity = aiActivity.find(a => a.id === id)
            if (!activity) return

            const updatedChanges = {
                ...(activity.changes || {}),
                customName: editingName
            }

            await auditAPI.update(id, { changes: updatedChanges })
            setAiActivity(prev => prev.map(a => a.id === id ? { ...a, changes: updatedChanges } : a))
            setEditingActivityId(null)
            toast({ title: "Renombrado", description: "Título actualizado correctamente." })
        } catch (error) {
            toast({ title: "Error", description: "No se pudo renombrar el registro.", variant: "destructive" })
        }
    }

    const handleDeleteActivity = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setActivityToDelete(id)
    }

    const confirmDeleteActivity = async () => {
        if (!activityToDelete) return
        try {
            await auditAPI.delete(activityToDelete)
            setAiActivity(prev => prev.filter(a => a.id !== activityToDelete))
            toast({ title: "Eliminado", description: "El registro ha sido removido." })
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el registro.", variant: "destructive" })
        } finally {
            setActivityToDelete(null)
        }
    }

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return

        const userMessage: ChatMessage = {
            role: 'user',
            content: chatInput,
            timestamp: new Date(),
        }

        setChatMessages([...chatMessages, userMessage])
        setChatInput('')
        setSendingMessage(true)

        try {
            // Call real AI Chat API
            const response = await aiAPI.chat({
                message: userMessage.content,
                context: 'Medical consultation'
            })

            const aiMessage: ChatMessage = {
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date(),
                source: response.data.source || 'edicarex-ai',
                model: response.data.model || `EdiCarex ${aiConfig?.model || 'Engine'}`
            }

            setChatMessages(prev => [...prev, aiMessage])
            loadPredictions() // Refresh audit history
        } catch (error: any) {
            console.error('Chat error:', error)
            toast({
                title: 'Error',
                description: 'No se pudo conectar con el asistente médico',
                variant: 'destructive',
            })

            // Fallback message
            setChatMessages(prev => [...prev, {
                role: 'assistant' as const,
                content: 'Lo siento, colega. He tenido un problema técnico al procesar su consulta clínica. ¿Podría intentar de nuevo?',
                timestamp: new Date(),
            }])
        } finally {
            setSendingMessage(false)
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-indigo-600 rounded-lg blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                <div className="relative flex items-center justify-between p-6 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="absolute -inset-2 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                            <div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20 p-0">
                                <img src="/assets/logoIA.png" alt="EdiCarex AI" className="h-40 w-40 object-contain" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-zinc-400">
                                Asistente Médico EdiCarex IA
                            </h1>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                                Sistema inteligente EdiCarex de diagnóstico preliminar y análisis predictivo
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadPredictions}
                            disabled={loading}
                            className="h-7 text-[9px] font-black tracking-widest border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
                        >
                            <Loader2 className={cn("h-3 w-3 mr-1.5", loading && "animate-spin")} />
                            SINCRONIZAR MÉTRICAS
                        </Button>
                        <Badge variant="outline" className={`px-4 py-1.5 text-[10px] font-black tracking-widest ${aiConfig?.enabled ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5' : 'border-zinc-500/30 text-zinc-400 bg-zinc-500/5'} backdrop-blur-md uppercase shadow-lg shadow-indigo-500/10`}>
                            <Zap className={`h-3.5 w-3.5 mr-2 ${aiConfig?.enabled ? 'animate-pulse text-emerald-400' : 'text-zinc-600'}`} />
                            MOTOR ACTIVO: {MODEL_DISPLAY_NAMES[aiConfig?.model] || aiConfig?.model || 'EdiCarex Engine'}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Senior Plus Metrics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-950 border-zinc-900 shadow-xl overflow-hidden relative group transition-all hover:border-indigo-500/50">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <MessageSquare className="h-12 w-12 text-indigo-400" />
                    </div>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <MessageSquare className="h-4 w-4 text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Consultas Totales</span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <h3 className="text-2xl font-black text-white">{aiStats.totalQueries}</h3>
                            <Badge variant="outline" className="text-[8px] border-indigo-500/30 text-indigo-400 bg-indigo-500/5">Total Logs</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950 border-zinc-900 shadow-xl overflow-hidden relative group transition-all hover:border-emerald-500/50">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap className="h-12 w-12 text-emerald-400" />
                    </div>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Zap className="h-4 w-4 text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Latencia Inferencia</span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <h3 className="text-2xl font-black text-white">{aiStats.avgLatency}ms</h3>
                            <Badge variant="outline" className={cn("text-[8px]", aiStats.avgLatency > 0 ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-zinc-800 text-zinc-500 bg-zinc-900/50")}>
                                {aiStats.avgLatency > 0 ? 'Inferencia Real' : 'Estadística Local'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950 border-zinc-900 shadow-xl overflow-hidden relative group transition-all hover:border-amber-500/50">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target className="h-12 w-12 text-amber-400" />
                    </div>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Target className="h-4 w-4 text-amber-400" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confianza Avg</span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <h3 className="text-2xl font-black text-white">{aiStats.confidenceScore}%</h3>
                            <Badge variant="outline" className={cn("text-[8px]", aiStats.confidenceScore > 90 ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-amber-500/30 text-amber-400 bg-amber-500/5")}>
                                {aiStats.confidenceScore > 0 ? 'Análisis Probabilístico' : 'Pendiente Datos'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950 border-zinc-900 shadow-xl overflow-hidden relative group transition-all hover:border-indigo-400/50">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="h-12 w-12 text-indigo-300" />
                    </div>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Clock className="h-4 w-4 text-indigo-300" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Impacto Operativo</span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <h3 className="text-2xl font-black text-white">
                                {aiStats.totalQueries > 0
                                    ? (aiStats.totalQueries * 2 >= 60
                                        ? `${Math.floor((aiStats.totalQueries * 2) / 60)}h ${(aiStats.totalQueries * 2) % 60}m`
                                        : `${aiStats.totalQueries * 2}m`)
                                    : '0m'}
                            </h3>
                            <Badge variant="outline" className="text-[8px] border-indigo-500/30 text-indigo-400 bg-indigo-500/5">Tiempo Ahorrado</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} className="space-y-6" onValueChange={setActiveTab}>
                <TabsList className="bg-zinc-950 border border-zinc-900 rounded-xl p-1 gap-2">
                    {aiConfig?.features?.triage !== false && (
                        <TabsTrigger value="triaje" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            <Activity className="h-4 w-4 mr-2" />
                            Triaje Manchester
                        </TabsTrigger>
                    )}
                    {aiConfig?.features?.documentGenerator !== false && (
                        <TabsTrigger value="generator" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            <FileSignature className="h-4 w-4 mr-2" />
                            Generador Clínico
                        </TabsTrigger>
                    )}
                    {aiConfig?.features?.staffAssistant !== false && (
                        <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Asistente Médico
                        </TabsTrigger>
                    )}
                    {aiConfig?.features?.predictiveAnalytics !== false && (
                        <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Logística & Previsión
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="triaje" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="bg-zinc-950 border-zinc-900 shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500 opacity-50" />
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-emerald-500" />
                                        Evaluación de Síntomas Manchester
                                    </CardTitle>
                                    <CardDescription>
                                        Ingrese los síntomas para una clasificación de triaje profesional dirigida por IA.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Paciente Asociado</span>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
                                                    value={selectedPatient?.id || ''}
                                                    onChange={(e) => setSelectedPatient(patients.find(p => p.id === e.target.value))}
                                                >
                                                    <option value="">Selección anónima / Manual</option>
                                                    {patients.map(p => (
                                                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName} - {p.documentId}</option>
                                                    ))}
                                                </select>
                                                <Users className="absolute right-3 top-3 h-4 w-4 text-zinc-600 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Contexto Clínico</span>
                                            <div className="h-10 px-3 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-center gap-3 w-full">
                                                <div className="flex gap-1">
                                                    <div className={cn("h-1.5 w-1.5 rounded-full", aiStats.isSecurityActive ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-zinc-700")} />
                                                    <div className={cn("h-1.5 w-1.5 rounded-full", aiStats.isSecurityActive ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-zinc-700")} />
                                                    <div className={cn("h-1.5 w-1.5 rounded-full", aiStats.isSecurityActive ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-zinc-700")} />
                                                </div>
                                                <span className="text-[10px] text-zinc-400 font-medium">
                                                    {aiStats.isSecurityActive ? 'Filtro de Seguridad Activo' : 'Sistema de Seguridad en Pausa'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Textarea
                                        placeholder="Describa los síntomas clínicos con precisión (ej: Dolor precordial opresivo con irradiación a mandíbula...)"
                                        className="min-h-[120px] bg-zinc-900 border-zinc-800 text-white focus:border-emerald-500 transition-all text-sm leading-relaxed"
                                        value={symptoms}
                                        onChange={(e) => setSymptoms(e.target.value)}
                                    />
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-tight h-12 shadow-lg shadow-emerald-900/20"
                                        onClick={handleTriageAnalysis}
                                        disabled={analyzingTriage || !aiConfig?.enabled || !aiConfig?.features?.triage}
                                    >
                                        {analyzingTriage ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                PROCESANDO INFERENCIA IA...
                                            </>
                                        ) : (
                                            <>
                                                <img src="/assets/logoIA.png" alt="AI" className="mr-2 h-12 w-12 object-contain" />
                                                ANALIZAR SÍNTOMAS &amp; GENERAR TRIAJE
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Resultados de Triaje (solo si hay resultado) */}
                            {triageResult && (
                                <Card className="relative overflow-hidden border-zinc-900 shadow-2xl bg-zinc-950/50 backdrop-blur-xl">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${triageResult.priority.color}`} />
                                    <CardHeader className="border-b border-zinc-900 bg-zinc-900/20">
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col items-start gap-1">
                                                <Badge className={`${triageResult.priority.color} text-white px-3 py-1 shadow-lg font-black tracking-tight`}>
                                                    {triageResult.priority.label}
                                                </Badge>
                                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">
                                                    Sello de Auditoría: {triageResult.model || 'SENIOR_AGENT_V2'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Confianza del Modelo</p>
                                                <h4 className="text-xl font-black text-white">{triageResult.confidence}%</h4>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-6">
                                        <div className="relative p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Diagnóstico Diferencial Sugerido</h4>
                                            <p className="text-sm text-zinc-300 leading-relaxed font-medium italic">
                                                "{triageResult.analysis}"
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                                                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black mb-1">Espera Máxima</p>
                                                <p className="text-2xl font-black text-white">{triageResult.priority.waitTime} <span className="text-xs font-normal text-zinc-500">min</span></p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                                                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black mb-1">Célula de Atención</p>
                                                <p className="text-2xl font-black text-indigo-400 truncate">{triageResult.category}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar de Actividad Real */}
                        <div className="space-y-6">
                            <Card className="bg-zinc-950 border-zinc-900 shadow-xl overflow-hidden">
                                <CardHeader className="pb-3 border-b border-zinc-900 bg-zinc-900/10">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                            <HistoryIcon className="h-4 w-4 text-indigo-500" />
                                            Actividad Reciente
                                        </CardTitle>
                                        <Badge variant="outline" className="text-[8px] border-emerald-500/20 text-emerald-500 uppercase">Live</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {aiActivity.length > 0 ? (
                                        <div className="divide-y divide-zinc-900">
                                            {aiActivity.slice(0, 5).map((act: any, i) => {
                                                const resourceKey = String(act.resource || '').toUpperCase();
                                                const config = RESOURCES_CONFIG[resourceKey] || {
                                                    label: act.details || 'Consulta IA',
                                                    icon: HistoryIcon,
                                                    color: 'text-zinc-400',
                                                    bg: 'bg-zinc-500/10'
                                                };
                                                const Icon = config.icon;
                                                const logData = parseLogChanges(act.changes);
                                                const latency = logData.duration;
                                                const model = logData.model;

                                                return (
                                                    <div key={i} className="p-4 hover:bg-zinc-900/40 transition-all group border-l-2 border-transparent hover:border-indigo-500/50">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("p-1.5 rounded-md", config.bg)}>
                                                                    <Icon className={cn("h-3 w-3", config.color)} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate max-w-[140px]">
                                                                        {config.label}
                                                                    </span>
                                                                    {model && (
                                                                        <span className="text-[8px] text-zinc-500 font-mono font-bold truncate">
                                                                            {model.split('/').pop()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-[8px] text-zinc-600 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                                                {act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="h-1 w-1 rounded-full bg-indigo-500/50" />
                                                                <span className="text-[9px] text-zinc-500 truncate max-w-[150px]">
                                                                    {act.user?.firstName || 'Admin'} ha procesado el nodo
                                                                </span>
                                                            </div>
                                                            {latency && (
                                                                <span className={cn(
                                                                    "text-[8px] font-bold px-1 rounded",
                                                                    latency < 1000 ? "text-emerald-500 bg-emerald-500/5" :
                                                                        latency < 3000 ? "text-amber-500 bg-amber-500/5" :
                                                                            "text-rose-500 bg-rose-500/5"
                                                                )}>
                                                                    {latency}ms
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-10 text-center space-y-3">
                                            <CloudRain className="h-8 w-8 text-zinc-800 mx-auto" />
                                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Sin actividad registrada en este nodo</p>
                                        </div>
                                    )}
                                    <div className="p-4 bg-zinc-900/20 border-t border-zinc-900">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-tighter text-zinc-500 hover:text-white h-6">
                                                    Ver Historial Completo <ChevronRight className="h-3 w-3 ml-1" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-900 text-white">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl font-black uppercase tracking-widest text-indigo-400">Auditoría Total de Consultas IA</DialogTitle>
                                                    <DialogDescription className="text-zinc-500">
                                                        Registro histórico de todas las interacciones procesadas por el cerebro EdiCarex.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="h-[500px] mt-4 pr-4">
                                                    <div className="space-y-3">
                                                        {aiActivity.length > 0 ? aiActivity.map((act: any, i: number) => {
                                                            const resourceKey = String(act.resource || '').toUpperCase();
                                                            const config = RESOURCES_CONFIG[resourceKey] || {
                                                                label: act.details || 'Consulta IA',
                                                                icon: HistoryIcon,
                                                                color: 'text-zinc-400',
                                                                bg: 'bg-zinc-500/10'
                                                            };
                                                            const Icon = config.icon;
                                                            const logData = parseLogChanges(act.changes);
                                                            const latency = logData.duration;
                                                            const model = logData.model;

                                                            return (
                                                                <div key={i} className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:border-indigo-500/40 hover:bg-zinc-900/50 transition-all shadow-lg">
                                                                    <div className="flex gap-4 items-center">
                                                                        <div className={cn("p-3 rounded-xl shadow-inner", config.bg)}>
                                                                            <Icon className={cn("h-5 w-5", config.color)} />
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs font-black text-white tracking-tight">{config.label}</span>
                                                                                <Badge variant="outline" className="text-[8px] border-zinc-800 text-zinc-500 uppercase font-bold py-0 h-4">
                                                                                    {act.resource}
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="flex flex-wrap items-center gap-3 text-zinc-500 text-[10px] font-medium">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <Users className="h-3 w-3 text-indigo-400" />
                                                                                    <span>{act.user?.firstName} {act.user?.lastName}</span>
                                                                                </div>
                                                                                <span className="text-zinc-800">|</span>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <Zap className="h-3 w-3 text-amber-400" />
                                                                                    <span className={cn(
                                                                                        "font-bold",
                                                                                        latency < 1000 ? "text-emerald-400" :
                                                                                            latency < 3000 ? "text-amber-400" :
                                                                                                "text-rose-400"
                                                                                    )}>
                                                                                        {latency ? `${latency}ms` : 'N/A'}
                                                                                    </span>
                                                                                </div>
                                                                                {model && (
                                                                                    <>
                                                                                        <span className="text-zinc-800">|</span>
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <Database className="h-3 w-3 text-purple-400" />
                                                                                            <span className="text-zinc-300 font-mono">{model}</span>
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1 shrink-0 w-full sm:w-auto">
                                                                        <span className="text-[10px] font-mono text-zinc-400 bg-black/40 px-2 py-1 rounded border border-zinc-800/50">
                                                                            {act.createdAt ? new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Reciente'}
                                                                        </span>
                                                                        <div className="flex items-center gap-1 opacity-40">
                                                                            <Activity className="h-2.5 w-2.5" />
                                                                            <span className="text-[8px] font-mono uppercase">Node: {act.ipAddress || 'Internal'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }) : (
                                                            <div className="flex flex-col items-center justify-center py-20 opacity-20 gap-4">
                                                                <Database className="h-12 w-12" />
                                                                <p className="text-xs font-bold uppercase tracking-widest">No hay registros de auditoría disponibles</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-950 border-zinc-900 shadow-xl overflow-hidden">
                                <CardHeader className="pb-3 border-b border-zinc-900 bg-zinc-900/10">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-emerald-500" />
                                        Salud de IA GLO
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-zinc-500 uppercase tracking-tighter">Carga de Inferencia</span>
                                            <span className={cn(aiStats.realLoad > 70 ? "text-rose-500" : aiStats.realLoad > 30 ? "text-amber-500" : "text-emerald-500")}>
                                                {aiStats.realLoad > 80 ? 'CRÍTICA' : aiStats.realLoad > 50 ? 'ALTA' : aiStats.realLoad > 20 ? 'MEDIA' : 'OPTIMA'} ({aiStats.realLoad}%)
                                            </span>
                                        </div>
                                        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-1000",
                                                    aiStats.realLoad > 70 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" :
                                                        aiStats.realLoad > 30 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" :
                                                            "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                                )}
                                                style={{ width: `${aiStats.realLoad}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-zinc-500 uppercase tracking-tighter">Uso de Tokens Hora</span>
                                            <span className="text-indigo-400 font-mono">{(aiStats.realTokens / 1000).toFixed(1)}K</span>
                                        </div>
                                        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all duration-1000"
                                                style={{ width: `${Math.min((aiStats.realTokens / 500000) * 100, 100)}%` }} // 500k visual limit
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2 flex items-center gap-2">
                                        <div className={cn("h-1.5 w-1.5 rounded-full transition-all", aiStats.activeNodes > 0 ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#ef4444]")} />
                                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                            {aiStats.activeNodes > 0 ? 'Sincronización Cuántica Activa' : 'Desconectado del Cerebro Central'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="chat" className="mt-0">
                    <div className="grid gap-6 md:grid-cols-12 h-[calc(100vh-280px)] min-h-[650px]">
                        {/* LEFT PANEL: REAL CHAT HISTORY (SOLID & PRO) */}
                        <Card className="hidden md:flex md:col-span-2 border-zinc-900 bg-[#09090b] flex-col overflow-hidden">
                            <CardHeader className="p-4 border-b border-zinc-900/50 bg-black/20">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Historial de Auditoría</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 p-2 overflow-hidden bg-black/5">
                                <ScrollArea className="h-full pr-2">
                                    <div className="space-y-1">
                                        {aiActivity.length > 0 ? aiActivity.map((activity, i) => {
                                            const config = RESOURCES_CONFIG[activity.action] || RESOURCES_CONFIG[activity.resource] || { label: activity.action || 'Consulta IA', icon: Activity, color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
                                            return (
                                                <div
                                                    key={activity.id || i}
                                                    onClick={() => editingActivityId !== activity.id && handleLoadActivity(activity)}
                                                    className={cn(
                                                        "w-full text-left p-3 rounded-lg hover:bg-white/5 transition-all group border border-transparent hover:border-zinc-800 relative",
                                                        editingActivityId === activity.id && "bg-white/5 border-zinc-700"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                                                            <config.icon className={cn("h-3 w-3 shrink-0", config.color)} />
                                                            {editingActivityId === activity.id ? (
                                                                <input
                                                                    autoFocus
                                                                    value={editingName}
                                                                    onChange={(e) => setEditingName(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleRenameActivity(activity.id)
                                                                        if (e.key === 'Escape') setEditingActivityId(null)
                                                                    }}
                                                                    onBlur={() => handleRenameActivity(activity.id)}
                                                                    className="bg-zinc-950 border border-indigo-500/50 text-[10px] text-white px-1 py-0.5 rounded outline-none w-full"
                                                                />
                                                            ) : (
                                                                <p className="text-[10px] font-bold text-zinc-300 group-hover:text-white truncate uppercase tracking-tighter">
                                                                    {activity.changes?.customName || activity.changes?.docType || activity.changes?.type || config.label}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setEditingActivityId(activity.id)
                                                                    setEditingName(activity.changes?.customName || activity.changes?.docType || activity.changes?.type || config.label)
                                                                }}
                                                                className="p-1 hover:text-indigo-400 transition-colors"
                                                            >
                                                                <Pencil className="h-2.5 w-2.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteActivity(e, activity.id)}
                                                                className="p-1 hover:text-rose-400 transition-colors"
                                                            >
                                                                <Trash2 className="h-2.5 w-2.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center opacity-40">
                                                        <p className="text-[8px] text-zinc-500 font-mono">
                                                            {new Date(activity.createdAt).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-[8px] text-zinc-500 font-mono">
                                                            {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        }) : (
                                            <div className="py-20 text-center opacity-10">
                                                <HistoryIcon className="h-8 w-8 mx-auto mb-2" />
                                                <p className="text-[8px] font-black uppercase">Sin registros reales</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                            <div className="p-4 border-t border-zinc-900 bg-black/20">
                                <Button
                                    onClick={() => setChatMessages([])}
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-8 text-[9px] font-black border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all uppercase tracking-widest"
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Nuevo Chat
                                </Button>
                            </div>
                        </Card>

                        {/* CENTRAL PANEL: THE CHAT VIEW (CLEAN & PRO STYLE) */}
                        <Card className="md:col-span-10 flex flex-col border-zinc-900 bg-[#09090b] shadow-none relative overflow-hidden group/chat">
                            {/* SOLID HEADER */}
                            <CardHeader className="p-5 border-b border-zinc-900 bg-black z-10 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                        <Stethoscope className="h-5 w-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-black tracking-tight text-white uppercase">Asistente Médico Bio-IA</CardTitle>
                                        <CardDescription className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                                            <div className="h-1 w-1 rounded-full bg-emerald-500/50" />
                                            EDICAREX | Senior Pro v4.5
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-zinc-800 bg-black text-zinc-500 text-[8px] font-black py-0.5 px-2 uppercase tracking-tighter">Acceso: {user?.firstName} {user?.lastName}</Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative bg-[#050505] selection:bg-indigo-500/30">
                                {/* RADIAL DEPTH GLOW */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_100%)] pointer-events-none" />

                                {chatMessages.length === 0 ? (
                                    /* ULTRA-PRO WELCOME SCREEN (OPTIMIZED HUD PROPORTIONS) */
                                    <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-5xl mx-auto overflow-hidden">
                                        {/* BACKGROUND GRID FOR DEPTH */}
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

                                        <div className="space-y-3 text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                                            <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/40 border border-zinc-800 backdrop-blur-md shadow-2xl group/engine">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-[7px] font-black text-emerald-500/80 uppercase tracking-[0.2em]">Neural Engine v6.1 Active</span>
                                                </div>
                                                <div className="h-2.5 w-[1px] bg-zinc-800" />
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[6px] font-bold text-zinc-500 uppercase tracking-widest group-hover/engine:text-indigo-400 transition-colors">
                                                        Node: {MODEL_DISPLAY_NAMES[aiConfig?.model] || aiConfig?.model || 'Senior Pro'}
                                                    </span>
                                                </div>
                                            </div>
                                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                                                Hola, <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">{user?.firstName || 'Admin'}</span>
                                            </h1>
                                            <p className="text-sm font-medium text-zinc-500 tracking-tight max-w-md mx-auto leading-relaxed border-t border-white/5 pt-2">
                                                ¿En qué puedo asistirte hoy con el análisis clínico y operativo?
                                            </p>
                                        </div>

                                        <div className="w-full max-w-4xl relative group">
                                            {/* NEURAL DATA STREAM AREA (TERMINAL STYLE) */}
                                            <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity" />

                                            <div className="relative border border-zinc-800/50 bg-black/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
                                                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-900/10">
                                                    <div className="flex gap-1.5">
                                                        <div className="h-2 w-2 rounded-full bg-rose-500/30" />
                                                        <div className="h-2 w-2 rounded-full bg-amber-500/30" />
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500/30" />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[6px] font-black text-zinc-500 uppercase tracking-widest">Neural Cluster Live Analytics</span>
                                                    </div>
                                                </div>

                                                <ScrollArea className="h-40 p-3">
                                                    <div className="space-y-2 font-mono text-[9px]">
                                                        {aiActivity.length > 0 ? aiActivity.slice(0, 8).map((log, i) => (
                                                            <div key={i} className="flex gap-3 group/log border-l border-transparent hover:border-indigo-500/50 pl-2 transition-all">
                                                                <span className="text-zinc-700 shrink-0 font-bold">[{new Date(log.createdAt).toLocaleTimeString([], { hour12: false })}]</span>
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-indigo-500/80 font-bold uppercase tracking-tighter">{log.resource.replace('_', ' ')}</span>
                                                                        <span className="text-zinc-800">::</span>
                                                                        <span className="text-zinc-400 opacity-90 group-hover/log:text-white transition-colors whitespace-normal break-all">
                                                                            {log.action} <span className="text-zinc-600">[{JSON.stringify(log.details || {}).slice(0, 60)}...]</span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="h-full flex flex-col items-center justify-center opacity-20 py-8 italic">
                                                                <Database className="h-5 w-5 mb-2 animate-bounce" />
                                                                <span>Escaneando hilos de ejecución activos...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </ScrollArea>

                                                {/* SCANLINE EFFECT OVERLAY */}
                                                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] z-50 opacity-20" />
                                            </div>

                                            {/* INTERACTIVE HINT FOOTER (MORE COMPACT) */}
                                            <div className="mt-6 flex justify-center gap-10 text-[7px] font-black text-zinc-500 uppercase tracking-[0.4em] opacity-60">
                                                {[
                                                    { icon: Zap, label: 'Latencia ~45ms', color: 'hover:text-amber-500' },
                                                    { icon: ShieldCheck, label: 'Data Protected', color: 'hover:text-indigo-500' },
                                                    { icon: Database, label: 'Sync 100%', color: 'hover:text-emerald-500' },
                                                ].map((item, id) => (
                                                    <div key={id} className={cn("flex items-center gap-1.5 transition-all cursor-help group/hint", item.color)}>
                                                        <item.icon className="h-2.5 w-2.5 group-hover/hint:scale-110 transition-transform" />
                                                        <span>{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* CHAT MESSAGES (SOLID DESIGN) */
                                    <ScrollArea className="flex-1 p-8 z-10">
                                        <div className="space-y-10 max-w-4xl mx-auto">
                                            {chatMessages.map((message, idx) => (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500",
                                                        message.role === 'user' ? "flex-row-reverse" : "flex-row"
                                                    )}
                                                >
                                                    {/* Avatar Real */}
                                                    <div className="shrink-0 pt-1">
                                                        <Avatar className={cn(
                                                            "h-10 w-10 border shadow-md rounded-xl transition-transform hover:scale-105",
                                                            message.role === 'user' ? "border-zinc-800" : "border-indigo-500/30 shadow-indigo-500/10"
                                                        )}>
                                                            <AvatarImage
                                                                src={message.role === 'user' ? user?.avatar : "/assets/logoIA.png"}
                                                                className="object-cover"
                                                                alt={message.role === 'user' ? "User" : "AI"}
                                                            />
                                                            <AvatarFallback className={cn(
                                                                "font-black text-[10px]",
                                                                message.role === 'user' ? "bg-zinc-800 text-zinc-400" : "bg-indigo-600 text-white"
                                                            )}>
                                                                {message.role === 'user' ? user?.firstName?.charAt(0) : "AI"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </div>

                                                    <div className={cn(
                                                        "flex flex-col gap-1.5 max-w-[85%]",
                                                        message.role === 'user' ? "items-end" : "items-start"
                                                    )}>
                                                        <div className={cn(
                                                            "px-5 py-3.5 rounded-2xl relative group transition-all duration-300",
                                                            message.role === 'user'
                                                                ? "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tr-none hover:border-zinc-700 shadow-xl"
                                                                : "bg-indigo-500/5 backdrop-blur-sm border border-indigo-500/20 text-zinc-200 rounded-tl-none hover:border-indigo-500/40 shadow-2xl"
                                                        )}>
                                                            <div className={cn(
                                                                "prose prose-invert prose-sm max-w-none leading-relaxed",
                                                                message.role === 'user' ? "text-zinc-300" : "text-zinc-200"
                                                            )}>
                                                                <ReactMarkdown
                                                                    remarkPlugins={[remarkGfm]}
                                                                    components={{
                                                                        strong: ({ node, ...props }) => <span className="font-black text-indigo-400" {...props} />,
                                                                        p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                                                    }}
                                                                >
                                                                    {message.content}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 px-1">
                                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest whitespace-nowrap">
                                                                {message.timestamp.toLocaleDateString()} | {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {message.role === 'assistant' && (
                                                                <>
                                                                    <div className="h-1 w-1 rounded-full bg-zinc-800" />
                                                                    <span className="text-[9px] font-bold text-indigo-500/40 uppercase tracking-tighter truncate max-w-[150px]">
                                                                        {message.model || 'Senior Engine'}
                                                                    </span>
                                                                    <Badge className={cn(
                                                                        "border-none text-[8px] font-black py-0 px-1.5 uppercase tracking-tighter ml-auto",
                                                                        message.source === 'local' || message.source === 'offline'
                                                                            ? "bg-amber-500/10 text-amber-500"
                                                                            : "bg-emerald-500/10 text-emerald-500"
                                                                    )}>
                                                                        {message.source === 'local' || message.source === 'offline' ? 'Fallback Local' : 'Verified AI Response'}
                                                                    </Badge>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {sendingMessage && (
                                                <div className="flex justify-start gap-6">
                                                    <div className="shrink-0 h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center animate-pulse">
                                                        <Activity className="h-5 w-5 text-indigo-500" />
                                                    </div>
                                                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 flex gap-4 items-center">
                                                        <div className="flex gap-1.5 opacity-50">
                                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                                        </div>
                                                        <span className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em]">Procesando Consulta...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>

                            <div className="p-5 bg-black border-t border-zinc-900/50 z-20">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        handleSendMessage()
                                    }}
                                    className="relative flex flex-col items-center gap-3 max-w-4xl mx-auto w-full"
                                >
                                    <div className="relative w-full group">
                                        <Textarea
                                            placeholder="Detalle su consulta clínica (ej: dosis para paciente pediátrico, protocolos de urgencia...)"
                                            className="min-h-[70px] max-h-40 bg-zinc-900/80 border-zinc-800 focus:ring-0 focus:border-indigo-500/50 rounded-2xl pl-6 pr-20 py-5 text-sm transition-all group-hover:border-zinc-700 font-normal scrollbar-hide resize-none shadow-inner"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault()
                                                    handleSendMessage()
                                                }
                                            }}
                                            disabled={sendingMessage}
                                        />
                                        <div className="absolute right-5 bottom-5 flex items-center">
                                            <Button
                                                type="submit"
                                                size="icon"
                                                className="bg-white hover:bg-indigo-500 h-10 w-10 rounded-full active:scale-95 transition-all text-black hover:text-white shadow-xl"
                                                disabled={sendingMessage || !chatInput.trim()}
                                            >
                                                <Send className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 opacity-20 select-none">
                                        <div className="flex items-center gap-2 group/sync">
                                            <div className="h-0.5 w-3 rounded-full bg-zinc-800 overflow-hidden">
                                                <div className="h-full bg-emerald-500 w-full animate-pulse" />
                                            </div>
                                            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em] group-hover/sync:text-emerald-500 transition-colors">Neural Sync Active</span>
                                        </div>
                                        <div className="flex items-center gap-2 group/db">
                                            <div className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse" />
                                            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em] group-hover/db:text-indigo-400 transition-colors">Real-time DB Connection</span>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* Document Generator Tab */}
                <TabsContent value="generator" className="mt-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-5">
                        <Card className="md:col-span-2 border-zinc-800 bg-zinc-950 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    <FileSignature className="h-5 w-5 text-emerald-500" />
                                    Nuevo Documento
                                </CardTitle>
                                <CardDescription>Redacción automatizada de documentos clínicos con precisión Senior</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Elegir Paciente Real</span>
                                        <div className="relative group">
                                            <select
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-10 text-[11px] text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none transition-all group-hover:border-zinc-700 shadow-inner"
                                                value={selectedPatient?.id || ''}
                                                onChange={(e) => setSelectedPatient(patients.find(p => p.id === e.target.value))}
                                            >
                                                <option value="">Selección anónima / Manual</option>
                                                {patients.map(p => (
                                                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} - {p.documentId}</option>
                                                ))}
                                            </select>
                                            <Users className="absolute left-3 top-3 h-4 w-4 text-zinc-600 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                                            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-zinc-600 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tipo de Documento Clínico</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Receta Médica', 'Referencia', 'Alta Médica', 'Epicrisis'].map(type => (
                                                <Button
                                                    key={type}
                                                    variant={docType === type ? 'default' : 'outline'}
                                                    onClick={() => setDocType(type)}
                                                    className={cn(
                                                        "h-10 text-[10px] font-black uppercase tracking-tighter transition-all",
                                                        docType === type ? "bg-emerald-600 border-none shadow-lg shadow-emerald-900/40" : "bg-transparent border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                                                    )}
                                                >
                                                    {type === 'Receta Médica' && <Pill className="h-3 w-3 mr-1" />}
                                                    {type === 'Referencia' && <ArrowLeft className="h-3 w-3 mr-1 rotate-180" />}
                                                    {type === 'Alta Médica' && <ClipboardCheck className="h-3 w-3 mr-1" />}
                                                    {type === 'Epicrisis' && <FileText className="h-3 w-3 mr-1" />}
                                                    {type}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Instrucciones Especiales (IA Senior)</span>
                                        <Textarea
                                            placeholder="Detalles clínicos, dosis específica, antecedentes relevantes..."
                                            className="min-h-[100px] bg-zinc-900 border-zinc-800 text-white focus:border-emerald-500 text-xs leading-relaxed resize-none rounded-xl shadow-inner scrollbar-hide"
                                            value={docNotes}
                                            onChange={(e) => setDocNotes(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold text-sm shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all"
                                        onClick={handleGenerateDoc}
                                        disabled={generatingDoc}
                                    >
                                        {generatingDoc ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                REDACTANDO BORRADOR...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                REDACTAR DOCUMENTO PROFESIONAL
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-3 border-zinc-900 bg-zinc-950 shadow-2xl min-h-[500px] flex flex-col relative overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-900 pb-4 bg-zinc-900/20 backdrop-blur-md sticky top-0 z-20">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl font-black italic tracking-tighter text-white uppercase">Vista Previa AI</CardTitle>
                                        {generatedDoc && (
                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase py-0.5">Validado</Badge>
                                        )}
                                    </div>
                                    <CardDescription className="text-[10px] font-bold text-zinc-500 uppercase">Certificación Clínica {config?.hospitalName || "EdiCarex Pro"}</CardDescription>
                                </div>

                                {generatedDoc && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyToClipboard}
                                            className="h-8 border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white transition-all text-[9px] font-black tracking-widest"
                                        >
                                            {copied ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                                            {copied ? 'COPIADO' : 'COPIAR'}
                                        </Button>

                                        <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={handleExportPDF}
                                            className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white transition-all text-[9px] font-black tracking-widest shadow-lg shadow-indigo-900/20"
                                        >
                                            <Download className="h-3 w-3 mr-1" />
                                            EXPORTAR PDF
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>

                            <CardContent className="flex-1 p-0 bg-[#050505]">
                                {generatedDoc ? (
                                    <div className="p-8 h-full">
                                        <div className="bg-white/95 text-zinc-900 rounded-lg shadow-[0_15px_50px_-12px_rgba(0,0,0,0.5)] p-12 min-h-[600px] max-w-2xl mx-auto relative overflow-hidden transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
                                            {/* Hoja Clínica Header */}
                                            <div className="flex justify-between items-start mb-8 border-b-2 border-zinc-100 pb-6">
                                                <div>
                                                    <h1 className="text-2xl font-black tracking-tighter text-indigo-600">{config?.hospitalName || "EdiCarex Clinic"}</h1>
                                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Advanced IA Health Management</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-zinc-900 uppercase">{docType}</p>
                                                    <p className="text-[8px] font-bold text-zinc-400">{new Date().toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            {/* Patient Metadata Card */}
                                            <div className="grid grid-cols-2 gap-4 mb-8 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                                                <div>
                                                    <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Paciente</p>
                                                    <p className="text-xs font-bold text-zinc-900">{selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "Selección Anónima"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Identificación / DNI</p>
                                                    <p className="text-xs font-bold text-zinc-900">{selectedPatient?.documentId || "No registrado"}</p>
                                                </div>
                                            </div>

                                            {/* Document Body */}
                                            <ScrollArea className="h-auto">
                                                <div className="prose prose-sm max-w-none text-zinc-800 leading-relaxed font-serif italic text-sm">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {generatedDoc}
                                                    </ReactMarkdown>
                                                </div>
                                            </ScrollArea>

                                            {/* Signature Area */}
                                            <div className="mt-12 pt-8 border-t border-zinc-100 flex justify-between items-end">
                                                <div className="w-48">
                                                    <div className="h-[1px] bg-zinc-200 w-full mb-2" />
                                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest text-center">Firma Digital IA {config?.hospitalName || "EdiCarex"}</p>
                                                </div>
                                                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                                                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                                    <span className="text-[7px] font-black text-indigo-600 uppercase tracking-tighter">Verified by Quantum Central</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-32 opacity-20 group">
                                        <div className="p-6 bg-zinc-900 rounded-full border border-zinc-800 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                                            <Sparkles className="h-12 w-12 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-zinc-400 font-black uppercase tracking-widest text-xs">Sistema de Redacción Inactivo</p>
                                            <p className="text-zinc-600 text-[10px] font-medium max-w-[200px] italic">Complete los campos de la izquierda para desplegar la inteligencia documental.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="border-zinc-800 bg-zinc-950 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-20" />
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Previsión de Demanda</CardTitle>
                                    <Badge variant="outline" className="text-[8px] border-indigo-500/30 text-indigo-400 bg-black">Modelo Predictivo Activo</Badge>
                                </div>
                                <CardDescription className="text-[10px] font-bold text-zinc-600 uppercase">Carga proyectada vs Capacidad instalada</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px] mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={predictions.demand} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                                            <XAxis
                                                dataKey="day"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#52525b', fontSize: 10, fontWeight: 700 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#52525b', fontSize: 10, fontWeight: 700 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '10px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                                                itemStyle={{ fontWeight: 900, textTransform: 'uppercase' }}
                                            />
                                            <Bar dataKey="actual" name="Carga Real" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Bar dataKey="predicted" name="Proyección IA" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-zinc-800 bg-zinc-950 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-20" />
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Saturación en Tiempo Real</CardTitle>
                                    <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-400 bg-black">Nodo: Central-Core</Badge>
                                </div>
                                <CardDescription className="text-[10px] font-bold text-zinc-600 uppercase">Ocupación técnica vs Límites operacionales</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px] mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={predictions.saturation} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                                            <XAxis
                                                dataKey="hour"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#52525b', fontSize: 10, fontWeight: 700 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#52525b', fontSize: 10, fontWeight: 700 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '10px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="current"
                                                name="Ocupación"
                                                stroke="#ef4444"
                                                strokeWidth={3}
                                                dot={{ r: 3, fill: '#ef4444', strokeWidth: 2, stroke: '#000' }}
                                                activeDot={{ r: 5, strokeWidth: 0 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="predicted"
                                                name="Tendencia"
                                                stroke="#f97316"
                                                strokeDasharray="5 5"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                            <Line
                                                type="stepAfter"
                                                dataKey="capacity"
                                                name="Límite"
                                                stroke="#22c55e"
                                                strokeWidth={1}
                                                strokeOpacity={0.5}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {predictions.insight && (
                        <Card className="border-indigo-500/30 bg-indigo-500/5 shadow-2xl relative overflow-hidden mb-6">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <img src="/assets/logoIA.png" alt="" className="h-32 w-32 object-contain" />
                            </div>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                                    <CardTitle className="text-xl font-bold text-indigo-400">Análisis Estratégico (EdiCarex CFO Core)</CardTitle>
                                </div>
                                <CardDescription className="flex items-center gap-2">
                                    Perspectiva ejecutiva generada con {MODEL_DISPLAY_NAMES[predictions.model || aiConfig?.model] || 'IA Avanzada'}
                                    <Badge className="bg-indigo-500/20 text-indigo-400 border-none text-[9px] uppercase font-black tracking-tighter ml-1">
                                        Active Node: {predictions.model || 'Senior'}
                                    </Badge>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="prose prose-invert max-w-none text-zinc-300">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {predictions.insight.insight}
                                    </ReactMarkdown>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-indigo-500/20">
                                    <div className="p-4 rounded-xl bg-black/40 border border-indigo-500/20">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Crecimiento Proyectado</p>
                                        <p className="text-2xl font-black text-indigo-400">+{predictions.insight.projected_annual_growth}%</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-black/40 border border-indigo-500/20">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Precisión del Modelo</p>
                                        <p className="text-2xl font-black text-emerald-400">{Math.round(predictions.insight.accuracy_score * 100)}%</p>
                                    </div>
                                    <div className="hidden sm:block p-4 rounded-xl bg-black/40 border border-indigo-500/20">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Estado de Inferencia</p>
                                        <Badge className="bg-indigo-500 text-white border-none mt-1">Sincronizado</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-zinc-900 bg-zinc-950 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <TrendingUp className="h-24 w-24 text-zinc-500" />
                        </div>
                        <CardHeader className="pb-4 border-b border-zinc-900 bg-zinc-900/10">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Distribución Estratégica GLO</CardTitle>
                                <span className="text-[8px] font-black text-emerald-500 bg-black px-2 py-0.5 rounded border border-emerald-500/20">Sincronización Clínica Real</span>
                            </div>
                            <CardDescription className="text-[10px] font-bold text-zinc-600 uppercase">Análisis de especialidades con mayor carga proyectada 24h</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {predictions.categories.map((cat: any, idx: number) => (
                                    <div key={idx} className="bg-black p-4 border border-zinc-900 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all hover:bg-zinc-900/20 shadow-lg">
                                        <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10 flex flex-col gap-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] uppercase font-black text-zinc-500 tracking-tighter">{cat.category}</p>
                                                    <h3 className="text-3xl font-black text-white italic tracking-tighter leading-none mt-1">{cat.count}</h3>
                                                </div>
                                                <Badge className={cn(
                                                    "border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter",
                                                    cat.trend === 'ascendente' ? "bg-rose-500/20 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.1)]" : "bg-emerald-500/20 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                                )}>
                                                    {cat.trend === 'ascendente' ? 'Riesgo Alto' : 'Normal'}
                                                </Badge>
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-zinc-600">
                                                    <span>Confianza IA</span>
                                                    <span className="text-emerald-500">{cat.confidence}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000"
                                                        style={{ width: `${cat.confidence}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AlertDialog open={!!activityToDelete} onOpenChange={(open) => !open && setActivityToDelete(null)}>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white uppercase font-black tracking-widest flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                            Confirmar Eliminación
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400 text-sm">
                            ¿Estás seguro de que deseas eliminar este registro del historial? Esta acción no se puede deshacer y el acceso a esta consulta se perderá permanentemente del nodo central.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white uppercase text-[10px] font-bold tracking-widest transition-all">
                            Abortar Operación
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteActivity}
                            className="bg-rose-600 hover:bg-rose-700 text-white border-none shadow-[0_0_15px_rgba(225,29,72,0.3)] uppercase text-[10px] font-bold tracking-widest transition-all"
                        >
                            Ejecutar Borrado
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
