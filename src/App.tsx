import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './website/pages/landing.tsx'
import ForClinics from './website/pages/ForClinics.tsx'
import Docs from './website/pages/docs.tsx'
import Login from './pages/auth/login.tsx'
import Register from './pages/auth/register.tsx'
import ForgotPassword from './pages/auth/forgotpass.tsx'
import ResetPassword from './pages/auth/resetPassword.tsx'
import TwoFactor from './pages/auth/2fa.tsx'
import AcceptInvite from './pages/auth/acceptInvite.tsx'
import AdminHome from './pages/admin/home.tsx'
import PatientHome from './pages/patient/home.tsx'
import BookVisit from './pages/patient/book.tsx'
import VisitPage from './pages/patient/visit.tsx'
import FacilityDashboard from './pages/facility/pages/dashboard.tsx'
import Doctors from './pages/facility/pages/doctors.tsx'
import Appointments from './pages/facility/pages/appointments.tsx'
import WorkingHours from './pages/facility/pages/workingHours.tsx'
import Settings from './pages/facility/pages/settings.tsx'
import DoctorOverview from './pages/doctor/pages/overview.tsx'
import DoctorSchedule from './pages/doctor/pages/schedule.tsx'
import { UserRole } from './types/types.ts'
import { BrowserOnlyRoute } from './pwa/browserOnlyRoute.tsx'
import { PublicRoute } from './components/layout/publicRoute.tsx'
import { FallbackRoute, PrivateRoute } from './components/layout/privateRoutes.tsx'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Documentation: open to everyone, signed in or not, and in the installed app */}
                <Route path="/docs" element={<Docs />} />

                {/* Public pages: signed-in users are sent to their home */}
                <Route element={<PublicRoute />}>
                    {/* The website; the installed app goes straight to sign-in */}
                    <Route element={<BrowserOnlyRoute />}>
                        <Route path="/" element={<Landing />} />
                        <Route path="/for-clinics" element={<ForClinics />} />
                    </Route>

                    <Route path="/auth">
                        <Route index element={<Navigate to="login" replace />} />
                        <Route path="login" element={<Login />} />
                        <Route path="register" element={<Register />} />
                        <Route path="forgot-password" element={<ForgotPassword />} />
                        <Route path="reset-password" element={<ResetPassword />} />
                        <Route path="verify" element={<TwoFactor />} />
                        <Route path="accept-invite" element={<AcceptInvite />} />
                    </Route>
                </Route>

                {/* Facility admins, scoped to their facility: /:facilityId/dashboard/doctors */}
                <Route path="/:facilityId/dashboard" element={<PrivateRoute roles={[UserRole.FACILITY_ADMIN]} />}>
                    <Route index element={<FacilityDashboard />} />
                    <Route path="doctors" element={<Doctors />} />
                    <Route path="appointments" element={<Appointments />} />
                    <Route path="hours" element={<WorkingHours />} />
                    <Route path="settings" element={<Settings />} />
                </Route>

                {/* Doctors: their own hours and visits, across every facility they work at */}
                <Route path="/doctor" element={<PrivateRoute roles={[UserRole.DOCTOR]} />}>
                    <Route index element={<DoctorOverview />} />
                    <Route path="hours" element={<DoctorSchedule />} />
                </Route>

                {/* Patients */}
                <Route element={<PrivateRoute roles={[UserRole.PATIENT]} />}>
                    <Route path="/visits" element={<PatientHome />} />
                    <Route path="/visits/:appointmentId" element={<VisitPage />} />
                    <Route path="/book" element={<BookVisit />} />
                </Route>

                {/* Platform admins */}
                <Route element={<PrivateRoute roles={[UserRole.SUPER_ADMIN]} />}>
                    <Route path="/admin" element={<AdminHome />} />
                </Route>

                {/* Catch-all: signed-in users go to their home, visitors to the landing page */}
                <Route path="*" element={<FallbackRoute />} />
            </Routes>

            <Toaster
                position="bottom-center"
                toastOptions={{
                    style: { borderRadius: '9999px', background: 'var(--primary-dark)', color: '#fff', fontSize: '0.875rem' },
                }}
            />
        </BrowserRouter>
    )
}
