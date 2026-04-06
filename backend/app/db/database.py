from prisma import Prisma

# Single Prisma client instance used across the entire app.
prisma = Prisma()


def get_prisma() -> Prisma:
    return prisma