import emailPatient from '../../../assets/docs/email-patient.png'
import emailReset from '../../../assets/docs/email-reset.png'
import { Card, Code, DocSection, Prose, Steps, SubHeading } from '../../components/docs.tsx'

const EMAILS = [
    {
        src: emailPatient,
        alt: 'Email titled “Your appointment at St. Jude Health Clinic”, showing the visit time and doctor with a “See my appointment” button',
        caption: 'A walk-in patient booked by the clinic',
    },
    {
        src: emailReset,
        alt: 'Email titled “Choose a new password” with a “Reset password” button and a note that the link works once for 30 minutes',
        caption: 'A password reset',
    },
]

export function Accounts() {
    return (
        <DocSection
            id="accounts"
            eyebrow="Accounts & email"
            title="Invites and password resets, by email"
            lede="Nobody is ever sent a password. Accounts are claimed, and passwords reset, through one-use links that expire."
        >
            <div className="grid gap-4 min-[860px]:grid-cols-3">
                <Card title="Staff invites">
                    When an admin adds a doctor or another admin, they're emailed an invite to set a password. It works
                    once and lasts 72 hours, and admins can reissue it.
                </Card>
                <Card title="Walk-in patients">
                    When the clinic books someone without an account, an account is created and they're emailed the
                    visit and an invite to claim it. A retried booking never sends a second email.
                </Card>
                <Card title="Password reset">
                    Anyone can ask for a reset link. It lasts 30 minutes, works once, and signs them in when used.
                </Card>
            </div>

            <div>
                <SubHeading>How a reset stays safe</SubHeading>
                <Steps
                    items={[
                        <>
                            <Code>POST /auth/forgot-password</Code> always answers 202 with the same message, and the email
                            is sent after the response. Neither the answer nor its timing reveals whether an account exists.
                        </>,
                        'It is rate limited per IP and per email address, so it can’t be used to flood someone’s inbox.',
                        'The link’s token is a JWT of its own type, so an invite or login token can’t be used in its place. It carries a digest of the current password hash.',
                        <>
                            <Code>POST /auth/reset-password</Code> locks the user’s row, checks that digest, sets the new
                            password and signs the user in. That change makes this link, and any older one, stop working.
                        </>,
                    ]}
                />
            </div>

            <div>
                <SubHeading>What people receive</SubHeading>
                <div className="grid gap-5 min-[720px]:grid-cols-2">
                    {EMAILS.map((e) => (
                        <figure key={e.caption} className="m-0">
                            <div className="aspect-[640/820] overflow-hidden rounded-md border border-border bg-background shadow-sm">
                                <img
                                    src={e.src}
                                    alt={e.alt}
                                    loading="lazy"
                                    width={640}
                                    height={980}
                                    className="block h-full w-full object-cover object-top"
                                />
                            </div>
                            <figcaption className="mt-2 text-[0.82rem] text-copy-lighter">{e.caption}</figcaption>
                        </figure>
                    ))}
                </div>
            </div>

            <Prose>
                Emails are sent in the background after the response, so a slow mail server never delays a booking. If
                sending fails it's logged with the user's id (never their address), and the invite token is also in the
                API response so an admin can share the link by hand. Every template is rendered in the test suite, so a
                broken one fails CI.
            </Prose>
        </DocSection>
    )
}

export default Accounts
