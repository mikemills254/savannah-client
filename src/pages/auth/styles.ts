// Shared Tailwind class strings for the auth pages

import { cn } from '../../lib/cn.ts'

export const authLabel = 'mb-1.5 block text-sm font-semibold text-copy'

// Text input; gets a red border when its field has an error
export const authInput = (invalid: boolean, extra?: string) => cn('form-input', invalid && '!border-error', extra)

// Message under a field that failed validation
export const authFieldError = 'mx-0 mt-[0.35rem] mb-0 text-[0.8rem] font-medium text-error-ink'

// Full-width submit; combine with `btn btn-primary` or `btn btn-accent`
export const authSubmit =
    'mt-1 w-full px-4 py-3.5 text-base disabled:transform-none disabled:cursor-progress disabled:opacity-70 [&>svg]:transition-transform [&>svg]:duration-200 hover:enabled:[&>svg]:translate-x-[3px]'

// Text-style button (resend links etc.)
export const authLinkBtn =
    'border-0 bg-transparent p-1 text-[0.9rem] font-semibold underline underline-offset-[3px] disabled:cursor-default disabled:no-underline'

// Inline text link inside helper copy ("Already have an account? Log in")
export const authInlineLink = '[&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-[3px]'

// Entrance animation shared by every auth card/column
export const authRise = 'animate-rise motion-reduce:animate-none'
