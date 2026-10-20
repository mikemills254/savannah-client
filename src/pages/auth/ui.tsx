import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowRight, LuCircleAlert } from 'react-icons/lu'
import { Logo } from '../../website/components/Logo.tsx'
import { cn } from '../../lib/cn.ts'

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
            <Link to="/" aria-label="Back to homepage">
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
                'flex items-start gap-2.5 rounded-r-sm border-l-[3px] border-error px-3.5 py-3 text-left text-sm leading-[1.45]',
                tone === 'dark' ? 'bg-error/15 text-[#ffb3b3]' : 'bg-error/8 text-error-ink',
                className,
            )}
        >
            <LuCircleAlert size={16} className="mt-0.5 shrink-0" />
            {children}
        </div>
    )
}
