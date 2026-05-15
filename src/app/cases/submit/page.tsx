import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/ui/Navbar'
import SubmitCaseForm from '@/components/cases/SubmitCaseForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Submit a Case — OpenColdCase' }

export default async function SubmitCasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-100">Submit a Cold Case</h1>
          <p className="text-neutral-500 text-sm mt-1.5">
            Add an unsolved case to the map. Be as accurate as possible — the community will
            investigate based on what you share.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
          <SubmitCaseForm />
        </div>
      </main>
    </div>
  )
}
