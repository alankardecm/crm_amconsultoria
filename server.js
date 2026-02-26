import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './backend/app.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = createApp(process.env);
const PORT = Number(process.env.PORT || 3000);

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Nexus AI CRM backend rodando em http://localhost:${PORT}`);
});
