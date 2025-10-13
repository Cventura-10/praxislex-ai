import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * SERVER-SIDE ADMIN ROLE VERIFICATION
 * 
 * This edge function provides server-side role validation to prevent
 * privilege escalation attacks. Client-side role checks can be manipulated.
 * 
 * Usage: Call this function before performing admin-only operations
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          isAdmin: false 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          isAdmin: false 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SERVER-SIDE ROLE CHECK using has_role() function
    const { data: isAdmin, error: roleError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to verify role',
          isAdmin: false,
          details: roleError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log security check for audit trail
    if (isAdmin) {
      await supabaseClient.from('data_access_audit').insert({
        user_id: user.id,
        table_name: 'admin_security_check',
        action: 'admin_verification',
        record_id: user.id,
      });
    }

    return new Response(
      JSON.stringify({ 
        isAdmin: !!isAdmin,
        userId: user.id,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Admin check error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isAdmin: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
