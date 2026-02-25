import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
    imports: [HttpModule, ConfigModule, AuthModule, AdminModule],
    controllers: [AiController],
    providers: [AiService],
    exports: [AiService],
})
export class AiModule { }
