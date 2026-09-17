Database operations belong here. Phase 2 defines the persistence schema; repositories are implemented with future service/API phases.
Controllers must not query Prisma directly. Services own transactions and business rules.
