.PHONY: memos web proto-gen

memos:
	go mod tidy && go mod vendor && sh ./scripts/build.sh && ./build/memos --mode dev --port 5230

proto-gen:
	cd proto && buf generate && buf format -w && cd -

web-lint:
	cd web && pnpm i --frozen-lockfile && pnpm lint && cd -

web: proto-gen web-lint
	cd web && DEV_PROXY_SERVER='http://localhost:5230' pnpm dev && cd -

upgrade:
	git fetch upstream && git tag -d $$(git tag --list | grep "v") && git checkout main && git merge upstream/main