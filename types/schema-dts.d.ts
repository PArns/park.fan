/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'schema-dts' {
    export type Thing = any;
    export type WithContext<T> = T & { '@context': string };
    export type ThemePark = any;
    export type BreadcrumbList = any;
    export type Organization = any;
    export type Attraction = any;
}
