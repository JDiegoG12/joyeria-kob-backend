import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import {
  authenticateToken,
  optionalAuthenticateToken,
  authorizeRole,
  requireAdmin,
  AuthenticatedRequest,
} from '../auth.middleware';

// Se mockea jsonwebtoken para controlar el resultado de la verificación del token
// sin firmar ni validar tokens reales.
jest.mock('jsonwebtoken');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Construye un objeto `Response` simulado con `status`/`json` encadenables.
const buildResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('auth.middleware', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    // Sin encabezado Authorization, debe responder 401 y no continuar.
    it('responde 401 cuando no se proporciona token', () => {
      const req = { headers: {} } as AuthenticatedRequest;
      const res = buildResponse();
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    // Con un token inválido/expirado (callback con error), responde 403.
    it('responde 403 cuando el token es inválido o expiró', () => {
      const req = {
        headers: { authorization: 'Bearer token-invalido' },
      } as AuthenticatedRequest;
      const res = buildResponse();
      const next = jest.fn();

      // jwt.verify invoca el callback con un error.
      mockedJwt.verify.mockImplementation(((
        _token: string,
        _secret: string,
        cb: (err: Error | null, decoded?: unknown) => void,
      ) => cb(new Error('invalid token'))) as unknown as typeof jwt.verify);

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    // Con un token válido, adjunta el payload a req.user y continúa.
    it('adjunta req.user y llama next con un token válido', () => {
      const req = {
        headers: { authorization: 'Bearer token-valido' },
      } as AuthenticatedRequest;
      const res = buildResponse();
      const next = jest.fn();
      const payload = { id: 'user-1', role: UserRole.CLIENT };

      mockedJwt.verify.mockImplementation(((
        _token: string,
        _secret: string,
        cb: (err: Error | null, decoded?: unknown) => void,
      ) => cb(null, payload)) as unknown as typeof jwt.verify);

      authenticateToken(req, res, next);

      expect(req.user).toEqual(payload);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    // Un payload sin `id` se considera un token con formato incorrecto (403).
    it('responde 403 si el payload no contiene id', () => {
      const req = {
        headers: { authorization: 'Bearer token-valido' },
      } as AuthenticatedRequest;
      const res = buildResponse();
      const next = jest.fn();

      mockedJwt.verify.mockImplementation(((
        _token: string,
        _secret: string,
        cb: (err: Error | null, decoded?: unknown) => void,
      ) => cb(null, { role: UserRole.CLIENT })) as unknown as typeof jwt.verify);

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticateToken', () => {
    // Sin token, continúa como invitado (sin req.user, sin error).
    it('continúa sin usuario cuando no hay token', () => {
      const req = { headers: {} } as AuthenticatedRequest;
      const res = buildResponse();
      const next = jest.fn();

      optionalAuthenticateToken(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
      expect(res.status).not.toHaveBeenCalled();
    });

    // Con un token inválido, lo trata como invitado y continúa sin error.
    it('continúa sin usuario cuando el token es inválido', () => {
      const req = {
        headers: { authorization: 'Bearer token-invalido' },
      } as AuthenticatedRequest;
      const res = buildResponse();
      const next = jest.fn();

      mockedJwt.verify.mockImplementation(((
        _token: string,
        _secret: string,
        cb: (err: Error | null, decoded?: unknown) => void,
      ) => cb(new Error('invalid token'))) as unknown as typeof jwt.verify);

      optionalAuthenticateToken(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
      expect(res.status).not.toHaveBeenCalled();
    });

    // Con un token válido, adjunta el usuario y continúa.
    it('adjunta req.user con un token válido', () => {
      const req = {
        headers: { authorization: 'Bearer token-valido' },
      } as AuthenticatedRequest;
      const res = buildResponse();
      const next = jest.fn();
      const payload = { id: 'user-9', role: UserRole.ADMIN };

      mockedJwt.verify.mockImplementation(((
        _token: string,
        _secret: string,
        cb: (err: Error | null, decoded?: unknown) => void,
      ) => cb(null, payload)) as unknown as typeof jwt.verify);

      optionalAuthenticateToken(req, res, next);

      expect(req.user).toEqual(payload);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('authorizeRole', () => {
    // Permite continuar cuando el rol del usuario coincide con el requerido.
    it('llama next cuando el rol coincide', () => {
      const req = {
        user: { id: 'u', role: UserRole.ADMIN },
      } as AuthenticatedRequest;
      const res = buildResponse();
      const next = jest.fn();

      authorizeRole(UserRole.ADMIN)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    // Responde 403 cuando el rol no coincide.
    it('responde 403 cuando el rol no coincide', () => {
      const req = {
        user: { id: 'u', role: UserRole.CLIENT },
      } as AuthenticatedRequest;
      const res = buildResponse();
      const next = jest.fn();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    // Responde 403 cuando no hay usuario autenticado.
    it('responde 403 cuando no hay usuario', () => {
      const req = {} as AuthenticatedRequest;
      const res = buildResponse();
      const next = jest.fn();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
