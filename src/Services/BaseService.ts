import Knex from 'knex';

export interface PaginationOptions {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filter?: { column: string; value: string };
}

interface BaseEntity {
    id: string | number;
}

export default class BaseService<T extends BaseEntity> {
    protected tableName: string;
    protected knex: Knex.Knex;

    constructor(knex: Knex.Knex, tableName: string) {
        this.knex = knex;
        this.tableName = tableName;
    }

    async find(id: string | number): Promise<T | undefined> {
        const result = await this.knex<T>(this.tableName).where('id', id).first();
        return result as T | undefined;
    }

    async findAll(options: PaginationOptions = {}): Promise<{ data: T[]; hasNext: boolean }> {
        const { limit = 100, offset = 0, sortBy = 'id', sortOrder = 'asc', filter } = options;

        const query = this.knex<T>(this.tableName)
            .select('*')
            .limit(limit)
            .offset(offset)
            .orderBy(sortBy, sortOrder);

        // Apply filter if filter column and value are provided
        if (filter?.column && filter.value !== undefined) {
            query.where(filter.column, filter.value);
        }

        const data = (await query) as T[];

        // Get the total number of items (considering the filter) for pagination
        const totalItemsQuery = this.knex(this.tableName).count('* as count');
        if (filter && filter.column && filter.value !== undefined) {
            totalItemsQuery.where(filter.column, filter.value);
        }
        const totalItemsResult = await totalItemsQuery.first();
        const totalItems = parseInt(totalItemsResult?.count as string, 10) || 0;
        const hasNext = totalItems > offset + data.length;

        return { data, hasNext };
    }

    async create(data: Partial<T>): Promise<string | number> {
        const [id] = await this.knex(this.tableName).insert(data).returning('id');
        return id.id;
    }

    async update(id: string | number, data: Partial<T>): Promise<number> {
        return await this.knex(this.tableName).where({ id }).update(data);
    }

    async delete(id: string | number): Promise<number> {
        return await this.knex(this.tableName).where({ id }).delete();
    }

    async clearAll(): Promise<void> {
        return await this.knex(this.tableName).del();
    }
}
