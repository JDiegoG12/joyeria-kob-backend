import { SocialContent, SocialNetwork } from '@prisma/client';

/**
 * Tipos base y reutilizables para el contenido social.
 */
export { SocialNetwork };

/**
 * 1. DTO para la creación de un nuevo contenido social.
 * Esto es lo que el servicio espera recibir después de la validación.
 */
export interface ICreateSocialContentDTO {
  title: string;
  link: string;
  socialNetwork: SocialNetwork;
  imageUrl: string; // Nombre del archivo ya procesado
}

/**
 * 2. DTO para la actualización de un contenido social.
 * Todos los campos son opcionales.
 */
export type IUpdateSocialContentDTO = Partial<ICreateSocialContentDTO>;

/**
 * 3. DTO de respuesta para GET y CREATE.
 * Omite `updatedAt` para no mostrarlo en listados o al crear.
 */
export interface ISocialContentGetResponseDTO extends Omit<
  SocialContent,
  'imageUrl' | 'updatedAt'
> {
  imageUrl: string; // URL completa para el cliente
}

/**
 * 4. DTO de respuesta para UPDATE.
 * Omite `createdAt` para mostrar solo la fecha de actualización.
 */
export interface ISocialContentUpdateResponseDTO extends Omit<
  SocialContent,
  'imageUrl' | 'createdAt'
> {
  imageUrl: string; // URL completa para el cliente
}

/**
 * 5. Tipos para los datos crudos del formulario (FormData).
 * Convierte todas las propiedades a `string` porque así llegan desde `multipart/form-data`.
 */
type IRawInput<T> = {
  [P in keyof T]: string;
};

/**
 * Representa los datos que recibimos del formulario para crear (todos como string).
 */
export type ISocialContentCreateRaw = IRawInput<
  Omit<ICreateSocialContentDTO, 'imageUrl'>
>;

/**
 * Representa los datos que recibimos del formulario para actualizar (todos como string y opcionales).
 */
export type ISocialContentUpdateRaw = Partial<ISocialContentCreateRaw>;
