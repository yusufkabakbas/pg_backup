import { Injectable, Logger } from "@nestjs/common";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { ConfigService } from "@nestjs/config";

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);

export interface SystemResources {
  cpu: number;
  memory: {
    total: string;
    used: string;
    free: string;
    usedPercent: number;
  };
  disk: {
    total: string;
    used: string;
    free: string;
    usedPercent: number;
  };
}

export interface BackupStatus {
  lastBackupTime: string;
  lastBackupType: string;
  lastBackupSize: string;
  lastBackupDuration: string;
  backupCount: number;
  status: "success" | "failed" | "running" | "none";
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly pgbackrestExecutable: string;
  private readonly pgbackrestLogsPath: string;

  constructor(private configService: ConfigService) {
    // Get pgbackrest executable path from config
    this.pgbackrestExecutable = this.configService.get<string>(
      "PGBACKREST_EXECUTABLE",
      "/app/backend/scripts/pgbackrest.sh"
    );

    // Get logs path
    this.pgbackrestLogsPath = this.configService.get<string>(
      "PGBACKREST_LOGS_PATH",
      "/var/log/pgbackrest/pgbackrest.log"
    );

    this.logger.log(
      `Using pgBackRest executable: ${this.pgbackrestExecutable}`
    );
    this.logger.log(`Using pgBackRest logs path: ${this.pgbackrestLogsPath}`);
  }

  async getSystemResources(): Promise<SystemResources> {
    try {
      // Use direct system commands to get resource info
      // These commands run in the backend container

      // Get CPU usage
      const { stdout: cpuOutput } = await execAsync(
        "top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'"
      );
      const cpuUsage = parseFloat(cpuOutput.trim());

      // Get memory usage
      const { stdout: memOutput } = await execAsync("free -m");
      const memLines = memOutput.split("\n");
      const memInfo = memLines[1].split(/\s+/);
      const totalMem = `${memInfo[1]}MB`;
      const usedMem = `${memInfo[2]}MB`;
      const freeMem = `${memInfo[3]}MB`;
      const memUsagePercent =
        (parseInt(memInfo[2]) / parseInt(memInfo[1])) * 100;

      // Get disk usage
      const { stdout: diskOutput } = await execAsync(
        "df -h /var/lib/pgbackrest"
      );
      const diskLines = diskOutput.split("\n");
      const diskInfo = diskLines[1].split(/\s+/);
      const totalDisk = diskInfo[1];
      const usedDisk = diskInfo[2];
      const freeDisk = diskInfo[3];
      const diskUsagePercent = parseInt(diskInfo[4].replace("%", ""));

      return {
        cpu: cpuUsage,
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          usedPercent: memUsagePercent,
        },
        disk: {
          total: totalDisk,
          used: usedDisk,
          free: freeDisk,
          usedPercent: diskUsagePercent,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get system resources: ${error.message}`);
      throw error;
    }
  }

  async getBackupHistory(databaseId: string): Promise<any[]> {
    try {
      // Use pgbackrest script to get backup info
      const command = `${this.pgbackrestExecutable} info --stanza=${databaseId}`;
      this.logger.log(`Executing info command: ${command}`);

      // Get backup info
      const { stdout } = await execAsync(command);

      // Parse the backup info to extract history
      const backups = [];
      const lines = stdout.split("\n");
      let currentBackup = null;

      for (const line of lines) {
        if (line.includes("backup:")) {
          if (currentBackup) {
            backups.push(currentBackup);
          }

          const match = line.match(/backup:(\S+)/);
          if (match) {
            currentBackup = {
              id: match[1],
              type: "",
              timestamp: "",
              size: "",
              duration: "",
            };
          }
        } else if (currentBackup) {
          if (line.includes("type:")) {
            currentBackup.type = line.split(":")[1].trim();
          } else if (line.includes("timestamp start:")) {
            currentBackup.timestamp = line.split(":")[1].trim();
          } else if (line.includes("size:")) {
            currentBackup.size = line.split(":")[1].trim();
          } else if (line.includes("time:")) {
            currentBackup.duration = line.split(":")[1].trim();
          }
        }
      }

      if (currentBackup) {
        backups.push(currentBackup);
      }

      return backups;
    } catch (error) {
      this.logger.error(`Failed to get backup history: ${error.message}`);
      throw error;
    }
  }

  async getLogs(lines: number = 100): Promise<string> {
    try {
      // Direct access to log file via mounted volume
      const { stdout } = await execAsync(
        `tail -n ${lines} ${this.pgbackrestLogsPath}`
      );
      return stdout;
    } catch (error) {
      this.logger.error(`Failed to get logs: ${error.message}`);
      throw error;
    }
  }

  async runStanzaCheck(databaseId: string): Promise<string> {
    try {
      const command = `${this.pgbackrestExecutable} --stanza=${databaseId} check`;
      this.logger.log(`Executing stanza check command: ${command}`);

      const { stdout } = await execAsync(command);
      return stdout;
    } catch (error) {
      this.logger.error(`Failed to run stanza check: ${error.message}`);
      throw error;
    }
  }

  async getBackupStatus(databaseId: string): Promise<BackupStatus> {
    try {
      // Get backup info
      const command = `${this.pgbackrestExecutable} info --stanza=${databaseId}`;
      const { stdout } = await execAsync(command);

      // Check if backup is running by looking for processes
      const { stdout: psOutput } = await execAsync(
        "ps aux | grep pgbackrest | grep -v grep"
      );
      const isRunning =
        psOutput.includes(`--stanza=${databaseId}`) &&
        psOutput.includes("backup");

      // Parse the backup info
      const lines = stdout.split("\n");
      let lastBackupTime = "";
      let lastBackupType = "";
      let lastBackupSize = "";
      let lastBackupDuration = "";
      let backupCount = 0;

      for (const line of lines) {
        if (line.includes("backup:")) {
          backupCount++;

          if (backupCount === 1) {
            // Most recent backup
            const nextLines = lines.slice(
              lines.indexOf(line) + 1,
              lines.indexOf(line) + 10
            );

            for (const nextLine of nextLines) {
              if (nextLine.includes("type:")) {
                lastBackupType = nextLine.split(":")[1].trim();
              } else if (nextLine.includes("timestamp start:")) {
                lastBackupTime = nextLine.split(":")[1].trim();
              } else if (nextLine.includes("size:")) {
                lastBackupSize = nextLine.split(":")[1].trim();
              } else if (nextLine.includes("time:")) {
                lastBackupDuration = nextLine.split(":")[1].trim();
              }
            }
          }
        }
      }

      return {
        lastBackupTime,
        lastBackupType,
        lastBackupSize,
        lastBackupDuration,
        backupCount,
        status: isRunning ? "running" : backupCount > 0 ? "success" : "none",
      };
    } catch (error) {
      this.logger.error(`Failed to get backup status: ${error.message}`);
      return {
        lastBackupTime: "",
        lastBackupType: "",
        lastBackupSize: "",
        lastBackupDuration: "",
        backupCount: 0,
        status: "failed",
      };
    }
  }
}
