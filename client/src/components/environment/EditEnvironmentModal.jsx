import React, { useState, useEffect } from "react";
import { X, Save, Lock, Unlock } from "lucide-react";
import SecretInput from "./SecretInput";

const EditEnvironmentModal = ({ isOpen, onClose, variable, onSave, isLoading }) => {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (variable) {
      setKey(variable.key);
      setValue(""); // Clear value input, showing blank placeholder for safety
      setIsSecret(variable.isSecret);
      setError("");
    }
  }, [variable, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const cleanKey = key.trim().toUpperCase();
    const reg = /^[A-Z_][A-Z0-9_]*$/;
    if (!reg.test(cleanKey)) {
      setError("Key name must be alphanumeric and underscores only, and cannot start with a digit.");
      return;
    }

    const payload = {
      key: cleanKey,
      isSecret,
    };

    // If a new value is entered, include it.
    // If not, the backend will keep the current value.
    if (value.trim()) {
      payload.value = value.trim();
    } else if (variable.isSecret !== isSecret && !isSecret) {
      setError("A new plain-text value must be provided when converting a secret variable to public.");
      return;
    }

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/5 bg-[#0e1017] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Edit Environment Variable
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-[11px] font-medium text-red-400">
                {error}
              </div>
            )}

            {/* Key */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Key Name
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
                disabled={isLoading}
                className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition duration-200 uppercase"
              />
            </div>

            {/* Value */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
                <span>New Value</span>
                <span className="text-[9px] text-gray-500 font-light">
                  {variable?.isSecret ? "Leave empty to keep existing secret" : "Leave empty to keep current value"}
                </span>
              </label>
              {isSecret ? (
                <SecretInput
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                />
              ) : (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={variable?.isSecret ? "Enter new plain-text value" : variable?.value}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition duration-200"
                />
              )}
            </div>

            {/* Secrecy Switch */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSecret(!isSecret)}
                disabled={isLoading}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold transition duration-200 cursor-pointer ${
                  isSecret
                    ? "bg-purple-600/10 border-purple-500/20 text-purple-400"
                    : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {isSecret ? (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    Encrypt Value (Secret)
                  </>
                ) : (
                  <>
                    <Unlock className="h-3.5 w-3.5" />
                    Plain Text Value (Public)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5 bg-[#08090d]/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white transition duration-200 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-900/20 hover:brightness-110 active:scale-[0.99] transition duration-200 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEnvironmentModal;
