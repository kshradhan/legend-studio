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

import type {
  GraphPluginManager,
  PureGraphManagerPlugin,
  PureGraphPlugin,
  PureProtocolProcessorPlugin,
} from '@finos/legend-graph';
import type {
  TelemetryServicePlugin,
  TelemetryServicePluginManager,
  TracerServicePlugin,
  TracerServicePluginManager,
} from '@finos/legend-shared';
import { AbstractPluginManager } from '@finos/legend-shared';
import type { StudioPlugin } from '../stores/StudioPlugin';

export class StudioPluginManager
  extends AbstractPluginManager
  implements
    GraphPluginManager,
    TracerServicePluginManager,
    TelemetryServicePluginManager
{
  private telemetryServicePlugins: TelemetryServicePlugin[] = [];
  private tracerServicePlugins: TracerServicePlugin<unknown>[] = [];
  private pureProtocolProcessorPlugins: PureProtocolProcessorPlugin[] = [];
  private pureGraphManagerPlugins: PureGraphManagerPlugin[] = [];
  private pureGraphPlugins: PureGraphPlugin[] = [];
  private studioPlugins: StudioPlugin[] = [];

  private constructor() {
    super();
  }

  static create(): StudioPluginManager {
    return new StudioPluginManager();
  }

  registerTelemetryServicePlugin(plugin: TelemetryServicePlugin): void {
    this.telemetryServicePlugins.push(plugin);
  }

  registerTracerServicePlugin(plugin: TracerServicePlugin<unknown>): void {
    this.tracerServicePlugins.push(plugin);
  }

  registerPureProtocolProcessorPlugin(
    plugin: PureProtocolProcessorPlugin,
  ): void {
    this.pureProtocolProcessorPlugins.push(plugin);
  }

  registerPureGraphManagerPlugin(plugin: PureGraphManagerPlugin): void {
    this.pureGraphManagerPlugins.push(plugin);
  }

  registerPureGraphPlugins(plugin: PureGraphPlugin): void {
    this.pureGraphPlugins.push(plugin);
  }

  registerStudioPlugin(plugin: StudioPlugin): void {
    this.studioPlugins.push(plugin);
  }

  getTelemetryServicePlugins(): TelemetryServicePlugin[] {
    return [...this.telemetryServicePlugins];
  }

  getTracerServicePlugins(): TracerServicePlugin<unknown>[] {
    return [...this.tracerServicePlugins];
  }

  getPureGraphManagerPlugins(): PureGraphManagerPlugin[] {
    return [...this.pureGraphManagerPlugins];
  }

  getPureProtocolProcessorPlugins(): PureProtocolProcessorPlugin[] {
    return [...this.pureProtocolProcessorPlugins];
  }

  getPureGraphPlugins(): PureGraphPlugin[] {
    return [...this.pureGraphPlugins];
  }

  getStudioPlugins(): StudioPlugin[] {
    return [...this.studioPlugins];
  }
}
