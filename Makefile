.PHONY: memos web proto-gen

memos:
	MEMOS_PORT=5230 air -c scripts/.air.toml

proto-gen:
	cd proto && buf generate && buf format -w && cd -

web-lint:
	cd web && pnpm i && pnpm lint && cd -

web: proto-gen web-lint
	cd web && DEV_PROXY_SERVER='http://localhost:5230' pnpm dev && cd -

upgrade:
	git fetch upstream && git tag -d $$(git tag --list | grep "v") && git checkout main && git merge upstream/main