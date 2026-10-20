import { UserRole } from '../types/types.ts'
import { Notice, UserGate } from './userGate.tsx'
import PatientHome from './patient/home.tsx'
import FacilityDashboard from './facility/pages/dashboard.tsx'

// /dashboard: loads the signed-in user, then shows the dashboard for their role
export function Dashboard() {
  return (
    <UserGate>
      {(user) => {
        switch (user.role) {
          case UserRole.PATIENT:
            return <PatientHome user={user} />
          // Doctors get the facility dashboard, narrowed to their own schedule
          case UserRole.FACILITY_ADMIN:
          case UserRole.DOCTOR:
            return <FacilityDashboard />
          case UserRole.SUPER_ADMIN:
            return (
              <Notice title={`Welcome, ${user.name}`}>
                The clinics on the platform will appear here.
              </Notice>
            )
        }
      }}
    </UserGate>
  )
}

export default Dashboard
