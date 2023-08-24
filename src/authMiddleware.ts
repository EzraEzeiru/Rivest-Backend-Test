import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import authConfig from './authConfig';

import CustomRequest  from "../types/types";


const authMiddleware: RequestHandler = (req: CustomRequest, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).send({ error: 'No token provided' });
        return;
    }

    const parts = authHeader.split(' ');

    if (!(parts.length === 2)) {
        res.status(401).send({ error: 'Token error' });
        return;
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        res.status(401).send({ error: 'Token malformatted' });
        return;
    }

    jwt.verify(token, authConfig.jwtSecret, (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err) {
            res.status(401).send({ error: 'Token invalid' });
            return;
        }

        if (typeof decoded === 'object' && 'id' in decoded) {
            req.user = { id: decoded.id };
            next();
        } else {
            res.status(401).send({ error: 'Invalid token payload' });
            return;
        }
    });
}

export default authMiddleware;
