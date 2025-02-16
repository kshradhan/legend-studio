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

import type { Log } from '@finos/legend-shared';
import { guaranteeNonNullable } from '@finos/legend-shared';
import { useLocalObservable } from 'mobx-react-lite';
import { createContext, useContext } from 'react';
import { GraphManagerState } from './GraphManagerState';
import type { GraphPluginManager } from './GraphPluginManager';

const GraphManagerStateContext = createContext<GraphManagerState | undefined>(
  undefined,
);

export const GraphManagerStateProvider = ({
  children,
  pluginManager,
  log,
}: {
  children: React.ReactNode;
  pluginManager: GraphPluginManager;
  log: Log;
}): React.ReactElement => {
  const graphManagerState = useLocalObservable(
    () => new GraphManagerState(pluginManager, log),
  );
  return (
    <GraphManagerStateContext.Provider value={graphManagerState}>
      {children}
    </GraphManagerStateContext.Provider>
  );
};

export const useGraphManagerState = (): GraphManagerState =>
  guaranteeNonNullable(
    useContext(GraphManagerStateContext),
    `Can't find graph manager state in context`,
  );
