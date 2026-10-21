import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowRight, LuCircleAlert } from 'react-icons/lu'
import { Logo } from '../../website/components/Logo.tsx'
import { cn } from '../../lib/cn.ts'
import { isStandalone } from '../../pwa/install.ts'

// "Back to homepage" and other links to the website, hidden inside the installed app
export function WebsiteLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
    if (isStandalone()) return null
    return (
        <Link to={to} className={className}>
            {children}
        </Link>
    )
}

type Tone = 'light' | 'dark'

interface AuthTopbarProps {
    tone: Tone
    to: string
    hint: string
    label: string
}

// Logo on the left, "hint + link" on the right (hint hides on very small screens)
export function AuthTopbar({ tone, to, hint, label }: AuthTopbarProps) {
    return (
        <header className="relative z-[2] flex items-center justify-between gap-4 px-4 py-5 sm:px-8 sm:py-6">
            {/* The installed app has no homepage, only sign-in */}
            <Link to={isStandalone() ? '/auth/login' : '/'} aria-label={isStandalone() ? 'Sign in' : 'Back to homepage'}>
                <Logo variant="horizontal" theme={tone === 'dark' ? 'white' : 'default'} height={34} />
            </Link>
            <Link
                to={to}
                className={cn(
                    'inline-flex items-center gap-1.5 whitespace-nowrap text-sm transition-colors duration-200',
                    tone === 'dark' ? 'text-white/75 hover:text-white' : 'text-copy-light',
                )}
            >
                <span className="hidden min-[480px]:inline">{hint}</span>{' '}
                <strong
                    className={cn(
                        'underline decoration-[1.5px] underline-offset-[3px]',
                        tone === 'light' && 'text-primary',
                    )}
                >
                    {label}
                </strong>
                <LuArrowRight size={14} />
            </Link>
        </header>
    )
}

interface AuthAlertProps {
    children: ReactNode
    tone?: Tone
    // Spacing around the alert; defaults to a bottom gap
    className?: string
}

export function AuthAlert({ children, tone = 'light', className = 'mb-5' }: AuthAlertProps) {
    return (
        <div
            role="alert"
            className={cn(
                'flex items-start gap-2.5 rounded-r-sm px-3.5 py-3 text-left text-sm leading-[1.45]',
                tone === 'dark' ? 'bg-error/15 text-[#ffb3b3]' : 'bg-error/8 text-error-ink',
                className,
            )}
        >
            <LuCircleAlert size={16} className="mt-0.5 shrink-0" />
            {children}
        </div>
    )
}
