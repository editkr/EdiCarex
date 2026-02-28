import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EstablishmentService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        await this.initializeConfig();
    }

    private async initializeConfig() {
        const count = await this.prisma.establishmentConfig.count();
        if (count === 0) {
            await this.prisma.establishmentConfig.create({
                data: {
                    tradingName: "Centro de Salud Jorge Chávez",
                    ipressCode: "00003308",
                    ruc: "20222371105",
                    address: "Jr. Ancash S/N, Juliaca, San Román, Puno",
                    ubigeo: "211101",
                    latitude: -15.48032349,
                    longitude: -70.13931455,
                    altitude: 3882,
                    phone: "951515888",
                    email: "esjorgechavez@gmail.com",
                    operatingHours: "07:00 a 19:00",
                    dependency: "DIRESA Puno",
                    red: "San Román",
                    microred: "Santa Adriana",
                    category: "I-3",
                    isInternment: false,
                    activityStart: new Date("1990-11-08T00:00:00Z"),
                    resolution: "R.D.R. 0964-09/DRS-PUNO-DEA-PER"
                }
            });
            console.log('ESTABLISHMENT: Initialized official config for Centro de Salud Jorge Chávez (IPRESS 00003308)');
        }
    }

    async getConfig() {
        return this.prisma.establishmentConfig.findFirst();
    }

    async updateConfig(data: any) {
        const config = await this.getConfig();
        if (config) {
            return this.prisma.establishmentConfig.update({
                where: { id: config.id },
                data
            });
        }
    }
}
