import { DocSection, SubHeading, Table } from '../../components/docs.tsx'

const AMBIGUITIES = [
    ['One clinic or many?', "Many, each with its own timezone, and a doctor can work at several. The brief's single clinic is the simplest case, and a clinic id is cheap to add now but painful to retrofit."],
    ['Which clinic does a booking go to?', 'For a doctor at several, the one whose hours the slot falls in, so the brief’s POST /appointments body is unchanged. A facility_id can name it explicitly.'],
    ['What does removing a doctor do?', 'Removes them from that clinic only. They keep their other clinics, and can’t sign in only once removed from all of them.'],
    ['Who is the patient when booking?', 'Always the signed-in user, so nobody can book as someone else.'],
    ['Does cancelling need a reason?', 'Yes, 1–500 characters, stored with who cancelled. An appointment that has already started cannot be cancelled.'],
    ['Cancelling twice?', 'Returns 409 and changes nothing.'],
    ['Can a reschedule change the doctor?', 'No, that is a new booking. Moving to the time it already has succeeds and changes nothing, so retries are safe.'],
    ['Who does the 1-hour rule apply to?', 'Everyone, including clinic staff booking a walk-in, so what is shown as available and what can be booked always agree. Exactly one hour ahead is allowed.'],
    ['Does "upcoming" include an appointment in progress?', 'Yes, until it has ended.'],
    ['Which timezone do times use?', "Accepted with any UTC offset, stored as UTC instants, and returned in the clinic's local time with its offset."],
]

const TRADE_OFFS = [
    ['Modular monolith', 'Simple to run, test and deploy at five doctors', 'Scales as one unit until a part needs splitting out'],
    ['Partial unique indexes', 'Correct under concurrency without locks or queues', 'Assumes fixed, aligned 30-minute slots; variable lengths would need an exclusion constraint'],
    ['Slots computed on request', 'Nothing to pre-generate or keep in sync', 'A little computation per request'],
    ['One role per account, doctors linked to clinics', 'Simple permission checks, while a doctor keeps one account and one diary across clinics', 'A clinic admin still runs one clinic; someone who is both doctor and admin needs two accounts'],
    ['Idempotency keys on booking', 'A retried request after a dropped response cannot book twice', 'One extra row per booking'],
    ['Redis for rate limits and live events', 'Both must work across every API instance', 'One more service to run, though booking works without it'],
    ['JWT with no refresh tokens', 'Stateless, and enough for this scope', 'A stolen token stays valid until it expires (60 minutes)'],
    ['Reset links tied to the password hash', 'One-use links with no token table or migration', 'A single link can’t be revoked on its own; changing the password revokes them all'],
    ['Email after the response', 'A slow or failing mail server never delays or fails a booking', 'A failed email is only logged, so the token is also returned for staff to share by hand'],
]

export function Decisions() {
    return (
        <DocSection
            id="decisions"
            eyebrow="Decisions"
            title="Judgement calls and trade-offs"
            lede="Where the brief left room for interpretation, these are the choices made and why."
        >
            <Table
                caption="Decisions on ambiguous requirements"
                head={['Question', 'Decision']}
                cols={['w-[32%] font-semibold text-copy']}
                rows={AMBIGUITIES}
            />
            <div>
                <SubHeading>Trade-offs</SubHeading>
                <Table
                    caption="Trade-offs"
                    head={['Decision', 'Why', 'Cost']}
                    cols={['w-[26%] font-semibold text-copy', 'w-[37%]']}
                    rows={TRADE_OFFS}
                />
            </div>
        </DocSection>
    )
}

export default Decisions
