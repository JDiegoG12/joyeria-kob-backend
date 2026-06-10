/**
 * DTO para los datos de entrada de la solicitud PUT /banner.
 * Los campos son opcionales para permitir actualizaciones parciales.
 */
export interface UpdateBannerRequestDto {
  title?: string;
  subtitle?: string | null;
}

/**
 * DTO para los datos que se pasan al servicio de upsert del banner.
 */
export interface UpsertBannerServiceDto extends UpdateBannerRequestDto {
  title: string; // El título es obligatorio para el servicio (ya validado en la fachada)
  imageUrl: string;
}

/**
 * DTO para la respuesta del endpoint GET /banner.
 * Excluye campos como `createdAt` que no son necesarios en el cliente.
 */
export interface BannerResponseDto {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  updatedAt: Date;
}
