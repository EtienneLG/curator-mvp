import type { FastifyReply, FastifyRequest } from 'fastify';

// Thin: no service/repository needed for a liveness check.
export async function getHealth(_request: FastifyRequest, reply: FastifyReply) {
  reply.status(200).send({ status: 'ok' });
}
