import { CHAT_SOURCE_LABEL, chatSource } from '@/lib/admin/parky-tokens';
import { Chip } from '../../_ui/primitives';

/** Where a chat came from, as a chip: the app stands out, the website is the quiet default. */
export function SourceChip({ source }: { source: string | undefined }) {
  const from = chatSource(source);
  return <Chip tone={from === 'app' ? 'primary' : 'muted'}>{CHAT_SOURCE_LABEL[from]}</Chip>;
}
