import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { EstablishmentService } from './services/establishment.service';

@Global()
@Module({
    providers: [EncryptionService, EstablishmentService],
    exports: [EncryptionService, EstablishmentService],
})
export class CommonModule { }
