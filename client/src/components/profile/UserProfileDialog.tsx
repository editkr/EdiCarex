import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usersAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
    User, Mail, Shield, Phone, Camera, Lock, Save, History, Activity, LogIn, Loader2
} from 'lucide-react';

interface UserProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children?: React.ReactNode;
}

export function UserProfileDialog({ open, onOpenChange, children }: UserProfileDialogProps) {
    const { user, login } = useAuthStore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');

    const [avatar, setAvatar] = useState('');

    // Security form states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (open && user) {
            // Initialize form with stored user data
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setAvatar(user.avatar || '');

            // Fetch fresh details from API
            fetchProfile();
        }
    }, [open, user]);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const response = await usersAPI.getProfile();
            const profile = response.data;
            setPhone(profile.phone || '');

            // Update other fields if they are fresher from DB
            setFirstName(profile.firstName || '');
            setLastName(profile.lastName || '');
            // Ideally update auth store if data changed significantly, but for now we trust the inputs
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Don't error toast here to avoid spamming if offline, just use what we have
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setIsSaving(true);
            const updatedData: any = {
                firstName,
                lastName,
                phone,
                // avatar - would need file upload logic usually, or url update
            };

            // Only add bio if it's supported later or if we handle doctor profile updates
            // if (bio) updatedData.bio = bio;

            const response = await usersAPI.updateProfile(updatedData);

            // Update local store
            // Assuming the API returns the updated user object or we merge it manually
            // We need to pass the current token again or keep it
            const currentToken = useAuthStore.getState().token;
            if (currentToken) {
                // Merge existing user with updates for the store
                const updatedUser = { ...user!, ...updatedData };
                login(updatedUser, currentToken);
            }

            toast({
                title: "Perfil actualizado",
                description: "Los cambios se han guardado correctamente.",
            });

            // Optional: Close dialog or stay open
            // onOpenChange(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron guardar los cambios. Intente nuevamente.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Helper for roles
    const getRoleName = (role: any) => {
        if (!role) return 'Usuario';

        // 1. Extract raw role string safely
        let roleStr = '';
        if (typeof role === 'object' && role !== null) {
            roleStr = role.name || '';
        } else {
            roleStr = String(role || '');
        }

        // 2. Normalize
        roleStr = roleStr.toUpperCase().trim();

        // 3. Handle bad data
        if (roleStr === 'UNDEFINED' || roleStr === 'NULL' || roleStr === '') {
            return 'Usuario';
        }

        const names: Record<string, string> = {
            'ADMIN': 'Administrador',
            'STAFF': 'Personal de Salud',
            'NURSE': 'Enfermero/a',
            'RECEPTIONIST': 'Recepción',
            'LAB': 'Laboratorista',
            'PHARMACY': 'Farmacéutico/a',
            'HR': 'Recursos Humanos',
            'PATIENT': 'Paciente'
        };
        return names[roleStr] || roleStr; // Fallback to raw (e.g. PATIENT)
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border shadow-2xl gap-0 max-h-[90vh] flex flex-col" aria-describedby="profile-description">
                <DialogTitle className="sr-only">Perfil de Usuario</DialogTitle>
                <DialogDescription id="profile-description" className="sr-only">
                    Ventana modal para editar la información del perfil del usuario, cambiar contraseña y ver actividad reciente.
                </DialogDescription>

                {/* Header Section */}
                <div className="relative h-40 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent shrink-0">
                    <div className="absolute inset-0 flex items-end px-8 pb-6">
                        <div className="flex items-end gap-6 w-full">
                            <div className="relative group shrink-0">
                                <Avatar className="h-28 w-28 border-4 border-background shadow-xl rounded-2xl">
                                    <AvatarImage src={avatar} alt={firstName} className="object-cover" />
                                    <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                                        {firstName?.charAt(0)}{lastName?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute -bottom-2 -right-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 h-8 w-8"
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex-1 pb-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                        {firstName} {lastName}
                                    </h2>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                        {getRoleName(user?.role)}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                                    <span className="flex items-center gap-1">
                                        <Mail className="h-3.5 w-3.5" /> {user?.email}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Shield className="h-3.5 w-3.5" /> ID: {user?.id?.substring(0, 8)}...
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 h-full">

                        {/* Sidebar */}
                        <div className="md:col-span-4 bg-muted/30 border-r border-border p-6 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tu Cuenta</h3>

                                <Card className="bg-background/50 border-primary/10 shadow-sm">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Estado</span>
                                            <Badge variant="outline" className="text-green-600 bg-green-500/10 border-green-500/20">Activo</Badge>
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Registro</span>
                                            <span className="text-sm font-medium">Hace 1 año</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Activity className="h-4 w-4" /> Actividad Reciente
                                </h3>
                                <div className="space-y-4 pl-2 border-l-2 border-border/50">
                                    <div className="relative pl-4 pb-2">
                                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-green-500/20 border-2 border-background ring-1 ring-green-500 flex items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                        </div>
                                        <p className="text-sm font-medium">Inicio de sesión</p>
                                        <p className="text-xs text-muted-foreground">Hoy, 08:30 AM</p>
                                    </div>
                                    <div className="relative pl-4">
                                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-500/20 border-2 border-background ring-1 ring-blue-500 flex items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                        </div>
                                        <p className="text-sm font-medium">Perfil actualizado</p>
                                        <p className="text-xs text-muted-foreground">Ayer, 14:15 PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Form */}
                        <div className="md:col-span-8 p-6">
                            <Tabs defaultValue="general" className="w-full h-full flex flex-col">
                                <TabsList className="w-full justify-start bg-transparent border-b border-border/50 rounded-none h-auto p-0 mb-6 gap-6 shrink-0">
                                    <TabsTrigger
                                        value="general"
                                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-0 text-muted-foreground data-[state=active]:text-foreground font-medium"
                                    >
                                        Información General
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="security"
                                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-0 text-muted-foreground data-[state=active]:text-foreground font-medium"
                                    >
                                        Seguridad
                                    </TabsTrigger>
                                </TabsList>

                                <div className="flex-1 overflow-y-auto pr-2">
                                    <TabsContent value="general" className="space-y-6 mt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">Nombre</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="firstName"
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        className="pl-9"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Apellido</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="lastName"
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        className="pl-9"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Correo Electrónico</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input id="email" value={user?.email} disabled className="pl-9 bg-muted/50" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Teléfono</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="phone"
                                                        placeholder="+51..."
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        className="pl-9"
                                                    />
                                                </div>
                                            </div>
                                        </div>


                                    </TabsContent>

                                    <TabsContent value="security" className="space-y-6 mt-0">
                                        <div className="space-y-4 max-w-md">
                                            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-600 text-sm mb-4">
                                                Por seguridad, se requerirá tu contraseña actual para realizar cambios.
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="current-pass">Contraseña Actual</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input id="current-pass" type="password" className="pl-9" />
                                                </div>
                                            </div>
                                            <Separator className="my-2" />
                                            <div className="space-y-2">
                                                <Label htmlFor="new-pass">Nueva Contraseña</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input id="new-pass" type="password" className="pl-9" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="confirm-pass">Confirmar Nueva Contraseña</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input id="confirm-pass" type="password" className="pl-9" />
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-muted/40 flex justify-end gap-3 shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="min-w-[140px]">
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
