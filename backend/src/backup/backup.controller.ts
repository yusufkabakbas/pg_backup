import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { BackupService, DatabaseConfig } from "./backup.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

@ApiTags("backup")
@Controller("backup")
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly configService: ConfigService
  ) {}

  @Get("databases")
  @ApiOperation({ summary: "Get all configured databases" })
  @ApiResponse({ status: 200, description: "Returns all configured databases" })
  getDatabases() {
    return this.backupService.getDatabases();
  }

  @Post("databases")
  @ApiOperation({ summary: "Add a new database configuration" })
  @ApiResponse({
    status: 201,
    description: "Database configuration added successfully",
  })
  addDatabase(@Body() config: DatabaseConfig) {
    return this.backupService.addDatabase(config);
  }

  @Put("databases/:id")
  @ApiOperation({ summary: "Update a database configuration" })
  @ApiResponse({
    status: 200,
    description: "Database configuration updated successfully",
  })
  updateDatabase(
    @Param("id") id: string,
    @Body() config: Partial<DatabaseConfig>
  ) {
    return this.backupService.updateDatabase(id, config);
  }

  @Delete("databases/:id")
  @ApiOperation({ summary: "Remove a database configuration" })
  @ApiResponse({
    status: 200,
    description: "Database configuration removed successfully",
  })
  removeDatabase(@Param("id") id: string) {
    return this.backupService.removeDatabase(id);
  }

  @Post("run/:databaseId/:type")
  @ApiOperation({ summary: "Run a backup manually" })
  @ApiResponse({ status: 200, description: "Backup started successfully" })
  runBackup(
    @Param("databaseId") databaseId: string,
    @Param("type") type: "full" | "incr" | "diff"
  ) {
    return this.backupService.runBackup(databaseId, type);
  }

  @Post("cleanup/:databaseId")
  @ApiOperation({ summary: "Run cleanup manually" })
  @ApiResponse({ status: 200, description: "Cleanup started successfully" })
  runCleanup(@Param("databaseId") databaseId: string) {
    return this.backupService.runCleanup(databaseId);
  }

  @Get("info/:databaseId")
  @ApiOperation({ summary: "Get backup information" })
  @ApiResponse({ status: 200, description: "Returns backup information" })
  async getBackupInfo(
    @Param("databaseId") databaseId: string
  ): Promise<string> {
    try {
      try {
        return await this.backupService.getBackupInfo(databaseId);
      } catch (serviceError) {
        // Service'te bir hata olursa doğrudan Docker ile dene
        const pgbackrestContainer = this.configService.get<string>(
          "PGBACKREST_CONTAINER",
          "pgbackrest"
        );

        const command = `docker exec ${pgbackrestContainer} pgbackrest info --stanza=${databaseId}`;

        const { stdout, stderr } = await execAsync(command);

        if (stderr && !stdout) {
          throw new InternalServerErrorException(
            `Error getting backup info: ${stderr}`
          );
        }

        return stdout;
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get backup info: ${error.message}`
      );
    }
  }
}
