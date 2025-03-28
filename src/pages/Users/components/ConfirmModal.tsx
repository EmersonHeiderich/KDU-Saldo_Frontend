// src/pages/Users/components/ConfirmModal.tsx

import React from 'react';
import styles from '../Users.module.css'; // Use parent styles
import BaseModal from '../../../components/BaseModal/BaseModal';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode; // Allow React nodes for richer messages
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null; // Don't render if not open

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={!isLoading ? onCancel : () => {}} // Prevent closing while loading
      title={title}
      className={styles.confirmModalContent} // Use specific class for styling
    >
      {/* Body is now part of BaseModal content */}
      <div className={styles.modalBodyConfirm}> {/* Add specific body class */}
        {typeof message === 'string' ? <p>{message}</p> : message}
      </div>

      {/* Footer remains for action buttons */}
      <div className={styles.modalFooter}>
        <button
          type="button"
          className="btn secondary" // Use base button styles
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="btn danger" // Use base button styles
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Processando...
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </BaseModal>
  );
};

export default ConfirmModal;