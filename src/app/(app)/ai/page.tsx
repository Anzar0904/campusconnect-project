import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AIAssistantClient from './AIAssistantClient'
export const metadata = { title: 'AI Assistant — IILM Connect' }
export default async function AIPage() {
  return <AIAssistantClient />
}
