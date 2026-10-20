// Shared class strings for the marketing sections (landing + For Clinics).
// Note: Tailwind sorts `sm:` (rem) after arbitrary `min-[960px]:` (px), so any property that changes at
// both 640px and 960px uses `min-[640px]:` to keep the cascade in breakpoint order.

// Vertical rhythm of a standard section
export const sectionPad = 'py-20 min-[960px]:py-26'

// --- Hero ---

// Hero section with the faded dot grid in the top-right corner
export const heroSection =
    'relative overflow-hidden pt-12 before:pointer-events-none before:absolute before:top-0 before:right-0 before:h-full before:w-[60%] before:bg-dots before:[--dot:rgba(53,29,91,0.12)] before:[--dot-size:22px] before:fade-radial-right'

export const heroGrid =
    'relative grid items-center gap-14 pb-16 min-[960px]:grid-cols-[1.1fr_0.9fr] min-[960px]:gap-16 min-[960px]:pb-22'

export const heroTitle =
    'isolate m-0 text-[clamp(2.6rem,6.5vw,4.6rem)] leading-none font-extrabold tracking-[-0.045em] text-primary'

// Accent inside the hero title, with a highlighter swipe underneath
export const heroAccent =
    'relative inline-block text-primary-light after:absolute after:right-[-0.05em] after:bottom-[0.02em] after:left-[-0.05em] after:z-[-1] after:h-[0.22em] after:-rotate-[1.5deg] after:rounded-full after:bg-secondary'

export const heroLede = 'mt-6 mb-0 max-w-[34rem] text-[1.125rem] leading-[1.6] text-copy-light'

export const heroActions = 'mt-8 flex flex-wrap gap-4'

// Larger .btn inside the hero actions
export const heroBtn = 'px-7 py-[0.9rem] text-[1.05rem]'

// --- CTA band ---

export const ctaSection = 'py-18'

// Purple band with a blurred lime glow bottom-right
export const ctaBand =
    'relative isolate grid items-center gap-10 overflow-hidden rounded-lg bg-primary px-6 py-12 text-white shadow-lg min-[640px]:px-12 min-[640px]:py-14 min-[960px]:grid-cols-[1.2fr_0.8fr] min-[960px]:px-16 min-[960px]:py-16 before:absolute before:-right-24 before:-bottom-40 before:z-[-1] before:size-[28rem] before:rounded-full before:bg-secondary before:opacity-30 before:blur-[100px]'

// Larger .btn inside the CTA band
export const ctaBtn = 'mt-8 px-8 py-[0.95rem] text-[1.05rem] font-bold'

// --- Rota lanes ---

// Hour-gridded track a shift bar sits in
export const rotaLane = 'relative h-7 rounded-[6px] bg-rota-grid'

// Shift bar; position it with inline left/width
export const rotaShift =
    'absolute inset-y-0 flex gap-[2px] rounded-[6px] bg-primary p-[3px] transition-[left,width] duration-500 ease-out-expo motion-reduce:transition-none'

// One 30-minute cell inside a shift; pair with rotaCellOpen or rotaCellBooked
export const rotaCell = 'flex-1 rounded-[3px] transition-colors duration-300 ease-[ease]'
export const rotaCellOpen = 'bg-white/16'
export const rotaCellBooked = 'bg-secondary'
