import * as XLSX from 'xlsx'
import type { InventoryItem, InventoryBatch } from '../types/inventory'

export function exportInventoryToExcel(
  items: InventoryItem[],
  batches: InventoryBatch[],
  filename = 'inventory_export.xlsx'
) {
  try {
  const data = items.map((it) => {
    const batch = it.batchId ? batches.find((b) => b.id === it.batchId) : undefined

    return {
      'Description': it.description,
      'Brand': it.brand || '',
      'Category': it.category || '',
      'Condition': it.condition || '',
      'Inventory No': it.inventoryNumber || '',
      'Serial Number': it.serialNumber || '',
      'CPU': it.processor || '',
      'RAM': it.ram_raw || '',
      'Storage': it.storage_raw || '',
      'GPU': it.gpu_raw || '',
      'Year': it.year || '',
      'Battery Cycles': it.batteryCycles || '',
      'Battery Health': it.batteryHealth || '',
      'Price (EUR)': it.price || 0,
      'Quantity': it.quantity || 0,
      'Total Value': (it.price || 0) * (it.quantity || 0),
      'Status': it.status,
      'Location': it.location || '',
      'Batch': batch ? `${batch.country} ${batch.supplier} (${batch.date})` : '',
      'Notes': it.notes || '',
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock List')

  // Set column widths
  const wscols = [
    { wch: 40 }, // Description
    { wch: 15 }, // Brand
    { wch: 15 }, // Category
    { wch: 12 }, // Condition
    { wch: 15 }, // Inv No
    { wch: 20 }, // SN
    { wch: 20 }, // CPU
    { wch: 12 }, // RAM
    { wch: 15 }, // Storage
    { wch: 15 }, // GPU
    { wch: 8 },  // Year
    { wch: 10 }, // Bat Cycles
    { wch: 10 }, // Bat Health
    { wch: 12 }, // Price
    { wch: 10 }, // Qty
    { wch: 15 }, // Total Value
    { wch: 12 }, // Status
    { wch: 20 }, // Location
    { wch: 30 }, // Batch
    { wch: 30 }, // Notes
  ]
  worksheet['!cols'] = wscols

  XLSX.writeFile(workbook, filename)
  } catch (err) {
    console.error('Failed to export inventory:', err)
    alert('Failed to export inventory.')
  }
}
