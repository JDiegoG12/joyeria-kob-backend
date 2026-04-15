export const generateSlug = (name: string): string => {
  return name
    .normalize('NFD') // Normalize to NFD form
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
};
