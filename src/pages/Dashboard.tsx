import React, { useEffect, useState } from 'react';
import type { PieChartData } from '../types/dashboard';
import { getPieChartMockData } from '../services/mockData';
import CategoryPieChart from '../components/CategoryPieChart';

const Dashboard: React.FC = () => {  
  const [year, setYear] = useState<number>(2025);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pieData, setPieData] = useState<PieChartData[]>([]);

  const handleYearChange = (year: number) => {
    if (year < 2017 || year > 2026) return;
    setIsLoading(true);
    setYear(year);
  };

  useEffect(() => {
    let cancelled = false;

    getPieChartMockData({ year }).then((result) => {
      if (cancelled) return;
      setPieData(result.categories);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [year]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans">
      {/* 頂部 Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            多維度指標監控面板 (Metrics Dashboard)
          </h1>
          <p className="text-slate-500 text-sm mt-1">年度數據回顧與即時模擬分析</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-1">
            <button className={`hover:text-sky-400 ${year === 2017 ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => handleYearChange(year - 1)} >{'<'}</button>
            <span className="mx-4 font-mono">{year}</span>
            <button className={`hover:text-sky-400 ${year === 2026 ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => handleYearChange(year + 1)}>{'>'}</button>
          </div>
          <button className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            匯出數據 (Excel)
          </button>
        </div>
      </header>

      {/* 主內容區塊 - 使用 Grid 佈局 */}
      <main className="grid grid-cols-12 gap-6">
        
        {/* 左側：核心分析區 (佔 8 欄) */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* 上：資料結構組成佔比 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-sky-500 rounded-full"></div>
              <h2 className="font-semibold text-slate-300">資料結構組成佔比 (Category Pie Chart)</h2>
            </div>
            {/* 圖表預留空間 */}
            <div className="min-h-[300px] bg-slate-800/30 rounded-lg border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-600 text-sm gap-1">
              {!isLoading && pieData.length > 0 ? (
                <CategoryPieChart data={pieData} title="資料結構組成佔比" />
              ) : (
                <span className="text-slate-500 font-mono text-xs">載入中…</span>
              )}
            </div>
          </div>

          {/* 下：趨勢分析與時間序列 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-[400px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
              <h2 className="font-semibold text-slate-300">趨勢分析與時間序列 (Stacked Area Chart)</h2>
            </div>
            {/* 圖表預留空間 */}
            <div className="flex-1 bg-slate-800/30 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
              [ ECharts Stacked Area Chart Placeholder ]
            </div>
          </div>
        </section>

        {/* 右側：指標與互動區 (佔 4 欄) */}
        <section className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* KPI 指標指標 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
              <h2 className="font-semibold text-slate-300">KPI 指標指標</h2>
            </div>
            <div className="space-y-4">
              {['指標 X', '指標 Y', '指標 Z'].map((label) => (
                <div key={label} className="bg-slate-800/50 p-4 rounded-lg flex justify-between items-center">
                  <span className="text-slate-400 text-sm">{label}</span>
                  <span className="text-xl font-mono text-white">0.00</span>
                </div>
              ))}
            </div>
          </div>

          {/* 動態參數模擬器 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-[410px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
              <h2 className="font-semibold text-slate-300">動態參數模擬器 (Simulator)</h2>
            </div>
            {/* 模擬器內容預留空間 */}
            <div className="flex-1 bg-slate-800/30 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
              [ Simulator Controls & Bubble Chart Placeholder ]
            </div>
          </div>
          
        </section>
      </main>
    </div>
  );
};

export default Dashboard;