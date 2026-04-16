import { useEffect, useState, useRef } from "react";
import type { GraphData, RouteResult } from "@shared/schema";
import { Trash2, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MapVisualizationProps {
  graphData: GraphData;
  routeResult: RouteResult | null;
  isAnimating: boolean;
  onAnimationComplete: () => void;
}

export function MapVisualization({
  graphData,
  routeResult,
  isAnimating,
  onAnimationComplete,
}: MapVisualizationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTrip, setCurrentTrip] = useState(0);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const viewBoxWidth = 800;
  const viewBoxHeight = 600;

  useEffect(() => {
    if (!isAnimating || !routeResult || !routeResult.trips || routeResult.trips.length === 0) {
      setCurrentStep(0);
      setCurrentTrip(0);
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animateRoute = () => {
      const trip = routeResult.trips[currentTrip];
      if (!trip || !trip.steps) return;

      if (currentStep < trip.steps.length - 1) {
        animationRef.current = setTimeout(() => {
          setCurrentStep((prev) => prev + 1);
        }, 2000);
      } else if (currentTrip < routeResult.trips.length - 1) {
        animationRef.current = setTimeout(() => {
          setCurrentTrip((prev) => prev + 1);
          setCurrentStep(0);
        }, 2000);
      } else {
        setTimeout(() => {
          onAnimationComplete();
        }, 1000);
      }
    };

    animateRoute();

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isAnimating, currentStep, currentTrip, routeResult, onAnimationComplete]);

  const getNodePosition = (nodeId: string) => {
    const bin = graphData.bins.find((b) => b.id === nodeId);
    if (bin) return { x: bin.x, y: bin.y, label: bin.label };
    if (graphData.dumpingPoint.id === nodeId) {
      return {
        x: graphData.dumpingPoint.x,
        y: graphData.dumpingPoint.y,
        label: graphData.dumpingPoint.label,
      };
    }
    return null;
  };

  const getCurrentAnimatedPath = () => {
    if (!routeResult || !isAnimating || !routeResult.trips || routeResult.trips.length === 0) return [];

    const paths: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = [];
    
    for (let t = 0; t <= currentTrip; t++) {
      const trip = routeResult.trips[t];
      if (!trip || !trip.steps) continue;
      
      const maxStep = t === currentTrip ? currentStep : trip.steps.length - 1;

      for (let s = 0; s < maxStep; s++) {
        if (!trip.steps[s] || !trip.steps[s + 1]) continue;
        
        const fromPos = getNodePosition(trip.steps[s].nodeId);
        const toPos = getNodePosition(trip.steps[s + 1].nodeId);
        if (fromPos && toPos) {
          paths.push({
            from: { x: fromPos.x, y: fromPos.y },
            to: { x: toPos.x, y: toPos.y },
          });
        }
      }
    }

    return paths;
  };

  const getCurrentTruckPosition = () => {
    if (!routeResult || !isAnimating || !routeResult.trips || routeResult.trips.length === 0) return null;

    const trip = routeResult.trips[currentTrip];
    if (!trip || !trip.steps || currentStep >= trip.steps.length) return null;

    const step = trip.steps[currentStep];
    if (!step) return null;

    const pos = getNodePosition(step.nodeId);
    return pos ? { x: pos.x, y: pos.y } : null;
  };

  const animatedPaths = getCurrentAnimatedPath();
  const truckPosition = getCurrentTruckPosition();

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Legend */}
      <div className="flex items-center gap-6 flex-wrap justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-destructive" />
          <span className="text-xs text-muted-foreground">Full Bin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-muted" />
          <span className="text-xs text-muted-foreground">Empty Bin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">Dumping Point</span>
        </div>
        {isAnimating && (
          <Badge variant="secondary" className="animate-pulse">
            Animating Route...
          </Badge>
        )}
      </div>

      {/* SVG Map */}
      <div className="w-full max-w-4xl bg-card border border-card-border rounded-md p-6">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-auto"
          style={{ aspectRatio: "4/3" }}
          data-testid="svg-map"
        >
          {/* Grid Background */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width={viewBoxWidth} height={viewBoxHeight} fill="url(#grid)" />

          {/* Draw all edges */}
          {graphData.edges.map((edge, idx) => {
            const fromBin = graphData.bins.find((b) => b.id === edge.from);
            const toBin = graphData.bins.find((b) => b.id === edge.to);
            const fromDump = graphData.dumpingPoint.id === edge.from ? graphData.dumpingPoint : null;
            const toDump = graphData.dumpingPoint.id === edge.to ? graphData.dumpingPoint : null;

            const from = fromBin || fromDump;
            const to = toBin || toDump;

            if (!from || !to) return null;

            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;

            return (
              <g key={idx}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  opacity="0.4"
                />
                <rect
                  x={midX - 20}
                  y={midY - 10}
                  width="40"
                  height="20"
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                  rx="3"
                />
                <text
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-mono"
                  fill="hsl(var(--muted-foreground))"
                  fontSize="10"
                >
                  {edge.distance.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Draw animated route paths */}
          {animatedPaths.map((path, idx) => (
            <line
              key={`animated-${idx}`}
              x1={path.from.x}
              y1={path.from.y}
              x2={path.to.x}
              y2={path.to.y}
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              opacity="0.8"
              className="transition-all duration-500"
            />
          ))}

          {/* Draw bins */}
          {graphData.bins.map((bin) => (
            <g key={bin.id} data-testid={`marker-${bin.id}`}>
              <circle
                cx={bin.x}
                cy={bin.y}
                r="24"
                fill={bin.isFull ? "hsl(var(--destructive))" : "hsl(var(--muted))"}
                stroke="hsl(var(--border))"
                strokeWidth="2"
                className="transition-all duration-200"
                opacity="0.9"
              />
              <circle
                cx={bin.x}
                cy={bin.y}
                r="16"
                fill={bin.isFull ? "hsl(var(--destructive))" : "hsl(var(--muted))"}
                opacity="0.6"
              />
              <foreignObject
                x={bin.x - 12}
                y={bin.y - 12}
                width="24"
                height="24"
              >
                <div className="flex items-center justify-center w-full h-full">
                  <Trash2
                    className="w-4 h-4"
                    style={{
                      color: bin.isFull
                        ? "hsl(var(--destructive-foreground))"
                        : "hsl(var(--muted-foreground))",
                    }}
                  />
                </div>
              </foreignObject>
              <text
                x={bin.x}
                y={bin.y + 40}
                textAnchor="middle"
                className="text-sm font-medium"
                fill="hsl(var(--foreground))"
                fontSize="14"
              >
                {bin.label}
              </text>
            </g>
          ))}

          {/* Draw dumping point */}
          <g data-testid="marker-dumping-point">
            <circle
              cx={graphData.dumpingPoint.x}
              cy={graphData.dumpingPoint.y}
              r="32"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--primary-border))"
              strokeWidth="3"
              opacity="0.9"
            />
            <circle
              cx={graphData.dumpingPoint.x}
              cy={graphData.dumpingPoint.y}
              r="22"
              fill="hsl(var(--primary))"
              opacity="0.6"
            />
            <foreignObject
              x={graphData.dumpingPoint.x - 16}
              y={graphData.dumpingPoint.y - 16}
              width="32"
              height="32"
            >
              <div className="flex items-center justify-center w-full h-full">
                <Home className="w-6 h-6 text-primary-foreground" />
              </div>
            </foreignObject>
            <text
              x={graphData.dumpingPoint.x}
              y={graphData.dumpingPoint.y + 50}
              textAnchor="middle"
              className="text-sm font-medium"
              fill="hsl(var(--foreground))"
              fontSize="14"
            >
              {graphData.dumpingPoint.label}
            </text>
          </g>

          {/* Animated truck */}
          {truckPosition && (
            <g className="animate-pulse">
              <circle
                cx={truckPosition.x}
                cy={truckPosition.y}
                r="12"
                fill="hsl(var(--chart-3))"
                opacity="0.8"
              />
              <circle
                cx={truckPosition.x}
                cy={truckPosition.y}
                r="16"
                fill="none"
                stroke="hsl(var(--chart-3))"
                strokeWidth="2"
                opacity="0.5"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
