#!/usr/bin/env bash

set -euxo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
REPO_ROOT="$SCRIPT_DIR/.."

DOCKER="docker"
DOCKER_OPTS=""

run_hardhat_test() {
    if [ "$USE_DOCKER" = true ]; then
        cd "$REPO_ROOT"

        $DOCKER build -t tests-env scripts/docker
        $DOCKER run $DOCKER_OPTS --rm \
            --volume ${PWD}:/home:Z -w /home \
            -u $(id -u ${USER}):$(id -g ${USER}) \
            tests-env ./scripts/ci.sh hardhat_test
        cd -
    else
        cd "$REPO_ROOT"
        source "$SCRIPT_DIR/setup.sh"
        npx hardhat test
        cd -
    fi
}

USE_DOCKER=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
    -d | --docker) USE_DOCKER=true ;;
    hardhat_test) SUBCOMMAND=run_hardhat_test ;;
    *)
        echo "Unknown parameter passed: $1"
        exit 1
        ;;
    esac
    shift
done

$SUBCOMMAND
