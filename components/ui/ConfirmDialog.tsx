// components/ui/ConfirmDialog.tsx
// Shared confirmation dialog for destructive actions (delete transaction, delete goal,
// delete budget, ...). Visual/UX reference: the existing account-deletion modal in
// components/settings/SettingsForm.tsx.
'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { Modal, ModalHeader, useModalIds } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { titleId, descriptionId } = useModalIds()

  return (
    <Modal
      open={open}
      onClose={onCancel}
      labelledBy={titleId}
      describedBy={descriptionId}
      maxWidth="sm"
      disableClose={isLoading}
    >
      <ModalHeader
        titleId={titleId}
        descriptionId={descriptionId}
        title={title}
        icon={<AlertTriangle className="w-5 h-5" />}
        iconColor="var(--color-danger-500)"
        iconBg="var(--color-danger-50)"
      />

      <div className="px-5 pb-5 pt-4">
        <p id={descriptionId} className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-card)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-danger-500)' }}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
