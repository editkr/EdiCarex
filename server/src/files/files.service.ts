import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FilesService {
    private readonly uploadPath = join(process.cwd(), 'public', 'uploads', 'laboratory');

    constructor() {
        this.ensureUploadDirExists();
    }

    private ensureUploadDirExists() {
        if (!existsSync(this.uploadPath)) {
            mkdirSync(this.uploadPath, { recursive: true });
        }
    }

    async handleFileUpload(file: Express.Multer.File) {
        if (!file) {
            throw new Error('No file provided');
        }

        // Determine the folder based on the destination path
        // Default to laboratory if detection fails (backward compatibility)
        let folder = 'laboratory';
        if (file.destination.includes('general')) {
            folder = 'general';
        } else if (file.destination.includes('laboratory')) {
            folder = 'laboratory';
        }

        // Return the relative URL for frontend access
        return {
            fileName: file.filename,
            originalName: file.originalname,
            url: `/uploads/${folder}/${file.filename}`,
            size: file.size,
            mimetype: file.mimetype,
        };
    }
}
