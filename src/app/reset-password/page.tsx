import Link from 'next/link'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Set New Password — OpenColdCase' }

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-red-500 text-2xl">●</span>
            <span className="font-semibold text-lg text-neutral-100 tracking-wide">OpenColdCase</span>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-100">Set a new password</h1>
          <p className="text-neutral-500 text-sm mt-1">Choose something you&apos;ll remember</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  )
}
