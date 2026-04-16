import type { Bin, DumpingPoint, GraphEdge, GraphData, UpdateBinState } from "@shared/schema";

export interface IStorage {
  getGraphData(): Promise<GraphData>;
  updateBinState(binId: string, isFull: boolean): Promise<void>;
}

export class MemStorage implements IStorage {
  private bins: Map<string, Bin>;
  private dumpingPoint: DumpingPoint;
  private edges: GraphEdge[];

  constructor() {
    this.bins = new Map();
    this.edges = [];
    this.initializeGraph();
  }

  private initializeGraph() {
    // Initialize 10 bins with positions in a network layout
    const binData: Omit<Bin, "isFull">[] = [
      { id: "bin-a", label: "Bin A", x: 150, y: 100, weight: 10 },
      { id: "bin-b", label: "Bin B", x: 350, y: 100, weight: 10 },
      { id: "bin-c", label: "Bin C", x: 550, y: 100, weight: 10 },
      { id: "bin-d", label: "Bin D", x: 150, y: 250, weight: 10 },
      { id: "bin-e", label: "Bin E", x: 350, y: 250, weight: 10 },
      { id: "bin-f", label: "Bin F", x: 550, y: 250, weight: 10 },
      { id: "bin-g", label: "Bin G", x: 150, y: 400, weight: 10 },
      { id: "bin-h", label: "Bin H", x: 350, y: 400, weight: 10 },
      { id: "bin-i", label: "Bin I", x: 550, y: 400, weight: 10 },
      { id: "bin-j", label: "Bin J", x: 650, y: 250, weight: 10 },
    ];

    // Set initial state - some bins full, some empty
    binData.forEach((bin, index) => {
      this.bins.set(bin.id, {
        ...bin,
        isFull: index % 3 === 0, // Every third bin is full initially
      });
    });

    // Initialize dumping point
    this.dumpingPoint = {
      id: "dump",
      label: "Dumping Point",
      x: 400,
      y: 500,
    };

    // Create edges (connections between nodes)
    // Calculate distances based on coordinates
    const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy) / 50; // Scale down for realistic km values
    };

    const nodes = [
      ...Array.from(this.bins.values()).map(b => ({ id: b.id, x: b.x, y: b.y })),
      { id: this.dumpingPoint.id, x: this.dumpingPoint.x, y: this.dumpingPoint.y }
    ];

    // Create edges between nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = calculateDistance(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
        
        // Only create edges for nodes that are reasonably close (less than 6 km)
        if (distance < 6) {
          const cost = distance * 1.5; // Cost is slightly higher than distance
          this.edges.push({
            from: nodes[i].id,
            to: nodes[j].id,
            distance: parseFloat(distance.toFixed(2)),
            cost: parseFloat(cost.toFixed(2)),
          });
        }
      }
    }
  }

  async getGraphData(): Promise<GraphData> {
    return {
      bins: Array.from(this.bins.values()),
      dumpingPoint: this.dumpingPoint,
      edges: this.edges,
    };
  }

  async updateBinState(binId: string, isFull: boolean): Promise<void> {
    const bin = this.bins.get(binId);
    if (!bin) {
      throw new Error(`Bin ${binId} not found`);
    }
    this.bins.set(binId, { ...bin, isFull });
  }
}

export const storage = new MemStorage();
