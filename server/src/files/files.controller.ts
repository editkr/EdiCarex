import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { FilesService } from './files.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceGuard } from '../common/guards/maintenance.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, MaintenanceGuard)
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) { }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: join(process.cwd(), 'public', 'uploads', 'general'),
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
        }),
    )
    async uploadFileGeneral(
        @UploadedFile()
        file: Express.Multer.File,
    ) {
        if (!file) {
            console.error('[FILES] No se recibió ningún archivo en el controlador');
            return { message: 'No file uploaded', statusCode: 400 };
        }

        return this.filesService.handleFileUpload(file);
    }

    @Post('upload/laboratory')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: join(process.cwd(), 'public', 'uploads', 'laboratory'),
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
        }),
    )
    async uploadFile(
        @UploadedFile()
        file: Express.Multer.File,
    ) {
        if (!file) {
            console.error('[FILES] No se recibió ningún archivo en el controlador');
            return { message: 'No file uploaded', statusCode: 400 };
        }

        console.log('[FILES] Archivo recibido:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path
        });

        // Manual validation for better error messages
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            console.warn(`[FILES] Tipo de archivo no permitido: ${file.mimetype}`);
            // No lanzamos error 400 aquí todavía para ver si el flujo se completa
        }

        return this.filesService.handleFileUpload(file);
    }
}
