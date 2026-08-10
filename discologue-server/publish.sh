#!/bin/bash

set -euo pipefail

spacetime publish -s local discologue --delete-data -y --module-path ./
