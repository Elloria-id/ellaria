'use client'

import { useState } from 'react'

type NovelReaderProps = {
  title?: string
  content?: string
}

export default function NovelReader({
  title = 'Novel',
  content = '',
}: NovelReaderProps) {
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [fontFamily, setFontFamily] = useState<
    'serif' | 'sans'
  >('serif')

  return (
    <main className="min-h-screen bg-[#05070a] text-white">

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05070a]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">

          <h1 className="text-lg font-semibold">
            {title}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2">

            <button
              onClick={() =>
                setFontSize(value =>
                  Math.max(14, value - 1)
                )
              }
              className="rounded-lg bg-white/10 px-3 py-2 text-xs"
            >
              A-
            </button>

            <button
              onClick={() =>
                setFontSize(value =>
                  Math.min(28, value + 1)
                )
              }
              className="rounded-lg bg-white/10 px-3 py-2 text-xs"
            >
              A+
            </button>

            <button
              onClick={() =>
                setFontFamily('serif')
              }
              className={`rounded-lg px-3 py-2 text-xs ${
                fontFamily === 'serif'
                  ? 'bg-[#42A5F5] text-black'
                  : 'bg-white/10'
              }`}
            >
              Serif
            </button>

            <button
              onClick={() =>
                setFontFamily('sans')
              }
              className={`rounded-lg px-3 py-2 text-xs ${
                fontFamily === 'sans'
                  ? 'bg-[#42A5F5] text-black'
                  : 'bg-white/10'
              }`}
            >
              Sans
            </button>

          </div>
        </div>
      </header>

      <article
        className={`mx-auto max-w-3xl px-5 py-10 ${
          fontFamily === 'serif'
            ? 'font-serif'
            : 'font-sans'
        }`}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight,
        }}
      >
        {content ? (
          content.split('\n').map((paragraph, index) => (
            <p
              key={index}
              className="mb-6"
            >
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-gray-500">
            Belum ada isi novel.
          </p>
        )}
      </article>

      <div className="mx-auto max-w-3xl px-5 pb-10">

        <label className="mb-2 block text-xs text-gray-500">
          Jarak baris
        </label>

        <input
          type="range"
          min="1.4"
          max="2.4"
          step="0.1"
          value={lineHeight}
          onChange={event =>
            setLineHeight(
              Number(event.target.value)
            )
          }
          className="accent-[#42A5F5]"
        />

      </div>

    </main>
  )
}
