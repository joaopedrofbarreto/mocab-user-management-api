# Notas do Projeto — MOCAB User Management API

## Stack escolhida

- **Node.js + TypeScript**: TypeScript foi escolhido pela tipagem estática, que reduz erros em tempo de desenvolvimento e demonstra maior rigor na organização do código. Versão travada em 5.x (--save-exact): o TypeScript 7, lançado recentemente, reescreveu o compilador (agora roda como binário nativo em vez de módulo JS) e ainda quebra ferramentas do ecossistema como ts-node/ts-node-dev — a 5.x é a última versão estável e amplamente compatível.
- **Fastify**: apesar de maior familiaridade prévia com Express, optei por Fastify por oferecer validação de schema nativa (JSON Schema), melhor performance out-of-the-box e integração direta com geração de documentação OpenAPI/Swagger via plugin oficial (@fastify/swagger), o que reduz esforço na etapa de documentação da API.
- Prisma: usado como ORM para tipagem segura nas consultas e migrations versionadas. Versão travada em 6.x (--save-exact): as versões 7/8 mudaram significativamente o CLI e o fluxo de inicialização (novo sistema de "skills" para agentes de IA, nova arquitetura de client), ainda instáveis e sem necessidade real para o escopo desta atividade — a 6.x mantém o fluxo clássico (schema.prisma + DATABASE_URL), estável e suficiente.
- **PostgreSQL**: escolhido como banco principal por ser um sistema de gerenciamento de usuários — dado inerentemente estruturado e relacional (usuário, papel, timestamps), sem necessidade de relações complexas que justificassem outro modelo.
- **MongoDB (para audit logs)**: usado especificamente para o histórico de ações sobre usuários (criação, atualização, exclusão, mudança de cargo). Esse tipo de dado tende a crescer em volume, não exige relações fortes com outras entidades e se beneficia de um formato mais flexível (campo `details` livre por evento) — cenário onde um banco não relacional se encaixa melhor do que forçar essa informação dentro do modelo relacional.

## Modelo de dados

### users (PostgreSQL)
- `id` (UUID) — chave primária, UUID em vez de inteiro incremental para refletir uma prática mais próxima de ambientes de produção.
- `name`
- `email` (único) — funciona como identificador de login.
- `password_hash` — senha nunca é armazenada em texto plano.
- `role` (enum: `admin`, `user`) — optei por um enum simples em vez de uma tabela `roles` separada com relação N:N, pois o escopo da atividade não exige granularidade de permissões; uma tabela dedicada adicionaria complexidade (migrations, joins) sem ganho real de valor para o problema proposto.
- `created_at`
- `updated_at`

### audit_logs (MongoDB)
- `user_id` — referência ao usuário afetado pela ação.
- `action` (`created` | `updated` | `deleted` | `role_changed`) — tipo de evento registrado.
- `performed_by` — quem executou a ação.
- `timestamp`
- `details` — objeto livre com o detalhamento da mudança (ex: campos alterados).

## Endpoints planejados

- `POST /auth/login` — autentica e retorna JWT.
- `POST /users` — cria usuário.
- `GET /users` — lista usuários; aceita filtros via query string (`?role=`, `?createdFrom=`, `?createdTo=`) em vez de endpoints separados para busca por data, seguindo convenção REST de usar filtros ao invés de multiplicar rotas.
- `GET /users/:id` — busca usuário por id.
- `PUT /users/:id` — atualiza dados gerais (nome, e-mail).
- `PATCH /users/:id/role` — endpoint isolado para mudança de cargo, separado da atualização geral por representar uma ação semanticamente distinta e por gerar um registro específico no audit log.
- `DELETE /users/:id` — remove usuário.

## Decisões de segurança

- **Hash de senha**: bcrypt (ou argon2) — senha nunca é persistida em texto plano.
- **Autenticação**: JWT, emitido no login e exigido nas rotas protegidas.
- **Autorização**: middleware que valida o token e, quando aplicável, restringe ações por `role` (ex: apenas `admin` pode alterar o cargo de outro usuário).
- **Rate limiting**: aplicado à rota de login para mitigar tentativas de força bruta.
- **Validação de entrada**: feita via schema validation do próprio Fastify, prevenindo dados malformados e reduzindo superfície de ataque.

## Limitações assumidas

- Não foi implementado refresh token — apenas token de acesso com expiração simples, por limitação de tempo. Próximo passo natural seria adicionar renovação de sessão sem exigir novo login.
- Modelagem de permissões limitada a dois papéis (`admin`, `user`) via enum. Um sistema com necessidades de controle de acesso mais granular se beneficiaria de uma tabela de roles/permissões dedicada.
- TypeScript e Prisma foram travados em versões estáveis anteriores (5.x e 6.x) em vez das mais recentes (7/8), devido a lançamentos recentes disruptivos nessas ferramentas ainda incompatíveis com parte do ecossistema (ts-node-dev, fluxo clássico de schema). Uma iteração futura poderia reavaliar a migração para essas versões quando o ecossistema estabilizar em torno delas.


## Testes realizados
- Todos os 7 endpoints foram testados manualmente via Postman, incluindo os casos de erro esperados (404 para usuário inexistente, 409 para e-mail duplicado).
- A collection com as requests utilizadas está salva no arquivo postman_collection.json, na raiz do repositório — pode ser importada diretamente no Postman para reproduzir os testes.

## Ferramentas de IA utilizadas

- Claude (Anthropic) — utilizado como apoio no planejamento da arquitetura, modelagem de dados, definição dos endpoints, estruturação do cronograma de execução e esclarecimento de dúvidas práticas.