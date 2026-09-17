'use server';

import { getDatabaseService } from './database-tools.loader';

export async function getTableDetailsAction(
  tableName: string,
  schema = 'public',
) {
  try {
    const tableInfo = await getDatabaseService().getTableInfo({
      schema,
      tableName,
    });

    return {
      success: true,
      data: tableInfo,
    };
  } catch (error) {
    console.error('Error fetching table info:', error);

    return {
      success: false,
      error: `Failed to fetch table information: ${(error as Error).message}`,
    };
  }
}
