import { Module } from "@nestjs/common";
import { BackupModule } from "./backup/backup.module";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { MonitoringModule } from "./monitoring/monitoring.module";
import { ConfigurationModule } from "./configuration/configuration.module";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ScheduleModule.forRoot(),
    BackupModule,
    DatabaseModule,
    MonitoringModule,
    ConfigurationModule,
  ],
})
export class AppModule {}
