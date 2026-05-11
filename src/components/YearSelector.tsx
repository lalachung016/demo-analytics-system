import React from 'react';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import IconButton from '@mui/material/IconButton';

interface Props {
  year: number;
  minYear: number;
  maxYear: number;
  onYearChange: (year: number) => void;
}

const YearSelector: React.FC<Props> = ({ year, minYear, maxYear, onYearChange }) => {
  return (
    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-1">
      <IconButton
        size="small"
        onClick={() => onYearChange(year - 1)}
        disabled={year === minYear}
        sx={{
          color: '#cbd5e1',
          '&:hover': { color: '#38bdf8' },
          '&.Mui-disabled': { color: '#64748b' },
        }}
      >
        <KeyboardArrowLeftIcon fontSize="small" />
      </IconButton>
      <span className="mx-4 font-mono">{year}</span>
      <IconButton
        size="small"
        onClick={() => onYearChange(year + 1)}
        disabled={year === maxYear}
        sx={{
          color: '#cbd5e1',
          '&:hover': { color: '#38bdf8' },
          '&.Mui-disabled': { color: '#64748b' },
        }}
      >
        <KeyboardArrowRightIcon fontSize="small" />
      </IconButton>
    </div>
  );
};

export default YearSelector;
