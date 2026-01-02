// =====================================================
// COMPONENTE DE ENCABEZADO SORTEABLE PARA TABLAS
// =====================================================

import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortOrder = 'asc' | 'desc' | null;

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: string | null;
  currentOrder: SortOrder;
  onSort: (field: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort === field;
  
  return (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none',
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive ? (
          currentOrder === 'asc' ? (
            <ArrowUp className="w-4 h-4 text-primary-500" />
          ) : (
            <ArrowDown className="w-4 h-4 text-primary-500" />
          )
        ) : (
          <ArrowUpDown className="w-4 h-4 text-gray-300" />
        )}
      </div>
    </th>
  );
}

// Hook para manejar el estado del ordenamiento
export function useSort(defaultField?: string, defaultOrder: SortOrder = 'desc') {
  const [sortField, setSortField] = useState<string | null>(defaultField || null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultOrder);
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Ciclo: asc -> desc -> null -> asc
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      } else {
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  return { sortField, sortOrder, handleSort };
}

// Función para ordenar datos localmente
export function sortData<T>(
  data: T[],
  sortField: string | null,
  sortOrder: SortOrder,
  getFieldValue?: (item: T, field: string) => any
): T[] {
  if (!sortField || !sortOrder) return data;
  
  return [...data].sort((a, b) => {
    let valueA = getFieldValue ? getFieldValue(a, sortField) : (a as any)[sortField];
    let valueB = getFieldValue ? getFieldValue(b, sortField) : (b as any)[sortField];
    
    // Manejar valores null/undefined
    if (valueA == null && valueB == null) return 0;
    if (valueA == null) return sortOrder === 'asc' ? -1 : 1;
    if (valueB == null) return sortOrder === 'asc' ? 1 : -1;
    
    // Comparar strings sin distinción de mayúsculas
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }
    
    // Comparar fechas
    if (valueA instanceof Date && valueB instanceof Date) {
      valueA = valueA.getTime();
      valueB = valueB.getTime();
    }
    
    // Comparación estándar
    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}
