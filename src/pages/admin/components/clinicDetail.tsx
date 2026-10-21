import { useEffect, useState } from 'react'
import { LuPlus, LuRefreshCw, LuUserPlus } from 'react-icons/lu'
import { handleGetFacilityDoctors } from '../../../api/admin.ts'
import { handleGetMembers } from '../../../api/facility.ts'
import { unwrap } from '../../../api/request.ts'
import { LiveBadge } from '../../../components/ui.tsx'
import type { IBookableFacility, IDoctor, IMember, StaffRole } from '../../../types/facility.types.ts'
import { UserRole } from '../../../types/types.ts'
import { InvitePendingPill } from '../../facility/components/doctors/doctorRow.tsx'
import Avatar from '../../facility/components/ui/avatar.tsx'
import Panel from '../../facility/components/ui/panel.tsx'
import { dayHeading, formatDate, formatTime } from '../../facility/utils/clinicTime.ts'
import StaffForm from './staffForm.tsx'
import StaffRow from './staffRow.tsx'

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready' }

function upsert(members: IMember[], member: IMember): IMember[] {
    return members.some((existing) => existing.id === member.id)
        ? members.map((existing) => (existing.id === member.id ? member : existing))
        : [...members, member]
}

// Active first, then by name
const byStatusThenName = (a: IMember, b: IMember) =>
    Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name)

interface ClinicDetailProps {
    clinic: IBookableFacility
    // Just created here: open the form for its first admin straight away
    isNew: boolean
    now: Date
}

// One clinic's staff accounts and the doctors patients can book there.
// Mounted with key={clinic.id}, so switching clinics starts fresh.
export default function ClinicDetail({ clinic, isNew, now }: ClinicDetailProps) {
    const [load, setLoad] = useState<Load>({ state: 'loading' })
    const [attempt, setAttempt] = useState(0)
    const [members, setMembers] = useState<IMember[]>([])
    const [doctors, setDoctors] = useState<IDoctor[]>([])
    const [adding, setAdding] = useState<StaffRole | null>(isNew ? UserRole.FACILITY_ADMIN : null)

    useEffect(() => {
        let cancelled = false
        Promise.all([handleGetMembers(clinic.id).then(unwrap), handleGetFacilityDoctors(clinic.id).then(unwrap)]).then(
            ([memberList, doctorList]) => {
                if (cancelled) return
                setMembers(memberList)
                setDoctors(doctorList)
                setLoad({ state: 'ready' })
            },
            (error: unknown) => {
                if (cancelled) return
                setLoad({ state: 'error', message: error instanceof Error ? error.message : "Couldn't load this clinic" })
            },
        )
        return () => {
            cancelled = true
        }
    }, [clinic.id, attempt])

    // Adding, deactivating or restoring a doctor changes who patients can book
    const changeMember = (member: IMember) => {
        setMembers((list) => upsert(list, member))
        if (member.role !== UserRole.DOCTOR) return
        handleGetFacilityDoctors(clinic.id).then((response) => {
            // On failure the old list stays; it's refreshed on the next change or reload
            if (response.success) setDoctors(response.data ?? [])
        })
    }

    const admins = members.filter((member) => member.role === UserRole.FACILITY_ADMIN).sort(byStatusThenName)
    const staffDoctors = members.filter((member) => member.role === UserRole.DOCTOR).sort(byStatusThenName)
    const hasActiveAdmin = admins.some((admin) => admin.is_active)
    const pendingIds = new Set(members.filter((member) => member.has_password === false).map((member) => member.id))

    const next = clinic.next_available
    const created = formatDate(new Date(clinic.created_at), clinic.timezone, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    return (
        <div className="flex flex-col gap-6">
            <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="m-0 truncate text-xl font-extrabold tracking-[-0.02em] text-copy">{clinic.name}</h2>
                        <p className="m-0 mt-1 text-sm text-copy-light">
                            {clinic.timezone.replace(/_/g, ' ')} · {formatTime(now, clinic.timezone)} there now · on
                            DocConnect since {created}
                        </p>
                    </div>
                    {clinic.is_active && <LiveBadge>Live</LiveBadge>}
                </div>
                <p className="m-0 mt-4 border-t border-border pt-4 text-sm text-copy-light">
                    {next ? (
                        <>
                            Next open slot:{' '}
                            <span className="font-semibold text-copy">
                                {dayHeading(next.starts_at, now, clinic.timezone)} at{' '}
                                {formatTime(next.starts_at, clinic.timezone)}
                            </span>
                        </>
                    ) : (
                        'No open slots in the next 14 days.'
                    )}
                </p>
            </Panel>

            {load.state === 'loading' && (
                <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
                    <div className="h-64 animate-pulse rounded-lg bg-white" />
                    <div className="h-40 animate-pulse rounded-lg bg-white" />
                </div>
            )}

            {load.state === 'error' && (
                <div className="rounded-lg border border-border bg-white px-6 py-12 text-center">
                    <p className="m-0 font-semibold text-copy">We couldn't load this clinic's staff</p>
                    <p className="m-0 mt-1 text-sm text-copy-light">{load.message}</p>
                    <button
                        type="button"
                        onClick={() => {
                            setLoad({ state: 'loading' })
                            setAttempt((n) => n + 1)
                        }}
                        className="btn btn-primary mt-5"
                    >
                        <LuRefreshCw className="size-4" />
                        Try again
                    </button>
                </div>
            )}

            {load.state === 'ready' && (
                <>
                    {/* Nobody can run a clinic without an admin, so prompt for one first */}
                    {!hasActiveAdmin && adding === null && (
                        <div className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="m-0 text-sm text-copy">
                                <span className="font-semibold">{clinic.name} has no active admin.</span> Add one so
                                someone can manage its doctors, hours and visits.
                            </p>
                            <button
                                type="button"
                                onClick={() => setAdding(UserRole.FACILITY_ADMIN)}
                                className="btn btn-primary shrink-0"
                            >
                                <LuUserPlus className="size-4" />
                                Add first admin
                            </button>
                        </div>
                    )}

                    {adding && (
                        <Panel title={hasActiveAdmin ? 'Add staff' : `Add ${clinic.name}'s first admin`}>
                            <StaffForm
                                facilityId={clinic.id}
                                members={members}
                                initialRole={adding}
                                onAdded={changeMember}
                                onClose={() => setAdding(null)}
                            />
                        </Panel>
                    )}

                    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                        <Panel
                            title="Staff accounts"
                            action={
                                !adding && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAdding(hasActiveAdmin ? UserRole.DOCTOR : UserRole.FACILITY_ADMIN)
                                        }
                                        className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-sm font-semibold text-primary hover:underline"
                                    >
                                        <LuPlus className="size-4" />
                                        Add staff
                                    </button>
                                )
                            }
                        >
                            {members.length === 0 ? (
                                <p className="m-0 py-10 text-center text-sm text-copy-light">No staff accounts yet.</p>
                            ) : (
                                <div className="flex flex-col gap-5">
                                    <StaffGroup
                                        title="Admins"
                                        empty="No admins yet."
                                        facilityId={clinic.id}
                                        members={admins}
                                        onChange={changeMember}
                                    />
                                    <StaffGroup
                                        title="Doctors"
                                        empty="No doctors yet."
                                        facilityId={clinic.id}
                                        members={staffDoctors}
                                        onChange={changeMember}
                                    />
                                </div>
                            )}
                        </Panel>

                        <Panel
                            title="Taking bookings"
                            action={<span className="text-sm font-semibold tabular-nums text-copy-light">{doctors.length}</span>}
                        >
                            <p className="m-0 text-xs text-copy-lighter">
                                The doctors patients can pick here. Each needs working hours, set by the clinic's
                                admins, before any slots open.
                            </p>
                            {doctors.length === 0 ? (
                                <p className="m-0 py-8 text-center text-sm text-copy-light">
                                    No active doctors, so patients can't book here yet.
                                </p>
                            ) : (
                                <ul className="m-0 mt-2 list-none divide-y divide-border p-0">
                                    {doctors.map((doctor) => (
                                        <li key={doctor.id} className="flex items-center gap-3 py-2.5">
                                            <Avatar name={doctor.name} />
                                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-copy">
                                                {doctor.name}
                                            </span>
                                            {/* Listed for booking, though they can't log in yet */}
                                            {pendingIds.has(doctor.id) && <InvitePendingPill />}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
                    </div>
                </>
            )}
        </div>
    )
}

interface StaffGroupProps {
    title: string
    empty: string
    facilityId: string
    members: IMember[]
    onChange: (member: IMember) => void
}

function StaffGroup({ title, empty, facilityId, members, onChange }: StaffGroupProps) {
    const active = members.filter((member) => member.is_active).length

    return (
        <section>
            <h3 className="m-0 text-xs font-semibold tracking-wide text-copy-lighter uppercase">
                {title} · {active} active
                {members.length > active ? `, ${members.length - active} deactivated` : ''}
            </h3>
            {members.length === 0 ? (
                <p className="m-0 mt-2 text-sm text-copy-light">{empty}</p>
            ) : (
                <ul className="m-0 mt-1 list-none divide-y divide-border p-0">
                    {members.map((member) => (
                        <StaffRow key={member.id} facilityId={facilityId} member={member} onChange={onChange} />
                    ))}
                </ul>
            )}
        </section>
    )
}
