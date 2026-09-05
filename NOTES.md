# Notas do Projeto — MOCAB User Management API

## Stack escolhida

- **Node.js + TypeScript**: TypeScript foi escolhido pela tipagem estática, que reduz erros em tempo de desenvolvimento e demonstra maior rigor na organização do código. Versão travada em **5.x** (`--save-exact`): o TypeScript 7, lançado recentemente, reescreveu o compilador (agora roda como binário nativo em vez de módulo JS) e ainda quebra ferramentas do ecossistema como `ts-node`/`ts-node-dev` — a 5.x é a última versão estável e amplamente compatível.
- **Fastify**: apesar de maior familiaridade prévia com Express, optei por Fastify por oferecer validação de schema nativa (JSON Schema), melhor performance out-of-the-box e integração direta com geração de documentação OpenAPI/Swagger via plugin oficial (`@fastify/swagger`), o que reduz esforço na etapa de documentação da API.
- **Prisma**: usado como ORM para tipagem segura nas consultas e migrations versionadas. Versão travada em **6.x** (`--save-exact`): as versões 7/8 mudaram significativamente o CLI e o fluxo de inicialização (novo sistema de "skills" para agentes de IA, nova arquitetura de client), ainda instáveis e sem necessidade real para o escopo desta atividade — a 6.x mantém o fluxo clássico (`schema.prisma` + `DATABASE_URL`), estável e suficiente.
- **PostgreSQL**: escolhido como banco principal por ser um sistema de gerenciamento de usuários — dado inerentemente estruturado e relacional (usuário, papel, timestamps), sem necessidade de relações complexas que justificassem outro modelo.
- **MongoDB (para audit logs)**: usado especificamente para o histórico de ações sobre usuários (criação, atualização, exclusão, mudança de cargo). Esse tipo de dado tende a crescer em volume, não exige relações fortes com outras entidades e se beneficia de um formato mais flexível (campo `details` livre por evento) — cenário onde um banco não relacional se encaixa melhor do que forçar essa informação dentro do modelo relacional. Hospedado no **MongoDB Atlas** (cluster gratuito M0).
- **Frontend simples (HTML + JavaScript puro)**: servido estaticamente pelo próprio Fastify (`@fastify/static`), sem build nem dependências de frontend. Optei por não usar um framework (React, por exemplo) porque o escopo da atividade é explicitamente back-end — o frontend aqui é um extra para cobrir o diferencial de "interfaces web e IHM" listado na vaga, sem justificar o custo/risco de tempo de configurar um projeto separado. Servir do mesmo processo também elimina qualquer necessidade de configurar CORS entre origens diferentes.

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

## Endpoints e regras de negócio

Detalhamento do que cada endpoint faz, quem pode chamar, e por quê — não só o formato de entrada/saída (isso já está no Swagger em `/docs`), mas a intenção por trás de cada regra.

### `POST /auth/login`
Autentica um usuário existente e retorna um JWT (payload com `sub` = id do usuário e `role`).
- **Quem pode chamar:** qualquer um (rota pública).
- **Regra:** se o e-mail não existe ou a senha está errada, retorna sempre a mesma mensagem genérica ("Credenciais inválidas", 401) — proposital, evita que a API seja usada para descobrir quais e-mails estão cadastrados (user enumeration).
- **Proteção adicional:** rate limit de 5 tentativas por minuto, para dificultar força bruta.

### `POST /users`
Cria um novo usuário (cadastro).
- **Quem pode chamar:** qualquer um (rota pública) — decisão consciente, equivalente a "criar conta" em qualquer sistema comum.
- **Regra:** rejeita e-mail duplicado (409). Senha é hasheada com bcrypt antes de persistir, nunca salva em texto plano. O `role` é sempre forçado para `USER` nesse endpoint, independente do que for enviado no corpo — o cadastro público nunca cria admins. Isso resolve um problema de "ovo e galinha": promover alguém a `ADMIN` exige um admin existente via `PATCH /role`, então o **primeiro** admin do sistema é criado à parte, por um script de seed (`prisma/seed.ts`, rodado uma única vez com `npx prisma db seed`) direto no banco — nunca pela API pública. O e-mail desse admin inicial (`admin@mocab.com`) é tratado como protegido (ver abaixo).

### `GET /users`
Lista usuários, com filtros opcionais via query string (`?role=`, `?createdFrom=`, `?createdTo=`).
- **Quem pode chamar:** qualquer usuário autenticado (não exige `ADMIN`).
- **Regra:** os filtros existem para evitar multiplicar endpoints (ex: não existe uma rota separada "buscar por data"), seguindo convenção REST.

### `GET /users/:id`
Busca um usuário específico pelo id.
- **Quem pode chamar:** qualquer usuário autenticado.
- **Regra:** retorna 404 se o id não existir.

### `PUT /users/:id`
Atualiza dados gerais (nome, e-mail) de um usuário.
- **Quem pode chamar:** o próprio usuário autenticado (editando seus próprios dados) **ou** um `ADMIN` (editando qualquer usuário).
- **Regra:** um usuário comum que tente editar o `id` de outra pessoa recebe 403. Essa checagem foi adicionada depois de um teste manual pelo frontend revelar que a validação inicial checava só "existe um token válido", sem checar "é o dono desse id" — um exemplo real de falha de autorização identificada e corrigida durante os testes.

### `PATCH /users/:id/role`
Muda o cargo (`role`) de um usuário.
- **Quem pode chamar:** apenas `ADMIN`.
- **Regra:** endpoint isolado da atualização geral porque representa uma ação semanticamente diferente (mudança de permissão, não de dado cadastral) e sensível o suficiente para ter uma trilha de auditoria própria — toda chamada gera um registro em `audit_logs` com o `role` anterior e o novo.
- **Proteção especial:** o admin inicial do sistema (`admin@mocab.com`, criado via seed) não pode ser rebaixado por essa rota — mesmo por outro admin. Sem essa proteção, seria possível remover acidentalmente (ou maliciosamente) o único caminho garantido de acesso administrativo ao sistema.

### `DELETE /users/:id`
Remove um usuário.
- **Quem pode chamar:** apenas `ADMIN`.
- **Regra:** ação irreversível e sensível, por isso restrita. Gera registro em `audit_logs`.
- **Proteção especial:** o admin inicial do sistema (`admin@mocab.com`) não pode ser excluído, pelo mesmo motivo da proteção contra rebaixamento acima.

## Decisões de segurança

- **Hash de senha**: bcrypt — senha nunca é persistida em texto plano.
- **Autenticação**: JWT (`@fastify/jwt`), emitido no login e exigido via middleware `authenticate` nas rotas protegidas.
- **Autorização**: middleware `authorize(...roles)` separado do `authenticate` — restringe `PATCH /role` e `DELETE` a `ADMIN`. O `PUT` usa uma checagem própria (dono do recurso OU admin), por ter uma regra diferente das demais (ver detalhamento acima).
- **Rate limiting**: `@fastify/rate-limit` aplicado especificamente à rota de login (5 tentativas por minuto).
- **Validação de entrada**: feita via schema validation do próprio Fastify.
- **Tratamento de erros de plugins**: o `errorHandler` global foi ajustado para reconhecer o `statusCode` de erros lançados por plugins do Fastify (ex: o 429 do rate limit) — sem esse ajuste, esses erros caíam incorretamente no bloco genérico de 500.

## Testes realizados

- **Testes unitários** (Vitest) da camada de service, com o repository mockado — cobrem a regra de e-mail duplicado (409) e criação bem-sucedida.
- **Testes de integração** (Vitest + `app.inject`) das rotas — cobrem autenticação obrigatória (401 sem token) e validação de entrada (400 em dados inválidos).
- Evidência da execução automatizada em `docs/testes.png`.
- **Testes manuais** dos 7 endpoints via Postman e pelo frontend, incluindo casos de erro (404, 409, 401, 403) — foi justamente um teste manual pelo frontend, logado como usuário comum, que revelou a falha de autorização no `PUT` descrita acima.
- Collection do Postman salva em `postman_collection.json`, na raiz do repositório.
- Prints das bases de dados populadas em `docs/mongodb-audit-log.png` e `docs/postgres-users.png`.

## Documentação

- Documentação interativa da API via **Swagger/OpenAPI** (`@fastify/swagger` + `@fastify/swagger-ui`), disponível em `/docs`.
- Frontend simples de demonstração em `/` (ver seção de Stack).
- `README.md` com instruções de instalação, execução, variáveis de ambiente e como rodar os testes.
- Este arquivo (`NOTES.md`), com o detalhamento de regras de negócio por endpoint.

## Limitações assumidas

- Não foi implementado refresh token — apenas token de acesso com expiração simples. Próximo passo natural seria adicionar renovação de sessão sem exigir novo login.
- Modelagem de permissões limitada a dois papéis (`admin`, `user`) via enum. Um sistema com necessidades de controle de acesso mais granular se beneficiaria de uma tabela de roles/permissões dedicada.
- A proteção do admin inicial (`admin@mocab.com`) é feita por comparação direta de e-mail fixo no código, não por uma flag no banco (ex: `isProtected: true`). Funciona para o escopo desta atividade (um único admin protegido), mas não escalaria bem se houvesse necessidade de proteger múltiplas contas.
- TypeScript e Prisma foram travados em versões estáveis anteriores (5.x e 6.x) em vez das mais recentes (7/8), devido a lançamentos recentes disruptivos nessas ferramentas ainda incompatíveis com parte do ecossistema. Uma iteração futura poderia reavaliar a migração quando o ecossistema estabilizar.
- No MongoDB Atlas, o acesso por IP foi liberado para qualquer origem (`0.0.0.0/0`) para viabilizar o desenvolvimento dentro do prazo. Em produção, o ideal seria restringir aos IPs conhecidos da aplicação.
- O frontend não passou por testes automatizados (é HTML/JS simples, servido estaticamente) — a validação foi manual, e serviu inclusive para encontrar a falha de autorização do `PUT` mencionada acima.

## Ferramentas de IA utilizadas

- Claude (Anthropic) — utilizado como apoio no planejamento da arquitetura, modelagem de dados, definição dos endpoints, estruturação do cronograma de execução e esclarecimento de dúvidas práticas.
