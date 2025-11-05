build: build@cjs build@esm build@types

build@types:
	rm -rf ./lib/types/
	npx tsc --project ./tsconfig.types.json --outDir ./lib/types/

build@esm:
	rm -rf ./lib/esm/
	npx tsc --project ./tsconfig.esm.json --outDir ./lib/esm/
	echo '{ "type": "commonjs" }' > ./lib/esm/package.json

build@cjs:
	rm -rf ./lib/cjs/
	npx tsc --project ./tsconfig.cjs.json --outDir ./lib/cjs/
	echo '{ "type": "commonjs" }' > ./lib/cjs/package.json
