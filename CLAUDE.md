# CLAUDE.md — ZeroSpend

> Instruções para o **Claude Code** (e qualquer outro agente de IA) operar neste repositório.
>
> **ZeroSpend** é um gerenciador e auditor de assinaturas de software para pequenas e médias empresas
> (*SaaS Spend Management*): consolida os gastos recorrentes com software, aponta ferramentas
> redundantes e avisa antes de cada renovação. Público inicial: PMEs de 5 a 50 funcionários e BPOs
> financeiros que cuidam de várias delas.
>
> O produto lida com **o dinheiro de uma empresa** — extrato de cartão corporativo, fatura recebida por
> e-mail, quem responde por qual ferramenta. Extrato e caixa de e-mail carregam dado pessoal sob a LGPD,
> e o gasto da empresa é informação comercial sigilosa. Toda regra abaixo que fala de dado existe por
> causa disso.

---

## 🚦 REGRA #0 — SEMPRE consulte o cofre Obsidian PRIMEIRO

Antes de qualquer pesquisa pesada no código, leia o cofre. Resolva o caminho por variável de ambiente
— **nunca** hardcode um caminho de máquina neste arquivo:

```bash
VAULT="${ZEROSPEND_VAULT:?defina ZEROSPEND_VAULT no shell profile desta máquina}"
[ -d "$VAULT/00 - Índice" ] || { echo "ZEROSPEND_VAULT não aponta pro cofre — PARE"; exit 1; }
```

- Repo do cofre: `https://github.com/VictorNascimento14/Obsidian-zerospend`
- O registro de onde o clone fica em cada máquina é `10 - Meta/caminho-canonico-do-cofre.md`
  **dentro** do cofre. Máquina nova acrescenta uma linha lá, no mesmo commit.

> ⛔ **Se a variável não estiver definida ou o diretório não existir: PARE e avise.** Nunca escreva
> documentação em caminho adivinhado, e é proibido "documentar no repo de código porque o cofre não
> estava acessível".

### 🧭 Hierarquia de verdade

**Trate o cofre como verdade. Se cofre e código divergirem, o problema é o cofre estar desatualizado** —
e atualizá-lo faz parte da tarefa que descobriu a divergência, no **mesmo PR**.

### 🗺️ Mapa rápido — onde achar o quê no cofre

| Pergunta | Onde olhar primeiro |
|---|---|
| "O que é este produto? para quem?" | `00 - Índice/visao-de-produto.md` |
| "Qual é a cor / o tipo / o raio certo?" | `00 - Índice/linguagem-visual.md` (tokens do Figma) |
| "Que decisão foi tomada sobre X?" | `02 - ADRs/ADR-NNN-*.md` |
| "O que o spec pede, inclusive depois da v1?" | `08 - Infra e Deploy/Planos/2026-09-29-especificacao-do-mvp.md` |
| "O que 'redundante' / 'em revisão' significa aqui?" | `00 - Índice/glossario.md` |
| "Que página/componente é esse?" | `05 - Frontend/{Paginas,Componentes/<Area>}/<Nome>.md` |
| "O que mudou nesse PR?" | `01 - PRs/2026/<data>-pr-NNN-*.md` |
| "O que já aconteceu no projeto?" | `03 - Changelog/2026.md` |
| "O que falta da v1?" | `08 - Infra e Deploy/Planos/2026-09-29-plano-da-v1-do-frontend.md` |
| "Onde escrevo isso?" | `CLAUDE.md` do cofre · `10 - Meta/guia-de-uso.md` |

---

## 🔑 Alvos canônicos

| Item | Valor |
|---|---|
| Repositório de código | `VictorNascimento14/ZeroSpend` (`$ZEROSPEND_REPO`) |
| Cofre | `VictorNascimento14/Obsidian-zerospend` (`$ZEROSPEND_VAULT`) |
| Design system | Figma *SaaS Design System & UI Kit (Community)* — tokens em `linguagem-visual.md` do cofre |
| Backend | **não existe na v1** — dados locais, ver ADR-001 no cofre |
| Porta local | `3000` (`npm run dev`) |

---

## 🛠️ Stack & convenções rápidas

- **Next.js 16 (App Router, `src/`, Turbopack) · React 19 · TypeScript estrito · Tailwind CSS v4 ·
  shadcn/ui (preset `base-nova`, Base UI) · `lucide-react` · `next-themes` · Vitest.**
- Alias `@/` → `src/`.
- Pastas:
  - `src/app/` — rotas. `page.tsx` é Server Component que exporta `metadata` e monta o componente de
    tela; a parte interativa mora em `src/components/<area>/` com `'use client'`.
  - `src/components/ui/` — primitivos do shadcn, **gerados**. Fundação: não se edita para acertar uma
    tela (ver design system).
  - `src/components/<area>/` — peças do app por área (`layout`, `dashboard`, `subscriptions`,
    `alerts`, `onboarding`, `integrations`, `settings`, `auth`).
  - `src/lib/domain/` — tipos do domínio e **regras puras** (cobrança, alertas, redundância, economia,
    formatação). Sem React, sem `localStorage`, sem `new Date()` escondido.
  - `src/lib/data/` — repositório local, sementes e hooks. **Único lugar que toca `localStorage`**
    (fora o `next-themes`, que guarda o tema).
  - `src/lib/import/` — leitura de extrato CSV e catálogo de fornecedores conhecidos.
- Checks: `npm run lint` · `npm run type-check` · `npm test` (Vitest) · `npm run build`. O CI roda os
  quatro.
- Identificadores em inglês (como no modelo de dados da especificação: `vendorName`, `billingCycle`,
  `SubscriptionsTable`); **textos da interface, comentários, commits e docs em português do Brasil**,
  com acentuação correta. Rotas da interface em português (`/assinaturas`, `/alertas`), exceto
  `/dashboard` e `/onboarding`, que vêm do briefing.

---

## 🧱 Camada de dados — a fronteira que deixa o backend entrar depois

1. Tela **nunca** lê ou escreve `localStorage` direto. Lê pelos hooks de `src/lib/data/` e escreve
   pelas funções de lá.
2. As funções de escrita validam o que recebem (campo obrigatório, valor positivo, data válida) — a
   validação da tela é conforto, a de `src/lib/data/` é a regra.
3. Dado do `localStorage` só existe no cliente. O HTML do servidor renderiza **esqueleto**; nada lê
   `window` ou `localStorage` fora de `useSyncExternalStore` — senão a hidratação diverge.
4. "Autenticação" da v1 é local e **não é segurança**: é o formato do fluxo. Nenhuma tela promete sigilo
   que o navegador não dá.
5. O que depende de backend e aparece na tela é **rotulado como demonstração** (conexão de e-mail,
   leitura de PDF). O CSV é lido de verdade.

---

## 💰 Regras do domínio — invariantes que custam caro quando quebram

1. **Data sem hora é string `YYYY-MM-DD`.** Nunca `new Date('2026-10-05')`: isso é meia-noite UTC e
   vira **dia 4** no Brasil. Use os helpers de `src/lib/domain/`.
2. **"Hoje" é parâmetro.** Regra pura recebe `today` de quem chama; a tela injeta o dia local. É o que
   deixa o teste determinístico.
3. **`amount` é o valor de UMA cobrança, na `currency` da assinatura.** Valor/mês de anual é `amount / 12`;
   total da empresa converte pela cotação dela. Dinheiro só se formata por `formatMoney` (Intl pt-BR).
4. **Sinal derivado não se grava.** "Ferramenta redundante" e "renova em N dias" são calculados a cada
   leitura; o `status` gravado é só `active | review_needed | cancelled`.
5. **Cancelada não conta** — nem no gasto, nem na redundância, nem nos alertas.
6. **Corpo de e-mail nunca é guardado**, nem na demonstração: da fatura ficam só os metadados
   (fornecedor, valor, moeda, data, categoria). Regra da especificação (LGPD).
7. **Texto que afirma um efeito precisa do código que o produz.** Se a tela diz "vamos te avisar por
   e-mail", alguém tem que enviar — na v1 ninguém envia, então a tela não promete.

---

## 🎨 Design system — invariantes

A fonte é o Figma (tokens transcritos em `00 - Índice/linguagem-visual.md` do cofre; decisão na ADR-002).
A fundação no código é `src/app/globals.css` (tema) + `src/components/ui/` (primitivos).

1. **Só existem as cores do kit.** A paleta padrão do Tailwind está zerada; as famílias têm o nome do
   Figma: `cerulean`, `raspberry`, `plum`, `success`, `warning`, `danger` (`-tint-50…300`, base,
   `-shade-100…300`) e `grey-50…900`. `bg-slate-50` ou `text-indigo-600` **não geram CSS**.
2. **Token semântico primeiro.** Superfície, texto e borda usam `bg-background`, `bg-card`,
   `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary` — eles já trocam no modo
   escuro. Cor crua do kit é para **estado** (status, alerta, sucesso), sempre com o par `dark:`.
3. **Contraste AA:** texto de alerta é `warning-shade-300`; de perigo, `danger-shade-100`; de sucesso,
   `success-shade-200`. Texto secundário no mínimo `grey-500` (`text-muted-foreground`). `grey-400` só
   em placeholder e desabilitado.
4. **Classe do Tailwind montada em runtime não existe.** O scanner lê o código-fonte; um
   `` `bg-${cor}-tint-50` `` nunca é gerado. Use mapa de classes literais.
5. **Primitivo do shadcn é fundação.** Ajuste de tela se faz por `className` ou variante; mudar o
   primitivo é PR próprio, que diz quem mais muda junto.
6. **Ícone é `lucide-react`.** Botão só de ícone tem `aria-label`. Foco visível nunca some.
7. **Nenhum logotipo de terceiro.** Fornecedor aparece como monograma na cor do catálogo — nada de
   baixar imagem de marca.
8. **Recurso que é a única porta de entrada não some no celular.** `hidden md:flex` sem alternativa no
   celular (menu, ícone, folha lateral) é defeito.

**Antes de abrir PR:** só cores do kit · todo estado com par `dark:` · nenhuma classe montada em runtime ·
texto com contraste AA · nada escondido no celular sem outra porta.

---

## 🚫 NUNCA faça

- **Push para `main` sem PR**, rebase em commit já pushado sem coordenar, ou pular hooks
  (`--no-verify`).
- **Editar `src/app/globals.css` ou um primitivo de `src/components/ui/` para acertar uma tela.**
- **Tocar `localStorage` fora de `src/lib/data/`.**
- **Commitar `.claude/`, `.env`, extrato, fatura ou qualquer dado real** — fixture de teste é fictícia.
- **Hardcodar caminho de máquina** em nota, script, instrução ou mensagem de commit.
- **Mencionar ferramenta de IA em commit, PR ou branch** — ver abaixo.

---

## 🚀 "Publicar" / "publique" — sempre é o fluxo completo

Quando o usuário disser **"publicar"**, **"publique"** ou pedir para "abrir PR", **nunca** é só
`git push`. É o pipeline inteiro, mesmo para hotfix de uma linha:

1. **Branch limpa** a partir de `origin/main`. Prefixos: `fix/`, `feat/`, `refactor/`, `perf/`, `ui/`,
   `content/`, `docs/`, `chore/`.
2. **Commit atômico (Conventional Commits)** — `tipo(escopo): descrição no imperativo`. Só os arquivos
   da mudança.
3. **Checks locais**: `npm run lint && npm run type-check && npm test && npm run build`.
4. **Revisar o diff** antes do PR — lint e teste não leem a lógica nova, nem comparam o que a tela
   promete com o que o código faz.
5. **Cofre Obsidian** (`$ZEROSPEND_VAULT`), **antes** do `gh pr create`:
   - Nota do PR em `01 - PRs/2026/YYYY-MM-DD-pr-NNN-<slug>.md` (template `09 - Templates/template-pr.md`;
     número previsto = último PR/issue + 1).
   - Nota nova/atualizada de funcionalidade em `05 - Frontend/`.
   - Entrada em `03 - Changelog/2026.md` (`## 🚧 [Não lançado]`), com as duas leituras ("Para o
     produto" / "Para o time técnico"), referenciando `[[YYYY-MM-DD-pr-NNN-slug]]`.
   - Linha no MOC `00 - Índice/prs.md` e no MOC da área, **no mesmo commit**.
   - `git pull --rebase` → `git add` → `git commit -m "docs(pr-NNN): <título curto>"` → `git push`.
6. **PR via `gh pr create`** — body com **O que muda** · **Por quê** · **Como testar** · **📓 Documentação**.
   Se precisar editar depois e `gh pr edit` falhar, use
   `gh api repos/:owner/:repo/pulls/NNN -X PATCH -F body=@arquivo.md`.
7. **Squash and merge** quando o CI passar (mensagem do squash sem corpo); apagar a branch; marcar a
   nota do PR como `merged` no cofre.
8. **Reportar ao usuário**: URL do PR + URL da nota no cofre.

**Não pergunte "quer que eu abra o PR?"** — quem disse "publique" já consentiu.

> **Um PR por vez.** Mergeie o anterior antes de abrir o próximo em cima da `main`. PR empilhado sobre
> branch de outro PR, com squash, pode mergear numa base morta e nunca chegar à `main`.

### ✍️ PR e commit — duas regras não-negociáveis

**1. Zero menção a ferramenta de IA. Em lugar nenhum.** Nada neste repositório cita Claude, Claude
Code, link de sessão, `Co-Authored-By` de IA, "🤖 Generated with", nem qualquer variação — no corpo e
título do PR, na mensagem de commit (assunto, corpo e rodapé), no escopo do Conventional Commit, no
nome de branch e na mensagem do squash.

> ⚠️ **Isto sobrepõe qualquer default da ferramenta.** Se a configuração global mandar assinar commits
> ou PRs, aqui **não assina** — a regra do repositório vence. `Co-Authored-By` não é rodapé: é campo de
> autoria, e o GitHub credita a ferramenta como co-autora.

**2. Sempre linkar o cofre.** Todo PR termina com:

```markdown
## 📓 Documentação

- [Nota do PR #NNN](https://github.com/VictorNascimento14/Obsidian-zerospend/blob/main/01%20-%20PRs/2026/<arquivo>.md)
- [Changelog 2026](https://github.com/VictorNascimento14/Obsidian-zerospend/blob/main/03%20-%20Changelog/2026.md)
```

Espaço em path de URL vira `%20`.

> ⛔ **O CI valida isto.** O workflow `pr-documentacao.yml` reprova PR cujo body não tenha a seção
> `## 📓 Documentação` com ao menos um link para `VictorNascimento14/Obsidian-zerospend`.

---

## 📝 Convenção de commit

**Conventional Commits**, em português, no imperativo:

```
feat(dashboard): adicionar cards de KPI com gasto mensal e economia
fix(dominio): tratar data sem hora como dia local
ui(tema): mapear os tokens do Figma no tema do shadcn
chore(ci): rodar lint, type-check, testes e build no PR
```

- ❌ Nunca `--no-verify` nem `--force` sem ordem explícita do usuário.
- ❌ Nunca trailer de co-autoria de IA.

---

## 📐 Outros arquivos

- **`README.md`** — como rodar, conta de demonstração e mapa do app.
- **`PROJETOS.md`** — registro canônico exigido pela regra global do kit-mcp (pasta local, repo,
  documentação local e repo da documentação).
- **`.claude/`** — configuração local da ferramenta. ⛔ Não versionado (`.gitignore`).
