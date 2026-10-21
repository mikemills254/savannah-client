import { useOutletContext } from 'react-router-dom'
import type { IAuthUser } from '../types/auth.types.ts'

// The signed-in user, for any page rendered under a PrivateRoute
export function useCurrentUser() {
    return useOutletContext<IAuthUser>()
}
