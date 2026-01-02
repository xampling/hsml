import { NodeDecl, StyleMap } from './parseHSML';
import { HSMLNodeDraft } from './types';

export function buildTree(nodes: NodeDecl[]): HSMLNodeDraft {
  const root: HSMLNodeDraft = { name: 'root', path: '', children: [], inlineStyle: {} };
  const byPath = new Map<string, HSMLNodeDraft>();
  byPath.set('', root);

  for (const decl of nodes) {
    const segments = decl.path;
    let current = root;
    let pathSoFar = '';

    for (const seg of segments) {
      pathSoFar = pathSoFar ? `${pathSoFar}/${seg}` : seg;
      const existing = byPath.get(pathSoFar);
      if (existing) {
        current = existing;
      } else {
        const node: HSMLNodeDraft = { name: seg, path: pathSoFar, children: [], inlineStyle: {} };
        current.children.push(node);
        byPath.set(pathSoFar, node);
        current = node;
      }
    }

    if (decl.content) {
      current.content = decl.content;
    }
    if (decl.inlineStyle) {
      current.inlineStyle = mergeStyles(current.inlineStyle, decl.inlineStyle);
    }
  }

  return root;
}

function mergeStyles(a: StyleMap, b: StyleMap): StyleMap {
  return { ...a, ...b };
}
