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

import { writeFileSync } from 'fs';
import {
  generateVersionBumpChangeset,
  getPackagesToBumpVersion,
  RESOLVED_VERSION_BUMP_CHANGESET_PATH,
} from './versionBumpChangesetUtils.js';
import chalk from 'chalk';

const bumpType = process.argv[2];
const packagesToBump = getPackagesToBumpVersion();

writeFileSync(
  RESOLVED_VERSION_BUMP_CHANGESET_PATH,
  generateVersionBumpChangeset(packagesToBump, bumpType),
);

console.log(
  [
    'Generated version bump changeset content for application packages:',
    ...packagesToBump.map((line) => chalk.green(`\u2713 ${line}`)),
  ].join('\n'),
);
