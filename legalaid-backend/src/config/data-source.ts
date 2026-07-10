import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// Used by `npm run typeorm` for generating/running migrations against Neon.
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  synchronize: false,
});
