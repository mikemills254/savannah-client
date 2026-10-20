import { useState } from 'react'
import { LuEye, LuEyeOff } from 'react-icons/lu'

interface PasswordInputProps {
    id: string
    value: string
    onChange: (value: string) => void
    autoComplete: 'current-password' | 'new-password'
    placeholder?: string
    minLength?: number
    describedBy?: string
}

export function PasswordInput({ id, value, onChange, autoComplete, placeholder, minLength, describedBy }: PasswordInputProps) {
    const [visible, setVisible] = useState(false)

    return (
        <div className="relative">
            <input
                id={id}
                type={visible ? 'text' : 'password'}
                autoComplete={autoComplete}
                required
                minLength={minLength}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="form-input pr-12"
                placeholder={placeholder}
                aria-describedby={describedBy}
            />
            <button
                type="button"
                className="absolute top-1/2 right-[0.4rem] grid size-9 -translate-y-1/2 place-items-center rounded-sm border-0 bg-transparent text-copy-lighter transition-colors duration-200 hover:bg-accent-bg hover:text-primary"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
            >
                {visible ? <LuEyeOff size={19} /> : <LuEye size={19} />}
            </button>
        </div>
    )
}

export default PasswordInput
