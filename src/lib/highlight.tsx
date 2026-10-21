import type { ReactNode } from 'react'

// A small syntax highlighter for the docs' code samples: enough to read
// them comfortably, without shipping a highlighting library to every visitor.

export type Lang = 'python' | 'ts' | 'sql' | 'lua' | 'bash' | 'json' | 'http'

interface LangSpec {
    comment: string
    keywords: string[]
}

const STRING = String.raw`"""[\s\S]*?"""|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|\x60(?:[^\x60\\]|\\.)*\x60`

const LANGS: Record<Lang, LangSpec> = {
    python: {
        comment: '#.*',
        keywords: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'in', 'while', 'try', 'except', 'finally', 'raise', 'from', 'import', 'with', 'as', 'not', 'and', 'or', 'is', 'None', 'True', 'False', 'async', 'await', 'yield', 'lambda', 'pass', 'assert'],
    },
    ts: {
        comment: String.raw`//.*|/\*[\s\S]*?\*/`,
        keywords: ['const', 'let', 'function', 'return', 'if', 'else', 'for', 'while', 'await', 'async', 'new', 'try', 'catch', 'finally', 'throw', 'import', 'export', 'from', 'type', 'interface', 'continue', 'break', 'true', 'false', 'null', 'undefined'],
    },
    sql: {
        comment: '--.*',
        keywords: ['CREATE', 'UNIQUE', 'INDEX', 'ON', 'WHERE', 'SELECT', 'FROM', 'AND', 'OR', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE'],
    },
    lua: {
        comment: '--.*',
        keywords: ['local', 'if', 'then', 'end', 'return', 'else', 'elseif', 'function', 'and', 'or', 'not', 'nil'],
    },
    bash: {
        comment: String.raw`(?<=^|\s)#.*`,
        keywords: ['curl'],
    },
    json: { comment: '(?!)', keywords: ['true', 'false', 'null'] },
    http: { comment: '(?!)', keywords: ['HTTP/1.1', 'GET', 'POST', 'PATCH', 'PUT'] },
}

// Colours on the dark code panel
const TONE = {
    comment: 'text-white/42 italic',
    key: 'text-[#9fd6ff]',
    string: 'text-secondary',
    decorator: 'text-[#ff9fc6]',
    flag: 'text-[#9fd6ff]',
    keyword: 'text-[#c9b2ff]',
    number: 'text-warning',
    fn: 'text-[#ffd3a3]',
}

type Tone = keyof typeof TONE

function tokenRegex(lang: Lang): RegExp {
    const { comment, keywords } = LANGS[lang]
    const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'))
    // Tried in this order at each position, so a "#" inside a string stays a string
    const parts = [
        `(?<comment>${comment})`,
        // A JSON key: a string followed by a colon
        lang === 'json' ? `(?<key>"(?:[^"\\\\]|\\\\.)*"(?=\\s*:))` : '(?<key>(?!))',
        `(?<string>${STRING})`,
        `(?<decorator>${lang === 'python' ? '@\\w+' : '(?!)'})`,
        `(?<flag>${lang === 'bash' ? '(?<=\\s)-{1,2}[A-Za-z][\\w-]*' : '(?!)'})`,
        `(?<keyword>\\b(?:${escaped.join('|')})(?![\\w/]))`,
        `(?<number>\\b\\d[\\d_]*(?:\\.\\d+)?\\b)`,
        `(?<fn>\\b[A-Za-z_]\\w*(?=\\())`,
    ]
    return new RegExp(parts.join('|'), lang === 'sql' ? 'gmi' : 'gm')
}

export function highlight(code: string, lang: Lang): ReactNode[] {
    const out: ReactNode[] = []
    let last = 0
    for (const match of code.matchAll(tokenRegex(lang))) {
        const index = match.index ?? 0
        if (index > last) out.push(code.slice(last, index))
        const tone = (Object.keys(match.groups ?? {}) as Tone[]).find((g) => match.groups?.[g] !== undefined)
        out.push(
            <span key={index} className={tone ? TONE[tone] : undefined}>
                {match[0]}
            </span>,
        )
        last = index + match[0].length
    }
    if (last < code.length) out.push(code.slice(last))
    return out
}
