import React from "react";
import { Toaster } from "react-hot-toast";
const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 5000,
        style: {
          borderRadius: "12px",
          padding: "12px 20px",
          color: "#fff",
          fontWeight: 500,
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        },
        success: {
          style: {
            background:
              "linear-gradient(135deg, #0088FE, #00C49F,#8884D8,#82ca9d)",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#16a34a",
          },
        },
        error: {
          style: {
            background: "linear-gradient(135deg, #dc2626, #ef4444)",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#b91c1c",
          },
        },
      }}
    />
  );
};

export default ToastProvider;
