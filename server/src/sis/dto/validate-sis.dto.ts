import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateSisDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    documentNumber: string;
}
