import React from 'react';

const LiveMetrics: React.FC = () => {
  return (
    <div className="min-h-screen p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          即時指標 (Live Metrics)
        </h1>
        <p className="text-slate-500 text-sm mt-1">即時資料流監控（待補）</p>
      </header>
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 min-h-[320px] flex items-center justify-center text-slate-500">
        <span className="font-mono text-sm">尚無資料</span>
      </div>
    </div>
  );
};

export default LiveMetrics;
