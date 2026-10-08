# Folga Manager

> **Controle inteligente de equipe, folgas e escalas para empresas brasileiras**  
> Interface moderna inspirada no ecossistema macOS, com foco em garantir que nenhum funcionário seja esquecido na programação do Descanso Semanal Remunerado (DSR).

---

## 📋 Sumário
- [Visão Geral e Diferencial](#visão-geral-e-diferencial)
- [Stack Tecnológica](#stack-tecnológica)
- [Base Legal Brasileira (CLT / DSR)](#base-legal-brasileira-clt--dsr)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Instalar e Executar](#como-instalar-e-executar)
- [Comandos de Banco de Dados (SQLite)](#comandos-de-banco-de-dados-sqlite)
- [Testes Automatizados de Qualidade](#testes-automatizados-de-qualidade)
- [Atalhos de Teclado](#atalhos-de-teclado)

---

## 🎯 Visão Geral e Diferencial

O **Folga Manager** atua como um assistente de gestão proativo. Em vez de um simples calendário passivo, o sistema calcula dinamicamente quem precisa de atenção imediata:

- 🔴 **Folga Pendente**: Colaboradores que estão há mais de 5 dias sem descanso semanal planejado ou em risco de ultrapassar os 6 dias consecutivos.
- 🟡 **Folga Próxima**: Descansos programados para os próximos 1 a 2 dias que exigem alinhamento de turno e cobertura operacional.
- 🟢 **Folga Definida**: Colaboradores com DSR devidamente programado dentro do ciclo regulamentar.
- ⚪ **Sem Escala**: Colaboradores em férias regulamentares ou afastamento médico.

### Card "Atenção do Gestor"
Posicionado no topo do Dashboard, informa em poucos segundos:
1. Quem está trabalhando hoje.
2. Quem está de folga hoje.
3. Quem ainda não possui folga definida na semana.
4. Botão de resolução rápida em um clique para agendar pendências.

---

## 💻 Stack Tecnológica

- **Frontend**: React 18, TypeScript, Tailwind CSS (Design Tokens macOS), Lucide Icons, Date-fns.
- **Backend**: Node.js v22+, Express, TypeScript (`tsx`).
- **Banco de Dados**: SQLite local persistente (`data/folga_manager.db`) com Foreign Keys ativas, migrations, seeds e modo WAL.
- **Build Tool**: Vite com proxy reverso `/api` configurado.

---

## ⚖ Base Legal Brasileira (CLT / DSR)

O aplicativo incorpora conceitos da legislação trabalhista brasileira (CLT e Lei 605/1949):
- **DSR Semanal**: Descanso remunerado de 24 horas consecutivas a cada período de 7 dias.
- **Limite de 6 Dias Contínuos**: Alerta preventivo para evitar que a folga recaia no 7º dia (evitando pagamento em dobro conforme OJ 410 do TST).
- **Trabalho aos Domingos**: Monitoramento do revezamento para garantir folga periódica aos domingos.
- **Intervalo Interjornada**: Observância do intervalo mínimo de 11 horas consecutivas entre jornadas (Art. 66 CLT).

> **Aviso Importante**: Este sistema fornece apoio ao planejamento de escalas e não substitui orientação do RH, contador ou profissional jurídico. Regras podem variar conforme categoria profissional, convenção coletiva, acordo coletivo e contrato de trabalho.

---

## 📁 Estrutura do Projeto

```
webapp/
├── data/
│   └── folga_manager.db         # Banco SQLite persistente
├── server/
│   ├── app.ts                   # Configuração Express e middlewares
│   ├── index.ts                 # Servidor HTTP (porta 3001)
│   ├── db/
│   │   ├── connection.ts        # Conexão SQLite (node:sqlite) com Foreign Keys
│   │   ├── migrate.ts           # Schema das 6 tabelas e índices
│   │   ├── seed.ts              # 10 colaboradores fictícios e cenários reais
│   │   └── reset.ts             # Reinicialização rápida do banco
│   ├── routes/                  # Endpoints REST (employees, days-off, dashboard, etc.)
│   ├── services/
│   │   └── dsrRules.ts          # Motor de regras DSR, conflitos e status
│   └── utils/
│       └── cpf.ts               # Validação e formatação algorítmica de CPF
├── src/
│   ├── components/
│   │   ├── ui/                  # Button, Card, Badge, Modal, ConfirmDialog, etc.
│   │   ├── layout/              # Sidebar macOS, Header, Spotlight
│   │   ├── dashboard/           # AttentionCard, StatCards, WeekCalendarCard
│   │   ├── calendar/            # FolgaModal e seletores
│   │   ├── employees/           # EmployeeModal e EmployeeDetailDrawer
│   │   └── onboarding/          # OnboardingModal de primeiro acesso
│   ├── pages/                   # Telas completas (Dashboard, Escala, Planejamento, etc.)
│   ├── context/                 # ThemeContext (Dark Mode) e ToastContext
│   ├── services/api.ts          # Cliente tipado da API
│   ├── types/index.ts           # Definições TypeScript
│   └── index.css                # Estilos globais e glassmorphism macOS
├── scripts/
│   ├── test-api.ts              # Teste de integração dos endpoints principais
│   └── test-reports.ts          # Teste de exportação CSV com validação UTF-8 BOM
├── package.json
└── README.md
```

---

## 🚀 Como Instalar e Executar

### 1. Pré-requisitos
- Node.js versão 22 ou superior (testado e homologado no Node v25).
- Gerenciador de pacotes `npm`.

### 2. Instalação das Dependências
```bash
npm install
```

### 3. Criar Banco e Executar Migrações
```bash
npm run db:migrate
```

### 4. Popular com Dados de Demonstração (Seed)
Popula o banco com 10 colaboradores brasileiros com situações variadas (folga definida, pendência de DSR, férias regulamentares e afastamento):
```bash
npm run db:seed
```

### 5. Iniciar a Aplicação (Servidor + Cliente)
Executa o backend Express na porta `3001` e o frontend Vite na porta `5173` de forma unificada:
```bash
npm run dev
```

Acesse a interface em seu navegador:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🗄 Comandos de Banco de Dados (SQLite)

| Comando | Descrição |
| :--- | :--- |
| `npm run db:migrate` | Cria as 6 tabelas e índices no arquivo `data/folga_manager.db` |
| `npm run db:seed` | Insere os 10 colaboradores e dados de teste |
| `npm run db:reset` | Limpa e recria todas as tabelas com os dados do seed |

---

## 🧪 Testes Automatizados de Qualidade

Para garantir a confiabilidade de ponta a ponta:

1. **Testes de Regras de Negócio e Persistência**:
   ```bash
   npm run test:backend
   ```
   Valida CRUD de colaboradores, impedimento de folga duplicada, cálculo de DSR e integridade referencial.

2. **Testes de Integração de API**:
   ```bash
   npm run test:api
   ```
   Inicia servidor de teste com timeout de segurança, valida rotas `/health`, `/dashboard`, `/employees` e persistência.

3. **Testes de Exportação de Relatórios (CSV)**:
   ```bash
   npm run test:reports
   ```
   Valida download dos 3 tipos de relatórios (Folgas, Pendências e Auditoria), cabeçalhos e inclusão do Byte Order Mark (UTF-8 BOM) para compatibilidade com Microsoft Excel.

4. **Validação do Build de Produção**:
   ```bash
   npm run build
   ```

---

## ⌨ Atalhos de Teclado

- <kbd>Ctrl</kbd> + <kbd>K</kbd> (ou <kbd>Cmd</kbd> + <kbd>K</kbd>): Abre a Command Palette (Spotlight macOS) para buscar colaboradores e disparar ações instantâneas.
- <kbd>ESC</kbd>: Fecha modais e painéis laterais.
