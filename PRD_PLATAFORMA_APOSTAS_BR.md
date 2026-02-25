# PRD + Arquitetura + Backlog — Plataforma de Apostas Online (Brasil)

## 1) Objetivo e posicionamento

### 1.1 Objetivo do produto (B2C)
Criar uma plataforma de apostas online para o mercado brasileiro com:
- **alta conformidade regulatória** (KYC/AML/LGPD/Jogo Responsável),
- **auditabilidade financeira ponta a ponta** (wallet + ledger double-entry),
- **escala e disponibilidade** para picos de tráfego (eventos esportivos/campanhas).

### 1.2 Público-alvo
| Segmento | Características | Necessidades |
|---|---|---|
| Recreativo (18+) | baixa/média frequência | onboarding simples, PIX rápido, UX clara |
| Médio valor | maior recorrência | confiança em saques, bônus transparentes |
| High value / VIP | ticket elevado | atendimento prioritário, limites customizados |

### 1.3 Diferenciais
1. Ledger financeiro imutável e reconciliável em tempo quase real.
2. Motor de risco transacional + comportamento (fraude, abuso de bônus, multi-conta).
3. Backoffice operacional com trilha de auditoria e governança por perfis.
4. Arquitetura preparada para múltiplos provedores (casino/live/esportes).

### 1.4 Modelo operacional
| Modelo | Vantagens | Riscos/Trade-offs | Recomendação |
|---|---|---|---|
| White-label | time-to-market rápido, custos iniciais menores | lock-in, menos controle de dados/regras | útil para validação inicial curta |
| Plataforma própria | controle total, margens melhores, diferenciação | maior complexidade, custo e prazo | **estratégia alvo** para robustez e compliance |

**Proposta:** híbrido progressivo: iniciar com agregador/provedores certificados e evoluir componentes críticos próprios (wallet/risk/bonus/backoffice).

### 1.5 Fluxos principais
1. **Cadastro** → captura mínima + consentimentos.
2. **Verificação** → KYC (documento, CPF, liveness, idade).
3. **Depósito** → PIX + validações de risco/titularidade.
4. **Aposta/Jogo** → sessão segura + eventos bet/win/rollback.
5. **Saque** → validações AML/KYC reforçadas + SLA.
6. **Suporte** → chat/ticket + trilha de evidências.

---

## 2) Requisitos legais e compliance (Brasil)

> Observação: validar continuamente requisitos com jurídico regulatório local e normativos vigentes (SPA/MF, COAF, LGPD, normas de prevenção à lavagem de dinheiro e regras específicas de operação/licenciamento).

### 2.1 KYC (Know Your Customer)
- Verificação de **maioridade (18+)** obrigatória antes de saque/aposta plena.
- Validação de **CPF** (status, consistência e unicidade por conta).
- OCR + validação documental (RG/CNH/passaporte conforme política).
- **Prova de vida (liveness)** para reduzir fraude documental.
- Match de nome/CPF/data de nascimento e controles de qualidade cadastral.
- Prevenção a múltiplas contas por device fingerprint, IP, comportamento e vínculo de pagamento.
- Re-KYC periódico para contas de maior risco/volume.

### 2.2 AML/PLD
- Monitoramento transacional com regras + modelos de score de risco.
- Indicadores: depósitos fracionados, ciclos depósito-saque sem gameplay, padrão atípico por cluster.
- **Limites dinâmicos** por risco (depósito, saque, volume diário/mensal).
- Workflow: alertas → fila de revisão → decisão (aprovar, bloquear, solicitar docs).
- Lista de bloqueio/sanções e PEP (se aplicável via parceiro especializado).
- Geração de relatórios e evidências para auditoria/regulador.

### 2.3 Jogo responsável
- Autoexclusão temporária/permanente.
- Limites configuráveis de depósito, perda e tempo de sessão.
- Cooldown com bloqueio de incremento imediato de limites.
- Alertas comportamentais (tempo excessivo, perdas consecutivas).
- Página de ajuda com materiais educativos e canais de apoio.

### 2.4 Logs e auditoria
- Trilha completa de ações de usuário, admin e sistema.
- Retenção por política regulatória e jurídica.
- Imutabilidade lógica (append-only + hash chaining opcional).
- Relatórios auditáveis: financeiro, KYC, AML, incidentes e mudanças de configuração.

---

## 3) Funcionalidades do produto

### 3.1 Conta e autenticação
- Cadastro com consentimentos LGPD/termos.
- Login por senha + MFA opcional/obrigatório por risco.
- Recuperação de conta segura (step-up verification).
- Gestão de sessões/dispositivos e logout remoto.

### 3.2 Wallet e créditos
- Wallet em BRL com **ledger double-entry**.
- Saldos: disponível, bloqueado, bônus, cashback, rollover pendente.
- Regras de elegibilidade por jogo/provedor/campanha.
- Extrato detalhado e comprovante por transação.

### 3.3 Depósitos e saques (PIX e outros)
- Integração PSP com callback assinado.
- PIX depósito/saque com validação de titularidade (quando disponível no PSP).
- Estados: `PENDING`, `CONFIRMED`, `EXPIRED`, `REVERSED`, `UNDER_REVIEW`.
- SLA de saque por faixa de risco e horário.

### 3.4 Apostas e jogos
- Casino: catálogo, categorias, busca, favoritos, RTP quando aplicável.
- Instant games (mines/crash) via provedor ou engine auditável.
- Apostas esportivas (fase posterior): pré-live/live, odds, settlement, void.
- Sistema de bônus: cupom, free spins, cashback, VIP.
- Preparação para multi-idioma/multi-moeda (BRL first).

### 3.5 Integração e hospedagem de jogos

#### Modelo A: Agregador/Provedores
- API de launch game (token + session id + currency + locale).
- Render via iframe/redirect seguro.
- Webhooks: `bet`, `win`, `rollback`, `cancel`, `settlement`.
- Idempotência por `provider_tx_id` e reconciliação diária.

#### Modelo B: Game server próprio (somente com licenciamento/auditoria)
- Engine dedicada com RNG auditável.
- Assinatura de resultados e trilha de seeds/hash (quando modelo permitir).
- Liquidação interna no ledger com baixa latência.
- Maior responsabilidade regulatória e de fairness.

#### Requisitos comuns (A e B)
- idempotency key obrigatória por operação financeira;
- retries com backoff e deduplicação;
- fila de compensação para reprocessamento;
- painel de provedores: chaves, limites, sandbox/prod, healthcheck.

### 3.6 Backoffice (admin)
- Gestão de usuários, KYC, bloqueio e limites.
- Gestão de transações, saques, disputas, chargeback.
- Relatórios operacionais e executivos (GGR, NGR, retenção, cohorts, LTV).
- Campanhas e VIP (regras, orçamento, elegibilidade).
- CMS de banners/páginas legais/mensagens in-app.

### 3.7 Suporte e atendimento
- Chat/ticket com SLA por criticidade.
- Base de conhecimento e macros.
- Integração opcional WhatsApp/e-mail.
- Fluxo de disputa com anexos e trilha de decisão.

---

## 4) Segurança e antifraude (obrigatório)

### 4.1 Threat model (resumo)
| Ameaça | Vetor | Impacto | Mitigação |
|---|---|---|---|
| Account takeover | credential stuffing/phishing | fraude de saque | MFA, rate limit, device binding |
| Multi-conta | emulação/dispositivos | abuso de bônus/AML | fingerprint + graph risk + regras |
| Fraude transacional | webhooks falsos/replay | perda financeira | assinatura HMAC/mTLS/idempotência |
| Insider misuse | privilégio excessivo | fraude/violação LGPD | RBAC forte, 4-eyes, auditoria |
| Integridade ledger | bugs/race condition | inconsistência contábil | double-entry, reconciliação, locks |

### 4.2 Controles técnicos
- WAF, rate limit por IP/conta/device.
- Bot mitigation + challenge adaptativo.
- Device fingerprint e risco comportamental.
- Monitor de integridade do ledger (balanço = 0 por transação).
- Assinatura de webhooks + rotação de segredos.
- Vault/KMS para segredos e chaves; rotação periódica.
- Criptografia em trânsito (TLS 1.2+) e em repouso (KMS-managed keys).

### 4.3 LGPD
- Base legal e consentimento explícito quando aplicável.
- Minimização de dados e purpose limitation.
- Prazos de retenção por categoria (KYC, transações, suporte).
- Processo de direitos do titular (acesso/correção/eliminação quando possível legalmente).
- DPO, RIPD e registros de tratamento.

---

## 5) Arquitetura técnica

### 5.1 Arquitetura alvo
- **Frontend:** Web SPA responsiva (desktop/mobile web).
- **Backend:** monólito modular evolutivo (MVP) com fronteira clara para extração de serviços.
- **Serviços de domínio:** Auth, KYC, Wallet/Ledger, Payments, Game Aggregation, Bonus, Risk, Notifications, Support.
- **Dados:** PostgreSQL (transacional), Redis (cache/locks), Kafka/RabbitMQ (event bus), Object Storage (comprovantes/arquivos), Data Warehouse para BI.

### 5.2 Diagrama (texto)
```text
[Web/Mobile]
   |
[API Gateway + WAF]
   |
[Core Backend (modular)] -- emits --> [Event Bus] --> [Risk/Notifications/BI]
   |        |      |        |            |
   |        |      |        |            +--> [Fraud Rules Engine]
   |        |      |        +--> [Game Aggregation Adapter] <--> [Providers]
   |        |      +--> [Payments Adapter] <--> [PSP PIX]
   |        +--> [KYC Adapter] <--> [KYC Vendors]
   +--> [Wallet + Ledger] <--> [PostgreSQL]
                |
              [Reconciliation Jobs]
```

### 5.3 Modelo de ledger (double-entry)
Princípios:
1. Toda movimentação gera lançamento com soma débito/crédito = 0.
2. Nunca atualizar histórico financeiro (somente reversão/ajuste compensatório).
3. Chave idempotente por operação externa.
4. Reconciliação periódica com PSP/provedores.

Contas contábeis exemplo:
- `player_cash_balance`
- `player_bonus_balance`
- `operator_liability`
- `payment_clearing`
- `provider_settlement`

### 5.4 Padrões de consistência
- **Idempotency keys** em depósitos/saques/eventos de jogo.
- **Outbox pattern** para publicar eventos confiavelmente.
- **Sagas** para fluxos distribuídos (ex.: saque com AML review).
- Locks otimistas/pessimistas em wallet para evitar double-spend.

---

## 6) Infra, deploy e operação

### 6.1 Stack sugerida
- Containers com Docker.
- Orquestração Kubernetes (EKS/GKE/AKS) ou ECS para operação simplificada.
- CI/CD (GitHub Actions/GitLab CI) com gates de segurança (SAST/DAST/dep scan).
- IaC com Terraform.

### 6.2 Ambientes e release
- `dev` / `staging` / `prod` segregados.
- Feature flags para rollout progressivo.
- Blue/green ou canary deploy.

### 6.3 DR, backup e contingência
- Multi-AZ para componentes críticos.
- Backup contínuo banco + testes de restore.
- Meta inicial: **RPO ≤ 5 min** / **RTO ≤ 30 min** para core financeiro.
- Runbooks de incidente (pagamentos, provedores offline, backlog de webhook).

### 6.4 Operação 24/7
- NOC/on-call com rotação.
- Alertas por SLO (latência, erros, filas, reconciliação divergente).
- Playbooks de fraude, chargeback e indisponibilidade PSP.

---

## 7) UX/UI e telas essenciais

| Tela | Objetivo | Comportamento-chave |
|---|---|---|
| Home | aquisição/engajamento | promoções, jogos em destaque, CTA de cadastro |
| Registro/Login | entrada segura | validações, MFA, recuperação, consentimentos |
| KYC | conformidade | upload docs, liveness, status e pendências |
| Carteira | transparência financeira | saldo por tipo, extrato, filtros, comprovantes |
| Depósito PIX | conversão | QR/copia-e-cola, timer, status em tempo real |
| Saque PIX | confiança | validações de risco, SLA, acompanhamento |
| Lobby de jogos | descoberta | busca, filtros, categorias, favoritos |
| Tela do jogo | gameplay | frame seguro, status de sessão, histórico curto |
| Bônus | retenção | elegibilidade, progresso de rollover, termos |
| Histórico | auditoria do usuário | apostas, transações, ganhos/perdas |
| VIP | fidelização | tier atual, benefícios, progresso |
| Suporte | resolução | chat/ticket, anexos, protocolo |
| Termos/Políticas | conformidade | documentos versionados e aceites |

---

## 8) Backlog e planejamento

## 8.1 Fases

### MVP (8–12 semanas)
Escopo:
- cadastro/login + MFA básico;
- KYC básico (CPF + doc + idade);
- wallet/ledger double-entry;
- PIX depósito/saque com 1 PSP;
- integração com 1 agregador de jogos;
- backoffice mínimo (usuário/KYC/saques).

### V1
- bônus/campanhas/VIP;
- antifraude avançado + score comportamental;
- relatórios gerenciais;
- multi-provedores de jogos.

### V2
- apostas esportivas;
- app nativo;
- expansão regional e novos meios de pagamento.

### 8.2 Épicos, user stories, aceite e riscos

| Épico | User story (exemplo) | Critérios de aceite | Riscos |
|---|---|---|---|
| Onboarding/KYC | Como usuário, quero validar minha identidade para sacar com segurança | KYC aprovado/reprovado com motivo; SLA definido; trilha auditável | falso negativo/positivo; fricção de conversão |
| Wallet/Ledger | Como operação, quero rastrear qualquer centavo ponta a ponta | toda transação balanceada; idempotência ativa; reconciliação diária | bug de concorrência; divergência com PSP |
| PIX | Como usuário, quero depositar e sacar rápido | depósito confirmado por webhook; saque com status e prazo | indisponibilidade PSP; fraude de titularidade |
| Game Integration | Como jogador, quero iniciar jogo com 1 clique | sessão válida, retorno de bet/win/rollback consistente | callback fora de ordem; timeout provedor |
| Risk/AML | Como compliance, quero bloquear padrões suspeitos | score + regras acionam revisão e bloqueio | excesso de bloqueio legítimo |
| Backoffice | Como analista, quero decidir casos com evidências | fila de revisão, logs e exportáveis | erro operacional/abuso interno |
| Bonus/VIP | Como marketing, quero campanhas segmentadas | regras aplicadas no ledger; custos por campanha | abuso de bônus; custo não controlado |

---

## 9) Entregáveis finais

## 9.1 PRD detalhado
Este documento define visão, requisitos funcionais, não funcionais, conformidade, segurança, arquitetura, operação e roadmap.

## 9.2 Diagramas de sequência (texto)

### Depósito PIX
```text
Usuário -> Frontend: inicia depósito
Frontend -> Payments API: POST /deposits (idempotency-key)
Payments API -> PSP: cria cobrança PIX
PSP -> Payments Webhook: status CONFIRMED
Payments API -> Wallet/Ledger: creditar saldo (double-entry)
Wallet -> Event Bus: deposit.confirmed
Frontend <- API: saldo atualizado
```

### Saque PIX
```text
Usuário -> Frontend: solicita saque
Frontend -> Payments API: POST /withdrawals
Payments API -> Risk/AML: score + regras
Risk/AML -> Payments API: APPROVE or REVIEW
Payments API -> PSP: solicita transferência PIX
PSP -> Payments Webhook: CONFIRMED/FAILED
Payments API -> Wallet/Ledger: débito/estorno compensatório
Frontend <- API: status final + comprovante
```

### Bet/Win/Rollback
```text
Game Provider -> Game API: bet(provider_tx_id)
Game API -> Wallet/Ledger: debita aposta (idempotente)
Game Provider -> Game API: win(provider_tx_id)
Game API -> Wallet/Ledger: credita prêmio (idempotente)
Game Provider -> Game API: rollback(ref_tx_id)
Game API -> Wallet/Ledger: lançamento compensatório
Reconciliation Job -> Provider Reports: valida totais
```

## 9.3 Modelo de dados (tabelas principais)

| Tabela | Campos-chave | Observações |
|---|---|---|
| users | id, email, phone, status, created_at | PII minimizada e criptografia |
| user_profiles | user_id, cpf_hash, birth_date, address | separação de dados sensíveis |
| kyc_cases | id, user_id, status, risk_level, provider_ref | histórico de decisões |
| wallets | id, user_id, currency, status | 1 wallet principal por moeda |
| ledger_accounts | id, wallet_id, account_type | cash/bonus/locked/cashback |
| ledger_entries | id, tx_id, account_id, debit, credit, balance_after | append-only |
| ledger_transactions | id, type, external_ref, idempotency_key, status | correlação fim-a-fim |
| deposits | id, user_id, amount, psp_ref, status | trilha PSP |
| withdrawals | id, user_id, amount, pix_key, status, review_reason | AML workflow |
| game_sessions | id, user_id, provider, game_code, status | sessão de jogo |
| game_round_events | id, session_id, event_type, provider_tx_id, amount | bet/win/rollback |
| bonuses | id, type, rules_json, valid_from, valid_to | motor de campanhas |
| bonus_wallet_links | bonus_id, user_id, progress, rollover_remaining | acompanhamento |
| risk_alerts | id, user_id, score, rule_hit, status | antifraude/AML |
| audit_logs | id, actor_type, actor_id, action, target, metadata, ts | trilha imutável lógica |

## 9.4 APIs (exemplos)

### Auth/KYC
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/mfa/verify`
- `POST /v1/kyc/start`
- `GET /v1/kyc/status`

### Wallet/Payments
- `GET /v1/wallet/balance`
- `GET /v1/wallet/statement`
- `POST /v1/payments/deposits/pix`
- `POST /v1/payments/withdrawals/pix`
- `GET /v1/payments/{id}`

### Games/Bonus
- `GET /v1/games/catalog`
- `POST /v1/games/session`
- `POST /v1/bonus/redeem`
- `GET /v1/bonus/me`

### Backoffice
- `GET /v1/admin/users`
- `POST /v1/admin/kyc/{caseId}/decision`
- `POST /v1/admin/withdrawals/{id}/approve`
- `GET /v1/admin/reports/ggr`

### Webhooks/Eventos
- PSP → `POST /v1/webhooks/psp/pix`
- Provider → `POST /v1/webhooks/games/events`
- Eventos internos (event bus):
  - `user.kyc.updated`
  - `payment.deposit.confirmed`
  - `payment.withdrawal.review_required`
  - `game.bet.recorded`
  - `game.win.recorded`
  - `ledger.tx.reconciled`
  - `risk.alert.created`

## 9.5 Checklist de segurança e compliance

### Governança e acesso
- [ ] RBAC por perfil (suporte, risco, financeiro, admin)
- [ ] MFA obrigatório no backoffice
- [ ] aprovação em 4 olhos para ações críticas

### Aplicação e APIs
- [ ] OWASP ASVS baseline
- [ ] rate limit + WAF + bot mitigation
- [ ] assinatura webhook + anti-replay + idempotência
- [ ] validação estrita de entrada e output encoding

### Dados e privacidade
- [ ] criptografia em repouso e trânsito
- [ ] tokenização/hash de CPF quando possível
- [ ] política de retenção + descarte seguro
- [ ] processo de direitos LGPD documentado

### Financeiro e reconciliação
- [ ] ledger double-entry com soma zero por tx
- [ ] reconciliação diária PSP/provedor/ledger
- [ ] monitor de divergência com alertas críticos
- [ ] trilha de auditoria exportável

### Operação e resiliência
- [ ] backups testados e restore validado
- [ ] runbooks de incidentes e fraude
- [ ] monitoramento 24/7 + on-call
- [ ] testes de carga e chaos em componentes críticos

## 9.6 Roadmap e estimativas

| Fase | Duração | Entregas principais | Dependências |
|---|---|---|---|
| Discovery + Arquitetura | 2-3 semanas | requisitos regulatórios, desenho técnico, vendor shortlist | jurídico, compliance, PSP/KYC |
| MVP | 8-12 semanas | auth/KYC básico, wallet/ledger, PIX, 1 agregador, backoffice mínimo | integrações externas |
| V1 | 10-14 semanas | bônus/VIP, antifraude avançado, BI e multi-provedores | data platform, risk tuning |
| V2 | 12-20 semanas | esportes, app nativo, expansão | novos parceiros e licenças |

Capacidade sugerida (MVP):
- Produto: 1 PM + 1 PO/BA
- Engenharia: 1 Tech Lead, 4-6 backend, 2 frontend, 1 mobile/web responsivo, 2 QA/SDET, 1 DevOps/SRE
- Especialistas: 1 compliance officer, 1 analista risco/AML, 1 UX/UI
