import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

export interface PgBackRestConfig {
  global: Record<string, any>;
  stanzas: Record<string, Record<string, any>>;
}

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);
  private readonly configPath = "/app/config/pgbackrest.conf";

  async getConfig(): Promise<PgBackRestConfig> {
    try {
      const content = await readFileAsync(this.configPath, "utf8");
      return this.parseConfig(content);
    } catch (error) {
      this.logger.error(`Failed to read config: ${error.message}`);
      return { global: {}, stanzas: {} };
    }
  }

  async updateConfig(config: PgBackRestConfig): Promise<void> {
    try {
      const content = this.stringifyConfig(config);
      await writeFileAsync(this.configPath, content, "utf8");
    } catch (error) {
      this.logger.error(`Failed to write config: ${error.message}`);
      throw error;
    }
  }

  private parseConfig(content: string): PgBackRestConfig {
    const lines = content.split("\n");
    const config: PgBackRestConfig = { global: {}, stanzas: {} };

    let currentSection = "global";

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip comments and empty lines
      if (trimmedLine.startsWith("#") || trimmedLine === "") {
        continue;
      }

      // Check if this is a section header
      if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
        currentSection = trimmedLine.substring(1, trimmedLine.length - 1);
        if (currentSection !== "global") {
          config.stanzas[currentSection] = {};
        }
        continue;
      }

      // Parse key-value pairs
      const parts = trimmedLine.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim();

        if (currentSection === "global") {
          config.global[key] = value;
        } else {
          config.stanzas[currentSection][key] = value;
        }
      }
    }

    return config;
  }

  private stringifyConfig(config: PgBackRestConfig): string {
    let content = "[global]\n";

    // Add global settings
    for (const [key, value] of Object.entries(config.global)) {
      content += `${key}=${value}\n`;
    }

    // Add stanza settings
    for (const [stanza, settings] of Object.entries(config.stanzas)) {
      content += `\n[${stanza}]\n`;
      for (const [key, value] of Object.entries(settings)) {
        content += `${key}=${value}\n`;
      }
    }

    return content;
  }

  async getCronConfig(): Promise<string> {
    try {
      return await readFileAsync("/app/config/crontab", "utf8");
    } catch (error) {
      this.logger.error(`Failed to read cron config: ${error.message}`);
      return "";
    }
  }

  async updateCronConfig(content: string): Promise<void> {
    try {
      await writeFileAsync("/app/config/crontab", content, "utf8");
    } catch (error) {
      this.logger.error(`Failed to write cron config: ${error.message}`);
      throw error;
    }
  }
}
