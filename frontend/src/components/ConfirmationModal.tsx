import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isConfirming = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex items-center flex-col">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
              </div>

              <div className="ml-4 text-left">
                <h3
                  className="text-lg font-bold leading-6 text-gray-900 dark:text-white"
                  id="modal-title"
                >
                  {title}
                </h3>

                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {message}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-row-reverse gap-3">
              <motion.button
                type="button"
                className="flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                onClick={onConfirm}
                disabled={isConfirming}
                whileHover={{ scale: isConfirming ? 1 : 1.05 }}
                whileTap={{ scale: isConfirming ? 1 : 0.95 }}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                    Processing...
                  </>
                ) : (
                  confirmText
                )}
              </motion.button>
              <motion.button
                type="button"
                className="flex w-full justify-center rounded-md bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={onClose}
                disabled={isConfirming}
                whileHover={{ scale: isConfirming ? 1 : 1.05 }}
                whileTap={{ scale: isConfirming ? 1 : 0.95 }}
              >
                {cancelText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
