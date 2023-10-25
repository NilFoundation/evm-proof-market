#!/usr/bin/env bash

set -euxo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
REPO_ROOT="$SCRIPT_DIR/.."

DOCKER="docker"
DOCKER_OPTS=""

run_hardhat_test() {
    if [ "$USE_DOCKER" = true ]; then
        cd "$REPO_ROOT"

        if [ ! -f .env ]; then
            cp .env.example .env
        fi

        $DOCKER  build --build-arg USER_ID=$(id -u) --build-arg GROUP_ID=$(id -g) -t tests-env scripts/docker
        $DOCKER run $DOCKER_OPTS --rm \
            --volume ${PWD}:/home:Z -w /home \
            tests-env ./scripts/ci.sh hardhat_test
        cd -
    else
        cd "$REPO_ROOT"
        npm ci
        npx hardhat test --verbose
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
