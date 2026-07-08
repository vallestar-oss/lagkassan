"use client";

type Props = {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  label?: string;
};

// Semicolon-delimited: Swedish-locale Excel opens semicolon CSVs directly
// without a manual "text to columns" import step.
function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[";\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function ExportCsvButton({ filename, headers, rows, label = "Exportera CSV" }: Props) {
  function handleExport() {
    const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(";"));
    // UTF-8 BOM so Excel renders å/ä/ö correctly instead of garbling them.
    const csv = "﻿" + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="text-xs font-medium text-text-muted hover:text-accent transition-colors underline decoration-dotted underline-offset-2"
    >
      {label}
    </button>
  );
}
