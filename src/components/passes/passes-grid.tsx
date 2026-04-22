import type { PassItem } from '@/lib/config';

import { PassCard } from './pass-card';

interface Props {
  passes: readonly PassItem[];
  emptyLabel?: string;
}

export function PassesGrid({ passes, emptyLabel }: Props) {
  if (passes.length === 0) {
    return (
      <div
        className="flex items-center justify-center font-sans text-gray-500"
        style={{
          width: '898px',
          marginLeft: '91px',
          marginRight: '91px',
          paddingTop: '120px',
          paddingBottom: '120px',
          fontSize: '22px',
        }}
      >
        {emptyLabel ?? 'No passes available right now.'}
      </div>
    );
  }
  return (
    <div
      className="flex flex-col"
      style={{ rowGap: '30px', width: '898px', marginLeft: '91px', marginRight: '91px' }}
    >
      {passes.map((pass) => (
        <PassCard key={pass.slug} pass={pass} />
      ))}
    </div>
  );
}
