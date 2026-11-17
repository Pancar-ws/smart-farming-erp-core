// src/core/print/usePrint.ts
export type PrintKind = 'thermal80' | 'thermal58' | 'a4';

const PAGE: Record<PrintKind, string> = {
  thermal80: '@page { size: 80mm auto; margin: 2mm }',
  thermal58: '@page { size: 58mm auto; margin: 2mm }',
  a4: '@page { size: A4; margin: 12mm }',
};

export function usePrint() {
  return (kind: PrintKind) => {
    const style = document.createElement('style');
    style.dataset.printPage = '';
    style.textContent = PAGE[kind];
    document.head.appendChild(style);
    document.body.dataset.printKind = kind;

    const done = () => {
      style.remove();
      delete document.body.dataset.printKind;
      window.removeEventListener('afterprint', done);
    };

    window.addEventListener('afterprint', done);
    window.print();
  };
}

