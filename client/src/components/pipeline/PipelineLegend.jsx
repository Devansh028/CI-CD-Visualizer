import { CheckCircle2, XCircle, ArrowRightCircle, Circle } from "lucide-react";

const PipelineLegend = () => {
  return (
    <div className="absolute bottom-5 left-5 z-10 rounded-xl border border-white/5 bg-[#0e1017]/85 p-4 shadow-2xl backdrop-blur-md max-w-xs space-y-3 pointer-events-auto">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Pipeline Legend</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-gray-400">
        <div className="flex items-center gap-2">
          <Circle className="h-3 w-3 text-gray-500" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping"></span>
          <span className="text-purple-400 font-semibold">Running</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span>Success</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-3 w-3 text-rose-400" />
          <span>Failed</span>
        </div>
        <div className="flex items-center gap-2 col-span-2">
          <ArrowRightCircle className="h-3 w-3 text-gray-600" />
          <span className="text-gray-500">Skipped (on failure)</span>
        </div>
      </div>
    </div>
  );
};

export default PipelineLegend;
