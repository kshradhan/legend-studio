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

import packageJson from '../../../package.json';
import type {
  RuntimeConnectionTooltipTextBuilder,
  DSLMapping_StudioPlugin_Extension,
  EditorStore,
  ElementEditorRenderer,
  ElementEditorState,
  ElementEditorStateCreator,
  ElementIconGetter,
  ElementProjectExplorerDnDTypeGetter,
  ElementTypeGetter,
  NewElementFromStateCreator,
  NewElementState,
  StudioPluginManager,
} from '@finos/legend-studio';
import {
  StudioPlugin,
  UnsupportedElementEditorState,
} from '@finos/legend-studio';
import { FaBuffer, FaSitemap } from 'react-icons/fa';
import { SchemaSetEditor } from './SchemaSetElementEditor';
import { SchemaSetEditorState } from '../../stores/studio/SchemaSetEditorState';
import type { Connection, PackageableElement } from '@finos/legend-graph';
import {
  FORMAT_TYPE,
  SchemaSet,
} from '../../models/metamodels/pure/model/packageableElements/schemaSet/SchemaSet';
import { Binding } from '../../models/metamodels/pure/model/packageableElements/store/Binding';
import { ExternalFormatConnection } from '../../models/metamodels/pure/model/packageableElements/connection/ExternalFormatConnection';

const SCHEMA_SET_ELEMENT_TYPE = 'SCHEMASET';
const SCHEMA_SET_ELEMENT_PROJECT_EXPLORER_DND_TYPE =
  'PROJECT_EXPLORER_SCHEMA_SET';
const BINDING_ELEMENT_TYPE = 'BINDING';
const BINDING_ELEMENT_PROJECT_EXPLORER_DND_TYPE = 'PROJECT_EXPLORER_BINDING';

export class DSLSerializer_StudioPlugin
  extends StudioPlugin
  implements DSLMapping_StudioPlugin_Extension
{
  constructor() {
    super(packageJson.extensions.studioPlugin, packageJson.version);
  }

  install(pluginManager: StudioPluginManager): void {
    pluginManager.registerStudioPlugin(this);
  }

  getExtraSupportedElementTypes(): string[] {
    return [SCHEMA_SET_ELEMENT_TYPE, BINDING_ELEMENT_TYPE];
  }

  getExtraElementTypeGetters(): ElementTypeGetter[] {
    return [
      (element: PackageableElement): string | undefined => {
        if (element instanceof SchemaSet) {
          return SCHEMA_SET_ELEMENT_TYPE;
        } else if (element instanceof Binding) {
          return BINDING_ELEMENT_TYPE;
        }
        return undefined;
      },
    ];
  }

  getExtraElementIconGetters(): ElementIconGetter[] {
    return [
      (type: string): React.ReactNode | undefined => {
        if (type === SCHEMA_SET_ELEMENT_TYPE) {
          return (
            <div className="icon icon--schema-set">
              <FaSitemap />
            </div>
          );
        } else if (type === BINDING_ELEMENT_TYPE) {
          return (
            <div className="icon icon--binding">
              <FaBuffer />
            </div>
          );
        }
        return undefined;
      },
    ];
  }

  getExtraElementEditorRenderers(): ElementEditorRenderer[] {
    return [
      (elementEditorState: ElementEditorState): React.ReactNode | undefined => {
        if (elementEditorState instanceof SchemaSetEditorState) {
          return <SchemaSetEditor key={elementEditorState.uuid} />;
        }
        return undefined;
      },
    ];
  }

  getExtraNewElementFromStateCreators(): NewElementFromStateCreator[] {
    return [
      (
        type: string,
        name: string,
        state: NewElementState,
      ): PackageableElement | undefined => {
        if (type === SCHEMA_SET_ELEMENT_TYPE) {
          const schemaSet = new SchemaSet(name);
          schemaSet.setFormat(FORMAT_TYPE.FLAT_DATA);
          return schemaSet;
        } else if (type === BINDING_ELEMENT_TYPE) {
          return new Binding(name);
        }
        return undefined;
      },
    ];
  }

  getExtraElementEditorStateCreators(): ElementEditorStateCreator[] {
    return [
      (
        editorStore: EditorStore,
        element: PackageableElement,
      ): ElementEditorState | undefined => {
        if (element instanceof SchemaSet) {
          return new SchemaSetEditorState(editorStore, element);
        } else if (element instanceof Binding) {
          return new UnsupportedElementEditorState(editorStore, element);
        }
        return undefined;
      },
    ];
  }

  getExtraElementProjectExplorerDnDTypeGetters(): ElementProjectExplorerDnDTypeGetter[] {
    return [
      (element: PackageableElement): string | undefined => {
        if (element instanceof SchemaSet) {
          return SCHEMA_SET_ELEMENT_PROJECT_EXPLORER_DND_TYPE;
        } else if (element instanceof Binding) {
          return BINDING_ELEMENT_PROJECT_EXPLORER_DND_TYPE;
        }
        return undefined;
      },
    ];
  }

  getExtraGrammarTextEditorDnDTypes(): string[] {
    return [
      SCHEMA_SET_ELEMENT_PROJECT_EXPLORER_DND_TYPE,
      BINDING_ELEMENT_PROJECT_EXPLORER_DND_TYPE,
    ];
  }

  getExtraRuntimeConnectionTooltipTextBuilders(): RuntimeConnectionTooltipTextBuilder[] {
    return [
      (connection: Connection): string | undefined => {
        if (connection instanceof ExternalFormatConnection) {
          return `External format connection \u2020 store ${connection.store.value.path}`;
        }
        return undefined;
      },
    ];
  }
}
