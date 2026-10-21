import type { ReactNode } from 'react'
import { LuChevronDown } from 'react-icons/lu'
import { CodePanel, CodeTabs, type CodeTab } from '../../components/code.tsx'
import { Card, Code, DocSection, Prose, SubHeading } from '../../components/docs.tsx'
import { TEST_FILES, TEST_TOTAL, type SuiteFile } from './testSuite.ts'

// Figures from the last full run: pytest --cov
const COVERAGE = '89%'
const RUN_TIME = '~30s'

const RUN = `# needs Postgres and Redis: task docker:dev
pytest                            # all ${TEST_TOTAL} tests
pytest --cov                      # with coverage
pytest tests/test_concurrency.py  # one file
pytest -k "overlap or timezone"   # by test name
pytest -x -q                      # stop at a failure`

// What each file proves, in the order a reader cares about
const AREAS: { title: string; files: Record<string, ReactNode> }[] = [
    {
        title: 'Booking correctness',
        files: {
            'test_concurrency.py': (
                <>
                    Two bookings for one slot released at the same instant on separate database connections: exactly one
                    wins. A booking double-submitted with one <Code>Idempotency-Key</Code> is stored once.
                </>
            ),
            'test_booking.py': (
                <>
                    Every booking rule: the half-hour grid, working hours, the past, the one-hour notice, a taken slot,
                    a patient's own clash, a cancelled slot freed, deactivated doctors and clinics. Idempotency keys are
                    per user, can't be reused for a different booking, and a failed attempt doesn't use one up.
                </>
            ),
            'test_cancel_reschedule.py': (
                <>
                    Who cancelled and why is recorded. Started or cancelled visits can't be changed. A new time is
                    validated like a booking and the old slot is freed. Only the patient, their doctor and their
                    clinic's admins can act, and anyone else gets a 404.
                </>
            ),
        },
    },
    {
        title: 'Availability, time zones and clinics',
        files: {
            'test_availability_unit.py': (
                <>
                    Slot arithmetic with no database: 30-minute steps, periods that don't divide evenly, the times a
                    spring-forward clock change skips, and a slot exactly an hour away versus one minute sooner.
                </>
            ),
            'test_facility_availability.py': (
                <>
                    The clinic's 14-day view matches the per-doctor endpoint for every doctor and date, finds the next
                    free slot, rejects bad ranges, and runs a fixed number of queries however many doctors, bookings or
                    clinics there are.
                </>
            ),
            'test_multi_clinic.py': (
                <>
                    One doctor at two clinics: the clinic is worked out from the hours, one booking blocks the same time
                    everywhere, overlapping hours are refused even across time zones, and each clinic sees only its own
                    hours and appointments.
                </>
            ),
        },
    },
    {
        title: 'API and accounts',
        files: {
            'test_api.py': (
                <>
                    The HTTP contract for booking, availability, cancel, reschedule and a patient's appointments:
                    201, 400, 401, 404, 409 and 422 with the bodies a client relies on.
                </>
            ),
            'test_auth.py': (
                <>
                    Sign-up, sign-in and <Code>/auth/me</Code> return the right clinics for each role, loaded with the
                    user in one query.
                </>
            ),
            'test_emails.py': (
                <>
                    Invite and reset emails are sent with links that work. A reset link works once and expires, and an
                    unknown address gets the same reply as a real one. A failed send is logged without the address.
                </>
            ),
        },
    },
    {
        title: 'Platform',
        files: {
            'test_rate_limit.py': (
                <>
                    The sliding window, blocks that get longer up to 30 minutes, concurrent requests that can't slip
                    past the limit, and login and invite guessing. Redis never holds an email or an IP address.
                </>
            ),
            'test_events.py': (
                <>
                    Live updates reach the patient, doctor and clinic involved and nobody else. Nothing is published
                    when nothing changed, and a booking still succeeds with Redis down.
                </>
            ),
            'test_logging.py': (
                <>
                    A request id on every response and log line, one access line per request, no emails in the logs,
                    and unhandled errors returned as a 500 that carries the id.
                </>
            ),
            'test_config.py': (
                <>Settings read from the environment: database URLs from hosting providers, CORS origins, the commit.</>
            ),
        },
    },
]

const SAMPLES: CodeTab[] = [
    {
        label: 'Overlap across time zones',
        file: 'tests/test_multi_clinic.py',
        lang: 'python',
        why: (
            <>
                Hours are compared as real instants, not wall-clock times. A doctor works 09:00–12:00 in Nairobi (UTC+3),
                so 07:00 in Lagos (UTC+1) clashes, while 06:00–07:00 ends exactly as the Nairobi shift starts.
            </>
        ),
        code: `def test_overlaps_are_checked_across_timezones(self, client, make):
    nairobi = make.facility(name="Nairobi", timezone="Africa/Nairobi")  # UTC+3
    lagos = make.facility(name="Lagos", timezone="Africa/Lagos")  # UTC+1
    doctor = make.doctor(nairobi, hours=(time(9), time(12)))
    make.link(doctor, lagos, hours=None)
    admin = make.admin(lagos)

    # 07:00-09:00 in Lagos is 09:00-11:00 in Nairobi.
    clash = self.put(
        client,
        admin,
        lagos,
        doctor,
        [{"weekday": 0, "start_time": "07:00", "end_time": "09:00"}],
    )
    # 06:00-07:00 in Lagos is 08:00-09:00 in Nairobi: just before.
    fine = self.put(
        client,
        admin,
        lagos,
        doctor,
        [{"weekday": 0, "start_time": "06:00", "end_time": "07:00"}],
    )

    assert clash.status_code == 409
    assert fine.status_code == 200, fine.text`,
    },
    {
        label: 'One-use reset link',
        file: 'tests/test_emails.py',
        lang: 'python',
        why: (
            <>
                The link is taken from the email that was actually rendered, through the <Code>outbox</Code> fixture, so
                the test follows the same path a user does. Using a link changes the password, which makes every earlier
                link stop working.
            </>
        ),
        code: `def test_a_link_works_once(self, client, make, outbox):
    patient = make.patient(hashed_password=HASHED)
    forgot(client, patient.email)
    _, token = link_in(outbox[0])

    assert reset(client, token).status_code == 200
    second = reset(client, token, "yet-another-password")

    assert second.status_code == 400
    assert "already used" in second.json()["detail"]

def test_using_a_newer_link_cancels_an_older_one(self, client, make, outbox):
    patient = make.patient(hashed_password=HASHED)
    forgot(client, patient.email)
    forgot(client, patient.email)
    (_, older), (_, newer) = link_in(outbox[0]), link_in(outbox[1])

    assert reset(client, newer).status_code == 200
    assert reset(client, older).status_code == 400`,
    },
]

const BY_FILE = new Map(TEST_FILES.map((f) => [f.file, f]))

function FileTests({ file, proves }: { file: SuiteFile; proves: ReactNode }) {
    return (
        <details className="group rounded-md border border-border bg-white shadow-sm open:shadow-md">
            <summary className="flex cursor-pointer list-none items-start gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono text-[0.86rem] font-semibold break-all text-primary">{file.file}</span>
                        <span className="rounded-full bg-accent-bg px-2 py-0.5 font-mono text-[0.66rem] font-bold text-primary">
                            {file.count} {file.count === 1 ? 'test' : 'tests'}
                        </span>
                    </div>
                    <p className="m-0 mt-1.5 text-[0.88rem] leading-[1.6] text-copy-light">{proves}</p>
                </div>
                <LuChevronDown
                    size={18}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-copy-lighter transition-transform group-open:rotate-180"
                />
            </summary>
            <div className="grid gap-4 border-0 border-t border-border bg-foreground p-4 sm:p-5">
                {file.groups.map((g) => (
                    <div key={g.name || 'module'}>
                        {g.name && (
                            <p className="m-0 mb-1.5 font-mono text-[0.74rem] font-semibold text-primary-light">
                                {g.name}
                            </p>
                        )}
                        <ul className="m-0 grid list-none gap-1 p-0">
                            {g.tests.map((t) => (
                                <li
                                    key={t.name}
                                    className="flex items-baseline gap-2 font-mono text-[0.76rem] leading-[1.55] break-all text-copy before:shrink-0 before:text-secondary-dark before:content-['✓']"
                                >
                                    <span>
                                        {t.name}
                                        {t.cases && (
                                            <span className="ml-2 text-copy-lighter" title={`${t.cases} parametrised cases`}>
                                                ×{t.cases}
                                            </span>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </details>
    )
}

export function Tests() {
    const stats = [
        { value: String(TEST_TOTAL), label: 'Tests, all passing' },
        { value: String(TEST_FILES.length), label: 'Test files' },
        { value: COVERAGE, label: 'Coverage, branches included' },
        { value: RUN_TIME, label: 'For the full run' },
    ]

    return (
        <DocSection
            id="tests"
            eyebrow="Tests"
            title={`${TEST_TOTAL} tests, against real PostgreSQL`}
            lede="Each rule in the brief has tests that try to break it. The suite runs on PostgreSQL and Redis, not SQLite or mocks, because the double-booking guarantee lives in PostgreSQL's indexes and would mean nothing anywhere else. CI runs all of it on every pull request."
        >
            <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border min-[860px]:grid-cols-4">
                {stats.map((s) => (
                    <div key={s.label} className="bg-white px-5 py-4">
                        <dt className="sr-only">{s.label}</dt>
                        <dd className="m-0 font-mono text-[1.6rem] leading-none font-bold tracking-[-0.02em] text-primary">
                            {s.value}
                        </dd>
                        <dd className="m-0 mt-2 text-[0.8rem] leading-[1.4] text-copy-light" aria-hidden="true">
                            {s.label}
                        </dd>
                    </div>
                ))}
            </dl>

            <div>
                <SubHeading>Running them</SubHeading>
                <div className="grid grid-cols-[minmax(0,1fr)] gap-5 min-[960px]:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    <CodePanel code={RUN} lang="bash" title="assessment-server/" />
                    <Prose>
                        Run from the server folder with Postgres and Redis up; there's nothing else to set up. The tests
                        create a database named after <Code>DATABASE_URL</Code>'s with <Code>_test</Code> on the end,
                        migrate it with Alembic, and use Redis database 15. They refuse to run against a database whose
                        name doesn't end in <Code>_test</Code>, because the concurrency tests empty every table.
                    </Prose>
                </div>
            </div>

            <div>
                <SubHeading>How the suite is built</SubHeading>
                <div className="grid gap-4 min-[720px]:grid-cols-2 min-[1100px]:grid-cols-3">
                    <Card title="The real schema">
                        The test database is built by the same Alembic migrations as production, so the partial unique
                        indexes and composite foreign keys being tested are the ones that ship.
                    </Card>
                    <Card title="Every test starts clean">
                        Each test runs inside a transaction that is rolled back afterwards; its own commits are savepoints.
                        The concurrency tests need real commits, so they truncate instead.
                    </Card>
                    <Card title="Emails rendered, never sent">
                        An <Code>outbox</Code> fixture catches every email and renders its real template, so a broken
                        template fails a test. Tests follow the link in the email, as a user would.
                    </Card>
                    <Card title="Dates that don't go stale">
                        Bookings are made a week ahead in the clinic's time zone, so tests pass on any day. Clock changes
                        are tested on London's fixed dates, and the clock is frozen to check "today" in a UTC+14 zone,
                        whose date runs ahead of UTC's.
                    </Card>
                    <Card title="Query counts checked">
                        A <Code>count_queries</Code> fixture records the SQL a request runs, and asserts the count stays
                        the same as doctors, bookings and clinics are added.
                    </Card>
                    <Card title="Redis failures tested">
                        Redis is made to fail on purpose to check that bookings still go through, rate limits let requests
                        in, and the live update is skipped.
                    </Card>
                </div>
            </div>

            <div>
                <SubHeading>Two of them, in full</SubHeading>
                <Prose className="mb-4">
                    The concurrency test is in the <a href="#code">code tour</a>. These two show the style of the rest:
                    a factory for the rows a test needs, a real HTTP request, and assertions on the response.
                </Prose>
                <CodeTabs tabs={SAMPLES} />
            </div>

            <div>
                <SubHeading>Every test, by file</SubHeading>
                <Prose className="mb-5">
                    Open a file to see the name of each test in it. Test names are written as sentences, so this list
                    reads as the system's rules. Every test listed here passed on the last run.
                </Prose>
                <div className="grid gap-8">
                    {AREAS.map((area) => (
                        <div key={area.title}>
                            <p className="m-0 mb-3 font-mono text-[0.7rem] font-semibold tracking-[0.12em] text-primary-light uppercase">
                                {area.title} ·{' '}
                                {Object.keys(area.files).reduce((n, f) => n + (BY_FILE.get(f)?.count ?? 0), 0)} tests
                            </p>
                            <div className="grid gap-3">
                                {Object.entries(area.files).map(([name, proves]) => {
                                    const file = BY_FILE.get(name)
                                    return file && <FileTests key={name} file={file} proves={proves} />
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DocSection>
    )
}

export default Tests
