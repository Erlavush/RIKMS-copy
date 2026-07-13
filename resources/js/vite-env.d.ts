/// <reference types="vite/client" />

declare module "figma:asset/*" {
    const source: string;
    export default source;
}
