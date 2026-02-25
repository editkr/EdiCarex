import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminAPI } from '@/services/api';

interface OrganizationConfig {
    id?: string;
    hospitalName: string;
    email: string;
    phone: string;
    address?: string;
    logo?: string;
    branding?: any;
    openingHours?: any;
    billing?: any;
    ai?: any;
    maintenanceMode: boolean;
}

interface OrganizationContextType {
    config: OrganizationConfig | null;
    loading: boolean;
    updateConfig: (data: Partial<OrganizationConfig>) => Promise<void>;
    refreshConfig: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<OrganizationConfig | null>(null);
    const [loading, setLoading] = useState(true);

    const loadConfig = async () => {
        try {
            const response = await adminAPI.getOrganization();
            setConfig(response.data);
        } catch (error) {
            console.error('Error loading organization config:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateConfig = async (data: Partial<OrganizationConfig>) => {
        try {
            await adminAPI.updateOrganization(data);
            await loadConfig(); // Recargar para sincronizar
        } catch (error) {
            console.error('Error updating organization config:', error);
            throw error;
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    return (
        <OrganizationContext.Provider value={{ config, loading, updateConfig, refreshConfig: loadConfig }}>
            {children}
        </OrganizationContext.Provider>
    );
};

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error('useOrganization must be used within OrganizationProvider');
    }
    return context;
};
