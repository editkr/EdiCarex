import { IsString, IsNotEmpty, IsOptional, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReferralDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    patientId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    destinationIpress: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    diagnosis: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    urgencyLevel: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    referredBy: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    vitalSigns?: Record<string, any>;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    previousTreatment?: string;
}
