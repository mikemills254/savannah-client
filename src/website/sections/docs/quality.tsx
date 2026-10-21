import { Card, Code, DocSection, Prose, SubHeading, Table } from '../../components/docs.tsx'

const TESTS = [
    ['Slot arithmetic, daylight saving, the 1-hour rule', 'test_availability_unit.py, test_facility_availability.py'],
    ['Booking rules and idempotency', 'test_booking.py'],
    ['Cancel and reschedule rules', 'test_cancel_reschedule.py'],
    ['Two bookings racing for one slot', 'test_concurrency.py'],
    ['HTTP status codes, bodies and permissions', 'test_api.py, test_auth.py'],
    ['Invites, password resets and every email template', 'test_emails.py'],
    ['Doctors at several clinics, across time zones', 'test_multi_clinic.py'],
    ['Live events, logging, rate limits, config', 'test_events.py, test_logging.py, test_rate_limit.py, test_config.py'],
]

const CI_JOBS = [
    ['Lint', 'ruff check and ruff format --check'],
    ['Tests', 'The full suite against Postgres 17 and Redis 7 containers, with a coverage floor'],
    ['Migrations', 'One Alembic head; upgrade from empty; models match migrations; downgrade to base and back up'],
    ['Docker image', 'The production image builds'],
    ['Audit', 'pip-audit on the dependencies'],
]

export function Quality() {
    return (
        <DocSection
            id="quality"
            eyebrow="Security, testing & delivery"
            title="How it's kept safe and correct"
            lede="Security, the test suite, and the pipeline every change goes through before it reaches production."
        >
            <div>
                <SubHeading>Security and privacy</SubHeading>
                <div className="grid gap-4 min-[720px]:grid-cols-2">
                    <Card title="Accounts">
                        Passwords are hashed with Argon2. Sign-in issues a JWT bearer token that lasts 60 minutes. Invite
                        and reset links carry their own token types, so neither can be used as a login token. Google
                        sign-in is supported.
                    </Card>
                    <Card title="Who can see what">
                        Four roles: patient, doctor, clinic admin and platform admin. Every route checks the role and the
                        object. Someone else's appointment returns 404, not 403, so its existence isn't revealed.
                    </Card>
                    <Card title="You can't book as someone else">
                        The patient on a booking is always the signed-in user. The API never accepts a{' '}
                        <Code>patient_id</Code> for self-booking.
                    </Card>
                    <Card title="Rate limits">
                        300 requests a minute per user, with much tighter limits on login, sign-up and invite
                        acceptance. Repeat offenders are blocked for longer each time, up to 30 minutes. IPs and emails
                        are stored only as hashes.
                    </Card>
                </div>
            </div>

            <div>
                <SubHeading>202 automated tests, against real PostgreSQL</SubHeading>
                <Prose className="mb-4">
                    Not SQLite: the partial unique indexes and the concurrency tests only mean something on the real
                    database. The tests create and migrate their own database and use a separate Redis database.
                </Prose>
                <Table
                    caption="Test suite"
                    head={['What', 'Where']}
                    cols={['w-[45%]']}
                    rows={TESTS.map(([what, where]) => [
                        what,
                        <span className="font-mono text-[0.8rem] text-copy">{where}</span>,
                    ])}
                />
            </div>

            <div>
                <SubHeading>CI/CD</SubHeading>
                <Prose className="mb-4">
                    GitHub Actions runs five checks in parallel on every pull request. Merging into <Code>master</Code>{' '}
                    runs them again and then deploys. The new container applies migrations on start, traffic switches
                    over only once <Code>/health</Code> passes, and the pipeline waits until <Code>/health</Code>{' '}
                    reports the new commit, so a failed deploy fails the build.
                </Prose>
                <Table
                    caption="Checks on every pull request"
                    head={['Check', 'What it does']}
                    cols={['w-[9rem]']}
                    rows={CI_JOBS.map(([job, what]) => [<strong className="text-copy">{job}</strong>, what])}
                />
            </div>

            <div>
                <SubHeading>Operations</SubHeading>
                <div className="grid gap-4 min-[720px]:grid-cols-3">
                    <Card title="Structured logs">
                        JSON logs with a request id on every line, returned to the client as <Code>X-Request-ID</Code>.
                        Logs record ids, never names, emails, passwords or tokens.
                    </Card>
                    <Card title="Health check">
                        <Code>/health</Code> checks the database and Redis, returns 503 if either is down, and reports
                        the deployed commit.
                    </Card>
                    <Card title="Degrades gracefully">
                        If Redis fails, bookings still go through. Rate limits let requests in and the live update is
                        skipped, while PostgreSQL stays the source of truth.
                    </Card>
                </div>
            </div>
        </DocSection>
    )
}

export default Quality
