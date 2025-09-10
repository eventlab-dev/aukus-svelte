import { Mark } from '@tiptap/core';

const SpoilerMark = Mark.create({
  name: 'spoiler', // Unique name for the mark
  inclusive: true, // Prevents the mark from extending to the entire node
  exitable: true, // Allows exiting the mark by pressing Backspace
  spanning: true,

  group: 'inline',

  // Define HTML attributes for the mark (e.g., CSS classes)
  addAttributes() {
    return {
      class: {
        default: 'spoiler',
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => ({ class: attributes.class }),
      },
    };
  },

  // Parse HTML to recognize spoiler elements
  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: node => node.classList?.contains('spoiler') && { class: 'spoiler' },
      },
    ];
  },

  // Render the mark as an HTML span with a class
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },

  // Add custom commands, including setSpoiler
  addCommands() {
    return {
      setSpoilerMark: () => ({ commands }) => {
        return commands.setMark(this.name, { class: 'spoiler' });
      },
      toggleSpoilerMark: () => ({ commands }) => {
        return commands.toggleMark(this.name, { class: 'spoiler' });
      },
      unsetSpoilerMark: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});

export default SpoilerMark;

