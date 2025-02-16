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

import { observable, action, computed, makeObservable } from 'mobx';
import { hashArray } from '@finos/legend-shared';
import { CORE_HASH_STRUCTURE } from '../../../../../../../MetaModelConst';
import type { Hashable } from '@finos/legend-shared';
import type { EnumerationMapping } from '../../../mapping/EnumerationMapping';
import type { RawLambda } from '../../../../rawValueSpecification/RawLambda';
import { AbstractFlatDataPropertyMapping } from './AbstractFlatDataPropertyMapping';
import type { SetImplementation } from '../../../mapping/SetImplementation';
import type { PropertyMappingsImplementation } from '../../../mapping/PropertyMappingsImplementation';
import type { PropertyReference } from '../../../domain/PropertyReference';
import type { PropertyMappingVisitor } from '../../../mapping/PropertyMapping';

export class FlatDataPropertyMapping
  extends AbstractFlatDataPropertyMapping
  implements Hashable
{
  transformer?: EnumerationMapping | undefined;
  transform: RawLambda; // @MARKER GENERATED MODEL DISCREPANCY --- Studio does not process lambda

  constructor(
    owner: PropertyMappingsImplementation,
    property: PropertyReference,
    transform: RawLambda,
    source: SetImplementation,
    target?: SetImplementation,
  ) {
    super(owner, property, source, target);

    makeObservable(this, {
      transformer: observable,
      transform: observable,
      setTransformer: action,
      isStub: computed,
      hashCode: computed,
    });

    this.transform = transform;
  }

  setTransformer(value: EnumerationMapping | undefined): void {
    this.transformer = value;
  }

  override get isStub(): boolean {
    return this.transform.isStub;
  }

  override get hashCode(): string {
    return hashArray([
      CORE_HASH_STRUCTURE.FLAT_DATA_PROPERTY_MAPPING,
      super.hashCode,
      this.transformer?.id.value ?? '',
      this.transform,
    ]);
  }

  accept_PropertyMappingVisitor<T>(visitor: PropertyMappingVisitor<T>): T {
    return visitor.visit_FlatDataPropertyMapping(this);
  }
}
