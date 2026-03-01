import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
})


// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token || localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle common errors (Auth, Maintenance)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/auth/login')
        const status = error.response?.status

        // 401 Unauthorized - Kick to login
        if (status === 401 && !isLoginRequest) {
            const currentPath = window.location.pathname
            // Only redirect if we are not already on a login-related page to avoid loops
            if (currentPath !== '/login' && !currentPath.startsWith('/attendance/login') && !currentPath.startsWith('/patient-portal/login')) {
                localStorage.removeItem('token')
                useAuthStore.getState().logout()
                window.location.href = '/login'
            }
        }

        // 503 Service Unavailable - Check for Maintenance Mode
        const errorData = error.response?.data
        if (status === 503 && errorData?.code === 'MAINTENANCE_MODE_ACTIVE') {
            // Only redirect if we are not already on the maintenance page
            if (window.location.pathname !== '/maintenance') {
                const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.href = `/maintenance?returnUrl=${returnUrl}`
            }
        }

        return Promise.reject(error)
    }
)

// ============================================
// AUTH API
// ============================================
export const authAPI = {
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
    register: (data: any) => api.post('/auth/register', data),
    me: () => api.get('/auth/me'),
    refresh: () => api.post('/auth/refresh'),
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, newPassword: string) =>
        api.post('/auth/reset-password', { token, newPassword }),
    logout: () => api.post('/auth/logout'),
    changePassword: (oldPassword: string, newPassword: string) =>
        api.post('/auth/change-password', { oldPassword, newPassword }),
}

// ============================================
// PATIENTS API
// ============================================
export const patientsAPI = {
    getAll: (params?: any) => api.get('/patients', { params }),
    getOne: (id: string) => api.get(`/patients/${id}`),
    create: (data: any) => api.post('/patients', data),
    import: (data: any[]) => api.post('/patients/import', data),
    update: (id: string, data: any) => api.patch(`/patients/${id}`, data),
    delete: (id: string) => api.delete(`/patients/${id}`),
    enablePortal: (id: string) => api.post(`/patients/${id}/enable-portal`, {}),
    getMedicalHistory: (id: string) => api.get(`/patients/${id}/medical-history`),
    // Timeline
    getTimeline: (id: string) => api.get(`/patients/${id}/timeline`),
    // Allergies
    getAllergies: (id: string) => api.get(`/patients/${id}/allergies`),
    addAllergy: (id: string, data: any) => api.post(`/patients/${id}/allergies`, data),
    updateAllergy: (id: string, allergyId: string, data: any) =>
        api.patch(`/patients/${id}/allergies/${allergyId}`, data),
    deleteAllergy: (id: string, allergyId: string) =>
        api.delete(`/patients/${id}/allergies/${allergyId}`),
    // Vital Signs
    getVitalSigns: (id: string, limit?: number) =>
        api.get(`/patients/${id}/vital-signs`, { params: { limit } }),
    addVitalSign: (id: string, data: any) => api.post(`/patients/${id}/vital-signs`, data),
    getVitalSignsChart: (id: string) => api.get(`/patients/${id}/vital-signs/chart`),
    // Medications
    getMedications: (id: string, activeOnly?: boolean) =>
        api.get(`/patients/${id}/medications`, { params: { activeOnly } }),
    addMedication: (id: string, data: any) => api.post(`/patients/${id}/medications`, data),
    updateMedication: (id: string, medicationId: string, data: any) =>
        api.patch(`/patients/${id}/medications/${medicationId}`, data),
    // Diagnoses
    getDiagnoses: (id: string) => api.get(`/patients/${id}/diagnoses`),
    addDiagnosis: (id: string, data: any) => api.post(`/patients/${id}/diagnoses`, data),
    updateDiagnosis: (id: string, diagnosisId: string, data: any) =>
        api.patch(`/patients/${id}/diagnoses/${diagnosisId}`, data),
    // Family Members
    getFamilyMembers: (id: string) => api.get(`/patients/${id}/family-members`),
    addFamilyMember: (id: string, data: any) => api.post(`/patients/${id}/family-members`, data),
    updateFamilyMember: (id: string, memberId: string, data: any) =>
        api.patch(`/patients/${id}/family-members/${memberId}`, data),
    deleteFamilyMember: (id: string, memberId: string) =>
        api.delete(`/patients/${id}/family-members/${memberId}`),
    // Documents
    getDocuments: (id: string) => api.get(`/patients/${id}/documents`),
    addDocument: (id: string, data: any) => api.post(`/patients/${id}/documents`, data),
    deleteDocument: (id: string, documentId: string) =>
        api.delete(`/patients/${id}/documents/${documentId}`),
    // Notes
    addNote: (id: string, data: any) => api.post(`/patients/${id}/notes`, data),
    // Ext
    getVaccinations: (id: string) => api.get(`/patients/${id}/vaccinations`),
    addVaccination: (id: string, data: any) => api.post(`/patients/${id}/vaccinations`, data),
    getEncounters: (id: string) => api.get(`/patients/${id}/encounters`),
    getMinsaPrograms: (id: string) => api.get(`/patients/${id}/minsa-programs`),
    enrollMinsaProgram: (id: string, data: any) => api.post(`/patients/${id}/minsa-programs`, data),
    getSISHistory: (id: string) => api.get(`/patients/${id}/sis-history`),
    getDashboardStats: () => api.get('/patients/stats/dashboard'),
}

// ============================================
// HEALTH STAFF API
// ============================================
export const healthStaffAPI = {
    getAll: (params?: any) => api.get('/health-staff', { params }),
    getOne: (id: string) => api.get(`/health-staff/${id}`),
    create: (data: any) => api.post('/health-staff', data),
    update: (id: string, data: any) => api.patch(`/health-staff/${id}`, data),
    delete: (id: string) => api.delete(`/health-staff/${id}`),
    getSpecialties: () => api.get('/health-staff/specialties'),
    getStats: (id: string, period?: string) => api.get(`/health-staff/${id}/stats`, { params: { period } }),
    // Documents
    getDocuments: (id: string) => api.get(`/health-staff/${id}/documents`),
    addDocument: (id: string, data: any) => api.post(`/health-staff/${id}/documents`, data),
    deleteDocument: (id: string, docId: string) => api.delete(`/health-staff/${id}/documents/${docId}`),
}

// ============================================
// APPOINTMENTS API
// ============================================
export const appointmentsAPI = {
    getAll: (params?: any) => api.get('/appointments', { params }),
    getOne: (id: string) => api.get(`/appointments/${id}`),
    create: (data: any) => api.post('/appointments', data),
    update: (id: string, data: any) => api.patch(`/appointments/${id}`, data),
    updateStatus: (id: string, status: string, notes?: string) =>
        api.patch(`/appointments/${id}/status`, { status, notes }),
    delete: (id: string) => api.delete(`/appointments/${id}`),
    cancel: (id: string) => api.patch(`/appointments/${id}/status`, { status: 'CANCELLED' }),
    getNotifications: (id: string) => api.get(`/appointments/${id}/notifications`),
    getDashboardStats: () => api.get('/appointments/stats/dashboard'),
    getDailyStats: (date?: string) => api.get('/appointments/daily/stats', { params: { date } }),
    generateHis: (id: string) => api.post(`/appointments/${id}/generate-his`),
}

// ============================================
// HR API (NEW)
// ============================================
export const hrAPI = {
    getEmployees: (params?: any) => api.get('/hr/employees', { params }),
    getEmployee: (id: string) => api.get(`/hr/employees/${id}`),
    createEmployee: (data: any) => api.post('/hr/employees', data),
    updateEmployee: (id: string, data: any) => api.put(`/hr/employees/${id}`, data),
    deleteEmployee: (id: string) => api.delete(`/hr/employees/${id}`),
    getStats: () => api.get('/hr/stats'),
    getAttendance: (date?: Date) => api.get('/hr/attendance', { params: { date } }),
    getPayroll: () => api.get('/hr/payroll'),
    generatePayroll: () => api.post('/hr/payroll'),
    payPayroll: (id: string) => api.put(`/hr/payroll/${id}/pay`),
    deletePayroll: (id: string) => api.delete(`/hr/payroll/${id}`),
    getShifts: () => api.get('/hr/shifts'),
    createShift: (data: any) => api.post('/hr/shifts', data),
    updateShift: (id: string, data: any) => api.put(`/hr/shifts/${id}`, data),
    deleteShift: (id: string) => api.delete(`/hr/shifts/${id}`),
    createAttendance: (data: any) => api.post('/hr/attendance', data),
}

// ============================================
// EMERGENCY API (NEW)
// ============================================
export const emergencyAPI = {
    getDashboard: () => api.get('/emergency/dashboard'),
    getCriticalPatients: () => api.get('/emergency/critical-patients'),
    getCase: (id: string) => api.get(`/emergency/cases/${id}`),
    getBeds: (params?: any) => api.get('/emergency/beds', { params }),
    getBed: (id: string) => api.get(`/emergency/beds/${id}`),
    createBed: (data: any) => api.post('/emergency/beds', data),
    updateBedStatus: (id: string, data: any) => api.put(`/emergency/beds/${id}`, data),
    getWardStats: () => api.get('/emergency/wards/stats'),
    getPatientHistory: (patientId: string) => api.get(`/emergency/history/${patientId}`),
    createRecord: (data: any) => api.post('/emergency/cases', data),
    dischargeCase: (id: string) => api.put(`/emergency/cases/${id}/discharge`),
    getBedById: (id: string) => api.get(`/emergency/beds/${id}`),

    // Clinical recording
    addVitalSign: (id: string, data: any) => api.post(`/emergency/cases/${id}/vitals`, data),
    addMedication: (id: string, data: any) => api.post(`/emergency/cases/${id}/medications`, data),
    addProcedure: (id: string, data: any) => api.post(`/emergency/cases/${id}/procedures`, data),
    transferPatient: (id: string, targetWard: string, targetBedId?: string, notes?: string) => api.put(`/emergency/cases/${id}/transfer`, { targetWard, targetBedId, notes }),
    updateCase: (id: string, data: any) => api.put(`/emergency/cases/${id}`, data),

    // Attachments
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    addAttachment: (caseId: string, data: any) => api.post(`/emergency/cases/${caseId}/attachments`, data),
    updateAttachment: (id: string, data: { title: string }) => api.put(`/emergency/attachments/${id}`, data),
    deleteAttachment: (id: string) => api.put(`/emergency/attachments/${id}/delete`),
}

// ============================================
// BED MANAGEMENT API
// ============================================
export const bedsAPI = {
    getAll: (params?: any) => api.get('/beds', { params }),
    getStats: () => api.get('/beds/stats'),
    getOne: (id: string) => api.get(`/beds/${id}`),
    create: (data: any) => api.post('/beds', data),
    update: (id: string, data: any) => api.patch(`/beds/${id}`, data),
    delete: (id: string) => api.delete(`/beds/${id}`),
    assign: (id: string, data: any) => api.post(`/beds/${id}/assign`, data),
    discharge: (id: string) => api.post(`/beds/${id}/discharge`),
    getActivities: () => api.get('/beds/activities'),
}

// ============================================
// ADMIN API (NEW)
// ============================================
// ============================================
// ADMIN API (NEW)
// ============================================
export const adminAPI = {
    getConfigs: (params?: any) => api.get('/admin/config', { params }),
    getConfig: (id: string) => api.get(`/admin/config/${id}`),
    createConfig: (data: any) => api.post('/admin/config', data),
    updateConfig: (id: string, data: any) => api.put(`/admin/config/${id}`, data),
    deleteConfig: (id: string) => api.delete(`/admin/config/${id}`),
    getServicesByCategory: () => api.get('/admin/services/by-category'),
    // Organization & Backups
    getOrganization: () => api.get('/admin/organization'),
    updateOrganization: (data: any) => api.put('/admin/organization', data),
    getBackups: () => api.get('/admin/backups'),
    createBackup: () => api.post('/admin/backups'),
    restoreBackup: (id: string) => api.post(`/admin/backups/${id}/restore`),
    downloadBackup: (filename: string) => {
        const token = useAuthStore.getState().token || localStorage.getItem('token');
        const url = `${API_URL}/api/v1/admin/backups/${filename}/download?token=${token}`;
        window.open(url, '_blank');
    },
    getSystemStats: () => api.get('/admin/system/stats'),
    getSystemHealth: () => api.get('/admin/system/health'),
    deleteBackup: (id: string) => api.delete(`/admin/backups/${id}`),
    cleanupBackups: () => api.post('/admin/backups/cleanup'),
    verifyBackup: (filename: string) => api.get(`/admin/backups/${filename}/verify`),
}

// ============================================
// AUDIT API (NEW)
// ============================================
export const auditAPI = {
    getAll: (params?: any) => api.get('/audit', { params }),
    getStats: () => api.get('/audit/stats'),
    getHistory: (resource: string, id: string) => api.get(`/audit/history/${resource}/${id}`),
    update: (id: string, data: { changes?: any }) => api.patch(`/audit/${id}`, data),
    delete: (id: string) => api.delete(`/audit/${id}`),
}

// ============================================
// MESSAGES API (NEW)
// ============================================
export const messagesAPI = {
    getMessages: (params?: any) => api.get('/messages', { params }),
    sendMessage: (data: any) => api.post('/messages', data),
    markAsRead: (id: string) => api.put(`/messages/${id}/read`),
    getUnreadCount: () => api.get('/messages/unread/count'),
    getConversations: () => api.get('/messages/conversations'),
    deleteMessage: (id: string) => api.delete(`/messages/${id}`),
    editMessage: (id: string, content: string) => api.put(`/messages/${id}`, { content }),
    deleteConversation: (otherUserId: string) => api.delete(`/messages/conversation/${otherUserId}`),
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
}


// ============================================
// ANALYTICS API (NEW)
// ============================================
export const analyticsAPI = {
    getDashboard: (range?: string) => api.get('/analytics/dashboard', { params: { range } }),
    getHeatmap: (range?: string) => api.get('/analytics/heatmap', { params: { range } }),
    getSaturation: (range?: string) => api.get('/analytics/saturation', { params: { range } }),
    getAreaComparison: (range?: string) => api.get('/analytics/area-comparison', { params: { range } }),
    getPatientCycle: (range?: string) => api.get('/analytics/patient-cycle', { params: { range } }),
    getCapacity: (range?: string) => api.get('/analytics/capacity', { params: { range } }),
    getHistorical: (range?: string) => api.get('/analytics/historical', { params: { range } }),
    // Kept for backward compatibility
    getAppointmentsByDay: (days?: number) =>
        api.get('/analytics/appointments/by-day', { params: { days } }),
    getAppointmentsByPriority: (range?: string) => api.get('/analytics/appointments/by-priority', { params: { range } }),
    getAppointmentsByStatus: (range?: string) => api.get('/analytics/appointments/by-status', { params: { range } }),
    getPatientStats: (range?: string) => api.get('/analytics/patients/stats', { params: { range } }),
    getRevenueStats: (range?: string) => api.get('/analytics/revenue/stats', { params: { range } }),
    getAppointmentTypes: (range?: string) => api.get('/analytics/appointments/types', { params: { range } }),
    getLabStats: (range?: string) => api.get('/analytics/lab/stats', { params: { range } }),
    getTopMeds: (range?: string) => api.get('/analytics/pharmacy/top-meds', { params: { range } }),
    getAgeDistribution: (range?: string) => api.get('/analytics/patients/age-distribution', { params: { range } }),
}

// ============================================
// PHARMACY API
// ============================================
export const pharmacyAPI = {
    getMedications: (params?: any) => api.get('/pharmacy/medications', { params }),
    getMedication: (id: string) => api.get(`/pharmacy/medications/${id}`),
    createMedication: (data: any) => api.post('/pharmacy/medications', data),
    updateMedication: (id: string, data: any) => api.patch(`/pharmacy/medications/${id}`, data),
    deleteMedication: (id: string) => api.delete(`/pharmacy/medications/${id}`),
    getStock: (params?: any) => api.get('/pharmacy/stock', { params }),
    updateStock: (id: string, data: any) => api.patch(`/pharmacy/stock/${id}`, data),
    getLowStock: () => api.get('/pharmacy/stock/low'),
    getOrders: (params?: any) => api.get('/pharmacy/orders', { params }),
    approveOrder: (id: string) => api.patch(`/pharmacy/orders/${id}/approve`),
    rejectOrder: (id: string, reason: string) => api.patch(`/pharmacy/orders/${id}/reject`, { reason }),
    getKardex: (params?: any) => api.get('/pharmacy/kardex', { params }),
}

// ============================================
// LABORATORY API
// ============================================
export const laboratoryAPI = {
    getAll: (params?: any) => api.get('/laboratory/orders', { params }),
    getOrders: (params?: any) => api.get('/laboratory/orders', { params }),
    getOne: (id: string) => api.get(`/laboratory/orders/${id}`),
    createOrder: (data: any) => api.post('/laboratory/orders', data),
    updateOrder: (id: string, data: any) => api.patch(`/laboratory/orders/${id}`, data),
    updateStatus: (id: string, status: string, data?: any) =>
        api.patch(`/laboratory/orders/${id}/status`, { status, ...data }),
    deleteOrder: (id: string) => api.delete(`/laboratory/orders/${id}`),
    getTests: () => api.get('/laboratory/tests'),
    getStats: () => api.get('/laboratory/stats'),
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/files/upload/laboratory', formData);
    },
}

// ============================================
// BILLING API
// ============================================
export const billingAPI = {
    getInvoices: (params?: any) => api.get('/billing/invoices', { params }),
    getInvoice: (id: string) => api.get(`/billing/invoices/${id}`),
    createInvoice: (data: any) => api.post('/billing/invoices', data),
    updateInvoice: (id: string, data: any) => api.patch(`/billing/invoices/${id}`, data),
    updateStatus: (id: string, status: string) =>
        api.patch(`/billing/invoices/${id}/status`, { status }),
    deleteInvoice: (id: string) => api.delete(`/billing/invoices/${id}`),
    getStats: () => api.get('/billing/stats'),
}

// ============================================
// REPORTS API
// ============================================
export const reportsAPI = {
    getDashboardStats: () => api.get('/reports/dashboard'),
    getAppointmentStats: (params?: any) => api.get('/reports/appointments', { params }),
    getPatientStats: (params?: any) => api.get('/reports/patients', { params }),
    getFinancialStats: (params?: any) => api.get('/reports/finance', { params }),
    getMedicationStats: (params?: any) => api.get('/reports/medications', { params }),
    getStaffStats: (params?: any) => api.get('/reports/staff', { params }),
    getEmergencyStats: (params?: any) => api.get('/reports/emergencies', { params }),
    getComparisonStats: (params?: any) => api.get('/reports/comparison', { params }),
    getAiPredictions: (params?: any) => api.get('/reports/ai-predictions', { params }),
    // Legacy/Unused for now but kept for compatibility if needed
    getPatientReport: (patientId: string) => api.get(`/reports/patient/${patientId}`),
    exportReport: (type: string, params?: any) =>
        api.get(`/reports/export/${type}`, { params, responseType: 'blob' }),
}

// ============================================
// AI API
// ============================================
export const aiAPI = {
    triage: (data: any) => api.post('/ai/triage', data),
    summarize: (text: string) => api.post('/ai/summarize', { text }),
    predictDemand: (medicationId: string) =>
        api.post('/ai/pharmacy/demand', { medication_id: medicationId }),
    chat: (data: { message: string; context?: string }) => api.post('/ai/chat', data),
    generateText: (data: { template_type: string; patient_data: any; additional_notes?: string }) =>
        api.post('/ai/text/generate', data),
    predictGrowth: (data: any) => api.post('/ai/analytics/growth', data),
}

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsAPI = {
    getAll: (params?: any) => api.get('/notifications', { params }),
    markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/mark-all-read'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    delete: (id: string) => api.delete(`/notifications/${id}`),
    getPreferences: () => api.get('/notifications/preferences'),
    updatePreferences: (data: any) => api.put('/notifications/preferences', data),
    getTemplates: () => api.get('/notifications/templates'),
    getLogs: (params?: any) => api.get('/notifications/logs', { params }),
}

// ============================================
// ATTENDANCE API
// ============================================
export const attendanceAPI = {
    getRecords: (params?: any) => api.get('/attendance', { params }),
    clockIn: () => api.post('/attendance/clock-in'),
    clockOut: () => api.post('/attendance/clock-out'),
    getMyAttendance: () => api.get('/attendance/me'),
    kioskClock: (documentId: string) => api.post('/attendance/kiosk', { documentId }),
    getKioskStats: () => api.get('/attendance/kiosk-stats'),
}

// ============================================
// USERS API
// ============================================
export const usersAPI = {
    getProfile: () => api.get('/users/me'),
    updateProfile: (data: any) => api.patch('/users/me', data),
    getRoles: () => api.get('/users/roles'),
    getAll: (params?: any) => api.get('/users', { params }),
    getOne: (id: string) => api.get(`/users/${id}`),
    create: (data: any) => api.post('/users', data),
    update: (id: string, data: any) => api.patch(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
}

// ============================================
// SERVICES CATALOG API
// ============================================
export const servicesCatalogAPI = {
    getAll: (params?: any) => api.get('/services-catalog', { params }),
    getById: (id: string) => api.get(`/services-catalog/${id}`),
    create: (data: any) => api.post('/services-catalog', data),
    update: (id: string, data: any) => api.patch(`/services-catalog/${id}`, data),
    delete: (id: string) => api.delete(`/services-catalog/${id}`),
    seed: () => api.get('/services-catalog/seed'),
}

// ============================================
// SYSTEM API
// ============================================
export const systemAPI = {
    getStatus: () => api.get('/health'),
}

// ============================================
// TRIAJE API - C.S. JORGE CHÁVEZ I-3
// ============================================
export const triajeAPI = {
    getAll: (date?: string) => api.get('/triaje', { params: { date } }),
    getStats: () => api.get('/triaje/stats'),
    getById: (id: string) => api.get(`/triaje/${id}`),
    create: (data: any) => api.post('/triaje', data),
    update: (id: string, data: any) => api.put(`/triaje/${id}`, data),
    updateStatus: (id: string, status: string) => api.patch(`/triaje/${id}/status`, { status }),
}

// ============================================
// VACUNACION API - ESNI
// ============================================
export const vacunacionAPI = {
    getAll: (params?: { category?: string; month?: string }) => api.get('/vacunacion', { params }),
    getStats: (month?: string) => api.get('/vacunacion/stats', { params: { month } }),
    getById: (id: string) => api.get(`/vacunacion/${id}`),
    create: (data: any) => api.post('/vacunacion', data),
    update: (id: string, data: any) => api.put(`/vacunacion/${id}`, data),
}

// ============================================
// PROGRAMAS MINSA API
// ============================================
export const programasMinsaAPI = {
    getAll: () => api.get('/programas-minsa'),
    getDashboard: () => api.get('/programas-minsa/dashboard'),
    getRecords: (programId: string, month?: string) =>
        api.get(`/programas-minsa/${programId}/records`, { params: { month } }),
    createRecord: (data: any) => api.post('/programas-minsa/records', data),
    updateRecord: (id: string, data: any) => api.put(`/programas-minsa/records/${id}`, data),
}

// ============================================
// ENCOUNTERS API
// ============================================
export const encountersAPI = {
    getAll: (params?: any) => api.get('/encounters', { params }),
    getOne: (id: string) => api.get(`/encounters/${id}`),
    create: (data: any) => api.post('/encounters', data),
    update: (id: string, data: any) => api.patch(`/encounters/${id}`, data),
}

// ============================================
// REFERRALS API
// ============================================
export const referralsAPI = {
    getAll: (params?: any) => api.get('/referrals', { params }),
    getOne: (id: string) => api.get(`/referrals/${id}`),
    create: (data: any) => api.post('/referrals', data),
    update: (id: string, data: any) => api.patch(`/referrals/${id}`, data),
}

// ============================================
// HIS API
// ============================================
export const hisAPI = {
    getAll: (params?: any) => api.get('/his', { params }),
    create: (data: any) => api.post('/his', data),
    getStats: () => api.get('/his/stats'),
    exportCsv: (date?: string) => api.post('/his/export', null, { params: { date }, responseType: 'blob' }),
}

// ============================================
// EPIDEMIOLOGY API
// ============================================
export const epidemiologyAPI = {
    getAll: () => api.get('/epidemiology'),
    getOne: (id: string) => api.get(`/epidemiology/${id}`),
    create: (data: any) => api.post('/epidemiology', data),
    notifyMinsa: (id: string) => api.patch(`/epidemiology/${id}/notify`, {}),
    getStats: () => api.get('/epidemiology/stats'),
}

// ============================================
// SIS API
// ============================================
export const sisAPI = {
    validate: (data: any) => api.post('/sis/validate', data),
    getHistory: (patientId: string) => api.get(`/sis/patient/${patientId}/history`),
}

// ============================================
// OBSERVATION ROOM API
// ============================================
export const observationRoomAPI = {
    getAll: () => api.get('/observation-room'),
    getOne: (id: string) => api.get(`/observation-room/${id}`),
    admit: (id: string, data: any) => api.post(`/observation-room/${id}/admit`, data),
    discharge: (id: string, reason: string) => api.post(`/observation-room/${id}/discharge`, { reason }),
    refer: (id: string, data: any) => api.post(`/observation-room/${id}/refer`, data),
}

// ============================================
// CONSULTORIO CONFIG API
// ============================================
export const consultorioConfigAPI = {
    getAll: () => api.get('/consultorio-config'),
    seed: () => api.post('/consultorio-config/seed'),
}

