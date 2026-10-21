import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { LuBuilding2, LuShieldCheck, LuStethoscope, LuUser } from 'react-icons/lu'
import { Code, DocSection, Prose, SubHeading, Table } from '../../components/docs.tsx'

interface Role {
    icon: IconType
    name: string
    where: string
    features: ReactNode[]
}

const ROLES: Role[] = [
    {
        icon: LuUser,
        name: 'Patient',
        where: '/visits, /book',
        features: [
            'Pick a clinic, then see every doctor’s free slots for the next 14 days in one view, filterable by doctor.',
            'A day strip shows how many slots each day has left; slots are grouped into morning, afternoon and evening.',
            'If someone takes the slot first, the 409 is explained and the three nearest free slots that day are offered.',
            'Upcoming visits as a ticket with a countdown, plus history with who booked and who cancelled, and why.',
            'Cancel with a reason, or reschedule to another slot with the same doctor.',
            'Forgot your password? A one-use link by email, which signs you straight back in.',
        ],
    },
    {
        icon: LuBuilding2,
        name: 'Clinic admin',
        where: '/{clinic}/dashboard',
        features: [
            'Dashboard: booked and cancelled today, who is on duty now, doctors with no hours, today’s schedule with a “now” line, and the week ahead.',
            'Appointments by upcoming, past or cancelled, filtered by doctor and patient, grouped by clinic-local day. Cancel or reschedule any of them.',
            'Book for a patient by phone or walk-in. Search returning patients, or add a new one, who is emailed their visit and an invite to claim their account.',
            'Weekly working hours per doctor, edited shift by shift.',
            'Add, deactivate and restore doctors and other admins. New members are emailed an invite, which can be reissued. A doctor who already works at another clinic is linked with their existing account.',
        ],
    },
    {
        icon: LuStethoscope,
        name: 'Doctor',
        where: '/doctor',
        features: [
            'Work at several clinics from one account: a card per clinic, and every upcoming visit across them in one list for the next 30 days, with cancel and reschedule.',
            'Their own weekly hours, a tab per clinic, with their shifts elsewhere shown alongside. Hours that would overlap another clinic, even in another time zone, are refused.',
            'A warning for any clinic with no hours yet, since patients can’t book them there.',
            'Accepting an invite sets a password and goes straight to setting up hours.',
        ],
    },
    {
        icon: LuShieldCheck,
        name: 'Platform admin',
        where: '/admin',
        features: [
            'Create clinics with a name and timezone.',
            'Add each clinic’s first admin and doctors, and deactivate or restore them. The last active admin can’t be removed.',
        ],
    },
]

const CLIENT_DETAILS = [
    [
        'Live updates',
        'Reads the event stream with fetch so it can send the token. Reconnects with backoff, treats 45 seconds of silence as a dead connection, and reloads its data on every reconnect. Changes made by someone else get a toast and a “fresh” highlight; your own don’t.',
    ],
    [
        'Safe retries',
        'Each booking attempt sends an Idempotency-Key, reused if the request is retried, so a double click or a dropped response can’t book twice.',
    ],
    [
        'Clinic local time',
        'Every time is shown in the clinic’s timezone, whatever timezone the viewer is in.',
    ],
    [
        'Route guards',
        'Each role only reaches its own pages; anyone else is sent to their own home. Clinic admins can only open their own clinic’s dashboard.',
    ],
    [
        'Installable',
        'A progressive web app. The installed app opens straight to sign-in, and API responses are never cached.',
    ],
]

function RoleCard({ role }: { role: Role }) {
    const Icon = role.icon
    return (
        <article className="flex flex-col rounded-lg border border-border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary text-secondary">
                    <Icon size={20} />
                </span>
                <div>
                    <h3 className="m-0 text-[1.1rem] text-primary">{role.name}</h3>
                    <span className="font-mono text-[0.72rem] text-copy-lighter">{role.where}</span>
                </div>
            </div>
            <ul className="m-0 grid list-none gap-2.5 p-0">
                {role.features.map((f, i) => (
                    <li
                        key={i}
                        className="relative pl-5 text-[0.88rem] leading-[1.55] text-copy-light before:absolute before:top-[0.1rem] before:left-0 before:text-[0.75rem] before:text-secondary-dark before:content-['✚']"
                    >
                        {f}
                    </li>
                ))}
            </ul>
        </article>
    )
}

export function Roles() {
    return (
        <DocSection
            id="client"
            eyebrow="Web client"
            title="What each role can do"
            lede="The API stands on its own, but every feature can also be used from this client. Sign up as a patient, or register a clinic to get the admin view."
        >
            <div className="grid gap-4 min-[860px]:grid-cols-2">
                {ROLES.map((r) => (
                    <RoleCard key={r.name} role={r} />
                ))}
            </div>

            <div>
                <SubHeading>Across the client</SubHeading>
                <Table
                    caption="Client-wide behaviour"
                    head={['Feature', 'How it works']}
                    cols={['w-[11rem] font-semibold text-copy']}
                    rows={CLIENT_DETAILS}
                />
            </div>

            <div>
                <SubHeading>Not built yet</SubHeading>
                <Prose>
                    Two-factor sign-in. There is a screen for entering a code at <Code>/auth/verify</Code>, but nothing
                    links to it yet and the API has no endpoints for it.
                </Prose>
            </div>
        </DocSection>
    )
}

export default Roles
