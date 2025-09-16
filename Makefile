.PHONY: memos web proto-gen

memos:
	go mod tidy && go mod vendor && sh ./scripts/build.sh && ./build/memos --mode dev --port 5230

proto-gen:
	cd proto && buf generate && buf format -w && cd -

web-lint:
	cd web && pnpm i --frozen-lockfile && pnpm lint && cd -

web: web-lint
	cd web && DEV_PROXY_SERVER='http://localhost:5230' pnpm dev && cd -

# Upgrade the memos version from upstream
# 1. Fetch the latest changes from upstream, `git fetch upstream`
# 2. Checkout the target tag, `git checkout -b upstream-${tag} ${tag}`
# 3. Merge the changes to the main branch, `git checkout main && git merge upstream-${tag}`
# 4. Fix the conflicts, `git commit -m "Merge upstream ${tag}"`
# 5. Push the changes to the main branch, `git push origin main`
# 6. Delete the local tags, `git tag -d $(git tag --list | grep "v")`
upgrade:
	git fetch upstream && git tag -d $$(git tag --list | grep "v") && git checkout main && git merge upstream/main