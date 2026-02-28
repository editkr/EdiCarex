import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const helmet = require('helmet');
    app.use(helmet());

    const logger = new Logger('Bootstrap');

    // Increase body limit for Base64 uploads
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // CORS configuration
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
    });

    // Handle static files (for uploads)
    const express = require('express');
    app.use('/uploads', express.static(join(process.cwd(), 'public/uploads')));

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Swagger documentation
    const config = new DocumentBuilder()
        .setTitle('EdiCarex Enterprise API')
        .setDescription('Comprehensive Hospital Management System API by EdiCarex')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Authentication', 'User authentication and authorization')
        .addTag('Users', 'User management')
        .addTag('Patients', 'Patient management')
        .addTag('Doctors', 'Doctor management')
        .addTag('Appointments', 'Appointment scheduling and management')
        .addTag('Pharmacy', 'Pharmacy and medication management')
        .addTag('Laboratory', 'Laboratory orders and results')
        .addTag('Billing', 'Invoicing and payments')
        .addTag('Notifications', 'Notification management')
        .addTag('Attendance', 'Staff attendance tracking')
        .addTag('Reports', 'Reports and analytics')
        .addTag('AI', 'AI-powered features')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'EdiCarex API Docs',
        customCss: '.swagger-ui .topbar { display: none }',
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
    logger.log(`🏥 EdiCarex Enterprise Backend Started Successfully`);
}

bootstrap();
