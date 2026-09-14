/**
 * Exports JSON data to downloadable CSV file with UTF-8 BOM for Microsoft Excel Russian compatibility
 */
export function exportToCSV(filename: string, rows: Record<string, any>[], columns: { key: string; title: string }[]) {
  if (!rows || rows.length === 0) {
    return;
  }

  const header = columns.map((c) => `"${c.title.replace(/"/g, '""')}"`).join(';');

  const csvRows = rows.map((row) => {
    return columns
      .map((col) => {
        let val = row[col.key];
        if (val === null || val === undefined) {
          val = '';
        } else if (typeof val === 'object') {
          val = JSON.stringify(val);
        } else {
          val = String(val);
        }
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(';');
  });

  const csvContent = '\uFEFF' + [header, ...csvRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
