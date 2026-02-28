import { useState } from 'react'
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
import { Loader2 } from 'lucide-react'
import { hrAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'

const employeeSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.string().min(1, 'Role is required'),
    department: z.string().min(1, 'Department is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    salary: z.string().optional(),
    hireDate: z.string().min(1, 'Hire date is required'),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyPhone: z.string().optional(),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

interface EmployeeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employee?: any
    onSuccess?: () => void
}

export default function EmployeeModal({ open, onOpenChange, employee, onSuccess }: EmployeeModalProps) {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const form = useForm<EmployeeFormData>({
        resolver: zodResolver(employeeSchema),
        defaultValues: employee ? {
            ...employee,
            salary: employee.salary ? employee.salary.toString() : '',
            hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
            phone: employee.phone || '',
            address: employee.address || '',
            emergencyContact: employee.emergencyContact || '',
            emergencyPhone: employee.emergencyPhone || '',
        } : {
            name: '',
            role: '',
            department: '',
            email: '',
            phone: '',
            salary: '',
            hireDate: new Date().toISOString().split('T')[0],
            address: '',
            emergencyContact: '',
            emergencyPhone: '',
        },
    })

    const onSubmit = async (data: EmployeeFormData) => {
        try {
            setLoading(true)
            const payload = {
                ...data,
                salary: data.salary ? parseFloat(data.salary) : undefined,
            }

            if (employee) {
                await hrAPI.updateEmployee(employee.id, payload)
                toast({
                    title: 'Success',
                    description: 'Employee updated successfully',
                })
            } else {
                await hrAPI.createEmployee(payload)
                toast({
                    title: 'Success',
                    description: 'Employee created successfully',
                })
            }
            onOpenChange(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to save employee',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{employee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                    <DialogDescription>
                        {employee ? 'Update employee information' : 'Enter employee details to create a new record'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Full Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
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
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="john.doe@hospital.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1 (555) 123-4567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Staff">Personal de Salud</SelectItem>
                                                <SelectItem value="NURSE">Nurse</SelectItem>
                                                <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                                                <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                                                <SelectItem value="LAB_TECHNICIAN">Lab Technician</SelectItem>
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                                <SelectItem value="MANAGER">Manager</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="CARDIOLOGY">Cardiology</SelectItem>
                                                <SelectItem value="NEUROLOGY">Neurology</SelectItem>
                                                <SelectItem value="PEDIATRICS">Pediatrics</SelectItem>
                                                <SelectItem value="EMERGENCY">Emergency</SelectItem>
                                                <SelectItem value="SURGERY">Surgery</SelectItem>
                                                <SelectItem value="PHARMACY">Pharmacy</SelectItem>
                                                <SelectItem value="LABORATORY">Laboratory</SelectItem>
                                                <SelectItem value="ADMINISTRATION">Administration</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="hireDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hire Date *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="salary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Salary</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="50000" {...field} />
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
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 Main St, City, State" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="emergencyContact"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Emergency Contact</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Jane Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="emergencyPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Emergency Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1 (555) 987-6543" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {employee ? 'Update Employee' : 'Create Employee'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
