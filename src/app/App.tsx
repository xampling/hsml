import { useEffect, useMemo, useState } from 'react';
import Viewer from './Viewer';
import { layoutTree } from '../layout/layoutFlex';
import { LayoutBox } from '../layout/types';
import { ValidationIssue } from '../hsml/types';
import { parseHSML } from '../hsml/parseHSML';
import { buildTree } from '../hsml/buildTree';
import { resolveStyles } from '../hsml/resolveStyles';
import { measureTree } from '../hsml/measure';
import { validateHSML } from '../hsml/validate';
import { sampleHsml } from './sampleHsml';

const initialText = sampleHsml;

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
      const parsed = parseHSML(source);
      const tree = buildTree(parsed.nodes);
      const resolved = resolveStyles(tree, parsed.rules);
      measureTree(resolved);
      const validation = validateHSML(resolved);
      setIssues(validation);
      const hasError = validation.some((v) => v.level === 'error');
      if (hasError) {
        setLayout(null);
        return;
      }
      const nextLayout = layoutTree(resolved);
      setLayout(nextLayout);
    } catch (err) {
      setIssues([{ level: 'error', path: 'root', message: (err as Error).message }]);
      setLayout(null);
    }
  }

  function resetSample() {
    setText(initialText);
    applyChanges(initialText);
  }

  return (
    <div className="app-shell">
      <header>
        <h1>HSML → Three.js Interior Builder (PoC)</h1>
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
      <div className="footer">Edit the HSML text on the left to update the scene.</div>
    </div>
  );
}
