// Tipos para pdf-parse
declare module 'pdf-parse/index.js' {
  function pdfParse(buffer: Buffer): Promise<{
    text: string;
    numpages: number;
    info: any;
    metadata: any;
  }>;
  export = pdfParse;
}
