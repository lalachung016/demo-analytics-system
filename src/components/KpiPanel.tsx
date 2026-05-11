import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import type { KpiCategory, KpiData } from '../types/dashboard';

interface Props {
  kpiCategory: KpiCategory;
  isLoading: boolean;
  kpiData: KpiData[];
  onCategoryChange: (category: KpiCategory) => void;
}

const KpiPanel: React.FC<Props> = ({
  kpiCategory,
  isLoading,
  kpiData,
  onCategoryChange,
}) => {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 min-h-[290px]">
      <div className="flex items-center gap-2 mb-4 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
          <h2 className="font-semibold text-slate-300">KPI 指標指標</h2>
        </div>
        <FormControl size="small" sx={{ minWidth: 88 }}>
          <Select
            value={kpiCategory}
            onChange={(e) => onCategoryChange(e.target.value as KpiCategory)}
            IconComponent={ExpandMoreIcon}
            sx={{
              color: '#e2e8f0',
              fontSize: '0.75rem',
              height: 30,
              '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0ea5e9' },
              '.MuiSelect-icon': { color: '#94a3b8' },
            }}
          >
            <MenuItem value="A">選項 A</MenuItem>
            <MenuItem value="B">選項 B</MenuItem>
          </Select>
        </FormControl>
      </div>
      <div className="space-y-4 h-full">
        {!isLoading ? (
          kpiData.map((item) => (
            <div key={item.name} className="bg-slate-800/50 p-4 rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">{item.name}</span>
                <Tooltip
                  title={item.description}
                  arrow
                  placement="top"
                  slotProps={{
                    tooltip: {
                      sx: {
                        bgcolor: '#0f172a',
                        color: '#e2e8f0',
                        border: '1px solid #1e293b',
                        fontSize: '0.75rem',
                        maxWidth: 280,
                      },
                    },
                    arrow: { sx: { color: '#0f172a' } },
                  }}
                >
                  <InfoOutlinedIcon
                    fontSize="inherit"
                    sx={{ color: '#94a3b8', fontSize: 15, cursor: 'help' }}
                    aria-label={`${item.name} 指標說明`}
                  />
                </Tooltip>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono text-white">
                  {item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div
                  className={`text-xs font-medium ${
                    item.value >= item.previousValue ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {`${item.value >= item.previousValue ? '+' : ''}${(
                    ((item.value - item.previousValue) / item.previousValue) *
                    100
                  ).toFixed(1)}%`}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="min-h-[250px] flex items-center justify-center bg-slate-800/30 p-4 rounded-lg text-center text-slate-500 text-sm font-mono">
            載入中…
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiPanel;
