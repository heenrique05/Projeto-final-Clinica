// Edge Function: criar-pagamento
// Cria a preferência no Mercado Pago e devolve o init_point do checkout.
// O MP_ACCESS_TOKEN fica nos Secrets do Supabase, fora do front-end.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { consultaId, valor, descricao, parcelas, pacienteNome, pacienteEmail, siteUrl } = await req.json();

    const preference: Record<string, unknown> = {
      items: [{
        title: descricao || 'Consulta médica - Prime Clinic',
        quantity: 1,
        unit_price: Number(valor),
        currency_id: 'BRL',
      }],
      payer: { name: pacienteNome, email: pacienteEmail },
      external_reference: String(consultaId),
      back_urls: {
        success: `${siteUrl}?pagamento=sucesso&consulta=${consultaId}`,
        failure: `${siteUrl}?pagamento=falha&consulta=${consultaId}`,
        pending: `${siteUrl}?pagamento=pendente&consulta=${consultaId}`,
      },
      auto_return: 'approved',
    };

    if (parcelas && parcelas > 1) {
      preference.payment_methods = { installments: parcelas, default_installments: parcelas };
    }

    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });
    const data = await resp.json();

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ init_point: data.init_point }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
