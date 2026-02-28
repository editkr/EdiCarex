import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Shield,
    Plus,
    Loader2,
    Users,
    Settings,
    Database,
    Clock,
    DollarSign,
    Image as ImageIcon,
    Download,
    Upload,
    CheckCircle,
    Calendar,
    Activity,
    LayoutDashboard,
    Stethoscope,
    Sun,
    Moon,
    Bed,
    AlertTriangle,
    Pill,
    FlaskConical,
    Receipt,
    FileText,
    FileSignature,
    ClipboardList,
    Cpu,
    BarChart3,
    UserCog,
    MessageSquare,
    Sliders,
    CalendarCheck,
    Package,
    UserPlus,
    ShieldCheck,
    DatabaseBackup,
    History as HistoryIcon,
    Trash2,
    HardDrive,
    Check,
    RotateCcw,
    Fingerprint,
    Save,
    Key,
    Globe,
    Pencil,
    User,
    Server,
    CheckCircle2,
    AlertCircle,
    Sparkles,
} from 'lucide-react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { adminAPI, usersAPI, auditAPI, messagesAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/stores/authStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { validateSettings, validateLogoFile } from '@/utils/validation'
import { processLogoImage } from '@/utils/imageProcessing'
import { cn } from '@/lib/utils'
const AILogoIcon = ({ className }: { className?: string }) => (
    <div className={cn("flex items-center justify-center", className)}>
        <img
            src="/assets/logoIA.png"
            alt="AI Logo"
            className="h-full w-full object-contain"
        />
    </div>
);

export default function AdminPage() {
    const { refreshConfig } = useOrganization()
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [userModalOpen, setUserModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [passwordModalOpen, setPasswordModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [recentActivity, setRecentActivity] = useState<any[]>([])
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [backupModalOpen, setBackupModalOpen] = useState(false)
    const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)
    const [selectedBackup, setSelectedBackup] = useState<any>(null)
    const [restoreConfirmText, setRestoreConfirmText] = useState('')
    const [isCreatingBackup, setIsCreatingBackup] = useState(false)
    const [isRestoring, setIsRestoring] = useState(false)
    const [deleteBackupConfirmOpen, setDeleteBackupConfirmOpen] = useState(false)
    const [isCleaningBackups, setIsCleaningBackups] = useState(false)
    const [backupPhase, setBackupPhase] = useState<'IDLE' | 'ANALYSIS' | 'EXPORT' | 'CHECKSUM' | 'COMPLETED'>('IDLE')
    const [verifyingFilename, setVerifyingFilename] = useState<string | null>(null)
    const [integrityResults, setIntegrityResults] = useState<Record<string, any>>({})
    const { toast } = useToast()
    const { hasPermission } = usePermissions()
    const { user: currentUser, setUser: SetAuthUser } = useAuthStore()

    // Form states for New/Edit User
    // ROLES & DEFAULT PERMISSIONS MAPPING
    // ROLES & DEFAULT PERMISSIONS MAPPING (10 Professional Roles)
    // ROLES & DEFAULT PERMISSIONS MAPPING (10 Professional Roles)
    const ROLE_DEFAULTS: Record<string, string[]> = {
        'Admin': ['ALL'],
        'Staff': ['DASHBOARD', 'PATIENTS_VIEW', 'PATIENTS_EDIT', 'MEDICAL_RECORDS_VIEW', 'MEDICAL_RECORDS_CREATE', 'MEDICAL_RECORDS_EDIT', 'PRESCRIPTIONS_CREATE', 'PRESCRIPTIONS_VIEW', 'APPOINTMENTS_VIEW', 'APPOINTMENTS_EDIT', 'EMERGENCY_VIEW', 'EMERGENCY_EDIT', 'EMERGENCY_DISCHARGE', 'BEDS_VIEW', 'BEDS_ASSIGN', 'LAB_VIEW', 'LAB_CREATE', 'LAB_RESULTS', 'PHARMACY_VIEW', 'REPORTS_VIEW', 'AI_USE', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Nurse': ['DASHBOARD', 'PATIENTS_VIEW', 'PATIENTS_EDIT', 'MEDICAL_RECORDS_VIEW', 'MEDICAL_RECORDS_EDIT', 'PRESCRIPTIONS_VIEW', 'APPOINTMENTS_VIEW', 'EMERGENCY_VIEW', 'EMERGENCY_EDIT', 'EMERGENCY_DISCHARGE', 'BEDS_VIEW', 'BEDS_EDIT', 'BEDS_ASSIGN', 'PHARMACY_VIEW', 'PHARMACY_DISPENSE', 'LAB_VIEW', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Receptionist': ['DASHBOARD', 'PATIENTS_VIEW', 'PATIENTS_CREATE', 'PATIENTS_EDIT', 'APPOINTMENTS_VIEW', 'APPOINTMENTS_CREATE', 'APPOINTMENTS_EDIT', 'WAITING_VIEW', 'WAITING_MANAGE', 'BILLING_VIEW', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Lab': ['DASHBOARD', 'PATIENTS_VIEW', 'LAB_VIEW', 'LAB_CREATE', 'LAB_EDIT', 'LAB_RESULTS', 'REPORTS_VIEW', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Pharmacy': ['DASHBOARD', 'PATIENTS_VIEW', 'PHARMACY_VIEW', 'PHARMACY_EDIT', 'PHARMACY_DISPENSE', 'PRESCRIPTIONS_VIEW', 'BILLING_VIEW', 'REPORTS_VIEW', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'HR': ['DASHBOARD', 'HR_VIEW', 'HR_CREATE', 'HR_EDIT', 'HR_DELETE', 'ATTENDANCE_VIEW', 'ATTENDANCE_EDIT', 'REPORTS_VIEW', 'ANALYTICS_VIEW', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Billing': ['DASHBOARD', 'PATIENTS_VIEW', 'BILLING_VIEW', 'BILLING_CREATE', 'BILLING_EDIT', 'REPORTS_VIEW', 'ANALYTICS_VIEW', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Management': ['DASHBOARD', 'PATIENTS_VIEW', 'STAFF_VIEW', 'APPOINTMENTS_VIEW', 'EMERGENCY_VIEW', 'BEDS_VIEW', 'PHARMACY_VIEW', 'LAB_VIEW', 'BILLING_VIEW', 'REPORTS_VIEW', 'REPORTS_EXPORT', 'ANALYTICS_VIEW', 'ANALYTICS_ADVANCED', 'AI_USE', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
        'Audit': ['DASHBOARD', 'ADMIN_VIEW', 'AUDIT_VIEW', 'BACKUPS_VIEW', 'BACKUPS_CREATE', 'SETTINGS_VIEW', 'SETTINGS_EDIT', 'MESSAGES_VIEW', 'MESSAGES_SEND'],
    }

    const ROLE_DISPLAY_NAMES: Record<string, string> = {
        // Roles exactos del backend (seed.ts)
        'Admin': 'Administrador',
        'Staff': 'Personal de Salud',
        'Nurse': 'Enfermero/a',
        'Receptionist': 'Recepcionista / Admisión',
        'Lab': 'Técnico de Laboratorio',
        'Pharmacy': 'Farmacéutico/a',
        'HR': 'Gerente de RRHH',
        'Billing': 'Facturación / Caja',
        'Management': 'Dirección / Gerencia',
        'Audit': 'Auditoría',
        'Patient': 'Paciente'
    };

    const GROUP_DISPLAY_NAMES: Record<string, string> = {
        'PATIENTS': 'Pacientes',
        'STAFF': 'Personal de Salud',
        'APPOINTMENTS': 'Citas',
        'EMERGENCY': 'Emergencias',
        'BEDS': 'Gestión de Camas',
        'PHARMACY': 'Farmacia',
        'LAB': 'Laboratorio',
        'BILLING': 'Facturación',
        'REPORTS': 'Reportes',
        'ANALYTICS': 'Analítica',
        'HR': 'Recursos Humanos',
        'ATTENDANCE': 'Asistencia',
        'ADMIN': 'Administración',
        'AUDIT': 'Auditoría',
        'SETTINGS': 'Configuración',
        'WAITING': 'Sala de Espera',
        'AI': 'Inteligencia Artificial',
        'MESSAGES': 'Mensajería',
        'MEDICAL': 'Expedientes Médicos',
        'PRESCRIPTIONS': 'Recetas',
        'BACKUPS': 'Respaldos',
        'SYSTEM': 'Sistema'
    };

    const PERMISSION_MAP: Record<string, { label: string, icon: any }> = {
        // Dashboard
        'DASHBOARD': { label: 'Acceso al Dashboard', icon: LayoutDashboard },

        // Pacientes
        'PATIENTS_VIEW': { label: 'Módulo Pacientes', icon: User },
        'PATIENTS_CREATE': { label: 'Crear Pacientes', icon: UserPlus },
        'PATIENTS_EDIT': { label: 'Editar Pacientes', icon: Pencil },
        'PATIENTS_DELETE': { label: 'Eliminar Pacientes', icon: Trash2 },

        // Personal de Salud
        'STAFF_VIEW': { label: 'Módulo Personal de Salud', icon: Stethoscope },
        'STAFF_CREATE': { label: 'Registrar Personal', icon: UserPlus },
        'STAFF_EDIT': { label: 'Editar Personal', icon: Pencil },
        'STAFF_DELETE': { label: 'Eliminar Personal', icon: Trash2 },

        // Citas
        'APPOINTMENTS_VIEW': { label: 'Módulo Citas', icon: Calendar },
        'APPOINTMENTS_CREATE': { label: 'Crear Citas', icon: CalendarCheck },
        'APPOINTMENTS_EDIT': { label: 'Editar Citas', icon: Pencil },
        'APPOINTMENTS_DELETE': { label: 'Eliminar Citas', icon: Trash2 },

        // Emergencias
        'EMERGENCY_VIEW': { label: 'Módulo Emergencia', icon: AlertTriangle },
        'EMERGENCY_CREATE': { label: 'Registrar Ingreso', icon: Plus },
        'EMERGENCY_EDIT': { label: 'Gestionar/Triaje', icon: Pencil },
        'EMERGENCY_DELETE': { label: 'Eliminar Registro', icon: Trash2 },
        'EMERGENCY_DISCHARGE': { label: 'Dar de Alta', icon: CheckCircle },

        // Camas
        'BEDS_VIEW': { label: 'Módulo Camas', icon: Bed },
        'BEDS_ASSIGN': { label: 'Asignar Camas', icon: UserPlus },
        'BEDS_EDIT': { label: 'Editar Estado', icon: Pencil },
        'BEDS_DELETE': { label: 'Eliminar Camas', icon: Trash2 },

        // Farmacia
        'PHARMACY_VIEW': { label: 'Módulo Farmacia', icon: Pill },
        'PHARMACY_CREATE': { label: 'Agregar Producto', icon: Plus },
        'PHARMACY_EDIT': { label: 'Editar Producto', icon: Pencil },
        'PHARMACY_DELETE': { label: 'Eliminar Producto', icon: Trash2 },
        'PHARMACY_DISPENSE': { label: 'Dispensar Medicamentos', icon: Receipt },

        // Laboratorio
        'LAB_VIEW': { label: 'Módulo Laboratorio', icon: FlaskConical },
        'LAB_CREATE': { label: 'Crear Órdenes', icon: Plus },
        'LAB_EDIT': { label: 'Registrar Resultados', icon: Pencil },
        'LAB_DELETE': { label: 'Eliminar Órdenes', icon: Trash2 },
        'LAB_RESULTS': { label: 'Ingresar Resultados', icon: FileText },

        // Facturación
        'BILLING_VIEW': { label: 'Módulo Facturación', icon: Receipt },
        'BILLING_CREATE': { label: 'Crear Facturas', icon: DollarSign },
        'BILLING_EDIT': { label: 'Editar Facturas', icon: Pencil },
        'BILLING_DELETE': { label: 'Anular Facturas', icon: Trash2 },

        // Reportes
        'REPORTS_VIEW': { label: 'Módulo Reportes', icon: FileText },
        'REPORTS_CREATE': { label: 'Generar Reportes', icon: Plus },
        'REPORTS_EXPORT': { label: 'Exportar Reportes', icon: Download },

        // Analítica
        'ANALYTICS_VIEW': { label: 'Módulo Analítica', icon: BarChart3 },
        'ANALYTICS_ADVANCED': { label: 'Analítica Avanzada', icon: BarChart3 },

        // IA
        'AI_USE': { label: 'Módulo IA Médica', icon: AILogoIcon },
        'AI_CONFIG': { label: 'Configurar IA', icon: Settings },

        // Mensajes
        'MESSAGES_VIEW': { label: 'Ver Mensajes', icon: MessageSquare },
        'MESSAGES_SEND': { label: 'Enviar Mensajes', icon: MessageSquare },

        // RRHH
        'HR_VIEW': { label: 'Módulo RR.HH.', icon: Users },
        'HR_CREATE': { label: 'Crear Empleados', icon: UserPlus },
        'HR_EDIT': { label: 'Editar Empleados', icon: Pencil },
        'HR_DELETE': { label: 'Eliminar Empleados', icon: Trash2 },

        // Asistencia
        'ATTENDANCE_VIEW': { label: 'Ver Asistencia', icon: Clock },
        'ATTENDANCE_EDIT': { label: 'Corregir Asistencia', icon: Pencil },
        'ATTENDANCE_DELETE': { label: 'Eliminar Registros', icon: Trash2 },

        // Administración
        'ADMIN_VIEW': { label: 'Módulo Sistema/Admin', icon: Shield },
        'ADMIN_CREATE': { label: 'Crear Usuarios', icon: UserPlus },
        'ADMIN_EDIT': { label: 'Editar Usuarios', icon: Pencil },
        'ADMIN_DELETE': { label: 'Eliminar Usuarios', icon: Trash2 },
        'AUDIT_VIEW': { label: 'Módulo Auditoría', icon: Database },

        // Configuración
        'SETTINGS_VIEW': { label: 'Ver Configuración', icon: Settings },
        'SETTINGS_EDIT': { label: 'Editar Configuración', icon: Sliders },

        // Sala de Espera
        'WAITING_VIEW': { label: 'Módulo Sala de Espera', icon: Users },
        'WAITING_MANAGE': { label: 'Gestionar Turnos', icon: Clock },

        // Nuevos Módulos Profesionales
        // Expedientes Médicos
        'MEDICAL_RECORDS_VIEW': { label: 'Ver Expedientes', icon: FileText },
        'MEDICAL_RECORDS_CREATE': { label: 'Crear Expedientes', icon: Plus },
        'MEDICAL_RECORDS_EDIT': { label: 'Editar Expedientes', icon: Pencil },
        'MEDICAL_RECORDS_DELETE': { label: 'Eliminar Expedientes', icon: Trash2 },

        // Recetas Médicas
        'PRESCRIPTIONS_VIEW': { label: 'Ver Recetas', icon: Pill },
        'PRESCRIPTIONS_CREATE': { label: 'Crear Recetas', icon: Plus },
        'PRESCRIPTIONS_EDIT': { label: 'Editar Recetas', icon: Pencil },
        'PRESCRIPTIONS_DELETE': { label: 'Eliminar Recetas', icon: Trash2 },

        // Respaldos y Seguridad
        'BACKUPS_VIEW': { label: 'Ver Respaldos', icon: Database },
        'BACKUPS_CREATE': { label: 'Crear Respaldo', icon: Download },
        'BACKUPS_RESTORE': { label: 'Restaurar Sistema', icon: Upload },
        'BACKUPS_DELETE': { label: 'Eliminar Respaldos', icon: Trash2 },
    };

    const [userData, setUserData] = useState({
        // Credenciales básicas
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        roleId: '',
        status: 'ACTIVE',
        permissions: ['DASHBOARD', 'SETTINGS_VIEW'] as string[], // Permisos por defecto (pueden desactivarse)

        // Foto de perfil
        profileImage: '',

        // Información de contacto
        phone: '',
        address: '',
        city: '',
        country: 'Perú',
        zipCode: '',

        // Información personal
        birthDate: '',
        gender: '',

        // Información profesional
        specialty: '',
        licenseNumber: '',
        department: '',
        hireDate: new Date().toISOString().split('T')[0],
    })

    // Data containers
    const [adminData, setAdminData] = useState<any>({
        users: [],
        roles: [],
        settings: {
            hospitalName: '',
            email: '',
            phone: '',
            address: '',
            logo: '',
            openingHours: {},
            billing: {},
            ai: { features: {} },
        },
        backups: [],
        systemStats: null,
        systemHealth: [],
    })

    useEffect(() => {
        loadAdminData()
    }, [])

    const loadAdminData = async () => {
        try {
            setLoading(true)
            const [usersRes, rolesRes, orgRes, backupsRes, auditRes, statsRes, healthRes] = await Promise.all([
                usersAPI.getAll({ limit: 100 }),
                usersAPI.getRoles(),
                adminAPI.getOrganization(),
                adminAPI.getBackups(),
                auditAPI.getAll({ limit: 5 }),
                adminAPI.getSystemStats(),
                adminAPI.getSystemHealth()
            ])

            setAdminData({
                users: usersRes.data.data.map((user: any) => ({
                    ...user,
                    profileImage: user.avatar || user.profileImage,
                    // Flatten professional fields from preferences to top-level for UI
                    specialty: user.preferences?.specialty || user.specialty,
                    licenseNumber: user.preferences?.licenseNumber || user.licenseNumber,
                    department: user.preferences?.department || user.department,
                    hireDate: user.preferences?.hireDate || user.hireDate,
                    birthDate: user.preferences?.birthDate || user.birthDate,
                    gender: user.preferences?.gender || user.gender,
                    city: user.preferences?.city || user.city,
                    country: user.preferences?.country || user.country,
                    zipCode: user.preferences?.zipCode || user.zipCode,
                })),
                roles: rolesRes.data || [],
                settings: orgRes.data,
                backups: backupsRes.data,
                systemStats: statsRes.data,
                systemHealth: healthRes.data,
            })
            setRecentActivity(auditRes.data.data || [])
            setMaintenanceMode(orgRes.data.maintenanceMode || false)
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Error al cargar datos de administración',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleSaveUser = async () => {
        const newErrors: Record<string, string> = {};

        // Validación Estricta de Campos Obligatorios
        const requiredFields = [
            { key: 'firstName', label: 'Nombre' },
            { key: 'lastName', label: 'Apellido' },
            { key: 'email', label: 'Correo Electrónico' },
            { key: 'roleId', label: 'Rol Organizacional' },
            { key: 'phone', label: 'Teléfono' },
            { key: 'address', label: 'Dirección' },
            { key: 'city', label: 'Ciudad' },
            { key: 'country', label: 'País' },
            { key: 'birthDate', label: 'Fecha de Nacimiento' },
            { key: 'gender', label: 'Género' },
            { key: 'hireDate', label: 'Fecha de Contratación' }
        ];

        // Validar campos básicos
        for (const field of requiredFields) {
            if (!userData[field.key as keyof typeof userData]) {
                newErrors[field.key] = `El campo ${field.label} es obligatorio.`;
            }
        }

        // Validar Contraseña
        if (!selectedUser) {
            if (!userData.password) {
                newErrors.password = 'La contraseña es obligatoria para nuevos usuarios.';
            } else if (userData.password.length < 8) {
                newErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
            } else if (userData.password.length > 32) {
                newErrors.password = 'La contraseña no puede exceder los 32 caracteres.';
            } else if (userData.password !== userData.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden.';
            }
        } else if (userData.password) {
            if (userData.password.length < 8) {
                newErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
            } else if (userData.password.length > 32) {
                newErrors.password = 'La contraseña no puede exceder los 32 caracteres.';
            } else if (userData.password !== userData.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden.';
            }
        }

        // Validar Foto de Perfil (Opcional)
        // if (!userData.profileImage) {
        //     toast({ title: 'Foto Requerida', description: 'La foto de perfil es obligatoria.', variant: 'destructive' });
        //     // No hay campo de input directo para marcar error, mantenemos toast para la foto
        //     return;
        // }

        // Validar Campos Profesionales
        if (['Staff', 'Nurse', 'Lab', 'Pharmacy'].some(r => {
            const role = adminData.roles.find((rl: any) => rl.id === userData.roleId);
            return role?.name.includes(r);
        })) {
            if (!userData.specialty) newErrors.specialty = 'La Especialidad es obligatoria.';
            if (!userData.licenseNumber) newErrors.licenseNumber = 'El Nº de Licencia es obligatorio.';
            if (!userData.department) newErrors.department = 'El Departamento es obligatorio.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast({ title: 'Error de Validación', description: 'Por favor corrija los campos marcados en rojo.', variant: 'destructive' });
            return;
        }

        setErrors({}); // Limpiar errores si todo está bien

        try {
            const payload = {
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                roleId: userData.roleId, // Should be UUID
                isActive: userData.status === 'ACTIVE',
                password: userData.password || undefined, // Only send if set
                phone: userData.phone,
                address: userData.address,
                avatar: userData.profileImage, // Map profileImage to backend avatar
                preferences: { // Prisma User model stores preferences as Json
                    permissions: userData.permissions,
                    // Extended profile fields
                    specialty: userData.specialty,
                    licenseNumber: userData.licenseNumber,
                    department: userData.department,
                    hireDate: userData.hireDate,
                    birthDate: userData.birthDate,
                    gender: userData.gender,
                    city: userData.city,
                    country: userData.country,
                    zipCode: userData.zipCode
                }
            }

            if (selectedUser) {
                await usersAPI.update(selectedUser.id, payload)

                // Si estamos editando al usuario actual, actualizar el store global
                if (currentUser && currentUser.id === selectedUser.id) {
                    SetAuthUser({
                        ...currentUser,
                        firstName: payload.firstName,
                        lastName: payload.lastName,
                        email: payload.email,
                        avatar: payload.avatar,
                        preferences: {
                            ...currentUser.preferences,
                            ...payload.preferences
                        }
                    })
                }

                toast({ title: 'Usuario Actualizado' })
            } else {
                if (!userData.password) {
                    toast({ title: 'Error', description: 'La contraseña es requerida', variant: 'destructive' })
                    return
                }
                await usersAPI.create(payload)
                toast({ title: 'Usuario Creado' })
            }
            setUserModalOpen(false)
            loadAdminData()
        } catch (error: any) {
            console.error(error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al guardar usuario',
                variant: 'destructive',
            })
        }
    }

    const handleOpenUserModal = (user: any = null) => {
        setSelectedUser(user)
        if (user) {
            setUserData({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                password: '',
                confirmPassword: '',
                roleId: user.roleId,
                status: user.isActive ? 'ACTIVE' : 'INACTIVE',
                permissions: user.preferences?.permissions || [],
                profileImage: user.avatar || user.profileImage || '',
                phone: user.phone || '',
                address: user.address || '',
                city: user.preferences?.city || user.city || '',
                country: user.preferences?.country || user.country || 'Perú',
                zipCode: user.preferences?.zipCode || user.zipCode || '',
                birthDate: (user.preferences?.birthDate || user.birthDate) ? new Date(user.preferences?.birthDate || user.birthDate).toISOString().split('T')[0] : '',
                gender: user.preferences?.gender || user.gender || '',
                specialty: user.preferences?.specialty || user.specialty || '',
                licenseNumber: user.preferences?.licenseNumber || user.licenseNumber || '',
                department: user.preferences?.department || user.department || '',
                hireDate: (user.preferences?.hireDate || user.hireDate) ? new Date(user.preferences?.hireDate || user.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            })
        } else {
            // Default to first role if available
            const defaultRole = adminData.roles?.[0]?.id || ''
            // Try to find the name of this default role to set default perms
            const roleName = adminData.roles?.[0]?.name || ''
            const defaultPerms = ROLE_DEFAULTS[roleName] || []

            setUserData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: '',
                roleId: defaultRole,
                status: 'ACTIVE',
                permissions: defaultPerms,
                profileImage: '',
                phone: '',
                address: '',
                city: '',
                country: 'Perú',
                zipCode: '',
                birthDate: '',
                gender: '',
                specialty: '',
                licenseNumber: '',
                department: '',
                hireDate: new Date().toISOString().split('T')[0],
            })
        }
        setUserModalOpen(true)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tamaño (máx 20MB)
            if (file.size > 20 * 1024 * 1024) {
                toast({
                    title: 'Error',
                    description: 'La imagen no debe superar 20MB',
                    variant: 'destructive'
                });
                return;
            }

            // Validar tipo
            if (!file.type.startsWith('image/')) {
                toast({
                    title: 'Error',
                    description: 'El archivo debe ser una imagen',
                    variant: 'destructive'
                });
                return;
            }

            // Convertir a base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserData({ ...userData, profileImage: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    }

    // Restablecer permisos a los valores por defecto
    const handleResetPermissions = () => {
        const selectedRole = adminData.roles.find((r: any) => r.id === userData.roleId)
        const roleName = selectedRole?.name || ''
        const roleDefaults = ROLE_DEFAULTS[roleName] || []

        // Dashboard + Settings + permisos del rol
        const defaultPermissions = ['DASHBOARD', 'SETTINGS_VIEW', ...roleDefaults]
        // Eliminar duplicados
        const uniquePermissions = Array.from(new Set(defaultPermissions))

        setUserData(prev => ({ ...prev, permissions: uniquePermissions }))

        toast({
            title: 'Permisos Restablecidos',
            description: `Se aplicaron ${uniquePermissions.length} permisos por defecto`,
        })
    }

    // Auto-fill permissions when Role changes (only if no existing permissions or user confirms - simpler: just suggestion as requested)
    useEffect(() => {
        if (userModalOpen && !selectedUser && userData.roleId) {
            const role = adminData.roles.find((r: any) => r.id === userData.roleId)
            if (role) {
                const roleName = role.name
                const suggestedPerms = ROLE_DEFAULTS[roleName]
                if (suggestedPerms) {
                    setUserData(prev => ({ ...prev, permissions: suggestedPerms }))
                }
            }
        }
    }, [userData.roleId, userModalOpen]) // Depend on roleId changes while modal is open

    const handleResetPassword = async () => {
        if (!newPassword || !selectedUser) return;

        try {
            await usersAPI.update(selectedUser.id, { password: newPassword });
            toast({
                title: 'Contraseña Actualizada',
                description: 'La contraseña ha sido cambiada exitosamente.',
            });
            setPasswordModalOpen(false)
            setNewPassword('')
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo cambiar la contraseña',
                variant: 'destructive',
            });
        }
    }

    const handleDeleteUser = async () => {
        if (!selectedUser && selectedUsers.length === 0) return;

        try {
            if (selectedUser) {
                await usersAPI.delete(selectedUser.id);
            } else {
                // Bulk delete
                await Promise.all(selectedUsers.map(id => usersAPI.delete(id)));
                setSelectedUsers([]);
            }

            toast({
                title: selectedUser ? 'Usuario Eliminado' : 'Usuarios Eliminados',
                description: 'La operación se completó correctamente.',
            });
            setDeleteModalOpen(false);
            loadAdminData();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error en la operación',
                variant: 'destructive',
            })
        }
    }

    const handleExportUsers = () => {
        const usersToExport = selectedUsers.length > 0
            ? adminData.users.filter((u: any) => selectedUsers.includes(u.id))
            : adminData.users;

        const headers = ['Nombre', 'Apellido', 'Email', 'Rol', 'Estado'];
        const rows = usersToExport.map((u: any) => [
            u.firstName,
            u.lastName,
            u.email,
            u.role?.name || 'N/A',
            u.isActive ? 'Activo' : 'Inactivo'
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `edicarex_users_${format(new Date(), 'yyyyMMdd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: 'Exportación Exitosa', description: 'El archivo CSV ha sido generado.' });
    }

    const handleCreateBackup = async () => {
        setIsCreatingBackup(true)
        setBackupPhase('ANALYSIS')
        try {
            await new Promise(r => setTimeout(r, 600)) // Simulation of heavy processing
            setBackupPhase('EXPORT')
            await adminAPI.createBackup()
            setBackupPhase('CHECKSUM')
            await new Promise(r => setTimeout(r, 400)) // Checksum phase
            setBackupPhase('COMPLETED')

            toast({
                title: 'Respaldo Creado',
                description: 'La copia de seguridad se ha completado e incorporado integridad SHA-256.',
            })
            loadAdminData()
            setTimeout(() => setBackupPhase('IDLE'), 2000)
        } catch (error) {
            setBackupPhase('IDLE')
            toast({
                title: 'Error',
                description: 'No se pudo crear el respaldo',
                variant: 'destructive'
            })
        } finally {
            setIsCreatingBackup(false)
        }
    }

    const handleVerifyIntegrity = async (filename: string) => {
        setVerifyingFilename(filename)
        try {
            const result = await adminAPI.verifyBackup(filename)
            setIntegrityResults(prev => ({ ...prev, [filename]: result.data }))
            if (result.data.valid) {
                toast({
                    title: "Integridad Verificada",
                    description: "El archivo SHA-256 coincide con el sello maestro.",
                })
            } else {
                toast({
                    title: "Alerta de Integridad",
                    description: "El archivo ha sido modificado o está corrompido.",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error de Verificación",
                description: "No se encontró el sello de integridad meta.json.",
                variant: "destructive",
            })
        } finally {
            setVerifyingFilename(null)
        }
    }

    const handleRestoreBackup = async () => {
        if (restoreConfirmText !== 'RESTAURAR') {
            toast({
                title: "Error de Validación",
                description: "Por favor escriba 'RESTAURAR' para confirmar.",
                variant: "destructive",
            })
            return
        }

        setIsRestoring(true)
        try {
            await adminAPI.restoreBackup(selectedBackup.id)
            toast({
                title: "Sistema Restaurado",
                description: "Los datos han sido restaurados exitosamente.",
            })
            setRestoreConfirmOpen(false)
            setRestoreConfirmText('')
            // Recargar la aplicación para aplicar los cambios de datos
            window.location.reload()
        } catch (error) {
            toast({
                title: "Error Crítico",
                description: "Falló la restauración de datos.",
                variant: "destructive",
            })
        } finally {
            setIsRestoring(false)
        }
    }

    const handleDeleteBackup = async () => {
        if (!selectedBackup) return
        try {
            await adminAPI.deleteBackup(selectedBackup.id)
            toast({
                title: "Respaldo Eliminado",
                description: "La copia de seguridad ha sido purgada del servidor.",
            })
            setDeleteBackupConfirmOpen(false)
            setSelectedBackup(null)
            loadAdminData()
        } catch (error) {
            toast({
                title: "Error de Purga",
                description: "No se pudo eliminar el archivo físico del respaldo.",
                variant: "destructive",
            })
        }
    }

    const handleCleanupBackups = async () => {
        setIsCleaningBackups(true)
        try {
            const result = await adminAPI.cleanupBackups()
            toast({
                title: "Limpieza Ejecutada",
                description: `Se han purgado ${result.data.deleted} respaldos antiguos (>30 días).`,
            })
            loadAdminData()
        } catch (error) {
            toast({
                title: "Error en Cleanup",
                description: "La política de retención no pudo ejecutarse.",
                variant: "destructive",
            })
        } finally {
            setIsCleaningBackups(false)
        }
    }

    const handleSaveSettings = async () => {
        try {
            await adminAPI.updateOrganization(adminData.settings)
            toast({
                title: 'Configuración Guardada',
                description: 'Ajustes del sistema actualizados exitosamente',
            })
            await refreshConfig()
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' })
        }
    }

    // Helper to update deeply nested settings state
    const updateSetting = (path: string, value: any) => {
        const keys = path.split('.')
        setAdminData((prev: any) => {
            const newSettings = JSON.parse(JSON.stringify(prev.settings))
            let current = newSettings
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {}
                current = current[keys[i]]
            }
            current[keys[keys.length - 1]] = value

            // Validate settings
            const errors = validateSettings(newSettings)
            setValidationErrors(errors)

            // Mark as having unsaved changes
            setHasUnsavedChanges(true)

            return { ...prev, settings: newSettings }
        })
    }

    // Auto-save hook - saves settings automatically after 2 seconds of inactivity
    const { isSaving, lastSaved } = useAutoSave(
        adminData.settings,
        async (settings) => {
            if (hasUnsavedChanges && Object.keys(validationErrors).length === 0) {
                await adminAPI.updateOrganization(settings);
                setHasUnsavedChanges(false);
                toast({
                    title: 'Configuración guardada',
                    description: 'Los cambios se guardaron automáticamente',
                });
                await refreshConfig();
            }
        },
        { delay: 2000, enabled: hasUnsavedChanges }
    );

    // Logo upload handler
    const handleLogoUpload = async (file: File) => {
        // Validate file
        const validationError = validateLogoFile(file);
        if (validationError) {
            toast({
                title: 'Error de validación',
                description: validationError,
                variant: 'destructive',
            });
            return;
        }

        // Process image (Remove background & Auto-crop)
        try {
            const processed = await processLogoImage(file);
            setLogoPreview(processed.preview);

            // Upload the processed file instead of the original
            const response = await messagesAPI.uploadFile(processed.file);

            // Update configuration
            await adminAPI.updateOrganization({
                logo: response.data.url
            });

            // Update local state
            setAdminData((prev: any) => ({
                ...prev,
                settings: { ...prev.settings, logo: response.data.url }
            }));

            toast({
                title: 'Logo inteligente procesado',
                description: 'Se eliminó el fondo y se ajustó el margen automáticamente.',
            });

            // Refresh global context
            await refreshConfig();
        } catch (error) {
            console.error('Error processing logo:', error);

            // Fallback to original file if processing fails
            const response = await messagesAPI.uploadFile(file);

            await adminAPI.updateOrganization({
                logo: response.data.url
            });

            setAdminData((prev: any) => ({
                ...prev,
                settings: { ...prev.settings, logo: response.data.url }
            }));

            await refreshConfig();
        }
    };

    const getRoleBadge = (roleName: string) => {
        // Simple mapping based on Role Name
        const colors: Record<string, string> = {
            'Admin': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400 ring-indigo-500/40',
            'Staff': 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 ring-blue-500/40',
            'Nurse': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400 ring-cyan-500/40',
            'Receptionist': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 ring-emerald-500/40',
            'ADMIN': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400 ring-indigo-500/40',
            'STAFF': 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 ring-blue-500/40',
        }
        const match = Object.keys(colors).find(key => roleName?.includes(key))
        return match ? colors[match] : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400 ring-gray-500/40'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Use default hours if not present
    const hours = adminData.settings.openingHours || {}
    const billing = adminData.settings.billing || {}
    const ai = adminData.settings.ai || { features: {} }

    return (
        <div className="space-y-8 p-6 pb-20 bg-muted/10 min-h-screen">
            {/* Header Pro - SOLID */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-lg bg-edicarex flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Shield className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sistema</h1>
                        <p className="text-muted-foreground mt-1 text-base">
                            Control centralizado de seguridad, usuarios y configuraciones
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-muted rounded-md border border-border text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        {adminData.settings.hospitalName || 'EdiCarex'} v2.5.0 Enterprise
                    </div>
                </div>
            </div>

            {/* Tabs Pro - SOLID */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 w-full max-w-3xl bg-muted/50 p-1 border border-border/50 rounded-xl mb-6">
                    <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-edicarex data-[state=active]:text-white transition-all duration-300">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Vista General
                    </TabsTrigger>
                    <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-edicarex data-[state=active]:text-white transition-all duration-300">
                        <Users className="h-4 w-4 mr-2" />
                        Usuarios
                    </TabsTrigger>
                    <TabsTrigger value="system" className="rounded-lg data-[state=active]:bg-edicarex data-[state=active]:text-white transition-all duration-300">
                        <Settings className="h-4 w-4 mr-2" />
                        Sistema
                    </TabsTrigger>
                    <TabsTrigger value="backups" className="rounded-lg data-[state=active]:bg-edicarex data-[state=active]:text-white transition-all duration-300">
                        <Database className="h-4 w-4 mr-2" />
                        Respaldos
                    </TabsTrigger>
                    <TabsTrigger value="roles" className="rounded-lg data-[state=active]:bg-edicarex data-[state=active]:text-white transition-all duration-300">
                        <Shield className="h-4 w-4 mr-2" />
                        Roles
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* CPU Monitor */}
                        <Card className="bg-card border-border overflow-hidden group hover:border-blue-500 transition-all duration-300 shadow-md">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Carga del CPU</p>
                                        <h3 className="text-3xl font-bold tracking-tight text-blue-500">
                                            {adminData.systemStats?.infrastructure.cpu.usage || 0}%
                                        </h3>
                                    </div>
                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                        <Cpu className="h-6 w-6 text-blue-500" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                                    <span>{adminData.systemStats?.infrastructure.cpu.cores} CORES</span>
                                    <span>{adminData.systemStats?.infrastructure.cpu.model.split(' ')[0]}</span>
                                </div>
                                <div className="mt-2 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${adminData.systemStats?.infrastructure.cpu.usage || 0}%` }}
                                        className="h-full bg-blue-500"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Memory Monitor */}
                        <Card className="bg-card border-border overflow-hidden group hover:border-purple-500 transition-all duration-300 shadow-md">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Memoria RAM</p>
                                        <h3 className="text-3xl font-bold tracking-tight text-purple-500">
                                            {adminData.systemStats?.infrastructure.memory.usagePercent || 0}%
                                        </h3>
                                    </div>
                                    <div className="p-3 bg-purple-500/10 rounded-xl">
                                        <HardDrive className="h-6 w-6 text-purple-500" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                                    <span>TOTAL: {adminData.systemStats?.infrastructure.memory.total} GB</span>
                                    <span>LIBRE: {adminData.systemStats?.infrastructure.memory.free} GB</span>
                                </div>
                                <div className="mt-2 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${adminData.systemStats?.infrastructure.memory.usagePercent || 0}%` }}
                                        className="h-full bg-purple-500"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Database Health */}
                        <Card className="bg-card border-border overflow-hidden group hover:border-emerald-500 transition-all duration-300 shadow-md">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Base de Datos</p>
                                        <h3 className="text-3xl font-bold tracking-tight text-emerald-500">
                                            {adminData.systemStats?.database.counts.users || 0}
                                        </h3>
                                    </div>
                                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                                        <Database className="h-6 w-6 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500">{adminData.systemStats?.database.counts.patients} PACIENTES</Badge>
                                    <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500">{adminData.systemStats?.database.counts.appointments} CITAS</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Uptime / Maintenance */}
                        <Card className="bg-card border-border overflow-hidden group hover:border-orange-500 transition-all duration-300 shadow-md">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tiempo de Actividad</p>
                                        <h3 className="text-xl font-black text-orange-500 uppercase">
                                            {adminData.systemStats?.infrastructure.uptime.days}d {adminData.systemStats?.infrastructure.uptime.hours}h {adminData.systemStats?.infrastructure.uptime.minutes}m
                                        </h3>
                                    </div>
                                    <div className="p-2 bg-orange-500/10 rounded-lg">
                                        <Clock className="h-5 w-5 text-orange-500" />
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={maintenanceMode}
                                            disabled={!hasPermission('SETTINGS_EDIT')}
                                            onCheckedChange={async (checked) => {
                                                try {
                                                    await adminAPI.updateOrganization({ maintenanceMode: checked });
                                                    setMaintenanceMode(checked);
                                                    // Update settings state to prevent overwrite on next save
                                                    setAdminData((prev: any) => ({
                                                        ...prev,
                                                        settings: { ...prev.settings, maintenanceMode: checked }
                                                    }));

                                                    toast({
                                                        title: checked ? 'Modo Mantenimiento Activado' : 'Modo Mantenimiento Desactivado',
                                                        description: checked ? 'El sistema ahora es privado para administradores.' : 'El sistema vuelve a estar público.',
                                                    });
                                                    await refreshConfig();
                                                } catch (error) {
                                                    toast({
                                                        title: 'Error',
                                                        description: 'No se pudo cambiar el estado de mantenimiento',
                                                        variant: 'destructive',
                                                    });
                                                }
                                            }}
                                        />
                                        <span className="text-[10px] font-bold text-muted-foreground">MODO MANT.</span>
                                    </div>
                                    {maintenanceMode && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Services Monitor */}
                        <Card className="md:col-span-2 border-border bg-card shadow-sm">
                            <CardHeader className="border-b border-border/50 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Server className="h-5 w-5 text-edicarex" />
                                            Monitor de Servicios CORE
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            Estado de integración y latencia
                                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-mono text-muted-foreground">
                                                Actualizado: {new Date().toLocaleTimeString()}
                                            </span>
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 p-0 rounded-full hover:bg-muted/80"
                                            onClick={() => loadAdminData()}
                                            title="Actualizar monitor"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                                            <CheckCircle2 className="h-3 w-3 animate-pulse" />
                                            SISTEMA ÍNTEGRO
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2">
                                    {adminData.systemHealth.map((service: any) => (
                                        <div key={service.id} className="p-6 flex items-center justify-between border-b border-r border-border/50 last:border-b-0 group hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl ${service.status === 'OPERATIONAL' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                                    <Fingerprint className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-foreground">{service.name}</h4>
                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">{service.type}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-black text-foreground">{service.latency > 0 ? `${service.latency}ms` : '-'}</div>
                                                <div className={`text-[9px] font-bold uppercase ${service.status === 'OPERATIONAL' ? 'text-green-500' : service.status === 'DEGRADED' ? 'text-yellow-500' : 'text-red-500'}`}>
                                                    {service.status === 'OPERATIONAL' ? 'ONLINE' : service.status === 'DEGRADED' ? 'LENTO' : 'OFFLINE'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Environment Auditor */}
                        <div className="space-y-6">
                            <Card className="border-border bg-card shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter">
                                        <Globe className="h-4 w-4 text-blue-500" />
                                        Auditor de Entorno
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Servidor</span>
                                        <span className="text-xs font-black text-foreground">{adminData.systemStats?.infrastructure.environment?.hostname || 'SRV-01'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Entorno</span>
                                        <span className="text-xs font-black text-edicarex">Node.js {adminData.systemStats?.infrastructure.environment?.nodeVal || 'v20.x'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Plataforma</span>
                                        <span className="text-xs font-black text-right max-w-[150px] truncate" title={adminData.systemStats?.infrastructure.environment?.platform}>{adminData.systemStats?.infrastructure.environment?.platform || 'Desconocido'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Carga CPU</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-16 bg-muted-foreground/20 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-500 transition-all duration-1000"
                                                    style={{ width: `${Math.min(adminData.systemStats?.infrastructure.cpu.usage || 0, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black">{adminData.systemStats?.infrastructure.cpu.usage.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900 border-none shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Shield className="h-24 w-24 text-white" />
                                </div>
                                <CardContent className="p-5 relative z-10 space-y-4">
                                    <div>
                                        <h4 className="text-white font-black text-sm mb-0.5 flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-green-400" />
                                            Estado de Seguridad
                                        </h4>
                                        <p className="text-slate-400 text-[10px]">Protocolos activos y validados.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2 bg-white/5 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-1">
                                            <span className={`h-2 w-2 rounded-full ${adminData.systemStats?.infrastructure.security?.https ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-red-500'}`} />
                                            <span className="text-[9px] font-bold text-slate-300 uppercase">HTTPS</span>
                                        </div>
                                        <div className="p-2 bg-white/5 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-1">
                                            <span className={`h-2 w-2 rounded-full ${adminData.systemStats?.infrastructure.security?.dbEncryption ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-red-500'}`} />
                                            <span className="text-[9px] font-bold text-slate-300 uppercase">SSL BD</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cabeceras Activas</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {adminData.systemStats?.infrastructure.security?.headers?.map((h: any, i: number) => (
                                                <div key={i} className="px-2 py-0.5 bg-slate-800 rounded text-[9px] text-slate-300 font-mono border border-slate-700 flex items-center gap-1">
                                                    <span className="h-1 w-1 rounded-full bg-green-500" />
                                                    {h.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* A. Users Tab */}
                < TabsContent value="users" className="mt-0" >
                    <Card className="overflow-hidden border-none shadow-xl transition-all">
                        <div className="absolute top-0 left-0 w-full h-1 bg-edicarex" />
                        <CardHeader className="border-b border-border bg-muted/10 px-6 py-5">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <CardTitle className="text-xl text-edicarex">Directorio de Usuarios</CardTitle>
                                    <CardDescription>Gestiona el acceso y roles del personal médico</CardDescription>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar usuario..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 bg-background border-border focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <AnimatePresence>
                                        {selectedUsers.length > 0 && hasPermission('ADMIN_EDIT') && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="flex items-center gap-2"
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleExportUsers}
                                                    className="border-green-500/50 text-green-600 hover:bg-green-50"
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Exportar ({selectedUsers.length})
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setDeleteModalOpen(true)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Eliminar
                                                </Button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {hasPermission('ADMIN_EDIT') && (
                                        <Button onClick={() => handleOpenUserModal(null)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Nuevo Usuario
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="hover:bg-transparent border-b border-border">
                                        <TableHead className="w-12 pl-6">
                                            <input
                                                type="checkbox"
                                                className="rounded border-border"
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedUsers(adminData.users.map((u: any) => u.id))
                                                    } else {
                                                        setSelectedUsers([])
                                                    }
                                                }}
                                            />
                                        </TableHead>
                                        <TableHead className="h-12 font-semibold text-foreground">Usuario / Email</TableHead>
                                        <TableHead className="font-semibold text-foreground hidden md:table-cell">Contacto</TableHead>
                                        <TableHead className="font-semibold text-foreground hidden lg:table-cell">Profesional</TableHead>
                                        <TableHead className="font-semibold text-foreground">Rol Asignado</TableHead>
                                        <TableHead className="font-semibold text-foreground">Estado</TableHead>
                                        <TableHead className="text-right pr-6 font-semibold text-foreground">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {adminData.users
                                        .filter((user: any) => {
                                            const rName = user.role?.name || user.role || '';
                                            const searchMatch = (
                                                user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                user.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                            );
                                            return String(rName).toLowerCase() !== 'patient' && searchMatch;
                                        })
                                        .map((user: any) => {
                                            const getSafeRoleName = (r: any) => {
                                                if (!r) return 'Sin Rol';
                                                let rName = (typeof r === 'object' ? r.name : r) || '';
                                                // Remove uppercase to match new keys
                                                if (String(rName).toUpperCase() === 'UNDEFINED') return 'Sin Rol';
                                                return ROLE_DISPLAY_NAMES[rName] || rName;
                                            }

                                            return (
                                                <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
                                                    <TableCell className="pl-6">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.includes(user.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedUsers([...selectedUsers, user.id])
                                                                } else {
                                                                    setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                                                                }
                                                            }}
                                                            className="rounded border-border"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0 border border-border">
                                                                {user.profileImage ? (
                                                                    <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                                                                        <span className="font-bold text-xs">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                                                                    {user.firstName} {user.lastName}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground font-light">{user.email}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        <div className="flex flex-col text-xs">
                                                            {user.phone && <span className="text-foreground">{user.phone}</span>}
                                                            {user.city && <span className="text-muted-foreground">{user.city}, {user.country}</span>}
                                                            {!user.phone && !user.city && <span className="text-muted-foreground/50">-</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="flex flex-col text-xs">
                                                            {user.specialty && <span className="font-medium text-foreground">{user.specialty}</span>}
                                                            {user.department && <span className="text-muted-foreground">{user.department}</span>}
                                                            {user.licenseNumber && <span className="text-muted-foreground text-[10px]">Lic: {user.licenseNumber}</span>}
                                                            {!user.specialty && !user.department && <span className="text-muted-foreground/50">-</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${getRoleBadge(user.role?.name)}`}>
                                                            {getSafeRoleName(user.role)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-edicarex shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'bg-red-500'}`} />
                                                            <span className={`text-xs font-medium ${user.isActive ? 'text-cyan-700 dark:text-cyan-400' : 'text-red-700 dark:text-red-400'}`}>
                                                                {user.isActive ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                            {hasPermission('ADMIN_EDIT') && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                                                    onClick={() => handleOpenUserModal(user)}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {hasPermission('ADMIN_EDIT') && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 hover:bg-orange-500/10 hover:text-orange-600 transition-colors"
                                                                    onClick={() => {
                                                                        setSelectedUser(user);
                                                                        setPasswordModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Key className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {hasPermission('ADMIN_EDIT') && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                                                                    onClick={() => {
                                                                        setSelectedUser(user);
                                                                        setDeleteModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent >
                {/* B. System Settings Tab */}
                < TabsContent value="system" className="mt-6 space-y-6" >
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* LEFT COLUMN: Identity & Operations */}
                        <div className="space-y-6">
                            {/* Logo & Basic Info */}
                            <Card className="overflow-hidden border-none shadow-xl transition-all h-full">
                                <div className="absolute top-0 left-0 w-full h-1 bg-edicarex opacity-70" />
                                <CardHeader className="bg-muted/10 border-b border-border pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                                <ImageIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">Identidad Institucional</CardTitle>
                                                <CardDescription>Información básica de la organización</CardDescription>
                                            </div>
                                        </div>
                                        {/* Save Status Indicator */}
                                        <div className="flex items-center gap-2 text-sm">
                                            {isSaving ? (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span className="hidden sm:inline">Guardando...</span>
                                                </div>
                                            ) : lastSaved ? (
                                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                    <Check className="h-4 w-4" />
                                                    <span className="hidden sm:inline">
                                                        {formatDistanceToNow(lastSaved, { locale: es, addSuffix: true })}
                                                    </span>
                                                </div>
                                            ) : hasUnsavedChanges ? (
                                                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span className="hidden sm:inline">Sin guardar</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="flex flex-col sm:flex-row items-start gap-6">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="grid grid-cols-2 gap-4 w-full max-w-[320px]">
                                                {/* Light Preview */}
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-full aspect-square rounded-lg border bg-white flex items-center justify-center p-4 relative group">
                                                        <img
                                                            src={logoPreview || adminData.settings.logo || 'https://via.placeholder.com/150'}
                                                            alt="Preview Light"
                                                            className={cn(
                                                                "max-w-full max-h-full object-contain transition-all",
                                                                adminData.settings.branding?.logoType === 'light' && "invert brightness-0"
                                                            )}
                                                        />
                                                        <div className="absolute top-1 right-1">
                                                            <Sun className="h-3 w-3 text-orange-500" />
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground font-medium">Vista Sol</span>
                                                </div>

                                                {/* Dark Preview */}
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-full aspect-square rounded-lg border bg-slate-950 flex items-center justify-center p-4 relative group">
                                                        <img
                                                            src={logoPreview || adminData.settings.logo || 'https://via.placeholder.com/150'}
                                                            alt="Preview Dark"
                                                            className={cn(
                                                                "max-w-full max-h-full object-contain transition-all",
                                                                adminData.settings.branding?.logoType !== 'light' && "invert brightness-200"
                                                            )}
                                                        />
                                                        <div className="absolute top-1 right-1">
                                                            <Moon className="h-3 w-3 text-blue-400" />
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground font-medium">Vista Luna</span>
                                                </div>
                                            </div>

                                            {hasPermission('SETTINGS_EDIT') && (
                                                <div className="mt-2">
                                                    <label htmlFor="logo-upload" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-bold hover:bg-indigo-500/20 cursor-pointer transition-colors border border-indigo-500/20">
                                                        <Upload className="h-3 w-3" />
                                                        CAMBIAR LOGO
                                                    </label>
                                                </div>
                                            )}
                                            <div className="flex flex-col w-full gap-2">
                                                <div className="flex flex-col w-full gap-4 pt-2">
                                                    <div className="space-y-2">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">Tipo de Logo Principal</span>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <Button
                                                                type="button"
                                                                variant={adminData.settings.branding?.logoType !== 'light' ? 'default' : 'outline'}
                                                                className={cn(
                                                                    "h-10 text-[10px] uppercase font-black tracking-widest transition-all",
                                                                    adminData.settings.branding?.logoType !== 'light' && "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-950/20"
                                                                )}
                                                                onClick={() => updateSetting('branding.logoType', 'dark')}
                                                                disabled={!hasPermission('SETTINGS_EDIT')}
                                                            >
                                                                Oscuro (Negro)
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant={adminData.settings.branding?.logoType === 'light' ? 'default' : 'outline'}
                                                                className={cn(
                                                                    "h-10 text-[10px] uppercase font-black tracking-widest transition-all",
                                                                    adminData.settings.branding?.logoType === 'light' && "bg-white hover:bg-slate-100 text-black shadow-lg shadow-slate-200/20"
                                                                )}
                                                                onClick={() => updateSetting('branding.logoType', 'light')}
                                                                disabled={!hasPermission('SETTINGS_EDIT')}
                                                            >
                                                                Claro (Blanco)
                                                            </Button>
                                                        </div>
                                                        <p className="text-[9px] text-muted-foreground/60 italic px-1">
                                                            {adminData.settings.branding?.logoType === 'light'
                                                                ? "Tu logo es blanco/claro. Se invertirá a negro automáticamente en fondos claros."
                                                                : "Tu logo es negro/oscuro. Se invertirá a blanco automáticamente en fondos oscuros."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                id="logo-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                                            />
                                            {hasPermission('SETTINGS_EDIT') && (
                                                <label htmlFor="logo-upload" className="cursor-pointer">
                                                    <div className="w-full">
                                                        <Button variant="outline" size="sm" className="w-full text-xs h-8 pointer-events-none">
                                                            <Upload className="h-3 w-3 mr-1" />
                                                            Cambiar Logo
                                                        </Button>
                                                    </div>
                                                </label>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-4 w-full">
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground font-medium text-xs uppercase tracking-wide">Nombre de la Institución</Label>
                                                <Input
                                                    value={adminData.settings.hospitalName || ''}
                                                    onChange={(e) => updateSetting('hospitalName', e.target.value)}
                                                    disabled={!hasPermission('SETTINGS_EDIT')}
                                                    className="font-medium text-lg h-11 bg-background border-border focus:border-indigo-500"
                                                    placeholder="Ej. Centro Médico Central"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground font-medium text-xs uppercase tracking-wide">Dirección Física</Label>
                                                <Input
                                                    value={adminData.settings.address || ''}
                                                    onChange={(e) => updateSetting('address', e.target.value)}
                                                    disabled={!hasPermission('SETTINGS_EDIT')}
                                                    className="bg-background border-border focus:border-indigo-500"
                                                    placeholder="Ej. Av. Principal 123"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground font-medium text-xs uppercase tracking-wide">Teléfono de Contacto</Label>
                                            <Input
                                                value={adminData.settings.phone || ''}
                                                onChange={(e) => updateSetting('phone', e.target.value)}
                                                disabled={!hasPermission('SETTINGS_EDIT')}
                                                className={`bg-background border-border focus:border-indigo-500 ${validationErrors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                            {validationErrors.phone && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {validationErrors.phone}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground font-medium text-xs uppercase tracking-wide">Email de Soporte</Label>
                                            <Input
                                                type="email"
                                                value={adminData.settings.email || ''}
                                                onChange={(e) => updateSetting('email', e.target.value)}
                                                disabled={!hasPermission('SETTINGS_EDIT')}
                                                className={`bg-background border-border focus:border-indigo-500 ${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                            {validationErrors.email && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {validationErrors.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Billing Parameters */}
                            <Card className="overflow-hidden border-none shadow-xl transition-all">
                                <div className="absolute top-0 left-0 w-full h-1 bg-edicarex opacity-50" />
                                <CardHeader className="bg-muted/10 border-b border-border pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                                            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-green-700 dark:text-green-400">Facturación y Finanzas</CardTitle>
                                            <CardDescription>Configuración fiscal y monetaria</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground font-medium text-xs uppercase tracking-wide">Moneda Base</Label>
                                            <Select
                                                value={billing.currency || 'USD'}
                                                onValueChange={(v) => updateSetting('billing.currency', v)}
                                                disabled={!hasPermission('SETTINGS_EDIT')}
                                            >
                                                <SelectTrigger className="bg-background border-border focus:border-green-500">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                                                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                                    <SelectItem value="PEN">Soles (PEN)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">Impuesto (%)</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={billing.taxRate || ''}
                                                    onChange={(e) => updateSetting('billing.taxRate', Number(e.target.value))}
                                                    disabled={!hasPermission('SETTINGS_EDIT')}
                                                    className="pr-8"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">RUC / ID Fiscal</Label>
                                            <Input
                                                value={billing.taxId || ''}
                                                onChange={(e) => updateSetting('billing.taxId', e.target.value)}
                                                disabled={!hasPermission('SETTINGS_EDIT')}
                                                placeholder="Ej. 20601234567"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">Prefijo Factura</Label>
                                            <Input
                                                value={billing.invoicePrefix || ''}
                                                onChange={(e) => updateSetting('billing.invoicePrefix', e.target.value)}
                                                disabled={!hasPermission('SETTINGS_EDIT')}
                                                placeholder="FACT-"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: Hours & AI */}
                        <div className="space-y-6">
                            {/* Hospital Hours */}
                            <Card className="overflow-hidden border-none shadow-xl transition-all">
                                <div className="absolute top-0 left-0 w-full h-1 bg-edicarex opacity-70" />
                                <CardHeader className="bg-muted/10 border-b border-border pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                                            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-orange-700 dark:text-orange-400">Horarios de Atención</CardTitle>
                                            <CardDescription>Gestión de turnos operativos</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-1">
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                                            const dayHours = hours[day] || { open: '', close: '', enabled: false };
                                            return (
                                                <div key={day} className="flex items-center gap-4 py-2 hover:bg-muted/50 rounded-lg px-2 transition-colors">
                                                    <div className="w-28 font-medium text-sm text-foreground/80 capitalize">
                                                        {({
                                                            'monday': 'Lunes', 'tuesday': 'Martes', 'wednesday': 'Miércoles',
                                                            'thursday': 'Jueves', 'friday': 'Viernes', 'saturday': 'Sábado',
                                                            'sunday': 'Domingo'
                                                        } as Record<string, string>)[day] || day}
                                                    </div>
                                                    <Switch
                                                        checked={!!dayHours.enabled}
                                                        disabled={!hasPermission('SETTINGS_EDIT')}
                                                        onCheckedChange={(c) => updateSetting(`openingHours.${day}.enabled`, c)}
                                                    />
                                                    <div className="flex-1 flex gap-2 items-center">
                                                        <Input
                                                            type="time"
                                                            value={dayHours.open || ''}
                                                            onChange={(e) => updateSetting(`openingHours.${day}.open`, e.target.value)}
                                                            className="h-8 text-sm bg-background border-border"
                                                            disabled={!dayHours.enabled || !hasPermission('SETTINGS_EDIT')}
                                                        />
                                                        <span className="text-xs text-muted-foreground">a</span>
                                                        <Input
                                                            type="time"
                                                            value={dayHours.close || ''}
                                                            onChange={(e) => updateSetting(`openingHours.${day}.close`, e.target.value)}
                                                            className="h-8 text-sm bg-background border-border"
                                                            disabled={!dayHours.enabled || !hasPermission('SETTINGS_EDIT')}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* AI Configuration */}
                            <Card className="overflow-hidden border-none shadow-xl transition-all">
                                <div className="absolute top-0 left-0 w-full h-1 bg-edicarex" />
                                <CardHeader className="bg-muted/10 border-b border-border pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                                                <AILogoIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-semibold text-purple-700 dark:text-purple-400">Motor de Inteligencia Artificial</CardTitle>
                                                <CardDescription>Configuración de modelos y asistencia</CardDescription>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={!!ai.enabled}
                                            disabled={!hasPermission('SETTINGS_EDIT')}
                                            onCheckedChange={(c) => updateSetting('ai.enabled', c)}
                                            className="data-[state=checked]:bg-purple-600"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">Modelo Principal</Label>
                                            <Select
                                                value={ai.model || 'GPT-4'}
                                                onValueChange={(v) => updateSetting('ai.model', v)}
                                                disabled={!ai.enabled || !hasPermission('SETTINGS_EDIT')}
                                            >
                                                <SelectTrigger className="bg-background border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="llama-3.3-70b-versatile">Meta Llama 3.3 70B (Producción)</SelectItem>
                                                    <SelectItem value="llama-3.1-8b-instant">Meta Llama 3.1 8B (Instantáneo)</SelectItem>
                                                    <SelectItem value="openai/gpt-oss-120b">OpenAI GPT OSS 120B (Flagship)</SelectItem>
                                                    <SelectItem value="groq/compound">Groq Compound (Sistema Agente)</SelectItem>
                                                    <SelectItem value="groq/compound-mini">Groq Compound Mini</SelectItem>
                                                    <SelectItem value="qwen/qwen3-32b">Qwen 3 32B (Preview)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                                <Sliders className="h-4 w-4" />
                                                Nivel de Creatividad (Temperatura)
                                            </Label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {[
                                                    {
                                                        id: 'precise',
                                                        label: 'Preciso (Médico)',
                                                        desc: 'Máxima precisión para diagnósticos.',
                                                        icon: Shield,
                                                        color: 'blue'
                                                    },
                                                    {
                                                        id: 'balanced',
                                                        label: 'Equilibrado',
                                                        desc: 'Resúmenes y consultas generales.',
                                                        icon: Sliders,
                                                        color: 'edicarex'
                                                    },
                                                    {
                                                        id: 'creative',
                                                        label: 'Creativo (Marketing)',
                                                        desc: 'Fluidez para comunicación detallada.',
                                                        icon: Sparkles,
                                                        color: 'purple'
                                                    }
                                                ].map((mode) => (
                                                    <motion.div
                                                        key={mode.id}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => ai.enabled && hasPermission('SETTINGS_EDIT') && updateSetting('ai.creativity', mode.id)}
                                                        className={cn(
                                                            "relative p-4 rounded-xl border-2 transition-all cursor-pointer group overflow-hidden",
                                                            ai.creativity === mode.id || (!ai.creativity && mode.id === 'balanced')
                                                                ? `border-${mode.color === 'blue' ? 'blue-500' : mode.color === 'purple' ? 'purple-500' : 'edicarex'} bg-${mode.color === 'blue' ? 'blue' : mode.color === 'purple' ? 'purple' : 'edicarex'}/5 shadow-lg`
                                                                : "border-border hover:border-border/80 bg-background",
                                                            (!ai.enabled || !hasPermission('SETTINGS_EDIT')) && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                                                            <mode.icon className="h-8 w-8" />
                                                        </div>
                                                        <div className="flex flex-col gap-1 relative z-10">
                                                            <div className="flex items-center gap-2">
                                                                <mode.icon className={cn(
                                                                    "h-4 w-4",
                                                                    ai.creativity === mode.id || (!ai.creativity && mode.id === 'balanced') ? `text-${mode.color === 'blue' ? 'blue-500' : mode.color === 'purple' ? 'purple-500' : 'edicarex'}` : "text-muted-foreground"
                                                                )} />
                                                                <span className="text-sm font-bold">{mode.label}</span>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground leading-tight">
                                                                {mode.desc}
                                                            </p>
                                                        </div>
                                                        {(ai.creativity === mode.id || (!ai.creativity && mode.id === 'balanced')) && (
                                                            <div className={cn(
                                                                "absolute bottom-0 right-0 p-1 rounded-tl-lg text-white",
                                                                `bg-${mode.color === 'blue' ? 'blue-500' : mode.color === 'purple' ? 'purple-500' : 'edicarex'}`
                                                            )}>
                                                                <Check className="h-3 w-3" />
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2 border-t border-border">
                                        <Label className="text-sm font-semibold text-muted-foreground">Módulos Activos</Label>
                                        <div className="flex items-center justify-between p-3 rounded-md bg-background border border-border">
                                            <div className="flex items-center gap-3">
                                                <Stethoscope className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">Asistente de Triage Clínico</span>
                                            </div>
                                            <Switch
                                                checked={!!ai.features?.triage}
                                                onCheckedChange={(c) => updateSetting('ai.features.triage', c)}
                                                disabled={!ai.enabled || !hasPermission('SETTINGS_EDIT')}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-md bg-background border border-border">
                                            <div className="flex items-center gap-3">
                                                <Activity className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">Soporte al Diagnóstico</span>
                                            </div>
                                            <Switch
                                                checked={!!ai.features?.diagnosis}
                                                onCheckedChange={(c) => updateSetting('ai.features.diagnosis', c)}
                                                disabled={!ai.enabled || !hasPermission('SETTINGS_EDIT')}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-md bg-background border border-border">
                                            <div className="flex items-center gap-3">
                                                <Cpu className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">Asistente Médico (Soporte Staff)</span>
                                            </div>
                                            <Switch
                                                checked={!!ai.features?.staffAssistant}
                                                onCheckedChange={(c) => updateSetting('ai.features.staffAssistant', c)}
                                                disabled={!ai.enabled || !hasPermission('SETTINGS_EDIT')}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-md bg-background border border-border">
                                            <div className="flex items-center gap-3">
                                                <FileSignature className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">Generador de Documentos Clínicos</span>
                                            </div>
                                            <Switch
                                                checked={!!ai.features?.documentGenerator}
                                                onCheckedChange={(c) => updateSetting('ai.features.documentGenerator', c)}
                                                disabled={!ai.enabled || !hasPermission('SETTINGS_EDIT')}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-md bg-background border border-border">
                                            <div className="flex items-center gap-3">
                                                <BarChart3 className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">Analítica Predictiva (Logística)</span>
                                            </div>
                                            <Switch
                                                checked={!!ai.features?.predictiveAnalytics}
                                                onCheckedChange={(c) => updateSetting('ai.features.predictiveAnalytics', c)}
                                                disabled={!ai.enabled || !hasPermission('SETTINGS_EDIT')}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-md bg-background border border-border">
                                            <div className="flex items-center gap-3">
                                                <Package className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">Gestión de Stock de Farmacia</span>
                                            </div>
                                            <Switch
                                                checked={!!ai.features?.pharmacyStock}
                                                onCheckedChange={(c) => updateSetting('ai.features.pharmacyStock', c)}
                                                disabled={!ai.enabled || !hasPermission('SETTINGS_EDIT')}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-md bg-background border border-border">
                                            <div className="flex items-center gap-3">
                                                <ClipboardList className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">Resumen de Historial Clínico</span>
                                            </div>
                                            <Switch
                                                checked={!!ai.features?.recordSummarization}
                                                onCheckedChange={(c) => updateSetting('ai.features.recordSummarization', c)}
                                                disabled={!ai.enabled || !hasPermission('SETTINGS_EDIT')}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-md bg-background border border-border">
                                            <div className="flex items-center gap-3">
                                                <Users className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">Asistente de Recursos Humanos</span>
                                            </div>
                                            <Switch
                                                checked={!!ai.features?.hrAssistant}
                                                onCheckedChange={(c) => updateSetting('ai.features.hrAssistant', c)}
                                                disabled={!ai.enabled || !hasPermission('SETTINGS_EDIT')}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-md bg-background border border-border">
                                            <div className="flex items-center gap-3">
                                                <AILogoIcon className="h-4 w-4" />
                                                <span className="text-sm font-medium">Concierge Portal de Pacientes</span>
                                            </div>
                                            <Switch
                                                checked={!!ai.features?.patientConcierge}
                                                onCheckedChange={(c) => updateSetting('ai.features.patientConcierge', c)}
                                                disabled={!ai.enabled || !hasPermission('SETTINGS_EDIT')}
                                            />
                                        </div>

                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Floating Save Button */}
                    <AnimatePresence>
                        {hasUnsavedChanges && hasPermission('SETTINGS_EDIT') && (
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 100, opacity: 0 }}
                                className="fixed bottom-6 right-6 z-50"
                            >
                                <Button
                                    size="lg"
                                    onClick={handleSaveSettings}
                                    disabled={isSaving || Object.keys(validationErrors).length > 0}
                                    className="shadow-2xl bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-5 w-5 mr-2" />
                                            Guardar Cambios
                                        </>
                                    )}
                                </Button>
                                {Object.keys(validationErrors).length > 0 && (
                                    <p className="text-xs text-red-500 mt-2 text-center">
                                        Corrige los errores antes de guardar
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </TabsContent >

                <TabsContent value="backups" className="mt-0 space-y-6">
                    {/* Cálculo de estadísticas reales */}
                    {(() => {
                        const totalSize = adminData.backups.reduce((acc: number, b: any) => acc + (parseFloat(b.size) || 0), 0).toFixed(2);
                        const lastBackupDate = adminData.backups[0] ? format(new Date(adminData.backups[0].createdAt), 'PP', { locale: es }) : 'N/A';

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="bg-edicarex text-white border-none shadow-xl overflow-hidden relative group">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                                                <DatabaseBackup className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Total Respaldos</p>
                                                <h3 className="text-3xl font-black">{adminData.backups.length}</h3>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium opacity-80">Último: {lastBackupDate}</p>
                                            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-white/40 w-full" />
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-6 -left-6 opacity-10">
                                            <Shield className="h-24 w-24" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white dark:bg-zinc-900 border-border border shadow-lg overflow-hidden relative group">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                                                <HardDrive className="h-6 w-6 text-emerald-500" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Espacio Utilizado</p>
                                                <h3 className="text-3xl font-black text-emerald-500">{totalSize} MB</h3>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Almacenamiento local optimizado {adminData.settings.hospitalName || 'MediSync'}</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Nodo Activo</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white dark:bg-zinc-900 border-border border shadow-lg overflow-hidden relative group">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                                                <HistoryIcon className="h-6 w-6 text-indigo-500" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Retención Corporativa</p>
                                                <h3 className="text-3xl font-black text-indigo-500">30 DÍAS</h3>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Protocolo de purga automática activo</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <Badge variant="outline" className="text-[9px] border-indigo-500/30 text-indigo-500">Auto-Purge On</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })()}

                    <Card className="overflow-hidden border-none shadow-2xl transition-all">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-edicarex" />
                        <CardHeader className="border-b border-border bg-muted/5 px-8 py-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Database className="h-6 w-6 text-edicarex" />
                                        <CardTitle className="text-2xl font-black text-foreground">Gestión de Datos & Respaldos</CardTitle>
                                    </div>
                                    <CardDescription className="text-sm font-medium text-muted-foreground">
                                        Exportación programática de la arquitectura {adminData.settings.hospitalName || 'MediSync'} para recuperación rápida ante desastres.
                                    </CardDescription>
                                </div>
                                {hasPermission('BACKUPS_DELETE') && (
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        disabled={isCleaningBackups}
                                        onClick={handleCleanupBackups}
                                        className="border-edicarex/50 text-edicarex hover:bg-edicarex/5 px-6 py-6 rounded-2xl transition-all active:scale-95 group"
                                    >
                                        <div className="flex flex-col items-start mr-3">
                                            <div className="flex items-center text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">
                                                <HistoryIcon className="h-2 w-2 mr-1" />
                                                Retención 30d
                                            </div>
                                            <span className="font-bold flex items-center">
                                                {isCleaningBackups ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                                Purgar Históricos
                                            </span>
                                        </div>
                                    </Button>
                                )}
                                {hasPermission('BACKUPS_CREATE') && (
                                    <Button
                                        size="lg"
                                        disabled={isCreatingBackup}
                                        onClick={handleCreateBackup}
                                        className="bg-edicarex hover:bg-edicarex/90 text-white shadow-xl shadow-edicarex/20 px-8 py-6 rounded-2xl transition-all hover:scale-105 active:scale-95 relative overflow-hidden group"
                                    >
                                        {isCreatingBackup && (
                                            <motion.div
                                                className="absolute inset-0 bg-white/20 z-0"
                                                initial={{ x: '-100%' }}
                                                animate={{ x: '100%' }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                            />
                                        )}
                                        <div className="flex flex-col items-start relative z-10 mr-3">
                                            <div className="flex items-center text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">
                                                {backupPhase === 'IDLE' ? 'Manual Trigger' : backupPhase.replace('_', ' ')}
                                            </div>
                                            <span className="font-bold flex items-center">
                                                {isCreatingBackup ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                        {backupPhase === 'ANALYSIS' && 'Analizando DB...'}
                                                        {backupPhase === 'EXPORT' && 'Exportando JSON...'}
                                                        {backupPhase === 'CHECKSUM' && 'Firmando SHA-256...'}
                                                        {backupPhase === 'COMPLETED' && 'Finalizado!'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="h-5 w-5 mr-2" />
                                                        Generar Copia de Seguridad
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30 border-b border-border">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="pl-8 h-12 font-bold text-[11px] uppercase tracking-widest text-muted-foreground">ID / Identificador</TableHead>
                                        <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Tecnología / Tipo</TableHead>
                                        <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Tamaño</TableHead>
                                        <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Generado el</TableHead>
                                        <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Ubicación / Nodo</TableHead>
                                        <TableHead className="text-right pr-8 font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {adminData.backups.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center gap-4 py-12">
                                                    <div className="p-6 bg-muted rounded-full">
                                                        <DatabaseBackup className="h-12 w-12 text-muted-foreground/30" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-lg font-bold text-foreground">Sin históricos de respaldo</h4>
                                                        <p className="text-sm text-muted-foreground">Inicia una copia manual para proteger tus datos.</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        adminData.backups.map((backup: any) => (
                                            <TableRow key={backup.id} className="hover:bg-muted/20 transition-all border-b border-border/50 group">
                                                <TableCell className="pl-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative group">
                                                            <div className="h-12 w-12 bg-gradient-to-br from-indigo-600 to-edicarex rounded-2xl flex items-center justify-center shadow-lg shadow-edicarex/20 group-hover:scale-110 transition-transform duration-300">
                                                                <DatabaseBackup className="h-6 w-6 text-white" />
                                                            </div>
                                                            {adminData.settings?.logo ? (
                                                                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg border-2 border-white dark:border-zinc-900 overflow-hidden bg-white shadow-xl">
                                                                    <img src={adminData.settings.logo} alt="Logo" className="h-full w-full object-cover" />
                                                                </div>
                                                            ) : (
                                                                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg border-2 border-white dark:border-zinc-900 bg-emerald-500 flex items-center justify-center shadow-xl">
                                                                    <Check className="h-3 w-3 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm group-hover:underline transition-all decoration-2 underline-offset-4 decoration-indigo-600/30">
                                                                    {backup.name}
                                                                </span>
                                                                <Badge variant="outline" className="h-4 px-1 text-[8px] border-emerald-500/30 text-emerald-500 flex items-center gap-0.5 font-black uppercase tracking-tighter">
                                                                    <ShieldCheck className="h-2 w-2" />
                                                                    SHA-256 Signed
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                                <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60 italic">{adminData.settings.hospitalName || 'MediSync'} Archive System v3.0</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1.5 items-center">
                                                        <Badge variant="outline" className="bg-edicarex/5 text-edicarex border-edicarex/20 font-black text-[10px] tracking-tighter">
                                                            {backup.type || 'FULL_JSON'}
                                                        </Badge>
                                                        {integrityResults[backup.name]?.valid && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                                                                title="Integridad Verificada"
                                                            >
                                                                <Check className="h-3 w-3 text-white" />
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                                                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                                                        {backup.size}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground">
                                                            {format(new Date(backup.createdAt), 'PP', { locale: es })}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">
                                                            A las {format(new Date(backup.createdAt), 'p')}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/50 p-2 rounded-xl border border-border/50">
                                                        <Globe className="h-3 w-3 text-emerald-500" />
                                                        Local Server Storage
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={verifyingFilename === backup.name}
                                                            className={cn(
                                                                "h-9 border-indigo-500/30 text-indigo-600 hover:bg-indigo-500/10 px-3 rounded-xl transition-all",
                                                                integrityResults[backup.name]?.valid && "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                            )}
                                                            onClick={() => handleVerifyIntegrity(backup.name)}
                                                        >
                                                            {verifyingFilename === backup.name ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : integrityResults[backup.name]?.valid ? (
                                                                <Fingerprint className="h-4 w-4" />
                                                            ) : (
                                                                <Fingerprint className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 border-green-500/30 text-green-600 hover:bg-green-500/10 px-4 rounded-xl"
                                                            onClick={() => adminAPI.downloadBackup(backup.name)}
                                                        >
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Descargar
                                                        </Button>
                                                        {hasPermission('BACKUPS_RESTORE') && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="h-9 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 px-4 rounded-xl"
                                                                onClick={() => {
                                                                    setSelectedBackup(backup)
                                                                    setRestoreConfirmOpen(true)
                                                                }}
                                                            >
                                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                                Restaurar
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 border-red-500/30 text-red-600 hover:bg-red-500/10 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                                                            onClick={() => {
                                                                setSelectedBackup(backup)
                                                                setDeleteBackupConfirmOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Restore Confirmation Dialog - Ultra Pro Redesign */}
                    <Dialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
                        <DialogContent className="max-w-xl p-0 overflow-hidden bg-white dark:bg-zinc-950 border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] dark:shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)] rounded-[2.5rem]">
                            <div className="relative">
                                {/* Top Gradient Bar */}
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 z-50" />

                                <div className="bg-red-600 dark:bg-red-950/40 p-10 text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/20 to-transparent opacity-50" />

                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="mx-auto h-24 w-24 bg-white dark:bg-red-500/20 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white/20 mb-6 relative z-10"
                                    >
                                        <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-500 animate-pulse" />
                                    </motion.div>

                                    <div className="space-y-2 relative z-10">
                                        <DialogTitle className="text-3xl font-black text-white tracking-tight uppercase">Protocolo de Emergencia</DialogTitle>
                                        <DialogDescription className="sr-only">
                                            Confirmación crítica para la restauración de datos del sistema.
                                        </DialogDescription>
                                        <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-4 py-1 font-black tracking-widest text-[10px]">
                                            ACCION IRREVERSIBLE
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 space-y-8 bg-white dark:bg-zinc-950">
                                <div className="space-y-6">
                                    <div className="p-6 bg-muted/20 rounded-3xl border border-border/50 text-center">
                                        <p className="text-sm text-foreground font-medium mb-1">Confirmar restauración de:</p>
                                        <p className="text-rose-600 dark:text-rose-500 font-black font-mono text-sm break-all">
                                            {selectedBackup?.name}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-[0.2em]">
                                            <ShieldCheck className="h-4 w-4" />
                                            Seguridad Requerida
                                        </div>

                                        <Input
                                            placeholder="ESCRIBE RESTAURAR"
                                            className="h-14 text-center text-lg font-black tracking-widest border-2 border-border focus:border-rose-600 focus-visible:ring-0 bg-muted/10 rounded-2xl uppercase"
                                            value={restoreConfirmText}
                                            onChange={(e) => setRestoreConfirmText(e.target.value.toUpperCase())}
                                            onPaste={(e) => e.preventDefault()}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setRestoreConfirmOpen(false)
                                            setRestoreConfirmText('')
                                        }}
                                        className="h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border-2"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        disabled={restoreConfirmText !== 'RESTAURAR' || isRestoring}
                                        onClick={handleRestoreBackup}
                                        className={cn(
                                            "h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all duration-300",
                                            restoreConfirmText === 'RESTAURAR'
                                                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30"
                                                : "bg-muted text-muted-foreground opacity-50"
                                        )}
                                    >
                                        {isRestoring ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Cargando...
                                            </>
                                        ) : (
                                            <>
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Confirmar
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Backup Confirmation - High Security Look */}
                    <Dialog open={deleteBackupConfirmOpen} onOpenChange={setDeleteBackupConfirmOpen}>
                        <DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-zinc-950 border-none shadow-2xl rounded-[2rem]">
                            <div className="bg-red-600 p-8 text-center relative">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="mx-auto h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm"
                                >
                                    <Trash2 className="h-8 w-8 text-white" />
                                </motion.div>
                                <DialogTitle className="text-xl font-black text-white uppercase tracking-tight">Purgar Archivo Maestro</DialogTitle>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="text-center space-y-2">
                                    <p className="text-sm text-muted-foreground">Estás a punto de eliminar permanentemente:</p>
                                    <p className="font-mono text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg break-all">
                                        {selectedBackup?.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground italic mt-2">
                                        Esta acción no se puede deshacer y el archivo físico será destruido.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Button
                                        variant="destructive"
                                        className="h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                                        onClick={handleDeleteBackup}
                                    >
                                        Confirmar Eliminación
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="h-12 font-bold text-muted-foreground"
                                        onClick={() => setDeleteBackupConfirmOpen(false)}
                                    >
                                        Mantener Archivo
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="roles" className="mt-0">
                    <Card className="border-none shadow-xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-edicarex" />
                        <CardHeader>
                            <CardTitle className="text-xl text-edicarex text-center">Matriz de Acceso EdiCarex Enterprise</CardTitle>
                            <CardDescription className="text-center">Control jerárquico de permisos dinámicos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Object.entries(ROLE_DEFAULTS).map(([role, permissions], idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ scale: 1.02 }}
                                        className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-3 opacity-5">
                                            <Shield className="h-12 w-12" />
                                        </div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-edicarex/10 rounded-lg">
                                                <Shield className="h-5 w-5 text-edicarex" />
                                            </div>
                                            <h4 className="font-extrabold text-lg text-foreground">{ROLE_DISPLAY_NAMES[role] || role}</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                {permissions.includes('ALL') ? (
                                                    <div className="w-full flex items-center gap-2 text-xs font-bold text-green-600 bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                                                        <CheckCircle className="h-4 w-4" />
                                                        Privilegios Administrativos Totales
                                                    </div>
                                                ) : (
                                                    permissions.map((p, i) => {
                                                        const info = PERMISSION_MAP[p];
                                                        if (!info) return null;
                                                        return (
                                                            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 border border-border/50 rounded-xl text-[11px] font-medium text-muted-foreground group-hover:bg-edicarex/5 group-hover:text-edicarex transition-colors">
                                                                <info.icon className="h-3 w-3" />
                                                                {info.label}
                                                            </div>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs >

            {/* User Modal - Global Unified */}
            < Dialog open={userModalOpen} onOpenChange={setUserModalOpen} >
                <DialogContent className="max-w-6xl p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl">
                    <div className="flex flex-col lg:flex-row h-[85vh]">
                        {/* LEFT: Credentials & Basic Info */}
                        <div className="w-full lg:w-1/3 p-8 border-b lg:border-r border-border overflow-y-auto bg-muted/20">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-edicarex mb-1">{selectedUser ? 'Editar Perfil' : 'Alta de Usuario'}</h2>
                                <p className="text-sm text-muted-foreground">Gestión de identidad y acceso corporativo</p>
                            </div>

                            {/* Avatar Upload Section */}
                            <div className="flex flex-col items-center mb-6 p-6 bg-background rounded-2xl border border-border">
                                <div className="relative group">
                                    <div className="h-24 w-24 rounded-full overflow-hidden bg-edicarex/10 border-4 border-edicarex/20 flex items-center justify-center">
                                        {userData.profileImage ? (
                                            <img src={userData.profileImage} alt="Avatar" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-12 w-12 text-edicarex/50" />
                                        )}
                                    </div>
                                    <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <ImageIcon className="h-6 w-6 text-white" />
                                    </label>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-3 text-center">
                                    Click para subir foto
                                </p>
                                {userData.profileImage && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setUserData({ ...userData, profileImage: '' })}
                                        className="mt-2 text-xs"
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Eliminar
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-6">
                                {/* SECCIÓN 1: CREDENCIALES */}
                                <div className="space-y-4 p-4 border border-border/50 rounded-xl bg-card/30">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                        <ShieldCheck className="h-4 w-4 text-edicarex" />
                                        Credenciales de Acceso
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nombre</Label>
                                            <Input
                                                className={`bg-background focus-visible:ring-edicarex ${errors.firstName ? 'border-red-500' : ''}`}
                                                value={userData.firstName}
                                                onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                                            />
                                            {errors.firstName && <p className="text-[10px] text-red-500 font-bold">{errors.firstName}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Apellido</Label>
                                            <Input
                                                className={`bg-background focus-visible:ring-edicarex ${errors.lastName ? 'border-red-500' : ''}`}
                                                value={userData.lastName}
                                                onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                                            />
                                            {errors.lastName && <p className="text-[10px] text-red-500 font-bold">{errors.lastName}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Correo Electrónico</Label>
                                        <Input
                                            type="email"
                                            placeholder="user@edicarex.com"
                                            className={`bg-background focus-visible:ring-edicarex ${errors.email ? 'border-red-500' : ''}`}
                                            value={userData.email}
                                            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                        />
                                        {errors.email && <p className="text-[10px] text-red-500 font-bold">{errors.email}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contraseña</Label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className={`bg-background focus-visible:ring-edicarex ${errors.password ? 'border-red-500' : ''}`}
                                                value={userData.password}
                                                onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                                            />
                                            {errors.password && <p className="text-[10px] text-red-500 font-bold">{errors.password}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Confirmar</Label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className={`bg-background focus-visible:ring-edicarex ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                                value={userData.confirmPassword}
                                                onChange={(e) => setUserData({ ...userData, confirmPassword: e.target.value })}
                                            />
                                            {errors.confirmPassword && <p className="text-[10px] text-red-500 font-bold">{errors.confirmPassword}</p>}
                                        </div>
                                        {selectedUser && <p className="col-span-2 text-[10px] text-muted-foreground italic text-center">Dejar vacío para mantener la actual</p>}
                                    </div>
                                </div>

                                {/* SECCIÓN 2: ROL Y ESTADO */}
                                <div className="space-y-4 p-4 border border-border/50 rounded-xl bg-card/30">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                        <Settings className="h-4 w-4 text-edicarex" />
                                        Rol y Acceso
                                    </h4>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rol Organizacional</Label>
                                        <Select
                                            value={userData.roleId}
                                            onValueChange={(v) => {
                                                const role = adminData.roles.find((r: any) => r.id === v);
                                                const defaultPerms = ROLE_DEFAULTS[role?.name] || [];
                                                // Mantener Dashboard y Settings si ya estaban, o agregarlos
                                                const finalPerms = Array.from(new Set(['DASHBOARD', 'SETTINGS_VIEW', ...defaultPerms]))
                                                setUserData({ ...userData, roleId: v, permissions: finalPerms });
                                            }}
                                        >
                                            <SelectTrigger className={`bg-background ${errors.roleId ? 'border-red-500' : ''}`}>
                                                <SelectValue placeholder="Seleccione cargo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {adminData.roles.filter((r: any) => r.name !== 'PATIENT').map((role: any) => (
                                                    <SelectItem key={role.id} value={role.id}>
                                                        {ROLE_DISPLAY_NAMES[role.name] || role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.roleId && <p className="text-[10px] text-red-500 font-bold">{errors.roleId}</p>}
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50">
                                        <div className="space-y-0.5">
                                            <Label className="font-bold text-sm">Estado de Cuenta</Label>
                                            <p className="text-[10px] text-muted-foreground">Acceso al sistema</p>
                                        </div>
                                        <Switch
                                            checked={userData.status === 'ACTIVE'}
                                            onCheckedChange={(c) => setUserData({ ...userData, status: c ? 'ACTIVE' : 'INACTIVE' })}
                                        />
                                    </div>
                                </div>

                                {/* SECCIÓN 3: INFORMACIÓN PERSONAL */}
                                <div className="space-y-4 p-4 border border-border/50 rounded-xl bg-card/30">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                        <User className="h-4 w-4 text-edicarex" />
                                        Información Personal
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fecha Nacimiento</Label>
                                            <Input
                                                type="date"
                                                className={`bg-background focus-visible:ring-edicarex ${errors.birthDate ? 'border-red-500' : ''}`}
                                                value={userData.birthDate}
                                                onChange={(e) => setUserData({ ...userData, birthDate: e.target.value })}
                                            />
                                            {errors.birthDate && <p className="text-[10px] text-red-500 font-bold">{errors.birthDate}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Género</Label>
                                            <Select
                                                value={userData.gender}
                                                onValueChange={(v) => setUserData({ ...userData, gender: v })}
                                            >
                                                <SelectTrigger className={`bg-background ${errors.gender ? 'border-red-500' : ''}`}>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="M">Masculino</SelectItem>
                                                    <SelectItem value="F">Femenino</SelectItem>
                                                    <SelectItem value="O">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.gender && <p className="text-[10px] text-red-500 font-bold">{errors.gender}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN 4: CONTACTO */}
                                <div className="space-y-4 p-4 border border-border/50 rounded-xl bg-card/30">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                        <Globe className="h-4 w-4 text-edicarex" />
                                        Contacto
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Teléfono</Label>
                                            <Input
                                                type="tel"
                                                placeholder="+51..."
                                                className={`bg-background focus-visible:ring-edicarex ${errors.phone ? 'border-red-500' : ''}`}
                                                value={userData.phone}
                                                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                                            />
                                            {errors.phone && <p className="text-[10px] text-red-500 font-bold">{errors.phone}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ciudad</Label>
                                            <Input
                                                className={`bg-background focus-visible:ring-edicarex ${errors.city ? 'border-red-500' : ''}`}
                                                value={userData.city}
                                                onChange={(e) => setUserData({ ...userData, city: e.target.value })}
                                            />
                                            {errors.city && <p className="text-[10px] text-red-500 font-bold">{errors.city}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dirección</Label>
                                        <Input
                                            className={`bg-background focus-visible:ring-edicarex ${errors.address ? 'border-red-500' : ''}`}
                                            value={userData.address}
                                            onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                                        />
                                        {errors.address && <p className="text-[10px] text-red-500 font-bold">{errors.address}</p>}
                                    </div>
                                </div>

                                {/* SECCIÓN 5: PERFIL PROFESIONAL */}
                                <div className="space-y-4 p-4 border border-border/50 rounded-xl bg-card/30">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                        <Activity className="h-4 w-4 text-edicarex" />
                                        Perfil Profesional
                                    </h4>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Especialidad</Label>
                                        <Input
                                            placeholder="Ej: Cardiología..."
                                            className={`bg-background focus-visible:ring-edicarex ${errors.specialty ? 'border-red-500' : ''}`}
                                            value={userData.specialty}
                                            onChange={(e) => setUserData({ ...userData, specialty: e.target.value })}
                                        />
                                        {errors.specialty && <p className="text-[10px] text-red-500 font-bold">{errors.specialty}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Licencia</Label>
                                            <Input
                                                className={`bg-background focus-visible:ring-edicarex ${errors.licenseNumber ? 'border-red-500' : ''}`}
                                                value={userData.licenseNumber}
                                                onChange={(e) => setUserData({ ...userData, licenseNumber: e.target.value })}
                                            />
                                            {errors.licenseNumber && <p className="text-[10px] text-red-500 font-bold">{errors.licenseNumber}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contratación</Label>
                                            <Input
                                                type="date"
                                                className={`bg-background focus-visible:ring-edicarex ${errors.hireDate ? 'border-red-500' : ''}`}
                                                value={userData.hireDate}
                                                onChange={(e) => setUserData({ ...userData, hireDate: e.target.value })}
                                            />
                                            {errors.hireDate && <p className="text-[10px] text-red-500 font-bold">{errors.hireDate}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Visual Permissions Matrix */}
                        <div className="flex-1 p-8 overflow-y-auto bg-background">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-foreground">Matriz de Permisos</h3>
                                    <p className="text-sm text-muted-foreground">Configuración granular de módulos asistenciales y administrativos</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleResetPermissions}
                                        className="border-edicarex text-edicarex hover:bg-edicarex/10"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5 mr-2" />
                                        Restablecer por Defecto
                                    </Button>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-edicarex">{userData.permissions.length}</div>
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Módulos On</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10 pr-2">
                                {/* Definición de Secciones y Subgrupos */}
                                {[
                                    {
                                        title: 'Gestión Clínica',
                                        description: 'Accesos a módulos de atención directa al paciente',
                                        groups: [
                                            { name: 'Panel Principal', filter: (k: string) => k === 'DASHBOARD' },
                                            { name: 'Página: Pacientes', filter: (k: string) => k.startsWith('PATIENTS_') },
                                            { name: 'Página: Personal', filter: (k: string) => k.startsWith('STAFF_') },
                                            { name: 'Página: Citas', filter: (k: string) => k.startsWith('APPOINTMENTS_') },
                                            { name: 'Página: Gestión de Camas', filter: (k: string) => k.startsWith('BEDS_') },
                                            { name: 'Página: Sala de Espera', filter: (k: string) => k.startsWith('WAITING') },
                                            { name: 'Página: Expedientes Médicos', filter: (k: string) => k.startsWith('MEDICAL_') },
                                            { name: 'Página: Recetas', filter: (k: string) => k.startsWith('PRESCRIPTIONS_') }
                                        ]
                                    },
                                    {
                                        title: 'Servicios Médicos',
                                        description: 'Gestión de servicios auxiliares y emergencias',
                                        groups: [
                                            { name: 'Página: Emergencias', filter: (k: string) => k.startsWith('EMERGENCY_') },
                                            { name: 'Página: Farmacia', filter: (k: string) => k.startsWith('PHARMACY_') },
                                            { name: 'Página: Laboratorio', filter: (k: string) => k.startsWith('LAB_') }
                                        ]
                                    },
                                    {
                                        title: 'Administración y RRHH',
                                        description: 'Gestión administrativa, personal y auditoría',
                                        groups: [
                                            { name: 'Página: Facturación', filter: (k: string) => k.startsWith('BILLING_') },
                                            { name: 'Página: Reportes', filter: (k: string) => k.startsWith('REPORTS_') },
                                            { name: 'Página: Analítica', filter: (k: string) => k.startsWith('ANALYTICS_') },
                                            { name: 'Página: RRHH', filter: (k: string) => k.startsWith('HR_') },
                                            { name: 'Página: Asistencia', filter: (k: string) => k.startsWith('ATTENDANCE_') },
                                            { name: 'Página: Auditoría', filter: (k: string) => k.startsWith('AUDIT_') }
                                        ]
                                    },
                                    {
                                        title: 'Sistema y Configuración',
                                        description: 'Ajustes globales, seguridad y herramientas del sistema',
                                        groups: [
                                            { name: 'Página: Administración', filter: (k: string) => k.startsWith('ADMIN_') },
                                            { name: 'Página: Configuración', filter: (k: string) => k.startsWith('SETTINGS_') },
                                            { name: 'Página: IA', filter: (k: string) => k.startsWith('AI_') },
                                            { name: 'Página: Mensajería', filter: (k: string) => k.startsWith('MESSAGES') },
                                            { name: 'Página: Respaldos', filter: (k: string) => k.startsWith('BACKUPS_') }
                                        ]
                                    }
                                ].map((section) => (
                                    <div key={section.title} className="space-y-6">
                                        <div className="flex items-center gap-3 pb-2 border-b-2 border-border/50">
                                            <div className="h-6 w-1.5 bg-edicarex rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                                            <div>
                                                <h4 className="text-lg font-black text-foreground tracking-tight">{section.title}</h4>
                                                <p className="text-xs text-muted-foreground font-medium">{section.description}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            {section.groups.map((group) => {
                                                const groupPermissions = Object.entries(PERMISSION_MAP).filter(([key]) => group.filter(key));
                                                if (groupPermissions.length === 0) return null;

                                                // Master Switch Logic
                                                const groupKeys = groupPermissions.map(([key]) => key);
                                                const allSelected = groupKeys.every(key => userData.permissions.includes(key) || userData.permissions.includes('ALL'));
                                                const isMasterDisabled = userData.permissions.includes('ALL');

                                                return (
                                                    <div key={group.name} className="space-y-3">
                                                        <div className="flex items-center justify-between pl-1 border-l-2 border-edicarex/20 ml-1">
                                                            <h5 className="text-xs font-bold uppercase text-edicarex/80 tracking-widest">
                                                                {group.name}
                                                            </h5>
                                                            {/* Interruptor Maestro de Grupo */}
                                                            <div className="flex items-center gap-2 pr-2">
                                                                <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                                                    {allSelected ? 'Desactivar Grupo' : 'Activar Todo'}
                                                                </span>
                                                                <Switch
                                                                    checked={allSelected}
                                                                    disabled={isMasterDisabled}
                                                                    onCheckedChange={(checked) => {
                                                                        let newPerms = [...userData.permissions];
                                                                        if (checked) {
                                                                            // Agregar todas las keys del grupo que falten
                                                                            groupKeys.forEach(key => {
                                                                                if (!newPerms.includes(key)) newPerms.push(key);
                                                                            });
                                                                        } else {
                                                                            // Quitar todas las keys del grupo
                                                                            newPerms = newPerms.filter(key => !groupKeys.includes(key));
                                                                        }
                                                                        setUserData({ ...userData, permissions: newPerms });
                                                                        toast({
                                                                            title: checked ? 'Grupo Activado' : 'Grupo Desactivado',
                                                                            description: `${group.name}: ${groupKeys.length} permisos modificados. Recuerde guardar los cambios del perfil.`,
                                                                        });
                                                                    }}
                                                                    className="scale-75 data-[state=checked]:bg-edicarex"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                                            {groupPermissions.map(([key, info]) => (
                                                                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/40 hover:border-edicarex/50 transition-all hover:shadow-[0_4px_20px_-10px_rgba(6,182,212,0.3)] group hover:bg-accent/5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`p-2 rounded-lg transition-colors duration-300 ${userData.permissions.includes(key) || userData.permissions.includes('ALL')
                                                                            ? 'bg-edicarex text-white shadow-md shadow-edicarex/20'
                                                                            : 'bg-secondary text-muted-foreground group-hover:text-edicarex group-hover:bg-edicarex/10'
                                                                            }`}>
                                                                            <info.icon className="h-4 w-4" />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[11px] font-bold text-foreground/90 group-hover:text-foreground">
                                                                                {info.label}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <Switch
                                                                        checked={userData.permissions.includes(key) || userData.permissions.includes('ALL')}
                                                                        disabled={userData.permissions.includes('ALL')}
                                                                        onCheckedChange={(checked) => {
                                                                            const newPerms = checked
                                                                                ? [...userData.permissions, key]
                                                                                : userData.permissions.filter(p => p !== key)
                                                                            setUserData({ ...userData, permissions: newPerms })
                                                                        }}
                                                                        className="data-[state=checked]:bg-edicarex data-[state=unchecked]:bg-input"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setUserModalOpen(false)} className="rounded-xl px-8">Cancelar</Button>
                                <Button
                                    onClick={handleSaveUser}
                                    className="bg-edicarex hover:bg-edicarex/90 text-white rounded-xl px-12 font-black shadow-lg shadow-blue-500/20"
                                >
                                    Confirmar y Guardar
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Password Modal */}
            < Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen} >
                <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-edicarex" />
                            Resetear Contraseña
                        </DialogTitle>
                        <DialogDescription>
                            Introduzca la nueva contraseña maestra para {selectedUser?.firstName} {selectedUser?.lastName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nueva Contraseña</Label>
                            <Input
                                type="password"
                                placeholder="Mínimo 8 caracteres"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="bg-muted/20"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            Esta acción invalidará las sesiones activas del usuario.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPasswordModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleResetPassword} className="bg-edicarex hover:bg-edicarex/90 text-white">
                            Cambiar Contraseña
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Delete Modal - SHADCN UI INTEGRATED */}
            < Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen} >
                <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="h-5 w-5" />
                            Confirmar Eliminación
                        </DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar permanentemente a <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6">
                        <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handleDeleteUser}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            Eliminar Usuario
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </div >
    )
}
