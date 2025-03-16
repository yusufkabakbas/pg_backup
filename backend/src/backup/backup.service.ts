import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { exec } from "child_process";
import { promisify } from "util";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);

export interface BackupConfig {
  type: "full" | "incr" | "diff";
  schedule: string;
  retention: number;
  enabled: boolean;
}

export interface DatabaseConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  password: string;
  backupConfigs: BackupConfig[];
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private databases: DatabaseConfig[] = [];
  private readonly pgbackrestExecutable: string;

  constructor(private configService: ConfigService) {
    // Load initial configuration
    this.loadConfiguration();

    // Get pgbackrest executable path from config
    this.pgbackrestExecutable = this.configService.get<string>(
      "PGBACKREST_EXECUTABLE",
      "/app/backend/scripts/pgbackrest.sh"
    );

    this.logger.log(
      `Using pgBackRest executable: ${this.pgbackrestExecutable}`
    );
  }

  private loadConfiguration() {
    // In a real app, this would load from a config file or database
    this.databases = [
      {
        id: "main",
        name: "postgres",
        host: "postgres",
        port: 5432,
        user: "postgres",
        password: "postgres",
        backupConfigs: [
          {
            type: "full",
            schedule: "0 1,13 * * *",
            retention: 7,
            enabled: true,
          },
          {
            type: "incr",
            schedule: "0 * * * *",
            retention: 24,
            enabled: true,
          },
        ],
      },
    ];
  }

  getDatabases(): DatabaseConfig[] {
    return this.databases;
  }

  async addDatabase(config: DatabaseConfig): Promise<DatabaseConfig> {
    this.databases.push(config);
    return config;
  }

  async updateDatabase(
    id: string,
    config: Partial<DatabaseConfig>
  ): Promise<DatabaseConfig> {
    const index = this.databases.findIndex((db) => db.id === id);
    if (index === -1) {
      throw new Error(`Database with ID ${id} not found`);
    }

    this.databases[index] = { ...this.databases[index], ...config };
    return this.databases[index];
  }

  async removeDatabase(id: string): Promise<void> {
    const index = this.databases.findIndex((db) => db.id === id);
    if (index === -1) {
      throw new Error(`Database with ID ${id} not found`);
    }

    this.databases.splice(index, 1);
  }

  async runBackup(
    databaseId: string,
    type: "full" | "incr" | "diff"
  ): Promise<string> {
    try {
      const command = `${this.pgbackrestExecutable} --stanza=${databaseId} backup --type=${type}`;
      this.logger.log(`Executing backup command: ${command}`);

      const { stdout, stderr } = await execAsync(command);
      this.logger.log(`Backup completed: ${stdout}`);
      if (stderr) {
        this.logger.error(`Backup stderr: ${stderr}`);
      }
      return stdout;
    } catch (error) {
      this.logger.error(`Backup failed: ${error.message}`);
      throw error;
    }
  }

  async runCleanup(databaseId: string): Promise<string> {
    try {
      const command = `${this.pgbackrestExecutable} --stanza=${databaseId} expire`;
      this.logger.log(`Executing cleanup command: ${command}`);

      const { stdout, stderr } = await execAsync(command);
      this.logger.log(`Cleanup completed: ${stdout}`);
      if (stderr) {
        this.logger.error(`Cleanup stderr: ${stderr}`);
      }
      return stdout;
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`);
      throw error;
    }
  }

  async getBackupInfo(databaseId: string): Promise<string> {
    try {
      const command = `${this.pgbackrestExecutable} info --stanza=${databaseId}`;
      this.logger.log(`Executing info command: ${command}`);

      const { stdout } = await execAsync(command);
      return stdout;
    } catch (error) {
      this.logger.error(`Failed to get backup info: ${error.message}`);
      throw error;
    }
  }

  @Cron("0 1,13 * * *")
  async handleFullBackup() {
    for (const db of this.databases) {
      const fullBackupConfig = db.backupConfigs.find(
        (config) => config.type === "full" && config.enabled
      );

      if (fullBackupConfig) {
        this.logger.log(`Running scheduled full backup for ${db.name}`);
        try {
          await this.runBackup(db.id, "full");
        } catch (error) {
          this.logger.error(`Scheduled full backup failed: ${error.message}`);
        }
      }
    }
  }

  @Cron("0 * * * *")
  async handleIncrementalBackup() {
    for (const db of this.databases) {
      const incrBackupConfig = db.backupConfigs.find(
        (config) => config.type === "incr" && config.enabled
      );

      if (incrBackupConfig) {
        this.logger.log(`Running scheduled incremental backup for ${db.name}`);
        try {
          await this.runBackup(db.id, "incr");
        } catch (error) {
          this.logger.error(
            `Scheduled incremental backup failed: ${error.message}`
          );
        }
      }
    }
  }

  @Cron("0 3 * * *")
  async handleCleanup() {
    for (const db of this.databases) {
      this.logger.log(`Running scheduled cleanup for ${db.name}`);
      try {
        await this.runCleanup(db.id);
      } catch (error) {
        this.logger.error(`Scheduled cleanup failed: ${error.message}`);
      }
    }
  }
}
