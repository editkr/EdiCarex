import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import PatientsPage from '@/pages/patients/PatientsPage'
import PatientProfilePage from '@/pages/patients/PatientProfilePage'
import DoctorsPage from '@/pages/doctors/DoctorsPage'
import DoctorProfilePage from '@/pages/doctors/DoctorProfilePage'
import AppointmentsPage from '@/pages/appointments/AppointmentsPage'
import AppointmentDetailsPage from '@/pages/appointments/AppointmentDetailsPage'
import PharmacyPage from '@/pages/pharmacy/PharmacyPage'
import LaboratoryPage from '@/pages/laboratory/LaboratoryPage'
import BillingPage from '@/pages/billing/BillingPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import AIPage from '@/pages/ai/AIPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import PublicScreenPage from '@/pages/PublicScreenPage'
import HRPage from '@/pages/hr/HRPage'
import AnalyticsPage from '@/pages/analytics/AnalyticsPage'
import WaitingRoomPage from '@/pages/waiting-room/WaitingRoomPage'
import { AttendanceLayout } from '@/components/attendance/AttendanceLayout'
import AttendancePage from '@/pages/attendance/AttendancePage'
import EmergencyPage from '@/pages/emergency/EmergencyPage'
import EmergencyCaseProfilePage from '@/pages/emergency/EmergencyCaseProfilePage'
import BedManagementPage from '@/pages/beds/BedManagementPage'
import AdminPage from '@/pages/admin/AdminPage'
import AuditLogsPage from '@/pages/admin/AuditLogsPage'
import MessagesPage from '@/pages/messages/MessagesPage'
import MaintenancePage from './pages/MaintenancePage'

// Patient Portal imports
import PatientLoginPage from '@/pages/patient-portal/PatientLoginPage'
import PatientDashboardPage from '@/pages/patient-portal/PatientDashboardPage'
import PatientAppointmentsPage from '@/pages/patient-portal/PatientAppointmentsPage'
import PatientMedicalHistoryPage from '@/pages/patient-portal/PatientMedicalHistoryPage'
import PatientLabResultsPage from '@/pages/patient-portal/PatientLabResultsPage'
import PatientBillingPage from '@/pages/patient-portal/PatientBillingPage'
import PatientProfilePagePortal from '@/pages/patient-portal/PatientProfilePage'
import PatientPortalLayout from '@/components/patient-portal/PatientPortalLayout'

import AttendanceLoginPage from '@/pages/attendance/AttendanceLoginPage'
import { OrganizationProvider } from '@/contexts/OrganizationContext'

function App() {
    return (
        <ThemeProvider defaultTheme="light" storageKey="edicarex-theme">
            <OrganizationProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/maintenance" element={<MaintenancePage />} />
                        <Route path="/attendance/login" element={<AttendanceLoginPage />} />
                        <Route path="/public-screen" element={<PublicScreenPage />} />

                        {/* Patient Portal Routes */}
                        <Route path="/patient-portal/login" element={<PatientLoginPage />} />
                        <Route path="/patient-portal/*" element={
                            <PatientPortalLayout>
                                <Routes>
                                    <Route path="dashboard" element={<PatientDashboardPage />} />
                                    <Route path="appointments" element={<PatientAppointmentsPage />} />
                                    <Route path="history" element={<PatientMedicalHistoryPage />} />
                                    <Route path="lab-results" element={<PatientLabResultsPage />} />
                                    <Route path="billing" element={<PatientBillingPage />} />
                                    <Route path="profile" element={<PatientProfilePagePortal />} />
                                </Routes>
                            </PatientPortalLayout>
                        } />

                        {/* Attendance Portal Context (Standalone) */}

                        <Route path="/attendance/*" element={
                            <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                                <AttendanceLayout>
                                    <Routes>
                                        <Route path="/" element={<AttendancePage />} />
                                        <Route path="ops" element={<AttendancePage />} />
                                        <Route path="shifts" element={<AttendancePage />} />
                                        <Route path="payroll" element={<AttendancePage />} />
                                        <Route path="staff" element={<AttendancePage />} />
                                        <Route path="rules" element={<AttendancePage />} />
                                        <Route path="audit" element={<AttendancePage />} />
                                        <Route path="settings" element={<AttendancePage />} />
                                    </Routes>
                                </AttendanceLayout>
                            </ProtectedRoute>
                        } />

                        <Route element={<ProtectedRoute />}>
                            <Route element={<Layout />}>
                                <Route path="/dashboard" element={<DashboardPage />} />

                                <Route element={<ProtectedRoute requiredPermission="PATIENTS_VIEW" />}>
                                    <Route path="/patients" element={<PatientsPage />} />
                                    <Route path="/patients/:id" element={<PatientProfilePage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="DOCTORS_VIEW" />}>
                                    <Route path="/doctors" element={<DoctorsPage />} />
                                    <Route path="/doctors/:id" element={<DoctorProfilePage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="APPOINTMENTS_VIEW" />}>
                                    <Route path="/appointments" element={<AppointmentsPage />} />
                                    <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="WAITING_VIEW" />}>
                                    <Route path="/waiting-room" element={<WaitingRoomPage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="HR_VIEW" />}>
                                    <Route path="/hr" element={<HRPage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="EMERGENCY_VIEW" />}>
                                    <Route path="/emergency" element={<EmergencyPage />} />
                                    <Route path="/emergency/:id" element={<EmergencyCaseProfilePage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="BEDS_VIEW" />}>
                                    <Route path="/beds" element={<BedManagementPage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="PHARMACY_VIEW" />}>
                                    <Route path="/pharmacy" element={<PharmacyPage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="LAB_VIEW" />}>
                                    <Route path="/laboratory" element={<LaboratoryPage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="BILLING_VIEW" />}>
                                    <Route path="/billing" element={<BillingPage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="REPORTS_VIEW" />}>
                                    <Route path="/reports" element={<ReportsPage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="ANALYTICS_VIEW" />}>
                                    <Route path="/analytics" element={<AnalyticsPage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="AI_USE" />}>
                                    <Route path="/ai" element={<AIPage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="MESSAGES_VIEW" />}>
                                    <Route path="/messages" element={<MessagesPage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="ADMIN_VIEW" />}>
                                    <Route path="/admin" element={<AdminPage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="AUDIT_VIEW" />}>
                                    <Route path="/admin/audit" element={<AuditLogsPage />} />
                                </Route>

                                <Route element={<ProtectedRoute requiredPermission="SETTINGS_VIEW" />}>
                                    <Route path="/settings" element={<SettingsPage />} />
                                </Route>
                            </Route>
                        </Route>

                        <Route path="/" element={<Navigate to="/login" replace />} />
                    </Routes>
                </BrowserRouter>
                <Toaster />
            </OrganizationProvider>
        </ThemeProvider>
    )
}

export default App
