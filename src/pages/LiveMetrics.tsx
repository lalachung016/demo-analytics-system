import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Button from '@mui/material/Button';
import { getLiveMetricsSeed, subscribeLiveMetrics } from '../services/mockData';
import { useChartAutoResize } from '../hooks/useChartAutoResize';

const LINE_COLOR = '#22d3ee';
const WINDOW_MS = 3 * 60 * 1000; // 即時模式下 rolling window 寬度
const MAX_POINTS = 10_100; // 超過此筆數觸發 trim
const KEEP_POINTS = 10_000; // trim 後保留最新筆數

type PointTuple = [number, number]; // [timestamp, value]

const sliderStyle: echarts.DataZoomComponentOption = {
  type: 'slider',
  xAxisIndex: 0,
  height: 18,
  bottom: 16,
  borderColor: '#334155',
  backgroundColor: 'rgba(15,23,42,0.4)',
  fillerColor: 'rgba(34,211,238,0.15)',
  handleStyle: { color: '#22d3ee', borderColor: '#22d3ee' },
  moveHandleStyle: { color: '#22d3ee' },
  textStyle: { color: '#94a3b8' },
  dataBackground: {
    lineStyle: { color: '#475569' },
    areaStyle: { color: 'rgba(71,85,105,0.4)' },
  },
  selectedDataBackground: {
    lineStyle: { color: '#22d3ee' },
    areaStyle: { color: 'rgba(34,211,238,0.25)' },
  },
};

const LiveMetrics: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const dataBufferRef = useRef<PointTuple[]>([]);
  /** 視覺是否暫停；用 ref 是因為 subscribe callback 需要讀最新值，避免閉包過期 */
  const isPausedRef = useRef<boolean>(false);
  const [pointCount, setPointCount] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const togglePause = () => {
    const chart = chartInstance.current;
    if (!chart) return;

    if (isPausedRef.current) {
      // === 繼續播放：跳轉到最新時間點 ===
      isPausedRef.current = false;
      setIsPaused(false);

      const buf = dataBufferRef.current;
      const lastTs = buf[buf.length - 1]?.[0] ?? Date.now();
      // 用 setOption 整批塞入 buffer（含暫停期間累積的資料）並回到 rolling window
      chart.setOption(
        {
          xAxis: { min: lastTs - WINDOW_MS, max: lastTs },
          dataZoom: [],
          series: [{ data: buf }],
        },
        { replaceMerge: ['dataZoom'] },
      );
    } else {
      // === 暫停：把當下 buffer 凍結為 dataZoom 可探索的快照（訂閱不會停） ===
      isPausedRef.current = true;
      setIsPaused(true);

      const buf = dataBufferRef.current;
      if (buf.length === 0) return;
      chart.setOption({
        xAxis: { min: buf[0][0], max: buf[buf.length - 1][0] },
        dataZoom: [
          { type: 'inside', xAxisIndex: 0 },
          sliderStyle,
        ],
        series: [{ data: buf }],
      });
    }
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    const seed = getLiveMetricsSeed();
    dataBufferRef.current = seed.map((p) => [p.timestamp, p.value]);
    setPointCount(seed.length);

    const seedEndTs = seed[seed.length - 1].timestamp;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: false,
      grid: { left: 48, right: 24, top: 24, bottom: 32 },
      tooltip: {
        trigger: 'axis',
        confine: true,
        axisPointer: { type: 'line', lineStyle: { color: '#475569' } },
        formatter: (params) => {
          const item = (params as echarts.DefaultLabelFormatterCallbackParams[])[0];
          const [ts, value] = item.value as PointTuple;
          const time = new Date(ts).toLocaleTimeString('zh-TW', { hour12: false });
          return `${time}<br/>數值：<b>${value}</b>`;
        },
      },
      xAxis: {
        type: 'time',
        min: seedEndTs - WINDOW_MS,
        max: seedEndTs,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8' },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#94a3b8' },
      },
      series: [
        {
          name: 'Live',
          type: 'line',
          showSymbol: false,
          smooth: false,
          lineStyle: { color: LINE_COLOR, width: 1.5 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(34,211,238,0.45)' },
              { offset: 1, color: 'rgba(34,211,238,0)' },
            ]),
          },
          data: dataBufferRef.current,
        },
      ],
    };

    chart.setOption(option);

    // 訂閱在元件整個生命週期常駐；視覺暫停與否由 isPausedRef 控制
    const unsubscribe = subscribeLiveMetrics((p) => {
      const point: PointTuple = [p.timestamp, p.value];
      dataBufferRef.current.push(point);

      let didTrim = false;
      if (dataBufferRef.current.length > MAX_POINTS) {
        dataBufferRef.current = dataBufferRef.current.slice(-KEEP_POINTS);
        didTrim = true;
      }

      if (!isPausedRef.current) {
        if (didTrim) {
          // trim 後一次性 setOption 把整個 buffer 塞回去（順便讓 scale 重生）
          chart.setOption({
            xAxis: { min: p.timestamp - WINDOW_MS, max: p.timestamp },
            series: [{ data: dataBufferRef.current }],
          });
        } else {
          chart.appendData({ seriesIndex: 0, data: [point] });
          chart.setOption({
            xAxis: { min: p.timestamp - WINDOW_MS, max: p.timestamp },
          });
        }
      }
      // 暫停模式：只更新 buffer & 計數，不動圖表（畫面保持快照供使用者拖曳檢視）

      setPointCount(dataBufferRef.current.length);
    });

    return () => {
      unsubscribe();
      chart.dispose();
      chartInstance.current = null;
    };
  }, []);

  useChartAutoResize(chartInstance, chartRef);

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            即時指標 (Live Metrics)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            初始 10,000 筆歷史資料，每 200ms 推送一個新點；超過 {MAX_POINTS.toLocaleString()} 筆會自動保留最新 {KEEP_POINTS.toLocaleString()} 筆
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-2">
            {!isPaused ? (
              <>
                <span className="relative flex items-center">
                  <span className="absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-60 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                </span>
                <span className="text-cyan-300">LIVE</span>
              </>
            ) : (
              <>
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-amber-300">PAUSED</span>
              </>
            )}
            <span className="text-slate-400">
              · 資料點：<span className="text-cyan-300">{pointCount.toLocaleString()}</span>
            </span>
          </span>
          <Button
            variant="contained"
            size="small"
            startIcon={isPaused ? <PlayArrowIcon /> : <PauseIcon />}
            onClick={togglePause}
            sx={{
              bgcolor: isPaused ? '#0284c7' : '#475569',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '0.5rem',
              px: 1.5,
              py: 0.6,
              '&:hover': { bgcolor: isPaused ? '#0ea5e9' : '#64748b' },
            }}
          >
            {isPaused ? '繼續播放' : '暫停 / 查看歷史'}
          </Button>
        </div>
      </header>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 h-[520px]">
        <div ref={chartRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default LiveMetrics;
