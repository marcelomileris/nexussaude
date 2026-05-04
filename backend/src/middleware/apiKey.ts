import { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedKey = process.env.API_KEY;

  console.log('API Key recebida:', apiKey ? apiKey.substring(0, 10) + '...' : 'nenhuma');
  console.log('API Key esperada:', expectedKey ? expectedKey.substring(0, 10) + '...' : 'não configurada');

  if (!apiKey) {
    return res.status(401).json({
      error: 'API Key não fornecida',
      message: 'Por favor, forneça uma API Key no header X-API-Key',
    });
  }

  if (apiKey !== expectedKey) {
    return res.status(401).json({
      error: 'API Key inválida',
      message: 'A API Key fornecida não é válida',
    });
  }

  next();
}