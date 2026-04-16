import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Network, Zap, Target, Truck, AlertTriangle } from "lucide-react";
import type { Bin } from "@shared/schema";

interface ControlPanelProps {
  bins: Bin[];
  onBinToggle: (binId: string, isFull: boolean) => void;
  onRunAlgorithm: (algorithm: "dijkstra" | "greedy" | "astar") => void;
  isRunning: boolean;
  activeAlgorithm: string | null;
}

export function ControlPanel({
  bins,
  onBinToggle,
  onRunAlgorithm,
  isRunning,
  activeAlgorithm,
}: ControlPanelProps) {
  const fullBinsCount = bins.filter((bin) => bin.isFull).length;
  const totalWeight = fullBinsCount * 10;
const MAX_BINS_FOR_DIJKSTRA = 8;  

  return (
    <div className="p-6 space-y-6">
      {/* Algorithm Buttons */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-foreground">Algorithms</h2>
        <div className="space-y-3">

          
          {/* <Button
            onClick={() => onRunAlgorithm("dijkstra")}
            disabled={isRunning || fullBinsCount === 0}
            className="w-full justify-start gap-3 h-12"
            variant={activeAlgorithm === "dijkstra" ? "default" : "outline"}
            data-testid="button-run-dijkstra"
          >
            <Network className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Run Dijkstra</span>
          </Button> */}

<Button
  onClick={() => {
    if (fullBinsCount > MAX_BINS_FOR_DIJKSTRA) {
      alert(`Dijkstra algorithm cannot handle more than ${MAX_BINS_FOR_DIJKSTRA} bins. Please use the Greedy algorithm or reduce the number of full bins.`);
      return;
    }
    onRunAlgorithm("dijkstra");
  }}
  disabled={isRunning || fullBinsCount === 0}
  className="w-full justify-start gap-3 h-12"
  variant={activeAlgorithm === "dijkstra" ? "default" : "outline"}
  data-testid="button-run-dijkstra"
  title={fullBinsCount > MAX_BINS_FOR_DIJKSTRA ? `Too many bins (${fullBinsCount}/${MAX_BINS_FOR_DIJKSTRA})` : ""}
>
  <Network className="w-5 h-5" />
  <span className="text-sm font-medium uppercase tracking-wide">Run Dijkstra</span>
  {fullBinsCount > MAX_BINS_FOR_DIJKSTRA && (
    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
      Too many bins
    </span>
  )}
</Button>



          <Button
            onClick={() => onRunAlgorithm("greedy")}
            disabled={isRunning || fullBinsCount === 0}
            className="w-full justify-start gap-3 h-12"
            variant={activeAlgorithm === "greedy" ? "default" : "outline"}
            data-testid="button-run-greedy"
          >
            <Zap className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Run Greedy</span>
          </Button>

          {/* <Button
            onClick={() => onRunAlgorithm("astar")}
            disabled={isRunning || fullBinsCount === 0}
            className="w-full justify-start gap-3 h-12"
            variant={activeAlgorithm === "astar" ? "default" : "outline"}
            data-testid="button-run-astar"
          >
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Run A*</span>
          </Button> */}
        </div>
      </div>

      {/* Truck Capacity Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Truck Capacity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Load</span>
              <span className="text-base font-mono font-semibold" data-testid="text-current-load">
                {totalWeight} kg
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Max Capacity</span>
              <span className="text-base font-mono">80 kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Full Bins</span>
              <Badge variant={fullBinsCount > 8 ? "destructive" : "secondary"} data-testid="badge-full-bins">
                {fullBinsCount} / {bins.length}
              </Badge>
            </div>
            {fullBinsCount > 8 && (
              <div className="flex items-center gap-1.5 text-xs text-destructive mt-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Multi-trip required (capacity exceeded)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bin State Manager */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-foreground">Bin States</h2>
        <div className="space-y-2">
          {bins.map((bin) => (
            <div
              key={bin.id}
              className="flex items-center justify-between p-3 rounded-md bg-muted/30 hover-elevate"
              data-testid={`bin-toggle-${bin.id}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full transition-colors ${
                    bin.isFull ? "bg-destructive" : "bg-muted-foreground/30"
                  }`}
                />
                <span className="text-sm font-medium">{bin.label}</span>
              </div>
              <Switch
                checked={bin.isFull}
                onCheckedChange={(checked) => onBinToggle(bin.id, checked)}
                data-testid={`switch-bin-${bin.id}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
