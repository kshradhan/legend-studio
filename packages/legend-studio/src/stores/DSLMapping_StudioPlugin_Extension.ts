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

import type { DSL_StudioPlugin_Extension } from './StudioPlugin';
import type { ConnectionValueState } from './editor-state/element-editor-state/connection/ConnectionEditorState';
import type { EditorStore } from './EditorStore';
import type { Store, Connection, Runtime } from '@finos/legend-graph';
import type { ServicePureExecutionState } from './editor-state/element-editor-state/service/ServiceExecutionState';
import type { MappingTestState } from './editor-state/element-editor-state/mapping/MappingTestState';
import type { MappingExecutionState } from './editor-state/element-editor-state/mapping/MappingExecutionState';
import type { NewConnectionValueDriver } from './NewElementState';

export type DefaultConnectionValueBuilder = (
  store: Store,
) => Connection | undefined;

export type ConnectionValueEditorStateBuilder = (
  editorStore: EditorStore,
  connection: Connection,
) => ConnectionValueState | undefined;

export type ConnectionEditorRenderer = (
  connectionValueState: ConnectionValueState,
  isReadOnly: boolean,
) => React.ReactNode | undefined;

export type RuntimeConnectionTooltipTextBuilder = (
  connection: Connection,
) => string | undefined;

export type NewConnectionDriverCreator = (
  editorStore: EditorStore,
  store: Store,
) => NewConnectionValueDriver<Connection> | undefined;

export type MappingExecutionQueryEditorRendererConfiguration = {
  key: string;
  renderer: (
    executionState: MappingExecutionState,
  ) => React.ReactNode | undefined;
};

export type MappingTestQueryEditorRendererConfiguration = {
  key: string;
  renderer: (
    testState: MappingTestState,
    isReadOnly: boolean,
  ) => React.ReactNode | undefined;
};

/**
 * NOTE: this is temporary since we want to eventually move Service out to its own DSL
 */
export type TEMP__ServiceQueryEditorRendererConfiguration = {
  key: string;
  renderer: (
    executionState: ServicePureExecutionState,
    isReadOnly: boolean,
  ) => React.ReactNode | undefined;
};

/**
 * NOTE: this is temporary since we want to eventually move Service out to its own DSL
 */
export type TEMP__ServiceTestRuntimeConnectionBuilder = (
  sourceConnection: Connection,
  runtime: Runtime,
  testData: string,
) => Connection | undefined;

export interface DSLMapping_StudioPlugin_Extension
  extends DSL_StudioPlugin_Extension {
  /**
   * Get the list of the default connection value builder for a specified store.
   */
  getExtraDefaultConnectionValueBuilders?(): DefaultConnectionValueBuilder[];

  /**
   * Get the list of editor state builders for a specified connection value.
   */
  getExtraConnectionValueEditorStateBuilders?(): ConnectionValueEditorStateBuilder[];

  /**
   * Get the list renderers for a specified connection editor state.
   */
  getExtraConnectionEditorRenderers?(): ConnectionEditorRenderer[];

  /**
   * Get the list of the runtime connection tooltip text builders for a specified connection.
   */
  getExtraRuntimeConnectionTooltipTextBuilders?(): RuntimeConnectionTooltipTextBuilder[];

  /**
   * Get the list of creators for connection creation state driver given the store.
   */
  getExtraNewConnectionDriverCreators?(): NewConnectionDriverCreator[];

  /**
   * Get the list of configurations for the renderer for mapping execution query builder.
   */
  getExtraMappingExecutionQueryEditorRendererConfigurations?(): MappingExecutionQueryEditorRendererConfiguration[];

  /**
   * Get the list of configurations for the renderer for mapping test query builder.
   */
  getExtraMappingTestQueryEditorRendererConfigurations?(): MappingTestQueryEditorRendererConfiguration[];

  /**
   * Get the list of configurations for the renderer for service execution query builder.
   *
   * NOTE: this is temporary since we want to eventually move Service out to its own DSL
   * preset/plugin so this should also be moved there
   */
  TEMP__getExtraServiceQueryEditorRendererConfigurations?(): TEMP__ServiceQueryEditorRendererConfiguration[];

  /**
   * Get the list of service test runtime connection builder for a provided connection and test data.
   *
   * NOTE: this is temporary since we want to eventually move Service out to its own DSL
   * preset/plugin so this should also be moved there
   */
  TEMP__getExtraServiceTestRuntimeConnectionBuilders?(): TEMP__ServiceTestRuntimeConnectionBuilder[];
}
