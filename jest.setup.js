// Setup global de Jest: define variables de entorno mínimas para el entorno de
// pruebas. La validación de `src/config/env.ts` aborta si `JWT_SECRET` no está
// definido, así que se establece aquí un valor ficticio (los tests que ejercen
// JWT mockean `jsonwebtoken`, por lo que el valor concreto es irrelevante).
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
