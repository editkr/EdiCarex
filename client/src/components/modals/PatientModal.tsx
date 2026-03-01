import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Upload, X, User } from 'lucide-react'
import { patientsAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'

import { differenceInYears } from 'date-fns'

const patientSchema = z.object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    documentType: z.enum(['DNI', 'CARNET_EXTRANJERIA', 'CODIGO_UNICO']).default('DNI'),
    documentNumber: z.string().min(8, 'El documento es requerido y debe tener al menos 8 caracteres'),
    photo: z.string().optional(),
    dateOfBirth: z.string().min(1, 'La fecha de nacimiento es requerida'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    bloodType: z.string().optional(),
    phone: z.string().min(9, 'El teléfono debe tener al menos 9 caracteres'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    ubigeo: z.string().optional().default('211101'), // Juliaca default
    emergencyContact: z.string().optional(),
    emergencyPhone: z.string().optional(),
    insuranceNumber: z.string().optional(),
    insuranceProvider: z.string().optional(),
    allergies: z.string().optional(),
    chronicConditions: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'DECEASED', 'CRITICAL']),

    // Nuevos campos
    sector: z.string().optional(),
    familyFolderId: z.string().optional(),
    occupation: z.string().optional(),
    educationLevel: z.string().optional(),
    maritalStatus: z.string().optional(),
    ethnicity: z.string().optional(),
    motherTongue: z.string().optional(),
    isIntercultural: z.boolean().optional().default(false),
    sisCode: z.string().optional(),
    sisModalidad: z.string().optional(),
    sisStatus: z.string().optional(),
    sisAssignedIpress: z.string().optional()
})

type PatientFormData = z.infer<typeof patientSchema>

interface PatientModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    patient?: any
    onSuccess?: () => void
}

export default function PatientModal({ open, onOpenChange, patient, onSuccess }: PatientModalProps) {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const form = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema),
        defaultValues: patient ? {
            ...patient,
            dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
            documentType: patient.documentType || 'DNI',
            documentNumber: patient.documentNumber || '',
            photo: patient.photo || '',
            email: patient.email || '',
            bloodType: patient.bloodType || '',
            address: patient.address || '',
            city: patient.city || '',
            state: patient.state || '',
            zipCode: patient.zipCode || '',
            ubigeo: patient.ubigeo || '211101',
            emergencyContact: patient.emergencyContact || '',
            emergencyPhone: patient.emergencyPhone || '',
            insuranceNumber: patient.insuranceNumber || '',
            insuranceProvider: patient.insuranceProvider || '',
            allergies: patient.allergies || '',
            chronicConditions: patient.chronicConditions || '',
            notes: patient.notes || '',
            status: patient.status || 'ACTIVE',
            sector: patient.sector || '',
            familyFolderId: patient.familyFolderId || '',
            occupation: patient.occupation || '',
            educationLevel: patient.educationLevel || '',
            maritalStatus: patient.maritalStatus || '',
            ethnicity: patient.ethnicity || '',
            motherTongue: patient.motherTongue || '',
            isIntercultural: patient.isIntercultural || false,
            sisCode: patient.sisCode || '',
            sisModalidad: patient.sisModalidad || '',
            sisStatus: patient.sisStatus || '',
            sisAssignedIpress: patient.sisAssignedIpress || '',
        } : {
            firstName: '',
            lastName: '',
            documentType: 'DNI' as const,
            documentNumber: '',
            photo: '',
            dateOfBirth: '',
            gender: 'MALE' as const,
            bloodType: '',
            phone: '',
            email: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            ubigeo: '211101',
            emergencyContact: '',
            emergencyPhone: '',
            insuranceNumber: '',
            insuranceProvider: '',
            allergies: '',
            chronicConditions: '',
            notes: '',
            status: 'ACTIVE',
            sector: '',
            familyFolderId: '',
            occupation: '',
            educationLevel: '',
            maritalStatus: '',
            ethnicity: '',
            motherTongue: '',
            isIntercultural: false,
            sisCode: '',
            sisModalidad: '',
            sisStatus: '',
            sisAssignedIpress: '',
        },
    })

    useEffect(() => {
        if (open) {
            if (patient) {
                form.reset({
                    ...patient,
                    firstName: patient.firstName || '',
                    lastName: patient.lastName || '',
                    documentType: patient.documentType || 'DNI',
                    dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
                    documentNumber: patient.documentNumber || '',
                    photo: patient.photo || '',
                    gender: patient.gender || 'MALE',
                    bloodType: patient.bloodType || '',
                    phone: patient.phone || '',
                    email: patient.email || '',
                    address: patient.address || '',
                    city: patient.city || '',
                    state: patient.state || '',
                    zipCode: patient.zipCode || '',
                    ubigeo: patient.ubigeo || '211101',
                    emergencyContact: patient.emergencyContact || '',
                    emergencyPhone: patient.emergencyPhone || '',
                    insuranceNumber: patient.insuranceNumber || '',
                    insuranceProvider: patient.insuranceProvider || '',
                    allergies: patient.allergies || '',
                    chronicConditions: patient.chronicConditions || '',
                    notes: patient.notes || '',
                    status: patient.status || 'ACTIVE',
                    sector: patient.sector || '',
                    familyFolderId: patient.familyFolderId || '',
                    occupation: patient.occupation || '',
                    educationLevel: patient.educationLevel || '',
                    maritalStatus: patient.maritalStatus || '',
                    ethnicity: patient.ethnicity || '',
                    motherTongue: patient.motherTongue || '',
                    isIntercultural: patient.isIntercultural || false,
                    sisCode: patient.sisCode || '',
                    sisModalidad: patient.sisModalidad || '',
                    sisStatus: patient.sisStatus || '',
                    sisAssignedIpress: patient.sisAssignedIpress || '',
                })
            } else {
                form.reset({
                    firstName: '',
                    lastName: '',
                    documentType: 'DNI',
                    documentNumber: '',
                    photo: '',
                    dateOfBirth: '',
                    gender: 'MALE',
                    bloodType: '',
                    phone: '',
                    email: '',
                    address: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    ubigeo: '211101',
                    emergencyContact: '',
                    emergencyPhone: '',
                    insuranceNumber: '',
                    insuranceProvider: '',
                    allergies: '',
                    chronicConditions: '',
                    notes: '',
                    status: 'ACTIVE',
                    sector: '',
                    familyFolderId: '',
                    occupation: '',
                    educationLevel: '',
                    maritalStatus: '',
                    ethnicity: '',
                    motherTongue: '',
                    isIntercultural: false,
                    sisCode: '',
                    sisModalidad: '',
                    sisStatus: '',
                    sisAssignedIpress: '',
                })
            }
        }
    }, [open, patient, form])

    const onSubmit = async (data: PatientFormData) => {
        try {
            setLoading(true)

            // Sanitize data before sending
            const payload = {
                ...data,
                // Ensure date is properly formatted for backend (ISO-8601)
                dateOfBirth: new Date(data.dateOfBirth).toISOString(),
                // Convert empty strings to undefined for optional fields to avoid validation/DB errors
                email: data.email === '' ? undefined : data.email,
                photo: data.photo === '' ? undefined : data.photo,
                address: data.address === '' ? undefined : data.address,
                phone: data.phone, // Required
                documentNumber: data.documentNumber, // Required
                // Ensure status is included
                status: data.status,
                // Optional fields
                emergencyContact: data.emergencyContact === '' ? undefined : data.emergencyContact,
                emergencyPhone: data.emergencyPhone === '' ? undefined : data.emergencyPhone,
                insuranceProvider: data.insuranceProvider === '' || data.insuranceProvider === 'NONE' ? undefined : data.insuranceProvider,
                insuranceNumber: data.insuranceNumber === '' ? undefined : data.insuranceNumber,
                bloodType: data.bloodType === '' ? undefined : data.bloodType,
                allergies: data.allergies === '' ? undefined : data.allergies,
                chronicConditions: data.chronicConditions === '' ? undefined : data.chronicConditions,
                notes: data.notes === '' ? undefined : data.notes,
                sector: data.sector === '' ? undefined : data.sector,
                familyFolderId: data.familyFolderId === '' ? undefined : data.familyFolderId,
                occupation: data.occupation === '' ? undefined : data.occupation,
                educationLevel: data.educationLevel === '' ? undefined : data.educationLevel,
                maritalStatus: data.maritalStatus === '' ? undefined : data.maritalStatus,
                ethnicity: data.ethnicity === '' ? undefined : data.ethnicity,
                motherTongue: data.motherTongue === '' ? undefined : data.motherTongue,
                sisCode: data.sisCode === '' ? undefined : data.sisCode,
                sisModalidad: data.sisModalidad === '' ? undefined : data.sisModalidad,
                sisStatus: data.sisStatus === '' ? undefined : data.sisStatus,
                sisAssignedIpress: data.sisAssignedIpress === '' ? undefined : data.sisAssignedIpress,
            }

            if (patient) {
                await patientsAPI.update(patient.id, payload as any)
                toast({
                    title: 'Éxito',
                    description: 'Paciente actualizado correctamente',
                })
            } else {
                await patientsAPI.create(payload as any)
                toast({
                    title: 'Éxito',
                    description: 'Paciente creado correctamente',
                })
            }
            onOpenChange(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            console.error('Error saving patient:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al guardar el paciente',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const currentDob = form.watch('dateOfBirth');

    const getLifeStageAndAge = () => {
        if (!currentDob) return null;
        const dob = new Date(currentDob);
        const age = differenceInYears(new Date(), dob);
        let stage = 'Adulto Mayor';
        let color = 'bg-stone-100 text-stone-800';
        if (age < 12) { stage = 'Niño'; color = 'bg-sky-100 text-sky-800'; }
        else if (age < 18) { stage = 'Adolescente'; color = 'bg-emerald-100 text-emerald-800'; }
        else if (age < 30) { stage = 'Joven'; color = 'bg-indigo-100 text-indigo-800'; }
        else if (age < 60) { stage = 'Adulto'; color = 'bg-slate-100 text-slate-800'; }

        return { age, stage, color };
    };

    const dobStats = getLifeStageAndAge();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{patient ? 'Editar Paciente' : 'Agregar Nuevo Paciente'}</DialogTitle>
                    <DialogDescription>
                        {patient ? 'Actualizar información clínica y administrativa del paciente' : 'Ingresar datos MINSA y demográficos obligatorios.'}
                    </DialogDescription>
                    {dobStats && (
                        <div className="absolute top-4 right-10">
                            <span className="text-sm text-slate-500 mr-2">{dobStats.age} años</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dobStats.color}`}>
                                {dobStats.stage}
                            </span>
                        </div>
                    )}
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* 1. Datos Personales */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">1</span>
                                Datos Personales
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombres *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Juan" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Apellidos *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Pérez" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="documentType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo de Documento *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="DNI" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="DNI">DNI</SelectItem>
                                                    <SelectItem value="CARNET_EXTRANJERIA">Carnet de Extranjería</SelectItem>
                                                    <SelectItem value="CODIGO_UNICO">Código Único Institucional (CUI)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="documentNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número de Documento *</FormLabel>
                                            <FormControl>
                                                <div className="flex gap-2">
                                                    <Input placeholder="12345678" {...field} />
                                                    <Button type="button" variant="outline" size="sm" onClick={() => {
                                                        toast({ title: 'Consulta RENIEC', description: 'Simulando consulta en tiempo real...' });
                                                    }}>RENIEC</Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="dateOfBirth"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fecha de Nacimiento *</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Género *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="MALE">Masculino</SelectItem>
                                                    <SelectItem value="FEMALE">Femenino</SelectItem>
                                                    <SelectItem value="OTHER">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="photo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Foto del paciente (Opcional)</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center gap-4">
                                                    {/* Preview */}
                                                    <div className="relative group shrink-0">
                                                        <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                                                            {field.value ? (
                                                                <img
                                                                    src={field.value}
                                                                    alt="Preview"
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <User className="h-10 w-10 text-slate-400" />
                                                            )}
                                                        </div>
                                                        {field.value && (
                                                            <button
                                                                type="button"
                                                                onClick={() => field.onChange('')}
                                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Eliminar foto"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Upload Button */}
                                                    <div className="flex-1">
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            id="photo-upload"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) {
                                                                    if (file.size > 5 * 1024 * 1024) {
                                                                        toast({
                                                                            title: "Error",
                                                                            description: "La imagen es demasiado grande (máx 5MB)",
                                                                            variant: "destructive"
                                                                        })
                                                                        return
                                                                    }
                                                                    const reader = new FileReader()
                                                                    reader.onloadend = () => {
                                                                        field.onChange(reader.result as string)
                                                                    }
                                                                    reader.readAsDataURL(file)
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor="photo-upload"
                                                            className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                                                        >
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                                                <p className="text-xs text-slate-500">
                                                                    <span className="font-semibold">Clic para subir</span>
                                                                </p>
                                                                <p className="text-[10px] text-slate-400">PNG, JPG (MAX. 5MB)</p>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* 2. Información de Contacto */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">2</span>
                                Información de Contacto
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teléfono</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+51 999 999 999" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Correo electrónico</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="email@ejemplo.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Dirección</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Dirección completa" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="ubigeo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ubigeo (INEI)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. 211101" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="sector"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sector / Red</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. Santa Adriana" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="emergencyContact"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Contacto de Emergencia</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nombre y Teléfono de contacto" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* 3. Información Médica Básica */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">3</span>
                                Información Médica Básica
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="bloodType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Grupo Sanguíneo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="A+">A+</SelectItem>
                                                    <SelectItem value="A-">A-</SelectItem>
                                                    <SelectItem value="B+">B+</SelectItem>
                                                    <SelectItem value="B-">B-</SelectItem>
                                                    <SelectItem value="AB+">AB+</SelectItem>
                                                    <SelectItem value="AB-">AB-</SelectItem>
                                                    <SelectItem value="O+">O+</SelectItem>
                                                    <SelectItem value="O-">O-</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="allergies"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Alergias</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ninguna o especificar..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="chronicConditions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Condiciones Crónicas</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Diabetes, Hipertensión..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* 4. Seguro Médico y Financiamiento */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">4</span>
                                Seguro Médico y Financiamiento
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="insuranceProvider"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Tipo de Seguro / Financiamiento</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona el seguro del paciente" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="NINGUNO">Ninguno (Usuario Libre)</SelectItem>
                                                    <SelectItem value="SIS_GRATUITO">SIS Gratuito</SelectItem>
                                                    <SelectItem value="SIS_PARA_TODOS">SIS Para Todos</SelectItem>
                                                    <SelectItem value="SIS_INDEPENDIENTE">SIS Independiente</SelectItem>
                                                    <SelectItem value="SIS_EMPRENDEDOR">SIS Emprendedor</SelectItem>
                                                    <SelectItem value="SIS_MICROEMPRESAS">SIS Microempresas</SelectItem>
                                                    <SelectItem value="ESSALUD">EsSalud</SelectItem>
                                                    <SelectItem value="SOAT">SOAT</SelectItem>
                                                    <SelectItem value="EPS">EPS (Privado Diferenciado)</SelectItem>
                                                    <SelectItem value="PRIVADO">Seguro Privado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {form.watch('insuranceProvider')?.startsWith('SIS') && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="sisStatus"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Estado del SIS en Línea</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Seleccionar" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="ACTIVO">Activo</SelectItem>
                                                            <SelectItem value="INACTIVO">Inactivo</SelectItem>
                                                            <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                                                            <SelectItem value="CANCELADO">Cancelado</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="sisCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Código SIS (Contrato)</FormLabel>
                                                    <FormControl>
                                                        <div className="flex gap-2">
                                                            <Input placeholder="Ej. 2-50012345" {...field} />
                                                            <Button type="button" variant="outline" size="sm" onClick={() => {
                                                                toast({ title: 'Consulta SIS', description: 'Simulando validación SUSALUD...' });
                                                            }}>Validar</Button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="sisAssignedIpress"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>IPRESS Asignada</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Código Renipress (Ej. 00003308)" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                                {!form.watch('insuranceProvider')?.startsWith('SIS') && (
                                    <FormField
                                        control={form.control}
                                        name="insuranceNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número de Póliza / Autogenerado</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="N° de Póliza o Afiliación" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        </div>

                        {/* 5. Datos Socioeconómicos */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">5</span>
                                Datos Socioeconómicos y Demográficos
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="educationLevel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nivel de Instrucción</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="SIN_INSTRUCCION">Sin Instrucción</SelectItem>
                                                    <SelectItem value="PRIMARIA">Primaria</SelectItem>
                                                    <SelectItem value="SECUNDARIA">Secundaria</SelectItem>
                                                    <SelectItem value="SUPERIOR_TECNICA">Superior Técnica</SelectItem>
                                                    <SelectItem value="SUPERIOR_UNIVERSITARIA">Superior Universitaria</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="motherTongue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Lengua Materna</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="CASTELLANO">Castellano</SelectItem>
                                                    <SelectItem value="QUECHUA">Quechua</SelectItem>
                                                    <SelectItem value="AYMARA">Aymara</SelectItem>
                                                    <SelectItem value="OTRO">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="maritalStatus"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado Civil</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="SOLTERO">Soltero(a)</SelectItem>
                                                    <SelectItem value="CONVIVIENTE">Conviviente</SelectItem>
                                                    <SelectItem value="CASADO">Casado(a)</SelectItem>
                                                    <SelectItem value="DIVORCIADO">Divorciado(a)</SelectItem>
                                                    <SelectItem value="VIUDO">Viudo(a)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="occupation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ocupación</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. Estudiante, Agricultor..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* 6. Estado del Paciente */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">6</span>
                                Estado del Paciente
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar estado" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">Activo</SelectItem>
                                                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                                                    <SelectItem value="CRITICAL">Crítico</SelectItem>
                                                    <SelectItem value="DECEASED">Fallecido</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {patient ? 'Actualizar Paciente' : 'Crear Paciente'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form >
            </DialogContent >
        </Dialog >
    )
}
