import { useAuthStore } from '../../../store/useAuthStore.ts'
import { UserRole } from '../../../types/types.ts'
import Wrapper from '../components/layout/wrapper.tsx'
import WelcomeHeader from '../components/dashboard/welcomeHeader.tsx'
import StatCards from '../components/dashboard/statCards.tsx'
import TodaySchedule from '../components/dashboard/todaySchedule.tsx'
import DoctorRoster from '../components/dashboard/doctorRoster.tsx'
import WeekAhead from '../components/dashboard/weekAhead.tsx'
import { useClinicNow } from '../hooks/useClinicNow.ts'
import { useFacilityStore } from '../store/useFacilityStore.ts'
import { clinicClock } from '../utils/clinicTime.ts'
import { doctorDuty } from '../utils/schedule.ts'

export default function Dashboard() {
    return (
        <Wrapper title="Overview">
            <Overview />
        </Wrapper>
    )
}

// Rendered once the wrapper has loaded the facility's data
function Overview() {
    const user = useAuthStore((s) => s.user)
    const members = useFacilityStore((s) => s.members)
    const workingHours = useFacilityStore((s) => s.workingHours)
    const appointments = useFacilityStore((s) => s.appointments)
    const { now, timeZone } = useClinicNow()

    const doctors = members.filter((member) => member.role === UserRole.DOCTOR)
    const today = clinicClock(now, timeZone).day
    const todays = appointments
        .filter((appointment) => clinicClock(appointment.starts_at, timeZone).day === today)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

    const roster = doctors.map((doctor) => ({ doctor, duty: doctorDuty(doctor, workingHours, now, timeZone) }))

    return (
        <div className="flex flex-col gap-6">
            <WelcomeHeader name={user?.name ?? ''} now={now} timeZone={timeZone} />
            <StatCards appointments={todays} roster={roster} now={now} />

            <div className="grid gap-6 lg:grid-cols-3">
                <TodaySchedule className="lg:col-span-2" appointments={todays} now={now} timeZone={timeZone} />
                <div className="flex flex-col gap-6">
                    <DoctorRoster roster={roster} canManage />
                    <WeekAhead appointments={appointments} now={now} timeZone={timeZone} />
                </div>
            </div>
        </div>
    )
}
