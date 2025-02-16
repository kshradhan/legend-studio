/**
 * Copyright (c) 2020-present, Goldman Sachs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { hashArray } from '@finos/legend-shared';
import type { Hashable } from '@finos/legend-shared';
import { DIAGRAM_HASH_STRUCTURE } from '../../../../../DSLDiagram_ModelUtils';

export class Point implements Hashable {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  rotateX(angle: number): number {
    return this.x * Math.cos(angle) - this.y * Math.sin(angle);
  }

  rotateY(angle: number): number {
    return this.x * Math.sin(angle) + this.y * Math.cos(angle);
  }

  get hashCode(): string {
    return hashArray([
      DIAGRAM_HASH_STRUCTURE.POINT,
      this.x.toString(),
      this.y.toString(),
    ]);
  }
}
