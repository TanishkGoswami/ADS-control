import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  confirmLabel,
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const resolvedConfirmText = confirmLabel || confirmText || 'Confirm';

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
          iconBg: 'bg-rose-50 border-rose-200 text-rose-600',
          btnBg: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          iconBg: 'bg-amber-50 border-amber-200 text-amber-600',
          btnBg: 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-[#0064e0]" />,
          iconBg: 'bg-blue-50 border-blue-200 text-[#0064e0]',
          btnBg: 'bg-[#0064e0] hover:bg-[#0052b8] text-white shadow-sm'
        };
    }
  };

  const v = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#e4e6eb] rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150 text-[#0a1317]">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${v.iconBg}`}>
            {v.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#0a1317]">{title}</h3>
            <p className="text-xs text-[#657383] mt-1 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-[#657383] hover:text-[#0a1317] transition-colors p-1 rounded-md hover:bg-[#f0f2f5]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e4e6eb]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-medium text-[#657383] hover:text-[#0a1317] hover:bg-[#f0f2f5] rounded-lg transition-colors border border-[#e4e6eb]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${v.btnBg} disabled:opacity-50 flex items-center gap-1.5`}
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            <span>{resolvedConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface NotificationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  onClose
}) => {
  if (!isOpen) return null;

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          iconBg: 'bg-emerald-50 border-emerald-200',
          titleColor: 'text-emerald-800'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
          iconBg: 'bg-rose-50 border-rose-200',
          titleColor: 'text-rose-800'
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-[#0064e0]" />,
          iconBg: 'bg-blue-50 border-blue-200',
          titleColor: 'text-[#0064e0]'
        };
    }
  };

  const s = getStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#e4e6eb] rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150 text-[#0a1317]">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${s.iconBg}`}>
            {s.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${s.titleColor}`}>{title}</h3>
            <p className="text-xs text-[#657383] mt-1 leading-relaxed break-words">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#657383] hover:text-[#0a1317] transition-colors p-1 rounded-md hover:bg-[#f0f2f5]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-[#e4e6eb]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-[#0064e0] hover:bg-[#0052b8] text-white rounded-lg transition-colors shadow-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
