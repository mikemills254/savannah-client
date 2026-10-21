import { CodeTabs, type CodeTab } from '../../components/code.tsx'
import { Code, DocSection } from '../../components/docs.tsx'

// Excerpts of the real source, trimmed only where marked with "..."

const TABS: CodeTab[] = [
    {
        label: 'Double booking',
        file: 'app/services/appointments.py',
        lang: 'python',
        why: (
            <>
                The service validates first so common mistakes get clear errors, but the database decides. When either
                partial unique index rejects the insert, the violated constraint's name says which rule was broken, and
                that becomes a precise <strong>409</strong>.
            </>
        ),
        code: `def _flush_slot(self) -> None:
    """Flush a new or moved booking.

    The partial unique indexes are what stop concurrent requests double
    booking the doctor or the patient; the checks before them only give
    clearer errors for the common cases."""
    try:
        self.db.flush()
    except IntegrityError as exc:
        self.db.rollback()
        constraint = _violated_constraint(exc)
        logger.info(
            "Booking conflict",
            extra={"event": "appointment.conflict", "constraint": constraint},
        )
        if constraint == "uq_active_doctor_slot":
            raise SlotTakenError from None
        if constraint == "uq_active_patient_slot":
            raise PatientAlreadyBookedError from None
        raise


def _violated_constraint(exc: IntegrityError) -> str | None:
    diag = getattr(exc.orig, "diag", None)
    return getattr(diag, "constraint_name", None)`,
    },
    {
        label: 'Proving it',
        file: 'tests/test_concurrency.py',
        lang: 'python',
        why: (
            <>
                Two threads, two database connections, held at a barrier and released together, so both bookings really
                are in flight at once. Exactly one may win. This runs against PostgreSQL in CI on every pull request.
            </>
        ),
        code: `def race(sessions, *calls):
    """Run each call in its own thread and session, released together.
    Returns each call's result or the exception it raised, in order."""
    barrier = threading.Barrier(len(calls))
    results: list = [None] * len(calls)

    def run(i, call):
        with sessions() as db:
            barrier.wait()
            try:
                results[i] = call(db)
            except Exception as exc:
                # Returned for the test to check.
                results[i] = exc
    ...


def test_only_one_of_two_simultaneous_bookings_wins(sessions, at):
    ...
    results = race(sessions, book(alice), book(bob))

    errors = [r for r in results if isinstance(r, Exception)]
    assert len(errors) == 1, results
    assert isinstance(errors[0], SlotTakenError), results
    with sessions() as db:
        count = db.scalar(
            select(func.count()).where(Appointment.doctor_id == doctor.id)
        )
    assert count == 1`,
    },
    {
        label: 'Idempotency',
        file: 'app/services/appointments.py',
        lang: 'python',
        why: (
            <>
                The key is claimed in the same transaction as the booking. A concurrent duplicate waits on the key's
                unique index, then replays the first booking instead of making its own. Reusing a key for a different
                request is refused, because the request's hash is stored with it.
            </>
        ),
        code: `def _claim_key(self, actor, key, request):
    """Claim the Idempotency-Key, if one was sent. Returns the claimed key,
    or the appointment an earlier request with it created.

    Claimed first, in the same transaction as the booking: a concurrent
    request with the same key waits on the unique index here, then
    replays this booking instead of making its own. If booking fails,
    the claim rolls back with it and a retry starts afresh."""
    if key is None:
        return None, None

    request_hash = hashlib.sha256(request.encode()).hexdigest()
    key_row = IdempotencyKey(user_id=actor.id, key=key, request_hash=request_hash)
    self.db.add(key_row)
    try:
        self.db.flush()
        return key_row, None
    except IntegrityError as exc:
        self.db.rollback()
        if _violated_constraint(exc) != "uq_idempotency_user_key":
            raise

    existing = self.db.scalar(
        select(IdempotencyKey).where(
            IdempotencyKey.user_id == actor.id,
            IdempotencyKey.key == key,
        )
    )
    ...
    if existing.request_hash != request_hash:
        raise IdempotencyKeyReusedError
    return None, self._get_with_details(existing.appointment_id)`,
    },
    {
        label: 'Slots & time zones',
        file: 'app/services/availability.py',
        lang: 'python',
        why: (
            <>
                Slots are stepped in the clinic's wall-clock time, so 09:00–12:00 is always 09:00, 09:30 and so on
                whatever the UTC offset that day. A wall time that doesn't exist (a daylight-saving gap) is skipped, and
                the end time is added in UTC so a slot is always 30 real minutes.
            </>
        ),
        code: `def slot_end(start: datetime) -> datetime:
    """30 minutes of real time after start, in start's timezone. Added in UTC:
    adding to a local datetime is wall-clock arithmetic, wrong across DST."""
    return (start.astimezone(UTC) + SLOT_DURATION).astimezone(start.tzinfo)


def local_slot_starts(day, periods, tz) -> list[datetime]:
    """Every 30-minute slot start on \`day\` within the working periods, as
    datetimes in the facility's timezone, earliest first."""
    starts: list[datetime] = []
    for start, end in sorted(periods):
        # Stepped in wall-clock time: a 09:00-12:00 period is 09:00, 09:30, ...
        # whatever the UTC offset that day.
        current = datetime.combine(day, start)
        period_end = datetime.combine(day, end)
        while current + SLOT_DURATION <= period_end:
            local = current.replace(tzinfo=tz)
            # Skips a wall time that doesn't exist that day (a DST gap).
            if local.astimezone(UTC).astimezone(tz).replace(tzinfo=None) == current:
                starts.append(local)
            current += SLOT_DURATION
    return starts


def available_slot_starts(day, periods, tz, *, booked, now) -> list[datetime]:
    """Slot starts on \`day\` that are at least MIN_BOOKING_NOTICE away and not
    booked, i.e. the ones a booking would accept."""
    booked_utc = {b.astimezone(UTC) for b in booked}
    earliest = now + MIN_BOOKING_NOTICE
    return [
        start
        for start in local_slot_starts(day, periods, tz)
        if start >= earliest and start.astimezone(UTC) not in booked_utc
    ]`,
    },
    {
        label: 'Several clinics',
        file: 'app/services/doctors.py',
        lang: 'python',
        why: (
            <>
                A doctor's hours at one clinic mustn't overlap their hours at another, and the clinics may be in
                different time zones, so weekday numbers can't be compared. Both are turned into real instants over the
                coming week and compared as intervals. Only the doctor is told which clinic clashes: another clinic's
                admin needn't know where else they work.
            </>
        ),
        code: `def _check_no_clash(self, doctor, facility, periods, *, show_facility) -> None:
    """Refuse hours that overlap the doctor's hours at another facility
    where they're active, compared as real instants over the coming week,
    so facilities in different timezones are compared correctly. Only
    the doctor is told which facility: an admin of this one needn't know
    where else they work."""
    others = self.db.execute(...).all()
    if not others or not periods:
        return

    tz = ZoneInfo(facility.timezone)
    today = datetime.now(UTC).astimezone(tz).date()
    mine = shifts(
        [(p.weekday, p.start_time, p.end_time) for p in periods],
        tz,
        today,
        CLASH_CHECK_DAYS,
    )
    for name, timezone, weekday, start, end in others:
        # A day either side, so a shift that crosses midnight between the
        # two timezones is still compared.
        theirs = shifts(
            [(weekday, start, end)],
            ZoneInfo(timezone),
            today - timedelta(days=1),
            CLASH_CHECK_DAYS + 2,
        )
        for shift in mine:
            if any(shift.overlaps(other) for other in theirs):
                when = (
                    f"{WEEKDAYS[shift.weekday]} "
                    f"{shift.start_time:%H:%M}-{shift.end_time:%H:%M}"
                )
                where = (
                    f"your hours at {name}"
                    if show_facility
                    else ("the doctor's hours at another facility")
                )
                raise HoursClashError(f"{when} overlaps {where}")`,
    },
    {
        label: 'Rate limiter',
        file: 'app/core/rate_limit.py',
        lang: 'lua',
        why: (
            <>
                One Lua script per check, so it's atomic across every API instance sharing Redis, and it reads Redis's
                clock rather than each server's. Going over the limit blocks for 1 minute, then 5, 15 and 30. Identities
                are hashed before they become keys, so no email or IP is stored.
            </>
        ),
        code: `local blocked = redis.call('PTTL', KEYS[1])
if blocked > 0 then
  return {0, 0, blocked, 0}
end

local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', now - window)
local count = redis.call('ZCARD', KEYS[2])
if count < limit then
  redis.call('ZADD', KEYS[2], now, ARGV[4])
  redis.call('PEXPIRE', KEYS[2], window)
  return {1, limit - count - 1, 0, 0}
end

local strikes = redis.call('INCR', KEYS[3])
redis.call('PEXPIRE', KEYS[3], tonumber(ARGV[3]))
local penalty = tonumber(ARGV[4 + math.min(strikes, #ARGV - 4)])
redis.call('SET', KEYS[1], '1', 'PX', penalty)
-- A fresh window once the block ends.
redis.call('DEL', KEYS[2])
return {0, 0, penalty, strikes}`,
    },
    {
        label: 'Live events',
        file: 'app/services/events.py',
        lang: 'python',
        why: (
            <>
                Published only after the change commits, to the patient's, doctor's and clinic's channels in one
                pipeline. If Redis is down the booking still succeeds; only the live update is lost, and clients reload
                on reconnect so they never stay stale.
            </>
        ),
        code: `def publish_appointment_event(event, appointment, actor) -> None:
    """Tell the appointment's patient, doctor and facility admins. Call it
    after the change commits, with the appointment's details loaded."""
    message = json.dumps(
        {
            "type": event.value,
            # So the browser of whoever made the change can skip announcing
            # it back to them.
            "actor_id": str(actor.id),
            "appointment": AppointmentRead.model_validate(appointment).model_dump(
                mode="json"
            ),
        }
    )
    channels = (
        user_channel(appointment.patient_id),
        user_channel(appointment.doctor_id),
        facility_channel(appointment.facility_id),
    )
    try:
        pipe = redis_sync.pipeline(transaction=False)
        for channel in channels:
            pipe.publish(channel, message)
        pipe.execute()
    except RedisError:
        # The change is committed; only the live update is lost.
        logger.warning("Couldn't publish appointment event", exc_info=True, ...)`,
    },
    {
        label: 'Client reconnects',
        file: 'src/lib/eventStream.ts',
        lang: 'ts',
        why: (
            <>
                The browser's EventSource can't send an Authorization header, so the client reads the stream with{' '}
                <Code>fetch</Code>. A watchdog catches connections that die silently, and backoff with jitter stops
                every browser hitting a restarted server at the same moment.
            </>
        ),
        code: `// The server sends a heartbeat every 15s. Nothing for this long means the
// connection died without closing (a laptop waking from sleep, a dropped proxy).
const STALE_MS = 45_000

const scheduleReconnect = () => {
    if (stopped) return
    // Full jitter, so a server restart isn't hit by every browser at once
    const delay = Math.min(MAX_DELAY_MS, baseDelay * 2 ** failures) * (0.5 + Math.random() / 2)
    failures += 1
    onStatus('reconnecting')
    retryTimer = window.setTimeout(connect, delay)
}

async function connect() {
    ...
    const resetWatchdog = () => {
        window.clearTimeout(watchdog)
        watchdog = window.setTimeout(() => attempt.abort(), STALE_MS)
    }

    try {
        resetWatchdog()
        const response = await fetch(url, {
            headers: { Authorization: \`Bearer \${current}\`, Accept: 'text/event-stream' },
            cache: 'no-store',
            signal: attempt.signal,
        })
        if (response.status === 401) {
            stop()
            onUnauthorized(current)
            return
        }
        ...
    } catch {
        // Network errors, aborts and bad statuses all end in a reconnect below
    } finally {
        window.clearTimeout(watchdog)
    }

    // The server ends the stream when the token expires, and on restarts
    if (!stopped && controller === attempt) scheduleReconnect()
}`,
    },
    {
        label: 'One-use reset links',
        file: 'app/core/security.py',
        lang: 'python',
        why: (
            <>
                Reset links need to work once, without a table of issued tokens. Each token carries a short digest of
                the password hash it was issued against. Once any password is set, the digest no longer matches, so the
                link, and every older one, stops working.
            </>
        ),
        code: `def password_fingerprint(hashed_password: str | None) -> str:
    """A short digest of the user's current password hash. A reset token
    carries it, so the token stops working once the password changes: it
    can be used once, and an older link dies when a newer one is used."""
    return hashlib.sha256((hashed_password or "").encode()).hexdigest()[:16]


def create_password_reset_token(user_id: UUID, hashed_password: str | None) -> str:
    return _create_token(
        user_id,
        RESET_TOKEN_TYPE,
        timedelta(minutes=settings.password_reset_expire_minutes),
        pwd=password_fingerprint(hashed_password),
    )


def fingerprint_matches(expected: str, hashed_password: str | None) -> bool:
    return hmac.compare_digest(expected, password_fingerprint(hashed_password))`,
    },
]

export function CodeTour() {
    return (
        <DocSection
            id="code"
            eyebrow="Code tour"
            title="The parts worth reading"
            lede="Excerpts from the source. Signatures are shortened and cuts are marked with “...”, but nothing is rewritten. Each one is the code behind a guarantee on this page."
        >
            <CodeTabs tabs={TABS} />
        </DocSection>
    )
}

export default CodeTour
