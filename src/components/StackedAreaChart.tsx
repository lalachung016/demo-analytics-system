import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { YearlyStackedAreaData } from '../types/dashboard';

interface Props {
  data: YearlyStackedAreaData;
  title: string;
}

const TREND_COLORS = ['#818cf8', '#22d3ee', '#34d399'] as const;

const StackedAreaChart: React.FC<Props> = ({ data, title }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      color: [...TREND_COLORS],
      grid: { left: 24, right: 16, top: 24, bottom: 28, containLabel: true },
      legend: {
        top: 0,
        textStyle: { color: '#94a3b8' },
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (params) => {
          const items = params as echarts.DefaultLabelFormatterCallbackParams[];
          const list = items.map((item) => {
            const marker = item.marker ?? '';
            return `${marker} ${item.seriesName}: ${item.value} 萬元`;
          });
          const axisLabel = (items[0] as { axisValueLabel?: string } | undefined)?.axisValueLabel ?? '';
          return `${axisLabel}<br/>${list.join('<br/>')}`;
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.months,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#94a3b8', formatter: '{value}' },
      },
      series: data.series.map((item) => ({
        name: item.name,
        type: 'line',
        smooth: true,
        symbol: 'none',
        stack: 'total',
        areaStyle: { opacity: 0.35 },
        lineStyle: { width: 2 },
        emphasis: { focus: 'series' },
        data: item.values,
      })),
      aria: { enabled: true, decal: { show: false } },
      title: {
        show: false,
        text: title,
      },
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [data, title]);

  return <div ref={chartRef} className="w-full h-full min-h-[260px]" />;
};

export default StackedAreaChart;
