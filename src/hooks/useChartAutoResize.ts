import { useEffect, type RefObject } from 'react'
import type * as echarts from 'echarts'

/**
 * 監聽容器尺寸 (ResizeObserver) 與 window resize，於 debounce 後觸發 ECharts resize。
 * 用於：side menu 收合、視窗縮放、父容器寬高變動等情境。
 */
export const useChartAutoResize = (
  chartInstanceRef: RefObject<echarts.ECharts | null>,
  containerRef: RefObject<HTMLElement | null>,
  delay = 150,
) => {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const trigger = () => {
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(() => {
        chartInstanceRef.current?.resize()
        timer = null
      }, delay)
    }

    window.addEventListener('resize', trigger)

    let observer: ResizeObserver | null = null
    const el = containerRef.current
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(trigger)
      observer.observe(el)
    }

    return () => {
      if (timer !== null) clearTimeout(timer)
      window.removeEventListener('resize', trigger)
      observer?.disconnect()
    }
  }, [chartInstanceRef, containerRef, delay])
}
