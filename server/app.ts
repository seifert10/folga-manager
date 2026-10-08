import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import departmentsRouter from './routes/departments';
import employeesRouter from './routes/employees';
import daysOffRouter from './routes/daysOff';
import schedulesRouter from './routes/schedules';
import dashboardRouter from './routes/dashboard';
import auditRouter from './routes/audit';
import reportsRouter from './routes/reports';
import notificationsRouter from './routes/notifications';
import settingsRouter from './routes/settings';

export const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());

// 1. Rota pública de Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    app: 'Folga Manager API',
    timestamp: new Date().toISOString()
  });
});

// 2. Rotas públicas de Autenticação (/api/auth/login, etc.)
app.use('/api/auth', authRouter);

// 3. Rotas protegidas (gerenciamento e operação com isolamento de perfil e escopo)
app.use('/api/users', usersRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/days-off', daysOffRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/audit', auditRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/settings', settingsRouter);

// Servir frontend compilado em ambiente de produção (Render, Railway, etc.)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export default app;
