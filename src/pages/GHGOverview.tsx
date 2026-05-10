import React from 'react';

const GHGOverview: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      {/* 頂部導航欄 */}
      <nav className="flex justify-between items-center mb-10 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ESG 碳盤查系統</h1>
          <p className="text-slate-400 text-sm mt-1">GHG 組織溫室氣體排放總覽 (模擬 Demo)</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md text-sm transition">
            匯入 Excel
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-medium transition">
            導出 PDF
          </button>
        </div>
      </nav>

      {/* 關鍵指標卡片 (KPI) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[
          { title: '總排放量', value: '24,580', unit: 'tCO2e', border: 'border-l-blue-500' },
          { title: 'Scope 1 (直接)', value: '3,120', unit: 'tCO2e', border: 'border-l-emerald-500' },
          { title: 'Scope 2 (能源)', value: '18,460', unit: 'tCO2e', border: 'border-l-amber-500' },
          { title: 'Scope 3 (其他)', value: '3,000', unit: 'tCO2e', border: 'border-l-rose-500' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-slate-900 border border-slate-800 border-l-4 ${kpi.border} p-6 rounded-lg shadow-sm`}>
            <p className="text-slate-400 text-xs font-semibold uppercase">{kpi.title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tighter">{kpi.value}</span>
              <span className="text-slate-500 text-sm">{kpi.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 圖表預留區 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側大圖表 */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[400px] flex flex-col justify-center items-center">
          <p className="text-slate-500 italic">[ 年度排放趨勢圖：即將實作 ]</p>
        </div>
        
        {/* 右側小圖表 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[400px] flex flex-col justify-center items-center">
          <p className="text-slate-500 italic">[ 排放來源佔比：即將實作 ]</p>
        </div>
      </div>
    </div>
  );
};

export default GHGOverview;