# Folga Manager — Plano de Execução

## Objetivo
Criar um web app completo de Gerenciamento de Equipe, Folgas e Escalas no padrão macOS, com React, TypeScript, Tailwind CSS, SQLite persistente e Vite, focado em evitar esquecimento de folgas e garantir conformidade com conceitos da CLT/DSR.

## Tarefas
- [x] Tarefa 1: Setup do projeto Vite + React + TypeScript + Tailwind CSS com tema macOS e configuração de proxy para backend Express → Concluído: `npm run build` gerou a build perfeitamente.
- [x] Tarefa 2: Configuração do banco SQLite (`node:sqlite`), migrações das 6 tabelas (employees, days_off, work_schedules, audit_logs, settings, notifications) e seed com 10 colaboradores brasileiros reais → Concluído: tabelas criadas, chaves estrangeiras ativas e 10 colaboradores com cenários realistas inseridos em `data/folga_manager.db`.
- [x] Tarefa 3: Desenvolvimento da API Express com validação de conflitos de folga, regras de DSR, endpoints de CRUD, dashboard inteligente e exportação CSV → Concluído: endpoints testados e validados com `npm run test:api` e `npm run test:backend` (100% de aprovação).
- [x] Tarefa 4: Construção dos componentes de UI padrão macOS (cards com bordas arredondadas, glassmorphism, botões, modais com blur, toasts, badge de status, traffic lights) e suporte completo a Dark Mode → Concluído: Button, Card, Badge, Avatar, Modal, ConfirmDialog, EmptyState, Input, Select, TrafficLights, ThemeContext e ToastContext criados e validados no build.
- [x] Tarefa 5: Implementação do Layout macOS (Sidebar translúcida, Header, Command Palette Ctrl+K, Central de Notificações) → Concluído: Sidebar com badge dinâmico, Header com Spotlight Ctrl+K, Central de Notificações popover e suporte responsivo completo validados com build 100%.
- [x] Tarefa 6: Implementação do Dashboard com o card prioritário "Atenção do Gestor", resumo semanal interativo e estatísticas em tempo real → Concluído: AttentionCard, StatCards, WeekCalendarCard interativo e UpcomingDaysOffCard integrados com a API e validados no build.
- [x] Tarefa 7: Implementação do Módulo "Escala & Calendário" (visões Mês, Semana, Dia) e "Planejar Folgas" (tabela de pendências com resolução rápida) → Concluído: SchedulePage e DaysOffPlannerPage implementados com assistente em lote e navegação interativa, validados no build.
- [x] Tarefa 8: Implementação do CRUD de Funcionários (listagem, filtros, formulário com validação de CPF e página de perfil com histórico) → Concluído: EmployeesPage, EmployeeModal e EmployeeDetailDrawer implementados com histórico e validação de CPF, validados no build.
- [x] Tarefa 9: Implementação do Histórico de Alterações (Auditoria), Relatórios com exportação CSV e Área de Dicas Trabalhistas (CLT/DSR com aviso legal) → Concluído: HistoryPage, ReportsPage e LegalTipsPage implementados. Exportação CSV com BOM UTF-8 validada com 100% de sucesso em `test:reports`.
- [x] Tarefa 10: Criação do Onboarding de primeiro acesso, estados vazios em todas as telas e documentação completa no README.md → Concluído: OnboardingModal integrado, README.md completo e simulação de 16 etapas do gestor (`npm run test:flow`) executada com 100% de sucesso.

## Critérios de Sucesso
- [x] Aplicação 100% funcional com persistência real em arquivo SQLite local (`data/folga_manager.db`).
- [x] O gestor identifica instantaneamente quem está com folga pendente no card "Atenção do Gestor".
- [x] Design elegante e fluido inspirado no ecossistema macOS (claro e escuro).
- [x] Zero erros de compilação TypeScript ou avisos no console.
- [x] README.md completo para instalação, migração e execução local.
