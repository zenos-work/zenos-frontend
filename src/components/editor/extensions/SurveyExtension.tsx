import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';
import { Settings } from 'lucide-react';
import SurveyBlock from '../../ui/blocks/SurveyBlock';
import SurveySettings from '../blocks/SurveySettings';

export const SurveyExtension = Node.create({
  name: 'surveyBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      surveyId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'survey-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['survey-block', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer((props) => {
      const { surveyId } = props.node.attrs;
      const [showSettings, setShowSettings] = useState(false);

      const updateSurveyId = (newId: string) => {
        props.updateAttributes({ surveyId: newId });
        setShowSettings(false);
      };

      return (
        <NodeViewWrapper className="survey-block-wrapper relative group">
          <div className={`transition-all ${props.selected ? 'ring-2 ring-[color:var(--accent)] rounded-xl' : ''}`}>
            {surveyId ? (
              <SurveyBlock surveyId={surveyId} />
            ) : (
              <div className="p-10 bg-[color:var(--surface-1)] text-center rounded-xl border-2 border-dashed border-[color:var(--border)]">
                <p className="text-sm font-medium text-[color:var(--text-muted)]">No survey selected</p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="mt-3 px-4 py-2 bg-[color:var(--surface-ink)] text-white rounded-full text-xs font-bold"
                >
                  Setup Survey
                </button>
              </div>
            )}

            {props.selected && (
              <button
                onClick={() => setShowSettings(true)}
                className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-black/90 rounded-full shadow-lg border border-[color:var(--border)] hover:scale-110 transition-transform z-10"
                title="Configure Survey"
              >
                <Settings size={16} className="text-[color:var(--accent)]" />
              </button>
            )}
          </div>

          {showSettings && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
               <div className="w-full max-w-md h-[500px] shadow-2xl rounded-2xl overflow-hidden animate-slide-up">
                 <SurveySettings
                   currentId={surveyId}
                   onSave={updateSurveyId}
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
