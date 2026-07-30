/** Role groups for backend authorization */
export const ADMIN_ROLES = ['Administrator'] as const;
export const ADMIN_OPERATOR_ROLES = ['Administrator', 'Operator'] as const;
export const STAFF_ROLES = [
  'Administrator',
  'Operator',
  'Tim_Teknis',
  'Petugas_Survey',
  'Koordinator',
  'Kabid',
  'Kadis',
] as const;
export const MANAGEMENT_ROLES = ['Administrator', 'Koordinator', 'Kabid', 'Kadis'] as const;
export const DISPOSITION_ROLES = [
  'Administrator',
  'Tim_Teknis',
  'Koordinator',
  'Kabid',
  'Kadis',
  'Operator',
] as const;
export const REPORT_ROLES = [
  'Administrator',
  'Kadis',
  'Kabid',
  'Koordinator',
  'Operator',
] as const;
export const MASTER_DATA_ROLES = ['Administrator', 'Koordinator'] as const;
