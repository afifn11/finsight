// components/transactions/QuickAddProvider.tsx
// Single, app-wide owner of the "add/edit transaction" modal and the OCR
// scanner. Needed because the bottom-nav FAB (Round 3 feature: prominent
// "Scan Struk" entry point) must be able to open these from ANY page, not
// just the Transactions page — so instead of each page owning its own
// TransactionFormModal instance, there is exactly one instance, rendered once
// here, and every trigger (FAB, Transactions page "+" button, edit row
// buttons) goes through this shared context.
'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { TransactionFormModal } from './TransactionFormModal'
import { OcrScanner, type OcrResult } from './OcrScanner'
import type { TransactionWithCategory } from '@/types'

type Mode = 'closed' | 'add' | 'edit' | 'scan'

interface QuickAddContextValue {
  /** Open the form empty, for a new transaction. */
  openAdd: () => void
  /** Open the form pre-filled with an existing transaction for editing. */
  openEdit: (tx: TransactionWithCategory) => void
  /** Open the camera/upload scanner directly — on a successful scan, the form
   *  opens automatically pre-filled with the extracted data. */
  openScan: () => void
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null)

// Broadcast so any currently-mounted transaction list can refresh itself
// after a quick-add/edit succeeds, without every page having to thread a
// refresh callback through this provider.
const CHANGED_EVENT = 'finsight:transactions-changed'
export function notifyTransactionsChanged() {
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT))
}
export function useTransactionsChanged(onChange: () => void) {
  useEffect(() => {
    window.addEventListener(CHANGED_EVENT, onChange)
    return () => window.removeEventListener(CHANGED_EVENT, onChange)
  }, [onChange])
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext)
  if (!ctx) throw new Error('useQuickAdd must be used within QuickAddProvider')
  return ctx
}

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('closed')
  const [editData, setEditData] = useState<TransactionWithCategory | null>(null)
  const [ocrPrefill, setOcrPrefill] = useState<OcrResult | null>(null)

  const openAdd = useCallback(() => {
    setEditData(null)
    setOcrPrefill(null)
    setMode('add')
  }, [])

  const openEdit = useCallback((tx: TransactionWithCategory) => {
    setEditData(tx)
    setOcrPrefill(null)
    setMode('edit')
  }, [])

  const openScan = useCallback(() => {
    setEditData(null)
    setMode('scan')
  }, [])

  function handleClose() {
    setMode('closed')
    setEditData(null)
    setOcrPrefill(null)
  }

  function handleOcrResult(result: OcrResult) {
    setOcrPrefill(result)
    setMode('add')
  }

  function handleSuccess(closeModal?: boolean) {
    notifyTransactionsChanged()
    if (closeModal !== false) handleClose()
  }

  return (
    <QuickAddContext.Provider value={{ openAdd, openEdit, openScan }}>
      {children}

      <TransactionFormModal
        open={mode === 'add' || mode === 'edit'}
        onClose={handleClose}
        onSuccess={handleSuccess}
        editData={mode === 'edit' ? editData : null}
        initialOcrData={mode === 'add' ? ocrPrefill : null}
      />

      {mode === 'scan' && (
        <OcrScanner onResult={handleOcrResult} onClose={handleClose} />
      )}
    </QuickAddContext.Provider>
  )
}
