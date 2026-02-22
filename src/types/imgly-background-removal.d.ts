/**
 * Type declaration for @imgly/background-removal-node.
 * Allows the project to compile when the package is pruned on Vercel (postinstall removes it).
 */
declare module '@imgly/background-removal-node' {
  export function removeBackground(input: Buffer | Blob): Promise<Blob>;
}
