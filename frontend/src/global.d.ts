declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'react-katex' {
  import React from 'react';
  export const InlineMath: React.FC<{ math: string }>;
  export const BlockMath: React.FC<{ math: string }>;
}

declare namespace JSX {
  interface IntrinsicElements {
    'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      value?: string;
      placeholder?: string;
    };
  }
}
