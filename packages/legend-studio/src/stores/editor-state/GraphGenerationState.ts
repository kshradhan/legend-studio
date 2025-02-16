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

import {
  observable,
  flow,
  action,
  computed,
  makeObservable,
  flowResult,
} from 'mobx';
import type { GeneratorFn } from '@finos/legend-shared';
import {
  LogEvent,
  assertTrue,
  assertErrorThrown,
  guaranteeNonNullable,
  isNonNullable,
} from '@finos/legend-shared';
import { STUDIO_LOG_EVENT } from '../../stores/StudioLogEvent';
import type {
  GenerationTreeNodeData,
  GenerationOutputResult,
} from '../shared/FileGenerationTreeUtil';
import {
  GenerationDirectory,
  GENERATION_FILE_ROOT_NAME,
  GenerationFile,
  getGenerationTreeData,
  openNode,
  populateDirectoryTreeNodeChildren,
  buildGenerationDirectory,
  reprocessOpenNodes,
} from '../shared/FileGenerationTreeUtil';
import type { TreeData } from '@finos/legend-art';
import type { EditorStore } from '../EditorStore';
import { ExplorerTreeRootPackageLabel } from '../ExplorerTreeState';
import { FileGenerationViewerState } from './FileGenerationViewerState';
import type { EditorState } from './EditorState';
import { ElementEditorState } from './element-editor-state/ElementEditorState';
import { ElementFileGenerationState } from './element-editor-state/ElementFileGenerationState';
import type { Entity } from '@finos/legend-model-storage';
import type {
  GenerationConfigurationDescription,
  GenerationOutput,
  DSLGenerationSpecification_PureGraphManagerPlugin_Extension,
} from '@finos/legend-graph';
import {
  GenerationSpecification,
  Class,
  Enumeration,
  ELEMENT_PATH_DELIMITER,
} from '@finos/legend-graph';

export const DEFAULT_GENERATION_SPECIFICATION_NAME =
  'MyGenerationSpecification';

export type FileGenerationTypeOption = {
  value: string;
  label: string;
};

export class GraphGenerationState {
  editorStore: EditorStore;
  isRunningGlobalGenerate = false;
  generatedEntities = new Map<string, Entity[]>();
  isClearingGenerationEntities = false;
  fileGenerationConfigurations: GenerationConfigurationDescription[] = [];
  // File generation output
  rootFileDirectory: GenerationDirectory;
  filesIndex = new Map<string, GenerationFile>();
  selectedNode?: GenerationTreeNodeData | undefined;

  constructor(editorStore: EditorStore) {
    makeObservable<GraphGenerationState>(this, {
      isRunningGlobalGenerate: observable,
      generatedEntities: observable.shallow,
      isClearingGenerationEntities: observable,
      fileGenerationConfigurations: observable,
      rootFileDirectory: observable,
      filesIndex: observable,
      selectedNode: observable.ref,
      fileGenerationConfigurationOptions: computed,
      supportedFileGenerationConfigurationsForCurrentElement: computed,
      setFileGenerationConfigurations: action,
      addMissingGenerationSpecifications: action,
      processGenerationResult: action,
      reprocessGenerationFileState: action,
      reprocessNodeTree: action,
      onTreeNodeSelect: action,
      setSelectedNode: action,
      emptyFileGeneration: action,
      fetchAvailableFileGenerationDescriptions: flow,
      globalGenerate: flow,
      generateModels: flow,
      generateFiles: flow,
      clearGenerations: flow,
    });

    this.editorStore = editorStore;
    this.rootFileDirectory = new GenerationDirectory(GENERATION_FILE_ROOT_NAME);
  }

  get fileGenerationConfigurationOptions(): FileGenerationTypeOption[] {
    return this.fileGenerationConfigurations
      .slice()
      .sort((a, b): number => a.label.localeCompare(b.label))
      .map((config) => ({
        label: config.label,
        value: config.key,
      }));
  }

  get supportedFileGenerationConfigurationsForCurrentElement(): GenerationConfigurationDescription[] {
    if (this.editorStore.currentEditorState instanceof ElementEditorState) {
      const currentElement = this.editorStore.currentEditorState.element;
      if (
        currentElement instanceof Class ||
        currentElement instanceof Enumeration
      ) {
        return this.fileGenerationConfigurations
          .slice()
          .sort((a, b): number => a.label.localeCompare(b.label));
      }
    }
    return [];
  }

  setFileGenerationConfigurations(
    fileGenerationConfigurations: GenerationConfigurationDescription[],
  ): void {
    this.fileGenerationConfigurations = fileGenerationConfigurations;
  }

  getFileGenerationConfiguration(
    type: string,
  ): GenerationConfigurationDescription {
    return guaranteeNonNullable(
      this.fileGenerationConfigurations.find((config) => config.key === type),
      `Can't find configuration description for file generation type '${type}'`,
    );
  }

  *fetchAvailableFileGenerationDescriptions(): GeneratorFn<void> {
    try {
      const availableFileGenerationDescriptions =
        (yield this.editorStore.graphManagerState.graphManager.getAvailableGenerationConfigurationDescriptions()) as GenerationConfigurationDescription[];
      this.setFileGenerationConfigurations(availableFileGenerationDescriptions);
      this.editorStore.elementGenerationStates =
        this.fileGenerationConfigurations.map(
          (config) =>
            new ElementFileGenerationState(this.editorStore, config.key),
        );
    } catch (error) {
      assertErrorThrown(error);
      this.editorStore.applicationStore.log.error(
        LogEvent.create(STUDIO_LOG_EVENT.GENERATION_FAILURE),
        error,
      );
      this.editorStore.applicationStore.notifyError(error);
    }
  }

  /**
   * Global generation is tied to the generation specification of the project. Every time a generation element
   * is added, they will be added to the generation specification
   */
  *globalGenerate(): GeneratorFn<void> {
    if (
      this.editorStore.graphState.checkIfApplicationUpdateOperationIsRunning()
    ) {
      return;
    }
    this.isRunningGlobalGenerate = true;
    try {
      yield flowResult(this.generateModels());
      yield flowResult(this.generateFiles());
    } catch (error) {
      assertErrorThrown(error);
      this.editorStore.applicationStore.log.error(
        LogEvent.create(STUDIO_LOG_EVENT.GENERATION_FAILURE),
        error,
      );
      this.editorStore.graphState.editorStore.applicationStore.notifyError(
        `${error.message}`,
      );
    } finally {
      this.isRunningGlobalGenerate = false;
    }
  }

  *generateModels(): GeneratorFn<void> {
    try {
      this.generatedEntities = new Map<string, Entity[]>(); // reset the map of generated entities
      const generationSpecs =
        this.editorStore.graphManagerState.graph.ownGenerationSpecifications;
      if (!generationSpecs.length) {
        return;
      }
      assertTrue(
        generationSpecs.length === 1,
        `Can't generate models: only one generation specification permitted to generate`,
      );
      const generationSpec = generationSpecs[0];
      const generationNodes = generationSpec.generationNodes;
      for (let i = 0; i < generationNodes.length; i++) {
        const node = generationNodes[i];
        let generatedEntities: Entity[] = [];
        try {
          generatedEntities =
            (yield this.editorStore.graphManagerState.graphManager.generateModel(
              node.generationElement.value,
              this.editorStore.graphManagerState.graph,
            )) as Entity[];
        } catch (error) {
          assertErrorThrown(error);
          throw new Error(
            `Can't generate models: failure occured at step ${
              i + 1
            } with specification '${
              node.generationElement.value.path
            }'. Error: ${error.message}`,
          );
        }
        this.generatedEntities.set(
          node.generationElement.value.path,
          generatedEntities,
        );
        yield flowResult(
          this.editorStore.graphState.updateGenerationGraphAndApplication(),
        );
      }
    } catch (error) {
      assertErrorThrown(error);
      this.editorStore.applicationStore.log.error(
        LogEvent.create(STUDIO_LOG_EVENT.GENERATION_FAILURE),
        error,
      );
      this.editorStore.graphState.editorStore.applicationStore.notifyError(
        `${error.message}`,
      );
    }
  }

  /**
   * Generated file generations in the graph.
   * NOTE: This method does not update graph and application only the files are generated.
   */
  *generateFiles(): GeneratorFn<void> {
    try {
      this.emptyFileGeneration();
      const generationResultMap = new Map<string, GenerationOutput[]>();
      const generationSpecs =
        this.editorStore.graphManagerState.graph.ownGenerationSpecifications;
      if (!generationSpecs.length) {
        return;
      }
      assertTrue(
        generationSpecs.length === 1,
        `Can't generate models: only one generation specification permitted to generate`,
      );
      const generationSpec = generationSpecs[0];
      const fileGenerations = generationSpec.fileGenerations;
      // we don't need to keep 'fetching' the main model as it won't grow with each file generation
      for (const fileGeneration of fileGenerations) {
        let result: GenerationOutput[] = [];
        try {
          const mode =
            this.editorStore.graphState.graphGenerationState.getFileGenerationConfiguration(
              fileGeneration.value.type,
            ).generationMode;
          result =
            (yield this.editorStore.graphManagerState.graphManager.generateFile(
              fileGeneration.value,
              mode,
              this.editorStore.graphManagerState.graph,
            )) as GenerationOutput[];
        } catch (error) {
          assertErrorThrown(error);
          throw new Error(
            `Can't generate files using specification '${fileGeneration.value.path}'. Error: ${error.message}`,
          );
        }
        generationResultMap.set(fileGeneration.value.path, result);
      }
      this.processGenerationResult(generationResultMap);
    } catch (error) {
      assertErrorThrown(error);
      this.editorStore.applicationStore.log.error(
        LogEvent.create(STUDIO_LOG_EVENT.GENERATION_FAILURE),
        error,
      );
      this.editorStore.graphState.editorStore.applicationStore.notifyError(
        `${error.message}`,
      );
    }
  }

  /**
   * Used to clear generation entities as well as the generation model
   */
  *clearGenerations(): GeneratorFn<void> {
    this.isClearingGenerationEntities = true;
    this.generatedEntities = new Map<string, Entity[]>();
    this.emptyFileGeneration();
    yield flowResult(
      this.editorStore.graphState.updateGenerationGraphAndApplication(),
    );
    this.isClearingGenerationEntities = false;
  }

  /**
   * Method adds generation specification if
   * 1. no generation specification has been defined in graph
   * 2. there exists a generation element
   */
  addMissingGenerationSpecifications(): void {
    if (
      !this.editorStore.graphManagerState.graph.ownGenerationSpecifications
        .length
    ) {
      const modelGenerationElements = this.editorStore.pluginManager
        .getPureGraphManagerPlugins()
        .flatMap(
          (plugin) =>
            (
              plugin as DSLGenerationSpecification_PureGraphManagerPlugin_Extension
            ).getExtraModelGenerationElementGetters?.() ?? [],
        )
        .flatMap((getter) => getter(this.editorStore.graphManagerState.graph));
      const fileGenerations =
        this.editorStore.graphManagerState.graph.ownFileGenerations;
      if (modelGenerationElements.length || fileGenerations.length) {
        const generationSpec = new GenerationSpecification(
          DEFAULT_GENERATION_SPECIFICATION_NAME,
        );
        modelGenerationElements.forEach((e) =>
          generationSpec.addGenerationElement(e),
        );
        fileGenerations.forEach((e) => generationSpec.addFileGeneration(e));
        // NOTE: add generation specification at the same package as the first generation element found.
        // we might want to revisit this decision?
        const specPackage = guaranteeNonNullable(
          [...modelGenerationElements, ...fileGenerations][0].package,
        );
        specPackage.addElement(generationSpec);
        this.editorStore.graphManagerState.graph.addElement(generationSpec);
      }
    }
  }

  // File Generation Tree
  processGenerationResult(
    fileGenerationOutputMap: Map<string, GenerationOutput[]>,
  ): void {
    // empty file index and the directory, we keep the open nodes to reprocess them
    this.emptyFileGeneration();
    const directoryTreeData =
      this.editorStore.graphState.editorStore.explorerTreeState
        .fileGenerationTreeData;
    const openedNodeIds = directoryTreeData
      ? Array.from(directoryTreeData.nodes.values())
          .filter((node) => node.isOpen)
          .map((node) => node.id)
      : [];
    // we read the generation outputs and clean
    const generationResultMap = new Map<string, GenerationOutputResult>();
    Array.from(fileGenerationOutputMap.entries()).forEach((entry) => {
      const fileGeneration =
        this.editorStore.graphManagerState.graph.getNullableFileGeneration(
          entry[0],
        );
      const rootFolder =
        fileGeneration?.generationOutputPath ??
        fileGeneration?.path.split(ELEMENT_PATH_DELIMITER).join('_');
      const generationOutputs = entry[1];
      generationOutputs.forEach((genOutput) => {
        genOutput.cleanFileName(rootFolder);
        if (generationResultMap.has(genOutput.fileName)) {
          this.editorStore.applicationStore.log.warn(
            LogEvent.create(STUDIO_LOG_EVENT.GENERATION_FAILURE),
            `Found 2 generation outputs with same path '${genOutput.fileName}'`,
          );
        }
        generationResultMap.set(genOutput.fileName, {
          generationOutput: genOutput,
          parentId: fileGeneration?.path,
        });
      });
    });
    // take generation outputs and put them into the root directory
    buildGenerationDirectory(
      this.rootFileDirectory,
      generationResultMap,
      this.filesIndex,
    );
    this.editorStore.graphState.editorStore.explorerTreeState.setFileGenerationTreeData(
      getGenerationTreeData(
        this.rootFileDirectory,
        ExplorerTreeRootPackageLabel.FILE_GENERATION,
      ),
    );
    this.editorStore.graphState.editorStore.explorerTreeState.setFileGenerationTreeData(
      this.reprocessNodeTree(
        Array.from(generationResultMap.values()),
        this.editorStore.graphState.editorStore.explorerTreeState.getFileGenerationTreeData(),
        openedNodeIds,
      ),
    );
    this.editorStore.openedEditorStates = this.editorStore.openedEditorStates
      .map((e) => this.reprocessGenerationFileState(e))
      .filter(isNonNullable);
    const currentEditorState = this.editorStore.currentEditorState;
    if (currentEditorState instanceof FileGenerationViewerState) {
      this.editorStore.currentEditorState =
        this.editorStore.openedEditorStates.find(
          (e) =>
            e instanceof FileGenerationViewerState &&
            e.generatedFile.path === currentEditorState.generatedFile.path,
        );
    }
  }

  reprocessGenerationFileState(
    editorState: EditorState,
  ): EditorState | undefined {
    if (editorState instanceof FileGenerationViewerState) {
      const fileNode = this.filesIndex.get(editorState.generatedFile.path);
      if (fileNode) {
        editorState.generatedFile = fileNode;
        return editorState;
      } else {
        return undefined;
      }
    }
    return editorState;
  }

  reprocessNodeTree(
    generationResult: GenerationOutputResult[],
    treeData: TreeData<GenerationTreeNodeData>,
    openedNodeIds: string[],
  ): TreeData<GenerationTreeNodeData> {
    reprocessOpenNodes(
      treeData,
      this.filesIndex,
      this.rootFileDirectory,
      openedNodeIds,
      true,
    );
    const selectedFileNodePath =
      this.selectedNode?.fileNode.path ??
      (generationResult.length === 1
        ? generationResult[0].generationOutput.fileName
        : undefined);
    if (selectedFileNodePath) {
      const file = this.filesIndex.get(selectedFileNodePath);
      if (file) {
        const node = openNode(file, treeData, true);
        if (node) {
          this.onTreeNodeSelect(node, treeData, true);
        }
      } else {
        this.selectedNode = undefined;
      }
    }
    return treeData;
  }

  onTreeNodeSelect(
    node: GenerationTreeNodeData,
    treeData: TreeData<GenerationTreeNodeData>,
    reprocess?: boolean,
  ): void {
    if (node.childrenIds?.length) {
      node.isOpen = !node.isOpen;
      if (node.fileNode instanceof GenerationDirectory) {
        populateDirectoryTreeNodeChildren(node, treeData);
      }
    }
    if (!reprocess && node.fileNode instanceof GenerationFile) {
      this.editorStore.openGeneratedFile(node.fileNode);
    }
    this.setSelectedNode(node);
    this.editorStore.graphState.editorStore.explorerTreeState.setFileGenerationTreeData(
      { ...treeData },
    );
  }

  setSelectedNode(node?: GenerationTreeNodeData): void {
    if (this.selectedNode) {
      this.selectedNode.isSelected = false;
    }
    if (node) {
      node.isSelected = true;
    }
    this.selectedNode = node;
  }

  emptyFileGeneration(): void {
    this.filesIndex = new Map<string, GenerationFile>();
    this.rootFileDirectory = new GenerationDirectory(GENERATION_FILE_ROOT_NAME);
  }
}
