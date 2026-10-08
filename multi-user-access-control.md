# Folga Manager — Multi-Gestor e Controle de Acesso (RBAC)

## Goal
Evoluir o Folga Manager para suportar múltiplos usuários e gestores com controle de acesso dinâmico por perfil (ADMIN, MANAGER, VIEWER) e escopo de setores autorizados, preservando 100% das funcionalidades do MVP.

## Tasks
- [ ] Task 1: Criar migrações do banco (`departments`, `users`, `user_departments`, `user_sessions`, e colunas adicionais em `employees` e `audit_logs`) → Verify: `npm run db:migrate` executa sem erros e cria tabelas e índices no SQLite.
- [ ] Task 2: Atualizar seed com 5 setores e usuários fictícios de teste (`admin`, `cozinha`, `salao`, `operacoes`, `visualizacao`) com senhas hash seguras → Verify: `npm run db:seed` popula setores, usuários e vínculos N:N corretamente.
- [ ] Task 3: Implementar utilitários de hash de senha e tokens de sessão em `server/utils/auth.ts` e rotas `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` → Verify: Login com credenciais válidas retorna token de sessão e login inválido retorna 401.
- [ ] Task 4: Criar middlewares `requireAuth`, `requireRole`, `requireDepartmentAccess` em `server/middlewares/auth.ts` → Verify: Requisição sem token retorna 401; requisição com token carrega usuário e escopo.
- [ ] Task 5: Implementar rotas administrativas de usuários (`/api/users`) e setores (`/api/departments`) restritas a ADMIN → Verify: ADMIN lista e cadastra usuários e setores; MANAGER recebe 403 Forbidden.
- [ ] Task 6: Aplicar isolamento de escopo por setor em `employees.ts`, `daysOff.ts`, `schedules.ts`, `dashboard.ts`, `reports.ts`, `audit.ts`, `notifications.ts` → Verify: Manager Cozinha acessa apenas Cozinha; tentativa de acesso a funcionário do Salão retorna 403.
- [ ] Task 7: Adaptar scripts de teste legados (`test-api.ts`, `test-reports.ts`, `test-manager-flow.ts`) para autenticar com credenciais de teste → Verify: `npm run test:backend`, `test:api`, `test:reports`, `test:flow` passam com 100% de sucesso.
- [ ] Task 8: Criar suíte de testes de autorização e segurança `scripts/test-auth.ts` e adicionar script `test:auth` em `package.json` → Verify: `npm run test:auth` executa com sucesso todos os cenários de ADMIN, MANAGER, VIEWER, isolamento 403 e E2E Carlos.
- [ ] Task 9: Implementar no frontend `AuthContext`, tela de `/login`, menu de perfil com logout no Header e proteção de ações para VIEWER → Verify: Usuário deslogado é direcionado para tela de login; após login, Header exibe nome, perfil e setores autorizados.
- [ ] Task 10: Implementar telas de administração `UsersAdminPage` e `DepartmentsAdminPage` no frontend e ajustar filtros de escopo em `EmployeesPage` e `DashboardPage` → Verify: Menus de administração visíveis apenas para ADMIN; MANAGER visualiza Dashboard e filtros restritos aos seus setores.
- [ ] Task 11: Verificação Final e Build de Produção → Verify: Execução de `npm run test:backend`, `npm run test:api`, `npm run test:reports`, `npm run test:flow`, `npm run test:auth` e `npm run build` sem nenhum erro.

## Done When
- [ ] Autenticação completa funcional com hash seguro e tokens de sessão.
- [ ] Perfis `ADMIN`, `MANAGER` e `VIEWER` com autorização estrita no backend (401/403).
- [ ] Gestores restritos estritamente aos seus setores autorizados em todas as telas e endpoints HTTP diretos.
- [ ] Ações destrutivas bloqueadas para `VIEWER` com 403.
- [ ] Nova suíte `npm run test:auth` passando com cobertura completa.
- [ ] Todos os 4 testes legados e o build continuam passando sem regressão.
