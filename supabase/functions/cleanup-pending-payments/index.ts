import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

    // Delete pending payments older than 15 minutes
    const { data, error } = await supabase
      .from('payments')
      .delete()
      .eq('status', 'pending')
      .lt('created_at', fifteenMinutesAgo)
      .select('id')

    if (error) throw error

    const count = data?.length || 0
    console.log(`Cleaned up ${count} expired pending payments`)

    return new Response(
      JSON.stringify({ success: true, deleted: count }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Cleanup error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
