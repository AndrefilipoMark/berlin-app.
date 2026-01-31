/** Ліміти фото житла */
export const HOUSING_PHOTOS = {
  maxCount: 3,
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  accept: 'image/jpeg,image/png,image/webp,image/gif',
  /** Стиснення перед завантаженням: макс. розмір (MB) і макс. сторона (px) */
  compressMaxSizeMB: 1.2,
  compressMaxWidthOrHeight: 1920,
};

/** Стиснення аватара перед завантаженням */
export const AVATAR_COMPRESS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 512,
};

/** Підкатегорії медицини (для фільтрації та форми додавання сервісу) */
export const MEDICINE_PROFESSIONS = [
  { id: 'Стоматолог', label: 'Стоматолог' },
  { id: 'Терапевт', label: 'Терапевт' },
  { id: 'Педіатр', label: 'Педіатр' },
  { id: 'Гінеколог', label: 'Гінеколог' },
  { id: 'Психолог', label: 'Психолог' },
  { id: 'Ветеринар', label: 'Ветеринар' },
  { id: 'Дерматолог', label: 'Дерматолог' },
  { id: 'Ортопед', label: 'Ортопед' },
  { id: 'Окуліст', label: 'Окуліст' },
  { id: 'Уролог', label: 'Уролог' },
  { id: 'Фізіотерапевт', label: 'Фізіотерапевт' },
];

/** Підкатегорії гастрономії */
export const GASTRONOMY_SUBCATEGORIES = [
  { id: 'Ресторани', label: 'Ресторани' },
  { id: 'Кафе', label: 'Кафе' },
  { id: 'Бари', label: 'Бари' },
  { id: 'Пекарні', label: 'Пекарні' },
];

/** Підкатегорії Beauty */
export const BEAUTY_SUBCATEGORIES = [
  { id: 'Салони краси', label: 'Салони краси' },
  { id: 'Перукарні', label: 'Перукарні' },
  { id: 'Майстри вдома', label: 'Майстри вдома' },
  { id: 'Косметологія', label: 'Косметологія' },
];

/** 12 офіційних районів Берліна (Bezirke) */
export const BERLIN_DISTRICTS = [
  'Mitte',
  'Friedrichshain-Kreuzberg',
  'Pankow',
  'Charlottenburg-Wilmersdorf',
  'Spandau',
  'Steglitz-Zehlendorf',
  'Tempelhof-Schöneberg',
  'Neukölln',
  'Treptow-Köpenick',
  'Marzahn-Hellersdorf',
  'Lichtenberg',
  'Reinickendorf',
];
