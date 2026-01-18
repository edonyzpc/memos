package frontend

import (
	"context"
	"embed"
	"io/fs"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/usememos/memos/internal/profile"
	"github.com/usememos/memos/internal/util"
	"github.com/usememos/memos/store"
)

//go:embed dist/*
var embeddedFiles embed.FS

type FrontendService struct {
	Profile *profile.Profile
	Store   *store.Store
}

func NewFrontendService(profile *profile.Profile, store *store.Store) *FrontendService {
	return &FrontendService{
		Profile: profile,
		Store:   store,
	}
}

func (*FrontendService) Serve(_ context.Context, e *echo.Echo) {
	skipper := func(c echo.Context) bool {
		// Skip API routes.
		if util.HasPrefixes(c.Path(), "/api", "/memos.api.v1") {
			return true
		}
		// Serve HTML with revalidation to keep metadata fresh for crawlers.
		if c.Path() == "/" || c.Path() == "/index.html" || strings.HasSuffix(c.Path(), ".html") || !strings.Contains(c.Path(), ".") {
			c.Response().Header().Set(echo.HeaderCacheControl, "no-cache")
			return false
		}
		// Set Cache-Control header for static assets.
		// Vite generates content-hashed filenames under /assets (e.g., index-BtVjejZf.js),
		// so we can cache those aggressively.
		cacheControl := "public, max-age=604800" // 7 days for non-hashed static files
		if strings.HasPrefix(c.Path(), "/assets/") {
			cacheControl = "public, max-age=31536000, immutable" // 1 year for hashed assets
		}
		c.Response().Header().Set(echo.HeaderCacheControl, cacheControl)
		return false
	}

	// Route to serve the main app with HTML5 fallback for SPA behavior.
	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Filesystem: getFileSystem("dist"),
		HTML5:      true, // Enable fallback to index.html
		Skipper:    skipper,
	}))
}

func getFileSystem(path string) http.FileSystem {
	fs, err := fs.Sub(embeddedFiles, path)
	if err != nil {
		panic(err)
	}
	return http.FS(fs)
}
