import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, Clock, MapPin, Navigation } from "lucide-react";
import type { RouteResult } from "@shared/schema";

interface OutputPanelProps {
  routeResult: RouteResult | null;
  isCalculating: boolean;
  isAnimating: boolean;
}

export function OutputPanel({ routeResult, isCalculating, isAnimating }: OutputPanelProps) {
  if (isCalculating) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" data-testid="loader-algorithm" />
        <p className="text-sm text-muted-foreground">Calculating optimal route...</p>
      </div>
    );
  }

  if (!routeResult || !routeResult.trips) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center">
        <Navigation className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-sm text-muted-foreground">
          Select an algorithm to calculate the optimal route
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Results will appear here
        </p>
      </div>
    );
  }

  const totalTrips = routeResult.trips?.length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Algorithm Info */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Algorithm Results</CardTitle>
            {!isAnimating && <CheckCircle2 className="w-5 h-5 text-primary" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Algorithm</span>
            <Badge variant="default" data-testid="badge-algorithm">
              {routeResult.algorithm.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={isAnimating ? "secondary" : "outline"}>
              {isAnimating ? "Animating" : "Complete"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Calc. Time</span>
            <span className="text-sm font-mono" data-testid="text-calc-time">
              {routeResult.calculationTimeMs}ms
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Route Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-md">
              <p className="text-2xl font-bold font-mono text-foreground" data-testid="text-total-cost">
                {routeResult.totalCost.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total Cost</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-md">
              <p className="text-2xl font-bold font-mono text-foreground" data-testid="text-total-time">
                {routeResult.totalTime.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total Time (min)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-md">
              <p className="text-2xl font-bold font-mono text-foreground" data-testid="text-total-distance">
                {routeResult.totalDistance.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Distance (km)</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-md">
              <p className="text-2xl font-bold font-mono text-primary" data-testid="text-total-trips">
                {totalTrips}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Trip(s)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Trip Details</h3>
        {routeResult.trips?.map((trip, tripIndex) => (
          <Card key={tripIndex}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Trip {trip.tripNumber}
                </CardTitle>
                <Badge variant="secondary" data-testid={`badge-trip-${tripIndex}-bins`}>
                  {trip.binCount} bins
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-mono">{trip.totalDistance.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {trip.totalTime.toFixed(0)} min
                  </span>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Path Order:</p>
                {trip.steps.map((step, stepIndex) => (
                  <div
                    key={stepIndex}
                    className="flex items-center gap-2 text-xs p-2 rounded bg-muted/20"
                    data-testid={`trip-${tripIndex}-step-${stepIndex}`}
                  >
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {stepIndex + 1}
                    </Badge>
                    <span className="font-medium flex-1">{step.nodeLabel}</span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {step.distance.toFixed(1)} km
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
