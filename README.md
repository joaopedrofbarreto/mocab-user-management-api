# MOCAB User Management API

API REST para gerenciamento de usuários, desenvolvida como atividade prática do processo seletivo do projeto MOCAB (UFJF).

## Stack
- Node.js + TypeScript
- Fastify
- PostgreSQL (via Prisma)
- MongoDB (audit log de ações sobre usuários)
- JWT para autenticação

Decisões técnicas detalhadas estão em [`NOTES.md`](./NOTES.md).

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
Servidor sobe em `http://localhost:3000`. Documentação interativa em `http://localhost:3000/docs`.

### Rodar os testes
\`\`\`
npm test
\`\`\`

## Endpoints
| Método | Rota | Autenticação |
|---|---|---|
| POST | /auth/login | Não |
| POST | /users | Não |
| GET | /users | Sim |
| GET | /users/:id | Sim |
| PUT | /users/:id | Sim |
| PATCH | /users/:id/role | Sim (admin) |
| DELETE | /users/:id | Sim (admin) |

## Evidências de teste
Testes automatizados em `src/**/*.test.ts` (rodar com `npm test`). Testes manuais dos endpoints documentados em `postman_collection.json`, importável diretamente no Postman.

## Referências e ferramentas de IA
Ver seção "Ferramentas de IA utilizadas" em [`NOTES.md`](./NOTES.md).