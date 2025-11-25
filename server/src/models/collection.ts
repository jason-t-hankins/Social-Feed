import { Document, Filter, ObjectId, WithId, InsertOneResult, InsertManyResult, DeleteResult } from 'mongodb';

/**
 * Common collection interface that works with both real MongoDB and mock collections.
 * This abstraction allows the server to work in development without MongoDB.
 */
export interface CollectionLike<T> {
  insertOne(doc: any): Promise<InsertOneResult<any>>;
  insertMany(docs: any[]): Promise<InsertManyResult<any>>;
  findOne(filter?: any): Promise<T | null>;
  find(filter?: any): { 
    toArray(): Promise<T[]>; 
    sort(spec: any): any; 
    limit(n: number): any; 
  };
  countDocuments(): Promise<number>;
  deleteOne(filter: any): Promise<DeleteResult>;
  aggregate(pipeline: Document[]): { toArray(): Promise<Document[]> };
}
