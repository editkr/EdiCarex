import { IsString, IsNotEmpty, IsInt, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHisDto {
    @ApiProperty()
    @IsDateString()
    @IsNotEmpty()
    attentionDate: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    patientId?: string;

    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    age: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    gender: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    ubigeo: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    diagnosis: string; // CIE-10

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    conditionType: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fundingType: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    serviceType: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    staffId: string;
}
