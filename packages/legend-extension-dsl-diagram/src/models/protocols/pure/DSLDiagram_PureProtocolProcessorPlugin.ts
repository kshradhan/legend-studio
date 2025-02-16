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

import packageJson from '../../../../package.json';
import { V1_Diagram } from './v1/model/packageableElements/diagram/V1_Diagram';
import type { PlainObject } from '@finos/legend-shared';
import { assertType } from '@finos/legend-shared';
import { deserialize, serialize } from 'serializr';
import {
  V1_diagramModelSchema,
  V1_DIAGRAM_ELEMENT_PROTOCOL_TYPE,
} from './v1/transformation/pureProtocol/V1_DSLDiagram_ProtocolHelper';
import type {
  GraphPluginManager,
  PackageableElement,
  V1_ElementProtocolClassifierPathGetter,
  V1_ElementProtocolDeserializer,
  V1_ElementProtocolSerializer,
  V1_ElementTransformer,
  V1_GraphBuilderContext,
  V1_GraphTransformerContext,
  V1_PackageableElement,
} from '@finos/legend-graph';
import {
  PureProtocolProcessorPlugin,
  V1_ElementBuilder,
} from '@finos/legend-graph';
import { V1_transformDiagram } from './v1/transformation/pureGraph/V1_DSLDiagram_TransformerHelper';
import { Diagram } from '../../metamodels/pure/packageableElements/diagram/Diagram';
import { getDiagram } from '../../../graphManager/DSLDiagram_GraphManagerHelper';
import {
  V1_buildClassView,
  V1_buildGeneralizationView,
  V1_buildPropertyView,
} from './v1/transformation/pureGraph/V1_DSLDiagram_GraphBuilderHelper';

const DIAGRAM_ELEMENT_CLASSIFIER_PATH =
  'meta::pure::metamodel::diagram::Diagram';

export const V1_DSLDiagram_PackageableElementPointerType = 'DIAGRAM';

export class DSLDiagram_PureProtocolProcessorPlugin extends PureProtocolProcessorPlugin {
  constructor() {
    super(
      packageJson.extensions.pureProtocolProcessorPlugin,
      packageJson.version,
    );
  }

  install(pluginManager: GraphPluginManager): void {
    pluginManager.registerPureProtocolProcessorPlugin(this);
  }

  override V1_getExtraElementBuilders(): V1_ElementBuilder<V1_PackageableElement>[] {
    return [
      new V1_ElementBuilder<V1_Diagram>({
        elementClassName: 'Diagram',
        _class: V1_Diagram,
        firstPass: (
          elementProtocol: V1_PackageableElement,
          context: V1_GraphBuilderContext,
        ): PackageableElement => {
          assertType(elementProtocol, V1_Diagram);
          const element = new Diagram(elementProtocol.name);
          const path = context.currentSubGraph.buildPath(
            elementProtocol.package,
            elementProtocol.name,
          );
          context.currentSubGraph.setOwnElementInExtension(
            path,
            element,
            Diagram,
          );
          return element;
        },
        secondPass: (
          elementProtocol: V1_PackageableElement,
          context: V1_GraphBuilderContext,
        ): void => {
          assertType(elementProtocol, V1_Diagram);
          const path = context.graph.buildPath(
            elementProtocol.package,
            elementProtocol.name,
          );
          const element = getDiagram(path, context.graph);
          element.classViews = elementProtocol.classViews.map((classView) =>
            V1_buildClassView(classView, context, element),
          );
          element.propertyViews = elementProtocol.propertyViews.map(
            (propertyView) =>
              V1_buildPropertyView(propertyView, context, element),
          );
          element.generalizationViews = elementProtocol.generalizationViews.map(
            (generalizationView) =>
              V1_buildGeneralizationView(generalizationView, element),
          );
        },
      }),
    ];
  }

  override V1_getExtraElementClassifierPathGetters(): V1_ElementProtocolClassifierPathGetter[] {
    return [
      (elementProtocol: V1_PackageableElement): string | undefined => {
        if (elementProtocol instanceof V1_Diagram) {
          return DIAGRAM_ELEMENT_CLASSIFIER_PATH;
        }
        return undefined;
      },
    ];
  }

  override V1_getExtraElementProtocolSerializers(): V1_ElementProtocolSerializer[] {
    return [
      (
        elementProtocol: V1_PackageableElement,
      ): PlainObject<V1_PackageableElement> | undefined => {
        if (elementProtocol instanceof V1_Diagram) {
          return serialize(V1_diagramModelSchema, elementProtocol);
        }
        return undefined;
      },
    ];
  }

  override V1_getExtraElementProtocolDeserializers(): V1_ElementProtocolDeserializer[] {
    return [
      (
        json: PlainObject<V1_PackageableElement>,
      ): V1_PackageableElement | undefined => {
        if (json._type === V1_DIAGRAM_ELEMENT_PROTOCOL_TYPE) {
          return deserialize(V1_diagramModelSchema, json);
        }
        return undefined;
      },
    ];
  }

  override V1_getExtraElementTransformers(): V1_ElementTransformer[] {
    return [
      (
        metamodel: PackageableElement,
        context: V1_GraphTransformerContext,
      ): V1_PackageableElement | undefined => {
        if (metamodel instanceof Diagram) {
          return V1_transformDiagram(metamodel);
        }
        return undefined;
      },
    ];
  }

  override V1_getExtraSourceInformationKeys(): string[] {
    return [
      'classSourceInformation',
      'sourceViewSourceInformation',
      'targetViewSourceInformation',
    ];
  }
}
