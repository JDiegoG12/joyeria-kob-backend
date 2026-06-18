import { Resend } from 'resend';

/**
 * @file email.service.ts
 * @description Servicio centralizado de envío de correos transaccionales.
 * Usa Resend (https://resend.com). Requiere las variables de entorno:
 * - `RESEND_API_KEY`: API key de Resend.
 * - `EMAIL_FROM`: remitente verificado, ej. `Joyería KOB <noreply@joyeriakob.com>`.
 */

const resendApiKey = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Joyería KOB <onboarding@resend.dev>';

// Instancia perezosa: si no hay API key configurada, no se intenta crear el cliente.
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Toma el primer origen de `FRONTEND_URL`, que en producción puede venir como
 * lista separada por comas (`https://joyeriakob.com,https://www.joyeriakob.com`).
 * Sin barra final, para concatenar rutas de forma segura.
 */
const getFrontendBaseUrl = (): string => {
  const raw = process.env.FRONTEND_URL || 'http://localhost:5173';
  const first = raw.split(',')[0].trim();
  return first.replace(/\/+$/, '');
};

/**
 * Construye la URL pública del frontend a la que el usuario llega para
 * restablecer su contraseña, con el token en la ruta.
 */
export const buildResetPasswordUrl = (token: string): string => {
  return `${getFrontendBaseUrl()}/restablecer-contrasena/${token}`;
};

/**
 * Envía el correo de recuperación de contraseña con el enlace de restablecimiento.
 * Lanza si Resend devuelve error, para que el llamador pueda registrarlo; el flujo
 * de "olvidé mi contraseña" decide si propaga o no el error al cliente.
 *
 * @param to - Email destino.
 * @param resetUrl - URL completa de restablecimiento (ver `buildResetPasswordUrl`).
 */
export const sendPasswordResetEmail = async (
  to: string,
  resetUrl: string,
): Promise<void> => {
  if (!resend) {
    // Sin API key configurada: no se puede enviar. Se registra para no fallar en silencio.
    console.warn(
      '[email.service] RESEND_API_KEY no configurada; se omite el envío del correo de recuperación.',
    );
    return;
  }

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: 'Recupera tu contraseña · Joyería KOB',
    html: buildResetPasswordEmailHtml(resetUrl),
  });

  if (error) {
    throw new Error(`Error al enviar el correo de recuperación: ${error.message}`);
  }
};

/**
 * Plantilla HTML simple y sobria para el correo de recuperación.
 * Mantiene estilos inline para máxima compatibilidad entre clientes de correo.
 */
const buildResetPasswordEmailHtml = (resetUrl: string): string => {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #131638;">
    <h1 style="font-size: 20px; margin-bottom: 8px;">Recupera tu contraseña</h1>
    <p style="font-size: 14px; line-height: 22px; color: #4c4b49;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta en
      <strong>Joyería KOB</strong>. Haz clic en el botón para crear una nueva contraseña.
    </p>
    <p style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}"
         style="background-color: #131638; color: #ffffff; text-decoration: none;
                padding: 12px 28px; font-size: 14px; font-weight: bold; letter-spacing: 0.5px;
                text-transform: uppercase; display: inline-block;">
        Restablecer contraseña
      </a>
    </p>
    <p style="font-size: 13px; line-height: 20px; color: #4c4b49;">
      Este enlace caduca en <strong>1 hora</strong>. Si no solicitaste este cambio,
      puedes ignorar este correo: tu contraseña seguirá siendo la misma.
    </p>
    <p style="font-size: 12px; color: #8a8a8a; word-break: break-all;">
      Si el botón no funciona, copia y pega esta dirección en tu navegador:<br />
      ${resetUrl}
    </p>
  </div>`;
};
