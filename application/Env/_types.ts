// @ts-ignore
declare type HashMap<T> = {
    [propName: string]: T
};

// Сломает переходы в IDE по ctrl+click
// @ts-ignore
declare module "json!*" {
    const json: object;
    // @ts-ignore
    export = json;
}

// @ts-ignore
declare module "wml!*" {
    const value: any;
    // @ts-ignore
    export default value;
}

// @ts-ignore
declare module "tmpl!*" {
    const value: any;
    // @ts-ignore
    export default value;
}

// @ts-ignore
declare module "css!*" {
    const value: string;
    // @ts-ignore
    export default value;
}

// @ts-ignore
declare module "i18n!*" {
    const value: void;
    // @ts-ignore
    export default value;
}

// @ts-ignore
declare let rk: (key: string, ctx?: string | number, num?: number) => string;

// @ts-ignore
interface ExtWindow extends Window {
    wsConfig: any;
    chrome: any;
}

// @ts-ignore
interface ExtDocument extends Document {
    documentMode: number;
}

// @ts-ignore
interface ExtHTMLDivElement extends HTMLDivElement {
    mozRequestFullScreen(): void;
    webkitRequestFullscreen(): void;
    onmousewheel: ((this: HTMLElement, ev: WheelEvent) => any) | null;
}