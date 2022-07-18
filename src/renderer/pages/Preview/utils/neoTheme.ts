import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, tags as t } from '@codemirror/highlight';

export const neoTheme = EditorView.theme(
  {
    '.cm-s-neo pre': { padding: '0' },
    '.cm-s-neo .CodeMirror-gutters': {
      border: 'none',
      borderRight: '10px solid transparent',
      backgroundColor: 'transparent',
    },
    '.cm-s-neo .CodeMirror-linenumber': {
      padding: '0',
      color: '#e0e2e5',
    },
    '.cm-s-neo .CodeMirror-guttermarker': { color: '#1d75b3' },
    '.cm-s-neo .CodeMirror-guttermarker-subtle': { color: '#e0e2e5' },

    '.cm-s-neo .CodeMirror-cursor': {
      width: 'auto',
      border: '0',
      background: 'rgba(155,157,162,0.37)',
      zIndex: '1',
    },
  },
  { dark: false }
);

export const neoHighlightStyle = HighlightStyle.define([
  {
    tag: [t.keyword, t.propertyName],
    color: '#1d75b3',
  },
  { tag: [t.comment], color: '#75787b' },
  { tag: [t.number, t.atom], color: '#75438a' },
  { tag: [t.tagName, t.variableName], color: '#9c3328' },
  { tag: [t.string], color: '#b35e14' },
  {
    tag: [
      t.typeName,
      t.className,
      t.number,
      t.changed,
      t.annotation,
      t.modifier,
      t.self,
      t.namespace,
    ],
    color: '#047d65',
  },
]);

export const neo: Extension = [neoTheme, neoHighlightStyle];
