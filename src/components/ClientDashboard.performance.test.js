
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase-config';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('../firebase-config', () => ({
  db: {},
}));

const SIMULATED_LATENCY = 50; // ms per request
const NUM_LOCATIONS = 10;
const SUPPLIES_PER_LOCATION = 5;

// Mock Data
const mockLocations = Array.from({ length: NUM_LOCATIONS }, (_, i) => ({
  id: `loc-${i}`,
  data: () => ({ name: `Location ${i}` }),
}));

const mockSupplies = Array.from({ length: SUPPLIES_PER_LOCATION }, (_, i) => ({
  id: `sup-${i}`,
  data: () => ({
    name: `Supply ${i}`,
    currentStock: 2,
    parLevel: 5 // Low stock condition
  }),
}));

// Mock Implementation
const mockGetDocs = async (queryOrCollection) => {
  await new Promise(resolve => setTimeout(resolve, SIMULATED_LATENCY));

  // If query is for locations
  if (queryOrCollection === 'locationsQuery') {
    return { docs: mockLocations };
  }

  // If query is for supplies (simplified check)
  return {
    docs: mockSupplies,
    forEach: (cb) => mockSupplies.forEach(cb)
  };
};

describe('Performance Optimization Benchmark', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDocs.mockImplementation(mockGetDocs);
    collection.mockReturnValue({}); // Return dummy object
    query.mockReturnValue('locationsQuery'); // Return dummy object
  });

  test('Compare sequential vs parallel fetching', async () => {
    // --- Slow Implementation (Current Code Logic) ---
    const startSlow = performance.now();

    const locationsSnapshot = await getDocs(query(collection(db, "storageLocations"), where("ownerId", "==", "user1")));
    let lowItemsSlow = [];
    for (const locationDoc of locationsSnapshot.docs) {
        const suppliesSnapshot = await getDocs(collection(db, `storageLocations/${locationDoc.id}/supplies`));
        suppliesSnapshot.forEach(supplyDoc => {
            const supply = supplyDoc.data();
            if (parseInt(supply.currentStock) < parseInt(supply.parLevel)) {
                lowItemsSlow.push({ ...supply, id: supplyDoc.id, locationName: locationDoc.data().name });
            }
        });
    }

    const endSlow = performance.now();
    const durationSlow = endSlow - startSlow;

    // --- Fast Implementation (Optimized Logic) ---
    const startFast = performance.now();

    const locationsSnapshotFast = await getDocs(query(collection(db, "storageLocations"), where("ownerId", "==", "user1")));
    const promises = locationsSnapshotFast.docs.map(async (locationDoc) => {
        const suppliesSnapshot = await getDocs(collection(db, `storageLocations/${locationDoc.id}/supplies`));
        const localLowItems = [];
        suppliesSnapshot.forEach(supplyDoc => {
            const supply = supplyDoc.data();
            if (parseInt(supply.currentStock) < parseInt(supply.parLevel)) {
                localLowItems.push({ ...supply, id: supplyDoc.id, locationName: locationDoc.data().name });
            }
        });
        return localLowItems;
    });

    const results = await Promise.all(promises);
    const lowItemsFast = results.flat();

    const endFast = performance.now();
    const durationFast = endFast - startFast;

    console.log(`\n--- Benchmark Results ---`);
    console.log(`Sequential (N+1): ${durationSlow.toFixed(2)}ms`);
    console.log(`Parallel (Promise.all): ${durationFast.toFixed(2)}ms`);
    console.log(`Speedup: ${(durationSlow / durationFast).toFixed(2)}x`);
    console.log(`-------------------------\n`);

    // Verification
    expect(lowItemsSlow.length).toBe(NUM_LOCATIONS * SUPPLIES_PER_LOCATION);
    expect(lowItemsFast.length).toBe(NUM_LOCATIONS * SUPPLIES_PER_LOCATION);
    expect(lowItemsSlow).toEqual(lowItemsFast);

    // Performance assertion (Parallel should be at least 2x faster for N=10)
    expect(durationFast).toBeLessThan(durationSlow);
  });
});
