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

import { computed, makeObservable } from 'mobx';
import { hashArray } from '@finos/legend-shared';
import type { Hashable } from '@finos/legend-shared';
import { PropertyHolderView } from './PropertyHolderView';
import type { ClassView } from './ClassView';
import type { Diagram } from './Diagram';
import { DIAGRAM_HASH_STRUCTURE } from '../../../../DSLDiagram_ModelUtils';
import type {
  Association,
  PackageableElementReference,
  PropertyReference,
} from '@finos/legend-graph';

export class AssociationView extends PropertyHolderView implements Hashable {
  association: PackageableElementReference<Association>;

  constructor(
    owner: Diagram,
    association: PackageableElementReference<Association>,
    property: PropertyReference,
    from: ClassView,
    to: ClassView,
  ) {
    super(owner, property, from, to);

    makeObservable(this, {
      hashCode: computed,
    });

    this.association = association;
  }

  override get hashCode(): string {
    return hashArray([
      DIAGRAM_HASH_STRUCTURE.ASSOCIATION_VIEW,
      super.hashCode,
      this.association.hashValue,
    ]);
  }
}
