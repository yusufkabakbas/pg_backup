import { Controller, Get, Param, Post, Body, Query } from "@nestjs/common";
import {
  MonitoringService,
  SystemResources,
  BackupStatus,
} from "./monitoring.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("monitoring")
@Controller("monitoring")
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get("system")
  @ApiOperation({ summary: "Get system resource usage" })
  @ApiResponse({
    status: 200,
    description: "Returns system resource usage information",
  })
  async getSystemResources(): Promise<SystemResources> {
    return this.monitoringService.getSystemResources();
  }

  @Get("backups/:databaseId")
  @ApiOperation({ summary: "Get backup history for a database" })
  @ApiResponse({ status: 200, description: "Returns backup history" })
  async getBackupHistory(
    @Param("databaseId") databaseId: string
  ): Promise<any[]> {
    return this.monitoringService.getBackupHistory(databaseId);
  }

  @Get("logs")
  @ApiOperation({ summary: "Get pgBackRest logs" })
  @ApiResponse({ status: 200, description: "Returns pgBackRest logs" })
  async getLogs(@Query("lines") lines: number = 100): Promise<string> {
    return this.monitoringService.getLogs(lines);
  }

  @Post("check/:databaseId")
  @ApiOperation({ summary: "Run a stanza check" })
  @ApiResponse({ status: 200, description: "Returns stanza check results" })
  async runStanzaCheck(
    @Param("databaseId") databaseId: string
  ): Promise<string> {
    return this.monitoringService.runStanzaCheck(databaseId);
  }

  @Get("status/:databaseId")
  @ApiOperation({ summary: "Get backup status for a database" })
  @ApiResponse({
    status: 200,
    description: "Returns backup status information",
  })
  async getBackupStatus(
    @Param("databaseId") databaseId: string
  ): Promise<BackupStatus> {
    return this.monitoringService.getBackupStatus(databaseId);
  }
}
