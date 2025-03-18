import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
const fontKit = require('@pdf-lib/fontkit')

interface FillData {
    companyName: string
    date: string
    page: string
    content: string
}

export async function fillPDFReport(
    fillData: FillData,
) {
    try {
        const fontPath = './app/ReportData/InterRegular.ttf'
        const templatePDFPath = './app/ReportData/ReportModel.pdf'
        const templateBytes = fs.readFileSync(templatePDFPath);
        const fontBytes = fs.readFileSync(fontPath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        pdfDoc.registerFontkit(fontKit);

        const page = pdfDoc.getPages()[0];

        const font = await pdfDoc.embedFont(fontBytes);

        page.drawText(fillData.companyName, {
            x: 74,
            y: 675,
            size: 18,
            font: font,
            color: rgb(1, 1, 1)
        });

        page.drawText(fillData.date, {
            x: 450,
            y: 783,
            size: 8,
            font: font,
            color: rgb(102 / 255, 102 / 255, 102 / 255)
        });

        page.drawText(fillData.page, {
            x: 518,
            y: 783,
            size: 8,
            font: font,
            color: rgb(102 / 255, 102 / 255, 102 / 255)
        });

        const lines = fillData.content.split('\n')
        let index = 0

        lines.forEach((line) => {
            page.drawText(line, {
                x: 66,
                y: 600 - (index * 20),
                size: 12,
                font: font,
                color: rgb(0, 0, 0)
            });
            index++
            console.log(index * 20)
        });

        const pdfBytes = await pdfDoc.save();
        const buffer = Buffer.from(pdfBytes);

        return buffer;
    } catch (error) {
        console.error('Error filling the PDF:', error);
        return false;
    }
}