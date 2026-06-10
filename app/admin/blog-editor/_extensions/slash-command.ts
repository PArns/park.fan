'use client';

import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { createRoot, type Root } from 'react-dom/client';
import { createElement, createRef } from 'react';
import { SlashMenu, type SlashItem, type SlashMenuHandle } from '../_components/slash-menu';

/**
 * TipTap extension that wires the Suggestion plugin to a tippy.js popover
 * which mounts our React <SlashMenu />. The catalogue of items is built
 * elsewhere and passed in via options, so the picker actions can call back
 * into the editor's outer state (e.g. to open a Park/Ride picker dialog).
 */
export const SlashCommand = Extension.create<{
  buildItems: () => SlashItem[];
}>({
  name: 'slashCommand',

  addOptions() {
    return { buildItems: () => [] };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        command: ({ editor, range, props }) => {
          (props as SlashItem).command({ editor, range });
        },
        items: ({ query }) => {
          const all = this.options.buildItems();
          if (!query) return all;
          const q = query.toLowerCase();
          return all.filter(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              i.description.toLowerCase().includes(q)
          );
        },
        render: () => {
          let popup: TippyInstance | undefined;
          let root: Root | undefined;
          let container: HTMLDivElement | undefined;
          const handleRef = createRef<SlashMenuHandle>();

          const renderMenu = (items: SlashItem[], cmd: (it: SlashItem) => void) => {
            if (!root || !container) return;
            root.render(createElement(SlashMenu, { ref: handleRef, items, command: cmd }));
          };

          return {
            onStart: (props) => {
              container = document.createElement('div');
              root = createRoot(container);
              renderMenu(props.items as SlashItem[], (it) => props.command(it));

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: container,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                arrow: false,
                duration: 0,
                hideOnClick: true,
                theme: 'tiptap-popup',
              })[0];
            },
            onUpdate: (props) => {
              renderMenu(props.items as SlashItem[], (it) => props.command(it));
              popup?.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect });
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup?.hide();
                return true;
              }
              return handleRef.current?.onKeyDown(props.event) ?? false;
            },
            onExit: () => {
              popup?.destroy();
              // Defer unmounting until after the current render commits so
              // React doesn't warn about unmounting during render.
              setTimeout(() => root?.unmount(), 0);
              container = undefined;
            },
          };
        },
      }),
    ];
  },
});
