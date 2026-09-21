/**
 * Utility to trigger CSV download in browser for tabular financial data
 */
export function exportToCSV(
  arg1: string | Record<string, any>[],
  arg2?: string | string[],
  arg3?: (string | number)[][]
) {
  let filename = 'export';
  let headers: string[] = [];
  let rows: (string | number)[][] = [];

  if (Array.isArray(arg1)) {
    // Called as: exportToCSV(arrayOfObjects, filename)
    filename = typeof arg2 === 'string' ? arg2 : 'export';
    if (arg1.length === 0) return;
    headers = Object.keys(arg1[0]);
    rows = arg1.map((item) => headers.map((h) => item[h] ?? ''));
  } else {
    // Called as: exportToCSV(filename, headers, rows)
    filename = arg1;
    headers = Array.isArray(arg2) ? arg2 : [];
    rows = arg3 || [];
  }

  const csvContent = [
    headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
