"use client"

import type React from "react"

// Adapted from: https://github.com/shadcn-ui/ui/blob/main/apps/www/registry/default/ui/use-toast.ts
import { useState, useEffect, useCallback } from "react"

import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
      id: string
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      id: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      id: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.id ? { ...t, ...action.toast } : t)),
      }

    case actionTypes.DISMISS_TOAST: {
      const { id } = action

      if (toastTimeouts.has(id)) {
        clearTimeout(toastTimeouts.get(id))
        toastTimeouts.delete(id)
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === id
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      }
    }

    case actionTypes.REMOVE_TOAST:
      if (toastTimeouts.has(action.id)) {
        clearTimeout(toastTimeouts.get(action.id))
        toastTimeouts.delete(action.id)
      }

      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      }

    default:
      return state
  }
}

export function useToast() {
  const [state, dispatch] = useState<State>({ toasts: [] })

  const toast = useCallback(
    ({ ...props }: Omit<ToasterToast, "id">) => {
      const id = genId()

      const update = (props: Partial<ToasterToast>) =>
        dispatch({
          type: actionTypes.UPDATE_TOAST,
          id,
          toast: { ...props },
        })

      const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, id })

      dispatch({
        type: actionTypes.ADD_TOAST,
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open) => {
            if (!open) dismiss()
          },
        },
      })

      return {
        id,
        dismiss,
        update,
      }
    },
    [dispatch],
  )

  const dismissToast = useCallback(
    (id: string) => {
      dispatch({ type: actionTypes.DISMISS_TOAST, id })
    },
    [dispatch],
  )

  const removeToast = useCallback(
    (id: string) => {
      dispatch({ type: actionTypes.REMOVE_TOAST, id })
    },
    [dispatch],
  )

  useEffect(() => {
    // Add a check to ensure state.toasts exists before calling forEach
    if (state.toasts && state.toasts.length > 0) {
      state.toasts.forEach((toast) => {
        if (toast.open) {
          const timeout = setTimeout(() => {
            dismissToast(toast.id)
          }, TOAST_REMOVE_DELAY)

          toastTimeouts.set(toast.id, timeout)
        }
      })
    }
  }, [state.toasts, dismissToast])

  useEffect(() => {
    const handleRemoveToast = (event: CustomEvent<{ id: string }>) => {
      removeToast(event.detail.id)
    }

    document.addEventListener("toast-remove" as any, handleRemoveToast as any)

    return () => {
      document.removeEventListener("toast-remove" as any, handleRemoveToast as any)
    }
  }, [removeToast])

  return {
    ...state,
    toast,
    dismiss: dismissToast,
  }
}
