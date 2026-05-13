# Security Specification: AccVault

## 1. Data Invariants
- **Accounts**: An account must belong to a specific user (`userId`). Only the owner can create, read, update, or delete their accounts. Required fields: `platform`, `email`, `status`.
- **Proxies**: A proxy must belong to a specific user (`userId`).
- **Tasks**: A task must belong to a user (`userId`).

## 2. The "Dirty Dozen" Payloads
1. Create account without `userId`.
2. Create account with `userId` different from the authenticated user's uid.
3. Read account belonging to another user.
4. Update account to change `userId`.
5. Update account with invalid status type.
6. Create proxy without `ip`.
7. Create proxy with excessive long `ip` string.
8. Read proxy belonging to another user.
9. Delete proxy belonging to another user.
10. Create task with `userId` different from authenticated user's uid.
11. Update task with an unexpected field (e.g. `isAdmin: true`).
12. Attempt to list accounts without filtering by `userId == request.auth.uid`.

## 3. The Test Runner
A complete `firestore.rules.test.ts` file will be created to verify these payloads return `PERMISSION_DENIED`.
