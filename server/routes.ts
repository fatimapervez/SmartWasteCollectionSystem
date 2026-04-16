import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { PathfindingAlgorithms } from "./algorithms";
import { updateBinStateSchema, algorithmRequestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get graph data (bins, dumping point, edges)
  app.get("/api/graph", async (_req, res) => {
    try {
      const graphData = await storage.getGraphData();
      res.json(graphData);
    } catch (error) {
      console.error("Error fetching graph data:", error);
      res.status(500).json({ error: "Failed to fetch graph data" });
    }
  });

  // Update bin state (full/empty)
  app.patch("/api/bins", async (req, res) => {
    try {
      const parsed = updateBinStateSchema.parse(req.body);
      await storage.updateBinState(parsed.binId, parsed.isFull);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating bin state:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Run pathfinding algorithm
  app.post("/api/algorithms/run", async (req, res) => {
    try {
      const parsed = algorithmRequestSchema.parse(req.body);
      const graphData = await storage.getGraphData();
      
      const algorithms = new PathfindingAlgorithms(
        graphData.edges,
        graphData.bins,
        graphData.dumpingPoint
      );

      let result;
      switch (parsed.algorithm) {
        case "dijkstra":
          result = algorithms.runDijkstra(parsed.truckCapacity);
          break;
        case "greedy":
          result = algorithms.runGreedy(parsed.truckCapacity);
          break;
        case "astar":
          result = algorithms.runAStar(parsed.truckCapacity);
          break;
        default:
          return res.status(400).json({ error: "Invalid algorithm" });
      }

      res.json(result);
    } catch (error) {
      console.error("Error running algorithm:", error);
      res.status(500).json({ error: "Failed to run algorithm" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
