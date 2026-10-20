import { Navbar } from '../components/Navbar.tsx'
import { Footer } from '../components/Footer.tsx'
import ClinicHero from '../sections/forclinics/hero.tsx'
import ClinicSteps from '../sections/forclinics/steps.tsx'
import ClinicFeatures from '../sections/forclinics/features.tsx'
import BeforeAfter from '../sections/forclinics/beforeafter.tsx'
import ClinicFaq from '../sections/forclinics/faq.tsx'
import ClinicCta from '../sections/forclinics/cta.tsx'

export function ForClinics() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
                <ClinicHero />
                <ClinicSteps />
                <ClinicFeatures />
                <BeforeAfter />
                <ClinicFaq />
                <ClinicCta />
            </main>
            <Footer />
        </div>
    )
}

export default ForClinics
