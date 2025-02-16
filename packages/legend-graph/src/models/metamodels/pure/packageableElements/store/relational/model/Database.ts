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

import { hashArray, guaranteeNonNullable } from '@finos/legend-shared';
import type { Hashable } from '@finos/legend-shared';
import { CORE_HASH_STRUCTURE } from '../../../../../../../MetaModelConst';
import { observable, makeObservable, override } from 'mobx';
import { Store } from '../../Store';
import type { PackageableElementVisitor } from '../../../PackageableElement';
import type { Schema } from './Schema';
import type { Join } from './Join';
import type { Filter } from './Filter';
import { getAllIncludedDbs } from '../../../../../../../helpers/DatabaseHelper';

export class Database extends Store implements Hashable {
  schemas: Schema[] = [];
  joins: Join[] = [];
  filters: Filter[] = [];

  constructor(name: string) {
    super(name);

    makeObservable<Database, '_elementHashCode'>(this, {
      schemas: observable,
      joins: observable,
      filters: observable,
      _elementHashCode: override,
    });
  }

  static createStub = (): Database => new Database('');

  getSchema = (name: string): Schema =>
    guaranteeNonNullable(
      this.schemas.find((schema) => schema.name === name),
      `Can't find schema '${name}' in database '${this.path}'`,
    );

  getJoin = (name: string): Join =>
    guaranteeNonNullable(
      Array.from(getAllIncludedDbs(this))
        .flatMap((db) => db.joins)
        .find((join) => join.name === name),
      `Can't find join '${name}' in database '${this.path}'`,
    );

  getFilter = (name: string): Filter =>
    guaranteeNonNullable(
      this.filters.find((filter) => filter.name === name),
      `Can't find filter '${name}' in database '${this.path}'`,
    );

  protected override get _elementHashCode(): string {
    return hashArray([
      CORE_HASH_STRUCTURE.DATABASE,
      this.path,
      hashArray(this.includes.map((include) => include.hashValue)),
      hashArray(this.schemas),
      hashArray(this.joins),
      hashArray(this.filters),
    ]);
  }

  accept_PackageableElementVisitor<T>(
    visitor: PackageableElementVisitor<T>,
  ): T {
    return visitor.visit_Database(this);
  }
}
