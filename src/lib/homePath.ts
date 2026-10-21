import type { IAuthUser } from '../types/auth.types.ts'
import { UserRole } from '../types/types.ts'

// Where each role lands after signing in, and where PrivateRoute sends users off their pages
export function homePath(user: IAuthUser): string {
    switch (user.role) {
        case UserRole.PATIENT:
            return '/visits'
        case UserRole.FACILITY_ADMIN:
            return `/${user.facility_id}/dashboard`
        // Doctors have their own space, across every facility they work at
        case UserRole.DOCTOR:
            return '/doctor'
        case UserRole.SUPER_ADMIN:
            return '/admin'
    }
}
