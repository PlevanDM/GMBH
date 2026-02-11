import * as XLSX from 'xlsx'
import type { Rfq } from '../types/buyer'

export function exportRfqToExcel(rfq: Rfq) {
  const data = rfq.items.map((it) => ({
    'Description': it.description,
    'Quantity': it.quantity,
    'Target Price': it.targetPrice || '',
    'Currency': it.currency || 'EUR',
    'Inventory Number': it.inventoryNumber || '',
    'Serial Number': it.serialNumber || '',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'RFQ Items')

  // Add some info about the RFQ itself
  // For a real business use case, we'd want a more formatted Excel,
  // but for now, this is functional.

  XLSX.writeFile(wb, `RFQ-${rfq.id.slice(0, 8)}-${rfq.title.replace(/\s+/g, '_')}.xlsx`)
}

export async function exportRfqToPdf(rfq: Rfq) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setTextColor(17, 24, 39) // primary color
  doc.text('RESTART', 14, 22)

  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text('Specialists in IT Asset Recovery', 14, 28)

  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.text(`RFQ: ${rfq.title}`, 14, 42)

  doc.setFontSize(10)
  doc.text(`ID: ${rfq.id.slice(0, 8)}`, 14, 48)
  doc.text(`Date: ${new Date(rfq.createdAt).toLocaleDateString()}`, 14, 53)
  doc.text(`Status: ${rfq.status}`, 14, 58)

  const tableData = rfq.items.map((it) => [
    it.description,
    it.quantity.toString(),
    it.targetPrice ? `${it.targetPrice} ${it.currency}` : '—',
    it.inventoryNumber || '—',
  ])

  autoTable(doc, {
    startY: 65,
    head: [['Description', 'Qty', 'Price', 'Inv. #']],
    body: tableData,
    headStyles: { fillColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  })

  doc.save(`RFQ-${rfq.id.slice(0, 8)}.pdf`)
}
