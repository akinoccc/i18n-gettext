declare module 'gettext-parser' {
  export const po: {
    parse: (buffer: Buffer) => any
    compile: (data: any) => Buffer
  }

  export const mo: {
    parse: (buffer: Buffer) => any
    compile: (data: any) => Buffer
  }
}
