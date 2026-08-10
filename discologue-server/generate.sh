#!/bin/bash

set -euo pipefail

spacetime generate --out-dir ./disclogue-client/module_bindings --lang rs --module-path ./ $@
spacetime generate --out-dir ./discologue-editor/module_bindings --lang ts --module-path ./ $@