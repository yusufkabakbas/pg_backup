import { Controller, Get, Put, Body } from "@nestjs/common";
import {
  ConfigurationService,
  PgBackRestConfig,
} from "./configuration.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("configuration")
@Controller("configuration")
export class ConfigurationController {
  constructor(private readonly configService: ConfigurationService) {}

  @Get("pgbackrest")
  @ApiOperation({ summary: "Get pgBackRest configuration" })
  @ApiResponse({
    status: 200,
    description: "Returns the pgBackRest configuration",
  })
  async getConfig(): Promise<PgBackRestConfig> {
    return this.configService.getConfig();
  }

  @Put("pgbackrest")
  @ApiOperation({ summary: "Update pgBackRest configuration" })
  @ApiResponse({
    status: 200,
    description: "Configuration updated successfully",
  })
  async updateConfig(@Body() config: PgBackRestConfig) {
    await this.configService.updateConfig(config);
    return { success: true };
  }

  @Get("cron")
  @ApiOperation({ summary: "Get cron configuration" })
  @ApiResponse({ status: 200, description: "Returns the cron configuration" })
  async getCronConfig(): Promise<string> {
    return this.configService.getCronConfig();
  }

  @Put("cron")
  @ApiOperation({ summary: "Update cron configuration" })
  @ApiResponse({
    status: 200,
    description: "Cron configuration updated successfully",
  })
  async updateCronConfig(@Body() data: { content: string }) {
    await this.configService.updateCronConfig(data.content);
    return { success: true };
  }
}
