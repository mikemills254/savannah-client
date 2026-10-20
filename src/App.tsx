import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './website/pages/landing.tsx'
import ForClinics from './website/pages/ForClinics.tsx'
import Login from './pages/auth/login.tsx'
import Register from './pages/auth/register.tsx'
import ForgotPassword from './pages/auth/forgotpass.tsx'
import TwoFactor from './pages/auth/2fa.tsx'
import AcceptInvite from './pages/auth/acceptInvite.tsx'
import Dashboard from './pages/dashboard.tsx'
import { UserGate } from './pages/userGate.tsx'
import BookVisit from './pages/patient/book.tsx'
import Doctors from './pages/facility/pages/doctors.tsx'
import Appointments from './pages/facility/pages/appointments.tsx'
import WorkingHours from './pages/facility/pages/workingHours.tsx'
import Settings from './pages/facility/pages/settings.tsx'
import { UserRole } from './types/types.ts'

const ADMIN = [UserRole.FACILITY_ADMIN]
const STAFF = [UserRole.FACILITY_ADMIN, UserRole.DOCTOR]

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Landing & Marketing Pages */}
                <Route path="/" element={<Landing />} />
                <Route path="/for-clinics" element={<ForClinics />} />

                {/* Auth Pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify" element={<TwoFactor />} />
                <Route path="/accept-invite" element={<AcceptInvite />} />

                {/* Every role starts here; it picks their dashboard */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Patients */}
                <Route
                    path="/book"
                    element={<UserGate roles={[UserRole.PATIENT]}>{() => <BookVisit />}</UserGate>}
                />

                {/* Facility staff: admins see everything, doctors their own schedule */}
                <Route path="/dashboard/doctors" element={<UserGate roles={ADMIN}>{() => <Doctors />}</UserGate>} />
                <Route
                    path="/dashboard/appointments"
                    element={<UserGate roles={STAFF}>{() => <Appointments />}</UserGate>}
                />
                <Route path="/dashboard/hours" element={<UserGate roles={STAFF}>{() => <WorkingHours />}</UserGate>} />
                <Route path="/dashboard/settings" element={<UserGate roles={ADMIN}>{() => <Settings />}</UserGate>} />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
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
