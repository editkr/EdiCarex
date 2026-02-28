import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEpidemiologyDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    disease: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    caseType: string; // SUSPECTED, PROBABLE, CONFIRMED

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    patientId: string;

    @ApiProperty()
    @IsDateString()
    @IsNotEmpty()
    symptomsDate: Date;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    notifier: string;
}
