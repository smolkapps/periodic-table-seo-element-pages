/**
 * The study dataset is JavaScript outside this TypeScript project.
 * Article pages read its exported trend tables rather than copying the numbers.
 */
declare module "../../companion/src/data/elementsData.js" {
  export const ELECTRONEGATIVITY_BY_Z: Readonly<Record<number, number>>;
  export const IONIZATION_ENERGY_BY_Z: Readonly<Record<number, number>>;
  export const ATOMIC_RADIUS_BY_Z: Readonly<Record<number, number>>;
  export const AUFBAU_NOTES: Readonly<Record<string, string>>;
  export function parseShellsAndSubshells(electronConfig: string): {
    shells: number[];
    outerShellElectrons: number;
  };
}
