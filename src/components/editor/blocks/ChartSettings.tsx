import { useState } from 'react';
import type { ChartData } from '../../ui/blocks/ChartBlock';
import { Save, X, Plus, Trash2 } from 'lucide-react';

interface ChartSettingsProps {
  currentData: ChartData;
  onSave: (data: ChartData) => void;
  onClose: () => void;
}

export default function ChartSettings({ currentData, onSave, onClose }: ChartSettingsProps) {
  const [data, setData] = useState<ChartData>(currentData || {
    title: 'New Chart',
    type: 'BAR',
    data: [{ name: 'A', value: 10 }, { name: 'B', value: 20 }],
    xAxisKey: 'name',
    yAxisKey: 'value'
  });

  const [jsonInput, setJsonInput] = useState(JSON.stringify(data.data, null, 2));

  const handleJsonChange = (val: string) => {
    setJsonInput(val);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        setData(prev => ({ ...prev, data: parsed }));
      }
    } catch {
      // invalid json, ignore for real-time sync
    }
  };

  const addRow = () => {
    const newData = [...data.data, { name: '', value: 0 }];
    setData(prev => ({ ...prev, data: newData }));
    setJsonInput(JSON.stringify(newData, null, 2));
  };

  return (
    <div className="flex flex-col h-full bg-[color:var(--surface-0)] text-[color:var(--text-primary)]">
      <div className="flex items-center justify-between p-4 border-b border-[color:var(--border)] bg-[color:var(--surface-1)]">
        <h3 className="font-bold text-sm">Chart Settings</h3>
        <button onClick={onClose} className="p-1 hover:bg-[color:var(--surface-2)] rounded">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)] mb-1">Chart Title</label>
          <input
            value={data.title}
            onChange={e => setData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)] mb-1">Chart Type</label>
          <select
            value={data.type}
            onChange={e => setData(prev => ({ ...prev, type: e.target.value as any }))}
            className="w-full bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
          >
            <option value="BAR">Bar Chart</option>
            <option value="LINE">Line Chart</option>
            <option value="PIE">Pie Chart</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)] mb-1">X-Axis Key</label>
            <input
              value={data.xAxisKey}
              onChange={e => setData(prev => ({ ...prev, xAxisKey: e.target.value }))}
              placeholder="name"
              className="w-full bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded px-2 py-1.5 text-xs outline-none focus:border-[color:var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)] mb-1">Y-Axis Key</label>
            <input
              value={data.yAxisKey}
              onChange={e => setData(prev => ({ ...prev, yAxisKey: e.target.value }))}
              placeholder="value"
              className="w-full bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded px-2 py-1.5 text-xs outline-none focus:border-[color:var(--accent)]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">Data (JSON array)</label>
            <button onClick={addRow} className="text-[10px] flex items-center gap-1 text-[color:var(--accent)] hover:underline">
              <Plus size={10} /> Add row
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={e => handleJsonChange(e.target.value)}
            rows={8}
            className="w-full bg-[color:var(--surface-3)] font-mono text-[11px] p-3 rounded-lg border border-[color:var(--border)] outline-none focus:border-[color:var(--accent)]"
          />
        </div>
      </div>

      <div className="p-4 border-t border-[color:var(--border)] bg-[color:var(--surface-1)]">
        <button
          onClick={() => onSave(data)}
          className="w-full flex items-center justify-center gap-2 bg-[color:var(--accent)] text-white font-semibold text-sm py-2 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Save size={14} /> Update Chart Block
        </button>
      </div>
    </div>
  );
}
