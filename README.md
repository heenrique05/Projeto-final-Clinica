# Prime Clinic

Sistema web de agendamento de consultas para uma clínica médica. O paciente cria a conta, escolhe o médico, o dia e o horário, e paga pelo próprio site. O médico tem um painel separado para acompanhar a agenda.

🔗 **Site no ar:** https://primeeclinic.netlify.app/

## Funcionalidades

**Paciente**
- Cadastro com validação de CPF (dígitos verificadores), WhatsApp e senha forte
- Login, logout e recuperação de senha por e-mail
- Agendamento em 3 etapas: especialidade/médico, data e horário, pagamento
- Calendário que bloqueia domingos, dias lotados e horários que já passaram
- Painel com próxima consulta, histórico e cancelamento

**Médico**
- Painel com as consultas atribuídas a ele, com filtros (hoje, agendadas, realizadas, pagamento pendente)
- Marcar consulta como realizada, cancelar e confirmar pagamento presencial
- Botão para mandar lembrete pelo WhatsApp do paciente

**Pagamentos**
- Pix com QR Code e "copia e cola" gerados no próprio front-end (padrão BR Code/EMV com CRC16)
- Cartão de crédito com parcelamento via Mercado Pago Checkout Pro
- Convênio validado pelo CPF do paciente
- Débito e dinheiro como pagamento presencial

## Tecnologias

- HTML, CSS e JavaScript puro (sem framework e sem build)
- Supabase: Auth, PostgreSQL, Row Level Security, funções RPC e Edge Functions
- Edge Functions em TypeScript (Deno)
- API do Mercado Pago

## Algumas decisões

- **Segurança no banco, não só na tela.** Todas as tabelas usam RLS: o paciente só vê as próprias consultas e o médico só as que são dele. A conta criada pelo site é sempre de paciente; médico só é cadastrado pelo painel do Supabase.
- **Disponibilidade sem expor pacientes.** O calendário consulta uma função `security definer` que devolve apenas data e hora ocupadas, sem nome nem CPF de ninguém.
- **Pagamento confirmado pelo servidor.** Quando o paciente volta do Mercado Pago, a Edge Function consulta o pagamento direto na API antes de marcar a consulta como paga, porque os parâmetros da URL de retorno podem ser alterados.
- **Token fora do front-end.** O access token do Mercado Pago fica nos Secrets do Supabase. A chave que aparece no `app.js` é a *publishable*, feita para ser pública.

## Estrutura

```
prime-clinic-project-final/
├── index.html                        # todas as telas (SPA com troca de "screens")
├── style.css
├── app.js                            # lógica do front-end
├── prime-clinic-supabase-setup.sql   # tabelas, políticas RLS, funções e trigger
└── edge-functions/
    ├── criar-pagamento.ts
    └── confirmar-pagamento.ts
```

## Rodando localmente

1. Crie um projeto no Supabase e rode o `prime-clinic-supabase-setup.sql` no SQL Editor
2. Troque `SUPABASE_URL` e `SUPABASE_ANON_KEY` no `app.js` pelos do seu projeto
3. Publique as funções da pasta `edge-functions/` e cadastre o secret `MP_ACCESS_TOKEN`
4. Abra o `index.html` com um servidor estático, como a extensão Live Server do VS Code

## Autor

Henrique Dias, desenvolvedor Full-Stack JavaScript em formação.
