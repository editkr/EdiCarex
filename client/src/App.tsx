import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Loader2 } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import { OrganizationProvider } from '@/contexts/OrganizationContext'

// --- Loading Component ---
const PageLoading = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
)

// --- Lazy Pages ---

// Auth & System
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// Dashboard & Core
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))

// Clinical Modules
const PatientsPage = lazy(() => import('@/pages/patients/PatientsPage'))
const PatientProfilePage = lazy(() => import('@/pages/patients/PatientProfilePage'))
const HealthStaffPage = lazy(() => import('@/pages/doctors/HealthStaffPage'))
const HealthStaffProfilePage = lazy(() => import('@/pages/doctors/HealthStaffProfilePage'))
const AppointmentsPage = lazy(() => import('@/pages/appointments/AppointmentsPage'))
const AppointmentDetailsPage = lazy(() => import('@/pages/appointments/AppointmentDetailsPage'))
const WaitingRoomPage = lazy(() => import('@/pages/waiting-room/WaitingRoomPage'))
const UrgenciesPage = lazy(() => import('@/pages/emergency/UrgenciesPage'))
const UrgencyCasePage = lazy(() => import('@/pages/emergency/UrgencyCasePage'))

// Administrative & Specialized
const AttendanceRecordsPage = lazy(() => import('@/pages/attendance-records/AttendanceRecordsPage'))
const PublicHealthPage = lazy(() => import('@/pages/public-health/PublicHealthPage'))
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'))
const HRPage = lazy(() => import('@/pages/hr/HRPage'))
const PharmacyPage = lazy(() => import('@/pages/pharmacy/PharmacyPage'))
const LaboratoryPage = lazy(() => import('@/pages/laboratory/LaboratoryPage'))
const ObservationRoomPage = lazy(() => import('@/pages/beds/ObservationRoomPage'))
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'))
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'))
const MessagesPage = lazy(() => import('@/pages/messages/MessagesPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const AIPage = lazy(() => import('@/pages/ai/AIPage'))

// I-4 Specific Modules
const TriajePage = lazy(() => import('@/pages/triaje/TriajePage'))
const VacunacionPage = lazy(() => import('@/pages/vacunacion/VacunacionPage'))
const ProgramasMinsaPage = lazy(() => import('@/pages/programas/ProgramasMinsaPage'))
const ReferralSystemPage = lazy(() => import('@/pages/referrals/ReferralSystemPage'))
const ReferralNewPage = lazy(() => import('@/pages/referrals/ReferralNewPage'))
const ReferralDetailPage = lazy(() => import('@/pages/referrals/ReferralDetailPage'))
const HISReportingPage = lazy(() => import('@/pages/his/HISReportingPage'))
const HISReportingNewPage = lazy(() => import('@/pages/his/HISReportingNewPage'))
const TelemedicinePage = lazy(() => import('@/pages/telemedicine/TelemedicinePage'))
const EpidemiologyPage = lazy(() => import('@/pages/epidemiology/EpidemiologyPage'))
const EpidemiologyReportNewPage = lazy(() => import('@/pages/epidemiology/EpidemiologyReportNewPage'))
const SISValidationPage = lazy(() => import('@/pages/sis/SISValidationPage'))

// Patient Details Sub-pages
const PatientEncountersPage = lazy(() => import('./pages/patients/PatientEncountersPage'))
const PatientVaccinationsPage = lazy(() => import('./pages/patients/PatientVaccinationsPage'))

// Lab Details
const LabResultDetailsPage = lazy(() => import('./pages/laboratory/LabResultDetailsPage'))
const LabOrderDetailsPage = lazy(() => import('./pages/laboratory/LabOrderDetailsPage'))

// Observation Room Details
const ObservationRoomDetailPage = lazy(() => import('./pages/beds/ObservationRoomDetailPage'))

// Urgency Expansions
const UrgencyReferralPage = lazy(() => import('./pages/emergency/UrgencyReferralPage'))

// Portals & Screens
const PublicScreenPage = lazy(() => import('@/pages/PublicScreenPage'))
const PatientPortalLayout = lazy(() => import('@/components/patient-portal/PatientPortalLayout'))
const PatientLoginPage = lazy(() => import('@/pages/patient-portal/PatientLoginPage'))
const PatientDashboardPage = lazy(() => import('@/pages/patient-portal/PatientDashboardPage'))
const PatientAppointmentsPage = lazy(() => import('@/pages/patient-portal/PatientAppointmentsPage'))
const PatientMedicalHistoryPage = lazy(() => import('@/pages/patient-portal/PatientMedicalHistoryPage'))
const PatientLabResultsPage = lazy(() => import('@/pages/patient-portal/PatientLabResultsPage'))
const PatientSISServicesPage = lazy(() => import('@/pages/patient-portal/PatientSISServicesPage'))
const PatientProfilePagePortal = lazy(() => import('@/pages/patient-portal/PatientProfilePage'))
const PatientVaccinationsPortalPage = lazy(() => import('@/pages/patient-portal/PatientVaccinationsPortalPage'))
const PatientReferralsPage = lazy(() => import('@/pages/patient-portal/PatientReferralsPage'))

// Attendance
const AttendanceLayout = lazy(() => import('@/components/attendance/AttendanceLayout'))
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'))
const AttendanceLoginPage = lazy(() => import('@/pages/attendance/AttendanceLoginPage'))

function App() {
    return (
        <ThemeProvider defaultTheme="light" storageKey="csjc-theme">
            <OrganizationProvider>
                <BrowserRouter>
                    <Suspense fallback={<PageLoading />}>
                        <Routes>
                            {/* --- Public & Auth --- */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/maintenance" element={<MaintenancePage />} />
                            <Route path="/attendance/login" element={<AttendanceLoginPage />} />
                            <Route path="/public-screen" element={<PublicScreenPage />} />

                            {/* --- Patient Portal (Refactored to Children) --- */}
                            <Route path="/patient-portal/login" element={<PatientLoginPage />} />
                            <Route path="/patient-portal" element={<PatientPortalLayout />}>
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="dashboard" element={<PatientDashboardPage />} />
                                <Route path="appointments" element={<PatientAppointmentsPage />} />
                                <Route path="history" element={<PatientMedicalHistoryPage />} />
                                <Route path="lab-results" element={<PatientLabResultsPage />} />
                                <Route path="vaccinations" element={<PatientVaccinationsPortalPage />} />
                                <Route path="referrals" element={<PatientReferralsPage />} />
                                <Route path="sis-services" element={<PatientSISServicesPage />} />
                                <Route path="profile" element={<PatientProfilePagePortal />} />
                            </Route>

                            {/* --- Staff Attendance Portal --- */}
                            <Route path="/attendance" element={
                                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                                    <AttendanceLayout />
                                </ProtectedRoute>
                            }>
                                <Route index element={<AttendancePage />} />
                                <Route path="ops" element={<AttendancePage />} />
                                <Route path="shifts" element={<AttendancePage />} />
                                <Route path="payroll" element={<AttendancePage />} />
                                <Route path="staff" element={<AttendancePage />} />
                                <Route path="rules" element={<AttendancePage />} />
                                <Route path="audit" element={<AttendancePage />} />
                                <Route path="settings" element={<AttendancePage />} />
                            </Route>

                            {/* --- Main Application Layout --- */}
                            <Route element={<ProtectedRoute />}>
                                <Route element={<Layout />}>
                                    <Route path="/dashboard" element={<DashboardPage />} />

                                    {/* Medical/Clinical */}
                                    <Route path="/patients">
                                        <Route index element={<ProtectedRoute requiredPermission="PATIENTS_VIEW"><PatientsPage /></ProtectedRoute>} />
                                        <Route path=":id" element={<ProtectedRoute requiredPermission="PATIENTS_VIEW"><PatientProfilePage /></ProtectedRoute>} />
                                        <Route path=":id/encounters" element={<ProtectedRoute requiredPermission="PATIENTS_VIEW"><PatientEncountersPage /></ProtectedRoute>} />
                                        <Route path=":id/vaccinations" element={<ProtectedRoute requiredPermission="PATIENTS_VIEW"><PatientVaccinationsPage /></ProtectedRoute>} />
                                    </Route>

                                    <Route path="/health-staff">
                                        <Route index element={<ProtectedRoute requiredPermission="STAFF_VIEW"><HealthStaffPage /></ProtectedRoute>} />
                                        <Route path=":id" element={<ProtectedRoute requiredPermission="STAFF_VIEW"><HealthStaffProfilePage /></ProtectedRoute>} />
                                    </Route>

                                    <Route path="/appointments">
                                        <Route index element={<ProtectedRoute requiredPermission="APPOINTMENTS_VIEW"><AppointmentsPage /></ProtectedRoute>} />
                                        <Route path=":id" element={<ProtectedRoute requiredPermission="APPOINTMENTS_VIEW"><AppointmentDetailsPage /></ProtectedRoute>} />
                                    </Route>

                                    <Route path="/waiting-room" element={<ProtectedRoute requiredPermission="WAITING_VIEW"><WaitingRoomPage /></ProtectedRoute>} />

                                    <Route path="/urgencies">
                                        <Route index element={<ProtectedRoute requiredPermission="EMERGENCY_VIEW"><UrgenciesPage /></ProtectedRoute>} />
                                        <Route path=":id" element={<ProtectedRoute requiredPermission="EMERGENCY_VIEW"><UrgencyCasePage /></ProtectedRoute>} />
                                        <Route path=":id/referral" element={<ProtectedRoute requiredPermission="REFERRAL_EDIT"><UrgencyReferralPage /></ProtectedRoute>} />
                                    </Route>

                                    {/* Specialized I-4 Modules with Guarded Permissions */}
                                    <Route path="/triaje" element={<ProtectedRoute requiredPermission="TRIAGE_VIEW|TRIAGE_EDIT"><TriajePage /></ProtectedRoute>} />
                                    <Route path="/vacunacion" element={<ProtectedRoute requiredPermission="VAX_VIEW|VAX_ADMIN"><VacunacionPage /></ProtectedRoute>} />
                                    <Route path="/programas-minsa" element={<ProtectedRoute requiredPermission="PROGRAMS_VIEW|PROGRAMS_EDIT"><ProgramasMinsaPage /></ProtectedRoute>} />

                                    <Route path="/referral-system">
                                        <Route index element={<ProtectedRoute requiredPermission="REFERRAL_VIEW"><ReferralSystemPage /></ProtectedRoute>} />
                                        <Route path="new" element={<ProtectedRoute requiredPermission="REFERRAL_VIEW|REFERRAL_EDIT"><ReferralNewPage /></ProtectedRoute>} />
                                        <Route path=":id" element={<ProtectedRoute requiredPermission="REFERRAL_VIEW|REFERRAL_EDIT"><ReferralDetailPage /></ProtectedRoute>} />
                                    </Route>

                                    <Route path="/his-reporting">
                                        <Route index element={<ProtectedRoute requiredPermission="HIS_VIEW"><HISReportingPage /></ProtectedRoute>} />
                                        <Route path="new" element={<ProtectedRoute requiredPermission="HIS_VIEW|HIS_EDIT"><HISReportingNewPage /></ProtectedRoute>} />
                                    </Route>

                                    <Route path="/telemedicine" element={<ProtectedRoute requiredPermission="TELEMEDICINE_VIEW"><TelemedicinePage /></ProtectedRoute>} />

                                    <Route path="/epidemiology">
                                        <Route index element={<ProtectedRoute requiredPermission="EPIDEMIO_VIEW"><EpidemiologyPage /></ProtectedRoute>} />
                                        <Route path="report/new" element={<ProtectedRoute requiredPermission="EPIDEMIO_VIEW|EPIDEMIO_EDIT"><EpidemiologyReportNewPage /></ProtectedRoute>} />
                                    </Route>

                                    <Route path="/sis-validation" element={<ProtectedRoute requiredPermission="SIS_VIEW"><SISValidationPage /></ProtectedRoute>} />

                                    {/* Support Services */}
                                    <Route path="/observation-room">
                                        <Route index element={<ProtectedRoute requiredPermission="BEDS_VIEW"><ObservationRoomPage /></ProtectedRoute>} />
                                        <Route path=":id" element={<ProtectedRoute requiredPermission="BEDS_VIEW"><ObservationRoomDetailPage /></ProtectedRoute>} />
                                    </Route>

                                    <Route path="/pharmacy" element={<ProtectedRoute requiredPermission="PHARMACY_VIEW"><PharmacyPage /></ProtectedRoute>} />

                                    <Route path="/laboratory">
                                        <Route index element={<ProtectedRoute requiredPermission="LAB_VIEW"><LaboratoryPage /></ProtectedRoute>} />
                                        <Route path="results/:id" element={<ProtectedRoute requiredPermission="LAB_VIEW"><LabResultDetailsPage /></ProtectedRoute>} />
                                        <Route path="orders/:id" element={<ProtectedRoute requiredPermission="LAB_VIEW"><LabOrderDetailsPage /></ProtectedRoute>} />
                                    </Route>

                                    {/* Management & Admin */}
                                    <Route path="/attendance-records" element={<ProtectedRoute requiredPermission="BILLING_VIEW"><AttendanceRecordsPage /></ProtectedRoute>} />
                                    <Route path="/reports" element={<ProtectedRoute requiredPermission="REPORTS_VIEW"><ReportsPage /></ProtectedRoute>} />
                                    <Route path="/public-health" element={<ProtectedRoute requiredPermission="ANALYTICS_VIEW"><PublicHealthPage /></ProtectedRoute>} />
                                    <Route path="/hr" element={<ProtectedRoute requiredPermission="HR_VIEW"><HRPage /></ProtectedRoute>} />

                                    <Route path="/ai" element={<ProtectedRoute requiredPermission="AI_USE"><AIPage /></ProtectedRoute>} />
                                    <Route path="/messages" element={<ProtectedRoute requiredPermission="MESSAGES_VIEW"><MessagesPage /></ProtectedRoute>} />

                                    <Route path="/admin">
                                        <Route index element={<ProtectedRoute requiredPermission="ADMIN_VIEW"><AdminPage /></ProtectedRoute>} />
                                        <Route path="audit" element={<ProtectedRoute requiredPermission="AUDIT_VIEW"><AuditLogsPage /></ProtectedRoute>} />
                                    </Route>

                                    <Route path="/settings" element={<ProtectedRoute requiredPermission="SETTINGS_VIEW"><SettingsPage /></ProtectedRoute>} />
                                </Route>
                            </Route>

                            {/* --- Fallbacks --- */}
                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </BrowserRouter>
                <Toaster />
            </OrganizationProvider>
        </ThemeProvider>
    )
}

export default App
