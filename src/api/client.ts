import { API_BASE_URL as API_BASE } from '../lib/api'

export interface Facility {
  id: string
  name: string
  timezone: string
  is_active: boolean
  created_at: string
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export async function fetchFacilities(): Promise<Facility[]> {
  try {
    const res = await fetch(`${API_BASE}/facilities`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    if (!res.ok) {
      return []
    }
    const data = await res.json()
    if (Array.isArray(data)) {
      return data
    }
    // Handle { items: [...] } or { value: [...] } if wrapped
    if (data && Array.isArray(data.items)) {
      return data.items
    }
    if (data && Array.isArray(data.value)) {
      return data.value
    }
    return []
  } catch {
    // Return empty array on failure so landing page never breaks or shows error
    return []
  }
}

export async function loginUser(credentials: { email: string; password: string }): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!res.ok) {
    let errorMsg = 'Failed to log in'
    try {
      const errorData = await res.json()
      if (errorData.detail) {
        errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail)
      }
    } catch {
      // fallback
    }
    throw new Error(errorMsg)
  }

  return res.json()
}

export async function registerUser(payload: { name: string; email: string; password: string }): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let errorMsg = 'Registration failed'
    try {
      const errorData = await res.json()
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail.map((d: { msg?: string }) => d.msg || 'Invalid field').join(', ')
        } else {
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail)
        }
      }
    } catch {
      // fallback
    }
    throw new Error(errorMsg)
  }

  return res.json()
}

export interface ClinicApplication {
  clinic_name: string
  timezone: string
  admin_email: string
}

// TODO: wire to the backend once it exposes a clinic-request endpoint.
// Clinics are reviewed before going live (POST /facilities is super-admin only),
// so this will submit a PENDING application; for now it only simulates the request.
export async function submitClinicApplication(application: ClinicApplication): Promise<void> {
  void application
  await new Promise((resolve) => setTimeout(resolve, 600))
}

export async function fetchCurrentUser(token: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
