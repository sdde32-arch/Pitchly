import React from 'react';
import { AppTheme } from '../../tokens';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  theme?: AppTheme;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}

export function Table<T extends { id?: string | number }>({
  columns,
  data,
  theme = 'dark',
  emptyMessage = 'No data available',
  className = '',
  onRowClick,
}: TableProps<T>) {
  const containerStyles = 'bg-surface-card border border-border-subtle text-text-primary';
  const headerStyles = 'bg-surface-raised border-b border-border-subtle text-text-secondary';
  const rowStyles = 'border-b border-border-subtle hover:bg-surface-raised/60 transition-colors';

  return (
    <div className={`w-full overflow-hidden rounded-[16px] shadow-sm ${containerStyles} ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Header Row */}
          <thead>
            <tr className={headerStyles}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`py-3.5 px-4 text-[10px] font-display font-extrabold uppercase tracking-[0.2em] ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 px-4 text-center text-xs font-medium text-text-secondary"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={`${rowStyles} ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => {
                    const content = col.render ? col.render(row) : (row as any)[col.key];
                    return (
                      <td
                        key={col.key}
                        className={`py-4 px-4 text-xs font-display font-bold ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
