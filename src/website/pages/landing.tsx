import { useEffect, useState } from 'react'
import { fetchFacilities, type Facility } from '../../api/client.ts'
import { useAuthStore } from '../../store/useAuthStore.ts'
import { Navbar } from '../components/Navbar.tsx'
import { Footer } from '../components/Footer.tsx'
import Clinics from '../sections/clinics.tsx'
import Cta from '../sections/cta.tsx'
import Hero from '../sections/hero.tsx'
import { HowItWorks } from '../sections/howitworks.tsx'
import Reliability from '../sections/reliability.tsx'
import SameSlot from '../sections/sameslot.tsx'
import ClinicTeaser from '../sections/clinicteaser.tsx'


function Landing() {
    const [clinics, setClinics] = useState<Facility[]>([])
    const initializeAuth = useAuthStore((s) => s.initialize)

    useEffect(() => {
        // Initialize auth state if token is present
        initializeAuth()

        // Fetch facilities (public, no auth)
        let isMounted = true
        fetchFacilities()
            .then((data) => {
                if (isMounted && Array.isArray(data)) {
                    setClinics(data)
                }
            })
            .catch(() => {
                // Silently catch error; ClinicsSection remains hidden when empty
                if (isMounted) setClinics([])
            })

        return () => {
            isMounted = false
        }
    }, [initializeAuth])

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
            <Navbar hasClinics={clinics.length > 0} />
            <main style={{ flex: 1 }}>
                <Hero />
                <HowItWorks />
                <Reliability />
                <SameSlot />
                <Clinics clinics={clinics} />
                <ClinicTeaser />
                <Cta />
            </main>
            <Footer />
        </div>
    )
}

export default Landing
