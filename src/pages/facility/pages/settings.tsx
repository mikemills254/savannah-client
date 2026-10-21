import { useState } from 'react'
import toast from 'react-hot-toast'
import InviteLink from '../../../components/inviteLink.tsx'
import { homeFacility } from '../../../lib/staffFacility.ts'
import { useAuthStore } from '../../../store/useAuthStore.ts'
import type { IMember } from '../../../types/facility.types.ts'
import { UserRole } from '../../../types/types.ts'
import { InvitePendingPill, ReissueInviteButton } from '../components/doctors/doctorRow.tsx'
import Wrapper from '../components/layout/wrapper.tsx'
import MemberForm from '../components/members/memberForm.tsx'
import Avatar from '../components/ui/avatar.tsx'
import ConfirmButton from '../components/ui/confirmButton.tsx'
import Panel from '../components/ui/panel.tsx'
import { useClinicNow } from '../hooks/useClinicNow.ts'
import { useFacilityStore } from '../store/useFacilityStore.ts'
import { formatDate } from '../utils/clinicTime.ts'

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs font-medium text-copy-lighter">{label}</dt>
            <dd className="m-0 mt-1 text-sm font-semibold text-copy">{value}</dd>
        </div>
    )
}

function AdminRow({ admin }: { admin: IMember }) {
    const setMemberActive = useFacilityStore((s) => s.setMemberActive)
    const facilityId = useFacilityStore((s) => s.facilityId)
    const [inviteToken, setInviteToken] = useState<string | null>(null)
    const firstName = admin.name.split(' ')[0]
    const pending = admin.is_active && admin.has_password === false

    return (
        <li className="flex flex-wrap items-center gap-3 py-3">
            <Avatar name={admin.name} muted={!admin.is_active} />
            <div className="min-w-0 flex-1">
                <p className="m-0 flex items-center gap-2 text-sm font-semibold text-copy">
                    <span className="truncate">{admin.name}</span>
                    {pending && <InvitePendingPill />}
                </p>
                <p className="m-0 truncate text-xs text-copy-light">{admin.email}</p>
            </div>
            {admin.is_active ? (
                <div className="flex flex-wrap items-center gap-2">
                    {pending && (
                        <ReissueInviteButton facilityId={facilityId} member={admin} onIssued={setInviteToken} />
                    )}
                    <ConfirmButton
                        label="Remove"
                        question={`Remove ${firstName}?`}
                        confirmLabel="Remove"
                        onConfirm={() => setMemberActive(admin.id, false)}
                    />
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() =>
                        setMemberActive(admin.id, true).then(
                            () => toast.success(`${firstName} is an admin again`),
                            (error: Error) => toast.error(error.message),
                        )
                    }
                    className="rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary-light"
                >
                    Restore
                </button>
            )}
            {pending && inviteToken && (
                <div className="basis-full pl-12">
                    <InviteLink token={inviteToken} name={admin.name} />
                </div>
            )}
        </li>
    )
}

export default function Settings() {
    const user = useAuthStore((s) => s.user)
    const members = useFacilityStore((s) => s.members)
    const { timeZone } = useClinicNow()
    const [adding, setAdding] = useState(false)

    const facility = homeFacility(user)
    const admins = members
        .filter((member) => member.role === UserRole.FACILITY_ADMIN && member.id !== user?.id)
        .sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name))

    return (
        <Wrapper title="Settings">
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="flex flex-col gap-6 lg:col-span-2">
                    <Panel title="Clinic details">
                        <dl className="m-0 grid gap-5 sm:grid-cols-2">
                            <Detail label="Name" value={facility?.name ?? '—'} />
                            <Detail label="Timezone" value={timeZone.replace(/_/g, ' ')} />
                            <Detail
                                label="Status"
                                value={facility?.is_active ? 'Live, taking bookings' : 'Not live'}
                            />
                            <Detail
                                label="On DocConnect since"
                                value={
                                    facility
                                        ? formatDate(new Date(facility.created_at), timeZone, {
                                              day: 'numeric',
                                              month: 'long',
                                              year: 'numeric',
                                          })
                                        : '—'
                                }
                            />
                        </dl>
                        <p className="m-0 mt-5 border-t border-border pt-4 text-xs text-copy-lighter">
                            The DocConnect team sets these when a clinic is approved. Every time across your
                            dashboard, including doctors' working hours, uses this timezone.
                        </p>
                    </Panel>

                    <Panel
                        title="Clinic admins"
                        action={
                            !adding && (
                                <button
                                    type="button"
                                    onClick={() => setAdding(true)}
                                    className="border-0 bg-transparent p-0 text-sm font-semibold text-primary hover:underline"
                                >
                                    Add admin
                                </button>
                            )
                        }
                    >
                        {adding && (
                            <div className="mb-4 rounded-md bg-background p-4">
                                <MemberForm
                                    role={UserRole.FACILITY_ADMIN}
                                    members={members}
                                    onClose={() => setAdding(false)}
                                />
                            </div>
                        )}

                        <ul className="m-0 list-none divide-y divide-border p-0">
                            {user && (
                                <li className="flex items-center gap-3 py-3">
                                    <Avatar name={user.name} />
                                    <div className="min-w-0 flex-1">
                                        <p className="m-0 truncate text-sm font-semibold text-copy">{user.name}</p>
                                        <p className="m-0 truncate text-xs text-copy-light">{user.email}</p>
                                    </div>
                                    <span className="rounded-full bg-accent-bg px-2.5 py-1 text-xs font-semibold text-primary">
                                        You
                                    </span>
                                </li>
                            )}

                            {admins.map((admin) => (
                                <AdminRow key={admin.id} admin={admin} />
                            ))}
                        </ul>
                    </Panel>
                </div>

                <Panel title="Your account" className="h-fit">
                    {user && (
                        <div className="flex items-center gap-3">
                            <Avatar name={user.name} />
                            <div className="min-w-0">
                                <p className="m-0 truncate text-sm font-semibold text-copy">{user.name}</p>
                                <p className="m-0 truncate text-xs text-copy-light">{user.email}</p>
                            </div>
                        </div>
                    )}
                    <p className="m-0 mt-4 text-sm text-copy-light">
                        As a clinic admin you manage doctors, their hours and appointments
                        {facility ? ` at ${facility.name}` : ''}.
                    </p>
                </Panel>
            </div>
        </Wrapper>
    )
}
