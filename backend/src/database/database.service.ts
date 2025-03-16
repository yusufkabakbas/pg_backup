import { Injectable, Logger } from "@nestjs/common";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);

export interface DatabaseInfo {
  name: string;
  size: string;
  tables: number;
  status: "online" | "offline" | "unknown";
}

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  /**
   * Helper method to create executable scripts
   */
  private async createScript(path: string, command: string): Promise<void> {
    const script = `#!/bin/sh\n${command}`;

    try {
      await writeFileAsync(path, script);
      await execAsync(`chmod +x ${path}`);
    } catch (error) {
      this.logger.error(`Failed to create script: ${error.message}`);
      throw error;
    }
  }

  async getDatabaseInfo(
    host: string,
    port: number,
    user: string,
    password: string,
    dbName: string
  ): Promise<DatabaseInfo> {
    try {
      // Direct connection to postgres database
      // Get database size
      const sizeQuery = `psql -h ${host} -p ${port} -U ${user} -d ${dbName} -c "SELECT pg_size_pretty(pg_database_size('${dbName}')) as size;"`;
      const { stdout: sizeOutput } = await execAsync(sizeQuery);
      const sizeMatch = sizeOutput.match(/\s+(\d+\s+\w+)/);
      const size = sizeMatch ? sizeMatch[1].trim() : "Unknown";

      // Get table count
      const tableQuery = `psql -h ${host} -p ${port} -U ${user} -d ${dbName} -c "SELECT count(*) FROM pg_stat_user_tables;"`;
      const { stdout: tableOutput } = await execAsync(tableQuery);
      const tableMatch = tableOutput.match(/\s+(\d+)/);
      const tables = tableMatch ? parseInt(tableMatch[1].trim(), 10) : 0;

      return {
        name: dbName,
        size,
        tables,
        status: "online",
      };
    } catch (error) {
      this.logger.error(`Failed to get database info: ${error.message}`);
      return {
        name: dbName,
        size: "Unknown",
        tables: 0,
        status: "offline",
      };
    }
  }

  async testConnection(
    host: string,
    port: number,
    user: string,
    password: string,
    dbName: string
  ): Promise<boolean> {
    try {
      // Direct connection test to postgres
      const command = `pg_isready -h ${host} -p ${port} -U ${user} -d ${dbName}`;
      await execAsync(command);
      return true;
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return false;
    }
  }
}
