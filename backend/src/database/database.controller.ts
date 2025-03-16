import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { DatabaseService, DatabaseInfo } from "./database.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

interface ConnectionTestDto {
  host: string;
  port: number;
  user: string;
  password: string;
  dbName: string;
}

@ApiTags("database")
@Controller("database")
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get("info/:host/:port/:user/:password/:dbName")
  @ApiOperation({ summary: "Get database information" })
  @ApiResponse({ status: 200, description: "Returns database information" })
  async getDatabaseInfo(
    @Param("host") host: string,
    @Param("port") port: number,
    @Param("user") user: string,
    @Param("password") password: string,
    @Param("dbName") dbName: string
  ): Promise<DatabaseInfo> {
    return this.databaseService.getDatabaseInfo(
      host,
      port,
      user,
      password,
      dbName
    );
  }

  @Post("test-connection")
  @ApiOperation({ summary: "Test database connection" })
  @ApiResponse({ status: 200, description: "Returns connection test result" })
  async testConnection(
    @Body() connectionData: ConnectionTestDto
  ): Promise<{ success: boolean }> {
    return this.databaseService
      .testConnection(
        connectionData.host,
        connectionData.port,
        connectionData.user,
        connectionData.password,
        connectionData.dbName
      )
      .then((success) => ({ success }));
  }
}
