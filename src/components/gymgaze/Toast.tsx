"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
  onDismiss?: () => void;
}

export default function Toast({ message, type, visible, onDismiss }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(() => {
        onDismiss?.();
      }, 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, onDismiss]);

  if (!visible || typeof document === "undefined") return null;

  const borderColor = type === "success" ? "#D4FF4F" : "#EF4444";
  const iconColor = type === "success" ? "#D4FF4F" : "#EF4444";

  return createPortal(
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 18px",
        borderRadius: "12px",
        background: "rgba(20,20,20,0.95)",
        border: `1px solid ${borderColor}`,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        minWidth: "260px",
        maxWidth: "400px",
        animation: "slideUp 0.2s ease-out",
      }}
    >
      {type === "success" ? (
        <CheckCircle size={18} color={iconColor} strokeWidth={2} />
      ) : (
        <XCircle size={18} color={iconColor} strokeWidth={2} />
      )}
      <span style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 500, flex: 1 }}>
        {message}
      </span>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}

// Hook for managing toast state
import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; visible: boolean }>({
    message: "",
    type: "success",
    visible: false,
  });

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
}
