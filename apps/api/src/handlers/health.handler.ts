import type { FastifyReply, FastifyRequest } from 'fastify';

export async function getHealth(_request: FastifyRequest, reply: FastifyReply) {
  reply.status(200).send({ status: 'ok' });
}
