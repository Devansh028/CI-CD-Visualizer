import React from "react";
import { Lock, Unlock, Edit, Trash2, ShieldAlert } from "lucide-react";

const EnvironmentTable = ({ variables, onEdit, onDelete }) => {
  if (variables.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/5 p-8 text-center flex flex-col items-center justify-center">
        <Lock className="h-6 w-6 text-gray-600 mb-2.5" />
        <h3 className="text-xs font-bold text-gray-300">No custom environment variables</h3>
        <p className="text-[11px] text-gray-500 max-w-xs mt-1">
          Add environment parameters below to inject values into your running Docker container at launch.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 text-[9px] font-bold uppercase tracking-wider text-gray-500">
            <th className="py-2.5 px-3">Variable Key</th>
            <th className="py-2.5 px-3">Configured Value</th>
            <th className="py-2.5 px-3">Secrecy</th>
            <th className="py-2.5 px-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-xs">
          {variables.map((v) => (
            <tr key={v._id} className="hover:bg-white/1 transition duration-150">
              {/* Key */}
              <td className="py-3 px-3 font-mono font-bold text-white tracking-wide">
                {v.key}
              </td>

              {/* Masked/Unmasked Value */}
              <td className="py-3 px-3 font-mono text-gray-400">
                {v.isSecret ? (
                  <span className="text-purple-400 font-bold tracking-widest">{v.value}</span>
                ) : (
                  <span className="truncate max-w-[250px] inline-block" title={v.value}>
                    {v.value}
                  </span>
                )}
              </td>

              {/* Secrecy Badge */}
              <td className="py-3 px-3">
                {v.isSecret ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Lock className="h-2.5 w-2.5" /> Secret
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 border border-white/5">
                    <Unlock className="h-2.5 w-2.5" /> Plain
                  </span>
                )}
              </td>

              {/* Actions */}
              <td className="py-3 px-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(v)}
                    className="p-1 rounded bg-white/5 border border-white/5 text-gray-400 hover:text-white transition duration-150 cursor-pointer"
                    title="Edit Variable"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(v)}
                    className="p-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition duration-150 cursor-pointer"
                    title="Delete Variable"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EnvironmentTable;
