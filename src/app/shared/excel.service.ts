import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';

@Injectable({
    providedIn: 'root'
})
export class ExcelService {

    constructor() { }

    async exportToExcel(data: any[], fileName: string, sheetName: string, columns: { header: string, key: string, width: number }[]) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        // Style header
        worksheet.columns = columns;

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '2563EB' } // Blue-600
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 25;

        // Add data
        worksheet.addRows(data);

        // Style data rows
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.alignment = { vertical: 'middle' };
                row.height = 20;

                // Alternate row colors
                if (rowNumber % 2 === 0) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'F8FAFC' }
                    };
                }
            }

            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'E2E8F0' } },
                    left: { style: 'thin', color: { argb: 'E2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
                    right: { style: 'thin', color: { argb: 'E2E8F0' } }
                };
            });
        });

        // Generate buffer and download
        const buffer = await workbook.xlsx.writeBuffer();
        this.saveAsExcelFile(buffer, fileName);
    }

    private saveAsExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}_${new Date().getTime()}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}
