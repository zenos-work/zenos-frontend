import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';
import { Settings } from 'lucide-react';
import ChartBlock, { type ChartData } from '../../ui/blocks/ChartBlock';
import ChartSettings from '../blocks/ChartSettings';

export const ChartExtension = Node.create({
  name: 'chartBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      chartData: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'chart-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['chart-block', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer((props) => {
      const { chartData } = props.node.attrs;
      const [showSettings, setShowSettings] = useState(false);

      const updateChartData = (newData: ChartData) => {
        props.updateAttributes({ chartData: newData });
        setShowSettings(false);
      };

      return (
        <NodeViewWrapper className="chart-block-wrapper relative group">
          <div className={`transition-all ${props.selected ? 'ring-2 ring-[color:var(--accent)] rounded-xl' : ''}`}>
            {chartData ? (
              <ChartBlock chart={chartData as ChartData} />
            ) : (
              <div className="p-10 bg-[color:var(--surface-1)] text-center rounded-xl border-2 border-dashed border-[color:var(--border)]">
                <p className="text-sm font-medium text-[color:var(--text-muted)]">No chart data</p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="mt-3 px-4 py-2 bg-[color:var(--surface-ink)] text-white rounded-full text-xs font-bold"
                >
                  Setup Chart
                </button>
              </div>
            )}

            {props.selected && (
              <button
                onClick={() => setShowSettings(true)}
                className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-black/90 rounded-full shadow-lg border border-[color:var(--border)] hover:scale-110 transition-transform z-10"
                title="Configure Chart"
              >
                <Settings size={16} className="text-[color:var(--accent)]" />
              </button>
            )}
          </div>

          {showSettings && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
               <div className="w-full max-w-lg h-[600px] shadow-2xl rounded-2xl overflow-hidden animate-slide-up">
                 <ChartSettings
                   currentData={chartData}
                   onSave={updateChartData}
                   onClose={() => setShowSettings(false)}
                 />
               </div>
            </div>
          )}
        </NodeViewWrapper>
      );
    });
  },
});
