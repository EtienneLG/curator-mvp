---
applyTo: "src/routes/**/*.ts"
---
# Route Layer

## Rules
- Keep routes thin: validate with Zod, delegate to services, then send responses
- Use Zod middleware for body, query, and path parameter validation
- Call services only; do not access repositories from routes
- Return explicit and appropriate HTTP status codes
- Use `async/await` and rely on centralized error handling

## Anti-patterns
- Do not place business logic in route handlers
- Do not instantiate database clients inside routes
- Do not swallow errors in route-level `try/catch` blocks

## Examples
```typescript
// Do: validate then delegate
router.post('/orders', validateBody(createOrderSchema), async (req, res) => {
  const result = await orderService.create(req.body);
  res.status(201).json(result);
});

// Don't: query database directly from a route
router.post('/orders', async (req, res) => {
  const row = await prisma.order.create({ data: req.body });
  res.json(row);
});
```
