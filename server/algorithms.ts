import type { GraphEdge, Bin, DumpingPoint, RouteResult, Trip, RouteStep } from "@shared/schema";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
}

class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number) {
    this.items.push({ item, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

export class PathfindingAlgorithms {
  private edges: GraphEdge[];
  private bins: Bin[];
  private dumpingPoint: DumpingPoint;

  constructor(edges: GraphEdge[], bins: Bin[], dumpingPoint: DumpingPoint) {
    this.edges = edges;
    this.bins = bins;
    this.dumpingPoint = dumpingPoint;
  }

  private getNeighbors(nodeId: string): Array<{ nodeId: string; distance: number; cost: number }> {
    const neighbors: Array<{ nodeId: string; distance: number; cost: number }> = [];
    
    for (const edge of this.edges) {
      if (edge.from === nodeId) {
        neighbors.push({ nodeId: edge.to, distance: edge.distance, cost: edge.cost });
      } else if (edge.to === nodeId) {
        neighbors.push({ nodeId: edge.from, distance: edge.distance, cost: edge.cost });
      }
    }
    
    return neighbors;
  }

  private getNodeLabel(nodeId: string): string {
    const bin = this.bins.find(b => b.id === nodeId);
    if (bin) return bin.label;
    if (nodeId === this.dumpingPoint.id) return this.dumpingPoint.label;
    return nodeId;
  }

  private dijkstra(startId: string, targetIds: string[]): RouteStep[] | null {
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const visited = new Set<string>();
    const pq = new PriorityQueue<string>();

    const allNodes = [
      ...this.bins.map(b => b.id),
      this.dumpingPoint.id
    ];

    allNodes.forEach(nodeId => {
      distances.set(nodeId, Infinity);
      previous.set(nodeId, null);
    });

    distances.set(startId, 0);
    pq.enqueue(startId, 0);

    while (!pq.isEmpty()) {
      const current = pq.dequeue();
      if (!current || visited.has(current)) continue; // Avoids reprocessing nodes
      visited.add(current);

      if (targetIds.includes(current) && current !== startId) { // Stop when we reach ANY target node
        break;
      }

      const neighbors = this.getNeighbors(current);
      for (const { nodeId, distance, cost } of neighbors) {
        if (visited.has(nodeId)) continue;

        const newDist = (distances.get(current) || 0) + cost;  //Current: A (distance 0) Neighbor: B (edge cost 5)
        if (newDist < (distances.get(nodeId) || Infinity)) {  //Check: newDist <neighbourID.distance Infinity? YES
          distances.set(nodeId, newDist); //Update: distances["B"] = 5
          previous.set(nodeId, current); //Update: previous["B"] = "A"
          pq.enqueue(nodeId, newDist); //Enqueue: B with priority 5
        }
      }
    }

    let closestTarget: string | null = null;  //Chooses the target with smallest distance
    let minDist = Infinity;
    for (const targetId of targetIds) {
      const dist = distances.get(targetId) || Infinity;
      if (dist < minDist) {
        minDist = dist;
        closestTarget = targetId;
      }
    }

    if (!closestTarget || minDist === Infinity) return null;// target (notFound || infinity)

    const path: string[] = [];
    let current: string | null = closestTarget;
    while (current !== null) {
      path.unshift(current);
      current = previous.get(current) || null;
    }

    const steps: RouteStep[] = [];
    for (let i = 1; i < path.length; i++) {
      const fromId = path[i - 1];
      const toId = path[i];
      const edge = this.edges.find(
        e => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId)
      );
      if (edge) {
        steps.push({
          nodeId: toId,
          nodeLabel: this.getNodeLabel(toId),
          distance: edge.distance,
          cost: edge.cost,
        });
      }
    }

    return steps;
  }

  

  runGreedy(truckCapacity: number): RouteResult {
    const startTime = Date.now();
    const fullBins = this.bins.filter(b => b.isFull);
    
    if (fullBins.length === 0) {
      return {
        algorithm: "greedy",
        trips: [],
        totalDistance: 0,
        totalCost: 0,
        totalTime: 0,
        calculationTimeMs: Date.now() - startTime,
      };
    }

    const trips: Trip[] = [];
    const remainingBins = new Set(fullBins.map(b => b.id));
    let tripNumber = 1;

    while (remainingBins.size > 0) {
      let currentPosition = this.dumpingPoint.id;
      const tripBins: string[] = [];
      let tripWeight = 0;
      const allSteps: RouteStep[] = [
        { nodeId: this.dumpingPoint.id, nodeLabel: this.dumpingPoint.label, distance: 0, cost: 0 }
      ];

      while (remainingBins.size > 0 && tripWeight + 10 <= truckCapacity) {
        let closestBin: string | null = null;
        let minDistance = Infinity;
        let closestPath: RouteStep[] | null = null;

        for (const binId of remainingBins) {
          const path = this.dijkstra(currentPosition, [binId]);
          if (path && path.length > 0) {
            const distance = path.reduce((sum, step) => sum + step.distance, 0);
            if (distance < minDistance) {
              minDistance = distance;
              closestBin = binId;
              closestPath = path;
            }
          }
        }

        if (!closestBin || !closestPath) break;

        allSteps.push(...closestPath);
        tripBins.push(closestBin);
        remainingBins.delete(closestBin);
        tripWeight += 10;
        currentPosition = closestBin;
      }

      if (tripBins.length === 0) break;

      const pathToDump = this.dijkstra(currentPosition, [this.dumpingPoint.id]);
      if (pathToDump) {
        allSteps.push(...pathToDump);
      }

      const totalDistance = allSteps.reduce((sum, step) => sum + step.distance, 0);
      const totalCost = allSteps.reduce((sum, step) => sum + step.cost, 0);
      const totalTime = totalDistance * 2;

      trips.push({
        tripNumber,
        steps: allSteps,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalTime: parseFloat(totalTime.toFixed(0)),
        binCount: tripBins.length,
      });

      tripNumber++;
    }

    const totalDistance = trips.reduce((sum, trip) => sum + trip.totalDistance, 0);
    const totalCost = trips.reduce((sum, trip) => sum + trip.totalCost, 0);
    const totalTime = trips.reduce((sum, trip) => sum + trip.totalTime, 0);

    return {
      algorithm: "greedy",
      trips,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalTime: parseFloat(totalTime.toFixed(0)),
      calculationTimeMs: Date.now() - startTime,
    };
  }



  






runDijkstra(truckCapacity: number): RouteResult {
    const startTime = Date.now();
    const fullBins = this.bins.filter(b => b.isFull);
   
    if (fullBins.length === 0) {
      return {
        algorithm: "dijkstra",
        trips: [],
        totalDistance: 0,
        totalCost: 0,
        totalTime: 0,
        calculationTimeMs: Date.now() - startTime,
      };
    }

    const trips: Trip[] = [];
    let currentPosition = this.dumpingPoint.id;
    const remainingBins = new Set(fullBins.map(b => b.id));
    let tripNumber = 1;

    while (remainingBins.size > 0) {
      const tripBins: string[] = [];
      let tripWeight = 0;

      while (remainingBins.size > 0 && tripWeight + 10 <= truckCapacity) {
        const path = this.dijkstra(currentPosition, Array.from(remainingBins));
        if (!path || path.length === 0) break;

        const nextBinId = path[path.length - 1].nodeId;
        tripBins.push(nextBinId);
        remainingBins.delete(nextBinId);
        tripWeight += 10;
        currentPosition = nextBinId;
      }

      if (tripBins.length === 0) break;

      const pathToDump = this.dijkstra(currentPosition, [this.dumpingPoint.id]);
      
      let allSteps: RouteStep[] = [
        { nodeId: this.dumpingPoint.id, nodeLabel: this.dumpingPoint.label, distance: 0, cost: 0 }
      ];

      let tempPos = this.dumpingPoint.id;
      for (const binId of tripBins) {
        const path = this.dijkstra(tempPos, [binId]);
        if (path) {
          allSteps.push(...path);
          tempPos = binId;
        }
      }

      if (pathToDump) {
        allSteps.push(...pathToDump);
      }

      const totalDistance = allSteps.reduce((sum, step) => sum + step.distance, 0);
      const totalCost = allSteps.reduce((sum, step) => sum + step.cost, 0);
      const totalTime = totalDistance * 2; // Assume 2 min per km

      trips.push({
        tripNumber,
        steps: allSteps,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalTime: parseFloat(totalTime.toFixed(0)),
        binCount: tripBins.length,
      });

      currentPosition = this.dumpingPoint.id;
      tripNumber++;
    }

    const totalDistance = trips.reduce((sum, trip) => sum + trip.totalDistance, 0);
    const totalCost = trips.reduce((sum, trip) => sum + trip.totalCost, 0);
    const totalTime = trips.reduce((sum, trip) => sum + trip.totalTime, 0);

    return {
      algorithm: "dijkstra",
      trips,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalTime: parseFloat(totalTime.toFixed(0)),
      calculationTimeMs: Date.now() - startTime,
    };
  }



//   //////////////////////////////////////////////////

  private heuristic(fromId: string, toId: string): number {
    const getNode = (id: string): Node | null => {
      const bin = this.bins.find(b => b.id === id);
      if (bin) return { id: bin.id, label: bin.label, x: bin.x, y: bin.y };
      if (id === this.dumpingPoint.id) {
        return { 
          id: this.dumpingPoint.id, 
          label: this.dumpingPoint.label, 
          x: this.dumpingPoint.x, 
          y: this.dumpingPoint.y 
        };
      }
      return null;
    };

    const from = getNode(fromId);
    const to = getNode(toId);
    if (!from || !to) return 0;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.sqrt(dx * dx + dy * dy) / 50;
  }





  private astar(startId: string, goalId: string): RouteStep[] | null {

    const openSet = new PriorityQueue<string>();
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const closedSet = new Set<string>();

    const allNodes = [...this.bins.map(b => b.id), this.dumpingPoint.id];
    allNodes.forEach(nodeId => {
      gScore.set(nodeId, Infinity);
      fScore.set(nodeId, Infinity);
    });

    gScore.set(startId, 0);
    fScore.set(startId, this.heuristic(startId, goalId));
    openSet.enqueue(startId, fScore.get(startId)!);

    while (!openSet.isEmpty()) {
      const current = openSet.dequeue();
      if (!current) break;
      if (closedSet.has(current)) continue;
      closedSet.add(current);

      if (current === goalId) {
        const path: string[] = [];
        let temp: string | undefined = current;
        while (temp) {
          path.unshift(temp);
          temp = cameFrom.get(temp);
        }

        const steps: RouteStep[] = [];
        for (let i = 1; i < path.length; i++) {
          const fromId = path[i - 1];
          const toId = path[i];
          const edge = this.edges.find(
            e => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId)
          );
          if (edge) {
            steps.push({
              nodeId: toId,
              nodeLabel: this.getNodeLabel(toId),
              distance: edge.distance,
              cost: edge.cost,
            });
          }
        }
        return steps;
      }

      const neighbors = this.getNeighbors(current);
      for (const { nodeId, distance, cost } of neighbors) {
        const tentativeGScore = (gScore.get(current) || Infinity) + cost;

        if (tentativeGScore < (gScore.get(nodeId) || Infinity)) {
          cameFrom.set(nodeId, current);
          gScore.set(nodeId, tentativeGScore);
          fScore.set(nodeId, tentativeGScore + this.heuristic(nodeId, goalId));
          openSet.enqueue(nodeId, fScore.get(nodeId)!);
        }
      }
    }

    return null;
  }

  runAStar(truckCapacity: number): RouteResult {
    const startTime = Date.now();
    const fullBins = this.bins.filter(b => b.isFull);
    
    if (fullBins.length === 0) {
      return {
        algorithm: "astar",
        trips: [],
        totalDistance: 0,
        totalCost: 0,
        totalTime: 0,
        calculationTimeMs: Date.now() - startTime,
      };
    }

    const trips: Trip[] = [];
    const remainingBins = new Set(fullBins.map(b => b.id));
    let tripNumber = 1;

    while (remainingBins.size > 0) {
      let currentPosition = this.dumpingPoint.id;
      const tripBins: string[] = [];
      let tripWeight = 0;
      const allSteps: RouteStep[] = [
        { nodeId: this.dumpingPoint.id, nodeLabel: this.dumpingPoint.label, distance: 0, cost: 0 }
      ];

      while (remainingBins.size > 0 && tripWeight + 10 <= truckCapacity) {
        let closestBin: string | null = null;
        let minFScore = Infinity;
        let closestPath: RouteStep[] | null = null;

        for (const binId of remainingBins) {
          const path = this.astar(currentPosition, binId);
          if (path) {
            const gScore = path.reduce((sum, step) => sum + step.cost, 0);
            const hScore = this.heuristic(binId, this.dumpingPoint.id);
            const fScore = gScore + hScore;

            if (fScore < minFScore) {
              minFScore = fScore;
              closestBin = binId;
              closestPath = path;
            }
          }
        }

        if (!closestBin || !closestPath) break;

        allSteps.push(...closestPath);
        tripBins.push(closestBin);
        remainingBins.delete(closestBin);
        tripWeight += 10;
        currentPosition = closestBin;
      }

      if (tripBins.length === 0) break;

      const pathToDump = this.astar(currentPosition, this.dumpingPoint.id);
      if (pathToDump) {
        allSteps.push(...pathToDump);
      }

      const totalDistance = allSteps.reduce((sum, step) => sum + step.distance, 0);
      const totalCost = allSteps.reduce((sum, step) => sum + step.cost, 0);
      const totalTime = totalDistance * 2;

      trips.push({
        tripNumber,
        steps: allSteps,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalTime: parseFloat(totalTime.toFixed(0)),
        binCount: tripBins.length,
      });

      tripNumber++;
    }

    const totalDistance = trips.reduce((sum, trip) => sum + trip.totalDistance, 0);
    const totalCost = trips.reduce((sum, trip) => sum + trip.totalCost, 0);
    const totalTime = trips.reduce((sum, trip) => sum + trip.totalTime, 0);

    return {
      algorithm: "astar",
      trips,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalTime: parseFloat(totalTime.toFixed(0)),
      calculationTimeMs: Date.now() - startTime,
    };
  }
}




