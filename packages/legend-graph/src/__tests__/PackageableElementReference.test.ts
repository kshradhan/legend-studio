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

import { unitTest } from '@finos/legend-shared';
import { Class } from '../models/metamodels/pure/packageableElements/domain/Class';
import { Package } from '../models/metamodels/pure/packageableElements/domain/Package';
import { PrimitiveType } from '../models/metamodels/pure/packageableElements/domain/PrimitiveType';
import {
  PackageableElementExplicitReference,
  PackageableElementImplicitReference,
} from '../models/metamodels/pure/packageableElements/PackageableElementReference';
import { ImportAwareCodeSection } from '../models/metamodels/pure/packageableElements/section/Section';
import { SectionIndex } from '../models/metamodels/pure/packageableElements/section/SectionIndex';

test(
  unitTest(
    'Packageable element reference resolves value for serialization properly',
  ),
  () => {
    const rootPackage = new Package('testRoot');
    const _package = new Package('model');
    rootPackage.addElement(_package);
    const class1 = new Class('Class1');
    const class2 = new Class('Class2');
    const primitiveType1 = new PrimitiveType('PrimitiveType1');
    _package.addElement(class1);

    // test explicit reference
    expect(
      PackageableElementExplicitReference.create(class1).valueForSerialization,
    ).toEqual('model::Class1');

    const explicitReference =
      PackageableElementExplicitReference.create(primitiveType1);
    expect(explicitReference.valueForSerialization).toEqual(
      primitiveType1.path,
    );
    explicitReference.setValue(class1);
    expect(explicitReference.valueForSerialization).toEqual(class1.path);

    // test implicit reference that skips section check
    expect(
      PackageableElementImplicitReference.create(class1, '')
        .valueForSerialization,
    ).toEqual('');
    const implicitReference1 = PackageableElementImplicitReference.create(
      class1,
      'something',
    );
    expect(implicitReference1.valueForSerialization).toEqual('something');
    implicitReference1.setValue(class2);
    expect(implicitReference1.valueForSerialization).toEqual(class2.path);
    implicitReference1.setValue(class1);
    expect(implicitReference1.valueForSerialization).toEqual('something');

    // test implicit reference resolved from section imports when section info is not provided
    const implicitReference2 =
      PackageableElementImplicitReference.resolveFromSection(
        class1,
        'something',
        undefined,
      );
    expect(implicitReference2.valueForSerialization).toEqual(class1.path);
    implicitReference2.setValue(class2);
    expect(implicitReference2.valueForSerialization).toEqual(class2.path);
    implicitReference2.setValue(class1);
    expect(implicitReference2.valueForSerialization).toEqual(class1.path);

    // test implicit reference resolved from section imports when section info is provided
    const sectionIndex = new SectionIndex('');
    const parentSection = new ImportAwareCodeSection('', sectionIndex);
    const implicitReference3 =
      PackageableElementImplicitReference.resolveFromSection(
        class1,
        'something',
        parentSection,
      );
    expect(implicitReference3.valueForSerialization).toEqual('something');
    implicitReference3.setValue(class2);
    expect(implicitReference3.valueForSerialization).toEqual(class2.path);
    implicitReference3.setValue(class1);
    expect(implicitReference3.valueForSerialization).toEqual('something');
    // test when we delete the parent section
    sectionIndex.setIsDeleted(true);
    expect(implicitReference3.valueForSerialization).toEqual(class1.path);
    implicitReference3.setValue(class2);
    expect(implicitReference3.valueForSerialization).toEqual(class2.path);
    implicitReference3.setValue(class1);
    expect(implicitReference3.valueForSerialization).toEqual(class1.path);
  },
);
