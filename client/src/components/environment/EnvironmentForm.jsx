import React, { useState } from "react";
import { Plus, Lock, Unlock } from "lucide-react";
import SecretInput from "./SecretInput";

const EnvironmentForm = ({ onSubmit, isLoading }) => {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    const cleanKey = key.trim().toUpperCase();
    
    // Key validation
    const reg = /^[A-Z_][A-Z0-9_]*$/;
    if (!reg.test(cleanKey)) {
      setFormError("Key name must contain uppercase letters, numbers, and underscores only, and cannot start with a number.");
      return;
    }

    if (!value.trim()) {
      setFormError("Variable value cannot be empty.");
      return;
    }

    onSubmit({ key: cleanKey, value: value.trim(), isSecret });
    
    // Reset form fields
    setKey("");
    setValue("");
    setIsSecret(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-[11px] font-medium text-red-400">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Key */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Key Name
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="E.g. API_KEY"
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition duration-200 uppercase"
          />
        </div>

        {/* Value */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
            <span>Value</span>
            <span className="text-[9px] text-gray-500 lowercase">
              {isSecret ? "(will be encrypted)" : "(plain-text)"}
            </span>
          </label>
          {isSecret ? (
            <SecretInput
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={isLoading}
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="E.g. production"
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition duration-200"
            />
          )}
        </div>

        {/* Actions (Toggle & Submit) */}
        <div className="flex items-center justify-between gap-4 h-9">
          {/* Toggle */}
          <button
            type="button"
            onClick={() => setIsSecret(!isSecret)}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition duration-200 cursor-pointer ${
              isSecret
                ? "bg-purple-600/10 border-purple-500/20 text-purple-400"
                : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
            }`}
          >
            {isSecret ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                Encrypt Secret
              </>
            ) : (
              <>
                <Unlock className="h-3.5 w-3.5" />
                Plain Text
              </>
            )}
          </button>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex-grow flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-900/20 hover:brightness-110 active:scale-[0.99] transition duration-200 cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Variable
          </button>
        </div>
      </div>
    </form>
  );
};

export default EnvironmentForm;
