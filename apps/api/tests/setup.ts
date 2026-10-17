import { config } from "dotenv";
config({ path: ".env" });
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/garajear_test?schema=public";
process.env.NODE_ENV = "test";
