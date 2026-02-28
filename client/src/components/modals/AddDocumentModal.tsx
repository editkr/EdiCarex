import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { patientsAPI } from '@/services/api'
import { toast } from '@/components/ui/use-toast'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, X, FileText } from 'lucide-react'

const documentSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    type: z.string().min(1, 'El tipo de documento es requerido'),
})

interface AddDocumentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    patientId: string
    onSuccess: () => void
}

export function AddDocumentModal({
    open,
    onOpenChange,
    patientId,
    onSuccess,
}: AddDocumentModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<z.infer<typeof documentSchema>>({
        resolver: zodResolver(documentSchema),
        defaultValues: {
            name: '',
            type: '',
        },
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            // Limit file size to 50MB for Base64 storage
            if (file.size > 50 * 1024 * 1024) {
                toast({
                    title: "Archivo muy grande",
                    description: "El archivo no puede superar los 50MB.",
                    variant: "destructive"
                })
                return
            }
            setSelectedFile(file)
            // Auto-fill name if empty
            if (!form.getValues('name')) {
                form.setValue('name', file.name.split('.')[0])
            }
        }
    }

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = error => reject(error)
        })
    }

    const onSubmit = async (values: z.infer<typeof documentSchema>) => {
        if (!selectedFile) {
            toast({
                title: "Documento requerido",
                description: "Por favor seleccione un archivo para subir.",
                variant: "destructive"
            })
            return
        }

        try {
            setIsLoading(true)
            const base64Url = await convertToBase64(selectedFile)

            const documentData = {
                ...values,
                url: base64Url,
                mimeType: selectedFile.type,
                size: selectedFile.size,
                uploadedBy: 'Personal de Salud', // In real app, get from auth context
            }

            await patientsAPI.addDocument(patientId, documentData)

            toast({
                title: 'Documento subido',
                description: 'El documento se ha guardado correctamente.',
            })

            form.reset()
            setSelectedFile(null)
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Error uploading document:', error)
            toast({
                title: 'Error',
                description: 'No se pudo subir el documento. Intente nuevamente.',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Subir Documento</DialogTitle>
                    <DialogDescription>
                        Adjunte documentos médicos, resultados o imágenes. (Máx. 50MB)
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Documento</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Radiografía Torax, Análisis de Sangre..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="LAB_RESULT">Resultado de Laboratorio</SelectItem>
                                            <SelectItem value="PRESCRIPTION">Receta Médica</SelectItem>
                                            <SelectItem value="IMAGING">Imágenes / Rayos X</SelectItem>
                                            <SelectItem value="CONSENT">Consentimiento Informado</SelectItem>
                                            <SelectItem value="OTHER">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <Label>Archivo</Label>
                            {!selectedFile ? (
                                <div
                                    className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium text-muted-foreground">Click para seleccionar archivo</p>
                                    <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG (Max 50MB)</p>
                                </div>
                            ) : (
                                <div className="border rounded-lg p-3 flex items-center justify-between bg-slate-50">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                                            <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setSelectedFile(null)
                                            if (fileInputRef.current) fileInputRef.current.value = ''
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading || !selectedFile}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Subir Documento
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
