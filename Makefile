GOMOD=$(shell test -f "go.work" && echo "readonly" || echo "vendor")
LDFLAGS=-s -w

wasm:
	GOOS=js GOARCH=wasm go build -mod $(GOMOD) -ldflags="$(LDFLAGS)" -o www/wasm/point_in_polygon.wasm cmd/point-in-polygon/main.go
