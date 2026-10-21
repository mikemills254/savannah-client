import type { ReactNode } from 'react'
import { Code, DocSection, Pill, Table } from '../../components/docs.tsx'

interface Requirement {
    need: string
    how: ReactNode
    proof: ReactNode
}

const FUNCTIONAL: Requirement[] = [
    {
        need: 'List active doctors',
        how: (
            <>
                <Code>GET /facilities/{'{id}'}/doctors</Code> and <Code>GET /doctors/{'{id}'}</Code>. Deactivated
                doctors drop out of lists and can't be booked; their history stays.
            </>
        ),
        proof: (
            <>
                <Code>test_api.py</Code>, <Code>test_booking.py</Code>
            </>
        ),
    },
    {
        need: "Maintain each doctor's recurring working hours",
        how: (
            <>
                Weekly periods in the clinic's local time, several per day allowed.{' '}
                <Code>PUT /facilities/{'{id}'}/doctors/{'{doctor_id}'}/working-hours</Code> replaces a doctor's week.
                Clinic admins and the doctor can both edit it.
            </>
        ),
        proof: <Code>test_api.py</Code>,
    },
    {
        need: "Show a doctor's free 30-minute slots for a date",
        how: (
            <>
                <Code>GET /doctors/{'{id}'}/availability?date=YYYY-MM-DD</Code>, computed on request from working hours
                minus active bookings. A clinic-wide version powers the booking page.
            </>
        ),
        proof: (
            <>
                <Code>test_availability_unit.py</Code>, <Code>test_facility_availability.py</Code>
            </>
        ),
    },
    {
        need: 'Authenticated patient books a slot',
        how: (
            <>
                <Code>POST /appointments</Code> with <Code>doctor_id</Code> and <Code>starts_at</Code>. The patient is
                the signed-in user, never a client-supplied id. The server sets the end time.
            </>
        ),
        proof: <Code>test_booking.py</Code>,
    },
    {
        need: 'No double booking, even under concurrent requests',
        how: 'Two partial unique indexes in PostgreSQL. The database rejects the loser of a race and the API returns 409.',
        proof: <Code>test_concurrency.py</Code>,
    },
    {
        need: 'Patients view and cancel their own appointments',
        how: (
            <>
                <Code>GET /appointments/me</Code> and <Code>PATCH /appointments/{'{id}'}/cancel</Code> with a reason.
                Someone else's appointment returns 404, so its existence isn't revealed.
            </>
        ),
        proof: <Code>test_cancel_reschedule.py</Code>,
    },
    {
        need: 'A cancelled slot becomes bookable again',
        how: 'Cancelling is a status change, and the unique indexes only cover BOOKED rows, so the slot frees immediately.',
        proof: <Code>test_cancel_reschedule.py</Code>,
    },
]

const EXTRAS: Requirement[] = [
    {
        need: 'Reschedule',
        how: (
            <>
                <Code>PATCH /appointments/{'{id}'}/reschedule</Code>. The new slot is checked like a booking and the old
                one is released in the same transaction, so a failed move leaves the original intact.
            </>
        ),
        proof: <Code>test_cancel_reschedule.py</Code>,
    },
    {
        need: "A patient's upcoming appointments",
        how: (
            <>
                <Code>GET /patients/{'{id}'}/appointments</Code>: booked and not yet ended, soonest first. Visible to
                the patient, their doctor, and their clinic's admins.
            </>
        ),
        proof: <Code>test_api.py</Code>,
    },
    {
        need: 'Doctors at several clinics',
        how: 'The brief’s “multiple clinic locations and doctor assignments”. A doctor keeps one account, separate hours at each clinic, and one diary: hours can’t overlap across clinics, even in different time zones, and a booking at one blocks the same time at the others.',
        proof: <Code>test_multi_clinic.py</Code>,
    },
    {
        need: 'No bookings less than an hour ahead',
        how: 'Refused with 400 when booking or rescheduling, and never offered as available, so the two always agree.',
        proof: (
            <>
                <Code>test_booking.py</Code>, <Code>test_availability_unit.py</Code>
            </>
        ),
    },
]

const NON_FUNCTIONAL: Requirement[] = [
    {
        need: 'Correctness under concurrency',
        how: 'Database-enforced uniqueness, plus idempotency keys so a retried or double-clicked booking is stored once.',
        proof: <Code>test_concurrency.py</Code>,
    },
    {
        need: 'Data integrity',
        how: 'Check constraints (valid periods, staff must belong to a clinic), a composite foreign key that keeps a doctor inside their clinic, and no cascading deletes of history.',
        proof: 'Alembic migrations, checked in CI',
    },
    {
        need: 'Security',
        how: 'Argon2 password hashing, JWT bearer tokens, role and object-level checks on every route, rate limits on sign-in, and one-use emailed links for invites and password resets.',
        proof: (
            <>
                <Code>test_auth.py</Code>, <Code>test_rate_limit.py</Code>, <Code>test_emails.py</Code>
            </>
        ),
    },
    {
        need: 'Rules testable without HTTP',
        how: 'Business rules live in services/, which the tests call directly. Routes only parse input, authorize and respond.',
        proof: '202 tests',
    },
    {
        need: 'Transactional state changes',
        how: 'Each booking, cancellation and reschedule is one transaction. Integrity errors roll back before the session is reused.',
        proof: <Code>test_booking.py</Code>,
    },
    {
        need: 'Observability',
        how: (
            <>
                Structured JSON logs with a request id on every line (returned as <Code>X-Request-ID</Code>), and a{' '}
                <Code>/health</Code> check of the database and Redis.
            </>
        ),
        proof: <Code>test_logging.py</Code>,
    },
]

function rows(items: Requirement[], status: ReactNode): ReactNode[][] {
    return items.map((r) => [<strong className="font-semibold text-copy">{r.need}</strong>, status, r.how, r.proof])
}

const HEAD = ['Requirement', 'Status', 'How it is met', 'Tested in']
const COLS = ['w-[22%]', 'w-[1%]', undefined, 'w-[20%]']

export function Coverage() {
    return (
        <DocSection
            id="requirements"
            eyebrow="Requirements"
            title="Every requirement in the brief, and where it's met"
            lede="The brief's functional and non-functional requirements, what implements each one, and the test file that checks it."
        >
            <Table caption="Functional requirements" head={HEAD} cols={COLS} rows={rows(FUNCTIONAL, <Pill tone="done">Done</Pill>)} />
            <div>
                <h3 className="m-0 mb-3 text-[1.1rem] text-copy">Extensions the brief named</h3>
                <Table caption="Extensions" head={HEAD} cols={COLS} rows={rows(EXTRAS, <Pill tone="done">Done</Pill>)} />
            </div>
            <div>
                <h3 className="m-0 mb-3 text-[1.1rem] text-copy">Non-functional requirements</h3>
                <Table caption="Non-functional requirements" head={HEAD} cols={COLS} rows={rows(NON_FUNCTIONAL, <Pill tone="done">Met</Pill>)} />
            </div>
        </DocSection>
    )
}

export default Coverage
