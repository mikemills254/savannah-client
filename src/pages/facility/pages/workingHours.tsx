import { Link, useSearchParams } from 'react-router-dom'
import DayRow from '../../../components/schedule/dayRow.tsx'
import { UserRole } from '../../../types/types.ts'
import Wrapper from '../components/layout/wrapper.tsx'
import Panel from '../components/ui/panel.tsx'
import { useClinicNow } from '../hooks/useClinicNow.ts'
import { useFacilityStore } from '../store/useFacilityStore.ts'
import { clinicClock, formatDuration, toMinutes } from '../utils/clinicTime.ts'
import { WEEKDAY_NAMES, weeklyMinutes } from '../utils/schedule.ts'

export default function WorkingHours() {
    const members = useFacilityStore((s) => s.members)
    const workingHours = useFacilityStore((s) => s.workingHours)
    const facilityId = useFacilityStore((s) => s.facilityId)
    const addShift = useFacilityStore((s) => s.addShift)
    const removeShift = useFacilityStore((s) => s.removeShift)
    const { now, timeZone } = useClinicNow()
    // The doctor lives in the URL so the Doctors page can link straight to them
    const [params, setParams] = useSearchParams()

    // Deactivated doctors can't take bookings, so their hours aren't editable here
    const doctors = members
        .filter((member) => member.role === UserRole.DOCTOR && member.is_active)
        .sort((a, b) => a.name.localeCompare(b.name))
    const selected = doctors.find((doctor) => doctor.id === params.get('doctor')) ?? doctors[0]

    if (!selected) {
        return (
            <Wrapper title="Working hours">
                <Panel>
                    <p className="m-0 py-10 text-center text-sm text-copy-light">
                        Add a doctor before setting working hours.{' '}
                        <Link to={`/${facilityId}/dashboard/doctors`} className="font-semibold text-primary hover:underline">
                            Go to Doctors
                        </Link>
                    </p>
                </Panel>
            </Wrapper>
        )
    }

    const hours = workingHours
        .filter((hour) => hour.doctor_id === selected.id)
        .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time))
    const workDays = new Set(hours.map((hour) => hour.weekday)).size
    const today = clinicClock(now, timeZone).weekday

    return (
        <Wrapper title="Working hours">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-copy sm:w-72">
                        Doctor
                        <select
                            value={selected.id}
                            onChange={(event) => setParams({ doctor: event.target.value })}
                            className="form-input select-chevron"
                        >
                            {doctors.map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                    {doctor.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    {hours.length > 0 ? (
                        <p className="m-0 text-sm text-copy-light">
                            <span className="font-semibold text-copy">{formatDuration(weeklyMinutes(hours))}</span> a
                            week across {workDays} {workDays === 1 ? 'day' : 'days'}
                        </p>
                    ) : (
                        <p className="m-0 rounded-sm bg-warning/15 px-3 py-2 text-sm text-warning-content">
                            No hours yet, so patients can't book {selected.name.split(' ')[0]}.
                        </p>
                    )}
                </div>

                <Panel
                    title="Weekly schedule"
                    action={<span className="text-xs text-copy-lighter">Clinic time · {timeZone.replace(/_/g, ' ')}</span>}
                >
                    <ul className="m-0 list-none divide-y divide-border p-0">
                        {WEEKDAY_NAMES.map((name, weekday) => (
                            <DayRow
                                // Keyed by doctor too, so a half-filled form doesn't carry over to the next doctor
                                key={`${selected.id}-${weekday}`}
                                weekday={weekday}
                                name={name}
                                isToday={weekday === today}
                                shifts={hours.filter((hour) => hour.weekday === weekday)}
                                onAdd={(shift) => addShift(selected.id, shift)}
                                onRemove={removeShift}
                            />
                        ))}
                    </ul>
                </Panel>
            </div>
        </Wrapper>
    )
}
