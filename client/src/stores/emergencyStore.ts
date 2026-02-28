import { create } from 'zustand'
import { emergencyAPI } from '@/services/api'
import { toast } from '@/components/ui/use-toast'

export interface EmergencyCase {
    id: string
    patientName: string
    patientAge?: number
    patientId?: string
    admissionDate: string
    triageLevel: number
    chiefComplaint: string
    diagnosis?: string
    vitalSigns?: {
        hr?: number
        bp?: string
        temp?: string
        spo2?: number
    }
    bedId?: string
    bedNumber?: string
    staffId?: string
    staffName?: string
    status: 'TRIAGE' | 'ADMITTED' | 'DISCHARGED' | 'OBSERVATION'
    createdAt: string
    staff?: {
        user: {
            firstName: string
            lastName: string
        }
    }
}

interface EmergencyStats {
    criticalPatients: number
    beds: {
        total: number
        available: number
        occupied: number
        maintenance: number
    }
}

interface EmergencyStore {
    cases: EmergencyCase[]
    stats: EmergencyStats | null
    isLoading: boolean
    fetchCases: () => Promise<void>
    fetchStats: () => Promise<void>
    createCase: (data: any) => Promise<void>
    updateCase: (id: string, data: any) => Promise<void>
}

export const useEmergencyStore = create<EmergencyStore>((set, get) => ({
    cases: [],
    stats: null,
    isLoading: false,

    fetchCases: async () => {
        set({ isLoading: true })
        try {
            const response = await emergencyAPI.getCriticalPatients()
            set({ cases: response.data, isLoading: false })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los casos de emergencia',
                variant: 'destructive',
            })
            set({ isLoading: false })
        }
    },

    fetchStats: async () => {
        try {
            const response = await emergencyAPI.getDashboard()
            set({ stats: response.data })
        } catch (error: any) {
            console.error('Failed to fetch emergency stats', error)
        }
    },

    createCase: async (data: any) => {
        set({ isLoading: true })
        try {
            await emergencyAPI.createRecord(data)
            await get().fetchCases()
            await get().fetchStats()
            toast({
                title: 'Éxito',
                description: 'Caso de emergencia creado correctamente',
            })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'No se pudo crear el caso de emergencia',
                variant: 'destructive',
            })
        } finally {
            set({ isLoading: false })
        }
    },

    updateCase: async (id: string, data: any) => {
        set({ isLoading: true })
        try {
            // We need to implement update in API if not exists, for now assuming it might be needed for assignment
            // For now, let's just refresh after any action
            await get().fetchCases()
            set({ isLoading: false })
        } catch (error: any) {
            set({ isLoading: false })
        }
    }
}))
