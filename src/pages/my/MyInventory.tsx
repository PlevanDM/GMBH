import { useCallback, useMemo, useState } from 'react'
import type { ColumnMapping, InventoryBatch } from '../../types/inventory'
import { DEFAULT_MAPPING } from '../../types/inventory'
import { useInventory } from '../../store/inventoryStore'
import { useSellerLocale } from '../../i18n/SellerLocaleContext'
import { IconUpload, IconFileText } from '../../components/CabinetIcons'
import {
  parseInventoryFile,
  parseInventoryFromGoogleSheetsUrl,
  suggestMapping,
  mapRowsToItems,
  analyzeMappingQuality,
  type ParsedFile,
  type MappingAnalysis,
} from '../../utils/parseInventoryFile'
import type { InventoryStatus } from '../../types/inventory'
import { uploadInventoryFile, fetchGoogleSheetsCsv } from '../../api/myApi'
import { exportInventoryToExcel } from '../../utils/exportInventory'
import { estimatePrice, parseDeviceFromQuery } from '../../utils/priceEstimator'
import {
  getCategories,
  getBrands,
  getProcessors,
  getLocations,
  getConditionGrades,
  getYears,
  CONDITION_LABELS as CATALOG_CONDITION_LABELS,
} from '../../data/catalogs'

function batchLabel(b: InventoryBatch): string {
  return `${b.country} · ${b.date} · ${b.supplier}`
}

export default function MyInventory() {
  const { t, locale } = useSellerLocale()
  const {
    items,
    batches,
    lastUpdated,
    addItems,
    updateItem,
    updateItems,
    removeItem,
    removeItems,
    addBatch,
    removeBatch,
    getBatchById,
    clearAll,
  } = useInventory()

  const [file, setFile] = useState<ParsedFile | null>(null)
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [mapping, setMapping] = useState<ColumnMapping>(DEFAULT_MAPPING)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkPriceChange, setBulkPriceChange] = useState<string>('')

  const [importBatchMode, setImportBatchMode] = useState<'existing' | 'new'>('new')
  const [importBatchId, setImportBatchId] = useState<string>('')
  const [newBatchCountry, setNewBatchCountry] = useState('')
  const [newBatchDate, setNewBatchDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [newBatchSource, setNewBatchSource] = useState('')
  const [newBatchSupplier, setNewBatchSupplier] = useState('')
  const [newBatchNotes, setNewBatchNotes] = useState('')

  const [filterBatchId, setFilterBatchId] = useState<string>('')
  const [filterCountry, setFilterCountry] = useState<string>('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterIssue, setFilterIssue] = useState<'none' | 'no-price' | 'no-specs'>('none')
  const [apiFile, setApiFile] = useState<File | null>(null)
  const [apiStatus, setApiStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('')
  const [googleSheetsLoading, setGoogleSheetsLoading] = useState(false)

  // Mapping quality analysis
  const mappingAnalysis: MappingAnalysis | null = useMemo(
    () => file ? analyzeMappingQuality(mapping, file.headers) : null,
    [file, mapping],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (!f) return
      setError(null)
      parseInventoryFile(f)
        .then((parsed) => {
          setFile(parsed)
          setSelectedSheet(parsed.sheetNames[0] ?? '')
          setMapping(suggestMapping(parsed.headers))
        })
            .catch((err) => setError(err instanceof Error ? err.message : t.dashboard.importError))
      e.target.value = ''
    },
    []
  )

  const clearFile = useCallback(() => {
    setFile(null)
    setSelectedSheet('')
    setMapping(DEFAULT_MAPPING)
    setError(null)
  }, [])

  const handleLoadGoogleSheets = useCallback(() => {
    const url = googleSheetsUrl.trim()
    if (!url) {
      setError(t.inventory.import.googlePlaceholder)
      return
    }
    setError(null)
    setGoogleSheetsLoading(true)
    parseInventoryFromGoogleSheetsUrl(url, fetchGoogleSheetsCsv)
      .then((parsed) => {
        setFile(parsed)
        setSelectedSheet(parsed.sheetNames[0] ?? '')
        setMapping(suggestMapping(parsed.headers))
        setGoogleSheetsUrl('')
      })
          .catch((err) => setError(err instanceof Error ? err.message : t.dashboard.importError))
      .finally(() => setGoogleSheetsLoading(false))
  }, [googleSheetsUrl, t])

  const rows = file && selectedSheet ? file.rowsBySheet[selectedSheet] ?? [] : []
  const previewRows = rows.slice(0, 15)

  const handleImport = useCallback(() => {
    if (!file || !selectedSheet) return
    if (!mapping.description) {
      setError(t.inventory.columns.description)
      return
    }
    if (importBatchMode === 'existing' && !importBatchId) {
      setError(t.inventory.import.selectBatch)
      return
    }
    if (importBatchMode === 'new' && (!newBatchCountry.trim() || !newBatchSupplier.trim())) {
      setError(`${t.inventory.import.country}, ${t.inventory.import.supplier}`)
      return
    }
    setImporting(true)
    setError(null)
    try {
      let batchId: string
      if (importBatchMode === 'new') {
        const batch = addBatch({
          country: newBatchCountry.trim(),
          date: newBatchDate,
          source: newBatchSource.trim(),
          supplier: newBatchSupplier.trim(),
          notes: newBatchNotes.trim() || undefined,
        })
        batchId = batch.id
      } else {
        batchId = importBatchId
      }
      const toImport = mapRowsToItems(rows, mapping).map((it) => ({ ...it, batchId }))
      addItems(toImport)
      clearFile()
      setNewBatchCountry('')
      setNewBatchSource('')
      setNewBatchSupplier('')
      setNewBatchNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t.dashboard.importError)
    } finally {
      setImporting(false)
    }
  }, [
    file,
    selectedSheet,
    rows,
    mapping,
    importBatchMode,
    importBatchId,
    newBatchCountry,
    newBatchDate,
    newBatchSource,
    newBatchSupplier,
    newBatchNotes,
    addBatch,
    addItems,
    clearFile,
  ])

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (filterBatchId && it.batchId !== filterBatchId) return false
      const batch = it.batchId ? getBatchById(it.batchId) : undefined
      if (filterCountry && batch?.country !== filterCountry) return false
      if (filterSupplier.trim() && !batch?.supplier?.toLowerCase().includes(filterSupplier.trim().toLowerCase()))
        return false

      if (filterIssue === 'no-price') {
        if (it.price && it.price > 0) return false
      }
      if (filterIssue === 'no-specs') {
        const isLaptop = it.category?.toLowerCase().includes('laptop') || !it.category
        if (!isLaptop || (it.processor && it.ram_raw && it.storage_raw)) return false
      }

      return true
    })
  }, [items, filterBatchId, filterCountry, filterSupplier, filterIssue, getBatchById])

  const uniqueCountries = useMemo(
    () => Array.from(new Set(batches.map((b) => b.country).filter(Boolean))).sort(),
    [batches]
  )
  const catalogCategories = getCategories()
  const uniqueCategories = useMemo(
    () => Array.from(new Set(items.map((it) => it.category).filter(Boolean))).sort() as string[],
    [items]
  )
  const categoryOptions = useMemo(
    () => Array.from(new Set([...catalogCategories, ...uniqueCategories])),
    [catalogCategories, uniqueCategories]
  )
  const conditionOptions = getConditionGrades()
  const brandOptions = getBrands()
  const processorOptions = getProcessors()

  const inventoryStats = useMemo(() => {
    let totalItems = 0
    let totalQuantity = 0
    let missingPrices = 0
    let missingSpecs = 0
    let totalPriceValue = 0
    let totalMarketWholesale = 0

    items.forEach(it => {
      totalItems++
      const qty = it.quantity || 1
      totalQuantity += qty

      if (!it.price || it.price <= 0) missingPrices++

      const isLaptop = it.category?.toLowerCase().includes('laptop') || !it.category
      if (isLaptop && (!it.processor || !it.ram_raw || !it.storage_raw)) {
        missingSpecs++
      }

      totalPriceValue += (it.price || 0) * qty

      if (isLaptop) {
        const device = parseDeviceFromQuery(it.brand || '', it.description || '')
        const wholesale = estimatePrice(device, 'wholesale').mid
        totalMarketWholesale += wholesale * qty
      }
    })

    return { totalItems, totalQuantity, missingPrices, missingSpecs, totalPriceValue, totalMarketWholesale }
  }, [items])

  const locationOptions = getLocations()
  const yearOptions = getYears()

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(locale)
  const formatDateShort = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale)

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map(it => it.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkStatusChange = (status: InventoryStatus) => {
    updateItems(Array.from(selectedIds), { status })
    setSelectedIds(new Set())
  }

  const handleBulkPriceAdjust = () => {
    const pct = parseFloat(bulkPriceChange)
    if (Number.isNaN(pct)) return

    // We need to apply this per-item because prices are different
    Array.from(selectedIds).forEach(id => {
      const it = items.find(x => x.id === id)
      if (it && it.price) {
        const newPrice = Math.round(it.price * (1 + pct / 100) * 100) / 100
        updateItem(id, { price: newPrice })
      }
    })
    setBulkPriceChange('')
    setSelectedIds(new Set())
  }

  const handleBulkDelete = () => {
    if (!window.confirm(t.inventory.bulk.deleteConfirm.replace('{{count}}', selectedIds.size.toString()))) return
    removeItems(Array.from(selectedIds))
    setSelectedIds(new Set())
  }

  const handleBulkBatchChange = (batchId: string) => {
    const finalBatchId = batchId === 'none' ? undefined : batchId
    updateItems(Array.from(selectedIds), { batchId: finalBatchId })
    setSelectedIds(new Set())
  }

  const handleExport = () => {
    const toExport = selectedIds.size > 0
      ? items.filter(it => selectedIds.has(it.id))
      : filteredItems

    exportInventoryToExcel(toExport, batches, `inventory_export_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const handleBulkMarketSync = () => {
    if (!window.confirm(t.inventory.bulk.syncConfirm.replace('{{count}}', selectedIds.size.toString()))) return

    Array.from(selectedIds).forEach(id => {
      const it = items.find(x => x.id === id)
      if (it) {
        const device = parseDeviceFromQuery(it.brand || '', it.description || '')
        const wholesale = estimatePrice(device, 'wholesale').mid
        if (wholesale > 0) {
          updateItem(id, { price: wholesale })
        }
      }
    })
    setSelectedIds(new Set())
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-primary">{t.inventory.title}</h2>

      {items.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <button
            onClick={() => setFilterIssue('none')}
            className={`text-left rounded-xl border p-4 shadow-sm transition-all ${filterIssue === 'none' ? 'border-primary ring-1 ring-primary/20 bg-white' : 'border-neutral-200 bg-neutral-50/50 opacity-80'}`}
          >
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t.inventory.itemsTitle}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{inventoryStats.totalItems}</p>
            <p className="text-xs text-neutral-500">{inventoryStats.totalQuantity} {t.dashboard.items}</p>
          </button>
          <button
            onClick={() => setFilterIssue('no-price')}
            className={`text-left rounded-xl border p-4 shadow-sm transition-all ${filterIssue === 'no-price' ? 'border-amber-400 ring-1 ring-amber-400/20 bg-white' : inventoryStats.missingPrices > 0 ? 'border-amber-200 bg-amber-50' : 'border-neutral-200 bg-neutral-50/50 opacity-80'}`}
          >
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t.inventory.health.warning}</p>
            <p className={`mt-1 text-2xl font-bold ${inventoryStats.missingPrices > 0 ? 'text-amber-700' : 'text-primary'}`}>{inventoryStats.missingPrices}</p>
            <p className="text-xs text-neutral-500">{t.inventory.health.warning}</p>
          </button>
          <button
            onClick={() => setFilterIssue('no-specs')}
            className={`text-left rounded-xl border p-4 shadow-sm transition-all ${filterIssue === 'no-specs' ? 'border-blue-400 ring-1 ring-blue-400/20 bg-white' : inventoryStats.missingSpecs > 0 ? 'border-blue-200 bg-blue-50' : 'border-neutral-200 bg-neutral-50/50 opacity-80'}`}
          >
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t.inventory.health.missingSpecs}</p>
            <p className={`mt-1 text-2xl font-bold ${inventoryStats.missingSpecs > 0 ? 'text-blue-700' : 'text-primary'}`}>{inventoryStats.missingSpecs}</p>
            <p className="text-xs text-neutral-500">{t.inventory.health.missingSpecs}</p>
          </button>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t.dashboard.valueKpi}</p>
            <p className="mt-1 text-2xl font-bold text-primary">€{inventoryStats.totalPriceValue.toLocaleString(locale)}</p>
            <p className="text-xs text-neutral-500">{t.settings.currency}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t.scout.wholesalePrice}</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">€{inventoryStats.totalMarketWholesale.toLocaleString(locale)}</p>
            <p className="text-xs text-emerald-600">Smart Engine</p>
          </div>
        </div>
      )}

      <p className="mt-2 text-neutral-600 leading-relaxed">
        {t.scout.tip}. {t.inventory.uploadTitle} (Excel/CSV).
      </p>
      {lastUpdated && (
        <p className="mt-2 text-sm text-neutral-500">
          {t.inventory.lastUpdated}: <strong>{formatDate(lastUpdated)}</strong>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={handleExport}
          className="rounded-lg border border-accent bg-white px-4 py-2 text-sm font-medium text-accent hover:bg-accent/5 flex items-center gap-2"
        >
          <IconFileText className="w-4 h-4" />
          {t.inventory.export.button.replace('{{target}}', selectedIds.size > 0 ? t.inventory.export.selected.replace('{{count}}', selectedIds.size.toString()) : t.inventory.export.all)}
        </button>

        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          disabled={items.length === 0 && batches.length === 0}
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.inventory.clearAll}
        </button>
        <span className="text-sm text-neutral-500">
          {t.inventory.clearConfirm}
        </span>
      </div>
      {showClearConfirm && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50/80 p-4">
          <p className="text-sm font-medium text-red-800">
            {t.inventory.clearConfirm} ({items.length} items, {batches.length} batches)
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                clearAll()
                setShowClearConfirm(false)
                setFilterBatchId('')
                setFilterCountry('')
                setFilterSupplier('')
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-sm font-semibold text-primary">{t.inventory.import.googleTitle}</h3>
        <p className="mt-1 text-xs text-neutral-500">
          {t.inventory.import.googleDesc}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="url"
            placeholder={t.inventory.import.googlePlaceholder}
            value={googleSheetsUrl}
            onChange={(e) => setGoogleSheetsUrl(e.target.value)}
            className="min-w-[280px] flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400"
          />
          <button
            type="button"
            onClick={handleLoadGoogleSheets}
            disabled={googleSheetsLoading}
            className="btn-secondary text-sm py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {googleSheetsLoading ? t.inventory.import.loading : t.inventory.import.load}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-sm font-semibold text-primary">{t.inventory.import.apiTitle}</h3>
        <p className="mt-1 text-xs text-neutral-500">{t.inventory.import.apiDesc}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              const f = e.target.files?.[0]
              setApiFile(f ?? null)
              setApiStatus('idle')
            }}
            className="text-sm text-neutral-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border file:border-neutral-300 file:bg-white file:text-primary"
          />
          <button
            type="button"
            onClick={async () => {
              if (!apiFile) return
              setApiStatus('uploading')
              const res = await uploadInventoryFile(apiFile)
              setApiStatus(res != null ? 'done' : 'error')
            }}
            disabled={!apiFile || apiStatus === 'uploading'}
            className="btn-secondary text-sm py-2 px-3 rounded-lg disabled:opacity-50"
          >
            {apiStatus === 'uploading' ? t.inventory.import.loading : t.inventory.import.apiButton}
          </button>
          {apiStatus === 'done' && <span className="text-sm text-green-600">{t.inventory.import.apiDone}</span>}
          {apiStatus === 'error' && <span className="text-sm text-red-600">{t.inventory.import.apiError}</span>}
        </div>
      </div>

      {/* Партии: список */}
      {batches.length > 0 && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="text-sm font-semibold text-primary">{t.inventory.batchesTitle} ({batches.length})</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-600">
                    <th className="px-3 py-2">{t.inventory.import.country}</th>
                    <th className="px-3 py-2">{t.inventory.import.date}</th>
                    <th className="px-3 py-2">{t.inventory.import.source}</th>
                    <th className="px-3 py-2">{t.inventory.import.supplier}</th>
                    <th className="px-3 py-2">{t.inventory.itemsTitle}</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-3 py-2">{b.country}</td>
                    <td className="px-3 py-2">{formatDateShort(b.date)}</td>
                    <td className="px-3 py-2">{b.source || '—'}</td>
                    <td className="px-3 py-2">{b.supplier}</td>
                    <td className="px-3 py-2">{items.filter((i) => i.batchId === b.id).length}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeBatch(b.id)}
                        className="text-red-600 hover:underline text-xs"
                      >
                          {t.users.table.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload zone */}
      <div className="mt-6 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-6">
        {!file ? (
          <label className="flex cursor-pointer flex-col items-center gap-3 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={handleFileChange}
            />
            <span className="btn-primary inline-flex items-center gap-2">
              <IconUpload className="shrink-0" />
              {t.inventory.import.chooseFile}
            </span>
            <span className="text-sm text-neutral-500">.xlsx, .xls, .csv</span>
          </label>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm font-medium text-primary">{t.inventory.import.fileSelected}</span>
              <button type="button" onClick={clearFile} className="text-sm text-neutral-500 hover:text-primary">
                {t.inventory.bulk.reset}
              </button>
            </div>
            {file.sheetNames.length > 1 && (
              <div className="mt-3">
                <label className="text-sm text-neutral-600">{t.inventory.import.sheet}</label>
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="ml-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
                >
                  {file.sheetNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-primary">{t.inventory.import.batchTitle}</h4>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="batchMode"
                    checked={importBatchMode === 'new'}
                    onChange={() => setImportBatchMode('new')}
                  />
                  <span className="text-sm">{t.inventory.import.newBatch}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="batchMode"
                    checked={importBatchMode === 'existing'}
                    onChange={() => setImportBatchMode('existing')}
                  />
                  <span className="text-sm">{t.inventory.import.existingBatch}</span>
                </label>
              </div>
              {importBatchMode === 'new' ? (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-neutral-500">{t.inventory.import.country}</label>
                    <input
                      type="text"
                      value={newBatchCountry}
                      onChange={(e) => setNewBatchCountry(e.target.value)}
                      placeholder="DE, PL, UA..."
                      className="mt-0.5 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">{t.inventory.import.date}</label>
                    <input
                      type="date"
                      value={newBatchDate}
                      onChange={(e) => setNewBatchDate(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">{t.inventory.import.source}</label>
                    <input
                      type="text"
                      value={newBatchSource}
                      onChange={(e) => setNewBatchSource(e.target.value)}
                      placeholder={t.inventory.import.sourcePlaceholder}
                      className="mt-0.5 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">{t.inventory.import.supplier}</label>
                    <input
                      type="text"
                      value={newBatchSupplier}
                      onChange={(e) => setNewBatchSupplier(e.target.value)}
                      placeholder={t.inventory.import.supplierPlaceholder}
                      className="mt-0.5 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-neutral-500">{t.inventory.import.notes}</label>
                    <input
                      type="text"
                      value={newBatchNotes}
                      onChange={(e) => setNewBatchNotes(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <select
                    value={importBatchId}
                    onChange={(e) => setImportBatchId(e.target.value)}
                    className="w-full max-w-md rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">{t.inventory.import.selectBatch}</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{batchLabel(b)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Mapping analysis panel */}
            {mappingAnalysis && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 mb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {mappingAnalysis.detectedType}
                  </span>
                  <span className="text-xs text-blue-600">
                    {t.dashboard.mappedColumns.replace('{{count}}', mappingAnalysis.mappedCount.toString()).replace('{{total}}', file.headers.length.toString())}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    mappingAnalysis.confidence >= 70
                      ? 'bg-green-100 text-green-700'
                      : mappingAnalysis.confidence >= 40
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {t.inventory.import.mappingConfidence.replace('{{percent}}', mappingAnalysis.confidence.toString())}
                  </span>
                </div>
                {mappingAnalysis.suggestions.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {mappingAnalysis.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-blue-700 flex items-start gap-1">
                        <span className="text-blue-400 mt-0.5">•</span> {s}
                      </li>
                    ))}
                  </ul>
                )}
                {mappingAnalysis.unmappedHeaders.length > 0 && (
                  <div className="mt-2 text-xs text-blue-600">
                    <span className="font-medium">{t.inventory.import.unmapped} </span>
                    {mappingAnalysis.unmappedHeaders.join(', ')}
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-neutral-600">
              {t.inventory.import.mappingDesc}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  { key: 'description', label: t.inventory.columns.description, required: true },
                  { key: 'brand', label: t.inventory.columns.brand },
                  { key: 'category', label: t.inventory.columns.category },
                  { key: 'condition', label: t.inventory.columns.condition },
                  { key: 'inventoryNumber', label: t.inventory.columns.invNo },
                  { key: 'serialNumber', label: t.inventory.columns.sn },
                  { key: 'sku', label: 'SKU' },
                  { key: 'price', label: t.inventory.columns.price },
                  { key: 'quantity', label: t.inventory.columns.qty },
                  { key: 'processor', label: t.inventory.columns.processor },
                  { key: 'ram', label: t.inventory.columns.ram },
                  { key: 'storage', label: t.inventory.columns.storage },
                  { key: 'gpu', label: t.inventory.columns.gpu },
                  { key: 'year', label: t.inventory.columns.year },
                  { key: 'batteryCycles', label: t.inventory.columns.cycles },
                  { key: 'batteryHealth', label: t.inventory.columns.health },
                  { key: 'status', label: t.inventory.columns.status },
                  { key: 'imageUrl', label: t.inventory.columns.photo },
                  { key: 'location', label: t.inventory.columns.location },
                  { key: 'notes', label: t.inventory.columns.notes },
                ] as { key: keyof ColumnMapping; label: string; required?: boolean }[]
              ).map(({ key, label, required }) => (
                <div key={key}>
                  <label className={`text-xs ${required ? 'text-red-600 font-medium' : 'text-neutral-500'}`}>
                    {label}{required ? ` (${t.inventory.import.required})` : ''}
                  </label>
                  <select
                    value={mapping[key]}
                    onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value }))}
                    className={`mt-0.5 w-full rounded-lg border px-2 py-1.5 text-sm ${
                      mapping[key]
                        ? 'border-green-300 bg-green-50/40'
                        : required
                          ? 'border-red-300 bg-red-50/30'
                          : 'border-neutral-300'
                    }`}
                  >
                    <option value="">{t.dashboard.notUse}</option>
                    {file.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-2 py-2 text-[11px] font-semibold text-neutral-500 w-8">#</th>
                    {file.headers.map((h) => {
                      const isMapped = Object.values(mapping).includes(h)
                      return (
                        <th
                          key={h}
                          className={`px-2 py-2 font-medium text-xs whitespace-nowrap ${isMapped ? 'text-green-700 bg-green-50/40' : 'text-neutral-500'}`}
                          title={isMapped ? t.dashboard.columnRecognized : t.dashboard.notLinked}
                        >
                          {h}
                          {isMapped && <span className="ml-1 text-green-500">&#10003;</span>}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td className="px-2 py-1.5 text-[11px] text-neutral-400 font-mono">{i + 1}</td>
                      {file.headers.map((h) => (
                        <td key={h} className="max-w-[200px] truncate px-2 py-1.5 text-xs text-neutral-600" title={String(row[h] ?? '')}>
                          {String(row[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-neutral-500">{t.dashboard.previewRows.replace('{{count}}', previewRows.length.toString()).replace('{{total}}', rows.length.toString())}</p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || !mapping.description}
                className="btn-primary disabled:opacity-50"
              >
                {importing ? t.inventory.import.loading : t.inventory.import.importButton.replace('{{count}}', rows.length.toString())}
              </button>
              <button type="button" onClick={clearFile} className="btn-secondary">
                {t.inventory.import.cancel}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters and table */}
      <div className="mt-8">
        <h3 className="text-base font-semibold text-primary">{t.inventory.itemsTitle} ({filteredItems.length}{items.length !== filteredItems.length ? ` ${t.common.of} ${items.length}` : ''})</h3>

        {items.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            <select
              value={filterBatchId}
              onChange={(e) => setFilterBatchId(e.target.value)}
              className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            >
              <option value="">{t.dashboard.allParties}</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{batchLabel(b)}</option>
              ))}
            </select>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            >
              <option value="">{t.dashboard.allCountries}</option>
              {uniqueCountries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              placeholder={t.inventory.import.supplier}
              className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm w-40"
            />
            {(filterBatchId || filterCountry || filterSupplier.trim() || filterIssue !== 'none') && (
              <button
                type="button"
                onClick={() => {
                  setFilterBatchId('')
                  setFilterCountry('')
                  setFilterSupplier('')
                  setFilterIssue('none')
                }}
                className="text-sm text-neutral-500 hover:text-primary"
              >
                {t.dashboard.resetFilters}
              </button>
            )}
          </div>
        )}
        {filteredItems.length === 0 ? (
          <div className="mt-4 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-500">
            {items.length === 0
              ? t.dashboard.noPositions
              : t.dashboard.noFilteredPositions}
          </div>
        ) : (
          <>
          <datalist id="inventory-brands-list">
            {brandOptions.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
          <datalist id="inventory-categories-list">
            {categoryOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <datalist id="inventory-conditions-list">
            {conditionOptions.map((c) => (
              <option key={c} value={`${c} — ${CATALOG_CONDITION_LABELS[c] ?? c}`} />
            ))}
          </datalist>
          <datalist id="inventory-processors-list">
            {processorOptions.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <datalist id="inventory-locations-list">
            {locationOptions.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          <datalist id="inventory-years-list">
            {yearOptions.map((y) => (
              <option key={y} value={y} />
            ))}
          </datalist>
          {selectedIds.size > 0 && (
            <div className="sticky top-0 z-20 mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-accent">{t.inventory.bulk.selected.replace('{{count}}', selectedIds.size.toString())}</span>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-neutral-500 hover:text-primary underline"
                >
                  {t.inventory.bulk.reset}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 border-r border-neutral-200 pr-3 mr-1">
                  <select
                    onChange={(e) => handleBulkStatusChange(e.target.value as InventoryStatus)}
                    className="rounded border border-neutral-300 px-2 py-1.5 text-xs bg-white"
                    defaultValue=""
                  >
                    <option value="" disabled>{t.inventory.bulk.changeStatus}</option>
                    <option value="available">{t.inventory.statuses.available}</option>
                    <option value="sold">{t.inventory.statuses.sold}</option>
                    <option value="reserved">{t.inventory.statuses.reserved}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 border-r border-neutral-200 pr-3 mr-1">
                  <select
                    onChange={(e) => handleBulkBatchChange(e.target.value)}
                    className="rounded border border-neutral-300 px-2 py-1.5 text-xs bg-white max-w-[150px]"
                    defaultValue=""
                  >
                    <option value="" disabled>{t.inventory.bulk.changeBatch}</option>
                    <option value="none">{t.inventory.bulk.noBatch}</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.country} {b.supplier}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 border-r border-neutral-200 pr-3 mr-1">
                  <input
                    type="number"
                    placeholder="±%"
                    value={bulkPriceChange}
                    onChange={(e) => setBulkPriceChange(e.target.value)}
                    className="w-16 rounded border border-neutral-300 px-2 py-1.5 text-xs bg-white"
                  />
                  <button
                    onClick={handleBulkPriceAdjust}
                    disabled={!bulkPriceChange}
                    className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    {t.inventory.bulk.adjustPrice}
                  </button>
                </div>

                <button
                  onClick={handleBulkMarketSync}
                  className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  {t.inventory.bulk.syncMarket}
                </button>

                <button
                  onClick={handleBulkDelete}
                  className="rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  {t.inventory.bulk.deleteSelected}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full min-w-[1550px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-3 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-neutral-400"
                    />
                  </th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.description}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.brand}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.category}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.condition}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.invNo}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.sn}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.photo}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.processor}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700 text-[11px]">CPU (norm)</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.ram}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700 text-[11px]">RAM (GB)</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.storage}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700 text-[11px]">Disc (GB)</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.gpu}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.year}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.cycles}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.health}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.price}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700 text-[11px] text-emerald-700">Market Wholesale</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.qty}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.batch}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.location}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.notes}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.status}</th>
                  <th className="px-3 py-2 font-semibold text-neutral-700">{t.inventory.columns.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((it) => (
                    <tr key={it.id} className={`border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 ${selectedIds.has(it.id) ? 'bg-accent/5' : ''}`}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(it.id)}
                          onChange={() => toggleSelect(it.id)}
                          className="rounded border-neutral-400"
                        />
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-2 text-neutral-700" title={it.description}>
                        {editingId === it.id ? (
                          <input
                            defaultValue={it.description}
                            onBlur={(e) => {
                              updateItem(it.id, { description: e.target.value })
                              setEditingId(null)
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget.blur())}
                            className="w-full rounded border border-neutral-300 px-2 py-1 text-xs"
                          />
                        ) : (
                          <span
                            className="cursor-pointer underline decoration-dotted"
                            onClick={() => setEditingId(it.id)}
                          >
                            {it.description}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          list="inventory-brands-list"
                          value={it.brand ?? ''}
                          onChange={(e) => updateItem(it.id, { brand: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[80px] max-w-[110px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          list="inventory-categories-list"
                          value={it.category ?? ''}
                          onChange={(e) => updateItem(it.id, { category: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[80px] max-w-[110px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          list="inventory-conditions-list"
                          value={it.condition ?? ''}
                          onChange={(e) => updateItem(it.id, { condition: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[50px] max-w-[80px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={it.inventoryNumber ?? ''}
                          onChange={(e) => updateItem(it.id, { inventoryNumber: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[70px] max-w-[100px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={it.serialNumber ?? ''}
                          onChange={(e) => updateItem(it.id, { serialNumber: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[70px] max-w-[100px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="url"
                          value={it.imageUrl ?? ''}
                          onChange={(e) => updateItem(it.id, { imageUrl: e.target.value || undefined })}
                          placeholder="URL"
                          className="w-full min-w-[80px] max-w-[140px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          list="inventory-processors-list"
                          value={it.processor ?? ''}
                          onChange={(e) => updateItem(it.id, { processor: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[80px] max-w-[120px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={it.laptopCpuFamily ?? ''}
                          onChange={(e) => updateItem(it.id, { laptopCpuFamily: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[60px] max-w-[80px] rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-[10px]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={it.ram_raw ?? ''}
                          onChange={(e) => updateItem(it.id, { ram_raw: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[60px] max-w-[90px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={it.laptopRamGb ?? ''}
                          onChange={(e) => updateItem(it.id, { laptopRamGb: parseInt(e.target.value) || undefined })}
                          placeholder="—"
                          className="w-full min-w-[40px] max-w-[60px] rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-[10px]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={it.storage_raw ?? ''}
                          onChange={(e) => updateItem(it.id, { storage_raw: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[60px] max-w-[90px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={it.laptopStorageGb ?? ''}
                          onChange={(e) => updateItem(it.id, { laptopStorageGb: parseInt(e.target.value) || undefined })}
                          placeholder="—"
                          className="w-full min-w-[50px] max-w-[70px] rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-[10px]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={it.gpu_raw ?? ''}
                          onChange={(e) => updateItem(it.id, { gpu_raw: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[60px] max-w-[100px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          list="inventory-years-list"
                          value={it.year ?? ''}
                          onChange={(e) => updateItem(it.id, { year: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[50px] max-w-[70px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={it.batteryCycles ?? ''}
                          onChange={(e) => updateItem(it.id, { batteryCycles: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[50px] max-w-[70px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={it.batteryHealth ?? ''}
                          onChange={(e) => updateItem(it.id, { batteryHealth: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[50px] max-w-[70px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.price ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            const n = v === '' ? undefined : parseFloat(v)
                            updateItem(it.id, { price: n != null && !Number.isNaN(n) ? n : undefined })
                          }}
                          placeholder="—"
                          className={`w-full min-w-[70px] max-w-[90px] rounded border px-2 py-1 text-xs ${
                            it.price && it.category?.toLowerCase().includes('laptop')
                              ? (() => {
                                  const device = parseDeviceFromQuery(it.brand || '', it.description || '')
                                  const wholesale = estimatePrice(device, 'wholesale').mid
                                  if (wholesale > 0) {
                                    const diff = (it.price - wholesale) / wholesale
                                    if (Math.abs(diff) > 0.15) return 'border-red-300 bg-red-50'
                                    if (Math.abs(diff) > 0.08) return 'border-amber-300 bg-amber-50'
                                  }
                                  return 'border-neutral-300'
                                })()
                              : 'border-neutral-300'
                          }`}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs font-medium text-emerald-700">
                        {it.category?.toLowerCase().includes('laptop') || !it.category ? (
                          (() => {
                            const device = parseDeviceFromQuery(it.brand || '', it.description || '')
                            const wholesale = estimatePrice(device, 'wholesale').mid
                            return wholesale > 0 ? `€${wholesale.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '—'
                          })()
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={it.quantity ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            const n = v === '' ? undefined : parseInt(v, 10)
                            updateItem(it.id, { quantity: n != null && !Number.isNaN(n) ? n : undefined })
                          }}
                          placeholder="—"
                          className="w-full min-w-[50px] max-w-[70px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={it.batchId ?? ''}
                          onChange={(e) => updateItem(it.id, { batchId: e.target.value || undefined })}
                          className="rounded border border-neutral-300 px-2 py-1 text-xs max-w-[140px]"
                        >
                          <option value="">—</option>
                          {batches.map((b) => (
                            <option key={b.id} value={b.id}>{batchLabel(b)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          list="inventory-locations-list"
                          value={it.location ?? ''}
                          onChange={(e) => updateItem(it.id, { location: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full min-w-[90px] max-w-[130px] rounded border border-neutral-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2 max-w-[140px]">
                        <input
                          value={it.notes ?? ''}
                          onChange={(e) => updateItem(it.id, { notes: e.target.value || undefined })}
                          placeholder="—"
                          className="w-full rounded border border-neutral-300 px-2 py-1 text-xs"
                          title={it.notes ?? ''}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={it.status}
                          onChange={(e) => updateItem(it.id, { status: e.target.value as InventoryStatus })}
                          className="rounded border border-neutral-300 px-2 py-1 text-xs"
                        >
                          {(['available', 'sold', 'reserved', 'unavailable'] as InventoryStatus[]).map((s) => (
                            <option key={s} value={s}>{t.inventory.statuses[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          {t.users.table.delete}
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </>
  )
}
