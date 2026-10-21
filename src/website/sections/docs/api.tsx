import { cn } from '../../../lib/cn.ts'
import { Code, DocSection, Prose, SubHeading, Table } from '../../components/docs.tsx'
import { swaggerUrl } from '../../../lib/docsLinks.ts'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH'

const METHOD_TONE: Record<Method, string> = {
    GET: 'bg-[rgba(46,207,106,0.15)] text-[#086e30]',
    POST: 'bg-accent-bg text-primary',
    PUT: 'bg-[rgba(245,197,66,0.3)] text-[#5c4706]',
    PATCH: 'bg-[rgba(245,197,66,0.3)] text-[#5c4706]',
}

interface Endpoint {
    method: Method
    path: string
    who: string
    does: string
}

const GROUPS: { title: string; endpoints: Endpoint[] }[] = [
    {
        title: 'Appointments',
        endpoints: [
            { method: 'POST', path: '/appointments', who: 'Patient', does: 'Book a slot for yourself. Optional Idempotency-Key header makes retries safe. For a doctor at several clinics, the clinic comes from their hours, or an optional facility_id.' },
            { method: 'GET', path: '/appointments/me', who: 'Patient', does: 'Your appointments, latest first, filterable by status.' },
            { method: 'GET', path: '/appointments/{id}', who: 'Patient, doctor, clinic admin', does: 'One appointment, if it is yours, with you, or at your clinic.' },
            { method: 'PATCH', path: '/appointments/{id}/cancel', who: 'Patient, doctor, clinic admin', does: 'Cancel with a reason. The slot is bookable again.' },
            { method: 'PATCH', path: '/appointments/{id}/reschedule', who: 'Patient, doctor, clinic admin', does: 'Move to another slot with the same doctor, in one transaction.' },
            { method: 'GET', path: '/patients/{id}/appointments', who: 'Patient, doctor, clinic admin', does: "A patient's upcoming appointments, soonest first." },
            { method: 'POST', path: '/facilities/{id}/appointments', who: 'Clinic admin', does: 'Book for a patient (phone or walk-in). A new patient gets an account and is emailed the visit with an invite.' },
            { method: 'GET', path: '/facilities/{id}/appointments', who: 'Clinic admin, doctor', does: "The clinic's appointments by date range, doctor and status. Doctors see only their own." },
        ],
    },
    {
        title: 'Doctors and availability',
        endpoints: [
            { method: 'GET', path: '/facilities/{id}/doctors', who: 'Anyone', does: "The clinic's active doctors." },
            { method: 'GET', path: '/doctors/{id}', who: 'Anyone', does: 'A bookable doctor, every clinic they work at, and their weekly hours at each.' },
            { method: 'GET', path: '/doctors/{id}/availability?date=', who: 'Anyone', does: "Free 30-minute slots on a date, in the clinic's time. For a doctor at several clinics, each slot names its clinic; ?facility_id= picks one." },
            { method: 'GET', path: '/facilities/{id}/availability', who: 'Anyone', does: "Every bookable doctor's free slots over several days." },
            { method: 'GET', path: '/facilities/{id}/working-hours', who: 'Clinic admin, doctor', does: "Every doctor's weekly hours at the clinic." },
            { method: 'PUT', path: '/facilities/{id}/doctors/{doctor_id}/working-hours', who: 'Clinic admin, doctor', does: "Replace a doctor's week at this clinic. Doctors can only set their own. 409 if it overlaps their hours at another clinic." },
        ],
    },
    {
        title: 'Clinics, staff and patients',
        endpoints: [
            { method: 'GET', path: '/facilities', who: 'Anyone', does: 'Active clinics, each with its earliest free slot in the next 14 days.' },
            { method: 'POST', path: '/facilities', who: 'Platform admin', does: 'Create a clinic.' },
            { method: 'GET', path: '/facilities/{id}', who: 'Anyone', does: 'One clinic.' },
            { method: 'GET', path: '/facilities/{id}/members', who: 'Clinic admin', does: 'Admins and doctors, including deactivated ones.' },
            { method: 'POST', path: '/facilities/{id}/members', who: 'Clinic admin', does: 'Add an admin or doctor (or restore a removed one) and email them an invite. A doctor from another clinic is linked with their existing account.' },
            { method: 'POST', path: '/facilities/{id}/members/{member_id}/deactivate', who: 'Clinic admin', does: 'Remove someone from this clinic. A doctor keeps their other clinics; history is kept.' },
            { method: 'POST', path: '/facilities/{id}/members/{member_id}/invite', who: 'Clinic admin', does: "Reissue and re-email an invite that wasn't used." },
            { method: 'GET', path: '/facilities/{id}/patients', who: 'Clinic admin', does: 'Patients who have booked here, searchable by name or email.' },
            { method: 'POST', path: '/facilities/{id}/patients/{patient_id}/invite', who: 'Clinic admin', does: 'New emailed invite for a patient who has never signed in.' },
        ],
    },
    {
        title: 'Accounts and live updates',
        endpoints: [
            { method: 'POST', path: '/auth/register', who: 'Anyone', does: 'Sign up as a patient, or as a clinic admin together with a new clinic.' },
            { method: 'POST', path: '/auth/login', who: 'Anyone', does: 'Email and password. Rate limited per IP and per account.' },
            { method: 'POST', path: '/auth/google', who: 'Anyone', does: 'Sign in or up with a Google ID token.' },
            { method: 'POST', path: '/auth/accept-invite', who: 'Invited user', does: 'Set a password from an invite and sign in.' },
            { method: 'POST', path: '/auth/forgot-password', who: 'Anyone', does: 'Email a reset link. Always 202 with the same reply, so it reveals nothing.' },
            { method: 'POST', path: '/auth/reset-password', who: 'Link holder', does: 'Set a new password from a reset link and sign in. Each link works once.' },
            { method: 'GET', path: '/auth/me', who: 'Signed in', does: 'The caller, with their clinic if they are staff.' },
            { method: 'GET', path: '/events', who: 'Patient, doctor, clinic admin', does: 'Server-Sent Events stream of appointment changes.' },
        ],
    },
]

const STATUS_CODES = [
    ['400', 'Off the half-hour grid, outside working hours, in the past, or under an hour away; or an invite or reset link that is invalid, expired or used'],
    ['401', 'Missing, invalid or expired token'],
    ['403', 'Signed in, but your role is not allowed to do this'],
    ['404', "Doesn't exist, or isn't yours (so its existence isn't revealed)"],
    ['409', "Slot taken, patient already booked then, appointment already cancelled or started, or hours that overlap the doctor's at another clinic"],
    ['422', 'Request body or query fails validation, e.g. a time without a UTC offset'],
    ['429', 'Rate limited. Retry-After says when to try again'],
]

function MethodTag({ method }: { method: Method }) {
    return (
        <span className={cn('inline-block min-w-[3.6rem] rounded-[5px] px-1.5 py-0.5 text-center font-mono text-[0.66rem] font-bold', METHOD_TONE[method])}>
            {method}
        </span>
    )
}

export function ApiReference() {
    const swagger = swaggerUrl()

    return (
        <DocSection
            id="api"
            eyebrow="API"
            title="API reference"
            lede={
                <>
                    Every route is under <Code>/api/v1</Code>, so a breaking change can ship as <Code>/api/v2</Code>{' '}
                    alongside it. Errors always have the form <Code>{'{"detail": "..."}'}</Code>.
                </>
            }
        >
            {swagger && (
                <Prose>
                    The interactive version, generated from the code, is at{' '}
                    <a href={swagger} target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-2">
                        {swagger}
                    </a>
                    .
                </Prose>
            )}

            {GROUPS.map((g) => (
                <div key={g.title}>
                    <SubHeading>{g.title}</SubHeading>
                    <Table
                        caption={g.title}
                        head={['Endpoint', 'Who', 'What it does']}
                        cols={['w-[42%]', 'w-[20%]', undefined]}
                        rows={g.endpoints.map((e) => [
                            <span className="flex flex-wrap items-center gap-2">
                                <MethodTag method={e.method} />
                                <span className="font-mono text-[0.8rem] break-all text-copy">{e.path}</span>
                            </span>,
                            e.who,
                            e.does,
                        ])}
                    />
                </div>
            ))}

            <div>
                <SubHeading>Status codes</SubHeading>
                <Table
                    caption="Status codes"
                    head={['Code', 'When']}
                    cols={['w-[6rem]']}
                    rows={STATUS_CODES.map(([code, when]) => [<strong className="font-mono text-copy">{code}</strong>, when])}
                />
            </div>
        </DocSection>
    )
}

export default ApiReference
