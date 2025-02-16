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

import type { MappingExecutionState } from '@finos/legend-studio';
import { useEditorStore } from '@finos/legend-studio';
import { flowResult } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
  EngineRuntime,
  PackageableElementExplicitReference,
} from '@finos/legend-graph';
import type { RawLambda } from '@finos/legend-graph';
import { QueryBuilder_EditorExtensionState } from '../stores/QueryBuilder_EditorExtensionState';
import { useApplicationStore } from '@finos/legend-application';

export const MappingExecutionQueryBuilder = observer(
  (props: { executionState: MappingExecutionState }) => {
    const { executionState } = props;
    const applicationStore = useApplicationStore();
    const editorStore = useEditorStore();
    const queryBuilderExtension = editorStore.getEditorExtensionState(
      QueryBuilder_EditorExtensionState,
    );
    const editWithQueryBuilder = async (): Promise<void> => {
      const mapping = executionState.mappingEditorState.mapping;
      const customRuntime = new EngineRuntime();
      customRuntime.addMapping(
        PackageableElementExplicitReference.create(mapping),
      );
      await flowResult(
        queryBuilderExtension.setup(
          executionState.queryState.query,
          mapping,
          customRuntime,
          (lambda: RawLambda): Promise<void> =>
            flowResult(executionState.queryState.updateLamba(lambda))
              .then(() =>
                editorStore.applicationStore.notifySuccess(
                  `Mapping execution query is updated`,
                ),
              )
              .catch(applicationStore.alertIllegalUnhandledError),
          executionState.queryState.query.isStub,
          {
            parametersDisabled: true,
          },
        ),
      );
    };
    return (
      <button
        className="btn--dark mapping-execution-query-builder__btn"
        onClick={editWithQueryBuilder}
      >
        Edit Query
      </button>
    );
  },
);
