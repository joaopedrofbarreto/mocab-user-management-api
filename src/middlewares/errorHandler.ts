import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export class AppError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export function errorHandler(
    error: FastifyError | AppError,
    request: FastifyRequest,
    reply: FastifyReply
){
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({error: error.message});
    }

    if ('validation' in error && error.validation) {
        return reply.status(400).send({error: 'Dados inválidos', details: error.validation});
    }

    request.log.error(error);
    return reply.status(500).send({error: 'Erro interno do servidor'});
}