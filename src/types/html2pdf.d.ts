declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[]
    filename?: string
    image?: { type: string; quality: number }
    html2canvas?: Record<string, unknown>
    jsPDF?: Record<string, unknown>
    [key: string]: unknown
  }

  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance
    from(source: HTMLElement | string): Html2PdfInstance
    save(): Promise<void>
    catch(callback: (error: Error) => void): Html2PdfInstance
    then(callback: () => void): Promise<void>
  }

  function html2pdf(): Html2PdfInstance

  export default html2pdf
}
