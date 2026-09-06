# MOCAB User Management API

API REST para gerenciamento de usuários, desenvolvida como atividade prática do processo seletivo do projeto MOCAB (UFJF).

## Stack
- Node.js + TypeScript
- Fastify
- PostgreSQL (via Prisma)
- MongoDB (audit log de ações sobre usuários)
- JWT para autenticação
- Frontend simples em HTML/JavaScript puro, servido pelo próprio backend

Decisões técnicas e o detalhamento das regras de negócio de cada endpoint estão em [`NOTES.md`](./NOTES.md).

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Uma instância de PostgreSQL (local ou Neon)
- Uma instância de MongoDB (local ou Atlas)

### Instalação
\`\`\`
git clone https://github.com/joaopedrofbarreto/mocab-user-management-api.git
cd mocab-user-management-api
npm install
\`\`\`

### Variáveis de ambiente
Copie o `.env.example` para `.env` e preencha:
\`\`\`
DATABASE_URL=
JWT_SECRET=
MONGODB_URI=
\`\`\`

### Rodar as migrations
\`\`\`
npx prisma migrate dev
\`\`\`

### Rodar em desenvolvimento
\`\`\`
npm run dev
\`\`\`
Servidor sobe em `http://localhost:3000`.
- Frontend de demonstração: `http://localhost:3000/`
- Documentação interativa (Swagger): `http://localhost:3000/docs`

### Rodar os testes
\`\`\`
npm test
\`\`\`

## Endpoints

| Método | Rota | O que faz | Quem pode chamar |
|---|---|---|---|
| POST | /auth/login | Autentica e retorna um JWT | Público |
| POST | /users | Cria um novo usuário | Público |
| GET | /users | Lista usuários (aceita filtros `?role=`, `?createdFrom=`, `?createdTo=`) | Autenticado |
| GET | /users/:id | Busca um usuário por id | Autenticado |
| PUT | /users/:id | Atualiza nome/e-mail e, opcionalmente, a senha de um usuário | O próprio usuário, ou admin |
| PATCH | /users/:id/role | Muda o cargo de um usuário | Apenas admin |
| DELETE | /users/:id | Remove um usuário | Apenas admin |

O porquê de cada regra (por que login é público, por que o PUT permite auto-edição, por que a troca de senha exige a senha atual, etc.) está detalhado em [`NOTES.md`](./NOTES.md#endpoints-e-regras-de-negócio).

## Frontend de demonstração
Uma página simples em `/` permite logar, listar, criar, editar, mudar cargo, trocar senha e excluir usuários — consumindo a própria API acima. Feita em HTML/JS puro (sem framework, sem build), servida estaticamente pelo Fastify.

## Evidências de teste
- Testes automatizados em `src/**/*.test.ts` (rodar com `npm test`). Print da execução em `docs/testes.png`.
- Testes manuais dos 7 endpoints documentados em `postman_collection.json`, importável diretamente no Postman.
- Prints das bases de dados populadas: `docs/postgres-users.png` (PostgreSQL) e `docs/mongodb-audit-log.png` (MongoDB).
- Prints do frontend em uso: `docs/frontend-login.png` e `docs/frontend-usuarios.png`.

## Referências e ferramentas de IA
Ver seção "Ferramentas de IA utilizadas" em [`NOTES.md`](./NOTES.md).
