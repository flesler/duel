#!/bin/bash
# Run npm scripts in parallel (independent gates only).
#
#   bin/parallel-run.sh test:types:src test:types:bin lint:fix
#   bin/parallel-run.sh --silent lint:fix build test:unit
set -euo pipefail

usage() {
	echo "Usage: parallel-run.sh [--silent] <npm-script> ..." >&2
	exit 1
}

SILENT=false
scripts=()

while [[ $# -gt 0 ]]; do
	case $1 in
		--silent) SILENT=true; shift ;;
		-h|--help)
			echo "Usage: parallel-run.sh [--silent] <npm-script> ..."
			exit 0
			;;
		--) shift; scripts+=("$@"); break ;;
		-*) echo "Unknown option: $1" >&2; usage ;;
		*) scripts+=("$1"); shift ;;
	esac
done

[[ ${#scripts[@]} -gt 0 ]] || usage

if [[ $SILENT == true ]]; then
	exec 1>/dev/null
fi

pids=()
for script in "${scripts[@]}"; do
	npm run -s "$script" &
	pids+=($!)
done

failed=0
for i in "${!pids[@]}"; do
	if ! wait "${pids[i]}"; then
		echo "${scripts[i]} failed" >&2
		failed=1
	fi
done

exit "$failed"
