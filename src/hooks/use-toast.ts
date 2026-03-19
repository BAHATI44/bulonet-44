// ======================================================
// Fichier     : src/hooks/use-toast.ts
// Projet      : Bulonet 🚀
// Description : Système de notifications toast enrichi.
//               Gère l'affichage, la mise à jour, la fermeture,
//               les files d'attente, les toasts de promesses,
//               l'accessibilité, et les actions personnalisées.
// ======================================================

import * as React from "react";
import { type ToastActionElement, type ToastProps } from "@/components/ui/toast";

// ====================================================
// 1. CONSTANTES DE CONFIGURATION
// ====================================================
const DEFAULT_TOAST_LIMIT = 3;               // Nombre max de toasts visibles simultanément
const DEFAULT_TOAST_DURATION = 5000;          // Durée d'affichage par défaut (ms)
const TOAST_REMOVE_DELAY = 1000;               // Délai avant suppression après fermeture

// ====================================================
// 2. TYPES
// ====================================================

export interface ToasterToast extends ToastProps {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number;                          // Durée personnalisée (ms)
  important?: boolean;                         // Si true, ignore la limite (toujours visible)
  onDismiss?: () => void;                      // Callback lors de la fermeture
  onAutoClose?: () => void;                    // Callback lors de la fermeture auto
}

// Types d'actions possibles (inspiré de Redux)
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
  DISMISS_ALL: "DISMISS_ALL",
} as const;

type ActionType = typeof actionTypes;

type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> & { id: string } }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: string }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: string }
  | { type: ActionType["DISMISS_ALL"] };

interface State {
  toasts: ToasterToast[];
}

// ====================================================
// 3. GÉNÉRATION D'ID UNIQUE
// ====================================================
let count = 0;
const genId = () => {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
};

// ====================================================
// 4. GESTION DES TIMEOUTS (file d'attente de suppression)
// ====================================================
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string, duration: number = DEFAULT_TOAST_DURATION) => {
  if (toastTimeouts.has(toastId)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, duration + TOAST_REMOVE_DELAY); // On laisse un peu de temps pour l'animation

  toastTimeouts.set(toastId, timeout);
};

// ====================================================
// 5. RÉDUCTEUR (PURE FUNCTION)
// ====================================================
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      // Appliquer la limite sauf si le toast est "important"
      const newToasts = action.toast.important
        ? [action.toast, ...state.toasts]
        : [action.toast, ...state.toasts].slice(0, DEFAULT_TOAST_LIMIT);
      return { ...state, toasts: newToasts };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;
      // Marquer comme fermé (open = false)
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        // Dismiss tous
        state.toasts.forEach((toast) => addToRemoveQueue(toast.id));
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          toastId === undefined || t.id === toastId
            ? { ...t, open: false }
            : t
        ),
      };
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return { ...state, toasts: [] };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    case "DISMISS_ALL":
      state.toasts.forEach((toast) => addToRemoveQueue(toast.id));
      return {
        ...state,
        toasts: state.toasts.map((t) => ({ ...t, open: false })),
      };

    default:
      return state;
  }
};

// ====================================================
// 6. ÉTAT GLOBAL ET DISPATCH
// ====================================================
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

// ====================================================
// 7. FONCTION PRINCIPALE DE CRÉATION D'UN TOAST
// ====================================================

/**
 * Affiche une notification toast.
 * @param props - Propriétés du toast (title, description, etc.)
 * @returns Un objet contenant l'id, dismiss et update.
 */
function toast(props: Omit<ToasterToast, "id">) {
  const id = genId();
  const duration = props.duration ?? DEFAULT_TOAST_DURATION;

  const update = (updatedProps: Partial<ToasterToast>) =>
    dispatch({ type: "UPDATE_TOAST", toast: { id, ...updatedProps } });

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      duration,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  // Planifier la fermeture automatique
  if (duration !== Infinity) {
    setTimeout(() => {
      dismiss();
      props.onAutoClose?.();
    }, duration);
  }

  return { id, dismiss, update };
}

// ====================================================
// 8. TOASTS SPÉCIALISÉS (promesses, etc.)
// ====================================================

/**
 * Gère l'affichage d'une promesse avec états successifs.
 * @param promise - La promesse à exécuter
 * @param messages - Messages pour loading, success, error
 * @returns La promesse d'origine (pour chaînage)
 */
toast.promise = async <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
): Promise<T> => {
  const id = genId();
  // Toast de chargement
  toast({
    id,
    title: messages.loading,
    duration: Infinity, // Ne se ferme pas automatiquement
  });

  try {
    const result = await promise;
    // Succès
    const successMessage = typeof messages.success === "function"
      ? messages.success(result)
      : messages.success;
    toast.update(id, {
      title: successMessage,
      duration: DEFAULT_TOAST_DURATION,
    });
    return result;
  } catch (error) {
    const errorMessage = typeof messages.error === "function"
      ? messages.error(error as Error)
      : messages.error;
    toast.update(id, {
      title: errorMessage,
      duration: DEFAULT_TOAST_DURATION,
    });
    throw error;
  }
};

/**
 * Toast de succès rapide.
 */
toast.success = (title: string, props?: Partial<Omit<ToasterToast, "id" | "title">>) =>
  toast({ title, ...props, variant: "default" }); // variant success à configurer

/**
 * Toast d'erreur rapide.
 */
toast.error = (title: string, props?: Partial<Omit<ToasterToast, "id" | "title">>) =>
  toast({ title, ...props, variant: "destructive" });

/**
 * Toast d'avertissement.
 */
toast.warning = (title: string, props?: Partial<Omit<ToasterToast, "id" | "title">>) =>
  toast({ title, ...props, variant: "warning" }); // à définir

/**
 * Toast d'information.
 */
toast.info = (title: string, props?: Partial<Omit<ToasterToast, "id" | "title">>) =>
  toast({ title, ...props, variant: "default" });

/**
 * Ferme tous les toasts immédiatement.
 */
toast.dismissAll = () => dispatch({ type: "DISMISS_ALL" });

// ====================================================
// 9. HOOK REACT POUR UTILISER LES TOASTS DANS UN COMPOSANT
// ====================================================

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  const toastApi = React.useMemo(
    () => ({
      toast,
      dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
      dismissAll: () => dispatch({ type: "DISMISS_ALL" }),
    }),
    []
  );

  return {
    ...state,
    ...toastApi,
  };
}

// ====================================================
// 10. EXPORT PAR DÉFAUT (pour compatibilité)
// ====================================================
export { toast };

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// - Ce fichier doit être placé dans `src/hooks/use-toast.ts`.
// - Il est utilisé conjointement avec le composant `<Toaster />` de shadcn/ui.
// - Les toasts spéciaux (`success`, `error`, etc.) nécessitent que vous définissiez
//   les variantes correspondantes dans votre thème Tailwind.
// - La fonction `toast.promise` est très utile pour les appels API : elle gère
//   automatiquement les états de chargement, succès et erreur.
// - Pensez à appeler `toast.dismissAll` lors d'un changement de page si vous voulez
//   éviter les toasts résiduels.
// - Pour l'accessibilité, le composant `<Toaster />` doit gérer les régions live ARIA.
// - Si vous utilisez React strict mode, les délais peuvent être doublés en développement.
//   Ce n'est pas un problème en production.
// ====================================================      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
