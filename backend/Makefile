.PHONY: build clean install

build: clean install
	npm run build
	cp -r dist/FeatureFlagLayer/nodejs ./dist/FeatureFlagLayer/ || true

clean:
	rm -rf dist
	rm -rf node_modules

install:
	npm install

deploy: build
	sam deploy --guided

local: build
	sam local start-api