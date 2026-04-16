import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { GraphData, Bin, RouteResult } from "@shared/schema";
import { MapVisualization } from "@/components/map-visualization";
import { ControlPanel } from "@/components/control-panel";
import { OutputPanel } from "@/components/output-panel";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [activeAlgorithm, setActiveAlgorithm] = useState<string | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const { data: graphData, isLoading } = useQuery<GraphData>({
    queryKey: ["/api/graph"],
  });

  const updateBinMutation = useMutation({
    mutationFn: async ({ binId, isFull }: { binId: string; isFull: boolean }) => {
      const res = await apiRequest("PATCH", "/api/bins", { binId, isFull });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/graph"] });
    },
  });

  const runAlgorithmMutation = useMutation({
    mutationFn: async (algorithm: "dijkstra" | "greedy" | "astar") => {
      const res = await apiRequest("POST", "/api/algorithms/run", { algorithm, truckCapacity: 80 });
      return res.json();
    },
    onSuccess: (data: RouteResult) => {
      setRouteResult(data);
      setIsAnimating(true);
    },
  });

  const handleBinToggle = (binId: string, isFull: boolean) => {
    updateBinMutation.mutate({ binId, isFull });
  };

  const handleRunAlgorithm = (algorithm: "dijkstra" | "greedy" | "astar") => {
    setActiveAlgorithm(algorithm);
    setRouteResult(null);
    runAlgorithmMutation.mutate(algorithm);
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-main" />
          <p className="text-sm text-muted-foreground">Loading waste management system...</p>
        </div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Failed to load graph data</p>
          <p className="text-sm text-muted-foreground mt-2">Please refresh the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-app-title">
              Waste Management System
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Smart Route Optimization with Pathfinding Algorithms
            </p>
          </div>
        </div>
      </header>

      {/* Main Content - Three Column Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-[320px_1fr_340px]">
          {/* Left Sidebar - Control Panel */}
          <div className="border-r border-border bg-card overflow-y-auto">
            <ControlPanel
              bins={graphData.bins}
              onBinToggle={handleBinToggle}
              onRunAlgorithm={handleRunAlgorithm}
              isRunning={runAlgorithmMutation.isPending}
              activeAlgorithm={activeAlgorithm}
            />
          </div>

          {/* Center - Map Visualization */}
          <div className="overflow-y-auto bg-background p-6">
            <MapVisualization
              graphData={graphData}
              routeResult={routeResult}
              isAnimating={isAnimating}
              onAnimationComplete={handleAnimationComplete}
            />
          </div>

          {/* Right Sidebar - Output Panel */}
          <div className="border-l border-border bg-card overflow-y-auto">
            <OutputPanel
              routeResult={routeResult}
              isCalculating={runAlgorithmMutation.isPending}
              isAnimating={isAnimating}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
