'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'

export function PasswordInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)

  return (
    // `className` styles the wrapper, not the <input>: a margin on the input
    // would stretch the `inset-y-0` toggle below the field and misalign the icon.
    <div className={`relative ${className}`}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className="block w-full rounded-md border border-line bg-surface px-3 py-2 pr-10 text-sm outline-none focus:border-accent-dim"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-dim transition-colors hover:text-ink"
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}
