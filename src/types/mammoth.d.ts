declare module 'mammoth' {
  export interface RawTextResult {
    value: string
    messages: Array<{
      type: string
      message: string
    }>
  }

  export interface ConvertOptions {
    arrayBuffer?: ArrayBuffer
    buffer?: Buffer
    path?: string
  }

  export function extractRawText(options: ConvertOptions): Promise<RawTextResult>
  export function convertToHtml(options: ConvertOptions): Promise<{ value: string; messages: unknown[] }>
}
