import React, { useMemo } from 'react'
import Markdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

const TIME_LINK_REGEX = /\[(\d{1,2}):(\d{2})\]/g

function parseTimeToSeconds(minutes: string, seconds: string): number {
  return Number(minutes) * 60 + Number(seconds)
}

interface TimeLinkProps {
  minutes: string
  seconds: string
  onSeek: (segundos: number) => void
}

const TimeLink: React.FC<TimeLinkProps> = ({ minutes, seconds, onSeek }) => {
  return (
    <button
      type="button"
      onClick={() => onSeek(parseTimeToSeconds(minutes, seconds))}
      className="inline-flex items-center gap-1 rounded-md bg-[#9E1FFF]/10 px-1.5 py-0.5 text-xs font-semibold text-[#7a00c9] transition hover:bg-[#9E1FFF]/20"
    >
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {minutes}:{seconds}
    </button>
  )
}

const mdComponents = {
  h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mb-2 mt-4 text-xl font-bold text-neutral-900">{children}</h1>
  ),
  h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mb-1 mt-3 text-lg font-bold text-neutral-900">{children}</h2>
  ),
  h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mb-1 mt-3 text-base font-semibold text-neutral-900">{children}</h3>
  ),
  h4: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="mb-1 mt-2 text-sm font-semibold text-neutral-900">{children}</h4>
  ),
  p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-1 text-sm leading-relaxed text-neutral-800">{children}</p>
  ),
  ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-1 ml-4 list-disc space-y-0.5 text-sm text-neutral-800">{children}</ul>
  ),
  ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="my-1 ml-4 list-decimal space-y-0.5 text-sm text-neutral-800">{children}</ol>
  ),
  li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-sm">{children}</li>
  ),
  pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-xs text-neutral-100">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return <code className={className} {...props}>{children}</code>
    }
    return (
      <code className="rounded bg-[#9E1FFF]/10 px-1 py-0.5 text-xs text-[#7a00c9]" {...props}>
        {children}
      </code>
    )
  },
  blockquote: ({ children }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="my-2 border-l-4 border-[#9E1FFF] pl-3 text-sm italic text-neutral-600">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#9E1FFF] underline">
      {children}
    </a>
  ),
  table: ({ children }: React.HTMLAttributes<HTMLTableElement>) => (
    <table className="my-2 w-full border-collapse text-sm">{children}</table>
  ),
  th: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="border border-neutral-300 bg-neutral-100 px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-neutral-300 px-2 py-1">{children}</td>
  ),
}

interface Props {
  contenido: string
  onSeek: (segundos: number) => void
}

export const MarkdownRenderer: React.FC<Props> = ({ contenido, onSeek }) => {
  const procesado = useMemo(() => {
    return contenido.replace(TIME_LINK_REGEX, (_match, min, seg) => {
      return `__TIMELINK_${min}_${seg}__`
    })
  }, [contenido])

  const parts = useMemo(() => {
    const segments: Array<{ type: 'text' | 'timelink'; content: string; minutes?: string; seconds?: string }> = []
    const splitParts = procesado.split(/(__TIMELINK_\d{1,2}_\d{2}__)/)
    for (const part of splitParts) {
      const match = part.match(/^__TIMELINK_(\d{1,2})_(\d{2})__$/)
      if (match) {
        segments.push({ type: 'timelink', content: part, minutes: match[1], seconds: match[2] })
      } else if (part) {
        segments.push({ type: 'text', content: part })
      }
    }
    return segments
  }, [procesado])

  return (
    <div className="space-y-0 break-words">
      {parts.map((part, i) => {
        if (part.type === 'timelink' && part.minutes && part.seconds) {
          return (
            <TimeLink
              key={i}
              minutes={part.minutes}
              seconds={part.seconds}
              onSeek={onSeek}
            />
          )
        }
        return (
          <Markdown
            key={i}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={mdComponents}
          >
            {part.content}
          </Markdown>
        )
      })}
    </div>
  )
}
