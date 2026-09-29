# ZeroSpend

Gerenciador e auditor de assinaturas de software para pequenas e médias empresas (*SaaS Spend
Management*): junta num lugar só o que a empresa paga em software, aponta ferramentas redundantes e
avisa antes de cada renovação.

> **v1 — só front-end.** Os dados vivem no navegador (`localStorage`); backend, IA de extração e envio
> de alertas vêm depois. O plano e cada decisão estão no cofre de documentação.

| Papel | Repositório |
|---|---|
| Código (este repositório) | [VictorNascimento14/ZeroSpend](https://github.com/VictorNascimento14/ZeroSpend) |
| Documentação | [VictorNascimento14/Obsidian-zerospend](https://github.com/VictorNascimento14/Obsidian-zerospend) |

## Como rodar

Precisa de Node 22.

```bash
npm ci
npm run dev   # http://localhost:3000
```

Na primeira visita, o navegador recebe os dados de demonstração. Para começar do zero, limpe os dados do
site no navegador.

As checagens, as mesmas que o CI roda em cada PR:

```bash
npm run lint        # ESLint, sem nenhum aviso
npm run type-check  # tipos das rotas (next typegen) + tsc
npm test            # Vitest, no fuso de São Paulo
npm run build       # build de produção
```

## Conta de demonstração

| E-mail | Senha |
|---|---|
| `admin@zerospend.app` | `demonstracao` |

Ou o botão **"Entrar na conta de demonstração"**, em `/entrar`. A conta administra duas empresas
fictícias:

- **Exemplo Tecnologia Ltda:** 15 assinaturas, duas duplicidades (CRM e Design), duas em revisão e
  três renovações na semana;
- **Clínica Exemplo:** 4 assinaturas.

Para testar a importação, o onboarding oferece um **extrato de exemplo**, com lançamentos fictícios:
[`public/exemplo-extrato.csv`](public/exemplo-extrato.csv).

Nesta versão a conta fica guardada só no navegador (senha com PBKDF2 e sal), e isso **não é
segurança**: é o formato do fluxo, até o backend chegar.

## Mapa do app

| Rota | O que tem |
|---|---|
| `/entrar` | Entrar com e-mail e senha, ou na conta de demonstração |
| `/criar-conta` | Conta nova com o e-mail da empresa, que leva ao onboarding |
| `/onboarding` | "Traga suas assinaturas": extrato do cartão (CSV) e e-mail da empresa (demonstração) |
| `/dashboard` | Gasto mensal, economia potencial, assinaturas ativas, renovações, alertas e a tabela |
| `/assinaturas` | Lista completa com busca, filtros e ordenação; cadastrar, editar, confirmar e excluir |
| `/integracoes` | De onde vêm as assinaturas; importar outro extrato |
| `/alertas` | Renovações, duplicidades e itens em revisão; dispensar o que já foi tratado |
| `/configuracoes` | Empresa (nome, moeda, cotação), alertas (antecedência, canais) e membros (convites) |

No header ficam o seletor de empresa, a busca global (⌘K ou Ctrl K), as notificações, o tema claro ou
escuro e a conta.

## O que é de verdade e o que é demonstração

- **De verdade, no navegador:**
  - ler o extrato CSV (UTF-8 ou Windows-1252) e reconhecer 30 fornecedores de software;
  - calcular gasto, economia potencial, redundâncias e alertas de renovação;
  - contas e empresas locais;
  - convites, aceitos quando a pessoa cria a conta, neste navegador, com o e-mail convidado.
- **Demonstração, rotulada na tela:** a conexão com Google Workspace ou Microsoft 365, e a leitura de
  PDF.
- **Ainda não existe:** backend, IA de extração e envio de alertas por e-mail ou WhatsApp. A tela diz
  isso onde importa.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript estrito · Tailwind CSS v4 · shadcn/ui (`base-nova`,
Base UI) · lucide-react · next-themes · Vitest. O design system vem do Figma *SaaS Design System & UI
Kit*, com os tokens transcritos no cofre.

## Estrutura

| Pasta | O que tem |
|---|---|
| `src/app/` | as rotas: `(app)`, com a casca, e `(auth)`, com as telas de conta |
| `src/components/<área>/` | as peças de cada área; `ui/` são os primitivos do shadcn |
| `src/lib/domain/` | tipos e regras puras (cobrança, alertas, redundância), com testes |
| `src/lib/data/` | o repositório local, único lugar que toca o `localStorage` |
| `src/lib/import/` | a leitura do extrato e o catálogo de fornecedores |

Regras de trabalho no repositório: [`CLAUDE.md`](CLAUDE.md). As decisões estão nas ADRs do cofre.
