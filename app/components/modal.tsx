import { Portal } from "./portal";
import { useNavigate } from "@remix-run/react";

interface props {
  children: React.ReactNode;
  isOpen: boolean;
  ariaLabel?: string;
  className?: string;
  handleClose: Function;
}

export const Modal: React.FC<props> = ({
  children,
  isOpen,
  ariaLabel,
  className,
  handleClose
}) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <Portal wrapperId="modal">
      <div
        className="fixed inset-0 overflow-y-auto bg-gray-600 bg-opacity-80"
        aria-labelledby={ariaLabel ?? "modal-title"}
        role="dialog"
        aria-modal="true"
        onClick={handleClose}
      ></div>
      <div className="fixed inset-0 pointer-events-none flex justify-center items-center max-h-screen overflow-scroll z-50">
        <div
          className={`${className} p-4 bg-slate-600 pointer-events-auto max-h-screen md:rounded-xl`}
        >
          {/* This is where the modal content is rendered  */}
          {children}
        </div>
      </div>
    </Portal>
  );
};
