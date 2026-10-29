// Edge Function: confirmar-pagamento
// Consulta o pagamento direto na API do Mercado Pago, já que os parâmetros
// da URL de retorno podem ser forjados, e só então marca a consulta como paga.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { consultaId, paymentId } = await req.json();
    if (!paymentId || !consultaId) {
      return new Response(JSON.stringify({ error: 'Faltam dados (consultaId ou paymentId).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const payment = await resp.json();
    const aprovado = payment.status === 'approved';
    const referenciaBate = String(payment.external_reference) === String(consultaId);

    if (aprovado && referenciaBate) {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      await supabase.from('consultas')
        .update({ pagamento_confirmado: true, mp_payment_id: String(paymentId) })
        .eq('id', consultaId);
    }

    return new Response(JSON.stringify({ aprovado, status: payment.status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
