import type { IAuthUser, IFacility } from '../types/auth.types.ts'

// The facility a staff member signs in to: the one facility_id names, else their first
export function homeFacility(user: IAuthUser | null): IFacility | null {
    if (!user) return null
    return user.facilities.find((facility) => facility.id === user.facility_id) ?? user.facilities[0] ?? null
}
