import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { PieChartData } from '../types/dashboard';
import { useChartAutoResize } from '../hooks/useChartAutoResize';

const PIE_COLORS = ['#38bdf8', '#2dd4bf', '#fb923c', '#94a3b8'] as const;

interface Props {
  data: PieChartData[];
  title: string;
}

const CategoryPieChart: React.FC<Props> = ({ data, title }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 計算總值
  const totalValue = data.reduce((sum, item) => sum + item.value, 0).toLocaleString('en-US', { maximumFractionDigits: 1 });

  useEffect(() => {
    if (!chartRef.current) return;

    // 1. 初始化
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // 2. 配置項
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        confine: true,
        extraCssText: 'max-width: 180px; white-space: normal; word-break: break-word;',
        formatter: '{b}: {c} ({d}%)',
        position: (point, _params, _dom, _rect, size) => {
          const [x, y] = point;
          const [viewWidth, viewHeight] = size.viewSize;
          const [contentWidth, contentHeight] = size.contentSize;
          const gap = 12;

          const left = Math.min(Math.max(x + gap, gap), viewWidth - contentWidth - gap);
          const top = Math.min(Math.max(y + gap, gap), viewHeight - contentHeight - gap);
          return [left, top];
        },
      },
      series: [
        {
          name: title,
          type: 'pie',
          radius: ['65%', '85%'], // 環形比例
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 10,
          },
          // 確保數據有正確傳入
          data: data.map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: { color: PIE_COLORS[index % PIE_COLORS.length] }
          }))
        }
      ],
      // 中間文字
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: totalValue + '\n總指標值',
            align: 'center',
            fill: '#fff',
            fontSize: 20,
            lineHeight: 30,
            fontWeight: 'bold'
          }
        }
      ]
    };

    chartInstance.current.setOption(option);

    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [data, title, totalValue]);

  useChartAutoResize(chartInstance, chartRef);

  return (
    <div className="flex flex-col md:flex-row md:items-center w-full h-full px-4">
      {/* 關鍵：容器必須有明確的寬高，這裡使用 flex-1 或固定寬度 */}
      <div
        ref={chartRef}
        className="w-full h-full min-h-[300px] sm:h-[480px] md:w-[250px] md:h-full"
      />
      
      {/* 右側列表 */}
      <div className="flex-1 md:mt-0 md:ml-16 space-y-4 my-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
              />
              <span className="text-slate-400 text-sm">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-white font-mono font-bold">{item.value.toLocaleString()}</span>
              <span className="text-slate-600 text-xs ml-1">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPieChart;