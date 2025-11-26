import { ObjectId, Document, InsertManyResult, InsertOneResult, DeleteResult } from 'mongodb';

/**
 * Types for MongoDB aggregation expressions used in mock
 */
interface AggregationSumExpression {
  $sum: number | string;
}

interface AggregationCountExpression {
  $count: Record<string, never>;
}

interface AggregationGroupStage {
  _id: string;
  [field: string]: string | AggregationSumExpression | AggregationCountExpression;
}

/**
 * In-memory mock MongoDB collection for development/testing.
 * Provides a compatible interface without requiring actual MongoDB.
 */
export class MockCollection<T> {
  private data: Map<string, T> = new Map();
  
  constructor() {}

  async insertOne(doc: any): Promise<InsertOneResult<any>> {
    const id = doc._id || new ObjectId();
    doc._id = id;
    this.data.set(id.toString(), { ...doc });
    return { acknowledged: true, insertedId: id } as InsertOneResult<any>;
  }

  async insertMany(docs: any[]): Promise<InsertManyResult<any>> {
    const insertedIds: Record<number, ObjectId> = {};
    docs.forEach((doc, idx) => {
      const id = doc._id || new ObjectId();
      doc._id = id;
      this.data.set(id.toString(), { ...doc });
      insertedIds[idx] = id;
    });
    return { acknowledged: true, insertedCount: docs.length, insertedIds } as InsertManyResult<any>;
  }

  async findOne(filter?: any): Promise<T | null> {
    for (const doc of this.data.values()) {
      if (this.matchesFilter(doc as any, filter)) {
        return doc;
      }
    }
    return null;
  }

  find(filter?: any): { toArray: () => Promise<T[]>; sort: (spec: any) => any; limit: (n: number) => any } {
    let results: T[] = [];
    for (const doc of this.data.values()) {
      if (this.matchesFilter(doc as any, filter)) {
        results.push(doc);
      }
    }
    
    let sortSpec: any = null;
    let limitValue: number | null = null;
    
    const cursor = {
      toArray: async () => {
        let finalResults = [...results];
        
        // Apply sort if specified
        if (sortSpec) {
          const [field, direction] = Object.entries(sortSpec)[0];
          finalResults.sort((a: any, b: any) => {
            const aVal = a[field];
            const bVal = b[field];
            if (aVal < bVal) return direction === 1 ? -1 : 1;
            if (aVal > bVal) return direction === 1 ? 1 : -1;
            return 0;
          });
        }
        
        // Apply limit if specified
        if (limitValue !== null && limitValue > 0) {
          finalResults = finalResults.slice(0, limitValue);
        }
        
        return finalResults;
      },
      sort: function(spec: any) { 
        sortSpec = spec; 
        return this; 
      },
      limit: function(n: number) { 
        limitValue = n; 
        return this; 
      },
    };
    
    return cursor;
  }

  async countDocuments(): Promise<number> {
    return this.data.size;
  }

  async deleteOne(filter: any): Promise<DeleteResult> {
    for (const [key, doc] of this.data.entries()) {
      if (this.matchesFilter(doc as any, filter)) {
        this.data.delete(key);
        return { acknowledged: true, deletedCount: 1 };
      }
    }
    return { acknowledged: true, deletedCount: 0 };
  }

  aggregate(pipeline: Document[]): { toArray: () => Promise<Document[]> } {
    // Simple aggregation support for $match and $group
    let results: Document[] = Array.from(this.data.values()) as Document[];
    
    for (const stage of pipeline) {
      if ('$match' in stage) {
        const matchFilter = stage.$match;
        results = results.filter((doc) => this.matchesFilter(doc, matchFilter));
      }
      
      if ('$group' in stage) {
        const groupStage = stage.$group;
        const groupKey = groupStage._id;
        const groups = new Map<string, Document>();
        
        for (const doc of results) {
          const keyValue = this.getFieldValue(doc, groupKey.replace('$', ''));
          const key = keyValue?.toString() || 'null';
          
          if (!groups.has(key)) {
            groups.set(key, { _id: keyValue });
          }
          
          const group = groups.get(key)!;
          for (const [field, expr] of Object.entries(groupStage)) {
            if (field === '_id') continue;
            
            // Handle $sum aggregation expression
            if (this.isSumExpression(expr)) {
              const sumValue = typeof expr.$sum === 'number' ? expr.$sum : 1;
              group[field] = (group[field] || 0) + sumValue;
            }
            
            // Handle $count aggregation expression
            if (this.isCountExpression(expr)) {
              group[field] = (group[field] || 0) + 1;
            }
          }
        }
        
        results = Array.from(groups.values());
      }
    }
    
    return { toArray: async () => results };
  }

  private isSumExpression(expr: unknown): expr is AggregationSumExpression {
    return typeof expr === 'object' && expr !== null && '$sum' in expr;
  }

  private isCountExpression(expr: unknown): expr is AggregationCountExpression {
    return typeof expr === 'object' && expr !== null && '$count' in expr;
  }

  private matchesFilter(doc: any, filter?: any): boolean {
    if (!filter) return true;
    
    for (const [key, value] of Object.entries(filter)) {
      const docValue = this.getFieldValue(doc, key);
      
      if (value && typeof value === 'object') {
        // Handle operators like $in, $lt, etc.
        if ('$in' in value) {
          const inValues = ((value as any).$in as any[]).map(v => v.toString());
          if (!inValues.includes(docValue?.toString())) {
            return false;
          }
        } else if ('$lt' in value) {
          if (!(docValue < (value as any).$lt)) return false;
        } else if (value instanceof ObjectId) {
          if (docValue?.toString() !== value.toString()) return false;
        } else {
          // Nested object match
          if (JSON.stringify(docValue) !== JSON.stringify(value)) return false;
        }
      } else {
        if (docValue?.toString() !== value?.toString()) return false;
      }
    }
    
    return true;
  }

  private getFieldValue(doc: any, fieldPath: string): any {
    const parts = fieldPath.split('.');
    let value = doc;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }
}

/**
 * Create mock collections mimicking MongoDB database.
 */
export function createMockDatabase(): { collection: <T>(name: string) => MockCollection<T> } {
  const collections = new Map<string, MockCollection<any>>();
  
  return {
    collection: <T>(name: string) => {
      if (!collections.has(name)) {
        collections.set(name, new MockCollection<T>());
      }
      return collections.get(name)! as MockCollection<T>;
    },
  };
}
