import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import EditCaseForm from '@/components/cases/EditCaseForm'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { ColdCase } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('cases').select('title').eq('id', id).single()
  return { title: data ? `Edit: ${data.title} — OpenColdCase` : 'Edit Case — OpenColdCase' }
}

export default async function EditCasePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: coldCase, error }, { data: { user } }] = await Promise.all([
    supabase.from('cases').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (!user)              redirect('/login')
  if (error || !coldCase) notFound()
  if (user.id !== coldCase.created_by) redirect(`/cases/${id}`)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">

        {/* Back link */}
        <div className="mb-6">
          <Link
            href={`/cases/${id}`}
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            ← Back to case
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-100">Edit Case</h1>
          <p className="text-neutral-500 text-sm mt-1 truncate max-w-lg">{coldCase.title}</p>
        </div>

        <EditCaseForm c={coldCase as ColdCase} />

      </main>
    </div>
  )
}
