import { ConnectionOptions } from 'typeorm';
import { User } from './entity/user.entity';
import { File } from './entity/file.entity';
import { Folder } from './entity/folder.entity';

// Load environment variables
const {
  DATABASE_HOST,
  DATABASE_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
} = process.env;

const isProduction = process.env.NODE_ENV === 'production';
const config: ConnectionOptions = {
  type: 'postgres',
  host: DATABASE_HOST,
  port: Number(DATABASE_PORT),
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  schema: 'public',
  synchronize: false,
  logging: true,
  entities: [User, File, Folder],
  migrations: [`${__dirname}/migrations/**/*.ts`],
  subscribers: [`${__dirname}/subscriber/**/*{.${isProduction ? 'js' : 'ts'}}`],
  cli: {
    entitiesDir: isProduction ? 'dist/entity' : 'src/entity',
    migrationsDir: isProduction ? 'dist/migrations' : 'src/migrations',
    subscribersDir: isProduction ? 'dist/subscriber' : 'src/subscriber',
  },
  ssl: {
    rejectUnauthorized: false
  }
};
console.log(config.entities)
console.log(isProduction)

export default config;
