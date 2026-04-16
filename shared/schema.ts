import { z } from "zod";

// Bin schema
export const binSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  isFull: z.boolean(),
  weight: z.number().default(10),
});

export type Bin = z.infer<typeof binSchema>;

// Dumping point schema
export const dumpingPointSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
});

export type DumpingPoint = z.infer<typeof dumpingPointSchema>;

// Graph edge schema
export const graphEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  distance: z.number(),
  cost: z.number(),
});

export type GraphEdge = z.infer<typeof graphEdgeSchema>;

// Route step schema
export const routeStepSchema = z.object({
  nodeId: z.string(),
  nodeLabel: z.string(),
  distance: z.number(),
  cost: z.number(),
});

export type RouteStep = z.infer<typeof routeStepSchema>;

// Trip schema for multi-trip routes
export const tripSchema = z.object({
  tripNumber: z.number(),
  steps: z.array(routeStepSchema),
  totalDistance: z.number(),
  totalCost: z.number(),
  totalTime: z.number(),
  binCount: z.number(),
});

export type Trip = z.infer<typeof tripSchema>;

// Route result schema
export const routeResultSchema = z.object({
  algorithm: z.enum(["dijkstra", "greedy", "astar"]),
  trips: z.array(tripSchema),
  totalDistance: z.number(),
  totalCost: z.number(),
  totalTime: z.number(),
  calculationTimeMs: z.number(),
});

export type RouteResult = z.infer<typeof routeResultSchema>;

// Graph data schema
export const graphDataSchema = z.object({
  bins: z.array(binSchema),
  dumpingPoint: dumpingPointSchema,
  edges: z.array(graphEdgeSchema),
});

export type GraphData = z.infer<typeof graphDataSchema>;

// Update bin state schema
export const updateBinStateSchema = z.object({
  binId: z.string(),
  isFull: z.boolean(),
});

export type UpdateBinState = z.infer<typeof updateBinStateSchema>;

// Algorithm request schema
export const algorithmRequestSchema = z.object({
  algorithm: z.enum(["dijkstra", "greedy", "astar"]),
  truckCapacity: z.number().default(80),
});

export type AlgorithmRequest = z.infer<typeof algorithmRequestSchema>;
