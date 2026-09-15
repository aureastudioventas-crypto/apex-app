/**
 * APEX TUNING ENGINE — FH5
 * CATALOGO MAESTRO FH5-TM-001..037
 *
 * Este catálogo conserva la numeración y nombres canónicos de las 37 categorías
 * de la matriz APEX. No contiene valores inventados: los valores de reglaje
 * deben provenir de las hojas maestras normalizadas y del Knowledge Base.
 */

export interface Master37Category {
  id: string;
  number: number;
  name: string;
  sourceCategoryId: string;
  status: 'MASTER' | 'PENDING_DATA';
}

export const MASTER_37_CATEGORIES: Master37Category[] = [
  { id: 'FH5-TM-001', number: 1, name: 'Modern Sports Cars', sourceCategoryId: 'FH5-TM-001', status: 'MASTER' },
  { id: 'FH5-TM-002', number: 2, name: 'Super Saloons', sourceCategoryId: 'FH5-TM-002', status: 'MASTER' },
  { id: 'FH5-TM-003', number: 3, name: 'Super GT', sourceCategoryId: 'FH5-TM-003', status: 'MASTER' },
  { id: 'FH5-TM-004', number: 4, name: 'Modern Supercars', sourceCategoryId: 'FH5-TM-004', status: 'MASTER' },
  { id: 'FH5-TM-005', number: 5, name: 'Hypercars', sourceCategoryId: 'FH5-TM-005', status: 'MASTER' },
  { id: 'FH5-TM-006', number: 6, name: 'Modern Muscle', sourceCategoryId: 'FH5-TM-006', status: 'MASTER' },
  { id: 'FH5-TM-007', number: 7, name: 'Modern Rally', sourceCategoryId: 'FH5-TM-007', status: 'MASTER' },
  { id: 'FH5-TM-008', number: 8, name: 'Classic Sports Cars', sourceCategoryId: 'FH5-TM-008', status: 'MASTER' },
  { id: 'FH5-TM-009', number: 9, name: 'Cult Cars', sourceCategoryId: 'FH5-TM-009', status: 'MASTER' },
  { id: 'FH5-TM-010', number: 10, name: 'Drift Cars', sourceCategoryId: 'FH5-TM-010', status: 'MASTER' },
  { id: 'FH5-TM-011', number: 11, name: 'Extreme Track Toys', sourceCategoryId: 'FH5-TM-011', status: 'MASTER' },
  { id: 'FH5-TM-012', number: 12, name: 'GT Cars', sourceCategoryId: 'FH5-TM-012', status: 'MASTER' },
  { id: 'FH5-TM-013', number: 13, name: 'Classic Muscle', sourceCategoryId: 'FH5-TM-013', status: 'MASTER' },
  { id: 'FH5-TM-014', number: 14, name: 'Classic Racers', sourceCategoryId: 'FH5-TM-014', status: 'MASTER' },
  { id: 'FH5-TM-015', number: 15, name: 'Classic Rally', sourceCategoryId: 'FH5-TM-015', status: 'MASTER' },
  { id: 'FH5-TM-016', number: 16, name: 'Hot Hatch', sourceCategoryId: 'FH5-TM-016', status: 'MASTER' },
  { id: 'FH5-TM-017', number: 17, name: 'Offroad', sourceCategoryId: 'FH5-TM-017', status: 'MASTER' },
  { id: 'FH5-TM-018', number: 18, name: 'Pickups & 4x4s', sourceCategoryId: 'FH5-TM-018', status: 'MASTER' },
  { id: 'FH5-TM-019', number: 19, name: 'Rally Monsters', sourceCategoryId: 'FH5-TM-019', status: 'MASTER' },
  { id: 'FH5-TM-020', number: 20, name: 'Rare Classics', sourceCategoryId: 'FH5-TM-020', status: 'MASTER' },
  { id: 'FH5-TM-021', number: 21, name: 'Retro Hot Hatch', sourceCategoryId: 'FH5-TM-021', status: 'MASTER' },
  { id: 'FH5-TM-022', number: 22, name: 'Retro Muscle', sourceCategoryId: 'FH5-TM-022', status: 'MASTER' },
  { id: 'FH5-TM-023', number: 23, name: 'Retro Rally', sourceCategoryId: 'FH5-TM-023', status: 'MASTER' },
  { id: 'FH5-TM-024', number: 24, name: 'Retro Saloons', sourceCategoryId: 'FH5-TM-024', status: 'MASTER' },
  { id: 'FH5-TM-025', number: 25, name: 'Retro Sports Cars', sourceCategoryId: 'FH5-TM-025', status: 'MASTER' },
  { id: 'FH5-TM-026', number: 26, name: 'Retro Supercars', sourceCategoryId: 'FH5-TM-026', status: 'MASTER' },
  { id: 'FH5-TM-027', number: 27, name: 'Rods and Customs', sourceCategoryId: 'FH5-TM-027', status: 'MASTER' },
  { id: 'FH5-TM-028', number: 28, name: 'Sports Utility Heroes', sourceCategoryId: 'FH5-TM-028', status: 'MASTER' },
  { id: 'FH5-TM-029', number: 29, name: 'Super Hot Hatch', sourceCategoryId: 'FH5-TM-029', status: 'MASTER' },
  { id: 'FH5-TM-030', number: 30, name: 'Track Toys', sourceCategoryId: 'FH5-TM-030', status: 'MASTER' },
  { id: 'FH5-TM-031', number: 31, name: 'Trucks', sourceCategoryId: 'FH5-TM-031', status: 'MASTER' },
  { id: 'FH5-TM-032', number: 32, name: 'Unlimited Buggies', sourceCategoryId: 'FH5-TM-032', status: 'MASTER' },
  { id: 'FH5-TM-033', number: 33, name: 'Unlimited Offroad', sourceCategoryId: 'FH5-TM-033', status: 'MASTER' },
  { id: 'FH5-TM-034', number: 34, name: "UTV's", sourceCategoryId: 'FH5-TM-034', status: 'MASTER' },
  { id: 'FH5-TM-035', number: 35, name: 'Vans & Utility', sourceCategoryId: 'FH5-TM-035', status: 'MASTER' },
  { id: 'FH5-TM-036', number: 36, name: 'Vintage Racers', sourceCategoryId: 'FH5-TM-036', status: 'MASTER' },
  { id: 'FH5-TM-037', number: 37, name: 'Buggies', sourceCategoryId: 'FH5-TM-037', status: 'MASTER' },
];

export const MASTER_37_COUNT = MASTER_37_CATEGORIES.length;

export function getMaster37Category(id: string): Master37Category | undefined {
  return MASTER_37_CATEGORIES.find((category) => category.id === id);
}
