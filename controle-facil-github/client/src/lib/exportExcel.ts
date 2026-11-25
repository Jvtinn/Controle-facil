import * as XLSX from 'xlsx';

export type ExcelCell = string | number;

export function downloadExcel(filename: string, rows: ExcelCell[][], sheetName = 'Relatório') {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const columnCount = Math.max(...rows.map((row) => row.length), 1);
  worksheet['!cols'] = Array.from({ length: columnCount }, (_, columnIndex) => {
    const maxLength = Math.max(...rows.map((row) => String(row[columnIndex] ?? '').length), 10);
    return { wch: Math.min(Math.max(maxLength + 2, 12), 34) };
  });
  if (rows.length > 0) {
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let column = headerRange.s.c; column <= headerRange.e.c; column += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: column })];
      if (cell) cell.s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '176B55' } } };
    }
  }
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export function downloadImportTemplate() {
  const workbook = XLSX.utils.book_new();
  const products = XLSX.utils.aoa_to_sheet([
    ['Produto', 'Categoria', 'Unidade', 'Preço de Venda', 'Preço de Custo', 'Estoque Atual', 'Estoque Mínimo', 'Código de Barras', 'Fornecedor'],
    ['Exemplo: Arroz 5kg', 'Alimentos', 'pct', 28.9, 22, 10, 5, '7890000000000', 'Fornecedor Exemplo'],
    ['Preencha uma linha por produto', 'Alimentos', 'un', 0, 0, 0, 1, '', ''],
  ]);
  const suppliers = XLSX.utils.aoa_to_sheet([
    ['Fornecedor', 'Telefone / WhatsApp'],
    ['Fornecedor Exemplo', '(11) 99999-9999'],
    ['Preencha uma linha por fornecedor', ''],
  ]);
  [products, suppliers].forEach((sheet) => { sheet['!cols'] = [{ wch: 32 }, { wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 28 }]; });
  XLSX.utils.book_append_sheet(workbook, products, 'Produtos');
  XLSX.utils.book_append_sheet(workbook, suppliers, 'Fornecedores');
  XLSX.writeFile(workbook, 'modelo-importacao-controle-facil.xlsx');
}
