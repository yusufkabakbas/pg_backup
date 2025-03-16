import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe());

  // Get environment variables
  const port = configService.get<number>("PORT", 3000);
  const nodeEnv = configService.get<string>("NODE_ENV", "development");
  const allowedOrigins = configService
    .get<string>("ALLOWED_ORIGINS", "http://localhost")
    .split(",");

  // Enable CORS with configuration from environment variables
  app.enableCors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: "Origin,X-Requested-With,Content-Type,Accept,Authorization",
  });

  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("PostgreSQL Backup Manager API")
    .setDescription("API for managing PostgreSQL backups with pgBackRest")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(port);
  console.log(
    `Application is running in ${nodeEnv} mode on: ${await app.getUrl()}`
  );
}

bootstrap();
