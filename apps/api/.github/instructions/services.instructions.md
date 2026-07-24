---
applyTo: "src/services/**/*.ts"
---
# Service Layer

## Rules
- Keep all business logic in services
- Access persistence through repositories only
- Throw custom error classes for business rule violations
- Use transactions for multi-step writes
- Return typed objects aligned with API/domain contracts

## Anti-patterns
- Do not import `PrismaClient` directly into services
- Do not leak raw DB entities to upper layers
- Do not mix HTTP concerns (status codes, request objects) into service methods

## Examples
```typescript
// Do: orchestrate use case with repository dependencies
async createOrder(input: CreateOrderInput) {
  const order = await this.orderRepository.create(input);
  return toOrderDto(order);
}

// Don't: call Prisma directly from a service
async createOrder(input: CreateOrderInput) {
  return prisma.order.create({ data: input });
}
```
