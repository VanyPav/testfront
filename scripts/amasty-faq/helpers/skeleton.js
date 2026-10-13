/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package FAQ and Product Questions
 */

import { Skeleton, SkeletonRow, provider as UI } from '@dropins/tools/components.js';
import { createElement as createVNode } from '@dropins/tools/preact-compat.js';
import { createElement } from './dom.js';

export default function createSkeleton(lines, className) {
  const skeleton = createElement('div', { className });

  UI.render(Skeleton, {
    rowGap: 'medium',
    children: [
      createVNode(SkeletonRow, { key: 'title', variant: 'heading', size: 'large' }),
      createVNode(SkeletonRow, {
        key: 'rows', size: 'medium', lines, fullWidth: true, multilineGap: 'medium',
      }),
    ],
  })(skeleton);

  return skeleton;
}
