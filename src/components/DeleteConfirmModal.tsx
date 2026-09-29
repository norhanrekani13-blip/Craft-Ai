import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext.js';

export const DeleteConfirmModal: React.FC = () => {
  const { deleteConfirm, setDeleteConfirm, executeDeleteConfirm, t } = useApp();

  if (!deleteConfirm.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
        onClick={() =>
          setDeleteConfirm({ isOpen: false, type: 'conversation', id: '', title: '' })
        }
      />

      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 z-10 animate-scaleIn text-center">
        <button
          type="button"
          onClick={() =>
            setDeleteConfirm({ isOpen: false, type: 'conversation', id: '', title: '' })
          }
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{t.deleteConfirmTitle}</h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
          Are you sure you want to delete <strong className="text-slate-200">{deleteConfirm.title}</strong>? {t.deleteConfirmMsg}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() =>
              setDeleteConfirm({ isOpen: false, type: 'conversation', id: '', title: '' })
            }
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={executeDeleteConfirm}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 transition-all hover:scale-105"
          >
            {t.delete}
          </button>
        </div>
      </div>
    </div>
  );
};
