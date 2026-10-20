import { useState } from 'react'
import { LuPlus } from 'react-icons/lu'
import { UserRole } from '../../../types/types.ts'
import Wrapper from '../components/layout/wrapper.tsx'
import DoctorRow from '../components/doctors/doctorRow.tsx'
import MemberForm from '../components/members/memberForm.tsx'
import Panel from '../components/ui/panel.tsx'
import SegmentedControl from '../components/ui/segmentedControl.tsx'
import { useClinicNow } from '../hooks/useClinicNow.ts'
import { useFacilityStore } from '../store/useFacilityStore.ts'
import { weeklyMinutes } from '../utils/schedule.ts'

type Filter = 'active' | 'inactive' | 'all'

export default function Doctors() {
    const members = useFacilityStore((s) => s.members)
    const workingHours = useFacilityStore((s) => s.workingHours)
    const appointments = useFacilityStore((s) => s.appointments)
    const { now } = useClinicNow()

    const [filter, setFilter] = useState<Filter>('active')
    const [query, setQuery] = useState('')
    const [adding, setAdding] = useState(false)

    const doctors = members.filter((member) => member.role === UserRole.DOCTOR)
    const activeCount = doctors.filter((doctor) => doctor.is_active).length

    const search = query.trim().toLowerCase()
    const shown = doctors
        .filter((doctor) => filter === 'all' || doctor.is_active === (filter === 'active'))
        .filter((doctor) => !search || doctor.name.toLowerCase().includes(search) || doctor.email.includes(search))
        .sort((a, b) => a.name.localeCompare(b.name))

    return (
        <Wrapper title="Doctors">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="m-0 max-w-xl text-sm text-copy-light">
                        Patients can book any active doctor during their working hours. A doctor without hours
                        won't show up for booking.
                    </p>
                    {!adding && (
                        <button type="button" onClick={() => setAdding(true)} className="btn btn-primary shrink-0">
                            <LuPlus className="size-4" />
                            Add doctor
                        </button>
                    )}
                </div>

                {adding && (
                    <Panel title="Add a doctor">
                        <MemberForm role={UserRole.DOCTOR} members={members} onClose={() => setAdding(false)} />
                    </Panel>
                )}

                <Panel>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <SegmentedControl
                            label="Show doctors"
                            value={filter}
                            onChange={setFilter}
                            options={[
                                { value: 'active', label: 'Active', count: activeCount },
                                { value: 'inactive', label: 'Deactivated', count: doctors.length - activeCount },
                                { value: 'all', label: 'All', count: doctors.length },
                            ]}
                        />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search name or email"
                            aria-label="Search doctors"
                            className="form-input sm:w-64"
                        />
                    </div>

                    {shown.length === 0 ? (
                        <p className="m-0 py-12 text-center text-sm text-copy-light">
                            {search ? `No doctors match “${query.trim()}”.` : 'No doctors here yet.'}
                        </p>
                    ) : (
                        <ul className="m-0 mt-2 list-none divide-y divide-border p-0">
                            {shown.map((doctor) => (
                                <DoctorRow
                                    key={doctor.id}
                                    doctor={doctor}
                                    weekly={weeklyMinutes(workingHours.filter((hour) => hour.doctor_id === doctor.id))}
                                    upcoming={
                                        appointments.filter(
                                            (a) =>
                                                a.doctor.id === doctor.id &&
                                                a.status === 'BOOKED' &&
                                                new Date(a.starts_at) > now,
                                        ).length
                                    }
                                />
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </Wrapper>
    )
}
