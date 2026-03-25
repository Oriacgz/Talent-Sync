export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: (globalThis as { process?: { env?: { DATABASE_URL?: string } } }).process?.env?.DATABASE_URL,
  },
};
