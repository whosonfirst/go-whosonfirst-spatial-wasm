package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"syscall/js"
	"time"
	
	"github.com/paulmach/orb"	
	"github.com/paulmach/orb/geojson"
	"github.com/whosonfirst/go-whosonfirst-spatial/database"
	"github.com/whosonfirst/go-whosonfirst-spatial/query"	
)

func PointInPolygonFunc() js.Func {

	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {

		fc_str := args[0].String()
		q_str := args[1].String()
		
		handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {

			resolve := args[0]
			reject := args[1]

			t1 := time.Now()

			defer func(){
				slog.Info("Time to perform point-in-polygon query", "time", time.Since(t1))
			}()
			
			ctx := context.Background()
			
			var spatial_q *query.SpatialQuery

			err := json.Unmarshal([]byte(q_str), &spatial_q)

			if err != nil {
				slog.Error("Failed to unmarshal spatial query", "error", err)
				reject.Invoke(fmt.Sprintf("Failed to unmarshal spatial query, %w", err))
				return nil
			}
			
			if spatial_q.Geometry == nil {
				slog.Error("Missing geometry in spatial query")
				reject.Invoke(fmt.Sprintf("Missing geometry"))
				return nil
			}

			if spatial_q.Geometry.Type != "Point" {
				slog.Error("Invalid geometry type", "type", spatial_q.Geometry.Type)
				reject.Invoke(fmt.Sprintf("Invalid geometry type"))
				return nil
			}

			pt := spatial_q.Geometry.Geometry().(orb.Point)
			
			fc, err := geojson.UnmarshalFeatureCollection([]byte(fc_str))

			if err != nil {
				slog.Error("Failed to unmarshal feature collection", "error", err)
				reject.Invoke(fmt.Sprintf("Failed to unmarshal feature collection, w", err))
				return nil
			}

			db, err := database.NewSpatialDatabase(ctx, "rtree://")
			
			if err != nil {
				slog.Error("Failed to create spatial database", "error", err)
				reject.Invoke(fmt.Sprintf("Failed to create new database, w", err))
				return nil
			}

			slog.Info("Index features", "count", len(fc.Features))
			t2 := time.Now()
			
			for offset, f := range fc.Features {
				
				enc_f, _ := f.MarshalJSON()
				err := db.IndexFeature(ctx, enc_f)

				if err != nil {
					slog.Error("Failed to index feature", "offset", offset, "error", err)
					reject.Invoke(fmt.Sprintf("Failed to index feature, %w", err))
					return nil
				}
			}

			slog.Info("Time to index features", "time", time.Since(t2))

			slog.Info("Perform point-in-polygon query")
			t3 := time.Now()
			
			rsp, err := db.PointInPolygon(ctx, &pt)

			if err != nil {
				slog.Error("Failed to perform point-in-polygon query", "error", err)
				reject.Invoke(fmt.Sprintf("Failed to perform point-in-polygon, %w", err))
				return nil
			}

			slog.Info("Time to PIP", "time", time.Since(t3))
			
			enc, err := json.Marshal(rsp)

			if err != nil {
				slog.Error("Failed to marshal results", "error", err)
				reject.Invoke(fmt.Printf("Failed to marshal results, %w", err))
				return nil
			}

			resolve.Invoke(string(enc))
			return nil
		})

		promiseConstructor := js.Global().Get("Promise")
		return promiseConstructor.New(handler)
	})
}

func main() {

	pip_func := PointInPolygonFunc()
	defer pip_func.Release()

	js.Global().Set("point_in_polygon", pip_func)

	c := make(chan struct{}, 0)

	slog.Info("point_in_polygon function initialized.")
	<-c
}
