import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

export async function countPdfPages(pdfPath: string): Promise<number> {
    const pdfBuffer = fs.readFileSync(pdfPath);

    const pdfDoc = await PDFDocument.load(pdfBuffer);

    return pdfDoc.getPageCount();
}