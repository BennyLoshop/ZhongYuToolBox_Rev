declare module 'fabric' {
  export class Point {
    constructor(x: number, y: number)
    x: number
    y: number
  }

  export class PencilBrush {
    color: string
    width: number
    constructor(canvas: any)
  }

  export class Textbox {
    constructor(text: string, options?: any)
    [key: string]: any
    enterEditing(): void
    selectAll(): void
    set(key: string, value: any): void
  }

  export class Image {
    static fromURL(url: string, callback: (img: any) => void, options?: any): void
    [key: string]: any
  }

  export const util: { [key: string]: any }

  export class Canvas {
    [key: string]: any
    constructor(el: HTMLCanvasElement | string, options?: any)
    setZoom(zoom: number): void
    add(...objects: any[]): void
    remove(...objects: any[]): void
    getObjects(): any[]
    clear(): void
    renderAll(): void
    toJSON(propertiesToInclude?: string[]): any
    loadFromJSON(json: any, callback?: (...args: any[]) => void, reviver?: (...args: any[]) => void): void
    setWidth(value: number | string): void
    setHeight(value: number | string): void
    setBackgroundColor(color: string, callback: (...args: any[]) => void): void
    getActiveObject(): any
    discardActiveObject(): void
    on(event: string, handler: (...args: any[]) => void): void
    off(event?: string, handler?: (...args: any[]) => void): void
    freeDrawingBrush: any
    isDrawingMode: boolean
    selection: boolean
    skipTargetFind: boolean
    defaultCursor: string
    backgroundColor: string
    toDataURL(options?: any): string
    sendToBack(object: any): void
    bringToFront(object: any): void
    setActiveObject(object: any): void
    getPointer(e: any): any
    calcOffset(): void
    setViewportTransform(vpt: number[]): void
  }

  export const StaticCanvas: any
  export const Rect: any
  export const Circle: any
  export const Line: any
  export const Group: any

  /** fabric 运行时以命名导出 fabric 对象提供，兼容 `import { fabric } from 'fabric'` */
  export const fabric: {
    Canvas: typeof Canvas
    StaticCanvas: any
    Point: typeof Point
    PencilBrush: typeof PencilBrush
    Textbox: typeof Textbox
    Image: typeof Image
    Rect: any
    Circle: any
    Line: any
    Group: any
    util: typeof util
    [key: string]: any
  }

  export default fabric
}
