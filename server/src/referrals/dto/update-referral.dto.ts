import { PartialType } from '@nestjs/swagger';
import { CreateReferralDto } from './create-referral.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateReferralDto extends PartialType(CreateReferralDto) {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    counterReferralNote?: string;
}
