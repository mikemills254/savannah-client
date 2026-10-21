import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn.ts'
import { CodePanel } from '../../components/code.tsx'
import { DocSection, Prose } from '../../components/docs.tsx'

// Real requests against the API and the responses it gave, captured from a
// clinic seeded with eight weeks of bookings (ids shortened where long).

interface Exchange {
    title: string
    note: ReactNode
    request: string
    status: string
    response: string
    responseLang?: 'json' | 'http'
}

const EXCHANGES: Exchange[] = [
    {
        title: 'Sign up as a patient',
        note: 'Registering signs you in: the response carries a bearer token and the profile, so the client needs no second request.',
        request: `curl -X POST $API/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Amina Wanjiru",
       "email": "amina@example.com",
       "password": "a-long-password"}'`,
        status: '201 Created',
        response: `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "9918b292-8446-4fa7-b2ac-14fe232b7e1c",
    "email": "amina@example.com",
    "name": "Amina Wanjiru",
    "role": "PATIENT",
    "facility_id": null,
    "is_active": true,
    "facilities": []
  }
}`,
    },
    {
        title: "Check a doctor's free slots",
        note: "Public, and in the clinic's own time with its UTC offset. Slots already booked, or less than an hour away, are left out.",
        request: `curl "$API/doctors/$DOCTOR/availability?date=2026-11-02"`,
        status: '200 OK',
        response: `{
  "doctor_id": "bd7f67e6-af7e-4446-a197-8861c5c6510d",
  "date": "2026-11-02",
  "timezone": "Africa/Nairobi",
  "available_slots": [
    { "starts_at": "2026-11-02T09:30:00+03:00",
      "ends_at":   "2026-11-02T10:00:00+03:00" },
    { "starts_at": "2026-11-02T11:30:00+03:00",
      "ends_at":   "2026-11-02T12:00:00+03:00" },
    { "starts_at": "2026-11-02T12:00:00+03:00",
      "ends_at":   "2026-11-02T12:30:00+03:00" }
  ]
}`,
    },
    {
        title: 'Book it',
        note: (
            <>
                The patient is whoever the token belongs to; the body can't name anyone else. The server sets the end
                time. The <strong>Idempotency-Key</strong> makes it safe to retry.
            </>
        ),
        request: `curl -X POST $API/appointments \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Idempotency-Key: 6f1c2a9e-0b7d-4c1e-9a55-2d8f3b61c0aa" \\
  -H "Content-Type: application/json" \\
  -d '{"doctor_id": "'$DOCTOR'",
       "starts_at": "2026-11-02T09:30:00+03:00"}'`,
        status: '201 Created',
        response: `{
  "id": "74639621-c8bc-499f-b9f3-8c0ba680544e",
  "status": "BOOKED",
  "starts_at": "2026-11-02T09:30:00+03:00",
  "ends_at": "2026-11-02T10:00:00+03:00",
  "doctor":    { "id": "bd7f67e6-…", "name": "Michael Mills" },
  "patient":   { "id": "9918b292-…", "name": "Amina Wanjiru" },
  "booked_by": { "id": "9918b292-…", "name": "Amina Wanjiru" },
  "cancelled_at": null,
  "cancelled_by": null,
  "cancellation_reason": null,
  "facility": {
    "id": "8f5d9c3f-ebe0-49e4-87cb-f65b70f612da",
    "name": "St. Jude Health Clinic",
    "timezone": "Africa/Nairobi"
  }
}`,
    },
    {
        title: 'The response got lost, so retry',
        note: 'Same key, same request: the original booking comes back, marked as a replay. Nothing new is stored, so a flaky connection or a double click never books twice.',
        request: `# The exact same request, same Idempotency-Key
curl -i -X POST $API/appointments ...`,
        status: '201 Created',
        responseLang: 'http',
        response: `HTTP/1.1 201 Created
idempotent-replayed: true

{ "id": "74639621-c8bc-499f-b9f3-8c0ba680544e", "status": "BOOKED", ... }`,
    },
    {
        title: 'Someone else tries the same slot',
        note: 'The partial unique index rejects the insert and the API names the conflict. This is the same answer the loser of a true race gets.',
        request: `curl -X POST $API/appointments \\
  -H "Authorization: Bearer $OTHER_PATIENT" \\
  -H "Content-Type: application/json" \\
  -d '{"doctor_id": "'$DOCTOR'",
       "starts_at": "2026-11-02T09:30:00+03:00"}'`,
        status: '409 Conflict',
        response: `{
  "detail": "This slot has just been booked by someone else; choose another"
}`,
    },
    {
        title: 'Times that make no sense are refused',
        note: 'Off the half-hour grid is a 400 from the service. A time without a UTC offset is ambiguous, so the schema refuses it with a 422.',
        request: `# 10:15 is between slots
-d '{"starts_at": "2026-11-02T10:15:00+03:00", ...}'

# No offset: which 10:00?
-d '{"starts_at": "2026-11-02T10:00:00", ...}'`,
        status: '400 · 422',
        response: `{ "detail": "Appointments start on the hour or half hour in the facility's time" }

{ "detail": [{
    "type": "timezone_aware",
    "loc": ["body", "starts_at"],
    "msg": "Input should have timezone info"
}] }`,
    },
    {
        title: 'Cancel with a reason',
        note: 'Cancelling is a state change, not a delete: who, when and why are kept. The slot is bookable again the moment this commits.',
        request: `curl -X PATCH $API/appointments/$APPOINTMENT/cancel \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"reason": "Travelling that week"}'`,
        status: '200 OK',
        response: `{
  "id": "74639621-c8bc-499f-b9f3-8c0ba680544e",
  "status": "CANCELLED",
  "cancelled_at": "2026-10-21T11:53:49.954279Z",
  "cancelled_by": { "id": "9918b292-…", "name": "Amina Wanjiru" },
  "cancellation_reason": "Travelling that week",
  ...
}`,
    },
    {
        title: 'Cancel twice, or peek at someone else’s',
        note: 'A repeat cancel changes nothing and says so. Another patient asking for this appointment gets a 404, not a 403, so they can’t even learn it exists.',
        request: `curl -X PATCH $API/appointments/$APPOINTMENT/cancel ...

curl $API/appointments/$APPOINTMENT \\
  -H "Authorization: Bearer $OTHER_PATIENT"`,
        status: '409 · 404',
        response: `{ "detail": "This appointment is already cancelled" }

{ "detail": "Appointment not found" }`,
    },
]

function StatusPill({ status }: { status: string }) {
    const ok = status.startsWith('2')
    return (
        <span
            className={cn(
                'rounded-full px-2 py-0.5 font-mono text-[0.62rem] font-bold tracking-[0.06em]',
                ok ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-[#ff8a8a]',
            )}
        >
            {status}
        </span>
    )
}

export function Walkthrough() {
    return (
        <DocSection
            id="walkthrough"
            eyebrow="Try it"
            title="A booking, request by request"
            lede={
                <>
                    Real requests against the API and the responses it actually returned, booking a doctor at a clinic
                    with eight weeks of seeded appointments. <code className="font-mono text-[0.9em]">$API</code> is the
                    API's <code className="font-mono text-[0.9em]">/api/v1</code> URL.
                </>
            }
        >
            <ol className="m-0 grid list-none gap-10 p-0">
                {EXCHANGES.map((x, i) => (
                    <li key={x.title} className="grid grid-cols-[minmax(0,1fr)] gap-4">
                        <div className="flex gap-3.5">
                            <span className="mt-[0.15rem] inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-[0.75rem] font-bold text-white">
                                {i + 1}
                            </span>
                            <div>
                                <h3 className="m-0 text-[1.05rem] text-copy">{x.title}</h3>
                                <Prose className="mt-1 text-[0.9rem]">{x.note}</Prose>
                            </div>
                        </div>
                        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 min-[1180px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <CodePanel code={x.request} lang="bash" title="Request" />
                            <CodePanel
                                code={x.response}
                                lang={x.responseLang ?? 'json'}
                                title="Response"
                                aside={<StatusPill status={x.status} />}
                            />
                        </div>
                    </li>
                ))}
            </ol>
        </DocSection>
    )
}

export default Walkthrough
