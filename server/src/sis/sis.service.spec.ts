import { Test, TestingModule } from '@nestjs/testing';
import { SisService } from './sis.service';

describe('SisService', () => {
  let service: SisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SisService],
    }).compile();

    service = module.get<SisService>(SisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
