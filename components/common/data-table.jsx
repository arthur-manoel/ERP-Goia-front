'use client'
import { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Download, ChevronLeft, ChevronRight, ListFilter, X } from 'lucide-react'
import EmptyState from './empty-state'

export default function DataTable({ data = [], columns = [], searchable = true, searchKeys = [], pageSize = 10, rowClass, extraFilter, onRowClick }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [columnFilters, setColumnFilters] = useState({})

  const filterableColumns = useMemo(() => columns.filter(column => {
    if (column.filterable === false || ['a', 'actions'].includes(column.key)) return false
    return data.some(row => row[column.key] !== null && row[column.key] !== undefined && typeof row[column.key] !== 'object')
  }), [columns, data])
  const optionsFor = key => Array.from(new Set(data.map(row => String(row[key] ?? '')).filter(Boolean))).sort((a,b)=>a.localeCompare(b, 'pt-BR', { numeric: true }))

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return data.filter(row => {
      const matchesSearch = !query || (searchKeys.length ? searchKeys : Object.keys(row)).some(k => String(row[k] ?? '').toLowerCase().includes(q))
      const matchesColumns = Object.entries(columnFilters).every(([key, value]) => !value || String(row[key] ?? '') === value)
      return matchesSearch && matchesColumns
    })
  }, [data, query, searchKeys, columnFilters])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const exportCsv=()=>{const visible=columns.filter(c=>!['a','actions'].includes(c.key));const escape=value=>`"${String(value??'').replace(/"/g,'""')}"`;const csv='\ufeff'+[visible.map(c=>escape(c.label)).join(';'),...filtered.map(row=>visible.map(c=>escape(row[c.key])).join(';'))].join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`exportacao-${new Date().toISOString().slice(0,10)}.csv`;link.click();URL.revokeObjectURL(url)}

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 border-b border-border">
        {searchable && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Buscar…" className="pl-8 bg-secondary/40 border-border" />
          </div>
        )}
        <div className="flex items-center gap-2 md:ml-auto">
          {extraFilter}
          {filterableColumns.length > 0 && <Button variant={showFilters ? 'secondary' : 'outline'} size="sm" className="gap-2" onClick={() => setShowFilters(v => !v)}><ListFilter className="h-3.5 w-3.5"/>Filtros</Button>}
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv} disabled={!filtered.length}><Download className="h-3.5 w-3.5" />Exportar CSV</Button>
        </div>
      </div>
      {showFilters && <div className="flex flex-wrap gap-2 p-3 border-b border-border bg-secondary/15">
        {filterableColumns.map(column => <div key={column.key} className="w-44"><Select value={columnFilters[column.key] || '__all__'} onValueChange={value => {setColumnFilters(prev => ({...prev,[column.key]:value==='__all__'?'':value}));setPage(1)}}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder={column.label}/></SelectTrigger><SelectContent><SelectItem value="__all__">Todos: {column.label}</SelectItem>{optionsFor(column.key).map(value=><SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>)}
        {Object.values(columnFilters).some(Boolean) && <Button variant="ghost" size="sm" onClick={()=>{setColumnFilters({});setPage(1)}}><X className="h-3.5 w-3.5 mr-1"/>Limpar</Button>}
      </div>}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              {columns.map(c => (
                <TableHead key={c.key} className={c.className}>{c.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : pageData.map((row, i) => (
              <TableRow key={row.id ?? i} onClick={() => onRowClick?.(row)} className={`border-border ${onRowClick ? 'cursor-pointer hover:bg-secondary/50' : ''} ${rowClass ? rowClass(row) : ''}`}>
                {columns.map(c => (
                  <TableCell key={c.key} className={c.cellClass}>
                    {c.render ? c.render(row) : row[c.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground">
        <div>Mostrando {pageData.length} de {filtered.length} registros</div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>{currentPage} / {pageCount}</span>
          <Button variant="ghost" size="sm" disabled={currentPage === pageCount} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
