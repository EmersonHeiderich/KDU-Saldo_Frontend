// src/components/BaseModal/BaseModal.tsx

import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import './BaseModal.css'; // Import the CSS for BaseModal

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void; // Simple callback, no event needed usually
  title: string;
  children: ReactNode;
  className?: string; // For additional styling on the content div
  showLoading?: boolean;
  loadingMessage?: string;
  // Add optional footer prop if explicit footer needed outside children
  // footer?: ReactNode;
}

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showLoading = false,
  loadingMessage = 'Carregando...',
  // footer
}) => {
  const [isClosing, setIsClosing] = useState(false);
  // Use state to control rendering, allowing exit animation
  const [shouldRender, setShouldRender] = useState(isOpen);

  // Effect to manage entrance/exit based on isOpen prop
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true); // Start rendering (triggers entrance animation)
      setIsClosing(false); // Ensure not in closing state
    } else if (shouldRender) {
      // Only trigger close animation if it was previously rendered
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false); // Stop rendering after animation
      }, 300); // Match CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]); // Re-run if isOpen or shouldRender changes


  // Function to handle the close action (triggered by button or ESC)
  const handleClose = useCallback(() => {
    if (isClosing) return; // Prevent multiple triggers
    setIsClosing(true);
    const timer = setTimeout(() => {
      onClose(); // Call the parent's onClose after animation
      // No need to setShouldRender(false) here, useEffect handles it
    }, 300);
    // Cleanup timer if component unmounts during animation
    return () => clearTimeout(timer);
  }, [onClose, isClosing]);


  // Effect to handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) { // Check isOpen directly
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    // Cleanup listener
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, handleClose]); // Depend on isOpen and handleClose


  // Don't render anything if shouldRender is false
  if (!shouldRender) return null;

  return (
    // Overlay handles background dimming and centering
    <div
        className={`base-modal-overlay ${isClosing ? 'closing' : ''}`}
        // Optional: Close on overlay click (add with caution for usability)
        // onClick={handleClose}
        role="dialog" // Accessibility
        aria-modal="true"
        aria-labelledby="base-modal-title" // Link title for screen readers
    >
        {/* Content container with animations and custom class */}
      <div
        className={`base-modal-content ${isClosing ? 'closing' : ''} ${className}`}
        // Prevent overlay click from closing when clicking inside content
        onClick={(e) => e.stopPropagation()}
        role="document" // Accessibility
      >
          {/* Modal Header */}
        <div className="base-modal-header">
          <h3 id="base-modal-title">{title}</h3>
          <button
             className="base-modal-close"
             onClick={handleClose}
             aria-label="Fechar modal"
             title="Fechar (Esc)" // Tooltip
           >
            &times; {/* Simple 'x' character */}
          </button>
        </div>

        {/* Modal Body - Displays loading or children */}
        <div className="base-modal-body">
          {showLoading ? (
            <div className="base-modal-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>{loadingMessage}</p>
            </div>
          ) : (
            children // Render the content passed to the modal
          )}
        </div>

         {/* Optional Footer Section (if passed via props) */}
         {/* {footer && (
             <div className="base-modal-footer">
                 {footer}
             </div>
         )} */}

      </div>
    </div>
  );
};

export default BaseModal;