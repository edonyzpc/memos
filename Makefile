.PHONY: memos web proto-gen

memos:
	MEMOS_PORT=5230 air -c scripts/.air.toml

proto-gen:
	cd proto && buf generate && cd -

web-lint:
	cd web && pnpm i && pnpm lint

web: proto-gen web-lint
	cd web && pnpm i && DEV_PROXY_SERVER='http://localhost:5230' pnpm dev

upgrade:
	git fetch upstream && git tag -d $$(git tag --list | grep "v") && git checkout main && git merge upstream/main