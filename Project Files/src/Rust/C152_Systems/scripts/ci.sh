#!/bin/bash

set -ex

cargo clippy --all-targets --all-features -- -D warnings

cargo fmt -- --check

cargo doc --no-deps --workspace
