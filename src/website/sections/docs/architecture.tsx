import type { ReactNode } from 'react'
import { LuArrowDown } from 'react-icons/lu'
import { cn } from '../../../lib/cn.ts'
import { CodePanel } from '../../components/code.tsx'
import { Card, Code, DocSection, Prose, Steps, SubHeading } from '../../components/docs.tsx'

// --- System diagram ---

function Box({ title, detail, tone = 'light' }: { title: string; detail: ReactNode; tone?: 'light' | 'dark' | 'lime' }) {
    return (
        <div
            className={cn(
                'rounded-md border px-4 py-3.5',
                tone === 'light' && 'border-border bg-white',
                tone === 'dark' && 'border-primary bg-primary text-white',
                tone === 'lime' && 'border-secondary-dark bg-secondary text-secondary-content',
            )}
        >
            <strong className={cn('block text-[0.95rem]', tone === 'light' && 'text-primary')}>{title}</strong>
            <span
                className={cn(
                    'mt-0.5 block text-[0.8rem] leading-[1.5]',
                    tone === 'light' && 'text-copy-light',
                    tone === 'dark' && 'text-white/72',
                    tone === 'lime' && 'text-[rgba(28,36,6,0.75)]',
                )}
            >
                {detail}
            </span>
        </div>
    )
}

function Down({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 py-1.5 pl-4 font-mono text-[0.66rem] tracking-[0.1em] text-copy-lighter uppercase">
            <LuArrowDown size={14} className="text-primary-light" />
            {label}
        </div>
    )
}

function Diagram() {
    return (
        <figure className="m-0 rounded-lg border border-border bg-foreground p-4 sm:p-6" aria-label="System diagram">
            <div className="grid gap-5 min-[860px]:grid-cols-[1fr_15rem] min-[860px]:items-center">
                <div>
                    <Box title="Web client" detail="React, TypeScript, Tailwind. Patient, doctor, clinic admin and platform admin views." />
                    <Down label="HTTPS · JSON · bearer token" />
                    <div className="rounded-md border border-dashed border-primary-light/50 p-3">
                        <span className="mb-2 block font-mono text-[0.64rem] tracking-[0.12em] text-primary-light uppercase">
                            FastAPI · one deployable app
                        </span>
                        <div className="grid gap-2 sm:grid-cols-3">
                            <Box title="routes/" detail="Parse input, check the caller, call a service" />
                            <Box title="services/" detail="The rules: availability, booking, cancel, reschedule" tone="dark" />
                            <Box title="models/" detail="SQLAlchemy entities, migrated with Alembic" />
                        </div>
                    </div>
                    <Down label="One transaction per change" />
                    <Box
                        title="PostgreSQL"
                        detail="Source of truth for every booking. Its constraints have the final say on conflicts."
                        tone="dark"
                    />
                </div>

                <div className="grid gap-2">
                    <Box
                        title="Redis"
                        detail="Shared rate limits, and pub/sub for live updates. Never holds booking state."
                        tone="lime"
                    />
                    <p className="m-0 px-1 text-[0.78rem] leading-[1.5] text-copy-lighter">
                        If Redis is down, booking still works: rate limits let requests through and the live update is skipped.
                    </p>
                </div>
            </div>
        </figure>
    )
}

const BOOKING_INDEXES = `-- One active booking per doctor per slot
CREATE UNIQUE INDEX uq_active_doctor_slot
  ON appointments (doctor_id, starts_at)
  WHERE status = 'BOOKED';

-- A patient can't hold two bookings at the same time at one clinic
CREATE UNIQUE INDEX uq_active_patient_slot
  ON appointments (facility_id, patient_id, starts_at)
  WHERE status = 'BOOKED';`

export function Architecture() {
    return (
        <DocSection
            id="architecture"
            eyebrow="Architecture"
            title="A modular monolith, with the database as referee"
            lede="One FastAPI application with clear layers inside it. That keeps it simple to run, test and deploy at five doctors, and leaves room to split a part out later if it ever needs to scale on its own."
        >
            <Diagram />

            <div id="double-booking" className="scroll-mt-24">
                <SubHeading>Preventing double booking</SubHeading>
                <Prose>
                    Checking that a slot is free and then inserting isn't enough: two requests can both pass the check
                    before either one commits. So PostgreSQL enforces the rule itself. Because both indexes only cover{' '}
                    <Code>BOOKED</Code> rows, a cancelled slot is free again immediately.
                </Prose>
                <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 min-[960px]:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <CodePanel code={BOOKING_INDEXES} lang="sql" title="PostgreSQL · partial unique indexes" />
                    <Steps
                        items={[
                            'Validate the request: on the half-hour grid, inside working hours, at least an hour ahead.',
                            'Set the end time on the server; the client never sends it.',
                            'Insert inside a transaction.',
                            <>
                                If the index rejects it, roll back and return <strong>409</strong> naming the conflict.
                            </>,
                        ]}
                    />
                </div>
                <Prose className="mt-5">
                    <Code>test_concurrency.py</Code> releases two bookings for the same slot at the same instant, on
                    separate database connections, and asserts exactly one wins. A second test double-submits one booking
                    with the same <Code>Idempotency-Key</Code> and asserts it's stored once.
                </Prose>
            </div>

            <div>
                <SubHeading>Availability is computed, not stored</SubHeading>
                <Prose>
                    Slots aren't rows in a table, so there's nothing to generate ahead of time or keep in sync. For a
                    doctor and a date:
                </Prose>
                <div className="mt-4">
                    <Steps
                        items={[
                            "Load the doctor's working periods for that weekday.",
                            "Step through each period in 30-minute increments of the clinic's local time.",
                            'Remove slots that are already booked or less than an hour away.',
                        ]}
                    />
                </div>
                <Prose className="mt-4">
                    That's two queries: one for working hours, one for that day's bookings. Generating slots in local
                    wall-clock time and storing instants as <Code>TIMESTAMPTZ</Code> keeps it right across
                    daylight-saving changes, which is tested with London's clock change and UTC+14.
                </Prose>
            </div>

            <div id="multi-clinic" className="scroll-mt-24">
                <SubHeading>Doctors at several clinics</SubHeading>
                <Prose>
                    A doctor has one account and works at any number of clinics, with separate hours at each. A link table
                    of doctor and clinic sits between them, and appointments and working hours reference that link, so
                    the database itself refuses a booking or a shift at a clinic the doctor doesn't work at.
                </Prose>
                <div className="mt-4 grid gap-4 min-[860px]:grid-cols-3">
                    <Card title="One diary">
                        The one-booking-per-slot index is on <Code>(doctor_id, starts_at)</Code>, whatever the clinic, so
                        a doctor booked at one clinic is never free at another at the same time.
                    </Card>
                    <Card title="No overlapping hours">
                        Hours at one clinic that overlap another are refused, compared as real instants so clinics in
                        different time zones are handled. Only the doctor is told which clinic clashes.
                    </Card>
                    <Card title="Each clinic sees its own">
                        Admins see the doctor's hours, bookings and status at their clinic only. Removing them from one
                        clinic leaves the others untouched.
                    </Card>
                </div>
                <Prose className="mt-4">
                    The brief's <Code>POST /appointments</Code> body is unchanged: the clinic is the one whose hours the
                    slot falls in, or an optional <Code>facility_id</Code>.
                </Prose>
            </div>

            <div id="live-updates" className="scroll-mt-24">
                <SubHeading>Live updates</SubHeading>
                <Prose>
                    When a patient books, the doctor and the clinic's admins see it appear without refreshing, and
                    patients see changes the clinic makes for them.
                </Prose>
                <div className="mt-4 grid gap-4 min-[860px]:grid-cols-3">
                    <Card title="1 · Publish after commit">
                        Each booking, cancellation and reschedule is published to Redis on the patient's, the doctor's
                        and the clinic's channels, only once it has been saved.
                    </Card>
                    <Card title="2 · Stream to the browser">
                        <Code>GET /events</Code> is a Server-Sent Events stream subscribed to the viewer's channels, so it
                        works whichever API instance they're connected to.
                    </Card>
                    <Card title="3 · Never trust a missed event">
                        Delivery is best effort. Whenever the stream (re)connects, the client reloads its data, so a
                        dropped event can't leave a screen out of date.
                    </Card>
                </div>
            </div>

            <div>
                <SubHeading>Why there's no cache</SubHeading>
                <Prose>
                    The clinic's appointment list is read with an index on <Code>(facility_id, starts_at)</Code>.
                    Measured on a clinic seeded with 1,161 bookings over eight weeks, the full query with its joins
                    returns a 500-row page in about 7 ms. A cache would add invalidation on every booking, cancellation
                    and reschedule to save very little, and the live stream already keeps open screens current. If
                    measurements change, the plan is a per-clinic version key bumped where events are published.
                </Prose>
            </div>
        </DocSection>
    )
}

export default Architecture
