import { useTranslation } from 'react-i18next'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  type?: 'danger' | 'info' | 'warning'
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  isDestructive,
  type
}: ConfirmDialogProps) {
  const { t } = useTranslation('common')

  if (!isOpen) return null

  const resolvedType = type || (isDestructive ? 'danger' : 'info')

  const typeStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200',
    info: 'bg-accent hover:bg-accent-hover text-white shadow-accent/20',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div
        className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
              resolvedType === 'danger' ? 'bg-red-100' : resolvedType === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
            }`}>
              {resolvedType === 'danger' && <span className="text-red-600 text-xl font-bold">!</span>}
              {resolvedType === 'warning' && <span className="text-amber-600 text-xl font-bold">?</span>}
              {resolvedType === 'info' && <span className="text-blue-600 text-xl font-bold">i</span>}
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-lg font-semibold leading-6 text-slate-900">{title}</h3>
              <div className="mt-2">
                <p className="text-sm text-slate-500">{message}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
          <button
            type="button"
            className={`inline-flex w-full justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm sm:w-auto transition-all ${typeStyles[resolvedType]}`}
            onClick={() => {
              onConfirm()
              onCancel()
            }}
          >
            {confirmLabel || t('common.ok')}
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto"
            onClick={onCancel}
          >
            {cancelLabel || t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
