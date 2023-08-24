import { ConnectionOptions } from 'typeorm';

// Load environment variables
const {
  DATABASE_HOST,
  DATABASE_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
} = process.env;

const isProduction = process.env.NODE_ENV === 'production';
console.log(`${__dirname}`)
console.log(isProduction)
const config: ConnectionOptions = {
  type: 'postgres',
  host: DATABASE_HOST,
  port: Number(DATABASE_PORT),
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  synchronize: false,
  logging: true,
  entities: [`${__dirname}/entity/**/*.entity.{${isProduction ? 'js' : 'ts'}}`],
  migrations: [`${__dirname}/migrations/**/*{.${isProduction ? 'js' : 'ts'}}`],
  subscribers: [`${__dirname}/subscriber/**/*{.${isProduction ? 'js' : 'ts'}}`],
  cli: {
    entitiesDir: isProduction ? 'dist/entity' : 'src/entity',
    migrationsDir: 'migrations',
    subscribersDir: isProduction ? 'dist/subscriber' : 'src/subscriber',
  },
};
console.log(config.entities)

export default config;
