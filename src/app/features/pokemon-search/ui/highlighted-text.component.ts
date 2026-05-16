import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface Segment {
  readonly text: string;
  readonly match: boolean;
}

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const splitOnQuery = (text: string, query: string): readonly Segment[] => {
  const trimmed = query.trim();
  if (!trimmed) return [{ text, match: false }];
  // Case-insensitive split that preserves both the matches and the
  // surrounding text. Special chars in the query are escaped so a typo
  // like "(" doesn't blow up the regex.
  const pattern = new RegExp(`(${escapeRegex(trimmed)})`, 'ig');
  return text
    .split(pattern)
    .filter((piece) => piece.length > 0)
    .map((piece) => ({ text: piece, match: piece.toLowerCase() === trimmed.toLowerCase() }));
};

/**
 * Renders `text` with each case-insensitive occurrence of `query`
 * wrapped in a styled <mark>. Splits in TypeScript rather than via
 * innerHTML, so user input never reaches the DOM as markup.
 */
@Component({
  selector: 'app-highlighted-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span>
      @for (segment of segments(); track $index) {
        @if (segment.match) {
          <mark class="bg-primary text-ink rounded-sm px-0.5">{{ segment.text }}</mark>
        } @else {
          <span>{{ segment.text }}</span>
        }
      }
    </span>
  `,
})
export class HighlightedText {
  readonly text = input.required<string>();
  readonly query = input<string>('');

  protected readonly segments = computed(() => splitOnQuery(this.text(), this.query()));
}
