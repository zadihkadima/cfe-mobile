/**
 * Declares CSS side-effect imports.
 *
 * NativeWind's Metro transformer turns `import "./global.css"` into style
 * registration at build time, but TypeScript has no knowledge of that and
 * rejects the import as an unresolved module. Declaring it here keeps the type
 * check honest rather than requiring a `@ts-expect-error` at the import site.
 */
declare module "*.css";
