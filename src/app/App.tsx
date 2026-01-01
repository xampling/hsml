import { useEffect, useMemo, useState } from 'react';
import Viewer from './Viewer';
import { sampleRoomML } from './sampleRoomML';
import { parseRoomML } from '../roomml/parse';
import { validateRoomML } from '../roomml/validate';
import { layoutTree } from '../layout/layoutFlex';
import { LayoutBox } from '../layout/types';
import { RoomMLNode, ValidationIssue } from '../roomml/types';

const initialText = JSON.stringify(sampleRoomML, null, 2);

export default function App() {
  const [text, setText] = useState(initialText);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [layout, setLayout] = useState<LayoutBox | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [showLayout, setShowLayout] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [activePane, setActivePane] = useState<'editor' | 'viewer'>('viewer');
  const [navigationMode, setNavigationMode] = useState<'first-person' | 'orbit'>('first-person');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    applyChanges(initialText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mediaQuery = '(max-width: 900px)';
    const mql = typeof window !== 'undefined' ? window.matchMedia(mediaQuery) : null;

    const updateIsMobile = (matches: boolean) => {
      setIsMobile(matches);
      if (!matches) {
        setActivePane('viewer');
      }
    };

    if (mql) {
      updateIsMobile(mql.matches);
      const handler = (event: MediaQueryListEvent) => updateIsMobile(event.matches);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }

    return () => {};
  }, []);

  const errorCount = useMemo(() => issues.filter((i) => i.level === 'error').length, [issues]);

  function applyChanges(textOverride?: string) {
    const source = textOverride ?? text;
    try {
      const parsed = parseRoomML(source) as RoomMLNode;
      const validation = validateRoomML(parsed);
      setIssues(validation);
      const hasError = validation.some((v) => v.level === 'error');
      if (hasError) return;
      const nextLayout = layoutTree(parsed);
      setLayout(nextLayout);
    } catch (err) {
      setIssues([{ level: 'error', path: 'root', message: (err as Error).message }]);
    }
  }

  function formatText() {
    try {
      const parsed = JSON.parse(text);
      setText(JSON.stringify(parsed, null, 2));
    } catch (err) {
      setIssues([{ level: 'error', path: 'format', message: (err as Error).message }]);
    }
  }

  function resetSample() {
    setText(initialText);
    applyChanges(initialText);
  }

  return (
    <div className="app-shell">
      <header>
        <h1>RoomML → Three.js Interior Builder (PoC)</h1>
      </header>
      <main>
        {isMobile && (
          <div className="mobile-tabs">
            <button className={activePane === 'editor' ? 'active' : ''} onClick={() => setActivePane('editor')}>
              Editor
            </button>
            <button className={activePane === 'viewer' ? 'active' : ''} onClick={() => setActivePane('viewer')}>
              Viewer
            </button>
          </div>
        )}
        <section className={`panel ${isMobile && activePane !== 'editor' ? 'mobile-hidden' : ''}`}>
          <div className="controls">
            <button onClick={() => applyChanges()}>Apply</button>
            <button onClick={formatText} className="secondary">
              Format
            </button>
            <button onClick={resetSample} className="secondary">
              Reset to sample
            </button>
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
          <div className="toggles">
            <label>
              <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} /> Wireframe
            </label>
            <label>
              <input type="checkbox" checked={showLayout} onChange={(e) => setShowLayout(e.target.checked)} /> Layout boxes
            </label>
            <label>
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> Grid/axes
            </label>
            <label>
              Navigation:{' '}
              <select value={navigationMode} onChange={(e) => setNavigationMode(e.target.value as 'first-person' | 'orbit')}>
                <option value="first-person">First person</option>
                <option value="orbit">Orbit</option>
              </select>
            </label>
          </div>
          <div className="issue-list">
            <div className="badge">Issues: {issues.length}</div>
            {issues.length === 0 && <div>No issues detected.</div>}
            {issues.map((issue, idx) => (
              <div key={idx} className={`issue ${issue.level}`}>
                <strong>[{issue.level.toUpperCase()}]</strong> {issue.path}: {issue.message}
              </div>
            ))}
          </div>
        </section>
        <section className={`viewer-shell ${isMobile && activePane !== 'viewer' ? 'mobile-hidden' : ''}`}>
          <Viewer
            layout={layout}
            wireframe={wireframe}
            showLayout={showLayout}
            showGrid={showGrid}
            hasErrors={errorCount > 0}
            navigationMode={navigationMode}
          />
        </section>
      </main>
      <div className="footer">Edit the RoomML JSON on the left to update the scene.</div>
    </div>
  );
}
