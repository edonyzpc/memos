.PHONY: memos web proto-gen

memos:
	MEMOS_PORT=5230 air -c scripts/.air.toml

proto-gen:
	cd proto && buf generate && cd -

web: proto-gen
	cd web && pnpm i && DEV_PROXY_SERVER='http://localhost:5230' pnpm dev