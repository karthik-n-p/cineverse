import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eqazptablbpdvhxnlykx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxYXpwdGFibGJwZHZoeG5seWt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE3MTM5OSwiZXhwIjoyMDg5NzQ3Mzk5fQ.PuHRaE-xIwANCejFkMpWjF_xBOZiJvW6ZO_sjckYq1I'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase.from('movies').select('id').limit(1)
  if (error) {
    console.error("ERROR", error)
  } else {
    console.log("TABLE EXISTS!")
  }
}
check()
