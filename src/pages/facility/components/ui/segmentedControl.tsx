import { cn } from '../../../../lib/cn.ts'

interface Option<T extends string> {
    value: T
    label: string
    count?: number
}

interface SegmentedControlProps<T extends string> {
    label: string
    options: Option<T>[]
    value: T
    onChange: (value: T) => void
}

export default function SegmentedControl<T extends string>({ label, options, value, onChange }: SegmentedControlProps<T>) {
    return (
        <div
            role="group"
            aria-label={label}
            className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-white p-1"
        >
            {options.map((option) => {
                const active = option.value === value

                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'flex shrink-0 items-center gap-1.5 rounded-full border-0 px-3.5 py-1.5 text-sm font-medium transition-colors',
                            active ? 'bg-primary text-primary-content' : 'bg-transparent text-copy-light hover:text-copy',
                        )}
                    >
                        {option.label}
                        {option.count !== undefined && (
                            <span className={cn('text-xs tabular-nums', active ? 'text-primary-content/70' : 'text-copy-lighter')}>
                                {option.count}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
