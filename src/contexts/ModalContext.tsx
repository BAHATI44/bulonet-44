import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface ModalState {
  isOpen: boolean;
  component: ReactNode | null;
  title?: string;
}

interface ModalContextType {
  modal: ModalState;
  openModal: (component: ReactNode, title?: string) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modal, setModal] = useState<ModalState>({ isOpen: false, component: null });

  const openModal = useCallback((component: ReactNode, title?: string) => {
    setModal({ isOpen: true, component, title });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ isOpen: false, component: null });
  }, []);

  return (
    <ModalContext.Provider value={{ modal, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
};
