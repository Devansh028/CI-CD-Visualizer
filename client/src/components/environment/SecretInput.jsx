import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * A reusable input component that masks or shows sensitive variable values.
 */
const SecretInput = ({ value, onChange, placeholder, disabled, required }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 pr-10 text-xs text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition duration-200 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        disabled={disabled}
        className="absolute right-3 text-gray-500 hover:text-white transition cursor-pointer disabled:opacity-50"
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
};

export default SecretInput;
